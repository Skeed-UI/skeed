import type { Stage } from '@skeed/contracts';
import { z } from 'zod';
import { llmOrFallback } from './llm-helper.js';
import { PipelineState } from './state.js';

const StoryZ = z.object({
  id: z.string(),
  persona: z.string(),
  asA: z.string(),
  iWantTo: z.string(),
  soThat: z.string(),
  priority: z.enum(['P0', 'P1', 'P2']),
  acceptanceCriteria: z.array(z.string()).min(1),
});
const StoriesOut = z.object({ stories: z.array(StoryZ).min(3).max(10) });

const SYSTEM = `You write prioritized user stories for a product backlog.

Return ONLY JSON:
{ "stories": [ { "id":"us-1","persona":"...","asA":"...","iWantTo":"...","soThat":"...","priority":"P0|P1|P2","acceptanceCriteria":["..."] } ] }

Rules:
- 3-10 stories.
- Cover P0 (must-have for launch), P1 (delight), P2 (later).
- Each story has ≥1 testable acceptance criterion.
- Persona = the demographic role (e.g. "kid 6-9", "small-business accountant").`;

export const stage_12_user_stories: Stage<PipelineState, PipelineState> = {
  name: '12-user-stories',
  version: '0.2.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const top = state.classification?.candidates[0];
    const out = await llmOrFallback(
      {
        stage: '12-user-stories',
        promptVersion: 'v1',
        system: SYSTEM,
        user: `Idea: ${state.intent?.jobToBeDone ?? state.prompt}
Demographic: ${top?.demographic}/${top?.niche}
Pain points: ${(state.painPoints ?? [])
          .slice(0, 3)
          .map((p) => p.description)
          .join(' | ')}

Write user stories now.`,
        schema: StoriesOut,
        temperature: 0.5,
        validate: (value) => validateStories(value, state.prompt),
      },
      () => ({ stories: fallbackStories(top?.demographic, top?.niche) }),
    );
    return { ...state, userStories: out.stories };
  },
};

function validateStories(value: z.infer<typeof StoriesOut>, prompt: string): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  let hasP0 = false;
  for (const story of value.stories) {
    if (ids.has(story.id)) issues.push(`duplicate story id ${story.id}`);
    ids.add(story.id);
    if (story.priority === 'P0') hasP0 = true;
    if (story.iWantTo.trim().length < 8) issues.push(`story ${story.id} iWantTo too short`);
    if (story.soThat.trim().length < 8) issues.push(`story ${story.id} soThat too short`);
    if (/<[^>]+>/.test(story.iWantTo) || /<[^>]+>/.test(story.soThat)) {
      issues.push(`story ${story.id} contains placeholder text`);
    }
    if (/return only json|prioritized user stories/i.test(`${story.iWantTo} ${story.soThat}`)) {
      issues.push(`story ${story.id} echoes the system prompt`);
    }
    if (story.acceptanceCriteria.some((c) => c.trim().length < 6)) {
      issues.push(`story ${story.id} has trivially short acceptance criteria`);
    }
  }
  if (!hasP0) issues.push('no P0 story present (must-have for launch missing)');
  const promptTerms = prompt.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 4);
  if (promptTerms.length > 0) {
    const haystack = value.stories
      .map((s) => `${s.iWantTo} ${s.soThat} ${s.persona}`.toLowerCase())
      .join(' ');
    if (!promptTerms.some((term) => haystack.includes(term))) {
      issues.push('no story references any prompt term');
    }
  }
  return issues;
}

function fallbackStories(
  demographic = 'user',
  niche = 'general',
): z.infer<typeof StoriesOut>['stories'] {
  const persona = demographic.replace(/_/g, ' ');
  const defaults = [
    {
      iWantTo: `understand the ${niche.replace(/[-_]/g, ' ')} value within 10 seconds`,
      soThat: 'I can decide whether this solves my immediate problem',
    },
    {
      iWantTo: 'complete the first meaningful action without setup friction',
      soThat: 'I experience value before losing motivation',
    },
    {
      iWantTo: 'see trust cues that match my situation',
      soThat: 'I feel safe enough to continue',
    },
  ];
  const byDemo: Partial<Record<string, typeof defaults>> = {
    kids: [
      {
        iWantTo: 'start a simple, age-appropriate activity without confusing choices',
        soThat: 'I can succeed without adult intervention every step',
      },
      {
        iWantTo: 'see progress in a friendly and non-pressuring way',
        soThat: 'I feel encouraged to keep going',
      },
      {
        iWantTo: 'have guardian-visible controls and safety cues',
        soThat: 'my family trusts the experience',
      },
    ],
    fintech: [
      {
        iWantTo: 'see the money impact of each action before I commit',
        soThat: 'I can avoid costly mistakes',
      },
      {
        iWantTo: 'review clear history and status for every transaction-like step',
        soThat: 'I trust the product with sensitive decisions',
      },
      {
        iWantTo: 'complete onboarding with only necessary financial data',
        soThat: 'I do not expose more information than needed',
      },
    ],
    special_occasion: [
      {
        iWantTo: 'share one beautiful page with all event details',
        soThat: 'guests stop asking for repeated clarification',
      },
      {
        iWantTo: 'collect responses with a tone that fits the occasion',
        soThat: 'the experience feels personal rather than transactional',
      },
      {
        iWantTo: 'update details quickly as plans change',
        soThat: 'everyone stays aligned',
      },
    ],
  };
  return (byDemo[demographic] ?? defaults).map((story, index) => ({
    id: `us-${index + 1}`,
    persona,
    asA: persona,
    iWantTo: story.iWantTo,
    soThat: story.soThat,
    priority: index < 2 ? ('P0' as const) : ('P1' as const),
    acceptanceCriteria: [
      index === 0 ? 'primary value is visible above the fold' : 'workflow state is visible',
      'copy is specific to the selected demographic and niche',
    ],
  }));
}
