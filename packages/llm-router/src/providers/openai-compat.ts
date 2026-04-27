import type { ModelEntry } from '../registry.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Native JSON mode if model supports it. Falls back to prompt instruction. */
  responseFormat?: 'json' | 'text';
  signal?: AbortSignal;
}

export interface ChatResponse {
  text: string;
  tokenIn: number;
  tokenOut: number;
  modelId: string;
  raw: unknown;
}

/**
 * Fetch-based chat client. Compatible with any OpenAI-protocol endpoint:
 * DeepSeek, Kimi/Moonshot, Qwen/Dashscope, OpenAI itself, OpenRouter, Google AI Studio (gemma).
 */
export async function openAiCompatChat(
  model: ModelEntry,
  apiKey: string,
  opts: ChatOptions,
): Promise<ChatResponse> {
  if (!model.baseUrl) throw new Error(`model ${model.id} has no baseUrl`);
  const url = `${model.baseUrl.replace(/\/$/, '')}/chat/completions`;

  const body: Record<string, unknown> = {
    model: model.apiModel,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
  };
  if (opts.maxTokens !== undefined) body.max_tokens = opts.maxTokens;
  if (opts.responseFormat === 'json' && model.jsonReliable) {
    body.response_format = { type: 'json_object' };
  }

  const init: RequestInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  };
  if (opts.signal) init.signal = opts.signal;
  const res = await fetch(url, init);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new HttpError(res.status, `${model.id} ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as ChatCompletionResponse;
  const choice = data.choices?.[0];
  if (!choice) throw new Error(`${model.id} returned no choices`);
  return {
    text: choice.message?.content ?? '',
    tokenIn: data.usage?.prompt_tokens ?? 0,
    tokenOut: data.usage?.completion_tokens ?? 0,
    modelId: model.id,
    raw: data,
  };
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
  /** Whether the status code suggests retrying with a different provider helps. */
  get retryable(): boolean {
    return this.status === 429 || this.status === 500 || this.status === 502 || this.status === 503 || this.status === 504;
  }
}
