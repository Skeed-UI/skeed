/** Static API-route templates emitted by Stage 17 based on BackendPlan.apiRoutes. */
export const ROUTE_TEMPLATES: Record<string, string> = {
  'rsvp-csv-email': `import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { addRsvp, type Rsvp } from '@/lib/rsvp-store';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const HOST = process.env.HOST_EMAIL ?? '';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const form = await req.formData();
  const entry: Rsvp = {
    name: String(form.get('name') ?? ''),
    email: String(form.get('email') ?? ''),
    attending: String(form.get('attending') ?? 'maybe'),
    guests: Number(form.get('guests') ?? 1),
    note: form.get('note') ? String(form.get('note')) : undefined,
    at: new Date().toISOString(),
  };
  addRsvp(entry);

  if (resend && HOST && process.env.RSVP_DIGEST_CADENCE !== 'digest-only') {
    await resend.emails.send({
      from: 'rsvp@skeed.dev',
      to: HOST,
      subject: \`New RSVP: \${entry.name} (\${entry.attending})\`,
      text: JSON.stringify(entry, null, 2),
    });
  }

  return NextResponse.redirect(new URL('/?rsvp=ok', req.url), { status: 303 });
}
`,
  'rsvp-digest': `import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { stringify } from 'csv-stringify/sync';
import { getRsvps } from '@/lib/rsvp-store';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const HOST = process.env.HOST_EMAIL ?? '';

/**
 * GET /api/rsvp/digest — emails the host a CSV of all RSVPs collected so far.
 * Hook this up to a Vercel Cron, GitHub Actions schedule, or any 'hourly' trigger.
 */
export async function GET(): Promise<NextResponse> {
  const rows = getRsvps();
  if (!resend || !HOST) return NextResponse.json({ skipped: 'no host or key', count: rows.length });
  const csv = stringify(rows, { header: true });
  await resend.emails.send({
    from: 'digest@skeed.dev',
    to: HOST,
    subject: \`RSVP digest (\${rows.length} so far)\`,
    text: 'CSV attached.',
    attachments: [{ filename: 'rsvps.csv', content: csv }],
  });
  return NextResponse.json({ sent: true, count: rows.length });
}
`,
  'rsvp-store-lib': `// Append-only in-memory RSVP log (M2 dev default).
// Production: replace with Supabase / Postgres / KV.
export type Rsvp = { name: string; email: string; attending: string; guests: number; note?: string; at: string };

const _log: Rsvp[] = [];

export function addRsvp(entry: Rsvp): void {
  _log.push(entry);
}

export function getRsvps(): Rsvp[] {
  return _log.slice();
}
`,
  'resend-waitlist': `import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const HOST = process.env.HOST_EMAIL ?? '';
const log: Array<{ email: string; at: string }> = [];

export async function POST(req: NextRequest): Promise<NextResponse> {
  const form = await req.formData();
  const email = String(form.get('email') ?? '').trim();
  if (!email) return NextResponse.redirect(new URL('/?waitlist=error', req.url), { status: 303 });
  log.push({ email, at: new Date().toISOString() });
  if (resend && HOST) {
    await resend.emails.send({ from: 'waitlist@skeed.dev', to: HOST, subject: 'New waitlist signup', text: email });
  }
  return NextResponse.redirect(new URL('/?waitlist=ok', req.url), { status: 303 });
}
`,
};
