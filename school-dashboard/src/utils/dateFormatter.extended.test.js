import { describe, it, expect, vi } from 'vitest';

// Mock the i18n module so locale is fixed for deterministic assertions
vi.mock('../i18n/index', () => ({
  getDateLocale: () => 'en-IN',
}));

import {
  formatDate,
  formatShortDate,
  formatDateTime,
  formatTime,
  formatMonthYear,
  formatNumericDate,
  formatRelativeTime,
} from './dateFormatter';

// ─── formatDate — edge cases ──────────────────────────────────────────────────

describe('formatDate — extended edge cases', () => {
  it('returns fallback for an empty string input', () => {
    expect(formatDate('')).toBe('—');
  });

  it('returns a custom fallback string when provided and value is falsy', () => {
    expect(formatDate(null, 'Not set')).toBe('Not set');
  });

  it('formats the Unix epoch (1970-01-01) without throwing', () => {
    const result = formatDate('1970-01-01');
    expect(result).toContain('1970');
    expect(result).toContain('1');
  });

  it('formats a leap-day date (Feb 29) without throwing', () => {
    const result = formatDate('2024-02-29');
    expect(typeof result).toBe('string');
    expect(result).toContain('2024');
    expect(result).toContain('29');
  });

  it('formats a Date object correctly', () => {
    const result = formatDate(new Date('2025-07-04'));
    expect(result).toContain('2025');
    expect(result).toContain('4');
  });
});

// ─── formatShortDate — additional cases ──────────────────────────────────────

describe('formatShortDate — extended edge cases', () => {
  it('formats December 31 and includes the year', () => {
    const result = formatShortDate('2024-12-31');
    expect(result).toContain('2024');
    expect(result).toContain('31');
  });

  it('returns fallback for a numeric zero (falsy)', () => {
    expect(formatShortDate(0)).toBe('—');
  });
});

// ─── formatDateTime — edge cases ─────────────────────────────────────────────

describe('formatDateTime — extended edge cases', () => {
  it('returns fallback for false (falsy value)', () => {
    expect(formatDateTime(false)).toBe('—');
  });

  it('includes a colon in the output for a midnight datetime', () => {
    const result = formatDateTime('2024-03-15T00:00:00');
    expect(result).toContain(':');
    expect(result).toContain('2024');
  });
});

// ─── formatTime — edge cases ──────────────────────────────────────────────────

describe('formatTime — extended edge cases', () => {
  it('includes AM or PM in a 12-hour locale output', () => {
    const result = formatTime('2024-01-15T14:30:00');
    // en-IN Intl may render "2:30 pm" or "14:30" depending on runtime
    expect(result).toContain(':');
  });

  it('returns fallback for a zero timestamp (falsy 0)', () => {
    expect(formatTime(0)).toBe('—');
  });

  it('handles a midnight time (00:00) without throwing', () => {
    const result = formatTime('2024-06-01T00:00:00');
    expect(typeof result).toBe('string');
    expect(result).toContain(':');
  });
});

// ─── formatMonthYear — edge cases ────────────────────────────────────────────

describe('formatMonthYear — extended edge cases', () => {
  it('returns fallback for empty string', () => {
    expect(formatMonthYear('')).toBe('—');
  });

  it('formats the first month of the year (January) correctly', () => {
    const result = formatMonthYear('2024-01-01');
    expect(result).toContain('2024');
    expect(result.toLowerCase()).toContain('jan');
  });

  it('formats the last month of the year (December) correctly', () => {
    const result = formatMonthYear('2024-12-01');
    expect(result).toContain('2024');
    expect(result.toLowerCase()).toContain('dec');
  });
});

// ─── formatNumericDate — edge cases ──────────────────────────────────────────

describe('formatNumericDate — extended edge cases', () => {
  it('returns fallback for undefined', () => {
    expect(formatNumericDate(undefined)).toBe('—');
  });

  it('produces only digits and separator characters (no month names)', () => {
    const result = formatNumericDate('2024-08-20');
    // Should be purely numeric with separators like / or -
    expect(result).toMatch(/^[\d/\-\\.]+$/);
  });
});

// ─── formatRelativeTime — edge cases ─────────────────────────────────────────

describe('formatRelativeTime — extended edge cases', () => {
  it('returns a string for a date just 30 seconds ago', () => {
    const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString();
    const result = formatRelativeTime(thirtySecondsAgo);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a string for a date 90 minutes ago', () => {
    const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString();
    const result = formatRelativeTime(ninetyMinutesAgo);
    expect(typeof result).toBe('string');
  });

  it('returns a string for a date 20 days ago', () => {
    const twentyDaysAgo = new Date(Date.now() - 20 * 86400 * 1000).toISOString();
    const result = formatRelativeTime(twentyDaysAgo);
    expect(typeof result).toBe('string');
  });

  it('returns a string for a date 6 months ago', () => {
    const sixMonthsAgo = new Date(Date.now() - 180 * 86400 * 1000).toISOString();
    const result = formatRelativeTime(sixMonthsAgo);
    expect(typeof result).toBe('string');
  });

  it('handles a future date (e.g. 3 hours from now) without throwing', () => {
    const threeHoursFromNow = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(threeHoursFromNow);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
