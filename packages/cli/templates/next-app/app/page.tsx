export default function HomePage() {
  return (
    <main className="skeed-type-page min-h-screen bg-[var(--skeed-bg)] text-[var(--skeed-fg)]">
      <section className="mx-auto grid min-h-screen w-full max-w-screen-lg items-center px-6 py-16">
        <div className="max-w-2xl">
          <p className="skeed-eyebrow">Generated with Skeed</p>
          <h1 className="skeed-type-hero mt-3">{{ APP_TITLE }}</h1>
          <p className="skeed-type-body skeed-smart-text mt-4 opacity-80">
            A demographic-aware interface scaffold with semantic typography, adaptive layout,
            and CSS-first interaction defaults already wired in.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <a className="skeed-cta-primary" href="#start">
              Start workflow
            </a>
            <a className="skeed-cta-secondary" href="#details">
              Review details
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
