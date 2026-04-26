import { z } from 'zod';
import type { Stage } from '@skeed/contracts';

/**
 * Stage 04 — 5-axis Level-1 idea score.
 *
 * AGENTS: read packages/pipeline/src/stages/AGENTS.md before editing.
 * Replace TODOs with: real input/output schemas (extend pipeline-types.ts if new),
 * a real run() body, and a sibling test file.
 */

const Input = z.unknown(); // TODO: replace with real input schema
const Output = z.unknown(); // TODO: replace with real output schema

export const stage_04_score_l1: Stage<unknown, unknown> = {
  name: '04-score-l1',
  version: '0.1.0',
  inputSchema: Input,
  outputSchema: Output,
  cacheable: true,
  async run(input, _ctx) {
    // TODO: implement
    return input;
  },
};
