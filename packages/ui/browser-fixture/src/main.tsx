import { skeedTypographyPresets, skeedVisualPresets } from '@skeed/tailwind';
import { type CSSProperties, StrictMode, useState } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import {
  SkeedAlert,
  SkeedBarList,
  SkeedButton,
  SkeedChoiceCardGroup,
  SkeedCommandPalette,
  SkeedDataTable,
  SkeedDropdownMenu,
  SkeedFileUploader,
  SkeedFitExplanation,
  SkeedGoalProgress,
  SkeedHeatmap,
  SkeedInstallPlanCard,
  SkeedMetricTrend,
  SkeedModal,
  SkeedProgressBar,
  SkeedRadioGroup,
  SkeedSearchBar,
  SkeedSemanticMatchList,
  SkeedSlider,
  SkeedSwitch,
  SkeedTabs,
  SkeedTextInput,
  SkeedVoiceOrb,
} from '../../src';
import './styles.css';

function App(): React.ReactElement {
  const [activeTab, setActiveTab] = useState('overview');
  const [choice, setChoice] = useState('health');
  const [modalOpen, setModalOpen] = useState(false);
  const [radio, setRadio] = useState('calm');
  const [switchEnabled, setSwitchEnabled] = useState(true);
  const [sliderValue, setSliderValue] = useState(42);

  return (
    <main
      className="skeed-type-page min-h-screen px-4 py-6 sm:px-6 lg:px-10"
      data-testid="qa-shell"
    >
      <div className="mx-auto grid max-w-7xl gap-6">
        <header className="grid gap-2">
          <p className="skeed-eyebrow">Browser QA</p>
          <h1 className="skeed-type-hero text-skeed-fg">Skeed UI browser QA</h1>
          <p className="skeed-type-body max-w-3xl text-skeed-muted">
            Representative production surfaces for accessibility, keyboard, motion, responsive, and
            visual smoke checks.
          </p>
        </header>

        <section
          aria-labelledby="demographic-hierarchy-title"
          className="grid gap-4 rounded-skeed border border-skeed-border bg-white p-4 shadow-sm"
        >
          <div className="grid gap-1">
            <p className="skeed-eyebrow">Hierarchy presets</p>
            <h2 className="skeed-type-title" id="demographic-hierarchy-title">
              Audience-specific type and CTA defaults
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {hierarchyPresetCards.map((card) => (
              <article
                className="grid content-between gap-4 rounded-skeed border border-skeed-border bg-skeed-bg p-4"
                key={card.id}
                style={typographyCardStyle(card.id)}
              >
                <div className="grid gap-2">
                  <p className="skeed-eyebrow">{card.label}</p>
                  <h3 className="skeed-type-section">{card.headline}</h3>
                  <p className="skeed-type-body text-skeed-muted">{card.copy}</p>
                </div>
                <a className="skeed-cta-primary" href="#demographic-hierarchy-title">
                  {card.cta}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-skeed border border-skeed-border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <SkeedButton>Primary action</SkeedButton>
            <SkeedButton href="#learn" variant="secondary">
              Learn more
            </SkeedButton>
            <SkeedButton variant="ghost">Ghost action</SkeedButton>
          </div>
          <SkeedAlert intent="success" title="Production signal">
            Motion is CSS-first, forms are labeled, and data displays expose accessible names.
          </SkeedAlert>
          <SkeedProgressBar label="Readiness" value={76} />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-4 rounded-skeed border border-skeed-border bg-white p-4 shadow-sm">
            <SkeedTextInput
              autoComplete="name"
              helpText="Used by keyboard and label tests."
              label="Runner name"
              name="runner"
              placeholder="Ada Lovelace"
            />
            <SkeedSearchBar placeholder="Search workout components" />
            <SkeedRadioGroup
              legend="Motion tone"
              onChange={setRadio}
              options={[
                { label: 'Calm', value: 'calm' },
                { label: 'Precise', value: 'precise' },
                { label: 'Premium', value: 'premium' },
              ]}
              value={radio}
            />
            <SkeedChoiceCardGroup
              legend="Demographic target"
              onChange={setChoice}
              options={[
                {
                  description: 'Shorter motion, reassuring hierarchy, strong contrast.',
                  eyebrow: 'Wellness',
                  label: 'Health',
                  value: 'health',
                },
                {
                  description: 'Dense controls, low-latency feedback, compact information.',
                  eyebrow: 'Work',
                  label: 'Productivity',
                  value: 'productivity',
                },
                {
                  description: 'Expressive state transitions with interruptible feedback.',
                  eyebrow: 'AI',
                  label: 'Assistant',
                  value: 'assistant',
                },
              ]}
              value={choice}
            />
          </div>

          <div className="grid gap-4 rounded-skeed border border-skeed-border bg-white p-4 shadow-sm">
            <SkeedTabs
              activeValue={activeTab}
              items={[
                {
                  content: 'Registry-backed component context is ready.',
                  label: 'Overview',
                  value: 'overview',
                },
                {
                  content: 'Tailwind 3 tokens compile in the browser fixture.',
                  label: 'Tokens',
                  value: 'tokens',
                },
                {
                  content: 'Reduced motion keeps interaction feedback restrained.',
                  label: 'Motion',
                  value: 'motion',
                },
              ]}
              onValueChange={setActiveTab}
            />
            <SkeedDropdownMenu
              items={[
                { label: 'Install component', onClick: () => undefined },
                { label: 'View registry payload', href: '#registry' },
                { disabled: true, label: 'Unavailable action' },
              ]}
              label="Component actions"
            />
            <SkeedCommandPalette
              commands={[
                {
                  description: 'Find components with demographic fit reasons.',
                  label: 'Semantic search',
                  onClick: () => undefined,
                  shortcut: 'S',
                },
                {
                  description: 'Generate an exact Tailwind 3 install plan.',
                  href: '#install',
                  label: 'Install plan',
                  shortcut: 'I',
                },
              ]}
            />
            <SkeedFileUploader accept="image/*" name="asset" />
            <SkeedSwitch
              checked={switchEnabled}
              label="Use CSS-first micro-interactions"
              onChange={(event) => setSwitchEnabled(event.currentTarget.checked)}
            />
            <SkeedSlider
              label="Motion intensity"
              max={100}
              name="motion"
              onChange={(event) => setSliderValue(Number(event.currentTarget.value))}
              value={sliderValue}
            />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <SkeedMetricTrend
            caption="Week over week"
            change="+12%"
            label="Training adherence"
            points={[42, 47, 44, 51, 58, 61, 67]}
            value="87%"
          />
          <SkeedGoalProgress label="32/50 km" max={50} title="Weekly distance" value={32} />
          <div
            className="skeed-hover-lift rounded-skeed border border-skeed-border bg-white p-5 shadow-sm"
            data-testid="motion-card"
          >
            <SkeedVoiceOrb label="Voice coaching input" state="listening" />
          </div>
        </section>

        <section className="grid gap-4 rounded-skeed border border-skeed-border bg-white p-4 shadow-sm">
          <SkeedDataTable
            caption="Plan comparison"
            columns={[
              { header: 'Component', key: 'component' },
              { header: 'Tier', key: 'tier' },
              { header: 'Boundary', key: 'boundary' },
            ]}
            rows={[
              {
                boundary: 'Server-safe',
                component: 'MetricTrend',
                id: 'metric',
                tier: 'Flagship',
              },
              { boundary: 'Client', component: 'Tabs', id: 'tabs', tier: 'Flagship' },
            ]}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <SkeedBarList
              items={[
                { id: 'accessibility', label: 'Accessibility', value: 92 },
                { id: 'performance', label: 'Performance', value: 88 },
                { id: 'motion-restraint', label: 'Motion restraint', value: 81 },
              ]}
            />
            <SkeedHeatmap
              cells={[
                { id: 'mobile', label: 'Mobile', value: 78 },
                { id: 'tablet', label: 'Tablet', value: 82 },
                { id: 'desktop', label: 'Desktop', value: 90 },
                { id: 'reduced-motion', label: 'Reduced motion', value: 86 },
              ]}
            />
          </div>
        </section>

        <section className="skeed-dark grid gap-4 rounded-skeed border border-skeed-border bg-white p-4 shadow-sm md:grid-cols-2">
          <SkeedAlert intent="brand" title="Dark surface check">
            Representative primitives keep readable contrast when the token surface is dark.
          </SkeedAlert>
          <SkeedBarList
            items={[
              { id: 'contrast', label: 'Contrast', value: 94 },
              { id: 'focus', label: 'Focus states', value: 89 },
            ]}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <SkeedSemanticMatchList
            matches={[
              {
                excerpt: 'Clear comparison with native keyboard behavior and demographic slots.',
                id: 'choice-card-group',
                score: 94,
                source: 'Flagship registry',
                tags: ['comparison', 'forms', 'demographic'],
                title: 'ChoiceCardGroup',
              },
              {
                excerpt: 'AI input affordance with reduced-motion-safe status feedback.',
                id: 'voice-orb',
                score: 88,
                source: 'Flagship registry',
                tags: ['ai', 'voice', 'motion'],
                title: 'VoiceOrb',
              },
            ]}
          />
          <SkeedFitExplanation
            audience="Health and wellness runners"
            factors={[
              {
                id: 'density',
                label: 'Readable density',
                rationale: 'Information is grouped into short, scannable panels.',
                score: 90,
              },
              {
                id: 'motion',
                label: 'Motion restraint',
                rationale: 'Continuous effects are limited and respect reduced motion.',
                score: 86,
              },
              {
                id: 'context',
                label: 'Install context',
                rationale: 'Agent-facing install steps explain dependencies and boundaries.',
                score: 92,
              },
            ]}
            summary="Health-focused prompts receive calmer motion, stronger hierarchy, and higher accessibility floors."
          />
          <SkeedInstallPlanCard
            description="Exact dependency, Tailwind, and component steps for agent installation."
            steps={[
              { id: 'install-ui', label: 'Install @skeed/ui', status: 'complete' },
              { id: 'tailwind', label: 'Apply Tailwind 3 preset', status: 'active' },
              { id: 'content', label: 'Bind content slots', status: 'pending' },
            ]}
            title="Install plan"
          />
        </section>

        <div className="pb-8">
          <SkeedButton onClick={() => setModalOpen(true)} variant="secondary">
            Show accessible modal
          </SkeedButton>
        </div>

        <SkeedModal
          description="Dialog labeling is verified by Playwright."
          onClose={() => setModalOpen(false)}
          open={modalOpen}
          title="Accessible modal"
        >
          <p className="text-sm text-skeed-muted">
            This modal closes with a labeled control and native Escape handling.
          </p>
        </SkeedModal>
      </div>
    </main>
  );
}

type TypographyCardId = 'wellness' | 'classic' | 'kids' | 'productivity' | 'ai';
type SkeedCssProperties = CSSProperties & Record<`--${string}`, string>;

const hierarchyPresetCards: Array<{
  id: TypographyCardId;
  label: string;
  headline: string;
  copy: string;
  cta: string;
}> = [
  {
    id: 'wellness',
    label: 'Wellness',
    headline: 'Calm progress without pressure',
    copy: 'Generous line-height and softer CTA geometry keep the page reassuring.',
    cta: 'Begin gently',
  },
  {
    id: 'classic',
    label: 'Classic',
    headline: 'Trust, tradition, and clear action',
    copy: 'Editorial display type gives legal, heritage, and community pages a steadier voice.',
    cta: 'Review details',
  },
  {
    id: 'kids',
    label: 'Kids',
    headline: 'Big steps, friendly feedback',
    copy: 'Larger body text and rounded actions improve readability without chaotic motion.',
    cta: 'Start playing',
  },
  {
    id: 'productivity',
    label: 'Productivity',
    headline: 'Scan faster, decide sooner',
    copy: 'Compact rhythm and restrained controls help dense tools stay calm.',
    cta: 'Open board',
  },
  {
    id: 'ai',
    label: 'AI Apps',
    headline: 'Expressive state, obvious control',
    copy: 'A bolder display scale suits assistants, voice input, and creative tools.',
    cta: 'Ask now',
  },
];

function typographyCardStyle(id: TypographyCardId): SkeedCssProperties {
  const preset = skeedTypographyPresets[id];
  const visual = skeedVisualPresets[id];
  return {
    '--skeed-brand': visual.colors.brand,
    '--skeed-accent': visual.colors.accent,
    '--skeed-bg': visual.colors.bg,
    '--skeed-fg': visual.colors.fg,
    '--skeed-muted': visual.colors.muted,
    '--skeed-border': visual.colors.border,
    '--skeed-success': visual.colors.success,
    '--skeed-danger': visual.colors.danger,
    '--skeed-radius': visual.radius,
    '--skeed-font-body-family': preset.fonts.body,
    '--skeed-font-display-family': preset.fonts.display,
    '--skeed-font-mono-family': preset.fonts.mono,
    '--skeed-type-title-size': preset.scale.title.size,
    '--skeed-type-title-line': preset.scale.title.lineHeight,
    '--skeed-type-title-tracking': preset.scale.title.letterSpacing,
    '--skeed-type-title-weight': preset.scale.title.weight,
    '--skeed-type-section-size': preset.scale.section.size,
    '--skeed-type-section-line': preset.scale.section.lineHeight,
    '--skeed-type-section-tracking': preset.scale.section.letterSpacing,
    '--skeed-type-section-weight': preset.scale.section.weight,
    '--skeed-type-body-size': preset.scale.body.size,
    '--skeed-type-body-line': preset.scale.body.lineHeight,
    '--skeed-type-body-tracking': preset.scale.body.letterSpacing,
    '--skeed-type-body-weight': preset.scale.body.weight,
    '--skeed-type-caption-size': preset.scale.caption.size,
    '--skeed-type-caption-line': preset.scale.caption.lineHeight,
    '--skeed-type-caption-tracking': preset.scale.caption.letterSpacing,
    '--skeed-type-caption-weight': preset.scale.caption.weight,
    '--skeed-eyebrow-tracking':
      id === 'classic' ? '.05em' : id === 'productivity' ? '.04em' : '.06em',
    '--skeed-cta-radius': preset.cta.radius,
    '--skeed-cta-min-height': preset.cta.minHeight,
    '--skeed-cta-padding-x': preset.cta.paddingX,
    '--skeed-cta-shadow': preset.cta.shadow,
    '--skeed-cta-shadow-hover':
      preset.cta.shadow === 'none' ? 'none' : '0 16px 36px rgba(15, 23, 42, .16)',
    '--skeed-cta-primary-weight': preset.cta.primaryWeight,
    '--skeed-cta-secondary-weight': preset.cta.secondaryWeight,
  };
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Skeed UI browser fixture root element was not found.');
}

const globalWithFixtureRoot = globalThis as typeof globalThis & {
  __skeedUiBrowserQaRoot?: Root;
};
const root = globalWithFixtureRoot.__skeedUiBrowserQaRoot ?? createRoot(container);
globalWithFixtureRoot.__skeedUiBrowserQaRoot = root;

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
