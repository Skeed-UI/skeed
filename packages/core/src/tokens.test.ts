import { describe, expect, it } from 'vitest';
import { isTokenRef, parseTokenRef, tokenToCssVar, tokenToVarExpr } from './tokens.js';

describe('parseTokenRef', () => {
  it('parses color.brand.500', () => {
    const ref = parseTokenRef('color.brand.500');
    expect(ref).toEqual({ namespace: 'color', path: ['brand', '500'], raw: 'color.brand.500' });
  });
  it('parses radius.lg', () => {
    expect(parseTokenRef('radius.lg')?.namespace).toBe('radius');
  });
  it('rejects unknown namespace', () => {
    expect(parseTokenRef('foo.bar')).toBeNull();
  });
  it('rejects literal hex', () => {
    expect(isTokenRef('#ffffff')).toBe(false);
  });
});

describe('tokenToCssVar', () => {
  it('emits --skeed-color-brand-500', () => {
    const ref = parseTokenRef('color.brand.500');
    expect(ref).not.toBeNull();
    if (ref) expect(tokenToCssVar(ref)).toBe('--skeed-color-brand-500');
  });
});

describe('tokenToVarExpr', () => {
  it('wraps in var()', () => {
    expect(tokenToVarExpr('radius.0')).toBe('var(--skeed-radius-0)');
  });
});
