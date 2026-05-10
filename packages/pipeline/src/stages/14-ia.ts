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
    items: z.array(
      z.object({ pageId: z.string(), label: z.string(), icon: z.string().optional() }),
    ),
  }),
  dataModel: z
    .array(
      z.object({
        entity: z.string(),
        fields: z.array(z.object({ name: z.string(), type: z.string() })),
      }),
    )
    .default([]),
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
        validate: (value) => validateIa(value),
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

function validateIa(value: z.infer<typeof IaOut>): string[] {
  const issues: string[] = [];
  if (!value.pages.some((page) => page.id === 'home' && page.route === '/')) {
    issues.push('IA must include a home page at /');
  }
  const pageIds = new Set<string>();
  const routes = new Set<string>();
  for (const page of value.pages) {
    if (pageIds.has(page.id)) issues.push(`duplicate page id ${page.id}`);
    pageIds.add(page.id);
    if (routes.has(page.route)) issues.push(`duplicate route ${page.route}`);
    routes.add(page.route);
    if (!page.route.startsWith('/')) issues.push(`page ${page.id} route must start with /`);
    if (!/^[a-z0-9_/-]+$/i.test(page.route)) {
      issues.push(`page ${page.id} route has invalid characters`);
    }
    if (page.slots.length === 0) issues.push(`page ${page.id} has no slots`);
    for (const slot of page.slots) {
      if (slot.role.trim().length === 0) issues.push(`page ${page.id} has empty slot role`);
      if (/<[^>]+>/.test(slot.intent)) issues.push(`page ${page.id} slot intent has placeholder text`);
    }
  }
  for (const item of value.nav.items) {
    if (!pageIds.has(item.pageId)) issues.push(`nav item references missing page ${item.pageId}`);
    if (item.label.trim().length === 0) issues.push(`nav item for ${item.pageId} has empty label`);
  }
  for (const entity of value.dataModel) {
    if (!/^[A-Z][A-Za-z0-9]*$/.test(entity.entity)) {
      issues.push(`data model entity "${entity.entity}" must be PascalCase`);
    }
    const fieldNames = new Set<string>();
    for (const field of entity.fields) {
      if (fieldNames.has(field.name)) {
        issues.push(`entity ${entity.entity} has duplicate field ${field.name}`);
      }
      fieldNames.add(field.name);
    }
  }
  return issues;
}
