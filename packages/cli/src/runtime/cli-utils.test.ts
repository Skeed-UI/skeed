import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { componentFileName, parsePositiveInt, resolveInside } from './cli-utils.js';

describe('componentFileName', () => {
  it('keeps registry ids installable as component files', () => {
    expect(componentFileName('flagship/choice-card-group')).toBe('flagship-choice-card-group.tsx');
    expect(componentFileName('@skeed/flagship/voice-input')).toBe('flagship-voice-input.tsx');
    expect(componentFileName('health/pricing-card/cozy/default')).toBe(
      'health-pricing-card-cozy-default.tsx',
    );
    expect(componentFileName('button')).toBe('button.tsx');
  });

  it('removes unsafe path characters', () => {
    expect(componentFileName('../bad component')).toBe('bad-component.tsx');
  });
});

describe('parsePositiveInt', () => {
  it('uses fallback for missing values and clamps to max', () => {
    expect(parsePositiveInt(undefined, 'limit', 10, 50)).toBe(10);
    expect(parsePositiveInt('200', 'limit', 10, 50)).toBe(50);
  });

  it('rejects invalid values', () => {
    expect(() => parsePositiveInt('0', 'limit', 10)).toThrow('limit');
    expect(() => parsePositiveInt('abc', 'limit', 10)).toThrow('limit');
  });
});

describe('resolveInside', () => {
  it('resolves normal paths inside the root', () => {
    const root = mkdtempSync(join(tmpdir(), 'skeed-cli-'));
    const target = resolveInside(root, 'app/page.tsx');
    expect(relative(root, target)).toBe(join('app', 'page.tsx'));
  });

  it('rejects traversal outside the root', () => {
    const root = mkdtempSync(join(tmpdir(), 'skeed-cli-'));
    expect(() => resolveInside(root, '../outside.tsx')).toThrow('escapes');
  });
});
