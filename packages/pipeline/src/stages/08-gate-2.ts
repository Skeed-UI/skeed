import { z } from 'zod';
import type { Stage } from '@skeed/contracts';

/**
 * Stage 08 — User final approval.
 *
 * AGENTS: read packages/pipeline/src/stages/AGENTS.md before editing.
 * Replace TODOs with: real input/output schemas (extend pipeline-types.ts if new),
 * a real run() body, and a sibling test file.
 */

const Input = z.unknown(); // TODO: replace with real input schema
const Output = z.unknown(); // TODO: replace with real output schema

export const stage_08_gate_2: Stage<unknown, unknown> = {
  name: '08-gate-2',
  version: '0.1.0',
  inputSchema: Input,
  outputSchema: Output,
  cacheable: false,
  async run(input, _ctx) {
    // TODO: implement
    return input;
  },
};
