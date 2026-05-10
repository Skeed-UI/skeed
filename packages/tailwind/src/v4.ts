import {
  type SkeedTailwindOptions,
  createSkeedTailwindPreset,
  getSkeedTypographyPreset,
} from './index.js';

export function createSkeedThemeCss(options: SkeedTailwindOptions = {}): string {
  const preset = createSkeedTailwindPreset(options);
  const duration = preset.theme.extend.transitionDuration;
  const typography = getSkeedTypographyPreset(
    typeof options.typography === 'string' ? options.typography : options.demographic,
  );
  return [
    '@theme {',
    '  --color-skeed-brand: var(--skeed-brand);',
    '  --color-skeed-accent: var(--skeed-accent);',
    '  --color-skeed-bg: var(--skeed-bg);',
    '  --color-skeed-fg: var(--skeed-fg);',
    '  --radius-skeed: var(--skeed-radius);',
    `  --duration-skeed-fast: ${duration['skeed-fast']};`,
    `  --duration-skeed-base: ${duration['skeed-base']};`,
    `  --duration-skeed-slow: ${duration['skeed-slow']};`,
    '  --ease-skeed: var(--skeed-ease);',
    `  --font-skeed-body: ${typography.fonts.body};`,
    `  --font-skeed-display: ${typography.fonts.display};`,
    `  --font-skeed-mono: ${typography.fonts.mono};`,
    `  --text-skeed-hero: ${typography.scale.hero.size};`,
    `  --text-skeed-title: ${typography.scale.title.size};`,
    `  --text-skeed-section: ${typography.scale.section.size};`,
    `  --text-skeed-body: ${typography.scale.body.size};`,
    `  --text-skeed-caption: ${typography.scale.caption.size};`,
    '}',
  ].join('\n');
}
