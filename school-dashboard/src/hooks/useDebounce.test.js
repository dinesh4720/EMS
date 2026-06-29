// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('a', 400));
    expect(result.current).toBe('a');
  });

  it('does not emit the new value until the delay has elapsed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    // Before the delay, the debounced value is still the previous one.
    act(() => vi.advanceTimersByTime(399));
    expect(result.current).toBe('a');

    // Once the full delay elapses, the latest value is emitted.
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('ab');
  });

  it('collapses rapid changes into a single trailing value (per-keystroke guard)', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), {
      initialProps: { value: '' },
    });

    // Simulate fast typing: each keystroke resets the timer before it can fire.
    for (const value of ['j', 'jo', 'joh', 'john']) {
      rerender({ value });
      act(() => vi.advanceTimersByTime(100));
    }

    // No intermediate value should have been emitted yet.
    expect(result.current).toBe('');

    // After the burst settles for the full delay, only the final value emits.
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe('john');
  });
});
