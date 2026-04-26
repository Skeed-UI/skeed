import type { z } from 'zod';
import type {
  LLMChatRequest,
  LLMChatResult,
  LLMEmbedRequest,
  LLMEmbedResult,
  LLMProvider,
} from '@skeed/contracts/llm-provider';

export class OpenaiLLMProvider implements LLMProvider {
  readonly id = 'openai';
  readonly supportsCache = false; // TODO: set true if vendor offers prompt caching

  modelFor(_tier: 'fast' | 'balanced' | 'strong'): string {
    // TODO: map tier → concrete model id
    throw new Error('not implemented');
  }

  async chat<T>(_req: LLMChatRequest<z.ZodType<T>>): Promise<LLMChatResult<T>> {
    // TODO: call vendor SDK, validate output against schema, return result
    throw new Error('not implemented');
  }

  async embed?(_req: LLMEmbedRequest): Promise<LLMEmbedResult> {
    throw new Error('not implemented');
  }
}
