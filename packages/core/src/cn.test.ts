import { describe, expect, it } from 'vitest';
import { cn } from './cn.js';

describe('cn', () => {
  it('joins truthy strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });
  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
  it('dedupes within a single call', () => {
    expect(cn('a b', 'b c')).toBe('a b c');
  });
  it('handles empty', () => {
    expect(cn()).toBe('');
  });
});
