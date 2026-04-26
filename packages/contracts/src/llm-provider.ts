import type { z } from 'zod';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  /** When true, this content block is eligible for prompt caching. */
  cacheable?: boolean;
}

export interface LLMChatRequest<TSchema extends z.ZodTypeAny> {
  messages: LLMMessage[];
  /** Required schema; the provider must produce JSON conforming to this Zod schema. */
  schema: TSchema;
  /** Provider-agnostic model id, e.g. "fast" | "balanced" | "strong". */
  modelTier: 'fast' | 'balanced' | 'strong';
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface LLMChatResult<T> {
  data: T;
  tokenIn: number;
  tokenOut: number;
  costCents?: number;
  /** Provider's actual model id (e.g. "claude-sonnet-4-6") for telemetry. */
  modelId: string;
  cached: boolean;
}

export interface LLMEmbedRequest {
  texts: string[];
  signal?: AbortSignal;
}

export interface LLMEmbedResult {
  vectors: number[][];
  model: string;
  dimension: number;
  costCents?: number;
}

/**
 * Plugin contract for any LLM provider.
 * Implementations live in `packages/llm-provider-<name>/`.
 */
export interface LLMProvider {
  readonly id: string;
  /** Whether the provider supports native prompt caching. */
  readonly supportsCache: boolean;
  /** Map a tier to a concrete model id; declared for transparency. */
  modelFor(tier: 'fast' | 'balanced' | 'strong'): string;
  chat<T>(req: LLMChatRequest<z.ZodType<T>>): Promise<LLMChatResult<T>>;
  /** Optional: not all providers offer embeddings. */
  embed?(req: LLMEmbedRequest): Promise<LLMEmbedResult>;
}
