/**
 * Model registry. Adding a new model = one entry here.
 * Provider field decides which client transport handles the call.
 */

export type ProviderId =
  | 'deepseek'
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'gemma'
  | 'kimi'
  | 'qwen'
  | 'openrouter';

export interface ModelEntry {
  id: string;
  provider: ProviderId;
  /** Provider-native model id sent in API request. */
  apiModel: string;
  /** OpenAI-compatible HTTP base URL. Anthropic uses native SDK. */
  baseUrl?: string;
  /** Env var holding the API key. */
  apiKeyEnv: string;
  /** Context window in tokens. */
  contextTokens: number;
  /** Speed tier — used by router to pick fastest model when stage is latency-sensitive. */
  speed: 'fast' | 'medium' | 'slow';
  /** Capability score 1-10 — used by router to pick smartest model when stage is quality-sensitive. */
  iq: number;
  /** Whether the model reliably emits valid JSON when asked. */
  jsonReliable: boolean;
  /** Cost per 1M input tokens, USD. */
  costInPer1m: number;
  /** Cost per 1M output tokens, USD. */
  costOutPer1m: number;
}

/**
 * DeepSeek v4 first. Other models routed by capability tier.
 * `apiModel` strings are intentionally optimistic (forward-compat with newer releases).
 */
export const MODELS: Record<string, ModelEntry> = {
  // DeepSeek v4 — primary default for cheap/fast stages
  'deepseek-v4': {
    id: 'deepseek-v4',
    provider: 'deepseek',
    apiModel: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    contextTokens: 128_000,
    speed: 'fast',
    iq: 8,
    jsonReliable: true,
    costInPer1m: 0.27,
    costOutPer1m: 1.1,
  },
  'deepseek-reasoner': {
    id: 'deepseek-reasoner',
    provider: 'deepseek',
    apiModel: 'deepseek-reasoner',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    contextTokens: 128_000,
    speed: 'slow',
    iq: 9,
    jsonReliable: true,
    costInPer1m: 0.55,
    costOutPer1m: 2.19,
  },
  // Anthropic — high-stakes creative
  'claude-sonnet-4-6': {
    id: 'claude-sonnet-4-6',
    provider: 'anthropic',
    apiModel: 'claude-sonnet-4-6',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    contextTokens: 200_000,
    speed: 'medium',
    iq: 9,
    jsonReliable: true,
    costInPer1m: 3.0,
    costOutPer1m: 15.0,
  },
  'claude-opus-4-7': {
    id: 'claude-opus-4-7',
    provider: 'anthropic',
    apiModel: 'claude-opus-4-7',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    contextTokens: 200_000,
    speed: 'slow',
    iq: 10,
    jsonReliable: true,
    costInPer1m: 15.0,
    costOutPer1m: 75.0,
  },
  // OpenAI — fallback / specific GPT-5 family
  'gpt-5-4': {
    id: 'gpt-5-4',
    provider: 'openai',
    apiModel: 'gpt-5.4',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    contextTokens: 256_000,
    speed: 'medium',
    iq: 9,
    jsonReliable: true,
    costInPer1m: 2.5,
    costOutPer1m: 10.0,
  },
  'gpt-5-5': {
    id: 'gpt-5-5',
    provider: 'openai',
    apiModel: 'gpt-5.5',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    contextTokens: 256_000,
    speed: 'medium',
    iq: 10,
    jsonReliable: true,
    costInPer1m: 5.0,
    costOutPer1m: 20.0,
  },
  // Google Gemma 4 (open-weight, served via Google AI Studio OpenAI-compat or self-hosted)
  'gemma-4': {
    id: 'gemma-4',
    provider: 'gemma',
    apiModel: 'gemma-4-27b-it',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKeyEnv: 'GOOGLE_API_KEY',
    contextTokens: 128_000,
    speed: 'fast',
    iq: 7,
    jsonReliable: false,
    costInPer1m: 0.1,
    costOutPer1m: 0.3,
  },
  // Moonshot Kimi 3.6
  'kimi-3-6': {
    id: 'kimi-3-6',
    provider: 'kimi',
    apiModel: 'kimi-k2-0711-preview',
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKeyEnv: 'MOONSHOT_API_KEY',
    contextTokens: 128_000,
    speed: 'medium',
    iq: 8,
    jsonReliable: true,
    costInPer1m: 1.0,
    costOutPer1m: 3.0,
  },
  // Alibaba Qwen 3.6
  'qwen-3-6': {
    id: 'qwen-3-6',
    provider: 'qwen',
    apiModel: 'qwen-max',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyEnv: 'DASHSCOPE_API_KEY',
    contextTokens: 128_000,
    speed: 'medium',
    iq: 8,
    jsonReliable: true,
    costInPer1m: 0.5,
    costOutPer1m: 1.6,
  },
  // OpenRouter aggregator — unified key for everything else
  'openrouter-default': {
    id: 'openrouter-default',
    provider: 'openrouter',
    apiModel: 'deepseek/deepseek-chat',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    contextTokens: 64_000,
    speed: 'fast',
    iq: 7,
    jsonReliable: true,
    costInPer1m: 0.5,
    costOutPer1m: 1.5,
  },
};

/**
 * Routing policy per pipeline stage. Lists model IDs in fallback order;
 * router tries them in sequence until one succeeds (key present + call OK + extraction OK).
 */
export type StageId =
  | '01-intent'
  | '02-classify'
  | '03-pain-points'
  | '04-score-l1'
  | '07-score-l2'
  | '10-brand-logo'
  | '11-design-system'
  | '12-user-stories'
  | '14-ia'
  | '15-compose';

export const ROUTING: Record<StageId, string[]> = {
  // Cheap, fast — DeepSeek first
  '01-intent': ['deepseek-v4', 'kimi-3-6', 'qwen-3-6', 'gemma-4', 'claude-sonnet-4-6', 'gpt-5-4', 'openrouter-default'],
  '02-classify': ['deepseek-v4', 'kimi-3-6', 'qwen-3-6', 'gemma-4', 'claude-sonnet-4-6', 'gpt-5-4', 'openrouter-default'],
  '03-pain-points': ['deepseek-v4', 'kimi-3-6', 'qwen-3-6', 'claude-sonnet-4-6', 'gpt-5-4', 'openrouter-default'],
  // Scoring — slightly higher iq required
  '04-score-l1': ['deepseek-reasoner', 'claude-sonnet-4-6', 'kimi-3-6', 'gpt-5-4', 'qwen-3-6', 'openrouter-default'],
  '07-score-l2': ['deepseek-reasoner', 'claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-5-5', 'kimi-3-6', 'openrouter-default'],
  // Creative / quality-sensitive — Sonnet first
  '10-brand-logo': ['claude-sonnet-4-6', 'gpt-5-4', 'deepseek-v4', 'kimi-3-6', 'openrouter-default'],
  '11-design-system': ['claude-sonnet-4-6', 'gpt-5-4', 'deepseek-v4', 'kimi-3-6', 'openrouter-default'],
  '12-user-stories': ['deepseek-v4', 'claude-sonnet-4-6', 'kimi-3-6', 'gpt-5-4', 'openrouter-default'],
  // IA + compose — quality matters but volume is high; deepseek first for cost
  '14-ia': ['deepseek-v4', 'claude-sonnet-4-6', 'gpt-5-4', 'kimi-3-6', 'qwen-3-6', 'openrouter-default'],
  '15-compose': ['deepseek-v4', 'claude-sonnet-4-6', 'gpt-5-4', 'kimi-3-6', 'qwen-3-6', 'openrouter-default'],
};

/** Resolve which models in a stage's chain currently have an API key set. */
export function availableForStage(stage: StageId, env = process.env): ModelEntry[] {
  const chain = ROUTING[stage] ?? ['deepseek-v4'];
  const out: ModelEntry[] = [];
  for (const id of chain) {
    const m = MODELS[id];
    if (!m) continue;
    if (env[m.apiKeyEnv]) out.push(m);
  }
  return out;
}

/** Cheapest available model regardless of stage — used by extraction-repair sub-call. */
export function cheapestAvailable(env = process.env): ModelEntry | undefined {
  const sorted = Object.values(MODELS)
    .filter((m) => env[m.apiKeyEnv])
    .sort((a, b) => a.costInPer1m + a.costOutPer1m - (b.costInPer1m + b.costOutPer1m));
  return sorted[0];
}
