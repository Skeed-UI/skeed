import type {
  ResearchBrief,
  ResearchEngine,
  ResearchFindings,
} from '@skeed/contracts';

export interface BrowserUseResearchOptions {
  apiKey?: string;
  endpoint?: string;
  pollIntervalMs?: number;
  maxPolls?: number;
  fetchImpl?: typeof fetch;
}

interface BrowserUseTaskResponse {
  id?: string;
  task_id?: string;
}

interface BrowserUseStatus {
  status: string;
  output?: string | null;
  result?: string | null;
  finished_at?: string | null;
}

/**
 * Deep research tier powered by browser-use cloud. Runs a structured browser
 * agent to collect competitor / market / regulatory signals from the live web,
 * then maps the agent's JSON output into ResearchFindings. Falls back to lite
 * if the API is unavailable.
 */
export class BrowserUseResearchBridge implements ResearchEngine {
  readonly id = 'browser-use-research';
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly pollIntervalMs: number;
  private readonly maxPolls: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: BrowserUseResearchOptions = {}) {
    const key = opts.apiKey ?? process.env.BROWSER_USE_API_KEY ?? '';
    if (!key) throw new Error('BROWSER_USE_API_KEY is required for BrowserUseResearchBridge');
    this.apiKey = key;
    this.endpoint = (opts.endpoint ?? process.env.BROWSER_USE_API_ENDPOINT ?? 'https://api.browser-use.com').replace(/\/$/, '');
    this.pollIntervalMs = opts.pollIntervalMs ?? 4000;
    this.maxPolls = opts.maxPolls ?? 30;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async run(brief: ResearchBrief, signal?: AbortSignal): Promise<ResearchFindings> {
    const started = Date.now();
    const task = buildTaskPrompt(brief);

    const create = await this.fetchImpl(`${this.endpoint}/api/v1/run-task`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task, save_browser_data: false }),
      ...(signal ? { signal } : {}),
    });
    if (!create.ok) {
      throw new Error(`browser-use create-task failed: ${create.status} ${await create.text()}`);
    }
    const created = (await create.json()) as BrowserUseTaskResponse;
    const id = created.id ?? created.task_id;
    if (!id) throw new Error('browser-use returned no task id');

    let status: BrowserUseStatus | undefined;
    for (let i = 0; i < this.maxPolls; i += 1) {
      await sleep(this.pollIntervalMs);
      const poll = await this.fetchImpl(`${this.endpoint}/api/v1/task/${id}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        ...(signal ? { signal } : {}),
      });
      if (!poll.ok) throw new Error(`browser-use poll failed: ${poll.status}`);
      status = (await poll.json()) as BrowserUseStatus;
      if (isTerminal(status.status)) break;
    }

    if (!status || !isTerminal(status.status)) {
      throw new Error(`browser-use task did not finish in ${(this.pollIntervalMs * this.maxPolls) / 1000}s`);
    }

    const text = (status.output ?? status.result ?? '').toString();
    const json = extractJson(text);

    const findings = mapToFindings(brief, json, Date.now() - started);
    findings.citations = await filterReachableCitations(findings.citations, this.fetchImpl);
    return findings;
  }
}

async function filterReachableCitations(
  citations: ResearchFindings['citations'],
  fetchImpl: typeof fetch,
): Promise<ResearchFindings['citations']> {
  if (citations.length === 0) return citations;
  const checks = citations.map(async (citation) => {
    if (!/^https?:\/\//i.test(citation.url)) return null;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetchImpl(citation.url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
        });
        if (response.ok || (response.status >= 300 && response.status < 400)) return citation;
        if (response.status === 405 || response.status === 403) {
          // Some servers reject HEAD; try GET range
          const get = await fetchImpl(citation.url, {
            method: 'GET',
            signal: controller.signal,
            headers: { Range: 'bytes=0-0' },
          });
          if (get.ok || get.status === 206) return citation;
        }
        return null;
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return null;
    }
  });
  const settled = await Promise.all(checks);
  return settled.filter((c): c is ResearchFindings['citations'][number] => c !== null);
}

function buildTaskPrompt(brief: ResearchBrief): string {
  const pains = brief.painPoints.slice(0, 4).map((p) => p.description ?? '').filter(Boolean).join('; ');
  return `You are researching the market for a product idea. Visit search engines, vendor sites, regulatory pages, and a few credible analyst notes. Return ONLY a single JSON object with this shape (no prose, no markdown fences):
{
  "marketSnapshot": "1-2 sentence TAM signal + saturation read",
  "saturation": "low|medium|high|unknown",
  "competitors": [{"name": "string", "url": "string", "positioning": "string", "strengths": ["..."], "weaknesses": ["..."]}],
  "trends": ["string"],
  "regulatory": [{"jurisdiction": "string", "regulation": "string", "applicability": "hard|soft|speculative", "summary": "string"}],
  "infraReadiness": "ready|partial|not-ready",
  "infraNotes": "string",
  "buildComplexity": "weekend|weeks|months|years",
  "ossBuildingBlocks": ["string"],
  "risks": ["string"],
  "citations": [{"url": "string", "title": "string"}]
}

Idea: """${brief.idea}"""
Demographic: ${brief.demographic}
Niche: ${brief.niche}
Top pain points: ${pains || 'unspecified'}
Scope: ${brief.scope.join(', ')}

Hard rules:
- Visit at least 3 distinct domains.
- Cite real URLs in "citations".
- Do not invent regulations; only include items with real documentation.
- If a field is unknown, use a conservative value rather than fabrication.
- Output ONLY the JSON object.`;
}

interface DeepPayload {
  marketSnapshot?: string;
  saturation?: 'low' | 'medium' | 'high' | 'unknown';
  competitors?: Array<{
    name?: string;
    url?: string;
    positioning?: string;
    strengths?: string[];
    weaknesses?: string[];
  }>;
  trends?: string[];
  regulatory?: Array<{
    jurisdiction?: string;
    regulation?: string;
    applicability?: 'hard' | 'soft' | 'speculative';
    summary?: string;
  }>;
  infraReadiness?: 'ready' | 'partial' | 'not-ready';
  infraNotes?: string;
  buildComplexity?: 'weekend' | 'weeks' | 'months' | 'years';
  ossBuildingBlocks?: string[];
  risks?: string[];
  citations?: Array<{ url?: string; title?: string }>;
}

function mapToFindings(brief: ResearchBrief, payload: DeepPayload, durationMs: number): ResearchFindings {
  const competitors = (payload.competitors ?? []).map((c) => ({
    name: c.name ?? 'unknown',
    ...(c.url ? { url: c.url } : {}),
    positioning: c.positioning ?? '',
    strengths: c.strengths ?? [],
    weaknesses: c.weaknesses ?? [],
  }));
  const regulatory = (payload.regulatory ?? []).map((r) => ({
    jurisdiction: r.jurisdiction ?? 'unknown',
    regulation: r.regulation ?? 'unspecified',
    applicability: r.applicability ?? 'speculative',
    summary: r.summary ?? '',
  }));
  const overallBurden: 'low' | 'medium' | 'high' | 'blocker' = regulatory.some((r) => r.applicability === 'hard')
    ? 'high'
    : regulatory.length > 0
      ? 'medium'
      : 'low';
  return {
    schemaVersion: 1,
    brief,
    source: 'lite',
    durationMs,
    market: {
      tamSignal: payload.marketSnapshot ?? `Web research for ${brief.niche} did not produce a TAM signal.`,
      saturation: payload.saturation ?? 'unknown',
      trends: payload.trends ?? [],
      competitors,
    },
    demographic: {
      validatedPainPoints: brief.painPoints,
      personas: [`Primary ${brief.demographic.replace(/_/g, ' ')} user`],
      willingnessToPay: 'Estimate after live research; validate with pricing tests.',
      channels: [],
    },
    regulatory: { items: regulatory, overallBurden },
    infra: {
      items: [
        {
          capability: payload.infraNotes ?? 'general infrastructure',
          available: payload.infraReadiness === 'ready',
          candidates: [],
          notes: payload.infraNotes ?? '',
        },
      ],
      readiness: payload.infraReadiness ?? 'partial',
    },
    tech: {
      buildComplexity: payload.buildComplexity ?? 'weeks',
      ossBuildingBlocks: payload.ossBuildingBlocks ?? [],
      risks: payload.risks ?? [],
    },
    citations: (payload.citations ?? [])
      .filter((c): c is { url: string; title?: string } => Boolean(c.url))
      .map((c) => ({ url: c.url, title: c.title ?? c.url })),
    warnings: [],
  };
}

function isTerminal(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'finished' || s === 'completed' || s === 'success' || s === 'failed' || s === 'error' || s === 'cancelled' || s === 'stopped';
}

function extractJson(text: string): DeepPayload {
  const trimmed = text.trim();
  if (!trimmed) return {};
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fence ? fence[1] : trimmed) ?? '';
  try {
    return JSON.parse(candidate) as DeepPayload;
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as DeepPayload;
      } catch {
        return {};
      }
    }
    return {};
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
