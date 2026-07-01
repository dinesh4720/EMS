import { describe, it, expect } from 'vitest';
import { CURRENT_ACADEMIC_YEAR } from '../utils/constants';
import {
  parentZodSchema,
  step1Schema,
  validateStep,
  ddmmyyToIso,
  isoToDdmmyy,
  buildStudentPayload,
} from './studentFormValidation';

// ─── parentZodSchema ─────────────────────────────────────────────────────────

describe('parentZodSchema', () => {
  it('accepts a valid parent object', () => {
    const result = parentZodSchema.safeParse({
      name: 'John Doe',
      phone: '9876543210',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = parentZodSchema.safeParse({ name: '', phone: '9876543210' });
    expect(result.success).toBe(false);
    expect(result.error.errors[0].path[0]).toBe('name');
  });

  it('rejects name exceeding 100 characters', () => {
    const result = parentZodSchema.safeParse({ name: 'A'.repeat(101), phone: '9876543210' });
    expect(result.success).toBe(false);
  });

  it('rejects phone with fewer than 10 digits', () => {
    const result = parentZodSchema.safeParse({ name: 'John', phone: '12345' });
    expect(result.success).toBe(false);
  });

  it('rejects phone with more than 10 digits', () => {
    const result = parentZodSchema.safeParse({ name: 'John', phone: '12345678901' });
    expect(result.success).toBe(false);
  });

  it('accepts valid optional email', () => {
    const result = parentZodSchema.safeParse({ name: 'John', phone: '9876543210', email: 'john@test.com' });
    expect(result.success).toBe(true);
  });

  it('accepts empty string email (optional)', () => {
    const result = parentZodSchema.safeParse({ name: 'John', phone: '9876543210', email: '' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = parentZodSchema.safeParse({ name: 'John', phone: '9876543210', email: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('accepts optional boolean fields', () => {
    const result = parentZodSchema.safeParse({ name: 'John', phone: '9876543210', isWhatsapp: true, isParent: true });
    expect(result.success).toBe(true);
  });
});

// ─── step1Schema ─────────────────────────────────────────────────────────────

describe('step1Schema', () => {
  const validStep1 = {
    fullName: 'Alice Smith',
    dateOfBirth: '15/06/2010',
    gender: 'Female',
    classGrade: 'Class 5',
    section: 'A',
  };

  it('accepts valid step 1 data', () => {
    const result = step1Schema.safeParse(validStep1);
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 2 characters', () => {
    const result = step1Schema.safeParse({ ...validStep1, fullName: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 100 characters', () => {
    const result = step1Schema.safeParse({ ...validStep1, fullName: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = step1Schema.safeParse({ ...validStep1, dateOfBirth: '2010-06-15' });
    expect(result.success).toBe(false);
  });

  it('rejects empty gender', () => {
    const result = step1Schema.safeParse({ ...validStep1, gender: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty classGrade', () => {
    const result = step1Schema.safeParse({ ...validStep1, classGrade: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty section', () => {
    const result = step1Schema.safeParse({ ...validStep1, section: '' });
    expect(result.success).toBe(false);
  });

  it('rejects aadhaar number with wrong length', () => {
    const result = step1Schema.safeParse({ ...validStep1, aadhaarNumber: '12345' });
    expect(result.success).toBe(false);
  });

  it('accepts valid 12-digit aadhaar number', () => {
    const result = step1Schema.safeParse({ ...validStep1, aadhaarNumber: '123456789012' });
    expect(result.success).toBe(true);
  });

  it('accepts empty aadhaar (optional)', () => {
    const result = step1Schema.safeParse({ ...validStep1, aadhaarNumber: '' });
    expect(result.success).toBe(true);
  });

  it('rejects mobile with wrong length', () => {
    const result = step1Schema.safeParse({ ...validStep1, mobile: '12345' });
    expect(result.success).toBe(false);
  });

  it('accepts valid 10-digit mobile', () => {
    const result = step1Schema.safeParse({ ...validStep1, mobile: '9876543210' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = step1Schema.safeParse({ ...validStep1, email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects zip code with wrong length', () => {
    const result = step1Schema.safeParse({ ...validStep1, zipCode: '1234' });
    expect(result.success).toBe(false);
  });

  it('accepts valid 6-digit zip code', () => {
    const result = step1Schema.safeParse({ ...validStep1, zipCode: '400001' });
    expect(result.success).toBe(true);
  });
});

// ─── validateStep ────────────────────────────────────────────────────────────

describe('validateStep', () => {
  describe('step 1', () => {
    const validStep1Data = {
      fullName: 'Alice Smith',
      dateOfBirth: '15/06/2010',
      gender: 'Female',
      classGrade: 'Class 5',
      section: 'A',
    };

    it('returns isValid true for valid data', () => {
      const result = validateStep(1, validStep1Data);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('returns error for missing fullName', () => {
      const result = validateStep(1, { ...validStep1Data, fullName: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.fullName).toBeDefined();
    });

    it('returns error for invalid date format', () => {
      const result = validateStep(1, { ...validStep1Data, dateOfBirth: '2010-06-15' });
      expect(result.isValid).toBe(false);
      expect(result.errors.dateOfBirth).toBeDefined();
    });

    it('returns error for invalid calendar date like 31/02/2010', () => {
      const result = validateStep(1, { ...validStep1Data, dateOfBirth: '31/02/2010' });
      expect(result.isValid).toBe(false);
      expect(result.errors.dateOfBirth).toBe('Invalid calendar date');
    });

    it('returns error for year before 1900', () => {
      const result = validateStep(1, { ...validStep1Data, dateOfBirth: '01/01/1899' });
      expect(result.isValid).toBe(false);
      expect(result.errors.dateOfBirth).toBe('Year must be 1900 or later');
    });

    it('returns error for future date of birth', () => {
      const futureYear = new Date().getFullYear() + 1;
      const result = validateStep(1, { ...validStep1Data, dateOfBirth: `01/01/${futureYear}` });
      expect(result.isValid).toBe(false);
      expect(result.errors.dateOfBirth).toBe('Date of birth cannot be in the future');
    });

    it('accepts a valid leap year date 29/02/2000', () => {
      const result = validateStep(1, { ...validStep1Data, dateOfBirth: '29/02/2000' });
      expect(result.isValid).toBe(true);
    });

    it('rejects invalid leap year date 29/02/2001', () => {
      const result = validateStep(1, { ...validStep1Data, dateOfBirth: '29/02/2001' });
      expect(result.isValid).toBe(false);
      expect(result.errors.dateOfBirth).toBe('Invalid calendar date');
    });

    it('returns multiple errors at once', () => {
      const result = validateStep(1, { fullName: '', dateOfBirth: '', gender: '', classGrade: '', section: '' });
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('step 2', () => {
    it('returns error when parents array is empty', () => {
      const result = validateStep(2, { parents: [] });
      expect(result.isValid).toBe(false);
      expect(result.errors.parentName).toBeDefined();
    });

    it('returns error when first parent has empty name', () => {
      const result = validateStep(2, { parents: [{ name: '  ', phone: '9876543210' }] });
      expect(result.isValid).toBe(false);
      expect(result.errors.parentName).toBeDefined();
    });

    it('returns error for invalid first parent phone', () => {
      const result = validateStep(2, { parents: [{ name: 'John', phone: '12345' }] });
      expect(result.isValid).toBe(false);
      expect(result.errors.parentPhone).toBeDefined();
    });

    it('returns error for invalid first parent email', () => {
      const result = validateStep(2, { parents: [{ name: 'John', phone: '9876543210', email: 'bad' }] });
      expect(result.isValid).toBe(false);
      expect(result.errors.parentEmail).toBeDefined();
    });

    it('returns isValid true for valid parent data', () => {
      const result = validateStep(2, { parents: [{ name: 'John', phone: '9876543210' }] });
      expect(result.isValid).toBe(true);
    });

    it('validates additional parents phone numbers', () => {
      const result = validateStep(2, {
        parents: [
          { name: 'John', phone: '9876543210' },
          { name: 'Jane', phone: '123' },
        ],
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.additionalParentPhone_1).toBeDefined();
    });

    it('validates additional parents email format', () => {
      const result = validateStep(2, {
        parents: [
          { name: 'John', phone: '9876543210' },
          { name: 'Jane', phone: '9876543211', email: 'bad-email' },
        ],
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.additionalParentEmail_1).toBeDefined();
    });

    it('accepts valid additional parents', () => {
      const result = validateStep(2, {
        parents: [
          { name: 'John', phone: '9876543210' },
          { name: 'Jane', phone: '9876543211', email: 'jane@test.com' },
        ],
      });
      expect(result.isValid).toBe(true);
    });
  });
});

// ─── ddmmyyToIso ─────────────────────────────────────────────────────────────

describe('ddmmyyToIso', () => {
  it('converts DD/MM/YYYY to YYYY-MM-DD', () => {
    expect(ddmmyyToIso('15/06/2010')).toBe('2010-06-15');
  });

  it('returns empty string for null', () => {
    expect(ddmmyyToIso(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(ddmmyyToIso(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(ddmmyyToIso('')).toBe('');
  });

  it('returns empty string for non-string', () => {
    expect(ddmmyyToIso(12345)).toBe('');
  });

  it('returns empty string for invalid format', () => {
    expect(ddmmyyToIso('2010-06-15')).toBe('');
  });

  it('handles 01/01/2000', () => {
    expect(ddmmyyToIso('01/01/2000')).toBe('2000-01-01');
  });

  it('handles 31/12/1999', () => {
    expect(ddmmyyToIso('31/12/1999')).toBe('1999-12-31');
  });
});

// ─── isoToDdmmyy ─────────────────────────────────────────────────────────────

describe('isoToDdmmyy', () => {
  it('converts YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(isoToDdmmyy('2010-06-15')).toBe('15/06/2010');
  });

  it('returns empty string for null', () => {
    expect(isoToDdmmyy(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(isoToDdmmyy(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(isoToDdmmyy('')).toBe('');
  });

  it('returns empty string for non-string', () => {
    expect(isoToDdmmyy(12345)).toBe('');
  });

  it('returns empty string for invalid format', () => {
    expect(isoToDdmmyy('15/06/2010')).toBe('');
  });

  it('roundtrips with ddmmyyToIso', () => {
    const original = '25/12/2005';
    expect(isoToDdmmyy(ddmmyyToIso(original))).toBe(original);
  });
});

// ─── buildStudentPayload ─────────────────────────────────────────────────────

describe('buildStudentPayload', () => {
  const baseFormData = {
    fullName: 'Alice Smith',
    dateOfBirth: '15/06/2010',
    gender: 'Female',
    rollNumber: '5',
    bloodGroup: 'O+',
    email: 'alice@test.com',
    mobile: '9876543210',
    address: '123 Main St',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    aadhaarNumber: '123456789012',
    nationality: 'Indian',
    religion: 'Hindu',
    category: 'General',
    motherTongue: 'Hindi',
    previousSchool: 'Old School',
    tcNumber: 'TC001',
    transportRequired: false,
    hostelRequired: false,
    medicalConditions: '',
    emergencyContactName: 'Bob',
    emergencyContactPhone: '9876543211',
    alternatePhone: '',
    isWhatsapp: true,
    whatsappNumber: '9876543210',
    parents: [{ name: 'John', phone: '9876543210', email: 'john@test.com', relationship: 'Father', occupation: 'Engineer' }],
    siblings: [],
  };

  const baseOptions = {
    classId: 'cls1',
    admissionId: 'ADM001',
    academicYear: CURRENT_ACADEMIC_YEAR,
    photoUrl: 'http://photo.jpg',
    documents: [],
    initialData: null,
  };

  it('maps fullName to name', () => {
    const result = buildStudentPayload(baseFormData, baseOptions);
    expect(result.name).toBe('Alice Smith');
  });

  it('converts DD/MM/YYYY dateOfBirth to ISO', () => {
    const result = buildStudentPayload(baseFormData, baseOptions);
    expect(result.dateOfBirth).toBe('2010-06-15');
  });

  it('leaves ISO dateOfBirth unchanged', () => {
    const result = buildStudentPayload({ ...baseFormData, dateOfBirth: '2010-06-15' }, baseOptions);
    expect(result.dateOfBirth).toBe('2010-06-15');
  });

  it('parses rollNumber to integer', () => {
    const result = buildStudentPayload(baseFormData, baseOptions);
    expect(result.rollNo).toBe(5);
  });

  it('sets rollNo to null when rollNumber is empty', () => {
    const result = buildStudentPayload({ ...baseFormData, rollNumber: '' }, baseOptions);
    expect(result.rollNo).toBeNull();
  });

  it('includes classId and admissionId from options', () => {
    const result = buildStudentPayload(baseFormData, baseOptions);
    expect(result.classId).toBe('cls1');
    expect(result.admissionId).toBe('ADM001');
    expect(result.academicYear).toBe(CURRENT_ACADEMIC_YEAR);
  });

  it('maps first parent fields to top-level', () => {
    const result = buildStudentPayload(baseFormData, baseOptions);
    expect(result.parentName).toBe('John');
    expect(result.parentPhone).toBe('9876543210');
    expect(result.parentEmail).toBe('john@test.com');
    expect(result.parentRelationship).toBe('Father');
    expect(result.parentOccupation).toBe('Engineer');
  });

  it('includes photo URL from options', () => {
    const result = buildStudentPayload(baseFormData, baseOptions);
    expect(result.photo).toBe('http://photo.jpg');
  });

  it('sets status=active and feeStatus=pending for new students', () => {
    const result = buildStudentPayload(baseFormData, baseOptions);
    expect(result.status).toBe('active');
    expect(result.feeStatus).toBe('pending');
  });

  it('preserves status from initialData for existing students', () => {
    const result = buildStudentPayload(baseFormData, {
      ...baseOptions,
      initialData: { status: 'inactive', feeStatus: 'paid' },
    });
    expect(result.status).toBe('inactive');
    expect(result.feeStatus).toBe('paid');
  });

  it('uses initialData documents when no new documents provided', () => {
    const existingDocs = [{ name: 'doc.pdf', url: 'http://doc.pdf' }];
    const result = buildStudentPayload(baseFormData, {
      ...baseOptions,
      documents: [],
      initialData: { documents: existingDocs },
    });
    expect(result.documents).toEqual(existingDocs);
  });

  it('uses new documents when provided', () => {
    const newDocs = [{ name: 'new.pdf', url: 'http://new.pdf' }];
    const result = buildStudentPayload(baseFormData, {
      ...baseOptions,
      documents: newDocs,
    });
    expect(result.documents).toEqual(newDocs);
  });

  it('removes undefined values from payload', () => {
    const formWithUndefined = { ...baseFormData, medicalConditions: undefined };
    const result = buildStudentPayload(formWithUndefined, baseOptions);
    expect('medicalConditions' in result).toBe(false);
  });

  it('removes empty plain objects from payload', () => {
    const formWithEmptyObj = { ...baseFormData, someField: {} };
    const result = buildStudentPayload(formWithEmptyObj, baseOptions);
    expect('someField' in result).toBe(false);
  });
});
