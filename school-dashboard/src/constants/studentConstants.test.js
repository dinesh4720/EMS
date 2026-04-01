import { describe, it, expect } from 'vitest';
import {
  GENDERS, BLOOD_GROUPS, PARENT_RELATIONSHIPS, GUARDIAN_RELATIONSHIPS,
  RELIGIONS, CATEGORIES, MOTHER_TONGUES, STUDENT_STATUSES, FEE_STATUSES,
  DEFAULT_STUDENT_FORM,
} from './studentConstants';

describe('GENDERS', () => {
  it('includes Male, Female, Other', () => {
    expect(GENDERS).toContain('Male');
    expect(GENDERS).toContain('Female');
    expect(GENDERS).toContain('Other');
  });

  it('has exactly 3 options', () => {
    expect(GENDERS).toHaveLength(3);
  });
});

describe('BLOOD_GROUPS', () => {
  it('contains all 8 standard blood groups', () => {
    const expected = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    expected.forEach((bg) => expect(BLOOD_GROUPS).toContain(bg));
  });
});

describe('PARENT_RELATIONSHIPS', () => {
  it('contains Father and Mother', () => {
    expect(PARENT_RELATIONSHIPS).toContain('Father');
    expect(PARENT_RELATIONSHIPS).toContain('Mother');
  });
});

describe('STUDENT_STATUSES', () => {
  it('has ACTIVE, INACTIVE, ALUMNI', () => {
    expect(STUDENT_STATUSES.ACTIVE).toBe('active');
    expect(STUDENT_STATUSES.INACTIVE).toBe('inactive');
    expect(STUDENT_STATUSES.ALUMNI).toBe('alumni');
  });

  it('all values are lowercase', () => {
    Object.values(STUDENT_STATUSES).forEach((v) => {
      expect(v).toBe(v.toLowerCase());
    });
  });
});

describe('FEE_STATUSES', () => {
  it('has PAID, PENDING, OVERDUE, PARTIAL', () => {
    expect(FEE_STATUSES.PAID).toBe('paid');
    expect(FEE_STATUSES.PENDING).toBe('pending');
    expect(FEE_STATUSES.OVERDUE).toBe('overdue');
    expect(FEE_STATUSES.PARTIAL).toBe('partial');
  });
});

describe('DEFAULT_STUDENT_FORM', () => {
  it('has required personal info fields', () => {
    expect(DEFAULT_STUDENT_FORM).toHaveProperty('fullName');
    expect(DEFAULT_STUDENT_FORM).toHaveProperty('dateOfBirth');
    expect(DEFAULT_STUDENT_FORM).toHaveProperty('gender');
  });

  it('has class info fields', () => {
    expect(DEFAULT_STUDENT_FORM).toHaveProperty('classGrade');
    expect(DEFAULT_STUDENT_FORM).toHaveProperty('section');
    expect(DEFAULT_STUDENT_FORM).toHaveProperty('rollNumber');
  });

  it('has contact fields', () => {
    expect(DEFAULT_STUDENT_FORM).toHaveProperty('mobile');
    expect(DEFAULT_STUDENT_FORM).toHaveProperty('email');
    expect(DEFAULT_STUDENT_FORM).toHaveProperty('address');
  });

  it('defaults gender to empty string (no pre-selection)', () => {
    expect(DEFAULT_STUDENT_FORM.gender).toBe('');
  });

  it('defaults isWhatsapp to true', () => {
    expect(DEFAULT_STUDENT_FORM.isWhatsapp).toBe(true);
  });

  it('defaults picture to null', () => {
    expect(DEFAULT_STUDENT_FORM.picture).toBeNull();
  });
});

describe('CATEGORIES', () => {
  it('includes General, OBC, SC, ST, EWS', () => {
    ['General', 'OBC', 'SC', 'ST', 'EWS'].forEach((cat) => {
      expect(CATEGORIES).toContain(cat);
    });
  });
});

describe('MOTHER_TONGUES', () => {
  it('includes major Indian languages', () => {
    ['Hindi', 'Bengali', 'Telugu', 'Tamil', 'Marathi'].forEach((lang) => {
      expect(MOTHER_TONGUES).toContain(lang);
    });
  });

  it('includes Other as fallback', () => {
    expect(MOTHER_TONGUES).toContain('Other');
  });
});
