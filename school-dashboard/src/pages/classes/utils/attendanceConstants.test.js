import { describe, it, expect } from 'vitest';
import {
  toLocalDateString,
  buildHeatmapDates,
  sid,
  ATTENDANCE_STATUSES,
  STATUS_MAP,
  SHORTCUT_MAP,
} from './attendanceConstants';

describe('toLocalDateString', () => {
  it('formats a date as YYYY-MM-DD using local components', () => {
    expect(toLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05'); // Jan 5 2026
  });

  it('zero-pads single-digit month and day', () => {
    expect(toLocalDateString(new Date(2026, 8, 9))).toBe('2026-09-09'); // Sep 9
  });

  it('handles the end-of-year boundary', () => {
    expect(toLocalDateString(new Date(2025, 11, 31))).toBe('2025-12-31');
  });

  it('keeps local midnight on the same calendar day (no UTC drift)', () => {
    expect(toLocalDateString(new Date(2026, 5, 15, 0, 0, 0))).toBe('2026-06-15');
  });
});

describe('buildHeatmapDates', () => {
  it('returns exactly 30 dates', () => {
    expect(buildHeatmapDates('2026-06-29')).toHaveLength(30);
  });

  it('ends at the provided end date (oldest first)', () => {
    expect(buildHeatmapDates('2026-06-29')[29]).toBe('2026-06-29');
  });

  it('starts 29 days before the end date', () => {
    expect(buildHeatmapDates('2026-06-29')[0]).toBe('2026-05-31');
  });

  it('produces ascending, contiguous calendar days', () => {
    const dates = buildHeatmapDates('2026-03-05');
    expect(dates).toHaveLength(30);
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(`${dates[i - 1]}T00:00:00`);
      const cur = new Date(`${dates[i]}T00:00:00`);
      expect((cur - prev) / 86400000).toBe(1);
    }
    expect(dates[29]).toBe('2026-03-05');
  });

  it('crosses a (non-leap) month boundary correctly', () => {
    const dates = buildHeatmapDates('2026-03-02');
    expect(dates[29]).toBe('2026-03-02');
    expect(dates).toContain('2026-02-28'); // 2026 is not a leap year
    expect(dates).not.toContain('2026-02-29');
  });
});

describe('sid', () => {
  it('prefers _id over id', () => {
    expect(sid({ _id: 'abc', id: 'xyz' })).toBe('abc');
  });

  it('falls back to id when _id is missing', () => {
    expect(sid({ id: 42 })).toBe('42');
  });

  it('returns empty string for null / undefined / empty object', () => {
    expect(sid(null)).toBe('');
    expect(sid(undefined)).toBe('');
    expect(sid({})).toBe('');
  });

  it('coerces numeric ids to strings', () => {
    expect(sid({ _id: 7 })).toBe('7');
  });
});

describe('ATTENDANCE_STATUSES lookup maps', () => {
  it('STATUS_MAP is keyed by status key', () => {
    expect(STATUS_MAP.present.shortcut).toBe('P');
    expect(STATUS_MAP.halfday.label).toBe('Half Day');
  });

  it('SHORTCUT_MAP maps each single-letter shortcut to its status key', () => {
    expect(SHORTCUT_MAP.P).toBe('present');
    expect(SHORTCUT_MAP.A).toBe('absent');
    expect(SHORTCUT_MAP.T).toBe('late');
    expect(SHORTCUT_MAP.L).toBe('leave');
    expect(SHORTCUT_MAP.H).toBe('halfday');
  });

  it('every status has a unique shortcut', () => {
    const shortcuts = ATTENDANCE_STATUSES.map((s) => s.shortcut);
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
  });
});
