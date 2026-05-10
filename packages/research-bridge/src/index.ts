import type {
  PainPoint,
  ResearchBrief,
  ResearchEngine,
  ResearchFindings,
  ResearchScope,
} from '@skeed/contracts';

export type { ResearchEngine } from '@skeed/contracts';
export { BrowserUseResearchBridge } from './browser-use.js';

export interface WebResearchBridgeOptions {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Low-dependency research bridge used by the generation path today.
 * It gathers best-effort public web signals, then normalizes them into the
 * shared ResearchFindings contract. If the web is unavailable it still returns
 * conservative findings with warnings instead of blocking generation.
 */
export class WebResearchBridge implements ResearchEngine {
  readonly id = 'web-research-bridge';
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: WebResearchBridgeOptions = {}) {
    this.timeoutMs = opts.timeoutMs ?? 7000;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async run(brief: ResearchBrief, signal?: AbortSignal): Promise<ResearchFindings> {
    const started = Date.now();
    const warnings: string[] = [];
    const citations: ResearchFindings['citations'] = [];
    const snippets: string[] = [];

    try {
      const web = await this.fetchDuckDuckGo(brief, signal);
      if (web.abstractText) snippets.push(web.abstractText);
      for (const topic of web.relatedTopics.slice(0, 4)) {
        snippets.push(topic.text);
        if (topic.url) citations.push({ title: topic.text.slice(0, 80), url: topic.url });
      }
      if (web.abstractUrl) citations.push({ title: web.heading || brief.idea, url: web.abstractUrl });
    } catch (err) {
      warnings.push(`web research unavailable: ${err instanceof Error ? err.message : String(err)}`);
    }

    const text = snippets.join(' ').toLowerCase();
    const competitors = competitorNames(snippets, brief);
    const regulatory = regulatoryItems(text, brief);
    const infra = infraItems(text, brief);
    const saturation = inferSaturation(text, competitors.length);

    return {
      schemaVersion: 1,
      brief,
      source: 'lite',
      durationMs: Date.now() - started,
      market: {
        tamSignal: marketSignal(brief, snippets, saturation),
        saturation,
        trends: trendsFor(brief, text),
        competitors,
      },
      demographic: {
        validatedPainPoints: brief.painPoints,
        personas: personasFor(brief),
        willingnessToPay: willingnessFor(brief),
        channels: channelsFor(brief),
      },
      regulatory: {
        items: regulatory,
        overallBurden: regulatory.some((item) => item.applicability === 'hard')
          ? 'high'
          : regulatory.length > 0
            ? 'medium'
            : 'low',
      },
      infra: {
        items: infra,
        readiness: infra.some((item) => !item.available) ? 'partial' : 'ready',
      },
      tech: {
        buildComplexity: buildComplexity(brief),
        ossBuildingBlocks: ossBlocksFor(brief),
        risks: risksFor(brief, regulatory),
      },
      citations: dedupeCitations(citations),
      warnings,
    };
  }

  private async fetchDuckDuckGo(
    brief: ResearchBrief,
    signal: AbortSignal | undefined,
  ): Promise<DuckResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), brief.timeoutMs ?? this.timeoutMs);
    const combinedSignal = signal ?? controller.signal;
    try {
      const url = new URL('https://api.duckduckgo.com/');
      url.searchParams.set('q', `${brief.idea} ${brief.niche} market competitors regulation`);
      url.searchParams.set('format', 'json');
      url.searchParams.set('no_html', '1');
      url.searchParams.set('skip_disambig', '1');
      const response = await this.fetchImpl(url, { signal: combinedSignal });
      if (!response.ok) throw new Error(`DuckDuckGo returned ${response.status}`);
      const raw = (await response.json()) as DuckRawResponse;
      return {
        heading: raw.Heading ?? '',
        abstractText: raw.AbstractText ?? '',
        abstractUrl: raw.AbstractURL ?? '',
        relatedTopics: flattenTopics(raw.RelatedTopics ?? []),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

interface DuckRawTopic {
  Text?: string;
  FirstURL?: string;
  Topics?: DuckRawTopic[];
}

interface DuckRawResponse {
  Heading?: string;
  AbstractText?: string;
  AbstractURL?: string;
  RelatedTopics?: DuckRawTopic[];
}

interface DuckResponse {
  heading: string;
  abstractText: string;
  abstractUrl: string;
  relatedTopics: Array<{ text: string; url?: string }>;
}

function flattenTopics(topics: DuckRawTopic[]): Array<{ text: string; url?: string }> {
  const out: Array<{ text: string; url?: string }> = [];
  for (const topic of topics) {
    if (topic.Text) out.push({ text: topic.Text, ...(topic.FirstURL ? { url: topic.FirstURL } : {}) });
    if (topic.Topics) out.push(...flattenTopics(topic.Topics));
  }
  return out;
}

function competitorNames(
  snippets: string[],
  brief: ResearchBrief,
): NonNullable<ResearchFindings['market']>['competitors'] {
  const joined = snippets.join(' ');
  const names = Array.from(
    new Set(
      (joined.match(/\b[A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,2}\b/g) ?? [])
        .filter((name) => !['The', 'This', 'Market', 'Regulation', 'United States'].includes(name))
        .slice(0, 4),
    ),
  );
  if (names.length === 0) names.push(`${titleCase(brief.niche)} incumbents`);
  return names.map((name) => ({
    name,
    positioning: `Known alternative or search result adjacent to ${brief.niche}`,
    strengths: ['existing awareness'],
    weaknesses: ['fit for the target demographic needs validation'],
  }));
}

function regulatoryItems(text: string, brief: ResearchBrief): NonNullable<ResearchFindings['regulatory']>['items'] {
  const items: NonNullable<ResearchFindings['regulatory']>['items'] = [];
  const joined = `${text} ${brief.idea} ${brief.niche}`.toLowerCase();
  if (brief.demographic === 'kids' || /child|kid|school/.test(joined)) {
    items.push({
      jurisdiction: 'US/EU',
      regulation: 'COPPA/GDPR-K',
      applicability: 'hard',
      summary: 'Child-directed products require age-appropriate privacy, parental consent, and data minimization.',
    });
  }
  if (brief.demographic === 'health' || /medical|clinic|patient|therapy|diagnos/.test(joined)) {
    items.push({
      jurisdiction: 'US',
      regulation: 'HIPAA/health privacy',
      applicability: /provider|clinic|patient record/.test(joined) ? 'hard' : 'soft',
      summary: 'Health data workflows need privacy review and clear non-diagnostic boundaries.',
    });
  }
  if (brief.demographic === 'fintech' || /payment|bank|finance|credit|invest/.test(joined)) {
    items.push({
      jurisdiction: 'US/EU',
      regulation: 'PCI/financial compliance',
      applicability: /card|payment|bank|credit/.test(joined) ? 'hard' : 'soft',
      summary: 'Financial products need payment security, disclosures, and jurisdiction-specific review.',
    });
  }
  if (/accessibility|gov|public|education/.test(joined) || brief.demographic === 'gov') {
    items.push({
      jurisdiction: 'US',
      regulation: 'Section 508/WCAG',
      applicability: brief.demographic === 'gov' ? 'hard' : 'soft',
      summary: 'Public-sector and education surfaces should meet stricter accessibility expectations.',
    });
  }
  return items;
}

function infraItems(text: string, brief: ResearchBrief): NonNullable<ResearchFindings['infra']>['items'] {
  const scope = new Set<ResearchScope>(brief.scope);
  if (!scope.has('infra') && !scope.has('tech')) return [];
  const joined = `${text} ${brief.idea}`.toLowerCase();
  return [
    {
      capability: 'Web app scaffold',
      available: true,
      candidates: ['Next.js', 'React', 'TypeScript'],
      notes: 'Core product surface can be generated locally.',
    },
    {
      capability: 'Authentication',
      available: true,
      candidates: ['Clerk', 'Auth.js', 'Supabase Auth'],
      notes: 'Needed when user accounts or private data are in scope.',
    },
    {
      capability: 'AI model integration',
      available: !/realtime video|medical diagnos|legal advice/.test(joined),
      candidates: ['OpenAI', 'Anthropic', 'Google Gemini', 'local LLM'],
      notes: 'High-risk advice domains need additional validation and policy boundaries.',
    },
  ];
}

function inferSaturation(text: string, competitorCount: number): 'low' | 'medium' | 'high' | 'unknown' {
  if (!text) return 'unknown';
  if (/crowded|saturated|many competitors|mature market/.test(text) || competitorCount >= 4) return 'high';
  if (/emerging|new|growing|fragmented/.test(text)) return 'medium';
  return competitorCount >= 2 ? 'medium' : 'low';
}

function marketSignal(
  brief: ResearchBrief,
  snippets: string[],
  saturation: 'low' | 'medium' | 'high' | 'unknown',
): string {
  const evidence = snippets[0]?.slice(0, 220);
  const base = `${titleCase(brief.niche)} for ${brief.demographic} shows ${saturation} saturation.`;
  return evidence ? `${base} Web signal: ${evidence}` : `${base} Treat as unverified until deeper research runs.`;
}

function trendsFor(brief: ResearchBrief, text: string): string[] {
  const trends = ['personalized workflows', 'mobile-first onboarding'];
  if (/ai|automation|agent/.test(`${text} ${brief.idea}`.toLowerCase())) trends.push('AI-assisted workflows');
  if (brief.demographic === 'mental_wellness') trends.push('low-stimulation wellness UX');
  if (brief.demographic === 'special_occasion') trends.push('shareable event microsites');
  return trends;
}

function personasFor(brief: ResearchBrief): string[] {
  return [`Primary ${brief.demographic.replace(/_/g, ' ')} user`, `${titleCase(brief.niche)} decision maker`];
}

function willingnessFor(brief: ResearchBrief): string {
  if (brief.demographic === 'erp' || brief.demographic === 'sales_crm') return 'B2B willingness likely if workflow saves time or revenue leakage.';
  if (brief.demographic === 'kids' || brief.demographic === 'education') return 'Willingness depends on parent, school, or institution buyer trust.';
  return 'Likely moderate; validate with pricing tests before assuming subscription demand.';
}

function channelsFor(brief: ResearchBrief): string[] {
  const byDemo: Partial<Record<typeof brief.demographic, string[]>> = {
    sales_crm: ['LinkedIn', 'sales communities', 'founder-led outbound'],
    special_occasion: ['social sharing', 'event planners', 'search'],
    mental_wellness: ['creator partnerships', 'wellness communities', 'app store search'],
    education: ['teacher communities', 'school pilots', 'content marketing'],
  };
  return byDemo[brief.demographic] ?? ['search', 'communities', 'direct outreach'];
}

function buildComplexity(brief: ResearchBrief): 'weekend' | 'weeks' | 'months' | 'years' {
  const idea = brief.idea.toLowerCase();
  if (/marketplace|payment|realtime|ai|health|legal|finance/.test(idea)) return 'months';
  if (/dashboard|tracker|planner|landing|rsvp|directory/.test(idea)) return 'weeks';
  return 'weeks';
}

function ossBlocksFor(brief: ResearchBrief): string[] {
  const blocks = ['Next.js', 'React', 'Zod'];
  if (/chart|dashboard|analytics/i.test(brief.idea)) blocks.push('Recharts');
  if (/form|survey|intake/i.test(brief.idea)) blocks.push('React Hook Form');
  if (/map|location|listing/i.test(brief.idea)) blocks.push('Mapbox or Leaflet');
  return blocks;
}

function risksFor(
  brief: ResearchBrief,
  regulatory: NonNullable<ResearchFindings['regulatory']>['items'],
): string[] {
  const risks = regulatory.map((item) => `${item.regulation}: ${item.summary}`);
  if (brief.painPoints.some((point: PainPoint) => point.severity >= 4)) {
    risks.push('High-severity pain point needs careful promise framing and support paths.');
  }
  return risks;
}

function dedupeCitations(citations: ResearchFindings['citations']): ResearchFindings['citations'] {
  const seen = new Set<string>();
  return citations.filter((citation) => {
    if (seen.has(citation.url)) return false;
    seen.add(citation.url);
    return true;
  });
}

function titleCase(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
