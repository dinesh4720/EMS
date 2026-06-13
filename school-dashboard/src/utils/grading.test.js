import { describe, it, expect } from 'vitest';
import {
  getGradeFromPercentage,
  calculateGrade,
  getPercentageColor,
  getGradeColor,
  getAttendanceColor,
} from './grading';

describe('getGradeFromPercentage', () => {
  it('returns A+ for 90% and above', () => {
    expect(getGradeFromPercentage(90)).toBe('A+');
    expect(getGradeFromPercentage(100)).toBe('A+');
  });

  it('returns A for 80–89%', () => {
    expect(getGradeFromPercentage(80)).toBe('A');
    expect(getGradeFromPercentage(85)).toBe('A');
  });

  it('returns B+ for 70–79%', () => {
    expect(getGradeFromPercentage(70)).toBe('B+');
    expect(getGradeFromPercentage(75)).toBe('B+');
  });

  it('returns B for 60–69%', () => {
    expect(getGradeFromPercentage(60)).toBe('B');
    expect(getGradeFromPercentage(65)).toBe('B');
  });

  it('returns C+ for 50–59%', () => {
    expect(getGradeFromPercentage(50)).toBe('C+');
    expect(getGradeFromPercentage(55)).toBe('C+');
  });

  it('returns C for 40–49%', () => {
    expect(getGradeFromPercentage(40)).toBe('C');
    expect(getGradeFromPercentage(45)).toBe('C');
  });

  it('returns D for 35–39%', () => {
    expect(getGradeFromPercentage(35)).toBe('D');
    expect(getGradeFromPercentage(38)).toBe('D');
  });

  it('returns F for below 35%', () => {
    expect(getGradeFromPercentage(34)).toBe('F');
    expect(getGradeFromPercentage(0)).toBe('F');
  });

  it('returns em dash for null or undefined', () => {
    expect(getGradeFromPercentage(null)).toBe('—');
    expect(getGradeFromPercentage(undefined)).toBe('—');
  });

  it('returns em dash for non-numeric values', () => {
    expect(getGradeFromPercentage(NaN)).toBe('—');
    expect(getGradeFromPercentage('abc')).toBe('—');
  });

  it('uses a custom scale when provided', () => {
    const customScale = [{ min: 85, grade: 'Distinction' }];
    expect(getGradeFromPercentage(86, customScale)).toBe('Distinction');
    expect(getGradeFromPercentage(84, customScale)).toBe('F');
  });
});

describe('calculateGrade', () => {
  it('calculates grade from marks and total marks', () => {
    expect(calculateGrade(85, 100)).toBe('A');
  });

  it('defaults total marks to 100', () => {
    expect(calculateGrade(75)).toBe('B+');
  });

  it('returns em dash when marks are null', () => {
    expect(calculateGrade(null, 100)).toBe('—');
  });

  it('returns em dash when total marks are zero or negative', () => {
    expect(calculateGrade(50, 0)).toBe('—');
    expect(calculateGrade(50, -10)).toBe('—');
  });

  it('accepts a custom scale', () => {
    const scale = [{ min: 50, grade: 'Pass' }];
    expect(calculateGrade(25, 50, scale)).toBe('Pass');
  });
});

describe('getPercentageColor', () => {
  it('returns success for 90% and above', () => {
    expect(getPercentageColor(90)).toBe('success');
    expect(getPercentageColor(100)).toBe('success');
  });

  it('returns primary for 75–89%', () => {
    expect(getPercentageColor(75)).toBe('primary');
    expect(getPercentageColor(80)).toBe('primary');
  });

  it('returns warning for 50–74%', () => {
    expect(getPercentageColor(50)).toBe('warning');
    expect(getPercentageColor(60)).toBe('warning');
  });

  it('returns danger for below 50%', () => {
    expect(getPercentageColor(49)).toBe('danger');
    expect(getPercentageColor(0)).toBe('danger');
  });
});

describe('getGradeColor', () => {
  it('returns default for falsy values', () => {
    expect(getGradeColor('')).toBe('default');
    expect(getGradeColor(null)).toBe('default');
    expect(getGradeColor(undefined)).toBe('default');
  });

  it('returns success for A+ and A', () => {
    expect(getGradeColor('A+')).toBe('success');
    expect(getGradeColor('a')).toBe('success');
  });

  it('returns primary for B+ and B', () => {
    expect(getGradeColor('B+')).toBe('primary');
    expect(getGradeColor('b')).toBe('primary');
  });

  it('returns warning for C+ and C', () => {
    expect(getGradeColor('C+')).toBe('warning');
    expect(getGradeColor('c')).toBe('warning');
  });

  it('returns danger for D and F', () => {
    expect(getGradeColor('D')).toBe('danger');
    expect(getGradeColor('F')).toBe('danger');
  });
});

describe('getAttendanceColor', () => {
  it('matches getPercentageColor thresholds', () => {
    expect(getAttendanceColor(90)).toBe('success');
    expect(getAttendanceColor(75)).toBe('primary');
    expect(getAttendanceColor(50)).toBe('warning');
    expect(getAttendanceColor(49)).toBe('danger');
  });
});
