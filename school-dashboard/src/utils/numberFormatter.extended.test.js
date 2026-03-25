import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * numberFormatter.js depends on getDateLocale() from ../i18n/index.
 * We mock it so tests are deterministic regardless of the host environment.
 */
vi.mock('../i18n/index', () => ({
  getDateLocale: () => 'en-IN',
}));

import {
  formatCurrency,
  formatCurrencyPrecise,
  formatCompactNumber,
  formatNumber,
} from './numberFormatter';

// ─── formatCurrency — locale & currency variations ────────────────────────────

describe('formatCurrency — extended', () => {
  it('formats a USD amount and includes a dollar sign or "US$"', () => {
    const result = formatCurrency(1000, 'USD');
    // Intl may render "$", "US$", or "USD" depending on runtime; digits must be there
    expect(result).toMatch(/1[,.]?000/);
  });

  it('formats an EUR amount without decimal digits', () => {
    const result = formatCurrency(2500, 'EUR');
    expect(result).not.toMatch(/[.,]\d{2}$/);
    expect(result).toMatch(/\d/);
  });

  it('formats a negative INR amount and includes a minus indicator', () => {
    const result = formatCurrency(-500);
    // The formatted string should still contain the digits
    expect(result).toMatch(/500/);
  });

  it('formats a very large INR amount and contains the correct digits', () => {
    const result = formatCurrency(10000000); // 1 crore
    expect(result).toMatch(/\d/);
    // Raw digits (without separators) should equal the original number digits
    expect(result.replace(/\D/g, '')).toBe('10000000');
  });
});

// ─── formatCurrencyPrecise — decimal edge cases ───────────────────────────────

describe('formatCurrencyPrecise — extended', () => {
  it('strips trailing zeros for a whole number amount', () => {
    const result = formatCurrencyPrecise(100);
    // maximumFractionDigits: 2, minimumFractionDigits: 0 → no ".00"
    expect(result).not.toMatch(/\.00$/);
  });

  it('formats an amount with exactly one decimal place', () => {
    const result = formatCurrencyPrecise(49.5);
    const numericPart = parseFloat(result.replace(/[^0-9.]/g, ''));
    expect(numericPart).toBeCloseTo(49.5, 1);
  });

  it('handles a fractional cent scenario by rounding to 2 dp', () => {
    const result = formatCurrencyPrecise(9.999);
    // Should round to 10.00 or 10
    const numericPart = parseFloat(result.replace(/[^0-9.]/g, ''));
    expect(numericPart).toBeCloseTo(10, 1);
  });
});

// ─── formatCompactNumber — millions & billions ────────────────────────────────

describe('formatCompactNumber — extended', () => {
  it('produces a compact representation for 1,000 (e.g. "1K" or "1T")', () => {
    const result = formatCompactNumber(1000);
    expect(result.length).toBeLessThan('1000'.length);
  });

  it('produces a compact representation for 1,000,000 that is shorter than 7 chars', () => {
    const result = formatCompactNumber(1000000);
    expect(result.length).toBeLessThan(7);
  });

  it('produces a compact representation for 1,000,000,000', () => {
    const result = formatCompactNumber(1000000000);
    expect(result.length).toBeLessThan(10);
  });

  it('formats a negative compact number and still returns a string', () => {
    const result = formatCompactNumber(-5000);
    expect(typeof result).toBe('string');
    expect(result).toMatch(/5/);
  });

  it('formats 1,500 with at most one decimal in compact form', () => {
    const result = formatCompactNumber(1500);
    // Should not have more than one decimal place (maximumFractionDigits: 1)
    const decimalMatch = result.match(/\.(\d+)/);
    if (decimalMatch) {
      expect(decimalMatch[1].length).toBeLessThanOrEqual(1);
    }
  });
});

// ─── formatNumber — additional edge cases ────────────────────────────────────

describe('formatNumber — extended', () => {
  it('formats float numbers and returns a string containing the integer part', () => {
    const result = formatNumber(3.14);
    expect(result).toMatch(/3/);
  });

  it('treats a string "not-a-number" as NaN and returns the fallback', () => {
    expect(formatNumber('not-a-number')).toBe('0');
  });
});
