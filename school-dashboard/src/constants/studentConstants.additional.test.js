import { describe, it, expect } from 'vitest';
import {
  GUARDIAN_RELATIONSHIPS, RELIGIONS, VALIDATION_RULES,
  PARENT_RELATIONSHIPS, DEFAULT_STUDENT_FORM,
} from './studentConstants';

describe('GUARDIAN_RELATIONSHIPS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(GUARDIAN_RELATIONSHIPS)).toBe(true);
    expect(GUARDIAN_RELATIONSHIPS.length).toBeGreaterThan(0);
  });

  it('contains Grandparent and Sibling', () => {
    expect(GUARDIAN_RELATIONSHIPS).toContain('Grandparent');
    expect(GUARDIAN_RELATIONSHIPS).toContain('Sibling');
  });

  it('contains Other as fallback', () => {
    expect(GUARDIAN_RELATIONSHIPS).toContain('Other');
  });

  it('has no duplicate entries', () => {
    const unique = new Set(GUARDIAN_RELATIONSHIPS);
    expect(unique.size).toBe(GUARDIAN_RELATIONSHIPS.length);
  });
});

describe('RELIGIONS', () => {
  it('contains major world religions', () => {
    ['Hinduism', 'Islam', 'Christianity', 'Sikhism', 'Buddhism'].forEach((r) => {
      expect(RELIGIONS).toContain(r);
    });
  });

  it('contains Other as fallback', () => {
    expect(RELIGIONS).toContain('Other');
  });

  it('is an array of strings', () => {
    RELIGIONS.forEach((r) => expect(typeof r).toBe('string'));
  });
});

describe('PARENT_RELATIONSHIPS vs GUARDIAN_RELATIONSHIPS', () => {
  it('are separate arrays with no overlap', () => {
    const parentSet = new Set(PARENT_RELATIONSHIPS);
    GUARDIAN_RELATIONSHIPS.forEach((rel) => {
      expect(parentSet.has(rel)).toBe(false);
    });
  });
});

describe('VALIDATION_RULES', () => {
  it('has name, phone, aadhaar, zipCode, email rules', () => {
    expect(VALIDATION_RULES).toHaveProperty('name');
    expect(VALIDATION_RULES).toHaveProperty('phone');
    expect(VALIDATION_RULES).toHaveProperty('aadhaar');
    expect(VALIDATION_RULES).toHaveProperty('zipCode');
    expect(VALIDATION_RULES).toHaveProperty('email');
  });

  it('name pattern accepts letters and spaces', () => {
    expect(VALIDATION_RULES.name.pattern.test('John Doe')).toBe(true);
  });

  it('name pattern accepts Hindi names', () => {
    expect(VALIDATION_RULES.name.pattern.test('राहुल शर्मा')).toBe(true);
  });

  it('name pattern accepts Tamil names', () => {
    expect(VALIDATION_RULES.name.pattern.test('முருகன்')).toBe(true);
  });

  it('name pattern accepts Telugu names', () => {
    expect(VALIDATION_RULES.name.pattern.test('రాజేష్')).toBe(true);
  });

  it('name pattern rejects digits', () => {
    expect(VALIDATION_RULES.name.pattern.test('John123')).toBe(false);
  });

  it('phone pattern accepts exactly 10 digits', () => {
    expect(VALIDATION_RULES.phone.pattern.test('9876543210')).toBe(true);
  });

  it('phone pattern rejects 9 digits', () => {
    expect(VALIDATION_RULES.phone.pattern.test('987654321')).toBe(false);
  });

  it('aadhaar pattern accepts exactly 12 digits', () => {
    expect(VALIDATION_RULES.aadhaar.pattern.test('123456789012')).toBe(true);
  });

  it('aadhaar pattern rejects 11 digits', () => {
    expect(VALIDATION_RULES.aadhaar.pattern.test('12345678901')).toBe(false);
  });

  it('zipCode pattern accepts exactly 6 digits', () => {
    expect(VALIDATION_RULES.zipCode.pattern.test('560001')).toBe(true);
  });

  it('zipCode pattern rejects 5-digit US zip', () => {
    expect(VALIDATION_RULES.zipCode.pattern.test('90210')).toBe(false);
  });

  it('email pattern accepts valid email', () => {
    expect(VALIDATION_RULES.email.pattern.test('student@school.edu')).toBe(true);
  });

  it('email pattern rejects missing @', () => {
    expect(VALIDATION_RULES.email.pattern.test('studentatschool.edu')).toBe(false);
  });

  it('all rules have a message string', () => {
    Object.values(VALIDATION_RULES).forEach((rule) => {
      expect(typeof rule.message).toBe('string');
      expect(rule.message.length).toBeGreaterThan(0);
    });
  });
});

describe('DEFAULT_STUDENT_FORM parent structure', () => {
  it('has a parents array', () => {
    expect(DEFAULT_STUDENT_FORM).toHaveProperty('parents');
    expect(Array.isArray(DEFAULT_STUDENT_FORM.parents)).toBe(true);
  });

  it('first parent has name, phone, relationship fields', () => {
    const parent = DEFAULT_STUDENT_FORM.parents[0];
    expect(parent).toHaveProperty('name');
    expect(parent).toHaveProperty('phone');
    expect(parent).toHaveProperty('relationship');
  });

  it('has emergency contact fields', () => {
    expect(DEFAULT_STUDENT_FORM).toHaveProperty('emergencyContactName');
    expect(DEFAULT_STUDENT_FORM).toHaveProperty('emergencyContactPhone');
  });
});
