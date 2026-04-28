import { LlmDispatcher, type StageId, availableForStage } from '@skeed/llm-router';
import type { z } from 'zod';

let _dispatcher: LlmDispatcher | undefined;

/** Lazily-initialised singleton dispatcher; uses ~/.skeed/cache.db. */
export function getDispatcher(): LlmDispatcher {
  if (!_dispatcher) _dispatcher = new LlmDispatcher();
  return _dispatcher;
}

export function hasAnyProviderForStage(stage: StageId | string): boolean {
  return availableForStage(stage as StageId).length > 0;
}

/**
 * Run an LLM call with deterministic fallback. If no provider has an API key
 * set, calls `fallback()` synchronously instead of throwing.
 */
export async function llmOrFallback<T>(
  opts: {
    stage: StageId | string;
    promptVersion: string;
    system: string;
    user: string;
    schema: z.ZodType<T, z.ZodTypeDef, unknown>;
    temperature?: number;
    maxTokens?: number;
  },
  fallback: () => T,
): Promise<T> {
  if (!hasAnyProviderForStage(opts.stage)) return fallback();
  try {
    const result = await getDispatcher().dispatch<T>({
      stage: opts.stage,
      promptVersion: opts.promptVersion,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ],
      schema: opts.schema,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(opts.maxTokens !== undefined ? { maxTokens: opts.maxTokens } : {}),
    });
    return result.value;
  } catch (err) {
    process.stderr.write(
      `[skeed] stage ${opts.stage} LLM failed; falling back. ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return fallback();
  }
}
