import { describe, it, expect } from 'vitest';
import {
  computeStatusCounts,
  getAttendancePercentage,
  filterByAcademicPerformance,
  filterByAttendance,
  sortWithPinned,
  computeActiveFiltersCount,
  computeFilterCounts,
  resolveSelectedIds,
} from './useStudentsListData.helpers';

// ─── computeStatusCounts ─────────────────────────────────────────────────────

describe('computeStatusCounts', () => {
  it('returns all zeros for empty array', () => {
    const result = computeStatusCounts([]);
    expect(result).toEqual({ all: 0, active: 0, inactive: 0, alumni: 0, graduated: 0, transferred: 0 });
  });

  it('counts active students (default status)', () => {
    const students = [{ name: 'A' }, { name: 'B', status: 'active' }];
    const result = computeStatusCounts(students);
    expect(result.all).toBe(2);
    expect(result.active).toBe(2);
  });

  it('counts each status correctly', () => {
    const students = [
      { status: 'active' },
      { status: 'active' },
      { status: 'inactive' },
      { status: 'alumni' },
      { status: 'graduated' },
      { status: 'transferred' },
    ];
    const result = computeStatusCounts(students);
    expect(result).toEqual({ all: 6, active: 2, inactive: 1, alumni: 1, graduated: 1, transferred: 1 });
  });

  it('treats missing status as active', () => {
    const students = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    const result = computeStatusCounts(students);
    expect(result.active).toBe(3);
  });
});

// ─── getAttendancePercentage ─────────────────────────────────────────────────

describe('getAttendancePercentage', () => {
  it('returns attendancePercentage when present', () => {
    expect(getAttendancePercentage({ attendancePercentage: 85 })).toBe(85);
  });

  it('returns 0 when attendancePercentage is 0', () => {
    expect(getAttendancePercentage({ attendancePercentage: 0 })).toBe(0);
  });

  it('returns null when attendancePercentage is undefined', () => {
    expect(getAttendancePercentage({})).toBeNull();
  });

  it('returns null when attendancePercentage is null', () => {
    expect(getAttendancePercentage({ attendancePercentage: null })).toBeNull();
  });
});

// ─── filterByAcademicPerformance ─────────────────────────────────────────────

describe('filterByAcademicPerformance', () => {
  const students = [
    { name: 'Excellent', examResults: [{ percentage: 95 }] },
    { name: 'Good', examResults: [{ percentage: 80 }] },
    { name: 'Average', examResults: [{ percentage: 60 }] },
    { name: 'Below', examResults: [{ percentage: 30 }] },
    { name: 'NoData' },
  ];

  it('returns all students when filter is empty', () => {
    expect(filterByAcademicPerformance(students, [])).toHaveLength(5);
  });

  it('filters excellent (>= 90%)', () => {
    const result = filterByAcademicPerformance(students, ['excellent']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Excellent');
  });

  it('filters good (75-89%)', () => {
    const result = filterByAcademicPerformance(students, ['good']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Good');
  });

  it('filters average (50-74%)', () => {
    const result = filterByAcademicPerformance(students, ['average']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Average');
  });

  it('filters below_average (< 50%)', () => {
    const result = filterByAcademicPerformance(students, ['below_average']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Below');
  });

  it('excludes students with no examResults', () => {
    const result = filterByAcademicPerformance(students, ['excellent']);
    expect(result.find((s) => s.name === 'NoData')).toBeUndefined();
  });

  it('excludes students with empty examResults', () => {
    const result = filterByAcademicPerformance([{ examResults: [] }], ['excellent']);
    expect(result).toHaveLength(0);
  });

  it('averages multiple exam results', () => {
    const multi = [{ name: 'Multi', examResults: [{ percentage: 80 }, { percentage: 100 }] }]; // avg = 90
    expect(filterByAcademicPerformance(multi, ['excellent'])).toHaveLength(1);
    expect(filterByAcademicPerformance(multi, ['good'])).toHaveLength(0);
  });

  it('handles examResults with null percentages', () => {
    const s = [{ name: 'X', examResults: [{ percentage: null }, { percentage: 90 }] }]; // avg = 90/2 = 45
    expect(filterByAcademicPerformance(s, ['below_average'])).toHaveLength(1);
  });
});

// ─── filterByAttendance ──────────────────────────────────────────────────────

describe('filterByAttendance', () => {
  const students = [
    { name: 'Excellent', attendancePercentage: 95 },
    { name: 'Good', attendancePercentage: 80 },
    { name: 'Average', attendancePercentage: 60 },
    { name: 'Below', attendancePercentage: 30 },
    { name: 'NoData' },
  ];

  it('returns all students when filter is empty', () => {
    expect(filterByAttendance(students, [])).toHaveLength(5);
  });

  it('filters excellent (>= 90%)', () => {
    const result = filterByAttendance(students, ['excellent']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Excellent');
  });

  it('filters good (75-89%)', () => {
    const result = filterByAttendance(students, ['good']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Good');
  });

  it('filters average (50-74%)', () => {
    const result = filterByAttendance(students, ['average']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Average');
  });

  it('filters below (< 50%)', () => {
    const result = filterByAttendance(students, ['below']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Below');
  });

  it('excludes students with no attendance data', () => {
    const result = filterByAttendance(students, ['excellent']);
    expect(result.find((s) => s.name === 'NoData')).toBeUndefined();
  });

  it('includes attendance of exactly 0', () => {
    const s = [{ attendancePercentage: 0 }];
    expect(filterByAttendance(s, ['below'])).toHaveLength(1);
  });

  it('boundary: 90 is excellent not good', () => {
    const s = [{ attendancePercentage: 90 }];
    expect(filterByAttendance(s, ['excellent'])).toHaveLength(1);
    expect(filterByAttendance(s, ['good'])).toHaveLength(0);
  });

  it('boundary: 75 is good not average', () => {
    const s = [{ attendancePercentage: 75 }];
    expect(filterByAttendance(s, ['good'])).toHaveLength(1);
    expect(filterByAttendance(s, ['average'])).toHaveLength(0);
  });

  it('boundary: 50 is average not below', () => {
    const s = [{ attendancePercentage: 50 }];
    expect(filterByAttendance(s, ['average'])).toHaveLength(1);
    expect(filterByAttendance(s, ['below'])).toHaveLength(0);
  });
});

// ─── sortWithPinned ──────────────────────────────────────────────────────────

describe('sortWithPinned', () => {
  it('returns empty array for empty input', () => {
    expect(sortWithPinned([])).toEqual([]);
  });

  it('puts pinned students before unpinned', () => {
    const items = [
      { name: 'Unpinned', isPinned: false },
      { name: 'Pinned', isPinned: true, pinnedAt: '2024-01-01' },
    ];
    const result = sortWithPinned(items);
    expect(result[0].name).toBe('Pinned');
    expect(result[1].name).toBe('Unpinned');
  });

  it('sorts pinned students by pinnedAt descending (most recent first)', () => {
    const items = [
      { name: 'Early', isPinned: true, pinnedAt: '2024-01-01' },
      { name: 'Late', isPinned: true, pinnedAt: '2024-06-01' },
      { name: 'Mid', isPinned: true, pinnedAt: '2024-03-01' },
    ];
    const result = sortWithPinned(items);
    expect(result.map((s) => s.name)).toEqual(['Late', 'Mid', 'Early']);
  });

  it('preserves order of unpinned students', () => {
    const items = [
      { name: 'B', isPinned: false },
      { name: 'A', isPinned: false },
    ];
    const result = sortWithPinned(items);
    expect(result.map((s) => s.name)).toEqual(['B', 'A']);
  });

  it('handles pinned without pinnedAt date', () => {
    const items = [
      { name: 'A', isPinned: true },
      { name: 'B', isPinned: true, pinnedAt: '2024-01-01' },
    ];
    const result = sortWithPinned(items);
    // Both are pinned; A has no pinnedAt so sort returns 0 (stable order)
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.isPinned)).toBe(true);
  });
});

// ─── computeActiveFiltersCount ───────────────────────────────────────────────

describe('computeActiveFiltersCount', () => {
  it('returns 0 when all filters are default', () => {
    expect(computeActiveFiltersCount({
      classFilter: 'all',
      feeStatusFilter: [],
      academicYearFilter: [],
      academicPerformanceFilter: [],
      attendanceFilter: [],
    })).toBe(0);
  });

  it('counts each active filter', () => {
    expect(computeActiveFiltersCount({
      classFilter: '5-A',
      feeStatusFilter: ['pending'],
      academicYearFilter: [],
      academicPerformanceFilter: [],
      attendanceFilter: ['below'],
    })).toBe(3);
  });

  it('returns 5 when all filters are active', () => {
    expect(computeActiveFiltersCount({
      classFilter: '5-A',
      feeStatusFilter: ['paid'],
      academicYearFilter: ['2024-25'],
      academicPerformanceFilter: ['excellent'],
      attendanceFilter: ['excellent'],
    })).toBe(5);
  });
});

// ─── computeFilterCounts ─────────────────────────────────────────────────────

describe('computeFilterCounts', () => {
  it('returns empty counts for empty array', () => {
    const result = computeFilterCounts([], '2024-25');
    expect(result.class).toEqual({});
    expect(result.feeStatus).toEqual({});
    expect(result.academicYear).toEqual({});
    expect(result.academicPerformance).toEqual({});
    expect(result.attendance).toEqual({});
  });

  it('counts classes correctly', () => {
    const students = [
      { class: '5-A' },
      { class: '5-A' },
      { class: '6-B' },
    ];
    const result = computeFilterCounts(students, '2024-25');
    expect(result.class['5-A']).toBe(2);
    expect(result.class['6-B']).toBe(1);
  });

  it('counts feeStatus when present', () => {
    const students = [
      { feeStatus: 'paid' },
      { feeStatus: 'pending' },
      { feeStatus: 'paid' },
    ];
    const result = computeFilterCounts(students, '2024-25');
    expect(result.feeStatus.paid).toBe(2);
    expect(result.feeStatus.pending).toBe(1);
  });

  it('defaults academicYear to currentAcademicYear', () => {
    const students = [{ name: 'A' }, { academicYear: '2023-24' }];
    const result = computeFilterCounts(students, '2024-25');
    expect(result.academicYear['2024-25']).toBe(1);
    expect(result.academicYear['2023-24']).toBe(1);
  });

  it('categorizes attendance into buckets', () => {
    const students = [
      { attendancePercentage: 95 },
      { attendancePercentage: 80 },
      { attendancePercentage: 60 },
      { attendancePercentage: 30 },
    ];
    const result = computeFilterCounts(students, '2024-25');
    expect(result.attendance.excellent).toBe(1);
    expect(result.attendance.good).toBe(1);
    expect(result.attendance.average).toBe(1);
    expect(result.attendance.below).toBe(1);
  });

  it('skips students without attendance data', () => {
    const students = [{ name: 'A' }];
    const result = computeFilterCounts(students, '2024-25');
    expect(result.attendance).toEqual({});
  });

  it('counts academicPerformance when present', () => {
    const students = [
      { academicPerformance: 'excellent' },
      { academicPerformance: 'excellent' },
      { academicPerformance: 'good' },
    ];
    const result = computeFilterCounts(students, '2024-25');
    expect(result.academicPerformance.excellent).toBe(2);
    expect(result.academicPerformance.good).toBe(1);
  });
});

// ─── resolveSelectedIds ──────────────────────────────────────────────────────

describe('resolveSelectedIds', () => {
  const items = [
    { id: '1', name: 'A' },
    { id: '2', name: 'B' },
    { id: '3', name: 'C' },
  ];

  it('returns all item IDs when selectedKeys is "all"', () => {
    const result = resolveSelectedIds('all', items);
    expect(result).toEqual(['1', '2', '3']);
  });

  it('returns specific IDs from a Set', () => {
    const result = resolveSelectedIds(new Set(['1', '3']), items);
    expect(result).toEqual(['1', '3']);
  });

  it('returns empty array for empty Set', () => {
    const result = resolveSelectedIds(new Set([]), items);
    expect(result).toEqual([]);
  });

  it('returns all IDs from empty list when "all"', () => {
    const result = resolveSelectedIds('all', []);
    expect(result).toEqual([]);
  });
});
