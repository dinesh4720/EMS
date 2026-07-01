import { describe, it, expect } from 'vitest';
import { calculateAnnualTotal, FREQUENCY_MULTIPLIER } from './feeMath';

describe('calculateAnnualTotal', () => {
  it('returns 0 for an empty list', () => {
    expect(calculateAnnualTotal([])).toBe(0);
  });

  it('multiplies monthly fees by 12', () => {
    expect(calculateAnnualTotal([{ amount: 1000, frequency: 'monthly' }])).toBe(12000);
  });

  it('multiplies quarterly by 4 and yearly by 1', () => {
    expect(
      calculateAnnualTotal([
        { amount: 2500, frequency: 'quarterly' },
        { amount: 5000, frequency: 'yearly' },
      ]),
    ).toBe(2500 * 4 + 5000);
  });

  it('treats one-time as a single charge', () => {
    expect(calculateAnnualTotal([{ amount: 750, frequency: 'one-time' }])).toBe(750);
  });

  it('multiplies term fees by the number of applicable terms', () => {
    expect(
      calculateAnnualTotal([{ amount: 3000, frequency: 'term', applicableTerms: ['T1', 'T2', 'T3'] }]),
    ).toBe(9000);
  });

  it('defaults term fees to 2 terms when applicableTerms is not an array', () => {
    expect(calculateAnnualTotal([{ amount: 3000, frequency: 'term' }])).toBe(6000);
  });

  it('uses at least 1 term even when applicableTerms is empty', () => {
    expect(calculateAnnualTotal([{ amount: 3000, frequency: 'term', applicableTerms: [] }])).toBe(3000);
  });

  it('treats unknown / missing frequency as one-shot (×1) rather than dropping it', () => {
    expect(calculateAnnualTotal([{ amount: 1234, frequency: 'fortnightly' }])).toBe(1234);
    expect(calculateAnnualTotal([{ amount: 1234 }])).toBe(1234);
  });

  it('coerces string amounts and treats invalid/missing amounts as 0', () => {
    expect(calculateAnnualTotal([{ amount: '1000', frequency: 'monthly' }])).toBe(12000);
    expect(calculateAnnualTotal([{ frequency: 'monthly' }])).toBe(0);
    expect(calculateAnnualTotal([{ amount: 'abc', frequency: 'yearly' }])).toBe(0);
  });

  it('sums a mixed realistic structure', () => {
    const heads = [
      { amount: 1500, frequency: 'monthly' },                            // 18000
      { amount: 6000, frequency: 'term', applicableTerms: ['T1', 'T2'] }, // 12000
      { amount: 2000, frequency: 'one-time' },                            // 2000
      { amount: 500, frequency: 'quarterly' },                            // 2000
    ];
    expect(calculateAnnualTotal(heads)).toBe(18000 + 12000 + 2000 + 2000);
  });

  it('exposes the expected frequency multipliers', () => {
    expect(FREQUENCY_MULTIPLIER).toEqual({ monthly: 12, quarterly: 4, yearly: 1, 'one-time': 1 });
  });
});
