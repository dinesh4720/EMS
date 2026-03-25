import { describe, it, expect } from 'vitest';
import { cn } from './cn';

// cn is a lightweight classname joiner (no twMerge — just filter + flatten + join)

describe('cn — conditional class patterns', () => {
  it('applies truthy conditional classes via &&', () => {
    const isActive = true;
    expect(cn('base', isActive && 'active')).toBe('base active');
  });

  it('omits falsy conditional classes via &&', () => {
    const isActive = false;
    expect(cn('base', isActive && 'active')).toBe('base');
  });

  it('handles ternary conditions', () => {
    const variant = 'primary';
    const result = cn('btn', variant === 'primary' ? 'btn-primary' : 'btn-secondary');
    expect(result).toBe('btn btn-primary');
  });

  it('handles multiple conditional classes', () => {
    const active = true;
    const disabled = false;
    const result = cn('item', active && 'item-active', disabled && 'item-disabled');
    expect(result).toBe('item item-active');
  });

  it('joins more than two classes', () => {
    expect(cn('a', 'b', 'c', 'd')).toBe('a b c d');
  });

  it('handles empty string argument', () => {
    // empty strings are falsy and are filtered out
    const result = cn('foo', '', 'bar');
    expect(result).toBe('foo bar');
  });

  it('flattens two-level nested arrays', () => {
    expect(cn(['a', 'b'], ['c', 'd'])).toBe('a b c d');
  });

  it('handles three-level nested array', () => {
    expect(cn([[['deep']]])).toBe('deep');
  });

  it('returns empty string for all-falsy inputs', () => {
    expect(cn(null, undefined, false, 0)).toBe('');
  });

  it('handles a mix of strings, arrays, and falsy values', () => {
    const result = cn('x', [null, 'y'], false, ['z']);
    expect(result).toContain('x');
    expect(result).toContain('y');
    expect(result).toContain('z');
    expect(result).not.toContain('null');
  });
});
