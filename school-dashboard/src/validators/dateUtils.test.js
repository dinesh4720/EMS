import { describe, it, expect } from 'vitest';
import { ddmmyyToIso, isoToDdmmyy } from './dateUtils';

// ---------------------------------------------------------------------------
// ddmmyyToIso — converts DD/MM/YYYY → YYYY-MM-DD
// ---------------------------------------------------------------------------
describe('ddmmyyToIso', () => {
  it('converts a valid date correctly', () => {
    expect(ddmmyyToIso('15/08/2023')).toBe('2023-08-15');
  });

  it('converts the first day of the year', () => {
    expect(ddmmyyToIso('01/01/2000')).toBe('2000-01-01');
  });

  it('converts the last day of the year', () => {
    expect(ddmmyyToIso('31/12/1999')).toBe('1999-12-31');
  });

  it('returns empty string for null input', () => {
    expect(ddmmyyToIso(null)).toBe('');
  });

  it('returns empty string for undefined input', () => {
    expect(ddmmyyToIso(undefined)).toBe('');
  });

  it('returns empty string for empty string input', () => {
    expect(ddmmyyToIso('')).toBe('');
  });

  it('returns empty string when given a number instead of a string', () => {
    expect(ddmmyyToIso(20230815)).toBe('');
  });

  it('returns empty string for ISO format input (wrong format)', () => {
    expect(ddmmyyToIso('2023-08-15')).toBe('');
  });

  it('returns empty string for a date with wrong separator (dots)', () => {
    expect(ddmmyyToIso('15.08.2023')).toBe('');
  });

  it('returns empty string for a date with a 2-digit year', () => {
    expect(ddmmyyToIso('15/08/23')).toBe('');
  });

  it('returns empty string for a partial date string', () => {
    expect(ddmmyyToIso('15/08')).toBe('');
  });

  it('returns empty string for a random non-date string', () => {
    expect(ddmmyyToIso('not-a-date')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// isoToDdmmyy — converts YYYY-MM-DD → DD/MM/YYYY
// ---------------------------------------------------------------------------
describe('isoToDdmmyy', () => {
  it('converts a valid ISO date correctly', () => {
    expect(isoToDdmmyy('2023-08-15')).toBe('15/08/2023');
  });

  it('converts the first day of the year', () => {
    expect(isoToDdmmyy('2000-01-01')).toBe('01/01/2000');
  });

  it('converts the last day of the year', () => {
    expect(isoToDdmmyy('1999-12-31')).toBe('31/12/1999');
  });

  it('returns empty string for null input', () => {
    expect(isoToDdmmyy(null)).toBe('');
  });

  it('returns empty string for undefined input', () => {
    expect(isoToDdmmyy(undefined)).toBe('');
  });

  it('returns empty string for empty string input', () => {
    expect(isoToDdmmyy('')).toBe('');
  });

  it('returns empty string when given a number instead of a string', () => {
    expect(isoToDdmmyy(20230815)).toBe('');
  });

  it('returns empty string for DD/MM/YYYY format input (wrong format)', () => {
    expect(isoToDdmmyy('15/08/2023')).toBe('');
  });

  it('returns empty string for a date with wrong separator (dots)', () => {
    expect(isoToDdmmyy('2023.08.15')).toBe('');
  });

  it('returns empty string for a partial ISO string', () => {
    expect(isoToDdmmyy('2023-08')).toBe('');
  });

  it('returns empty string for a random non-date string', () => {
    expect(isoToDdmmyy('not-a-date')).toBe('');
  });

  it('roundtrips: ddmmyyToIso then isoToDdmmyy returns the original', () => {
    const original = '25/06/2004';
    expect(isoToDdmmyy(ddmmyyToIso(original))).toBe(original);
  });
});
