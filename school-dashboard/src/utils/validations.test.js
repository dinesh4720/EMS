import { describe, it, expect } from 'vitest';
import {
  validatePhone, validateEmail, validateRequired,
  validateFutureDate, validateDateRange, validateClassData, validateSubjectData,
} from './validations';

describe('validatePhone', () => {
  it('returns true for valid 10-digit Indian number', () => {
    expect(validatePhone('9876543210')).toBe(true);
  });

  it('returns true for international number with +', () => {
    expect(validatePhone('+14155552671')).toBe(true);
  });

  it('returns true for number with spaces', () => {
    expect(validatePhone('987 654 3210')).toBe(true);
  });

  it('returns false for too short number', () => {
    expect(validatePhone('123456')).toBe(false);
  });

  it('returns false for too long number', () => {
    expect(validatePhone('12345678901234567')).toBe(false);
  });

  it('returns true for empty phone when not required', () => {
    expect(validatePhone('', false)).toBe(true);
    expect(validatePhone(null, false)).toBe(true);
  });

  it('returns false for empty phone when required', () => {
    expect(validatePhone('', true)).toBe(false);
    expect(validatePhone(null, true)).toBe(false);
  });
});

describe('validateEmail', () => {
  it('returns true for valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@school.edu')).toBe(true);
  });

  it('returns false for invalid email', () => {
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
  });

  it('returns true for empty email (optional)', () => {
    expect(validateEmail('')).toBe(true);
    expect(validateEmail(null)).toBe(true);
    expect(validateEmail(undefined)).toBe(true);
  });
});

describe('validateRequired', () => {
  it('returns isValid true when all required fields are present', () => {
    const result = validateRequired({ name: 'Alice', age: '10' }, ['name', 'age']);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for missing fields', () => {
    const result = validateRequired({ name: '' }, ['name', 'email']);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('name is required');
    expect(result.errors).toContain('email is required');
  });

  it('handles whitespace-only values as missing', () => {
    const result = validateRequired({ name: '   ' }, ['name']);
    expect(result.isValid).toBe(false);
  });
});

describe('validateFutureDate', () => {
  it('returns true for null (optional)', () => {
    expect(validateFutureDate(null)).toBe(true);
    expect(validateFutureDate('')).toBe(true);
  });

  it('returns true for today', () => {
    // Build a local-day YYYY-MM-DD string (toISOString uses UTC and would
    // skew this assertion when the user's local date != UTC date).
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(validateFutureDate(today)).toBe(true);
  });

  it('returns true for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    expect(validateFutureDate(future.toISOString())).toBe(true);
  });

  it('returns false for past date', () => {
    expect(validateFutureDate('2020-01-01')).toBe(false);
  });
});

describe('validateDateRange', () => {
  it('returns true when from is before to', () => {
    expect(validateDateRange('2024-01-01T10:00', '2024-01-01T11:00')).toBe(true);
  });

  it('returns false when from equals to', () => {
    expect(validateDateRange('2024-01-01T10:00', '2024-01-01T10:00')).toBe(false);
  });

  it('returns false when from is after to', () => {
    expect(validateDateRange('2024-01-01T12:00', '2024-01-01T10:00')).toBe(false);
  });

  it('returns true when either is null', () => {
    expect(validateDateRange(null, '2024-01-01')).toBe(true);
    expect(validateDateRange('2024-01-01', null)).toBe(true);
  });
});

describe('validateClassData', () => {
  const valid = { name: 'Class 5', section: 'A', strength: 30, academicYear: '2024-25' };

  it('returns isValid true for valid data', () => {
    expect(validateClassData(valid).isValid).toBe(true);
  });

  it('requires name', () => {
    const result = validateClassData({ ...valid, name: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeTruthy();
  });

  it('requires section', () => {
    const result = validateClassData({ ...valid, section: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.section).toBeTruthy();
  });

  it('rejects strength > 100', () => {
    const result = validateClassData({ ...valid, strength: 150 });
    expect(result.isValid).toBe(false);
    expect(result.errors.strength).toBeTruthy();
  });

  it('rejects strength <= 0', () => {
    const result = validateClassData({ ...valid, strength: 0 });
    expect(result.isValid).toBe(false);
  });

  it('requires academicYear', () => {
    const result = validateClassData({ ...valid, academicYear: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.academicYear).toBeTruthy();
  });
});

describe('validateSubjectData', () => {
  it('returns isValid true for valid data', () => {
    expect(validateSubjectData({ subjectName: 'Mathematics' }).isValid).toBe(true);
  });

  it('requires subjectName', () => {
    const result = validateSubjectData({ subjectName: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.subjectName).toBeTruthy();
  });

  it('rejects chapters <= 0', () => {
    const result = validateSubjectData({ subjectName: 'Math', chapters: 0 });
    expect(result.isValid).toBe(false);
  });
});
