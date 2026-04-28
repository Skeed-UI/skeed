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
      },
      () => ({
        stories: [
          {
            id: 'us-1',
            persona: top?.demographic ?? 'user',
            asA: top?.demographic ?? 'user',
            iWantTo: 'understand the product within 10 seconds of landing',
            soThat: 'I can decide whether to engage',
            priority: 'P0' as const,
            acceptanceCriteria: [
              'hero clearly states value prop',
              'one obvious CTA above the fold',
            ],
          },
          {
            id: 'us-2',
            persona: top?.demographic ?? 'user',
            asA: top?.demographic ?? 'user',
            iWantTo: 'sign up or join a waitlist with one form',
            soThat: 'I can be notified when ready',
            priority: 'P0' as const,
            acceptanceCriteria: ['email-only minimum', 'success confirmation visible'],
          },
          {
            id: 'us-3',
            persona: top?.demographic ?? 'user',
            asA: top?.demographic ?? 'user',
            iWantTo: 'see proof that others trust this product',
            soThat: 'I feel safe engaging',
            priority: 'P1' as const,
            acceptanceCriteria: ['testimonial or count', 'trust badge present'],
          },
        ],
      }),
    );
    return { ...state, userStories: out.stories };
  },
};
