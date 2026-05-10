import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';
import { relative, resolve } from 'node:path';
import { DemographicId, type Scaffold } from '@skeed/contracts';
import { LocalLLMProvider } from '@skeed/llm-provider-local';
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
  apiKey?: string;
  noApiKey?: boolean;
}

export async function runInit(opts: InitOptions): Promise<void> {
  const nonInteractive = Boolean(opts.yes) || !process.stdin.isTTY || !process.stdout.isTTY;

  if (opts.noApiKey || (nonInteractive && !opts.apiKey)) {
    process.env.SKEED_DISABLE_LOCAL_LLM = '1';
  } else {
    delete process.env.SKEED_DISABLE_LOCAL_LLM;
  }

  const projectName = inferProjectName(opts.prompt, opts.name);
  const outDir = resolve(opts.outDir ?? process.cwd(), projectName);

  process.stdout.write(
    `\n${kleur.bold('Skeed')} ${kleur.gray('- scaffolding')} ${kleur.cyan(projectName)}\n`,
  );
  process.stdout.write(`${kleur.gray('idea:')} ${opts.prompt}\n\n`);

  // Prompt for API key or local model
  let apiKey = opts.apiKey;
  let localProvider: LocalLLMProvider | undefined;

  if (!apiKey && !opts.noApiKey && !nonInteractive) {
    apiKey = await promptForApiKey();
  }

  if (apiKey) {
    const provider = process.env.SKEED_LLM_PROVIDER ?? 'openai';
    applyApiKey(provider, apiKey);
    process.stdout.write(
      `${kleur.gray('api:')} Using provided ${provider} key for structured generation\n`,
    );
  } else if (!opts.noApiKey && !nonInteractive) {
    // Offer local model as alternative
    localProvider = await promptForLocalModel();
    if (localProvider) {
      process.stdout.write(
        `${kleur.gray('local:')} Using local AI model (CPU-only, no API calls)\n\n`,
      );
    } else {
      process.stdout.write(
        `${kleur.yellow('warn')} No AI provider available - using fallback content (less personalized)\n`,
      );
      process.stdout.write(
        `  ${kleur.gray('Tip: Provide an API key or download the local model for better results')}\n\n`,
      );
    }
  } else {
    process.stdout.write(
      `${kleur.yellow('warn')} AI provider prompts skipped - using deterministic fallback content\n\n`,
    );
  }

  const cache = createMemoryCache();
  const ctxBase = { runId: randomUUID(), registryVersion: '0.1.0', cache, apiKey };
  // Phase A: stages 1-13 produce candidates.
  const phaseA1 = new Orchestrator()
    .register(stage_01_intent)
    .register(stage_02_classify)
    .register(stage_03_pain_points)
    .register(stage_04_score_l1)
    .register(stage_05_gate_1);
  phaseA1.on(attachProgress());

  const initial: PipelineStateType = {
    runId: ctxBase.runId,
    prompt: opts.prompt,
    registryVersion: ctxBase.registryVersion,
    ...(opts.demographic
      ? {
          classification: pinnedClassification(opts.demographic, opts.prompt),
        }
      : {}),
  };
  const stateGate1 = (await phaseA1.run(initial, ctxBase)) as PipelineStateType;
  await confirmGate('Gate 1', stateGate1.scoreL1, opts.yes);

  const phaseA2 = new Orchestrator()
    .register(stage_06_research)
    .register(stage_07_score_l2)
    .register(stage_08_gate_2);
  phaseA2.on(attachProgress());
  const stateGate2 = (await phaseA2.run(stateGate1, ctxBase)) as PipelineStateType;
  await confirmGate('Gate 2', stateGate2.scoreL2, opts.yes);

  const phaseA3 = new Orchestrator()
    .register(stage_09_psychology)
    .register(stage_10_brand_logo)
    .register(stage_11_design_system)
    .register(stage_12_user_stories)
    .register(stage_13_landing_options);
  phaseA3.on(attachProgress());
  const stateA = (await phaseA3.run(stateGate2, ctxBase)) as PipelineStateType & {
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
  // Optional approval gates via local browser preview.
  let chosenLandingId: string | undefined;
  let chosenLogoId: string | undefined;
  if (opts.preview && !opts.yes) {
    if (stateA.logoCandidates && stateA.logoCandidates.length > 1) {
      chosenLogoId = await pickFromPreview({
        title: `Pick a logo for ${projectName}`,
        description: `Demographic: ${stateA.classification?.candidates[0]?.demographic ?? 'unknown'}`,
        candidates: stateA.logoCandidates.map<PreviewCandidate>((c) => ({
          id: c.id,
          label: `${c.layout} - ${c.id}`,
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
          html: `<p style="font-size:.85rem;opacity:.7">${c.preview}</p><pre style="overflow:auto;max-height:160px;font-size:.7rem">${escape(c.tsx.slice(0, 600))}...</pre>`,
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
  // Phase B: stages 14-17 finalize and emit.
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
  process.stdout.write(
    `\nNext steps:\n  cd ${shellQuoteCdTarget(relative(process.cwd(), outDir) || '.')}\n  npm install\n  npm run dev\n\n`,
  );
  if (result.warnings.length > 0) {
    for (const w of result.warnings) process.stdout.write(`${kleur.yellow('warn')} ${w}\n`);
  }
}

function escape(s: string): string {
  return s.replace(/[<>&'"`]/g, (c) => `&#${c.charCodeAt(0)};`);
}

function shellQuoteCdTarget(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  return /\s/.test(normalized) ? `"${normalized.replace(/"/g, '\\"')}"` : normalized;
}

async function promptForApiKey(): Promise<string | undefined> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => resolve(answer.trim()));
    });
  };

  process.stdout.write(`${kleur.cyan('LLM API Key Setup')}\n`);
  process.stdout.write(
    `For better content generation, provide an API key from OpenAI, Anthropic, Google, Groq, DeepSeek, Qwen, Kimi, or OpenRouter.\n`,
  );
  process.stdout.write(`Leave blank to skip and try local model instead.\n\n`);

  const hasKey = await question('Do you have an LLM API key? (y/n): ');

  if (hasKey.toLowerCase() !== 'y') {
    rl.close();
    return undefined;
  }

  const provider = await question(
    'Provider (openai/anthropic/google/groq/deepseek/qwen/kimi/openrouter): ',
  );
  const key = await question('API Key: ');

  rl.close();

  if (!key) {
    return undefined;
  }

  // Store for pipeline stages to use
  process.env.SKEED_LLM_PROVIDER = provider.toLowerCase();
  applyApiKey(provider, key);

  return key;
}

function applyApiKey(provider: string, key: string): void {
  const envByProvider: Record<string, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    google: 'GOOGLE_API_KEY',
    groq: 'GROQ_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    moonshot: 'MOONSHOT_API_KEY',
    kimi: 'MOONSHOT_API_KEY',
    dashscope: 'DASHSCOPE_API_KEY',
    qwen: 'DASHSCOPE_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
  };
  const envName = envByProvider[provider.toLowerCase()] ?? 'OPENAI_API_KEY';
  process.env[envName] = key;
  process.env.SKEED_LLM_API_KEY = key;
}

function pinnedClassification(
  demographic: string,
  prompt: string,
): PipelineStateType['classification'] {
  const parsed = DemographicId.safeParse(demographic);
  if (!parsed.success) {
    throw new Error(`unknown demographic "${demographic}"`);
  }

  return {
    candidates: [
      {
        demographic: parsed.data,
        niche: inferPinnedNiche(prompt),
        confidence: 1,
        reasoning: 'pinned via --demographic',
      },
    ],
    needsClarification: false,
    questions: [],
  };
}

function inferPinnedNiche(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/wedding/.test(p)) return 'wedding';
  if (/birthday|bday/.test(p)) return 'birthday';
  if (/anniversary/.test(p)) return 'anniversary';
  if (/webinar/.test(p)) return 'webinar';
  if (/meditat|therapy|mental/.test(p)) return 'therapy';
  if (/task|todo|productiv|remote/.test(p)) return 'task-management';
  if (/inventory|warehouse/.test(p)) return 'inventory';
  if (/bank|finance|money/.test(p)) return 'banking';
  if (/school|course|learn/.test(p)) return 'learning';
  return 'general';
}

async function confirmGate(
  label: string,
  score: PipelineStateType['scoreL1'] | PipelineStateType['scoreL2'],
  yes: boolean | undefined,
): Promise<void> {
  if (score?.passes !== false || yes) return;

  process.stdout.write(
    `\n${kleur.yellow(label)} did not pass: ${score.composite.toFixed(1)}/10.\n`,
  );
  for (const recommendation of score.recommendations.slice(0, 4)) {
    process.stdout.write(`  - ${recommendation}\n`);
  }

  const answer = await ask('Continue anyway? (y/n): ');
  if (answer.toLowerCase() !== 'y') {
    throw new Error(`${label} failed and generation was stopped`);
  }
}

async function ask(prompt: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolveAnswer) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolveAnswer(answer.trim());
    });
  });
}

async function promptForLocalModel(): Promise<LocalLLMProvider | undefined> {
  const provider = new LocalLLMProvider();

  // Check if already downloaded
  if (provider.isReady()) {
    return provider;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => resolve(answer.trim()));
    });
  };

  process.stdout.write(`\n${kleur.cyan('Local AI Model Setup')}\n`);
  process.stdout.write(
    `Skeed can download a small AI model (~350MB) to run locally on your CPU.\n`,
  );
  process.stdout.write(`This provides better scaffolds without requiring API keys.\n`);
  process.stdout.write(`Model: Qwen 2.5 0.5B Instruct (Apache 2.0 license)\n\n`);

  const answer = await question('Download and use local model? (y/n): ');
  rl.close();

  if (answer.toLowerCase() !== 'y') {
    return undefined;
  }

  process.stdout.write(`\n${kleur.gray('Downloading model...')}\n`);

  try {
    await provider.downloadModel((downloaded, total) => {
      const percent = Math.round((downloaded / total) * 100);
      process.stdout.write(
        `\r  Progress: ${percent}% (${downloaded.toFixed(1)} / ${total.toFixed(1)} MB)`,
      );
    });
    process.stdout.write('\n');
    return provider;
  } catch (err) {
    process.stdout.write(
      `\n${kleur.red('Failed to download model:')} ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return undefined;
  }
}
