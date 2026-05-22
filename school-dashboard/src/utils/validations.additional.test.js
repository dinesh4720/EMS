import { describe, it, expect } from 'vitest';
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
  formatPhoneNumber,
  getErrorMessage,
  FEEDBACK_CATEGORIES,
  CALL_INTENT_OPTIONS,
} from './validations';

// ─── validatePhone — edge cases not in existing tests ─────────────────────────

describe('validatePhone - additional edge cases', () => {
  it('returns true for exactly 7 digits (minimum valid)', () => {
    expect(validatePhone('1234567')).toBe(true);
  });

  it('returns true for exactly 15 digits (maximum valid)', () => {
    expect(validatePhone('123456789012345')).toBe(true);
  });

  it('returns false for a phone with only non-digit characters', () => {
    // Stripping non-digits leaves 0 digits — invalid
    expect(validatePhone('-------')).toBe(false);
  });

  it('counts only digits when phone has hyphens and parentheses', () => {
    // (02) 123-456 → digits: 02123456 = 8 digits → valid
    expect(validatePhone('(02) 123-456')).toBe(true);
  });
});

// ─── validateEmail — boundary and format cases ────────────────────────────────

describe('validateEmail - additional edge cases', () => {
  it('returns true for subdomain emails', () => {
    expect(validateEmail('user@mail.school.edu')).toBe(true);
  });

  it('returns false for email with double @', () => {
    expect(validateEmail('user@@domain.com')).toBe(false);
  });

  it('returns false for email with no local part before @', () => {
    expect(validateEmail('@domain.com')).toBe(false);
  });

  it('returns true for undefined (optional)', () => {
    expect(validateEmail(undefined)).toBe(true);
  });
});

// ─── validateRequired — non-string field types ────────────────────────────────

describe('validateRequired - non-string field types', () => {
  it('treats numeric 0 as missing (falsy)', () => {
    // 0 is falsy so validateRequired should flag it
    const result = validateRequired({ count: 0 }, ['count']);
    expect(result.isValid).toBe(false);
  });

  it('treats boolean false as missing (falsy)', () => {
    const result = validateRequired({ active: false }, ['active']);
    expect(result.isValid).toBe(false);
  });

  it('passes when field is a non-empty array (truthy)', () => {
    const result = validateRequired({ items: [1, 2] }, ['items']);
    // Arrays are truthy — implementation depends on if it does typeof check
    // The source only checks falsy, so an array passes
    expect(result.isValid).toBe(true);
  });

  it('returns isValid true for empty requiredFields array', () => {
    const result = validateRequired({ name: '' }, []);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ─── validateFutureDate — boundary: yesterday ─────────────────────────────────

describe('validateFutureDate - yesterday boundary', () => {
  it('returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(validateFutureDate(yesterday.toISOString())).toBe(false);
  });

  it('returns true for exactly 1 year in the future', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(validateFutureDate(future.toISOString())).toBe(true);
  });
});

// ─── validateClassData — section special chars ────────────────────────────────

describe('validateClassData - section special characters', () => {
  const base = { name: 'Class 6', section: 'A', academicYear: CURRENT_ACADEMIC_YEAR };

  it('rejects section with special characters like @', () => {
    const result = validateClassData({ ...base, section: '@B' });
    expect(result.errors.section).toBeDefined();
  });

  it('accepts section with hyphen', () => {
    const result = validateClassData({ ...base, section: 'A-1' });
    expect(result.errors.section).toBeUndefined();
  });

  it('returns no strength error when strength is exactly 1', () => {
    const result = validateClassData({ ...base, strength: 1 });
    expect(result.errors.strength).toBeUndefined();
  });

  it('returns no strength error when strength is exactly 100', () => {
    const result = validateClassData({ ...base, strength: 100 });
    expect(result.errors.strength).toBeUndefined();
  });
});

// ─── formatPhoneNumber ────────────────────────────────────────────────────────

describe('formatPhoneNumber', () => {
  it('returns empty string for null input', () => {
    expect(formatPhoneNumber(null)).toBe('');
  });

  it('returns empty string for undefined input', () => {
    expect(formatPhoneNumber(undefined)).toBe('');
  });

  it('returns phone unchanged (passthrough implementation)', () => {
    expect(formatPhoneNumber('9876543210')).toBe('9876543210');
  });
});

// ─── getErrorMessage — fallback for unknown fields ────────────────────────────

describe('getErrorMessage - fallback', () => {
  it('fallback message contains the field name', () => {
    const msg = getErrorMessage('myCustomField');
    expect(msg).toContain('myCustomField');
  });

  it('returns message for "personId" field', () => {
    const msg = getErrorMessage('personId');
    expect(msg).toBeTruthy();
    expect(typeof msg).toBe('string');
  });
});

// ─── FEEDBACK_CATEGORIES and CALL_INTENT_OPTIONS — content checks ─────────────

describe('FEEDBACK_CATEGORIES - content', () => {
  it('contains exactly the expected 6 categories', () => {
    expect(FEEDBACK_CATEGORIES).toHaveLength(6);
  });

  it('contains "Academic" and "Suggestion"', () => {
    expect(FEEDBACK_CATEGORIES).toContain('Academic');
    expect(FEEDBACK_CATEGORIES).toContain('Suggestion');
  });

  it('all entries are non-empty strings', () => {
    FEEDBACK_CATEGORIES.forEach(cat => {
      expect(typeof cat).toBe('string');
      expect(cat.trim().length).toBeGreaterThan(0);
    });
  });
});

describe('CALL_INTENT_OPTIONS - content', () => {
  it('contains "Not interested"', () => {
    expect(CALL_INTENT_OPTIONS).toContain('Not interested');
  });

  it('all entries are non-empty strings', () => {
    CALL_INTENT_OPTIONS.forEach(opt => {
      expect(typeof opt).toBe('string');
      expect(opt.trim().length).toBeGreaterThan(0);
    });
  });
});
