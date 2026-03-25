import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the i18n module — dateFormatter.js depends on getDateLocale()
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

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns the fallback "—" for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns the fallback "—" for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns a custom fallback when provided', () => {
    expect(formatDate(null, 'N/A')).toBe('N/A');
  });

  it('formats a valid ISO date string into a readable string', () => {
    const result = formatDate('2024-01-15');
    expect(typeof result).toBe('string');
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  it('formats a Date object', () => {
    const date = new Date('2024-06-01');
    const result = formatDate(date);
    expect(result).toContain('2024');
  });

  it('returns fallback for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

// ─── formatShortDate ─────────────────────────────────────────────────────────

describe('formatShortDate', () => {
  it('returns fallback for null', () => {
    expect(formatShortDate(null)).toBe('—');
  });

  it('formats a valid date to a short form', () => {
    const result = formatShortDate('2024-01-15');
    expect(result).toContain('2024');
    expect(result).toMatch(/Jan/i);
  });

  it('returns fallback for empty string', () => {
    expect(formatShortDate('')).toBe('—');
  });
});

// ─── formatDateTime ──────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('returns fallback for null', () => {
    expect(formatDateTime(null)).toBe('—');
  });

  it('formats a valid ISO datetime string', () => {
    const result = formatDateTime('2024-01-15T10:30:00');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(5);
  });

  it('includes both a date part and a time part', () => {
    const result = formatDateTime('2024-06-15T14:45:00');
    // Should contain year and time-related digits
    expect(result).toContain('2024');
    // Should have a colon for time portion
    expect(result).toContain(':');
  });
});

// ─── formatTime ──────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('returns fallback for null', () => {
    expect(formatTime(null)).toBe('—');
  });

  it('formats a datetime to time only', () => {
    const result = formatTime('2024-01-15T09:30:00');
    expect(result).toContain(':');
    // Should not contain the year
    expect(result).not.toContain('2024');
  });

  it('returns fallback for empty string', () => {
    expect(formatTime('')).toBe('—');
  });
});

// ─── formatMonthYear ─────────────────────────────────────────────────────────

describe('formatMonthYear', () => {
  it('returns fallback for null', () => {
    expect(formatMonthYear(null)).toBe('—');
  });

  it('formats a valid date to month + year', () => {
    const result = formatMonthYear('2024-06-01');
    expect(result).toContain('2024');
    // Should contain a month name
    expect(result.length).toBeGreaterThan(4);
  });

  it('should not include a day number in the output', () => {
    // Month-year format should not have a day digit like "15"
    const result = formatMonthYear('2024-06-15');
    // The result should not contain "15"
    expect(result).not.toContain('15');
  });
});

// ─── formatNumericDate ───────────────────────────────────────────────────────

describe('formatNumericDate', () => {
  it('returns fallback for null', () => {
    expect(formatNumericDate(null)).toBe('—');
  });

  it('formats a valid date to numeric form', () => {
    const result = formatNumericDate('2024-01-15');
    // Should contain digits and separators (/ or -)
    expect(result).toMatch(/\d/);
    expect(result).toContain('2024');
  });
});

// ─── formatRelativeTime ───────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('returns fallback for null', () => {
    expect(formatRelativeTime(null)).toBe('—');
  });

  it('returns a string for a recent past date', () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const result = formatRelativeTime(tenMinutesAgo);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a string for a date far in the past (falls back to formatShortDate)', () => {
    const twoYearsAgo = new Date(Date.now() - 730 * 86400 * 1000).toISOString();
    const result = formatRelativeTime(twoYearsAgo);
    expect(typeof result).toBe('string');
  });

  it('returns a string for a date in the future', () => {
    const tomorrow = new Date(Date.now() + 86400 * 1000).toISOString();
    const result = formatRelativeTime(tomorrow);
    expect(typeof result).toBe('string');
  });
});
