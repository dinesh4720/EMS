import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatNumber, formatCurrency, formatCurrencyPrecise, formatCompactNumber } from './numberFormatter';

/**
 * numberFormatter.js uses Intl.NumberFormat with getDateLocale() which reads
 * from the i18n module. In the test environment there is no i18n provider,
 * so getDateLocale() may return a browser default.  We focus on structural
 * behaviour (returns a string, handles edge cases) rather than locale-exact
 * output.
 */

// ─── formatNumber ─────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('formats a plain integer and returns a non-empty string', () => {
    const result = formatNumber(1000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns the fallback string for null', () => {
    expect(formatNumber(null)).toBe('0');
  });

  it('returns the fallback string for undefined', () => {
    expect(formatNumber(undefined)).toBe('0');
  });

  it('returns the fallback string for NaN', () => {
    expect(formatNumber(NaN)).toBe('0');
  });

  it('accepts a custom fallback', () => {
    expect(formatNumber(null, '-')).toBe('-');
  });

  it('formats zero', () => {
    const result = formatNumber(0);
    expect(result).toContain('0');
  });

  it('formats a negative number', () => {
    const result = formatNumber(-500);
    expect(result).toContain('500');
  });

  it('formats a large number with grouping separators', () => {
    const result = formatNumber(123456789);
    // Should contain the digits with some separator
    expect(result).toMatch(/\d/);
    expect(result.replace(/\D/g, '')).toBe('123456789');
  });
});

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('returns a string for a positive amount', () => {
    const result = formatCurrency(5000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats zero as "0" (no decimals)', () => {
    const result = formatCurrency(0);
    expect(result).not.toMatch(/\.\d/); // no decimal places
  });

  it('formats null as zero amount', () => {
    const result = formatCurrency(null);
    expect(result).toContain('0');
  });

  it('accepts an explicit currency code', () => {
    // Should not throw for valid currency codes
    expect(() => formatCurrency(100, 'USD')).not.toThrow();
  });

  it('returns maximumFractionDigits = 0 (no decimals for round amounts)', () => {
    const result = formatCurrency(1500);
    // The result should not have a decimal separator followed by digits
    expect(result).not.toMatch(/[.,]\d{2}$/);
  });
});

// ─── formatCurrencyPrecise ────────────────────────────────────────────────────

describe('formatCurrencyPrecise', () => {
  it('returns a string for a precise amount', () => {
    const result = formatCurrencyPrecise(1234.56);
    expect(typeof result).toBe('string');
  });

  it('formats null as zero', () => {
    const result = formatCurrencyPrecise(null);
    expect(result).toContain('0');
  });

  it('does not throw for valid currencies', () => {
    expect(() => formatCurrencyPrecise(99.99, 'EUR')).not.toThrow();
  });

  it('preserves up to two decimal places', () => {
    const result = formatCurrencyPrecise(9.99);
    const digits = result.replace(/[^0-9.]/g, '');
    expect(parseFloat(digits)).toBeCloseTo(9.99, 1);
  });
});

// ─── formatCompactNumber ──────────────────────────────────────────────────────

describe('formatCompactNumber', () => {
  it('returns a compact string for large numbers', () => {
    const result = formatCompactNumber(1000000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeLessThan('1000000'.length);
  });

  it('returns the fallback for null', () => {
    expect(formatCompactNumber(null)).toBe('0');
  });

  it('returns the fallback for NaN', () => {
    expect(formatCompactNumber(NaN)).toBe('0');
  });

  it('accepts a custom fallback', () => {
    expect(formatCompactNumber(undefined, 'N/A')).toBe('N/A');
  });

  it('returns a string for zero', () => {
    const result = formatCompactNumber(0);
    expect(typeof result).toBe('string');
    expect(result).toContain('0');
  });
});
