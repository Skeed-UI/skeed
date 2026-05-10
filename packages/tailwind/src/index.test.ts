import { describe, expect, it } from 'vitest';
import {
  createSkeedTailwindPreset,
  getSkeedTypographyPreset,
  skeedTypographyPresets,
} from './index.js';

describe('@skeed/tailwind typography presets', () => {
  it('maps demographics to appropriate hierarchy presets', () => {
    expect(getSkeedTypographyPreset('health').id).toBe('wellness');
    expect(getSkeedTypographyPreset('sales_crm').id).toBe('productivity');
    expect(getSkeedTypographyPreset('gov').id).toBe('gov');
    expect(getSkeedTypographyPreset('classic').id).toBe('classic');
    expect(getSkeedTypographyPreset('legal').id).toBe('classic');
    expect(getSkeedTypographyPreset('kids').id).toBe('kids');
    expect(getSkeedTypographyPreset('ai_apps').id).toBe('ai');
    expect(getSkeedTypographyPreset('fintech').id).toBe('enterprise');
    expect(getSkeedTypographyPreset('marketplace').id).toBe('productivity');
    expect(getSkeedTypographyPreset('unknown').id).toBe('neutral');
  });

  it('adds semantic font and type scale tokens to the Tailwind preset', () => {
    const preset = createSkeedTailwindPreset({ demographic: 'health' });
    const extend = preset.theme.extend;

    expect(extend.fontFamily['skeed-body']).toBe('var(--skeed-font-body-family)');
    expect(extend.fontSize['skeed-hero'][0]).toBe(skeedTypographyPresets.wellness.scale.hero.size);
    expect(extend.fontSize['skeed-body'][1].lineHeight).toBe(
      skeedTypographyPresets.wellness.scale.body.lineHeight,
    );
  });

  it('lets explicit typography override demographic inference', () => {
    const preset = createSkeedTailwindPreset({ demographic: 'health', typography: 'enterprise' });

    expect(preset.theme.extend.fontSize['skeed-body'][0]).toBe(
      skeedTypographyPresets.enterprise.scale.body.size,
    );
  });
});
