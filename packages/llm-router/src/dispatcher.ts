import { createHash } from 'node:crypto';
import type { z } from 'zod';
import { LlmCache } from './cache.js';
import { extractStructured } from './extract.js';
import { type ChatMessage, type ChatResponse, HttpError, callModel } from './providers/index.js';
import {
  MODELS,
  type ModelEntry,
  type StageId,
  availableForStage,
  cheapestAvailable,
} from './registry.js';

export interface DispatchOptions<T> {
  stage: StageId | string;
  promptVersion: string;
  messages: ChatMessage[];
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
  temperature?: number;
  maxTokens?: number;
  /** Force a specific model id; otherwise router picks per stage. */
  modelOverride?: string;
  /** Skip cache for this call. */
  noCache?: boolean;
  /** Max repair re-prompts when extraction fails schema. Hard cap at 3. */
  maxRepairs?: number;
  signal?: AbortSignal;
  /** Debug: emitted at each step. */
  onEvent?: (e: DispatchEvent) => void;
}

export type DispatchEvent =
  | { type: 'try-model'; modelId: string }
  | { type: 'cached'; modelId: string }
  | { type: 'extracted'; modelId: string; strategies: number }
  | { type: 'schema-fail'; modelId: string; error: string }
  | { type: 'repair'; modelId: string; pass: number }
  | { type: 'fallback'; from: string; to: string; reason: string }
  | { type: 'done'; modelId: string; tokenIn: number; tokenOut: number; passes: number };

export interface DispatchResult<T> {
  value: T;
  modelId: string;
  passes: number;
  cached: boolean;
  totalTokenIn: number;
  totalTokenOut: number;
}

/**
 * Main dispatch surface. Call this from any pipeline stage to get a typed,
 * schema-validated structured response from the cheapest viable model with
 * automatic provider fallback and multi-strategy extraction.
 */
export class LlmDispatcher {
  constructor(private readonly cache: LlmCache = new LlmCache()) {}

  async dispatch<T>(opts: DispatchOptions<T>): Promise<DispatchResult<T>> {
    const stageId = opts.stage as StageId;
    const env = process.env;
    const candidates: ModelEntry[] = opts.modelOverride
      ? [MODELS[opts.modelOverride]].filter((m): m is ModelEntry => Boolean(m && env[m.apiKeyEnv]))
      : availableForStage(stageId, env);

    if (candidates.length === 0) {
      throw new Error(
        `no LLM provider available for stage ${stageId}. Set one of: DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY, MOONSHOT_API_KEY, DASHSCOPE_API_KEY, OPENROUTER_API_KEY.`,
      );
    }

    const schemaHash = createHash('sha256')
      .update(JSON.stringify(opts.schema._def))
      .digest('hex')
      .slice(0, 16);
    const temperature = opts.temperature ?? 0.2;
    const maxRepairs = Math.min(opts.maxRepairs ?? 2, 3);

    let lastError: Error | undefined;
    let totalTokenIn = 0;
    let totalTokenOut = 0;

    for (const model of candidates) {
      opts.onEvent?.({ type: 'try-model', modelId: model.id });
      const apiKey = env[model.apiKeyEnv];
      if (!apiKey) continue;

      const cacheKey = LlmCache.keyFor({
        stage: stageId,
        modelId: model.id,
        promptVersion: opts.promptVersion,
        messages: opts.messages,
        schemaHash,
        temperature,
      });

      // Cache check
      if (!opts.noCache) {
        const hit = this.cache.get(cacheKey);
        if (hit) {
          const extracted = extractStructured(hit.text, opts.schema);
          if (extracted.value !== undefined) {
            opts.onEvent?.({ type: 'cached', modelId: model.id });
            return {
              value: extracted.value,
              modelId: model.id,
              passes: 0,
              cached: true,
              totalTokenIn: hit.tokenIn,
              totalTokenOut: hit.tokenOut,
            };
          }
        }
      }

      // Live call with repair loop
      let messages = opts.messages.slice();
      let lastResponse: ChatResponse | undefined;
      let passes = 0;
      for (let attempt = 0; attempt <= maxRepairs; attempt += 1) {
        try {
          const callOpts: Parameters<typeof callModel>[2] = {
            messages,
            temperature,
            responseFormat: 'json',
          };
          if (opts.maxTokens !== undefined) callOpts.maxTokens = opts.maxTokens;
          if (opts.signal !== undefined) callOpts.signal = opts.signal;
          lastResponse = await callModel(model, apiKey, callOpts);
          passes += 1;
          totalTokenIn += lastResponse.tokenIn;
          totalTokenOut += lastResponse.tokenOut;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (err instanceof HttpError && !err.retryable) {
            opts.onEvent?.({ type: 'fallback', from: model.id, to: 'next', reason: err.message });
            break; // try next provider
          }
          // transient — retry within same model
          if (attempt < maxRepairs) continue;
          break;
        }

        const extracted = extractStructured(lastResponse.text, opts.schema);
        opts.onEvent?.({
          type: 'extracted',
          modelId: model.id,
          strategies: extracted.attempts.length,
        });

        if (extracted.value !== undefined) {
          if (!opts.noCache) {
            this.cache.set(cacheKey, {
              stage: stageId,
              modelId: model.id,
              text: lastResponse.text,
              tokenIn: lastResponse.tokenIn,
              tokenOut: lastResponse.tokenOut,
            });
          }
          opts.onEvent?.({
            type: 'done',
            modelId: model.id,
            tokenIn: totalTokenIn,
            tokenOut: totalTokenOut,
            passes,
          });
          return {
            value: extracted.value,
            modelId: model.id,
            passes,
            cached: false,
            totalTokenIn,
            totalTokenOut,
          };
        }

        // Schema fail — repair re-prompt (within same model)
        if (attempt < maxRepairs) {
          opts.onEvent?.({
            type: 'schema-fail',
            modelId: model.id,
            error: extracted.schemaErrors ?? 'unknown',
          });
          opts.onEvent?.({ type: 'repair', modelId: model.id, pass: attempt + 1 });
          messages = [
            ...opts.messages,
            { role: 'assistant', content: lastResponse.text },
            {
              role: 'user',
              content: buildRepairPrompt(
                extracted.schemaErrors ?? 'unknown',
                extracted.attempts.length,
              ),
            },
          ];
        } else {
          lastError = new Error(
            `schema rejected after ${attempt + 1} passes: ${extracted.schemaErrors ?? 'unknown'}`,
          );
        }
      }
      // model exhausted — try next in chain
      opts.onEvent?.({
        type: 'fallback',
        from: model.id,
        to: 'next',
        reason: lastError?.message ?? 'exhausted',
      });
    }

    throw new Error(
      `LLM dispatch failed for stage ${stageId}: ${lastError?.message ?? 'no provider responded'}`,
    );
  }

  /** Cheap repair re-prompt to a tiny model — used by external code-validator etc. */
  async repairCheap<T>(
    text: string,
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
    instruction: string,
  ): Promise<T | undefined> {
    const model = cheapestAvailable();
    if (!model) return undefined;
    const apiKey = process.env[model.apiKeyEnv];
    if (!apiKey) return undefined;
    const res = await callModel(model, apiKey, {
      messages: [
        {
          role: 'system',
          content: 'You repair invalid JSON to match a schema. Return only valid JSON.',
        },
        { role: 'user', content: `${instruction}\n\nInput:\n${text}` },
      ],
      temperature: 0,
      responseFormat: 'json',
    });
    return extractStructured(res.text, schema).value;
  }

  close(): void {
    this.cache.close();
  }
}

function buildRepairPrompt(schemaError: string, attempts: number): string {
  return `Your previous output failed validation after ${attempts} extraction attempts. Schema errors:\n${schemaError}\n\nReply with ONLY valid JSON matching the schema. No prose, no markdown fences. Fix every error above.`;
}
