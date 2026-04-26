import type { z } from 'zod';

export interface StageContext {
  runId: string;
  registryVersion: string;
  cache: {
    get(key: string): Promise<unknown | undefined>;
    set(key: string, value: unknown): Promise<void>;
  };
  emit(event: {
    stage: string;
    type: 'start' | 'token' | 'done' | 'error' | 'cached';
    data?: unknown;
  }): void;
  signal: AbortSignal;
}

/**
 * A pipeline stage. Pure async function (input, ctx) → output with Zod
 * schemas on both sides. The orchestrator hashes (stageVersion + input)
 * to derive a cache key.
 */
export interface Stage<I, O> {
  readonly name: string;
  readonly version: string;
  /** Zod schema validating input. Schema may have wider input type than I (defaults). */
  readonly inputSchema: z.ZodType<I, z.ZodTypeDef, unknown>;
  /** Zod schema validating output. Schema may have wider input type than O (defaults). */
  readonly outputSchema: z.ZodType<O, z.ZodTypeDef, unknown>;
  readonly cacheable: boolean;
  run(input: I, ctx: StageContext): Promise<O>;
}
