import { LlmDispatcher, type StageId, availableForStage } from '@skeed/llm-router';
import { LocalLLMProvider } from '@skeed/llm-provider-local';
import type { z } from 'zod';

let _dispatcher: LlmDispatcher | undefined;
let _localProvider: LocalLLMProvider | undefined;

/** Lazily-initialised singleton dispatcher; uses ~/.skeed/cache.db. */
export function getDispatcher(): LlmDispatcher {
  if (!_dispatcher) _dispatcher = new LlmDispatcher();
  return _dispatcher;
}

/** Get the local LLM provider if available */
export function getLocalProvider(): LocalLLMProvider | undefined {
  if (process.env.SKEED_DISABLE_LOCAL_LLM === '1') return undefined;
  if (!_localProvider && LocalLLMProvider.isAvailable()) {
    _localProvider = new LocalLLMProvider();
  }
  return _localProvider;
}

export function hasAnyProviderForStage(stage: StageId | string): boolean {
  // Check for API-key based providers
  if (availableForStage(stage as StageId).length > 0) return true;
  // Check for local model
  if (process.env.SKEED_DISABLE_LOCAL_LLM === '1') return false;
  return LocalLLMProvider.isAvailable();
}

/**
 * Run an LLM call with deterministic fallback. If no provider has an API key
 * set but local model is available, uses local model. Otherwise calls
 * `fallback()` synchronously instead of throwing.
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
    validate?: (value: T) => string[];
  },
  fallback: () => T | Promise<T>,
): Promise<T> {
  const runFallback = async (reason?: string): Promise<T> => {
    if (reason) process.stderr.write(`[skeed] stage ${opts.stage} using deterministic fallback. ${reason}\n`);
    return await fallback();
  };

  // Try API-based providers first
  if (availableForStage(opts.stage as StageId).length > 0) {
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
      const issues = opts.validate?.(result.value) ?? [];
      if (issues.length > 0) throw new Error(`semantic validation failed: ${issues.join('; ')}`);
      return result.value;
    } catch (err) {
      process.stderr.write(
        `[skeed] stage ${opts.stage} API LLM failed; trying local AI before fallback. ${err instanceof Error ? err.message : String(err)}\n`,
      );
    }
  }

  // Try local provider
  const localProvider = getLocalProvider();
  if (localProvider) {
    try {
      const result = await localProvider.chat<T>({
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.user },
        ],
        schema: opts.schema as z.ZodType<T>,
        modelTier: 'balanced',
        temperature: opts.temperature ?? 0.7,
        maxTokens: opts.maxTokens ?? 1024,
      });
      const issues = opts.validate?.(result.data) ?? [];
      if (issues.length > 0) {
        const retry = await localProvider.chat<T>({
          messages: [
            { role: 'system', content: `${opts.system}\n\nFix these validation issues: ${issues.join('; ')}` },
            { role: 'user', content: opts.user },
          ],
          schema: opts.schema as z.ZodType<T>,
          modelTier: 'balanced',
          temperature: Math.min(opts.temperature ?? 0.7, 0.2),
          maxTokens: opts.maxTokens ?? 1024,
        });
        const retryIssues = opts.validate?.(retry.data) ?? [];
        if (retryIssues.length > 0) {
          throw new Error(`semantic validation failed: ${retryIssues.join('; ')}`);
        }
        return retry.data;
      }
      return result.data;
    } catch (err) {
      process.stderr.write(
        `[skeed] stage ${opts.stage} local LLM failed. ${err instanceof Error ? err.message : String(err)}\n`,
      );
      return runFallback('local model unavailable or produced invalid structured output');
    }
  }

  return runFallback('no API key or downloaded local model was available');
}
