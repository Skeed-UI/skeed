import type { SectionSpec } from './archetypes.js';

export interface RenderContext {
  projectName: string;
  tagline: string;
  ctaLabel: string;
  features: Array<{ title: string; body: string }>;
  testimonialQuote?: string;
  testimonialAuthor?: string;
  /** Optional event metadata — populated only when demographic = special_occasion. */
  event?: {
    eventDate?: string;
    eventLocation?: string;
    rsvpStyle?: string;
    tasteId?: string;
    tasteLabel?: string;
    musicGenre?: string;
    musicSrc?: string;
  };
}

/** Render an entire landing-page tsx file from a section spec list. */
export function renderLanding(sections: SectionSpec[], ctx: RenderContext): string {
  const blocks = sections.map((s) => renderSection(s, ctx)).filter((b) => b.length > 0);
  // If interactive bits are emitted (RSVP / music toggle), the page must be a client component.
  const needsClient = blocks.some((b) => b.includes('MusicToggle') || b.includes('onClick'));
  const useClient = needsClient ? "'use client';\n\n" : '';
  return `${useClient}export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--skeed-bg)] text-[var(--skeed-fg)]">
${blocks.map((b) => `      ${b.split('\n').join('\n      ')}`).join('\n')}
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-black/5 bg-white/60 p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm opacity-80">{body}</p>
    </article>
  );
}

function WaitlistForm({ ctaLabel }: { ctaLabel: string }) {
  return (
    <form
      action="/api/waitlist"
      method="post"
      className="mx-auto mt-8 flex w-full max-w-md items-center gap-2"
    >
      <input
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className="flex-1 rounded-full border border-black/10 bg-white px-4 py-3 text-sm"
      />
      <button
        type="submit"
        className="rounded-full bg-[var(--skeed-brand)] px-6 py-3 text-sm font-semibold text-white"
      >
        {ctaLabel}
      </button>
    </form>
  );
}

function RsvpForm() {
  return (
    <form
      action="/api/rsvp"
      method="post"
      className="mx-auto mt-8 grid w-full max-w-md gap-3"
    >
      <input name="name" required placeholder="Your name" className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm" />
      <input name="email" type="email" required placeholder="Email" className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm" />
      <select name="attending" className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm">
        <option value="yes">Yes, I'll be there</option>
        <option value="maybe">Maybe</option>
        <option value="no">Can't make it</option>
      </select>
      <input name="guests" type="number" min={1} max={6} defaultValue={1} placeholder="How many guests?" className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm" />
      <textarea name="note" rows={2} placeholder="Note for the host (optional)" className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm" />
      <button type="submit" className="rounded-full bg-[var(--skeed-brand)] px-6 py-3 text-sm font-semibold text-white">
        Send RSVP
      </button>
    </form>
  );
}

function MusicToggle({ src, label }: { src: string; label: string }) {
  return (
    <div className="fixed bottom-4 right-4 rounded-full border border-black/10 bg-white/80 px-3 py-2 text-xs shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={(e) => {
          const audio = (e.currentTarget.nextElementSibling as HTMLAudioElement | null);
          if (!audio) return;
          if (audio.paused) audio.play(); else audio.pause();
        }}
        aria-label={\`Toggle background music: \${label}\`}
      >
        ♪ {label}
      </button>
      <audio src={src} loop preload="none" />
    </div>
  );
}
`;
}

function renderSection(s: SectionSpec, ctx: RenderContext): string {
  switch (s.role) {
    case 'event-hero':
      return `<section className="container mx-auto px-6 py-24 text-center">
  <p className="text-sm uppercase tracking-[0.4em] opacity-60">${escape(ctx.event?.tasteLabel ?? 'You are invited')}</p>
  <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-bold tracking-tight">${escape(ctx.projectName)}</h1>
  <p className="mx-auto mt-6 max-w-xl text-lg opacity-80">${escape(ctx.event?.eventDate ?? ctx.tagline)}${ctx.event?.eventLocation ? ` &middot; ${escape(ctx.event.eventLocation)}` : ''}</p>
  <a href="#rsvp" className="mt-10 inline-block rounded-full bg-[var(--skeed-brand)] px-10 py-4 font-semibold text-white">${escape(ctx.ctaLabel)}</a>
</section>`;
    case 'event-details':
      return `<section id="event-details" className="container mx-auto grid gap-6 px-6 py-16 md:grid-cols-3">
  <Feature title="When" body="${escape(ctx.event?.eventDate ?? 'Date TBA')}" />
  <Feature title="Where" body="${escape(ctx.event?.eventLocation ?? 'Location shared with RSVPs')}" />
  <Feature title="Vibe" body="${escape(ctx.event?.tasteLabel ?? 'Bring your best self')}" />
</section>`;
    case 'rsvp':
      return `<section id="rsvp" className="container mx-auto px-6 py-24 text-center">
  <h2 className="text-3xl font-bold">RSVP</h2>
  <p className="mx-auto mt-3 max-w-md text-sm opacity-80">Quick form. Replies email the host instantly and roll up to a CSV digest hourly.</p>
  <RsvpForm />
</section>`;
    case 'gallery':
      return `<section className="container mx-auto grid gap-4 px-6 py-16 md:grid-cols-3">
  <div className="aspect-video rounded-2xl bg-[var(--skeed-brand)]/10" />
  <div className="aspect-video rounded-2xl bg-[var(--skeed-brand)]/20" />
  <div className="aspect-video rounded-2xl bg-[var(--skeed-brand)]/10" />
</section>`;
    case 'navbar':
      return `<header className="container mx-auto flex items-center justify-between px-6 py-5">
  <div className="flex items-center gap-2">
    <img src="/logo.svg" alt="${escape(ctx.projectName)} logo" width={32} height={32} />
    <span className="font-semibold">${escape(ctx.projectName)}</span>
  </div>
  <nav className="text-sm opacity-80">
    <a href="#features" className="hover:underline">Features</a>
  </nav>
</header>`;
    case 'hero':
      return `<section className="container mx-auto px-6 py-24 text-center">
  <h1 className="mx-auto max-w-2xl text-5xl font-bold tracking-tight">${escape(ctx.projectName)}</h1>
  <p className="mx-auto mt-6 max-w-xl text-lg opacity-80">${escape(ctx.tagline)}</p>
  <a href="#cta" className="mt-10 inline-block rounded-full bg-[var(--skeed-brand)] px-8 py-3 font-semibold text-white">${escape(ctx.ctaLabel)}</a>
</section>`;
    case 'features':
    case 'pain':
      return `<section id="features" className="container mx-auto grid gap-6 px-6 py-16 md:grid-cols-3">
  ${ctx.features
    .map((f) => `<Feature title="${escape(f.title)}" body="${escape(f.body)}" />`)
    .join('\n  ')}
</section>`;
    case 'testimonial':
      return `<section className="container mx-auto px-6 py-16 text-center">
  <blockquote className="mx-auto max-w-2xl text-2xl italic">"${escape(ctx.testimonialQuote ?? 'A standout. Solves a real problem.')}"</blockquote>
  <p className="mt-4 text-sm opacity-70">— ${escape(ctx.testimonialAuthor ?? 'Early user')}</p>
</section>`;
    case 'pricing':
      return `<section className="container mx-auto px-6 py-16">
  <h2 className="text-center text-3xl font-bold">Simple pricing</h2>
  <div className="mx-auto mt-10 max-w-md rounded-2xl border border-black/5 bg-white/60 p-8 text-center shadow-sm">
    <p className="text-4xl font-bold">Free</p>
    <p className="mt-2 text-sm opacity-70">while in beta</p>
  </div>
</section>`;
    case 'faq':
      return `<section className="container mx-auto px-6 py-16">
  <h2 className="text-center text-3xl font-bold">Questions</h2>
  <dl className="mx-auto mt-10 max-w-2xl space-y-6">
    <div><dt className="font-semibold">Is it free?</dt><dd className="mt-1 text-sm opacity-80">Yes during beta.</dd></div>
    <div><dt className="font-semibold">When does it launch?</dt><dd className="mt-1 text-sm opacity-80">Soon. Join the waitlist for updates.</dd></div>
  </dl>
</section>`;
    case 'cta':
      return s.archetypeId === 'signup-form'
        ? `<section id="cta" className="container mx-auto px-6 py-24 text-center">
  <h2 className="text-3xl font-bold">Be first in line</h2>
  <p className="mx-auto mt-3 max-w-md text-sm opacity-80">Join the waitlist. We'll email you when we open access.</p>
  <WaitlistForm ctaLabel="${escape(ctx.ctaLabel)}" />
</section>`
        : `<section id="cta" className="container mx-auto px-6 py-24 text-center">
  <h2 className="text-3xl font-bold">Ready to get started?</h2>
  <a href="#" className="mt-8 inline-block rounded-full bg-[var(--skeed-brand)] px-10 py-4 font-semibold text-white">${escape(ctx.ctaLabel)}</a>
</section>`;
    case 'story-row-1':
    case 'story-row-2':
      return `<section className="container mx-auto grid items-center gap-10 px-6 py-16 md:grid-cols-2">
  <div><h3 className="text-2xl font-semibold">${escape(ctx.features[0]?.title ?? 'Built for you')}</h3><p className="mt-3 text-sm opacity-80">${escape(ctx.features[0]?.body ?? '')}</p></div>
  <div className="aspect-video rounded-2xl bg-[var(--skeed-brand)]/10" />
</section>`;
    case 'footer':
      return `<footer className="container mx-auto px-6 py-10 text-center text-sm opacity-60">${
        ctx.event?.musicSrc
          ? `<MusicToggle src="${escape(ctx.event.musicSrc)}" label="${escape(ctx.event.musicGenre ?? 'music')}" />`
          : ''
      }Built with Skeed</footer>`;
    default:
      return '';
  }
}

function escape(s: string): string {
  return s.replace(/[<>&'"`]/g, (c) => `&#${c.charCodeAt(0)};`);
}
