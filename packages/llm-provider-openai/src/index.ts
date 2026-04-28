import type {
  LLMChatRequest,
  LLMChatResult,
  LLMEmbedRequest,
  LLMEmbedResult,
  LLMMessage,
  LLMProvider,
} from '@skeed/contracts/llm-provider';
import type { z } from 'zod';

interface OpenAIResponse {
  id: string;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number };
  choices: Array<{
    message: { content: string | null };
    finish_reason: string;
  }>;
}

interface OpenAIEmbedResponse {
  model: string;
  data: Array<{ embedding: number[]; index: number }>;
  usage: { prompt_tokens: number; total_tokens: number };
}

export class OpenaiLLMProvider implements LLMProvider {
  readonly id = 'openai';
  readonly supportsCache = true;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  modelFor(tier: 'fast' | 'balanced' | 'strong'): string {
    const models: Record<typeof tier, string> = {
      fast: 'gpt-4o-mini',
      balanced: 'gpt-4o',
      strong: 'gpt-4o',
    };
    return models[tier];
  }

  async chat<T>(req: LLMChatRequest<z.ZodType<T>>): Promise<LLMChatResult<T>> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    const model = this.modelFor(req.modelTier);

    // Convert messages to OpenAI format
    const messages = req.messages.map((m: LLMMessage) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens,
        response_format: { type: 'json_object' },
      }),
      signal: req.signal ?? null,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('OpenAI returned empty content');
    }

    // Parse and validate against schema
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('OpenAI returned invalid JSON');
    }

    // Validate with Zod
    const validated = req.schema.parse(parsed) as T;

    // Calculate cost (approximate, based on GPT-4o pricing)
    const costCents = Math.ceil(
      (data.usage.prompt_tokens * 0.0025 + data.usage.completion_tokens * 0.01) * 100,
    );

    return {
      data: validated,
      tokenIn: data.usage.prompt_tokens,
      tokenOut: data.usage.completion_tokens,
      costCents,
      modelId: data.model,
      cached: false,
    };
  }

  async embed(req: LLMEmbedRequest): Promise<LLMEmbedResult> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    const model = 'text-embedding-3-small';

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: req.texts,
      }),
      signal: req.signal ?? null,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = (await response.json()) as OpenAIEmbedResponse;

    // Sort by index to maintain order
    const vectors = data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);

    // Calculate cost (approximate, $0.02 per 1M tokens)
    const costCents = Math.ceil((data.usage.total_tokens / 1_000_000) * 2 * 100);

    return {
      vectors,
      model: data.model,
      dimension: vectors[0]?.length ?? 0,
      costCents,
    };
  }
}
