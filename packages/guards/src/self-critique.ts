/**
 * Self-critique guard. 1-cycle critique-regen loop bounded so cost cannot blow
 * up. The caller supplies a `regenerate` function that produces a new candidate
 * given the prior critique; we run rubric, if failing, call regenerate ONCE,
 * re-rubric, return whichever scored higher.
 */
import { type RubricInput, type RubricResult, judgeRubric } from './rubric.js';

export interface SelfCritiqueOptions {
  candidate: { tsx: string; globalsCss: string; assetAlts: string[]; backendStack: string[]; demographic: string };
  /** Regenerate fn — receives a critique string of failing axes; returns a new tsx + critique deltas. */
  regenerate: (critique: string) => Promise<{ tsx: string; globalsCss?: string }>;
  /** Hard cap. Cannot exceed 1 regen per call (by design). */
  maxCycles?: 0 | 1;
}

export interface SelfCritiqueResult {
  finalTsx: string;
  finalGlobalsCss: string;
  beforeRubric: RubricResult;
  afterRubric?: RubricResult;
  critique: string;
  improved: boolean;
}

export async function selfCritique(opts: SelfCritiqueOptions): Promise<SelfCritiqueResult> {
  const cycles = opts.maxCycles ?? 1;
  const beforeInput: RubricInput = {
    demographic: opts.candidate.demographic,
    landingTsx: opts.candidate.tsx,
    globalsCss: opts.candidate.globalsCss,
    assetAlts: opts.candidate.assetAlts,
    backendStack: opts.candidate.backendStack,
  };
  const beforeRubric = judgeRubric(beforeInput);

  if (beforeRubric.passes || cycles === 0) {
    return {
      finalTsx: opts.candidate.tsx,
      finalGlobalsCss: opts.candidate.globalsCss,
      beforeRubric,
      critique: '',
      improved: false,
    };
  }

  const failingAxes = beforeRubric.criteria.filter((c) => c.score < 7);
  const critique = failingAxes.map((c) => `- ${c.label}: ${c.reasoning}`).join('\n');

  const regen = await opts.regenerate(critique);
  const afterInput: RubricInput = { ...beforeInput, landingTsx: regen.tsx, globalsCss: regen.globalsCss ?? opts.candidate.globalsCss };
  const afterRubric = judgeRubric(afterInput);

  const useNew = afterRubric.composite > beforeRubric.composite;
  return {
    finalTsx: useNew ? regen.tsx : opts.candidate.tsx,
    finalGlobalsCss: useNew ? regen.globalsCss ?? opts.candidate.globalsCss : opts.candidate.globalsCss,
    beforeRubric,
    afterRubric,
    critique,
    improved: useNew,
  };
}
