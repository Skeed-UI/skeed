import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { loadArchetypes } from '@skeed/archetypes-loader';
import { loadDemographics } from '@skeed/demographics-loader';
import Database from 'better-sqlite3';
import { applyMigrations, discoverMigrations } from './migrate.js';

export interface BuildIndexOptions {
  /** Absolute path to repo `data/` directory. */
  dataRoot: string;
  /** Absolute path to write the SQLite file to. Overwritten if it exists. */
  outPath: string;
  /** Absolute path to the migrations directory. */
  migrationsDir: string;
  /** Registry version this index represents. */
  registryVersion: string;
  /** Embedding model id pinned for this build (placeholder until v0.2). */
  embeddingModel?: string;
  /** Git commit hash of the build, optional. */
  commit?: string;
  /** When true, deletes any existing file at `outPath` first. */
  clean?: boolean;
}

export interface BuildIndexResult {
  outPath: string;
  registryVersion: string;
  demographicsIndexed: number;
  archetypesIndexed: number;
  componentsIndexed: number;
  contextDocumentsIndexed: number;
  contextEmbeddingsIndexed: number;
  logoPrimitivesIndexed: number;
  durationMs: number;
}

export async function buildIndex(opts: BuildIndexOptions): Promise<BuildIndexResult> {
  const t0 = performance.now();
  await mkdir(dirname(opts.outPath), { recursive: true });
  if (opts.clean) {
    await rm(opts.outPath, { force: true });
  }

  const db = new Database(opts.outPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const migrations = await discoverMigrations(opts.migrationsDir);
  applyMigrations(db, migrations);

  // Indexer is lenient: stub demographics (those with `_TODO` markers) fail validation
  // and are silently skipped. lint:data is the strict gate; the indexer just indexes
  // whatever validates so local development with WIP demographics still produces a usable DB.
  const demos = await loadDemographics({
    dataRoot: join(opts.dataRoot, 'demographics'),
  });
  const arch = await loadArchetypes({
    dataRoot: join(opts.dataRoot, 'archetypes'),
  });
  if (demos.errors.length > 0) {
    process.stderr.write(
      `indexer: skipped ${demos.errors.length} demographic(s) with validation errors (likely stubs)\n`,
    );
  }
  if (arch.errors.length > 0) {
    process.stderr.write(
      `indexer: skipped ${arch.errors.length} archetype(s) with validation errors\n`,
    );
  }
  const generatedComponents = await loadGeneratedComponents({
    dataRoot: opts.dataRoot,
    demographics: demos.demographics,
    archetypes: arch.archetypes,
    registryVersion: opts.registryVersion,
    embeddingModel: opts.embeddingModel ?? 'skeed-hash-embed-v1',
  });

  const insertDemographic = db.prepare(
    'INSERT OR REPLACE INTO demographics (id, preset_json, source_path, content_hash) VALUES (?, ?, ?, ?)',
  );
  const insertPsychology = db.prepare(
    'INSERT OR REPLACE INTO psychology_profiles (demographic_id, niche, profile_json) VALUES (?, ?, ?)',
  );
  const insertPainPoint = db.prepare(
    'INSERT OR REPLACE INTO pain_points (demographic_id, niche, point_id, point_json) VALUES (?, ?, ?, ?)',
  );
  const insertLogoPrimitive = db.prepare(
    'INSERT OR REPLACE INTO logo_primitives (id, demographic_id, kind, source_path, contents) VALUES (?, ?, ?, ?, ?)',
  );
  const insertArchetype = db.prepare(
    'INSERT OR REPLACE INTO archetypes (id, category, manifest_json, source_path, source_tsx) VALUES (?, ?, ?, ?, ?)',
  );
  const insertComponent = db.prepare(
    `INSERT OR REPLACE INTO components (
      id, archetype_id, demographic_id, density, manifest_json, source_tsx_path, thumb_path,
      category, wcag_level, age_min, age_max, cognitive_load, reduced_motion_safe, framework,
      license, attribution_source, attribution_url, content_hash, registry_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertComponentDemographic = db.prepare(
    'INSERT OR REPLACE INTO component_demographics (component_id, demographic_id, weight) VALUES (?, ?, ?)',
  );
  const insertComponentPsychologySignal = db.prepare(
    'INSERT OR REPLACE INTO component_psychology_signals (component_id, key, value) VALUES (?, ?, ?)',
  );
  const insertComponentTrustCue = db.prepare(
    'INSERT OR REPLACE INTO component_trust_cues (component_id, cue) VALUES (?, ?)',
  );
  const insertComponentAntiPattern = db.prepare(
    'INSERT OR REPLACE INTO component_anti_patterns (component_id, demographic_id) VALUES (?, ?)',
  );
  const insertComponentAssetSlot = db.prepare(
    'INSERT OR REPLACE INTO component_asset_slots (component_id, slot_role, slot_type, required) VALUES (?, ?, ?, ?)',
  );
  const insertComponentKeyword = db.prepare(
    'INSERT OR REPLACE INTO component_keywords (component_id, keyword) VALUES (?, ?)',
  );
  const insertComponentIntentPhrase = db.prepare(
    'INSERT OR REPLACE INTO component_intent_phrases (component_id, phrase, ord) VALUES (?, ?, ?)',
  );
  const insertComponentFts = db.prepare(
    `INSERT INTO component_fts (component_id, name, keywords, ai_intent_phrases, example_intents)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const insertContextDocument = db.prepare(
    `INSERT OR REPLACE INTO context_documents
      (id, subject_type, subject_id, kind, title, body, metadata_json, content_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertContextEmbedding = db.prepare(
    `INSERT OR REPLACE INTO context_embeddings
      (document_id, model, dimensions, vector_blob, source_text_hash)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const insertContextEdge = db.prepare(
    `INSERT OR REPLACE INTO context_edges
      (id, from_type, from_id, to_type, to_id, relation, weight, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertBuildMeta = db.prepare(
    'INSERT OR REPLACE INTO build_meta (registry_version, built_at, built_from_commit, embedding_model, schema_version) VALUES (?, ?, ?, ?, ?)',
  );

  let logoPrimitivesIndexed = 0;
  let contextDocumentsIndexed = 0;
  let contextEmbeddingsIndexed = 0;
  const txn = db.transaction(() => {
    db.exec(`
      DELETE FROM component_fts;
      DELETE FROM component_demographics;
      DELETE FROM component_psychology_signals;
      DELETE FROM component_trust_cues;
      DELETE FROM component_anti_patterns;
      DELETE FROM component_asset_slots;
      DELETE FROM component_keywords;
      DELETE FROM component_intent_phrases;
      DELETE FROM context_embeddings;
      DELETE FROM context_documents;
      DELETE FROM context_edges;
      DELETE FROM retrieval_explanations;
    `);
    for (const [demoId, demo] of demos.demographics) {
      const presetJson = JSON.stringify(demo.preset);
      insertDemographic.run(
        demoId,
        presetJson,
        demo.readmePath.replace(opts.dataRoot, 'data'),
        sha256(presetJson),
      );
      for (const [niche, profile] of demo.psychology) {
        insertPsychology.run(demoId, niche, JSON.stringify(profile));
      }
      for (const [niche, painFile] of demo.painPoints) {
        for (const point of painFile.points) {
          insertPainPoint.run(demoId, niche, point.id, JSON.stringify(point));
        }
      }
      for (const kind of ['shapes', 'marks', 'wordmarks', 'containers'] as const) {
        for (const prim of demo.logoPrimitives[kind]) {
          insertLogoPrimitive.run(
            prim.id,
            demoId,
            prim.kind,
            prim.filePath.replace(opts.dataRoot, 'data'),
            prim.contents,
          );
          logoPrimitivesIndexed++;
        }
      }
    }
    for (const [id, a] of arch.archetypes) {
      insertArchetype.run(
        id,
        a.manifest.category,
        JSON.stringify(a.manifest),
        a.manifestPath.replace(opts.dataRoot, 'data'),
        a.source,
      );
    }
    for (const component of generatedComponents) {
      insertComponent.run(
        component.id,
        component.manifest.archetypeId,
        component.manifest.demographicId,
        component.manifest.density,
        JSON.stringify(component.manifest),
        component.sourceTsxPath,
        component.thumbPath,
        component.manifest.category,
        component.manifest.accessibility.wcagLevel,
        component.manifest.accessibility.ageAppropriate.min,
        component.manifest.accessibility.ageAppropriate.max,
        component.manifest.accessibility.cognitiveLoad,
        component.manifest.accessibility.reducedMotionSafe ? 1 : 0,
        component.manifest.framework,
        component.manifest.license,
        component.manifest.attribution?.source ?? null,
        component.manifest.attribution?.url ?? null,
        component.manifest.contentHash,
        opts.registryVersion,
      );
      for (const demographic of component.manifest.demographics) {
        insertComponentDemographic.run(component.id, demographic.id, demographic.weight);
      }
      for (const [key, value] of Object.entries(component.manifest.psychologySignals)) {
        if (key === 'trustCues') continue;
        insertComponentPsychologySignal.run(component.id, key, String(value));
      }
      for (const cue of component.manifest.psychologySignals.trustCues) {
        insertComponentTrustCue.run(component.id, cue);
      }
      for (const antiPattern of component.manifest.antiPatterns) {
        insertComponentAntiPattern.run(component.id, antiPattern);
      }
      for (const slot of component.manifest.assetSlots) {
        insertComponentAssetSlot.run(component.id, slot.role, slot.type, slot.required ? 1 : 0);
      }
      for (const keyword of component.manifest.keywords) {
        insertComponentKeyword.run(component.id, keyword);
      }
      for (const [ord, phrase] of component.manifest.aiIntentPhrases.entries()) {
        insertComponentIntentPhrase.run(component.id, phrase, ord);
      }
      insertComponentFts.run(
        component.id,
        component.manifest.name,
        component.manifest.keywords.join(' '),
        component.manifest.aiIntentPhrases.join(' '),
        component.manifest.exampleIntents.join(' '),
      );
      for (const doc of component.contextDocuments) {
        insertContextDocument.run(
          doc.id,
          doc.subjectType,
          doc.subjectId,
          doc.kind,
          doc.title,
          doc.body,
          JSON.stringify(doc.metadata),
          sha256(doc.body),
        );
        insertContextEmbedding.run(
          doc.id,
          component.embeddingModel,
          doc.vector.length,
          encodeVector(doc.vector),
          sha256(doc.body),
        );
        contextDocumentsIndexed++;
        contextEmbeddingsIndexed++;
      }
      for (const edge of component.contextEdges) {
        insertContextEdge.run(
          edge.id,
          edge.fromType,
          edge.fromId,
          edge.toType,
          edge.toId,
          edge.relation,
          edge.weight,
          JSON.stringify(edge.metadata),
        );
      }
    }
    insertBuildMeta.run(
      opts.registryVersion,
      new Date().toISOString(),
      opts.commit ?? 'unknown',
      opts.embeddingModel ?? 'skeed-hash-embed-v1',
      Math.max(0, ...migrations.map((m) => m.version)),
    );
  });
  txn();

  const componentsIndexed = (
    db.prepare('SELECT count(*) as c FROM components').get() as { c: number }
  ).c;

  db.close();

  return {
    outPath: opts.outPath,
    registryVersion: opts.registryVersion,
    demographicsIndexed: demos.demographics.size,
    archetypesIndexed: arch.archetypes.size,
    componentsIndexed,
    contextDocumentsIndexed,
    contextEmbeddingsIndexed,
    logoPrimitivesIndexed,
    durationMs: Math.round(performance.now() - t0),
  };
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function encodeVector(vector: number[]): Buffer {
  const bytes = Buffer.alloc(vector.length);
  for (const [index, value] of vector.entries()) {
    bytes.writeInt8(Math.max(-127, Math.min(127, Math.round(value * 127))), index);
  }
  return bytes;
}

interface LoadedMapValue<T> {
  manifest?: T;
  preset?: T;
  psychology?: Map<string, unknown>;
  painPoints?: Map<string, { points: Array<{ description: string }> }>;
}

interface GeneratedComponentRow {
  id: string;
  sourceTsxPath: string;
  thumbPath: string | null;
  embeddingModel: string;
  manifest: RichIndexedManifest;
  contextDocuments: ContextDocument[];
  contextEdges: ContextEdge[];
}

interface RichIndexedManifest {
  id: string;
  name: string;
  version: string;
  schemaVersion: 1;
  category: string;
  description: string;
  archetypeId: string;
  demographicId: string;
  demographics: Array<{ id: string; weight: number }>;
  density: string;
  variant: string;
  framework: string;
  frameworks: string[];
  tags: string[];
  keywords: string[];
  aiIntentPhrases: string[];
  exampleIntents: string[];
  antiPatterns: string[];
  psychologySignals: {
    colorTemp: string;
    density: string;
    formality: number;
    motionIntensity: string;
    contrast: string;
    playfulness: number;
    trustCues: string[];
  };
  accessibility: {
    wcagLevel: string;
    ageAppropriate: { min: number; max: number };
    cognitiveLoad: string;
    reducedMotionSafe: boolean;
    screenReaderTested: boolean;
  };
  variants: Array<{
    id: string;
    label: string;
    props: Record<string, unknown>;
    preview: { thumb: string };
  }>;
  dependencies: string[];
  registryDependencies: string[];
  tokensUsed: string[];
  assetSlots: Array<{ role: string; type: string; required: boolean; fallbackHint?: string }>;
  conversionPsychology: string[];
  license: string;
  attribution?: { source: string; url?: string; author?: string };
  source: Array<{ framework: string; path: string }>;
  preview: { thumb: string; storybookUrl?: string };
  contentHash: string;
  generatedAt?: string | undefined;
  qualityTier: 'flagship' | 'generated' | 'legacy';
  primitiveStack: Array<{ library: string; primitive: string; purpose?: string }>;
  interactionContract: {
    keyboard: string[];
    pointer: string[];
    focus: string[];
    screenReader: string[];
  };
  motionContract: {
    tone: 'calm' | 'precise' | 'premium' | 'playful' | 'clinical' | 'enterprise';
    cssFirst: boolean;
    reducedMotion: string;
    continuous: boolean;
  };
  contentSlots: Array<{ name: string; type: string; required: boolean; guidance?: string }>;
  performanceBudget: {
    clientJsKb: number;
    animationRuntime: 'none' | 'css' | 'motion';
    serverComponentSafe: boolean;
  };
  agentUsage: {
    whenToUse: string[];
    whenNotToUse: string[];
    installNotes: string[];
    propExamples: Record<string, unknown>;
  };
}

interface ContextDocument {
  id: string;
  subjectType: string;
  subjectId: string;
  kind: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  vector: number[];
}

interface ContextEdge {
  id: string;
  fromType: string;
  fromId: string;
  toType: string;
  toId: string;
  relation: string;
  weight: number;
  metadata: Record<string, unknown>;
}

async function loadGeneratedComponents(opts: {
  dataRoot: string;
  demographics: Map<string, LoadedMapValue<unknown>>;
  archetypes: Map<string, LoadedMapValue<unknown>>;
  registryVersion: string;
  embeddingModel: string;
}): Promise<GeneratedComponentRow[]> {
  const componentsRoot = join(opts.dataRoot, 'components');
  if (!(await dirExists(componentsRoot))) return [];

  const manifestPaths = await findFiles(componentsRoot, 'manifest.json');
  const rows: GeneratedComponentRow[] = [];
  for (const manifestPath of manifestPaths) {
    try {
      const rawManifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<
        string,
        unknown
      >;
      const componentDir = dirname(manifestPath);
      const sourcePath = join(componentDir, 'component.tsx');
      const tokensPath = join(componentDir, 'tokens.css');
      const source = await readFile(sourcePath, 'utf8');
      const tokensCss = await readOptional(tokensPath);
      const sourceTsxPath = toDataPath(sourcePath, opts.dataRoot);
      const tokensCssPath = toDataPath(tokensPath, opts.dataRoot);
      const demographicId = String(rawManifest.demographicId ?? '').trim();
      const archetypeId = String(rawManifest.archetypeId ?? '').trim();
      const density = String(rawManifest.density ?? 'cozy').trim();
      const variant = String(rawManifest.variant ?? 'default').trim();
      const id = String(rawManifest.id || `${demographicId}/${archetypeId}/${density}/${variant}`);
      const demographic = opts.demographics.get(demographicId);
      const archetype = opts.archetypes.get(archetypeId);
      if (!demographic || !archetype) continue;

      const manifest = buildRichManifest({
        id,
        rawManifest,
        demographicId,
        demographic,
        archetypeId,
        archetype,
        density,
        variant,
        sourceTsxPath,
        tokensCssPath,
        source,
        tokensCss,
      });
      const contextDocuments = buildContextDocuments(manifest, {
        source,
        tokensCss,
        embeddingModel: opts.embeddingModel,
      });
      rows.push({
        id,
        sourceTsxPath,
        thumbPath: manifest.preview.thumb,
        embeddingModel: opts.embeddingModel,
        manifest,
        contextDocuments,
        contextEdges: buildContextEdges(manifest),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`indexer: skipped component manifest ${manifestPath}: ${message}\n`);
    }
  }
  return rows;
}

function buildRichManifest(args: {
  id: string;
  rawManifest: Record<string, unknown>;
  demographicId: string;
  demographic: LoadedMapValue<unknown>;
  archetypeId: string;
  archetype: LoadedMapValue<unknown>;
  density: string;
  variant: string;
  sourceTsxPath: string;
  tokensCssPath: string;
  source: string;
  tokensCss: string;
}): RichIndexedManifest {
  const archetypeManifest = (args.archetype.manifest ?? {}) as Record<string, unknown>;
  const preset = (args.demographic.preset ?? {}) as Record<string, unknown>;
  const aiMetadata = (archetypeManifest.aiMetadata ?? {}) as Record<string, unknown>;
  const voice = (preset.voice ?? {}) as { tone?: string[]; samples?: Record<string, string> };
  const psychology = firstMapValue(args.demographic.psychology) as
    | {
        cognitiveLoadTarget?: string;
        trustCuesNeeded?: string[];
        formality?: number;
        accessibilityFloor?: string;
        forbiddenPatterns?: string[];
        motivationPattern?: string;
      }
    | undefined;
  const painPoints = Array.from(args.demographic.painPoints?.values() ?? [])
    .flatMap((file) => file.points ?? [])
    .map((point) => point.description)
    .slice(0, 4);
  const archetypeName = String(archetypeManifest.name ?? titleCase(args.archetypeId));
  const category = String(archetypeManifest.category ?? 'molecule');
  const description = sanitizeDescription(
    String(archetypeManifest.description ?? ''),
    `${archetypeName} component tuned for ${displayId(args.demographicId)} experiences.`,
  );
  const intentPhrases = nonEmptyStrings(aiMetadata.intentPhrases).length
    ? nonEmptyStrings(aiMetadata.intentPhrases)
    : deriveIntentPhrases(args.archetypeId, archetypeName, category);
  const useCases = nonEmptyStrings(aiMetadata.useCases);
  const moodTags = nonEmptyStrings(aiMetadata.moodTags);
  const generationHints = nonEmptyStrings(aiMetadata.generationHints);
  const tags = unique([
    category,
    args.archetypeId,
    args.demographicId,
    args.density,
    ...moodTags,
    ...nonEmptyStrings(voice.tone),
  ]);
  const keywords = unique([
    ...tokenize(archetypeName),
    ...tokenize(args.archetypeId),
    ...tokenize(category),
    ...tokenize(args.demographicId),
    ...tags.flatMap(tokenize),
    ...intentPhrases.flatMap(tokenize),
    ...painPoints.flatMap(tokenize),
  ]).slice(0, 80);
  const wcagLevel = normalizeWcag(psychology?.accessibilityFloor, args.demographicId);
  const ageAppropriate = ageRangeFor(args.demographicId);
  const trustCues = unique([
    ...nonEmptyStrings(psychology?.trustCuesNeeded),
    ...inferTrustCues(args.demographicId),
  ]);
  const qualityTier = qualityTierFor(args.demographicId, args.archetypeId, args.density);
  const metadataProfile = metadataProfileFor({
    demographicId: args.demographicId,
    archetypeId: args.archetypeId,
    category,
    qualityTier,
    sourceRequiresClient: sourceRequiresClientBoundary(args.source),
  });
  const previewThumb = `data/previews/${args.demographicId}/${args.archetypeId}/${args.density}/${args.variant}.png`;
  return {
    id: args.id,
    name: `${displayId(args.demographicId)} ${archetypeName} ${titleCase(args.density)}`,
    version: '0.1.0',
    schemaVersion: 1,
    category,
    description,
    archetypeId: args.archetypeId,
    demographicId: args.demographicId,
    demographics: [{ id: args.demographicId, weight: 1 }],
    density: args.density,
    variant: args.variant,
    framework: String(args.rawManifest.framework ?? 'react'),
    frameworks: nonEmptyStrings(archetypeManifest.frameworks).length
      ? nonEmptyStrings(archetypeManifest.frameworks)
      : [String(args.rawManifest.framework ?? 'react')],
    tags,
    keywords,
    aiIntentPhrases: unique(intentPhrases),
    exampleIntents: unique([
      ...useCases,
      `${archetypeName} for ${displayId(args.demographicId)}`,
      `${description} ${generationHints.join(' ')}`.trim(),
    ]).filter(Boolean),
    antiPatterns: unique([
      ...nonEmptyStrings(archetypeManifest.demographicAntiPatterns),
      ...nonEmptyStrings(psychology?.forbiddenPatterns),
    ]),
    psychologySignals: {
      colorTemp: inferColorTemp(preset),
      density: args.density,
      formality: clampInt((psychology?.formality ?? 3) - 1, 0, 4),
      motionIntensity: inferMotionIntensity(preset),
      contrast: wcagLevel === 'AAA' ? 'max' : 'high',
      playfulness: inferPlayfulness(args.demographicId),
      trustCues,
    },
    accessibility: {
      wcagLevel,
      ageAppropriate,
      cognitiveLoad: normalizeCognitiveLoad(psychology?.cognitiveLoadTarget),
      reducedMotionSafe: true,
      screenReaderTested: false,
    },
    variants: [
      {
        id: args.variant,
        label: titleCase(args.variant),
        props: {},
        preview: { thumb: previewThumb },
      },
    ],
    dependencies: inferDependencies(args.source),
    registryDependencies: [],
    tokensUsed: nonEmptyStrings(archetypeManifest.tokensUsed),
    assetSlots: Array.isArray(archetypeManifest.assetSlots)
      ? (archetypeManifest.assetSlots as RichIndexedManifest['assetSlots'])
      : [],
    conversionPsychology: unique([
      ...trustCues.map((cue) => `Use ${cue.replace(/_/g, ' ')} to build trust.`),
      ...(psychology?.motivationPattern
        ? [`Support ${psychology.motivationPattern} motivation without dark patterns.`]
        : []),
    ]),
    license: String(archetypeManifest.license ?? 'MIT'),
    attribution: { source: 'original' },
    source: [
      { framework: String(args.rawManifest.framework ?? 'react'), path: args.sourceTsxPath },
    ],
    preview: { thumb: previewThumb },
    contentHash: String(
      args.rawManifest.contentHash ?? sha256(args.source + args.tokensCss).slice(0, 12),
    ),
    generatedAt:
      typeof args.rawManifest.generatedAt === 'string' ? args.rawManifest.generatedAt : undefined,
    qualityTier,
    primitiveStack: metadataProfile.primitiveStack,
    interactionContract: metadataProfile.interactionContract,
    motionContract: metadataProfile.motionContract,
    contentSlots: metadataProfile.contentSlots,
    performanceBudget: metadataProfile.performanceBudget,
    agentUsage: metadataProfile.agentUsage,
  };
}

function buildContextDocuments(
  manifest: RichIndexedManifest,
  opts: { source: string; tokensCss: string; embeddingModel: string },
): ContextDocument[] {
  const base = {
    subjectType: 'component',
    subjectId: manifest.id,
    metadata: {
      demographic: manifest.demographicId,
      archetype: manifest.archetypeId,
      density: manifest.density,
      category: manifest.category,
      qualityTier: manifest.qualityTier,
      model: opts.embeddingModel,
    },
  };
  const docs = [
    {
      kind: 'purpose',
      title: `${manifest.name} purpose`,
      body: [
        manifest.description,
        `Use for: ${manifest.aiIntentPhrases.join('; ')}.`,
        `Keywords: ${manifest.keywords.join(', ')}.`,
      ].join('\n'),
    },
    {
      kind: 'usage_examples',
      title: `${manifest.name} usage examples`,
      body: manifest.exampleIntents.join('\n'),
    },
    {
      kind: 'demographic_fit',
      title: `${manifest.name} demographic fit`,
      body: [
        `Target demographic: ${manifest.demographicId}.`,
        `Density: ${manifest.density}.`,
        `Psychology signals: ${JSON.stringify(manifest.psychologySignals)}.`,
        `Accessibility floor: ${manifest.accessibility.wcagLevel}; cognitive load ${manifest.accessibility.cognitiveLoad}.`,
        `Motion contract: ${manifest.motionContract.tone}; CSS-first ${manifest.motionContract.cssFirst}; reduced motion ${manifest.motionContract.reducedMotion}.`,
        `Performance budget: ${manifest.performanceBudget.clientJsKb}KB client JS; runtime ${manifest.performanceBudget.animationRuntime}.`,
      ].join('\n'),
    },
    {
      kind: 'anti_patterns',
      title: `${manifest.name} anti-patterns`,
      body: manifest.antiPatterns.length
        ? manifest.antiPatterns.join('\n')
        : 'Avoid generic placeholder copy, demographic mismatch, inaccessible contrast, hidden consent, and decorative complexity that conflicts with the target user.',
    },
    {
      kind: 'layout_slot_fit',
      title: `${manifest.name} layout slot fit`,
      body: [
        `Category: ${manifest.category}.`,
        `Archetype: ${manifest.archetypeId}.`,
        `Asset slots: ${manifest.assetSlots.map((s) => `${s.role}:${s.type}`).join(', ') || 'none'}.`,
        `Content slots: ${manifest.contentSlots.map((s) => `${s.name}:${s.type}`).join(', ') || 'none'}.`,
        `Quality tier: ${manifest.qualityTier}.`,
        `Token count: ${manifest.tokensUsed.length}.`,
      ].join('\n'),
    },
    {
      kind: 'source',
      title: `${manifest.name} source`,
      body: opts.source,
    },
  ];
  return docs.map((doc) => ({
    id: `component:${manifest.id}:${doc.kind}`,
    ...base,
    ...doc,
    vector: embedText(`${doc.title}\n${doc.body}`),
  }));
}

function buildContextEdges(manifest: RichIndexedManifest): ContextEdge[] {
  return [
    {
      id: `edge:component:${manifest.id}:archetype:${manifest.archetypeId}`,
      fromType: 'component',
      fromId: manifest.id,
      toType: 'archetype',
      toId: manifest.archetypeId,
      relation: 'implements',
      weight: 1,
      metadata: {},
    },
    {
      id: `edge:component:${manifest.id}:demographic:${manifest.demographicId}`,
      fromType: 'component',
      fromId: manifest.id,
      toType: 'demographic',
      toId: manifest.demographicId,
      relation: 'targets',
      weight: 1,
      metadata: { density: manifest.density },
    },
  ];
}

function qualityTierFor(
  demographicId: string,
  archetypeId: string,
  _density: string,
): 'flagship' | 'generated' | 'legacy' {
  const flagshipArchetypes = new Set([
    'hero',
    'feature-grid',
    'cta',
    'signup-form',
    'contact-form',
    'login-form',
    'command-palette',
    'voice-orb-input',
    'choice-card-group',
    'kpi-grid',
    'dashboard-card',
    'pricing-card',
    'faq',
    'empty-state',
    'error-state',
  ]);
  const flagshipDemographics = new Set([
    'health',
    'productivity',
    'fintech',
    'education',
    'ai_apps',
    'sales_crm',
    'mental_wellness',
    'gov',
  ]);
  if (flagshipArchetypes.has(archetypeId) && flagshipDemographics.has(demographicId)) {
    return 'flagship';
  }
  return 'generated';
}

function metadataProfileFor(args: {
  demographicId: string;
  archetypeId: string;
  category: string;
  qualityTier: 'flagship' | 'generated' | 'legacy';
  sourceRequiresClient: boolean;
}): Pick<
  RichIndexedManifest,
  | 'primitiveStack'
  | 'interactionContract'
  | 'motionContract'
  | 'contentSlots'
  | 'performanceBudget'
  | 'agentUsage'
> {
  const interactive = isInteractiveArchetype(args.archetypeId) || args.sourceRequiresClient;
  const overlay = ['dialog', 'modal', 'drawer', 'popover', 'tooltip', 'toast'].includes(
    args.archetypeId,
  );
  const tone = motionToneFor(args.demographicId);
  return {
    primitiveStack: primitiveStackFor(args.archetypeId),
    interactionContract: {
      keyboard: interactive
        ? ['Tab reaches interactive controls', 'Enter and Space activate primary actions']
        : [],
      pointer: interactive
        ? ['Hover is cosmetic only', 'Pressed state uses transform and opacity only']
        : ['Hover state is cosmetic only'],
      focus: overlay
        ? ['Focus is contained while open', 'Focus returns to trigger on close']
        : ['Visible focus ring is required on focusable descendants'],
      screenReader: [
        'Use semantic headings and labels',
        'Decorative imagery must be aria-hidden or have empty alt text',
      ],
    },
    motionContract: {
      tone,
      cssFirst: true,
      reducedMotion:
        'Disable non-essential transitions, continuous effects, and scroll-linked motion.',
      continuous: ['voice-orb-input', 'scroll-timeline', 'scroll-accordion'].includes(
        args.archetypeId,
      ),
    },
    contentSlots: contentSlotsFor(args.archetypeId),
    performanceBudget: {
      clientJsKb: interactive ? (overlay ? 8 : 6) : 0,
      animationRuntime: args.archetypeId === 'voice-orb-input' ? 'motion' : 'css',
      serverComponentSafe: !interactive,
    },
    agentUsage: {
      whenToUse: [
        `Use for ${args.archetypeId.replace(/-/g, ' ')} roles in ${displayId(args.demographicId)} interfaces.`,
        args.qualityTier === 'flagship'
          ? 'Prefer this over generated variants for normal production scaffolds.'
          : 'Use when no flagship component fits the requested slot.',
      ],
      whenNotToUse: [
        'Avoid when the demographic or accessibility floor conflicts with the component context.',
        'Avoid as generic filler; bind product-specific copy into content slots.',
      ],
      installNotes: [
        'Tailwind 3 is the default styling target.',
        'Micro-interactions are CSS-first; do not add animation runtime unless the install plan requests it.',
      ],
      propExamples: {},
    },
  };
}

function sourceRequiresClientBoundary(source: string): boolean {
  return (
    /\b(useState|useEffect|useReducer|useRef|useLayoutEffect)\b/.test(source) ||
    /\bon[A-Z]\w+=/.test(source)
  );
}

function isInteractiveArchetype(archetypeId: string): boolean {
  return [
    'button',
    'input',
    'textarea',
    'select',
    'checkbox',
    'radio',
    'switch',
    'slider',
    'dialog',
    'modal',
    'drawer',
    'popover',
    'tooltip',
    'toast',
    'command-palette',
    'choice-card-group',
    'voice-orb-input',
    'signup-form',
    'contact-form',
    'login-form',
    'search-bar',
  ].includes(archetypeId);
}

function primitiveStackFor(
  archetypeId: string,
): Array<{ library: string; primitive: string; purpose?: string }> {
  const byArchetype: Record<
    string,
    Array<{ library: string; primitive: string; purpose?: string }>
  > = {
    dialog: [{ library: 'base-ui', primitive: 'Dialog', purpose: 'focus and dismissal' }],
    modal: [{ library: 'base-ui', primitive: 'Dialog', purpose: 'focus and dismissal' }],
    drawer: [{ library: 'base-ui', primitive: 'Dialog', purpose: 'focus and dismissal' }],
    popover: [{ library: 'floating-ui', primitive: 'Popover', purpose: 'positioning' }],
    tooltip: [{ library: 'floating-ui', primitive: 'Tooltip', purpose: 'positioning' }],
    select: [{ library: 'react-aria', primitive: 'Select', purpose: 'keyboard listbox behavior' }],
    'command-palette': [
      { library: 'react-aria', primitive: 'ComboBox', purpose: 'collection navigation' },
    ],
    'choice-card-group': [
      { library: 'native-html', primitive: 'RadioGroup', purpose: 'single choice semantics' },
    ],
  };
  return (
    byArchetype[archetypeId] ?? [
      { library: 'native-html', primitive: 'semantic elements', purpose: 'minimal runtime' },
    ]
  );
}

function contentSlotsFor(
  archetypeId: string,
): Array<{ name: string; type: string; required: boolean; guidance?: string }> {
  const sharedText = [
    {
      name: 'headline',
      type: 'text',
      required: true,
      guidance: 'Product-specific, no placeholder.',
    },
    { name: 'body', type: 'text', required: true, guidance: 'Tie benefits to the user job.' },
    { name: 'primaryAction', type: 'action', required: false },
  ];
  const byArchetype: Record<
    string,
    Array<{ name: string; type: string; required: boolean; guidance?: string }>
  > = {
    hero: [
      ...sharedText,
      { name: 'heroVisual', type: 'image', required: false, guidance: 'Actual product or state.' },
    ],
    'feature-grid': [
      { name: 'title', type: 'text', required: true },
      { name: 'features', type: 'collection', required: true, guidance: '3-6 concrete benefits.' },
    ],
    'kpi-grid': [
      {
        name: 'stats',
        type: 'collection',
        required: true,
        guidance: 'Metrics with labels and context.',
      },
    ],
    'signup-form': [
      { name: 'title', type: 'text', required: true },
      { name: 'fields', type: 'collection', required: true },
      { name: 'privacyNote', type: 'text', required: true },
    ],
    'voice-orb-input': [
      { name: 'prompt', type: 'text', required: true },
      { name: 'placeholder', type: 'text', required: true },
    ],
  };
  return byArchetype[archetypeId] ?? sharedText;
}

function motionToneFor(
  demographicId: string,
): 'calm' | 'precise' | 'premium' | 'playful' | 'clinical' | 'enterprise' {
  if (['health', 'gov', 'education', 'mental_wellness'].includes(demographicId)) return 'calm';
  if (['productivity', 'sales_crm', 'erp', 'monitoring'].includes(demographicId)) return 'precise';
  if (demographicId === 'kids' || demographicId === 'social') return 'playful';
  if (demographicId === 'legal' || demographicId === 'military') return 'enterprise';
  return 'premium';
}

async function findFiles(root: string, filename: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await findFiles(fullPath, filename)));
    } else if (entry.isFile() && entry.name === filename) {
      out.push(fullPath);
    }
  }
  return out;
}

async function dirExists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function readOptional(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}

function toDataPath(path: string, dataRoot: string): string {
  return join('data', relative(dataRoot, path)).replace(/\\/g, '/');
}

function sanitizeDescription(value: string, fallback: string): string {
  if (!value.trim() || /^TODO\b/i.test(value.trim())) return fallback;
  return value.trim();
}

function deriveIntentPhrases(
  archetypeId: string,
  archetypeName: string,
  category: string,
): string[] {
  const noun = archetypeName.toLowerCase();
  return unique([
    `add a ${noun}`,
    `render a ${noun}`,
    `choose a ${noun} for a ${category}`,
    `${archetypeId.replace(/-/g, ' ')} component`,
  ]);
}

function nonEmptyStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter((item) => item.length > 0)
    : [];
}

function inferDependencies(source: string): string[] {
  const dependencies = new Set<string>();
  const importRegex = /from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(importRegex)) {
    const specifier = match[1] ?? match[2] ?? '';
    if (
      !specifier ||
      specifier.startsWith('.') ||
      specifier.startsWith('@/') ||
      specifier === 'react' ||
      specifier === 'react-dom' ||
      specifier === '@skeed/core/cn'
    ) {
      continue;
    }
    if (specifier.startsWith('@')) {
      const [scope, name] = specifier.split('/');
      if (scope && name) dependencies.add(`${scope}/${name}`);
      continue;
    }
    dependencies.add(specifier.split('/')[0] ?? specifier);
  }
  return [...dependencies].sort();
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[_/-]/g, ' ')
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 1);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function displayId(value: string): string {
  return titleCase(value);
}

function firstMapValue(value: Map<string, unknown> | undefined): unknown {
  return value?.values().next().value;
}

function normalizeWcag(value: string | undefined, demographicId: string): string {
  if (value?.startsWith('AAA')) return 'AAA';
  if (value === 'A' || value === 'AA') return value;
  return ['kids', 'education', 'health', 'gov', 'mental_wellness'].includes(demographicId)
    ? 'AAA'
    : 'AA';
}

function normalizeCognitiveLoad(value: string | undefined): string {
  if (value === 'dense') return 'high';
  if (value === 'minimal' || value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }
  return 'medium';
}

function ageRangeFor(demographicId: string): { min: number; max: number } {
  if (demographicId === 'kids') return { min: 6, max: 12 };
  if (demographicId === 'teens') return { min: 13, max: 19 };
  if (demographicId === 'working_class') return { min: 18, max: 75 };
  return { min: 13, max: 120 };
}

function inferTrustCues(demographicId: string): string[] {
  const byDemo: Record<string, string[]> = {
    health: ['professional_credentials', 'accessibility_compliance'],
    mental_wellness: ['crisis_resources', 'privacy_indicators'],
    fintech: ['audit_trail', 'verified_check'],
    gov: ['institutional_seal', 'accessibility_compliance'],
    legal: ['compliance_badge', 'expert_byline'],
    kids: ['parental_controls', 'clear_instructions'],
    education: ['progress_indicators', 'clear_instructions'],
  };
  return byDemo[demographicId] ?? [];
}

function inferPlayfulness(demographicId: string): number {
  if (demographicId === 'kids') return 4;
  if (demographicId === 'teens' || demographicId === 'social') return 3;
  if (['legal', 'gov', 'erp', 'military'].includes(demographicId)) return 0;
  return 1;
}

function inferColorTemp(preset: Record<string, unknown>): string {
  const palette = preset.palette as { brand?: { 500?: string } } | undefined;
  const brand = palette?.brand?.['500']?.toLowerCase() ?? '';
  if (/^#(ef|f5|dc|d9|b4|fb|f9)/.test(brand)) return 'warm';
  if (/^#(3b|25|1d|0e|06|10|14|22|4c|5b|6d|7c|8b)/.test(brand)) return 'cool';
  return 'neutral';
}

function inferMotionIntensity(preset: Record<string, unknown>): string {
  const motion = preset.motion as { profile?: string } | undefined;
  if (motion?.profile === 'none') return 'none';
  if (motion?.profile === 'playful') return 'playful';
  if (motion?.profile === 'dramatic') return 'dramatic';
  return 'subtle';
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function embedText(text: string, dimensions = 64): number[] {
  const vector = Array.from({ length: dimensions }, () => 0);
  const tokens = tokenize(text);
  for (const token of tokens) {
    const hash = createHash('sha256').update(token).digest();
    const index = (hash[0] ?? 0) % dimensions;
    const sign = (hash[1] ?? 0) % 2 === 0 ? 1 : -1;
    vector[index] = (vector[index] ?? 0) + sign * (1 + Math.min(token.length, 12) / 12);
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / norm).toFixed(6)));
}
