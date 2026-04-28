import type { ModelEntry } from '../registry.js';
import type { ChatMessage, ChatOptions, ChatResponse } from './openai-compat.js';
import { HttpError } from './openai-compat.js';

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

/** Native Anthropic Messages API call. */
export async function anthropicChat(
  model: ModelEntry,
  apiKey: string,
  opts: ChatOptions,
): Promise<ChatResponse> {
  const { system, user } = splitSystem(opts.messages);
  const body: Record<string, unknown> = {
    model: model.apiModel,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.2,
    messages: user,
  };
  if (system) body.system = system;

  const init: RequestInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  };
  if (opts.signal) init.signal = opts.signal;
  const res = await fetch(ANTHROPIC_BASE, init);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new HttpError(res.status, `${model.id} ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as AnthropicResponse;
  const text = data.content?.map((c) => (c.type === 'text' ? c.text : '')).join('') ?? '';
  return {
    text,
    tokenIn: data.usage?.input_tokens ?? 0,
    tokenOut: data.usage?.output_tokens ?? 0,
    modelId: model.id,
    raw: data,
  };
}

function splitSystem(messages: ChatMessage[]): {
  system: string | undefined;
  user: Array<{ role: 'user' | 'assistant'; content: string }>;
} {
  const sys: string[] = [];
  const rest: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (const m of messages) {
    if (m.role === 'system') sys.push(m.content);
    else rest.push({ role: m.role, content: m.content });
  }
  return { system: sys.length > 0 ? sys.join('\n\n') : undefined, user: rest };
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
}
