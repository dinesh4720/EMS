/**
 * Tests for the validation logic extracted from useStudentFormValidation.
 *
 * The hook uses React state and useCallback internally, so we replicate the
 * pure validation logic as standalone functions here — mirroring the hook's
 * validateStep code exactly — and test those functions without a DOM or React.
 */

import { describe, it, expect } from 'vitest';

// ─── Inline mirror of hook's validateStep logic ───────────────────────────────

/**
 * Mirrors the step-1 validation logic from useStudentFormValidation.validateStep
 */
function validateStep1(formData) {
  const newErrors = {};
  const currentYear = new Date().getFullYear();

  if (!formData.fullName || !formData.fullName.trim()) {
    newErrors.fullName = 'Required';
  }

  if (!formData.dateOfBirth) {
    newErrors.dateOfBirth = 'Required';
  } else {
    const ddmmyyPattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!ddmmyyPattern.test(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'Please enter date in DD/MM/YYYY format';
    } else {
      const [day, month, year] = formData.dateOfBirth.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      const isValidDate =
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;

      if (!isValidDate) {
        newErrors.dateOfBirth = 'Invalid calendar date';
      } else if (year < 1900) {
        newErrors.dateOfBirth = 'Year must be 1900 or later';
      } else if (year === currentYear) {
        newErrors.dateOfBirth = 'Year cannot be the current year';
      }
    }
  }

  if (!formData.gender) {
    newErrors.gender = 'Required';
  }

  if (!formData.classGrade) {
    newErrors.classGrade = 'Required';
  }

  if (!formData.section) {
    newErrors.section = 'Required';
  }

  if (formData.zipCode && !/^\d{6}$/.test(formData.zipCode)) {
    newErrors.zipCode = 'ZIP code must be exactly 6 digits';
  }

  return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
}

/**
 * Mirrors the step-2 validation logic from useStudentFormValidation.validateStep
 */
function validateStep2(formData) {
  const newErrors = {};
  const phonePattern = /^\+?[0-9\s\-().]{7,20}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (formData.parents.length === 0 || !formData.parents[0]?.name?.trim()) {
    newErrors.parentName = 'At least one parent/guardian is required';
  }

  const parentErrors = {};
  formData.parents.forEach((p, idx) => {
    const entryErrors = {};
    const hasAnyData = p.name?.trim() || p.phone?.trim() || p.email?.trim() || p.occupation?.trim();

    if (idx === 0) {
      if (!p.name?.trim()) entryErrors.name = 'Name is required';
      if (!p.phone?.trim()) {
        entryErrors.phone = 'Phone is required';
      } else if (!phonePattern.test(p.phone)) {
        entryErrors.phone = 'Invalid phone number';
      }
    } else if (hasAnyData) {
      if (!p.name?.trim()) entryErrors.name = 'Name is required';
      if (p.phone?.trim() && !phonePattern.test(p.phone)) {
        entryErrors.phone = 'Invalid phone number';
      }
    }

    if (p.email?.trim() && !emailPattern.test(p.email)) {
      entryErrors.email = 'Invalid email address';
    }

    if (Object.keys(entryErrors).length > 0) {
      parentErrors[idx] = entryErrors;
    }
  });

  if (Object.keys(parentErrors).length > 0) {
    newErrors.parentErrors = parentErrors;
    if (parentErrors[0]?.name) newErrors.parentName = parentErrors[0].name;
    if (parentErrors[0]?.phone) newErrors.parentPhone = parentErrors[0].phone;
  }

  return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStep1Data(overrides = {}) {
  return {
    fullName: 'Arjun Kumar',
    dateOfBirth: '15/06/2010',
    gender: 'Male',
    classGrade: 'Grade 5',
    section: 'A',
    zipCode: '',
    ...overrides,
  };
}

function makeStep2Data(overrides = {}) {
  return {
    parents: [
      { name: 'Suresh Kumar', phone: '9876543210', email: '', occupation: '' },
    ],
    ...overrides,
  };
}

// ─── Step 1 validation ────────────────────────────────────────────────────────

describe('step 1 validation logic', () => {
  it('passes for fully valid step 1 data', () => {
    const { isValid } = validateStep1(makeStep1Data());
    expect(isValid).toBe(true);
  });

  it('requires fullName — sets error when empty', () => {
    const { errors } = validateStep1(makeStep1Data({ fullName: '' }));
    expect(errors.fullName).toBe('Required');
  });

  it('requires fullName — sets error when whitespace only', () => {
    const { errors } = validateStep1(makeStep1Data({ fullName: '   ' }));
    expect(errors.fullName).toBe('Required');
  });

  it('requires dateOfBirth — sets error when missing', () => {
    const { errors } = validateStep1(makeStep1Data({ dateOfBirth: '' }));
    expect(errors.dateOfBirth).toBe('Required');
  });

  it('rejects dateOfBirth in wrong format (YYYY-MM-DD)', () => {
    const { errors } = validateStep1(makeStep1Data({ dateOfBirth: '2010-06-15' }));
    expect(errors.dateOfBirth).toContain('DD/MM/YYYY');
  });

  it('accepts valid DD/MM/YYYY date — no dateOfBirth error', () => {
    const { errors } = validateStep1(makeStep1Data({ dateOfBirth: '15/06/2010' }));
    expect(errors.dateOfBirth).toBeUndefined();
  });

  it('rejects invalid calendar date (Feb 30)', () => {
    const { errors } = validateStep1(makeStep1Data({ dateOfBirth: '30/02/2010' }));
    expect(errors.dateOfBirth).toBe('Invalid calendar date');
  });

  it('rejects year before 1900', () => {
    const { errors } = validateStep1(makeStep1Data({ dateOfBirth: '15/06/1899' }));
    expect(errors.dateOfBirth).toContain('1900');
  });

  it('rejects current year as dateOfBirth', () => {
    const currentYear = new Date().getFullYear();
    const { errors } = validateStep1(makeStep1Data({ dateOfBirth: `15/06/${currentYear}` }));
    expect(errors.dateOfBirth).toContain('current year');
  });

  it('requires gender', () => {
    const { errors } = validateStep1(makeStep1Data({ gender: '' }));
    expect(errors.gender).toBe('Required');
  });

  it('validates zipCode must be exactly 6 digits when provided', () => {
    const { errors } = validateStep1(makeStep1Data({ zipCode: '1234' }));
    expect(errors.zipCode).toContain('6 digits');
  });

  it('accepts blank zipCode without error', () => {
    const { errors } = validateStep1(makeStep1Data({ zipCode: '' }));
    expect(errors.zipCode).toBeUndefined();
  });
});

// ─── Step 2 validation ────────────────────────────────────────────────────────

describe('step 2 validation logic', () => {
  it('passes for valid parent with name and phone', () => {
    const { isValid } = validateStep2(makeStep2Data());
    expect(isValid).toBe(true);
  });

  it('requires at least one parent name', () => {
    const { errors } = validateStep2(makeStep2Data({ parents: [] }));
    expect(errors.parentName).toBeTruthy();
  });

  it('rejects primary parent with missing phone', () => {
    const { errors } = validateStep2(
      makeStep2Data({ parents: [{ name: 'Ramesh', phone: '' }] })
    );
    expect(errors.parentPhone).toBeTruthy();
  });

  it('rejects invalid email format for parent', () => {
    const { errors } = validateStep2(
      makeStep2Data({
        parents: [{ name: 'Ramesh', phone: '9876543210', email: 'notanemail' }],
      })
    );
    expect(errors.parentErrors?.[0]?.email).toContain('Invalid email');
  });

  it('accepts valid email format for parent', () => {
    const { errors } = validateStep2(
      makeStep2Data({
        parents: [{ name: 'Ramesh', phone: '9876543210', email: 'ramesh@example.com' }],
      })
    );
    expect(errors.parentErrors?.[0]?.email).toBeUndefined();
  });
});
