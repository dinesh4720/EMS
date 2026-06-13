import { describe, it, expect } from 'vitest';
import {
  getGradeFromPercentage,
  calculateGrade,
  getPercentageColor,
  getGradeColor,
  getAttendanceColor,
} from './grading';

describe('getGradeFromPercentage', () => {
  it('maps each band boundary to the correct grade', () => {
    expect(getGradeFromPercentage(100)).toBe('A+');
    expect(getGradeFromPercentage(90)).toBe('A+');
    expect(getGradeFromPercentage(89.99)).toBe('A');
    expect(getGradeFromPercentage(80)).toBe('A');
    expect(getGradeFromPercentage(70)).toBe('B+');
    expect(getGradeFromPercentage(60)).toBe('B');
    expect(getGradeFromPercentage(50)).toBe('C+');
    expect(getGradeFromPercentage(40)).toBe('C');
    expect(getGradeFromPercentage(35)).toBe('D');
  });

  it('returns F below the lowest pass band', () => {
    expect(getGradeFromPercentage(34.9)).toBe('F');
    expect(getGradeFromPercentage(0)).toBe('F');
  });

  it('returns the placeholder for null/NaN input', () => {
    expect(getGradeFromPercentage(null)).toBe('—');
    expect(getGradeFromPercentage(undefined)).toBe('—');
    expect(getGradeFromPercentage(NaN)).toBe('—');
  });

  it('honours a custom scale', () => {
    const scale = [
      { min: 50, grade: 'PASS' },
    ];
    expect(getGradeFromPercentage(60, scale)).toBe('PASS');
    expect(getGradeFromPercentage(49, scale)).toBe('F');
  });
});

describe('calculateGrade', () => {
  it('scales marks against totalMarks before grading', () => {
    expect(calculateGrade(45, 50)).toBe('A+'); // 90%
    expect(calculateGrade(20, 50)).toBe('C'); // 40%
  });

  it('defaults totalMarks to 100', () => {
    expect(calculateGrade(72)).toBe('B+');
  });

  it('guards against invalid input', () => {
    expect(calculateGrade(null)).toBe('—');
    expect(calculateGrade(50, 0)).toBe('—');
    expect(calculateGrade(50, -10)).toBe('—');
  });
});

describe('getPercentageColor', () => {
  it('returns the right token per band', () => {
    expect(getPercentageColor(95)).toBe('success');
    expect(getPercentageColor(80)).toBe('primary');
    expect(getPercentageColor(60)).toBe('warning');
    expect(getPercentageColor(30)).toBe('danger');
  });
});

describe('getGradeColor', () => {
  it('maps grade letters to tokens (case-insensitive)', () => {
    expect(getGradeColor('A+')).toBe('success');
    expect(getGradeColor('a')).toBe('success');
    expect(getGradeColor('B')).toBe('primary');
    expect(getGradeColor('C+')).toBe('warning');
    expect(getGradeColor('F')).toBe('danger');
  });

  it('returns default for empty input', () => {
    expect(getGradeColor('')).toBe('default');
    expect(getGradeColor(null)).toBe('default');
  });
});

describe('getAttendanceColor', () => {
  it('returns the right token per band', () => {
    expect(getAttendanceColor(92)).toBe('success');
    expect(getAttendanceColor(80)).toBe('primary');
    expect(getAttendanceColor(55)).toBe('warning');
    expect(getAttendanceColor(40)).toBe('danger');
  });
});
