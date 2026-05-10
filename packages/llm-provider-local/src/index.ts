import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import type {
  LLMChatRequest,
  LLMChatResult,
  LLMMessage,
  LLMProvider,
} from '@skeed/contracts/llm-provider';
import { type Llama, LlamaChatSession, type LlamaModel, getLlama } from 'node-llama-cpp';
import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Default model: Qwen 2.5 0.5B Instruct (small, fast, Apache 2.0)
const DEFAULT_MODEL = {
  name: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
  url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
  sizeMB: 350,
};

interface LocalModelConfig {
  modelPath: string;
  downloaded: boolean;
}

export class LocalLLMProvider implements LLMProvider {
  readonly id = 'local';
  readonly supportsCache = false;
  private _llama: Llama | undefined;
  private model: LlamaModel | undefined;
  private config: LocalModelConfig;

  constructor() {
    const modelDir = join(homedir(), '.skeed', 'models');
    this.config = {
      modelPath: join(modelDir, DEFAULT_MODEL.name),
      downloaded: false,
    };
  }

  modelFor(tier: 'fast' | 'balanced' | 'strong'): string {
    // Only one model for now
    return DEFAULT_MODEL.name;
  }

  /**
   * Check if model is downloaded and ready to use
   */
  isReady(): boolean {
    return existsSync(this.config.modelPath);
  }

  /**
   * Static check if local model is available (without instantiating)
   */
  static isAvailable(): boolean {
    const modelDir = join(homedir(), '.skeed', 'models');
    const modelPath = join(modelDir, DEFAULT_MODEL.name);
    return existsSync(modelPath);
  }

  /**
   * Get the path to the model file
   */
  static getModelPath(): string {
    const modelDir = join(homedir(), '.skeed', 'models');
    return join(modelDir, DEFAULT_MODEL.name);
  }

  /**
   * Get model download path
   */
  getModelPath(): string {
    return this.config.modelPath;
  }

  /**
   * Download the model with progress reporting
   */
  async downloadModel(onProgress?: (downloadedMB: number, totalMB: number) => void): Promise<void> {
    const modelDir = dirname(this.config.modelPath);

    // Create directory if needed
    if (!existsSync(modelDir)) {
      await mkdir(modelDir, { recursive: true });
    }

    // Check if already downloaded
    if (existsSync(this.config.modelPath)) {
      return;
    }

    // Download with progress
    const response = await fetch(DEFAULT_MODEL.url);
    if (!response.ok) {
      throw new Error(`Failed to download model: ${response.status} ${response.statusText}`);
    }

    const totalBytes = Number.parseInt(response.headers.get('content-length') ?? '0');
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const chunks: Uint8Array[] = [];
    let downloadedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      downloadedBytes += value.length;

      if (onProgress && totalBytes > 0) {
        onProgress(downloadedBytes / (1024 * 1024), totalBytes / (1024 * 1024));
      }
    }

    // Combine chunks and write to file
    const data = new Uint8Array(downloadedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.length;
    }

    await writeFile(this.config.modelPath, data);
  }

  /**
   * Initialize the model (lazy loading)
   */
  private async initModel(): Promise<LlamaModel> {
    if (this.model) return this.model;

    if (!existsSync(this.config.modelPath)) {
      throw new Error(
        `Local model not found at ${this.config.modelPath}. ` +
          `Run 'await provider.downloadModel()' first or use the CLI prompt.`,
      );
    }

    this._llama = await getLlama();
    this.model = await this._llama.loadModel({
      modelPath: this.config.modelPath,
      gpuLayers: 0, // CPU only for broad compatibility
    });

    return this.model;
  }

  async chat<T>(req: LLMChatRequest<z.ZodType<T>>): Promise<LLMChatResult<T>> {
    const model = await this.initModel();

    // Build prompt + grammar before context allocation so failures don't leak memory
    const prompt = this.buildPrompt(req.messages);
    const jsonSchema = zodToJsonSchema(req.schema, {
      target: 'openApi3',
      $refStrategy: 'none',
    });
    const grammar = await this._llama!.createGrammarForJsonSchema(
      jsonSchema as Parameters<Llama['createGrammarForJsonSchema']>[0],
    );

    const context = await model.createContext();
    try {
      const session = new LlamaChatSession({
        contextSequence: context.getSequence(),
      });

      const result = await session.prompt(prompt, {
        temperature: req.temperature ?? 0.7,
        maxTokens: req.maxTokens ?? 1024,
        grammar,
      });

      const parsed = grammar.parse(result);
      const validated = req.schema.parse(parsed) as T;

      const promptTokens = Math.ceil(prompt.length / 4);
      const completionTokens = Math.ceil(result.length / 4);

      session.dispose();

      return {
        data: validated,
        tokenIn: promptTokens,
        tokenOut: completionTokens,
        costCents: 0,
        modelId: DEFAULT_MODEL.name,
        cached: false,
      };
    } finally {
      try {
        await context.dispose();
      } catch {
        /* ignore disposal errors */
      }
    }
  }

  private buildPrompt(messages: LLMMessage[]): string {
    // Qwen 2.5 uses ChatML format
    let prompt = '';
    let hasSystem = false;

    for (const msg of messages) {
      if (msg.role === 'system') {
        hasSystem = true;
        // Add strong JSON formatting instruction for small models
        const enhancedContent =
          msg.content +
          '\n\nCRITICAL: You must output ONLY valid JSON. No markdown, no explanation, no prose. Just pure JSON that matches the schema exactly.';
        prompt += `<|im_start|>system\n${enhancedContent}<|im_end|>\n`;
      } else if (msg.role === 'user') {
        prompt += `<|im_start|>user\n${msg.content}<|im_end|>\n`;
      } else if (msg.role === 'assistant') {
        prompt += `<|im_start|>assistant\n${msg.content}<|im_end|>\n`;
      }
    }

    // Add system message if not present
    if (!hasSystem) {
      prompt =
        `<|im_start|>system\nYou must output ONLY valid JSON. No markdown, no explanation, no prose. Just pure JSON.<|im_end|>\n` +
        prompt;
    }

    prompt += '<|im_start|>assistant\n';
    return prompt;
  }
}

/**
 * Check if local model is available and prompt for download if not
 */
export async function ensureLocalModel(): Promise<LocalLLMProvider> {
  const provider = new LocalLLMProvider();

  if (provider.isReady()) {
    return provider;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => resolve(answer.trim()));
    });
  };

  console.log('\n📦 Local LLM Model Setup');
  console.log(`To generate better scaffolds without API keys, Skeed can use a local AI model.`);
  console.log(`Model: Qwen 2.5 0.5B Instruct (~350MB download)`);
  console.log(`This runs entirely on your CPU - no data sent to external APIs.\n`);

  const answer = await question('Download and use local model? (y/n): ');

  if (answer.toLowerCase() === 'y') {
    console.log('\n⬇️  Downloading model...');

    await provider.downloadModel((downloaded, total) => {
      const percent = Math.round((downloaded / total) * 100);
      process.stdout.write(
        `\r   Progress: ${percent}% (${downloaded.toFixed(1)} / ${total.toFixed(1)} MB)`,
      );
    });

    console.log('\n✅ Model downloaded successfully!\n');
  }

  rl.close();
  return provider;
}
