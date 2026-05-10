'use client';

import { RealComponentPreview } from '@/components/real-component-preview';
import { DemographicSurface } from '@/components/ui';
import { previewStyleForDemographic, SHOWCASE_DEMOGRAPHIC_CHOICES } from '@/lib/theme';
import { storyForDemographic } from '@/lib/showcase';

export const previewComponentByDemographic: Record<string, string> = {
  ai_apps: 'ai-apps/command-palette/comfy/default',
  classic: 'classic/pricing-card/cozy/default',
  classic_ancient: 'classic/pricing-card/cozy/default',
  education: 'education/choice-card-group/comfy/default',
  erp: 'productivity/data-table/compact/default',
  fintech: 'fintech/dashboard-card/compact/default',
  gov: 'gov/signup-form/cozy/default',
  health: 'health/dashboard-card/cozy/default',
  hightech: 'ai-apps/command-palette/comfy/default',
  kids: 'kids/choice-card-group/comfy/default',
  legal: 'classic/pricing-card/cozy/default',
  listings: 'marketplace/data-table/compact/default',
  marketplace: 'marketplace/pricing-card/cozy/default',
  mental_wellness: 'mental-wellness/signup-form/comfy/default',
  military: 'gov/data-table/compact/default',
  monitoring: 'productivity/dashboard-card/compact/default',
  productivity: 'productivity/dashboard-card/compact/default',
  religious: 'classic/signup-form/cozy/default',
  sales_crm: 'productivity/dashboard-card/compact/default',
  social: 'social/choice-card-group/cozy/default',
  special_occasion: 'marketplace/signup-form/cozy/default',
  teens: 'education/choice-card-group/comfy/default',
  working_class: 'gov/signup-form/cozy/default',
};

export function DemographicHomeShowcase({
  selected,
  onSelectedChange,
}: {
  selected: string;
  onSelectedChange: (id: string) => void;
}) {
  const story = storyForDemographic(selected);
  const style = previewStyleForDemographic(selected);
  const componentId = previewComponentByDemographic[selected] ?? 'productivity/dashboard-card/cozy/default';

  return (
    <section className="docs-band">
      <div className="mx-auto max-w-docs px-5 py-14">
        <div className="grid gap-8 lg:grid-cols-[.44fr_.56fr] lg:items-start">
          <div>
            <p className="skeed-eyebrow">Live demographic switcher</p>
            <h2 className="skeed-type-title mt-4">Change the target. Watch the UI change.</h2>
            <p className="mt-4 leading-7 text-skeed-muted">
              This is the missing Skeed moment: the same product surface adapts its copy, type,
              palette, CTA posture, density, and motion language when the demographic target changes.
            </p>
            <div className="skeed-target-scroll mt-6 max-h-[28rem] overflow-y-auto pr-2">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {SHOWCASE_DEMOGRAPHIC_CHOICES.map((id) => {
                  const item = storyForDemographic(id);
                  const active = selected === id;
                  return (
                    <button
                      className={`skeed-target-option ${active ? 'is-active' : ''}`}
                      key={id}
                      onClick={() => onSelectedChange(id)}
                      style={previewStyleForDemographic(id)}
                      type="button"
                    >
                      <span>
                        <span className="block text-xs font-bold uppercase tracking-[.1em] text-skeed-muted">
                          {item.category}
                        </span>
                        <span className="mt-1 block font-skeed-display text-lg font-bold">
                          {item.label}
                        </span>
                      </span>
                      <span className="skeed-target-swatch" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="grid gap-5">
            <div className="skeed-home-target-frame" style={style}>
              <DemographicSurface story={story} style={style} />
            </div>
            <RealComponentPreview
              componentId={componentId}
              demographic={selected}
              style={style}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
