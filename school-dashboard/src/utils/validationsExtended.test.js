import { describe, it, expect, vi } from 'vitest';
import { CURRENT_ACADEMIC_YEAR } from './constants';
import {
  validatePhone,
  validateEmail,
  validateRequired,
  validateFutureDate,
  validateDateRange,
  validateClassData,
  validateSubjectData,
  validateTimetableSlot,
  getErrorMessage,
  FEEDBACK_CATEGORIES,
  CALL_INTENT_OPTIONS,
} from './validations';

// ─── validatePhone ────────────────────────────────────────────────────────────

describe('validations.validatePhone', () => {
  it('returns true for empty when not required', () => {
    expect(validatePhone('')).toBe(true);
  });

  it('returns false for empty when required', () => {
    expect(validatePhone('', true)).toBe(false);
  });

  it('returns false for null when required', () => {
    expect(validatePhone(null, true)).toBe(false);
  });

  it('returns true for a 10-digit phone number', () => {
    expect(validatePhone('9876543210')).toBe(true);
  });

  it('accepts international numbers (7-15 digit range)', () => {
    expect(validatePhone('+1-800-555-1234')).toBe(true); // 11 raw digits → valid
  });

  it('returns false for a 6-digit number (too short)', () => {
    expect(validatePhone('123456')).toBe(false);
  });

  it('returns false for a 16-digit number (too long)', () => {
    expect(validatePhone('1234567890123456')).toBe(false);
  });
});

// ─── validateEmail ────────────────────────────────────────────────────────────

describe('validations.validateEmail', () => {
  it('returns true for empty (email is optional)', () => {
    expect(validateEmail('')).toBe(true);
  });

  it('returns true for null (optional)', () => {
    expect(validateEmail(null)).toBe(true);
  });

  it('returns true for a well-formed email', () => {
    expect(validateEmail('admin@school.edu')).toBe(true);
  });

  it('returns false for email missing @', () => {
    expect(validateEmail('notanemail.com')).toBe(false);
  });

  it('returns false for email with no TLD', () => {
    expect(validateEmail('user@domain')).toBe(false);
  });

  it('returns false for email with invalid characters', () => {
    expect(validateEmail('user name@domain.com')).toBe(false);
  });
});

// ─── validateRequired ────────────────────────────────────────────────────────

describe('validations.validateRequired', () => {
  const data = { name: 'Alice', class: '', schoolId: 'sch_1' };

  it('returns isValid true when all required fields are present', () => {
    const result = validateRequired({ name: 'Alice' }, ['name']);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns isValid false when a required field is missing', () => {
    const result = validateRequired(data, ['class']);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('class');
  });

  it('collects multiple errors for multiple missing fields', () => {
    const result = validateRequired({ x: '' }, ['a', 'b', 'c']);
    expect(result.errors).toHaveLength(3);
  });

  it('handles whitespace-only fields as missing', () => {
    const result = validateRequired({ name: '   ' }, ['name']);
    expect(result.isValid).toBe(false);
  });
});

// ─── validateFutureDate ───────────────────────────────────────────────────────

describe('validateFutureDate', () => {
  it('returns true for empty string (optional)', () => {
    expect(validateFutureDate('')).toBe(true);
  });

  it('returns true for null (optional)', () => {
    expect(validateFutureDate(null)).toBe(true);
  });

  it('returns true for today\'s date', () => {
    // Local-day string; toISOString would skew in non-UTC timezones.
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(validateFutureDate(today)).toBe(true);
  });

  it('returns true for a date in the future', () => {
    const future = new Date(Date.now() + 86400000 * 10).toISOString();
    expect(validateFutureDate(future)).toBe(true);
  });

  it('returns false for a date in the past', () => {
    const past = new Date(Date.now() - 86400000 * 10).toISOString();
    expect(validateFutureDate(past)).toBe(false);
  });
});

// ─── validateDateRange ────────────────────────────────────────────────────────

describe('validateDateRange', () => {
  it('returns true when either date is empty', () => {
    expect(validateDateRange('', '2024-05-10')).toBe(true);
    expect(validateDateRange('2024-05-10', '')).toBe(true);
  });

  it('returns true when from is before to', () => {
    expect(validateDateRange('2024-05-01T09:00', '2024-05-01T10:00')).toBe(true);
  });

  it('returns false when from equals to', () => {
    expect(validateDateRange('2024-05-01T09:00', '2024-05-01T09:00')).toBe(false);
  });

  it('returns false when from is after to', () => {
    expect(validateDateRange('2024-05-01T11:00', '2024-05-01T09:00')).toBe(false);
  });
});

// ─── validateClassData ───────────────────────────────────────────────────────

describe('validateClassData', () => {
  const valid = { name: 'Class 5', section: 'A', academicYear: CURRENT_ACADEMIC_YEAR };

  it('returns isValid true for valid class data', () => {
    expect(validateClassData(valid).isValid).toBe(true);
  });

  it('returns error for missing name', () => {
    const result = validateClassData({ ...valid, name: '' });
    expect(result.errors.name).toBeDefined();
  });

  it('returns error for name with special characters', () => {
    const result = validateClassData({ ...valid, name: 'Class$5!' });
    expect(result.errors.name).toBeDefined();
  });

  it('returns error for missing section', () => {
    const result = validateClassData({ ...valid, section: '' });
    expect(result.errors.section).toBeDefined();
  });

  it('returns error for strength > 100', () => {
    const result = validateClassData({ ...valid, strength: 101 });
    expect(result.errors.strength).toBeDefined();
  });

  it('returns error for strength <= 0', () => {
    const result = validateClassData({ ...valid, strength: 0 });
    expect(result.errors.strength).toBeDefined();
  });

  it('returns error for missing academicYear', () => {
    const result = validateClassData({ ...valid, academicYear: '' });
    expect(result.errors.academicYear).toBeDefined();
  });

  it('accepts valid strength within range', () => {
    const result = validateClassData({ ...valid, strength: 40 });
    expect(result.errors.strength).toBeUndefined();
  });
});

// ─── validateSubjectData ─────────────────────────────────────────────────────

describe('validateSubjectData', () => {
  it('returns isValid true for valid subject', () => {
    expect(validateSubjectData({ subjectName: 'Mathematics' }).isValid).toBe(true);
  });

  it('returns error for missing subjectName', () => {
    expect(validateSubjectData({ subjectName: '' }).errors.subjectName).toBeDefined();
  });

  it('returns error for chapters <= 0', () => {
    expect(validateSubjectData({ subjectName: 'Science', chapters: 0 }).errors.chapters).toBeDefined();
  });

  it('accepts positive chapters count', () => {
    expect(validateSubjectData({ subjectName: 'Science', chapters: 5 }).errors.chapters).toBeUndefined();
  });
});

// ─── validateTimetableSlot ───────────────────────────────────────────────────

describe('validateTimetableSlot', () => {
  const valid = { day: 'Monday', periodIndex: 0, subject: 'Math' };

  it('returns isValid true for valid slot', () => {
    expect(validateTimetableSlot(valid).isValid).toBe(true);
  });

  it('returns error for missing day', () => {
    expect(validateTimetableSlot({ ...valid, day: '' }).errors.day).toBeDefined();
  });

  it('returns error for negative periodIndex', () => {
    expect(validateTimetableSlot({ ...valid, periodIndex: -1 }).errors.periodIndex).toBeDefined();
  });

  it('returns error for undefined periodIndex', () => {
    const { periodIndex: _, ...data } = valid;
    expect(validateTimetableSlot(data).errors.periodIndex).toBeDefined();
  });

  it('returns error for missing subject', () => {
    expect(validateTimetableSlot({ ...valid, subject: '' }).errors.subject).toBeDefined();
  });
});

// ─── getErrorMessage ─────────────────────────────────────────────────────────

describe('getErrorMessage', () => {
  it('returns message for known field "visitorName"', () => {
    expect(getErrorMessage('visitorName')).toContain('required');
  });

  it('returns message for known field "email"', () => {
    expect(getErrorMessage('email')).toBeTruthy();
  });

  it('returns fallback message for unknown field', () => {
    expect(getErrorMessage('unknownField')).toContain('invalid');
  });

  it('uses i18n translation function when provided', () => {
    const t = vi.fn().mockReturnValue('translated message');
    const result = getErrorMessage('visitorName', t);
    expect(t).toHaveBeenCalled();
    expect(result).toBe('translated message');
  });
});

// ─── Static option arrays ────────────────────────────────────────────────────

describe('FEEDBACK_CATEGORIES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(FEEDBACK_CATEGORIES)).toBe(true);
    expect(FEEDBACK_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('includes "Complaint"', () => {
    expect(FEEDBACK_CATEGORIES).toContain('Complaint');
  });
});

describe('CALL_INTENT_OPTIONS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(CALL_INTENT_OPTIONS)).toBe(true);
    expect(CALL_INTENT_OPTIONS.length).toBeGreaterThan(0);
  });

  it('includes "Interested"', () => {
    expect(CALL_INTENT_OPTIONS).toContain('Interested');
  });
});
