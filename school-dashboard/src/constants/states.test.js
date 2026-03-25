import { describe, it, expect } from 'vitest';
import { INDIAN_STATES, normalizeStateName } from './states';

// ---------------------------------------------------------------------------
// INDIAN_STATES array
// ---------------------------------------------------------------------------
describe('INDIAN_STATES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(INDIAN_STATES)).toBe(true);
    expect(INDIAN_STATES.length).toBeGreaterThan(0);
  });

  it('contains only strings', () => {
    INDIAN_STATES.forEach((state) => expect(typeof state).toBe('string'));
  });

  it('contains Tamil Nadu', () => {
    expect(INDIAN_STATES).toContain('Tamil Nadu');
  });

  it('contains Maharashtra', () => {
    expect(INDIAN_STATES).toContain('Maharashtra');
  });

  it('contains Delhi', () => {
    expect(INDIAN_STATES).toContain('Delhi');
  });

  it('contains all 28 states and major UTs (at least 30 entries)', () => {
    expect(INDIAN_STATES.length).toBeGreaterThanOrEqual(30);
  });
});

// ---------------------------------------------------------------------------
// normalizeStateName
// ---------------------------------------------------------------------------
describe('normalizeStateName', () => {
  it('returns null for null input', () => {
    expect(normalizeStateName(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeStateName(undefined)).toBeNull();
  });

  it('returns null for empty string input', () => {
    expect(normalizeStateName('')).toBeNull();
  });

  it('resolves the 2-letter abbreviation TN to Tamil Nadu', () => {
    expect(normalizeStateName('TN')).toBe('Tamil Nadu');
  });

  it('resolves the camelCase variant TamilNadu to Tamil Nadu', () => {
    expect(normalizeStateName('TamilNadu')).toBe('Tamil Nadu');
  });

  it('resolves the mixed-case variant Tamilnadu to Tamil Nadu', () => {
    expect(normalizeStateName('Tamilnadu')).toBe('Tamil Nadu');
  });

  it('resolves the 2-letter abbreviation MH to Maharashtra', () => {
    expect(normalizeStateName('MH')).toBe('Maharashtra');
  });

  it('resolves the 2-letter abbreviation DL to Delhi', () => {
    expect(normalizeStateName('DL')).toBe('Delhi');
  });

  it('resolves the legacy name Orissa to Odisha', () => {
    expect(normalizeStateName('Orissa')).toBe('Odisha');
  });

  it('resolves Pondicherry to Puducherry', () => {
    expect(normalizeStateName('Pondicherry')).toBe('Puducherry');
  });

  it('returns a canonical state name when input already matches exactly (case-insensitive)', () => {
    expect(normalizeStateName('tamil nadu')).toBe('Tamil Nadu');
  });
});
