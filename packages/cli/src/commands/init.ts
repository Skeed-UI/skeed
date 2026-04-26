import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import kleur from 'kleur';
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
  stage_14_ia,
  stage_14_5_backend_selector,
  stage_15_compose,
  stage_16_assets,
  stage_17_emit,
} from '@skeed/pipeline';
import type { Scaffold } from '@skeed/contracts';
import { createMemoryCache } from '../runtime/cache.js';
import { attachProgress } from '../runtime/progress.js';
import { inferProjectName } from '../runtime/infer.js';
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

  process.stdout.write(`\n${kleur.bold('Skeed')} ${kleur.gray('— scaffolding')} ${kleur.cyan(projectName)}\n`);
  process.stdout.write(`${kleur.gray('idea:')} ${opts.prompt}\n\n`);

  const orch = new Orchestrator()
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
    .register(stage_13_landing_options)
    .register(stage_14_ia)
    .register(stage_14_5_backend_selector)
    .register(stage_15_compose)
    .register(stage_16_assets)
    .register(stage_17_emit);

  orch.on(attachProgress());

  const initial: PipelineStateType = {
    runId: randomUUID(),
    prompt: opts.prompt,
    registryVersion: '0.1.0',
  };

  const result = (await orch.run(initial, {
    runId: initial.runId,
    registryVersion: initial.registryVersion,
    cache: createMemoryCache(),
  })) as Scaffold;

  const { written } = await writeScaffold({ outDir, scaffold: result });

  process.stdout.write(
    `\n${kleur.green('done')} ${written} files written to ${kleur.cyan(outDir)}\n`,
  );
  process.stdout.write(`\nNext steps:\n  cd ${projectName}\n  npm install\n  npm run dev\n\n`);
  if (result.warnings.length > 0) {
    for (const w of result.warnings) process.stdout.write(`${kleur.yellow('warn')} ${w}\n`);
  }
}
