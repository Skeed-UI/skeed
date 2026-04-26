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
  readonly inputSchema: z.ZodType<I>;
  readonly outputSchema: z.ZodType<O>;
  readonly cacheable: boolean;
  run(input: I, ctx: StageContext): Promise<O>;
}
