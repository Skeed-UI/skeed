import type { Stage } from '@skeed/contracts';
import { PipelineState } from './state.js';

/**
 * Stage 14.5 — Backend Selector. New stage (not in plan.md original).
 * Rule-based dispatch on user-story keywords + IA signals.
 */
export const stage_14_5_backend_selector: Stage<PipelineState, PipelineState> = {
  name: '14-5-backend-selector',
  version: '0.1.0',
  inputSchema: PipelineState,
  outputSchema: PipelineState,
  cacheable: true,
  async run(state) {
    const stories = state.userStories ?? [];
    const text =
      stories
        .map((s) => `${s.iWantTo} ${s.soThat}`)
        .join(' ')
        .toLowerCase() +
      ' ' +
      state.prompt.toLowerCase();
    const stack: string[] = [];
    const npmPackages: string[] = [];
    const envVars: { name: string; required: boolean; example?: string }[] = [];
    const apiRoutes: { path: string; template: string }[] = [];

    const isSpecialOccasion =
      state.classification?.candidates[0]?.demographic === 'special_occasion';
    if (isSpecialOccasion || /\brsvp\b|invite|guest list/.test(text)) {
      stack.push('rsvp-csv-email');
      npmPackages.push('resend', 'csv-stringify');
      envVars.push(
        { name: 'RESEND_API_KEY', required: true, example: 're_xxx' },
        { name: 'HOST_EMAIL', required: true, example: 'host@example.com' },
        { name: 'RSVP_DIGEST_CADENCE', required: false, example: 'hourly' },
      );
      apiRoutes.push({ path: 'app/api/rsvp/route.ts', template: 'rsvp-csv-email' });
      apiRoutes.push({ path: 'app/api/rsvp/digest/route.ts', template: 'rsvp-digest' });
      apiRoutes.push({ path: 'lib/rsvp-store.ts', template: 'rsvp-store-lib' });
    }

    if (/email|notify|newsletter|waitlist/.test(text) && !stack.includes('rsvp-csv-email')) {
      stack.push('resend');
      npmPackages.push('resend');
      envVars.push({ name: 'RESEND_API_KEY', required: true, example: 're_xxx' });
      apiRoutes.push({ path: 'app/api/waitlist/route.ts', template: 'resend-waitlist' });
    }
    if (/sign\s?in|account|login|auth/.test(text)) {
      stack.push('nextauth', 'supabase');
      npmPackages.push('next-auth', '@supabase/supabase-js');
      envVars.push(
        { name: 'NEXTAUTH_SECRET', required: true },
        { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true },
        { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true },
      );
    }
    if (/pay|subscribe|checkout|pricing tier/.test(text)) {
      stack.push('stripe');
      npmPackages.push('stripe');
      envVars.push({ name: 'STRIPE_SECRET_KEY', required: true, example: 'sk_test_xxx' });
    }
    if (/\bai\b|chat|summari[sz]e|generate/.test(text)) {
      stack.push('anthropic-ai-sdk');
      npmPackages.push('ai', '@ai-sdk/anthropic');
      envVars.push({ name: 'ANTHROPIC_API_KEY', required: true, example: 'sk-ant-xxx' });
    }
    if (/upload|image|file/.test(text) && !stack.includes('supabase')) {
      stack.push('supabase');
      npmPackages.push('@supabase/supabase-js');
    }

    return {
      ...state,
      backendPlan: {
        stack: stack.length > 0 ? stack : ['none'],
        envVars,
        npmPackages,
        apiRoutes,
        migrations: [],
      },
    };
  },
};
