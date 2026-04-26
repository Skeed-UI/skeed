import { z } from 'zod';
import type { Stage } from '@skeed/contracts';

/**
 * Stage 06 — AutoResearchClaw deep research.
 *
 * AGENTS: read packages/pipeline/src/stages/AGENTS.md before editing.
 * Replace TODOs with: real input/output schemas (extend pipeline-types.ts if new),
 * a real run() body, and a sibling test file.
 */

const Input = z.unknown(); // TODO: replace with real input schema
const Output = z.unknown(); // TODO: replace with real output schema

export const stage_06_research: Stage<unknown, unknown> = {
  name: '06-research',
  version: '0.1.0',
  inputSchema: Input,
  outputSchema: Output,
  cacheable: true,
  async run(input, _ctx) {
    // TODO: implement
    return input;
  },
};
