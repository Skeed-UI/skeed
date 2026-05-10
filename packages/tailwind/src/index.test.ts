import { describe, expect, it } from 'vitest';
import {
  createSkeedTailwindPreset,
  getSkeedTypographyPreset,
  getSkeedVisualPreset,
  skeedTypographyPresets,
  skeedVisualPresets,
} from './index.js';

function luminance(hex: string): number {
  const rgb = hex
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });

  if (!rgb) {
    throw new Error(`Expected a six-digit hex color, received ${hex}`);
  }

  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

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
    expect(extend.colors.skeed.warning).toBe('var(--skeed-warning)');
    expect(extend.spacing['skeed-spacing-md']).toBe('var(--skeed-spacing-md)');
    expect(extend.borderRadius['skeed-radius-md']).toBe('var(--skeed-radius-md)');
    expect(extend.boxShadow['skeed-shadow-md']).toBe('var(--skeed-shadow-md)');
    expect(extend.transitionDuration['skeed-motion-duration-fast']).toBe('90ms');
  });

  it('lets explicit typography override demographic inference', () => {
    const preset = createSkeedTailwindPreset({ demographic: 'health', typography: 'enterprise' });

    expect(preset.theme.extend.fontSize['skeed-body'][0]).toBe(
      skeedTypographyPresets.enterprise.scale.body.size,
    );
  });

  it('maps demographics to visual token presets', () => {
    expect(getSkeedVisualPreset('kids').id).toBe('kids');
    expect(getSkeedVisualPreset('legal').id).toBe('classic');
    expect(skeedVisualPresets.wellness.colors.brand).not.toBe(skeedVisualPresets.ai.colors.brand);
  });

  it('keeps demographic visual accents and primary CTAs above WCAG AA contrast', () => {
    for (const preset of Object.values(skeedVisualPresets)) {
      expect(contrast(preset.colors.accent, preset.colors.bg), preset.id).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrast('#ffffff', preset.colors.brand), preset.id).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('uses stable type sizes and non-negative tracking in every preset', () => {
    for (const preset of Object.values(skeedTypographyPresets)) {
      for (const step of Object.values(preset.scale)) {
        expect(step.size, preset.id).not.toMatch(/vw|vh|vmin|vmax|clamp/i);
        expect(step.letterSpacing, preset.id).not.toMatch(/^-/);
      }
    }
  });
});
