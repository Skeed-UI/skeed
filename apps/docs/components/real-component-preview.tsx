'use client';

import {
  SkeedBadge,
  SkeedButton,
  SkeedChoiceCardGroup,
  SkeedDashboardCard,
  SkeedDataTable,
  SkeedGoalProgress,
  SkeedMetricTrend,
  SkeedPricingCard,
  SkeedPromptComposer,
  SkeedSemanticMatchList,
  SkeedSignupPanel,
  SkeedTextInput,
  SkeedVoiceOrb,
  SkeedWorkoutPlan,
} from '@skeed/ui';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { storyForDemographic } from '@/lib/showcase';

export function RealComponentPreview({
  componentId,
  demographic,
  style,
}: {
  componentId: string;
  demographic: string;
  style?: CSSProperties;
}) {
  const story = storyForDemographic(demographic);
  const kind = componentKind(componentId);

  return (
    <section className="skeed-real-preview" style={style}>
      <div className="skeed-real-preview-topbar">
        <span />
        <span />
        <span />
        <strong>{story.label} preview</strong>
      </div>
      <div className="p-4 md:p-6">
        {kind === 'pricing' ? <PricingPreview story={story} /> : null}
        {kind === 'dashboard' ? <DashboardPreview story={story} /> : null}
        {kind === 'signup' ? <SignupPreview story={story} /> : null}
        {kind === 'choice' ? <ChoicePreview story={story} /> : null}
        {kind === 'ai' ? <AiPreview story={story} /> : null}
        {kind === 'workout' ? <WorkoutPreview story={story} /> : null}
        {kind === 'table' ? <TablePreview story={story} /> : null}
        {kind === 'generic' ? <DashboardPreview story={story} /> : null}
      </div>
    </section>
  );
}

function PricingPreview({ story }: { story: ReturnType<typeof storyForDemographic> }) {
  return (
    <div className="skeed-preview-fit-grid grid gap-4">
      <SkeedPricingCard
        description="For trying the core workflow with guided defaults."
        features={[
          { label: 'Demographic tokens', included: true },
          { label: 'Accessible components', included: true },
          { label: 'MCP install context', included: false },
        ]}
        name="Starter"
        price="$19"
        period="/mo"
      />
      <SkeedPricingCard
        badge={story.category}
        ctaLabel={story.primary}
        description={story.body}
        features={[
          { label: `${story.label} typography and color`, included: true },
          { label: 'CSS-first micro-interactions', included: true },
          { label: 'Agent-readable fit reasons', included: true },
        ]}
        highlighted
        name={story.label}
        price="$49"
        period="/mo"
      />
      <SkeedPricingCard
        description="For teams shipping multiple audience-specific surfaces."
        features={[
          { label: 'Private registry', included: true },
          { label: 'Custom demographic rules', included: true },
          { label: 'Design audit workflow', included: true },
        ]}
        name="Studio"
        price="$149"
        period="/mo"
      />
    </div>
  );
}

function DashboardPreview({ story }: { story: ReturnType<typeof storyForDemographic> }) {
  return (
    <div className="skeed-preview-split-grid grid gap-4">
      <SkeedDashboardCard
        actions={[
          { label: story.primary, href: '#' },
          { label: story.secondary, href: '#' },
        ]}
        description={story.body}
        eyebrow={story.category}
        items={[
          { label: 'Tone', value: story.tone, detail: 'CTA and hierarchy' },
          { label: 'Density', value: story.density, detail: 'Layout rhythm' },
          { label: 'Motion', value: story.motion, detail: 'Interaction cap' },
        ]}
        title={story.headline}
        trend={story.metricDetail}
        trendTone="success"
        value={story.metricValue}
      />
      <div className="grid gap-4">
        <SkeedMetricTrend
          caption={story.metricDetail}
          change="+8%"
          label={story.metricLabel}
          points={[18, 28, 24, 42, 36, 58, 64]}
          trend="up"
          value={story.metricValue}
        />
        <SkeedGoalProgress
          label="68% complete"
          max={100}
          milestones={story.panelItems.map((item, index) => ({
            label: item,
            reached: index < 2,
          }))}
          title={story.panelTitle}
          value={68}
        />
      </div>
    </div>
  );
}

function SignupPreview({ story }: { story: ReturnType<typeof storyForDemographic> }) {
  return (
    <div className="mx-auto max-w-xl">
      <SkeedSignupPanel
        footer={
          <span>
            Tuned for <strong>{story.label.toLowerCase()}</strong>: {story.tone.toLowerCase()}{' '}
            language, {story.density.toLowerCase()} density.
          </span>
        }
        submitLabel={story.primary}
        subtitle={story.body}
        title={story.headline}
      >
        <SkeedTextInput
          autoComplete="name"
          label={story.id === 'kids' ? 'Grown-up email' : 'Name'}
          name="name"
          placeholder={story.id === 'classic' ? 'Avery Stone' : 'Jane Smith'}
          required
        />
        <SkeedTextInput
          autoComplete="email"
          helpText={story.id === 'gov' ? 'Used only for application updates.' : 'No spam. No dark patterns.'}
          label="Email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </SkeedSignupPanel>
    </div>
  );
}

function ChoicePreview({ story }: { story: ReturnType<typeof storyForDemographic> }) {
  const [value, setValue] = useState('recommended');
  const options = useMemo(
    () => [
      {
        description: story.body,
        eyebrow: story.category,
        label: `${story.label} recommended`,
        meta: `${story.tone} tone / ${story.motion}`,
        value: 'recommended',
      },
      {
        description: 'A tighter layout for repeat workflows and dense dashboards.',
        eyebrow: 'Compact',
        label: 'Operator mode',
        meta: 'Precise / fast',
        value: 'operator',
      },
      {
        description: 'A more spacious layout with slower emphasis and stronger guidance.',
        eyebrow: 'Guided',
        label: 'Assisted mode',
        meta: 'Comfy / calm',
        value: 'guided',
      },
    ],
    [story],
  );

  return (
    <SkeedChoiceCardGroup
      helpText="Selection cards use real radio inputs, focus states, and demographic token styling."
      legend="Choose interface posture"
      onChange={setValue}
      options={options}
      value={value}
    />
  );
}

function AiPreview({ story }: { story: ReturnType<typeof storyForDemographic> }) {
  return (
    <div className="skeed-preview-split-grid grid gap-4">
      <div className="grid content-start gap-4">
        <SkeedVoiceOrb label={`${story.label} voice input`} level={78} state="listening" />
        <SkeedPromptComposer
          contextLabel={`${story.label} context loaded`}
          defaultValue={`Generate a ${story.label.toLowerCase()} landing page with ${story.tone.toLowerCase()} hierarchy.`}
          isLoading={false}
          suggestions={[
            {
              id: 'audit',
              label: 'Audit fit',
              prompt: `Audit this UI for ${story.label.toLowerCase()} demographic fit.`,
            },
            {
              id: 'compose',
              label: 'Compose page',
              prompt: `Compose a ${story.label.toLowerCase()} app using flagship Skeed components.`,
            },
          ]}
          submitLabel="Ask Skeed"
        />
      </div>
      <SkeedSemanticMatchList
        matches={[
          {
            excerpt: story.body,
            id: 'match-1',
            score: 94,
            source: 'Skeed registry',
            tags: [story.category, story.tone, story.density],
            title: `${story.label} component fit`,
          },
          {
            excerpt: `Prefers ${story.motion.toLowerCase()} motion and ${story.primary.toLowerCase()} CTA wording.`,
            id: 'match-2',
            score: 88,
            source: 'Demographic rules',
            tags: ['motion', 'cta'],
            title: 'Interaction contract',
          },
        ]}
      />
    </div>
  );
}

function WorkoutPreview({ story }: { story: ReturnType<typeof storyForDemographic> }) {
  return (
    <div className="skeed-preview-split-grid grid gap-4">
      <SkeedWorkoutPlan
        days={[
          { complete: true, day: 'Mon', duration: '32 min', intensity: 'Easy', id: 'mon', title: 'Base run' },
          { complete: true, day: 'Tue', duration: '12 min', intensity: 'Low', id: 'tue', title: 'Mobility' },
          { day: 'Wed', duration: '42 min', intensity: 'Tempo', id: 'wed', title: 'Threshold session' },
          { day: 'Thu', duration: 'Rest', intensity: 'Recovery', id: 'thu', title: 'Sleep focus' },
        ]}
        summary={story.body}
        title={story.panelTitle}
      />
      <SkeedGoalProgress
        label="82% readiness"
        max={100}
        milestones={[
          { label: 'Base mileage', reached: true },
          { label: 'Mobility', reached: true },
          { label: 'Tempo block' },
        ]}
        title={story.metricLabel}
        value={82}
      />
    </div>
  );
}

function TablePreview({ story }: { story: ReturnType<typeof storyForDemographic> }) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="skeed-eyebrow">{story.category}</p>
          <h3 className="mt-1 font-skeed-display text-2xl font-bold">{story.panelTitle}</h3>
        </div>
        <div className="flex gap-2">
          <SkeedBadge intent="success" withDot>
            {story.tone}
          </SkeedBadge>
          <SkeedButton size="sm">{story.primary}</SkeedButton>
        </div>
      </div>
      <SkeedDataTable
        columns={[
          { header: 'Item', key: 'item' },
          { header: 'Owner', key: 'owner' },
          { align: 'right', header: 'Status', key: 'status' },
        ]}
        rows={story.panelItems.map((item, index) => ({
          id: item,
          item,
          owner: index === 0 ? 'Skeed' : story.label,
          status: index === 0 ? 'Ready' : 'Queued',
        }))}
      />
    </div>
  );
}

function componentKind(id: string) {
  if (id.includes('pricing')) return 'pricing';
  if (id.includes('dashboard') || id.includes('metric')) return 'dashboard';
  if (id.includes('signup') || id.includes('login') || id.includes('form')) return 'signup';
  if (id.includes('choice') || id.includes('radio')) return 'choice';
  if (id.includes('command') || id.includes('voice') || id.includes('ai')) return 'ai';
  if (id.includes('workout') || id.includes('fitness') || id.includes('goal')) return 'workout';
  if (id.includes('table') || id.includes('list')) return 'table';
  return 'generic';
}
