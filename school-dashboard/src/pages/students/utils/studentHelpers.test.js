import { describe, it, expect } from 'vitest';
import { formatFileSize, getNextClass } from './studentHelpers';

describe('formatFileSize', () => {
  it('returns "0 B" for null', () => {
    expect(formatFileSize(null)).toBe('0 B');
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });
});

describe('getNextClass', () => {
  it('returns null for Alumni', () => {
    expect(getNextClass('Alumni')).toBeNull();
    expect(getNextClass('Passed Out / Alumni')).toBeNull();
  });

  it('returns null for null/empty currentClass', () => {
    expect(getNextClass(null)).toBeNull();
    expect(getNextClass('')).toBeNull();
  });

  it('promotes Nursery to KG', () => {
    expect(getNextClass('Nursery')).toBe('KG');
  });

  it('promotes KG to 1', () => {
    expect(getNextClass('KG')).toBe('1');
  });

  it('promotes LKG to UKG', () => {
    expect(getNextClass('LKG')).toBe('UKG');
  });

  it('promotes UKG to 1', () => {
    expect(getNextClass('UKG')).toBe('1');
  });

  it('promotes class with section (e.g., 5-A → 6-A)', () => {
    expect(getNextClass('5-A')).toBe('6-A');
  });

  it('promotes class without section (e.g., 7 → 8)', () => {
    expect(getNextClass('7')).toBe('8');
  });

  it('promotes grade 10 to 11 (not alumni - schools go up to 12)', () => {
    expect(getNextClass('10-A')).toBe('11-A');
    expect(getNextClass('10')).toBe('11');
  });

  it('promotes grade 12 to Passed Out / Alumni', () => {
    expect(getNextClass('12-A')).toBe('Passed Out / Alumni');
    expect(getNextClass('12')).toBe('Passed Out / Alumni');
  });

  it('uses available classes list for next grade lookup', () => {
    // If 6-A exists in available classes, use it
    const available = ['1-A', '2-B', '6-A', '7-A'];
    expect(getNextClass('5-A', available)).toBe('6-A');
  });

  it('returns null for non-numeric class names', () => {
    expect(getNextClass('Advanced')).toBeNull();
  });
});
