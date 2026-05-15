import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  validateRequired,
  validateEmail,
  validatePhone,
  validateDate,
  validateAadhaar,
  validateZip,
  normalizeClassName,
  validateClassSection,
  validateStudentData,
  checkForDuplicates,
  groupStudentsByClassSection,
  transformStudentForImport,
} from './studentImportUtils';

// ─── parseCSV ─────────────────────────────────────────────────────────────────

describe('parseCSV', () => {
  it('parses a simple CSV with headers and one row', () => {
    const csv = 'name,class\nAlice,5';
    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    // Implementation also attaches _csvRow for error reporting; only assert
    // the user-facing fields with toMatchObject.
    expect(result[0]).toMatchObject({ name: 'Alice', class: '5' });
  });

  it('handles quoted values by stripping surrounding quotes', () => {
    const csv = 'name,class\n"Alice","5"';
    const result = parseCSV(csv);
    expect(result[0]).toMatchObject({ name: 'Alice', class: '5' });
  });

  it('skips blank lines in the data', () => {
    const csv = 'name,class\nAlice,5\n   \nBob,6';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
  });

  it('throws when CSV has only a header row and no data', () => {
    expect(() => parseCSV('name,class')).toThrow('CSV file is empty or has no data rows');
  });

  it('throws when CSV text is empty', () => {
    expect(() => parseCSV('')).toThrow();
  });

  it('trims whitespace from header names and values', () => {
    const csv = ' name , class \n Alice , 5 ';
    const result = parseCSV(csv);
    expect(result[0]).toMatchObject({ name: 'Alice', class: '5' });
  });

  it('handles Windows-style CRLF line endings', () => {
    const csv = 'name,class\r\nAlice,5\r\nBob,6';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
  });

  it('uses empty string for missing column values', () => {
    const csv = 'name,class,section\nAlice,5';
    const result = parseCSV(csv);
    expect(result[0].section).toBe('');
  });
});

// ─── validateRequired ─────────────────────────────────────────────────────────

describe('validateRequired', () => {
  it('returns invalid for empty string', () => {
    expect(validateRequired('', 'name').valid).toBe(false);
  });

  it('returns invalid for whitespace-only string', () => {
    expect(validateRequired('   ', 'name').valid).toBe(false);
  });

  it('returns invalid for null', () => {
    expect(validateRequired(null, 'name').valid).toBe(false);
  });

  it('returns invalid for undefined', () => {
    expect(validateRequired(undefined, 'name').valid).toBe(false);
  });

  it('returns valid for a non-empty string', () => {
    expect(validateRequired('Alice', 'name').valid).toBe(true);
  });

  it('includes the field name in the error message', () => {
    const result = validateRequired('', 'parentName');
    expect(result.message).toContain('parentName');
  });
});

// ─── validateEmail ────────────────────────────────────────────────────────────

describe('validateEmail', () => {
  it('returns valid for an empty string (email is optional)', () => {
    expect(validateEmail('').valid).toBe(true);
  });

  it('returns valid for a well-formed email', () => {
    expect(validateEmail('alice@example.com').valid).toBe(true);
  });

  it('returns invalid for email missing @', () => {
    expect(validateEmail('aliceexample.com').valid).toBe(false);
  });

  it('returns invalid for email missing domain', () => {
    expect(validateEmail('alice@').valid).toBe(false);
  });

  it('returns invalid for email with spaces', () => {
    expect(validateEmail('alice @example.com').valid).toBe(false);
  });

  it('returns invalid for email missing TLD', () => {
    expect(validateEmail('alice@example').valid).toBe(false);
  });

  it('returns valid when email is null (optional)', () => {
    expect(validateEmail(null).valid).toBe(true);
  });
});

// ─── validatePhone ────────────────────────────────────────────────────────────

describe('validatePhone', () => {
  it('returns valid for empty (optional)', () => {
    expect(validatePhone('').valid).toBe(true);
  });

  it('returns valid for a 10-digit number', () => {
    expect(validatePhone('9876543210').valid).toBe(true);
  });

  it('returns invalid for a 9-digit number', () => {
    expect(validatePhone('987654321').valid).toBe(false);
  });

  it('returns invalid for an 11-digit number', () => {
    expect(validatePhone('98765432101').valid).toBe(false);
  });

  it('strips non-digit characters before checking length', () => {
    expect(validatePhone('+91-9876543210').valid).toBe(false); // 11 raw digits
  });

  it('returns valid for exactly 10 digits with dashes stripped', () => {
    expect(validatePhone('98-76-54-32-10').valid).toBe(true);
  });

  it('returns valid when null (optional)', () => {
    expect(validatePhone(null).valid).toBe(true);
  });
});

// ─── validateDate ─────────────────────────────────────────────────────────────

describe('validateDate', () => {
  it('returns valid for empty string (optional)', () => {
    expect(validateDate('').valid).toBe(true);
  });

  it('returns valid for YYYY-MM-DD format', () => {
    expect(validateDate('2000-01-15').valid).toBe(true);
  });

  it('returns valid for DD-MM-YYYY format', () => {
    expect(validateDate('15-01-2000').valid).toBe(true);
  });

  it('returns invalid for unsupported format', () => {
    expect(validateDate('01/15/2000').valid).toBe(false);
  });

  it('returns invalid for a non-date string', () => {
    expect(validateDate('not-a-date').valid).toBe(false);
  });

  it('returns valid for null (optional)', () => {
    expect(validateDate(null).valid).toBe(true);
  });
});

// ─── validateAadhaar ─────────────────────────────────────────────────────────

describe('validateAadhaar', () => {
  it('returns valid for empty (optional)', () => {
    expect(validateAadhaar('').valid).toBe(true);
  });

  it('returns valid for exactly 12 digits', () => {
    expect(validateAadhaar('123456789012').valid).toBe(true);
  });

  it('returns invalid for 11 digits', () => {
    expect(validateAadhaar('12345678901').valid).toBe(false);
  });

  it('returns invalid for 13 digits', () => {
    expect(validateAadhaar('1234567890123').valid).toBe(false);
  });

  it('strips non-digit characters before checking', () => {
    expect(validateAadhaar('1234 5678 9012').valid).toBe(true);
  });
});

// ─── validateZip ──────────────────────────────────────────────────────────────

describe('validateZip', () => {
  it('returns valid for empty (optional)', () => {
    expect(validateZip('').valid).toBe(true);
  });

  it('returns valid for exactly 6 digits', () => {
    expect(validateZip('400001').valid).toBe(true);
  });

  it('returns invalid for 5 digits', () => {
    expect(validateZip('40000').valid).toBe(false);
  });

  it('returns invalid for 7 digits', () => {
    expect(validateZip('4000010').valid).toBe(false);
  });
});

// ─── normalizeClassName ───────────────────────────────────────────────────────

describe('normalizeClassName', () => {
  it('strips leading "Class " prefix (case-insensitive)', () => {
    expect(normalizeClassName('Class 5')).toBe('5');
  });

  it('strips leading digit-dash prefix', () => {
    expect(normalizeClassName('5 - A')).toBe('A');
  });

  it('returns empty string for null/undefined', () => {
    expect(normalizeClassName(null)).toBe('');
    expect(normalizeClassName(undefined)).toBe('');
  });

  it('trims surrounding whitespace but does not strip "Class " prefix when preceded by spaces', () => {
    // The regex /^Class\s*/i only matches if "Class" is at the start of the string.
    // '  Class 5  ' has leading spaces, so "Class" is not at position 0 → not stripped.
    // Result: '  Class 5  '.trim() = 'Class 5'
    expect(normalizeClassName('  Class 5  ')).toBe('Class 5');
  });

  it('leaves a plain name unchanged', () => {
    expect(normalizeClassName('Science')).toBe('Science');
  });
});

// ─── validateClassSection ────────────────────────────────────────────────────

describe('validateClassSection', () => {
  const classes = [
    { name: 'Class 5', section: 'A', _id: '1' },
    { name: 'Class 5', section: 'B', _id: '2' },
    { name: 'Class 6', section: '', _id: '3' },
  ];

  it('returns invalid when class is missing', () => {
    const result = validateClassSection({ class: '' }, classes);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Class is required');
  });

  it('returns invalid when class is not in list', () => {
    const result = validateClassSection({ class: 'Class 99' }, classes);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('returns invalid when section required but missing', () => {
    const result = validateClassSection({ class: 'Class 5', section: '' }, classes);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('sections');
  });

  it('returns invalid when section not found in class', () => {
    const result = validateClassSection({ class: 'Class 5', section: 'Z' }, classes);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Section "Z" not found');
  });

  it('returns valid with correct class and section', () => {
    const result = validateClassSection({ class: 'Class 5', section: 'A' }, classes);
    expect(result.valid).toBe(true);
  });

  it('returns valid with warning for no-section class', () => {
    const result = validateClassSection({ class: 'Class 6', section: '' }, classes);
    expect(result.valid).toBe(true);
    expect(result.warning).toBeDefined();
  });

  it('matches class name case-insensitively', () => {
    const result = validateClassSection({ class: 'class 5', section: 'A' }, classes);
    expect(result.valid).toBe(true);
  });
});

// ─── validateStudentData ──────────────────────────────────────────────────────

describe('validateStudentData', () => {
  const classes = [{ name: 'Class 5', section: 'A', _id: '1' }];

  const validStudent = {
    name: 'Alice',
    class: 'Class 5',
    section: 'A',
    parentName: 'Bob',
    parentPhone: '9876543210',
  };

  it('returns valid for a fully correct student', () => {
    const result = validateStudentData(validStudent, [], classes);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('returns error when name is missing', () => {
    const result = validateStudentData({ ...validStudent, name: '' }, [], classes);
    expect(result.errors.name).toBeDefined();
  });

  it('returns error when parentName is missing', () => {
    const result = validateStudentData({ ...validStudent, parentName: '' }, [], classes);
    expect(result.errors.parentName).toBeDefined();
  });

  it('returns error for invalid email', () => {
    const result = validateStudentData({ ...validStudent, email: 'bad-email' }, [], classes);
    expect(result.errors.email).toBeDefined();
  });

  it('returns warning for missing email', () => {
    const result = validateStudentData(validStudent, [], classes);
    const emailWarning = result.warnings.find(w => w.includes('Email'));
    expect(emailWarning).toBeDefined();
  });

  it('returns error for invalid gender value', () => {
    const result = validateStudentData({ ...validStudent, gender: 'Unknown' }, [], classes);
    expect(result.errors.gender).toBeDefined();
  });

  it('accepts valid gender values', () => {
    for (const gender of ['Male', 'Female', 'Other']) {
      const result = validateStudentData({ ...validStudent, gender }, [], classes);
      expect(result.errors.gender).toBeUndefined();
    }
  });

  it('returns error for invalid aadhaar number', () => {
    const result = validateStudentData({ ...validStudent, aadhaarNumber: '123' }, [], classes);
    expect(result.errors.aadhaarNumber).toBeDefined();
  });

  it('isDuplicate defaults to false', () => {
    const result = validateStudentData(validStudent, [], classes);
    expect(result.isDuplicate).toBe(false);
  });
});

// ─── checkForDuplicates ───────────────────────────────────────────────────────

describe('checkForDuplicates', () => {
  const makeValidated = (data) => ({ valid: true, errors: {}, warnings: [], data, isDuplicate: false });

  it('detects duplicate by admissionId', () => {
    const student = makeValidated({ name: 'Alice', admissionId: 'ADM001', class: 'Class 5', parentPhone: '9876543210' });
    const existing = [{ name: 'Bob', admissionId: 'ADM001', class: 'Class 5', parentPhone: '1234567890' }];
    const result = checkForDuplicates([student], existing);
    expect(result[0].isDuplicate).toBe(true);
    expect(result[0].errors.duplicate).toContain('ADM001');
  });

  it('detects duplicate by name + class + parentPhone', () => {
    const student = makeValidated({ name: 'Alice', admissionId: 'ADM002', class: 'Class 5', parentPhone: '9876543210' });
    const existing = [{ name: 'Alice', admissionId: 'ADM999', class: 'Class 5', parentPhone: '9876543210' }];
    const result = checkForDuplicates([student], existing);
    expect(result[0].isDuplicate).toBe(true);
  });

  it('leaves non-duplicate students unchanged', () => {
    const student = makeValidated({ name: 'Alice', admissionId: 'ADM003', class: 'Class 5', parentPhone: '9876543210' });
    const existing = [{ name: 'Bob', admissionId: 'ADM004', class: 'Class 6', parentPhone: '1111111111' }];
    const result = checkForDuplicates([student], existing);
    expect(result[0].isDuplicate).toBe(false);
  });

  it('handles empty existing students', () => {
    const student = makeValidated({ name: 'Alice', admissionId: 'ADM001', class: 'Class 5', parentPhone: '9876543210' });
    const result = checkForDuplicates([student], []);
    expect(result[0].isDuplicate).toBe(false);
  });
});

// ─── groupStudentsByClassSection ─────────────────────────────────────────────

describe('groupStudentsByClassSection', () => {
  it('groups students by class and section', () => {
    const students = [
      { valid: true, isDuplicate: false, data: { class: 'Class 5', section: 'A' } },
      { valid: true, isDuplicate: false, data: { class: 'Class 5', section: 'A' } },
      { valid: false, isDuplicate: false, data: { class: 'Class 5', section: 'B' } },
    ];
    const groups = groupStudentsByClassSection(students);
    expect(Object.keys(groups)).toHaveLength(2);
    expect(groups['Class 5 - Section A'].validCount).toBe(2);
    expect(groups['Class 5 - Section B'].invalidCount).toBe(1);
  });

  it('uses class name as key when no section', () => {
    const students = [
      { valid: true, isDuplicate: false, data: { class: 'Class 6', section: '' } },
    ];
    const groups = groupStudentsByClassSection(students);
    expect(groups['Class 6']).toBeDefined();
  });

  it('counts duplicates separately', () => {
    const students = [
      { valid: true, isDuplicate: true, data: { class: 'Class 5', section: 'A' } },
    ];
    const groups = groupStudentsByClassSection(students);
    expect(groups['Class 5 - Section A'].duplicateCount).toBe(1);
    expect(groups['Class 5 - Section A'].validCount).toBe(0);
  });
});

// ─── transformStudentForImport ────────────────────────────────────────────────

describe('transformStudentForImport', () => {
  const classes = [{ _id: 'cls1', name: 'Class 5', section: 'A' }];
  const academicYear = '2024-25';

  const baseData = {
    name: 'Alice',
    class: 'Class 5',
    section: 'A',
    parentName: 'Bob',
    parentPhone: '9876543210',
  };

  it('correctly maps classId from matched class', () => {
    const result = transformStudentForImport(baseData, classes, academicYear);
    expect(result.classId).toBe('cls1');
  });

  it('uses currentAcademicYear as fallback when not in data', () => {
    const result = transformStudentForImport(baseData, classes, academicYear);
    expect(result.academicYear).toBe(academicYear);
  });

  it('uses data.academicYear when provided', () => {
    const result = transformStudentForImport({ ...baseData, academicYear: '2023-24' }, classes, academicYear);
    expect(result.academicYear).toBe('2023-24');
  });

  it('sets status to active and feeStatus to pending', () => {
    const result = transformStudentForImport(baseData, classes, academicYear);
    expect(result.status).toBe('active');
    expect(result.feeStatus).toBe('pending');
  });

  it('converts rollNo to integer', () => {
    const result = transformStudentForImport({ ...baseData, rollNo: '12' }, classes, academicYear);
    expect(result.rollNo).toBe(12);
  });

  it('sets rollNo to null when absent', () => {
    const result = transformStudentForImport(baseData, classes, academicYear);
    expect(result.rollNo).toBeNull();
  });

  it('builds parents array when parentName is present', () => {
    const result = transformStudentForImport(baseData, classes, academicYear);
    expect(result.parents).toHaveLength(1);
    expect(result.parents[0].name).toBe('Bob');
    expect(result.parents[0].isWhatsapp).toBe(true);
  });

  it('sets parents to undefined when parentName is missing', () => {
    const result = transformStudentForImport({ ...baseData, parentName: '' }, classes, academicYear);
    expect(result.parents).toBeUndefined();
  });

  it('throws when class is not found', () => {
    expect(() =>
      transformStudentForImport({ ...baseData, class: 'Class 99', section: 'A' }, classes, academicYear)
    ).toThrow('not found');
  });
});
