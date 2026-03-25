import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn (className merger)', () => {
  it('merges string classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('ignores null', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar');
  });

  it('ignores undefined', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('ignores false', () => {
    expect(cn('foo', false, 'bar')).toBe('foo bar');
  });

  it('ignores 0', () => {
    expect(cn('foo', 0, 'bar')).toBe('foo bar');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });

  it('handles single class', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('flattens nested arrays', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('handles deeply nested arrays', () => {
    expect(cn([['foo', 'bar']])).toBe('foo bar');
  });

  it('trims the result', () => {
    const result = cn(' foo ', ' bar ');
    expect(result.startsWith(' ')).toBe(false);
    expect(result.endsWith(' ')).toBe(false);
  });
});
