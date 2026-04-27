import type { Stage } from '@skeed/contracts';
import { z } from 'zod';
import { llmOrFallback } from './llm-helper.js';
import { PipelineState } from './state.js';

const PageSlotZ = z.object({
  role: z.string(),
  intent: z.string(),
  candidateIds: z.array(z.string()).default([]),
  chosenId: z.string().nullable(),
});
const PageZ = z.object({
  id: z.string(),
  route: z.string(),
  purpose: z.string(),
  slots: z.array(PageSlotZ),
});
const IaOut = z.object({
  pages: z.array(PageZ).min(1).max(8),
  nav: z.object({
    pattern: z.enum(['tab', 'sidebar', 'bottom', 'top']),
    items: z.array(z.object({ pageId: z.string(), label: z.string(), icon: z.string().optional() })),
  }),
  dataModel: z.array(z.object({ entity: z.string(), fields: z.array(z.object({ name: z.string(), type: z.string() })) })).default([]),
});

const SYSTEM = `You design the information architecture (sitemap + nav + data model) for a product.

Return ONLY JSON:
{
  "pages": [{ "id":"home","route":"/","purpose":"landing","slots":[{ "role":"hero","intent":"...","candidateIds":[],"chosenId":null }] }],
  "nav": { "pattern":"top|sidebar|tab|bottom", "items":[{ "pageId":"home","label":"Home" }] },
  "dataModel": [{ "entity":"User","fields":[{ "name":"email","type":"string" }] }]
}

Rules:
- 1-8 pages. Always include "home".
- Pattern matches density: compact → top, comfortable → top or sidebar, spacious → sidebar.
- dataModel only when persistence is needed.`;

export const stage_14_ia: Stage<PipelineState, PipelineState> = {
  name: '14-ia',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const out = await llmOrFallback(
      {
        stage: '14-ia',
        promptVersion: 'v1',
        system: SYSTEM,
        user: `Idea: ${state.intent?.jobToBeDone}
Demographic: ${state.classification?.candidates[0]?.demographic}
Stories: ${(state.userStories ?? []).map((s) => `[${s.priority}] ${s.iWantTo}`).join(' | ')}

Design the IA now.`,
        schema: IaOut,
        temperature: 0.3,
      },
      () => ({
        pages: [
          {
            id: 'home',
            route: '/',
            purpose: 'landing',
            slots: [
              { role: 'hero', intent: 'state value prop', candidateIds: [], chosenId: null },
              { role: 'features', intent: 'list 3 benefits', candidateIds: [], chosenId: null },
              { role: 'cta', intent: 'capture email or signup', candidateIds: [], chosenId: null },
            ],
          },
          {
            id: 'thanks',
            route: '/thanks',
            purpose: 'confirmation',
            slots: [{ role: 'hero', intent: 'thank user', candidateIds: [], chosenId: null }],
          },
        ],
        nav: { pattern: 'top' as const, items: [{ pageId: 'home', label: 'Home' }] },
        dataModel: [],
      }),
    );
    return { ...state, siteMap: out };
  },
};
