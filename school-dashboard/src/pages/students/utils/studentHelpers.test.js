import { describe, it, expect } from 'vitest';
import { formatFileSize, getNextClass, calculateAttendanceStats, getInitials, getAvatarColor } from './studentHelpers';

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

// ─── calculateAttendanceStats ────────────────────────────────────────────────

describe('calculateAttendanceStats', () => {
  it('returns zeros for empty array', () => {
    const result = calculateAttendanceStats([]);
    expect(result).toEqual({ present: 0, absent: 0, total: 0, percentage: 0 });
  });

  it('returns zeros for null', () => {
    const result = calculateAttendanceStats(null);
    expect(result).toEqual({ present: 0, absent: 0, total: 0, percentage: 0 });
  });

  it('returns zeros for undefined', () => {
    const result = calculateAttendanceStats(undefined);
    expect(result).toEqual({ present: 0, absent: 0, total: 0, percentage: 0 });
  });

  it('counts present and absent correctly', () => {
    const attendance = [
      { status: 'present' },
      { status: 'present' },
      { status: 'absent' },
    ];
    const result = calculateAttendanceStats(attendance);
    expect(result.present).toBe(2);
    expect(result.absent).toBe(1);
    expect(result.total).toBe(3);
    expect(result.percentage).toBe(67); // Math.round(2/3 * 100)
  });

  it('handles shorthand status values (P/A)', () => {
    const attendance = [
      { status: 'P' },
      { status: 'A' },
      { status: 'p' },
    ];
    const result = calculateAttendanceStats(attendance);
    expect(result.present).toBe(2);
    expect(result.absent).toBe(1);
  });

  it('handles case-insensitive status', () => {
    const attendance = [
      { status: 'Present' },
      { status: 'ABSENT' },
      { status: 'present' },
    ];
    const result = calculateAttendanceStats(attendance);
    expect(result.present).toBe(2);
    expect(result.absent).toBe(1);
  });

  it('calculates 100% when all present', () => {
    const attendance = [{ status: 'present' }, { status: 'present' }];
    const result = calculateAttendanceStats(attendance);
    expect(result.percentage).toBe(100);
  });

  it('calculates 0% when all absent', () => {
    const attendance = [{ status: 'absent' }, { status: 'absent' }];
    const result = calculateAttendanceStats(attendance);
    expect(result.percentage).toBe(0);
  });
});

// ─── getInitials ─────────────────────────────────────────────────────────────

describe('getInitials', () => {
  it('returns empty string for null', () => {
    expect(getInitials(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(getInitials(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(getInitials('')).toBe('');
  });

  it('returns single initial for one-word name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('returns first and last initials for two-word name', () => {
    expect(getInitials('Alice Smith')).toBe('AS');
  });

  it('returns first and last initials for three-word name', () => {
    expect(getInitials('Alice Marie Smith')).toBe('AS');
  });

  it('uppercases initials', () => {
    expect(getInitials('alice smith')).toBe('AS');
  });

  it('trims whitespace', () => {
    expect(getInitials('  Alice  ')).toBe('A');
  });
});

// ─── getAvatarColor ──────────────────────────────────────────────────────────

describe('getAvatarColor', () => {
  it('returns a color class for a string', () => {
    const result = getAvatarColor('Alice');
    expect(result).toMatch(/^bg-/);
  });

  it('returns first color for null/undefined', () => {
    expect(getAvatarColor(null)).toBe('bg-gray-400');
    expect(getAvatarColor(undefined)).toBe('bg-gray-400');
  });

  it('returns deterministic color for same input', () => {
    expect(getAvatarColor('Alice')).toBe(getAvatarColor('Alice'));
  });

  it('may return different colors for different inputs', () => {
    // Just verify it returns valid color classes
    const colors = ['bg-gray-400', 'bg-slate-500', 'bg-zinc-500', 'bg-neutral-500'];
    expect(colors).toContain(getAvatarColor('A'));
    expect(colors).toContain(getAvatarColor('Z'));
  });
});
