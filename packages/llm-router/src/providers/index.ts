import type { ModelEntry } from '../registry.js';
import { anthropicChat } from './anthropic.js';
import { type ChatOptions, type ChatResponse, openAiCompatChat } from './openai-compat.js';

export { type ChatMessage, type ChatOptions, type ChatResponse, HttpError } from './openai-compat.js';

/** Single dispatch surface — picks transport by provider id. */
export async function callModel(
  model: ModelEntry,
  apiKey: string,
  opts: ChatOptions,
): Promise<ChatResponse> {
  if (model.provider === 'anthropic') return anthropicChat(model, apiKey, opts);
  // every other provider speaks the OpenAI completions protocol
  return openAiCompatChat(model, apiKey, opts);
}
