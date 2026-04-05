import { describe, it, expect } from 'vitest';
import {
  getDefaultAcademicYear,
  shiftAcademicYear,
  getAcademicYearOptions,
  DEFAULT_PERIODS,
  TIMETABLE_DAYS,
  API_STATUS,
  FEE_STATUS,
  ATTENDANCE_STATUS,
  STUDENT_STATUS,
} from './constants';

// ─── getDefaultAcademicYear ───────────────────────────────────────────────────

describe('getDefaultAcademicYear', () => {
  it('returns format YYYY-YY', () => {
    const result = getDefaultAcademicYear();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });

  it('starts academic year in April — April reference starts current year', () => {
    // April (month index 3) → academic year starts in current year
    const aprilDate = new Date(2024, 3, 1); // April 1, 2024
    expect(getDefaultAcademicYear(aprilDate)).toBe('2024-25');
  });

  it('starts academic year in March — March reference goes to previous year', () => {
    // March (month index 2) → academic year started in previous year
    const marchDate = new Date(2025, 2, 1); // March 1, 2025
    expect(getDefaultAcademicYear(marchDate)).toBe('2024-25');
  });

  it('handles December correctly (academic year started earlier in same calendar year)', () => {
    const decDate = new Date(2024, 11, 31); // December 31, 2024
    expect(getDefaultAcademicYear(decDate)).toBe('2024-25');
  });

  it('handles January correctly (academic year started in previous calendar year)', () => {
    const janDate = new Date(2025, 0, 1); // January 1, 2025
    expect(getDefaultAcademicYear(janDate)).toBe('2024-25');
  });

  it('pads the two-digit year suffix with leading zero when needed', () => {
    // 2099 → suffix is 00
    const futureDate = new Date(2099, 5, 1);
    expect(getDefaultAcademicYear(futureDate)).toBe('2099-00');
  });
});

// ─── shiftAcademicYear ────────────────────────────────────────────────────────

describe('shiftAcademicYear', () => {
  it('returns the next academic year with offset +1', () => {
    expect(shiftAcademicYear('2024-25', 1)).toBe('2025-26');
  });

  it('returns the previous academic year with offset -1', () => {
    expect(shiftAcademicYear('2024-25', -1)).toBe('2023-24');
  });

  it('returns the same year with offset 0', () => {
    expect(shiftAcademicYear('2024-25', 0)).toBe('2024-25');
  });

  it('correctly pads suffix e.g. 2099 + 1 = 2100-01', () => {
    expect(shiftAcademicYear('2099-00', 1)).toBe('2100-01');
  });

  it('handles multiple years ahead', () => {
    expect(shiftAcademicYear('2020-21', 5)).toBe('2025-26');
  });

  it('falls back gracefully for null academicYear', () => {
    const result = shiftAcademicYear(null, 0);
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });
});

// ─── getAcademicYearOptions ───────────────────────────────────────────────────

describe('getAcademicYearOptions', () => {
  it('returns an array including the current year', () => {
    const options = getAcademicYearOptions('2024-25');
    expect(options).toContain('2024-25');
  });

  it('returns future years according to the future option', () => {
    const options = getAcademicYearOptions('2024-25', { past: 0, future: 2 });
    expect(options).toContain('2025-26');
    expect(options).toContain('2026-27');
  });

  it('returns past years according to the past option', () => {
    const options = getAcademicYearOptions('2024-25', { past: 2, future: 0 });
    expect(options).toContain('2023-24');
    expect(options).toContain('2022-23');
  });

  it('returns no duplicates', () => {
    const options = getAcademicYearOptions('2024-25', { past: 2, future: 1 });
    const unique = new Set(options);
    expect(unique.size).toBe(options.length);
  });

  it('defaults to 2 past and 1 future when no options supplied', () => {
    const options = getAcademicYearOptions('2024-25');
    // 1 future + current + 2 past = 4 entries
    expect(options).toHaveLength(4);
  });

  it('returns only current year when past=0 and future=0', () => {
    const options = getAcademicYearOptions('2024-25', { past: 0, future: 0 });
    expect(options).toEqual(['2024-25']);
  });
});

// ─── Static constants ─────────────────────────────────────────────────────────

describe('DEFAULT_PERIODS', () => {
  it('contains 8 period entries', () => {
    expect(DEFAULT_PERIODS).toHaveLength(8);
  });

  it('each period has name, startTime, endTime, and isBreak', () => {
    DEFAULT_PERIODS.forEach(period => {
      expect(period).toHaveProperty('name');
      expect(period).toHaveProperty('startTime');
      expect(period).toHaveProperty('endTime');
      expect(period).toHaveProperty('isBreak');
    });
  });

  it('break periods have isBreak set to true', () => {
    const breaks = DEFAULT_PERIODS.filter(p => p.isBreak);
    expect(breaks.length).toBeGreaterThan(0);
  });
});

describe('TIMETABLE_DAYS', () => {
  it('contains 6 school days', () => {
    expect(TIMETABLE_DAYS).toHaveLength(6);
  });

  it('starts with Monday', () => {
    expect(TIMETABLE_DAYS[0]).toBe('Monday');
  });

  it('ends with Saturday', () => {
    expect(TIMETABLE_DAYS[TIMETABLE_DAYS.length - 1]).toBe('Saturday');
  });
});

describe('API_STATUS', () => {
  it('has SUCCESS, ERROR, and LOADING keys', () => {
    expect(API_STATUS.SUCCESS).toBe('success');
    expect(API_STATUS.ERROR).toBe('error');
    expect(API_STATUS.LOADING).toBe('loading');
  });
});

describe('FEE_STATUS', () => {
  it('has PAID, PENDING, PARTIAL, and OVERDUE', () => {
    expect(FEE_STATUS.PAID).toBe('paid');
    expect(FEE_STATUS.PENDING).toBe('pending');
    expect(FEE_STATUS.PARTIAL).toBe('partial');
    expect(FEE_STATUS.OVERDUE).toBe('overdue');
  });
});

describe('ATTENDANCE_STATUS', () => {
  it('has PRESENT, ABSENT, LATE, LEAVE, and HALFDAY', () => {
    expect(ATTENDANCE_STATUS.PRESENT).toBe('present');
    expect(ATTENDANCE_STATUS.ABSENT).toBe('absent');
    expect(ATTENDANCE_STATUS.LATE).toBe('late');
    expect(ATTENDANCE_STATUS.LEAVE).toBe('leave');
    expect(ATTENDANCE_STATUS.HALFDAY).toBe('halfday');
  });
});

describe('STUDENT_STATUS', () => {
  it('has all five status values', () => {
    expect(STUDENT_STATUS.ACTIVE).toBe('active');
    expect(STUDENT_STATUS.INACTIVE).toBe('inactive');
    expect(STUDENT_STATUS.GRADUATED).toBe('graduated');
    expect(STUDENT_STATUS.TRANSFERRED).toBe('transferred');
    expect(STUDENT_STATUS.ALUMNI).toBe('alumni');
  });
});
