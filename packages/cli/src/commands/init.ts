import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import type { Scaffold } from '@skeed/contracts';
import {
  Orchestrator,
  type PipelineState as PipelineStateType,
  stage_01_intent,
  stage_02_classify,
  stage_03_pain_points,
  stage_04_score_l1,
  stage_05_gate_1,
  stage_06_research,
  stage_07_score_l2,
  stage_08_gate_2,
  stage_09_psychology,
  stage_10_brand_logo,
  stage_11_design_system,
  stage_12_user_stories,
  stage_13_landing_options,
  stage_14_5_backend_selector,
  stage_14_ia,
  stage_15_compose,
  stage_16_assets,
  stage_17_emit,
} from '@skeed/pipeline';
import kleur from 'kleur';
import { createMemoryCache } from '../runtime/cache.js';
import { inferProjectName } from '../runtime/infer.js';
import { type PreviewCandidate, pickFromPreview } from '../runtime/preview.js';
import { attachProgress } from '../runtime/progress.js';
import { writeScaffold } from '../runtime/scaffold.js';

export interface InitOptions {
  prompt: string;
  name?: string;
  demographic?: string;
  yes?: boolean;
  preview?: boolean;
  outDir?: string;
}

export async function runInit(opts: InitOptions): Promise<void> {
  const projectName = inferProjectName(opts.prompt, opts.name);
  const outDir = resolve(opts.outDir ?? process.cwd(), projectName);

  process.stdout.write(
    `\n${kleur.bold('Skeed')} ${kleur.gray('— scaffolding')} ${kleur.cyan(projectName)}\n`,
  );
  process.stdout.write(`${kleur.gray('idea:')} ${opts.prompt}\n\n`);

  const cache = createMemoryCache();
  const ctxBase = { runId: randomUUID(), registryVersion: '0.1.0', cache };

  // ── Phase A: stages 1-13 — produce candidates ────────────────────────────
  const phaseA = new Orchestrator()
    .register(stage_01_intent)
    .register(stage_02_classify)
    .register(stage_03_pain_points)
    .register(stage_04_score_l1)
    .register(stage_05_gate_1)
    .register(stage_06_research)
    .register(stage_07_score_l2)
    .register(stage_08_gate_2)
    .register(stage_09_psychology)
    .register(stage_10_brand_logo)
    .register(stage_11_design_system)
    .register(stage_12_user_stories)
    .register(stage_13_landing_options);
  phaseA.on(attachProgress());

  const initial: PipelineStateType = {
    runId: ctxBase.runId,
    prompt: opts.prompt,
    registryVersion: ctxBase.registryVersion,
  };
  const stateA = (await phaseA.run(initial, ctxBase)) as PipelineStateType & {
    logoCandidates?: Array<{ id: string; svg: string; layout: string; altText: string }>;
    landingCandidates?: Array<{
      id: string;
      archetype: string;
      variant: string;
      tsx: string;
      preview: string;
    }>;
    landingTsx?: string;
  };

  // ── Optional approval gates via local browser preview ────────────────────
  let chosenLandingId: string | undefined;
  let chosenLogoId: string | undefined;
  if (opts.preview && !opts.yes) {
    if (stateA.logoCandidates && stateA.logoCandidates.length > 1) {
      chosenLogoId = await pickFromPreview({
        title: `Pick a logo for ${projectName}`,
        description: `Demographic: ${stateA.classification?.candidates[0]?.demographic ?? 'unknown'}`,
        candidates: stateA.logoCandidates.map<PreviewCandidate>((c) => ({
          id: c.id,
          label: `${c.layout} — ${c.id}`,
          html: c.svg,
        })),
      });
      const picked = stateA.logoCandidates.find((c) => c.id === chosenLogoId);
      if (picked) (stateA as { logoChosen?: typeof picked }).logoChosen = picked;
    }
    if (stateA.landingCandidates && stateA.landingCandidates.length > 1) {
      chosenLandingId = await pickFromPreview({
        title: `Pick a landing page for ${projectName}`,
        description: `${stateA.landingCandidates.length} candidates generated.`,
        candidates: stateA.landingCandidates.map<PreviewCandidate>((c) => ({
          id: c.id,
          label: `${c.archetype} / ${c.variant}`,
          html: `<p style="font-size:.85rem;opacity:.7">${c.preview}</p><pre style="overflow:auto;max-height:160px;font-size:.7rem">${escape(c.tsx.slice(0, 600))}…</pre>`,
        })),
      });
      const picked = stateA.landingCandidates.find((c) => c.id === chosenLandingId);
      if (picked) {
        stateA.landingTsx = picked.tsx;
        if (stateA.landingChosen)
          stateA.landingChosen = {
            ...stateA.landingChosen,
            id: picked.id,
            archetype: picked.archetype as never,
            preview: picked.preview,
          };
      }
    }
  }

  // ── Phase B: stages 14-17 — finalize + emit ──────────────────────────────
  const phaseB = new Orchestrator()
    .register(stage_14_ia)
    .register(stage_14_5_backend_selector)
    .register(stage_15_compose)
    .register(stage_16_assets)
    .register(stage_17_emit);
  phaseB.on(attachProgress());
  const result = (await phaseB.run(stateA, ctxBase)) as Scaffold;

  const { written } = await writeScaffold({ outDir, scaffold: result });

  process.stdout.write(
    `\n${kleur.green('done')} ${written} files written to ${kleur.cyan(outDir)}\n`,
  );
  if (chosenLogoId) process.stdout.write(`  logo:    ${kleur.cyan(chosenLogoId)}\n`);
  if (chosenLandingId) process.stdout.write(`  landing: ${kleur.cyan(chosenLandingId)}\n`);
  process.stdout.write(`\nNext steps:\n  cd ${projectName}\n  npm install\n  npm run dev\n\n`);
  if (result.warnings.length > 0) {
    for (const w of result.warnings) process.stdout.write(`${kleur.yellow('warn')} ${w}\n`);
  }
}

function escape(s: string): string {
  return s.replace(/[<>&'"`]/g, (c) => `&#${c.charCodeAt(0)};`);
}
