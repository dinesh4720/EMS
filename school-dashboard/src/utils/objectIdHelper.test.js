import { describe, it, expect } from 'vitest';
import { isObjectId, getSafeDisplayName, getSafeInitials, sanitizeObjectNames } from './objectIdHelper';

const VALID_OID = '507f1f77bcf86cd799439011';

describe('isObjectId', () => {
  it('returns true for valid 24-char hex string', () => {
    expect(isObjectId(VALID_OID)).toBe(true);
  });

  it('returns true for uppercase hex', () => {
    expect(isObjectId('507F1F77BCF86CD799439011')).toBe(true);
  });

  it('returns false for 23-char string', () => {
    expect(isObjectId('507f1f77bcf86cd79943901')).toBe(false);
  });

  it('returns false for 25-char string', () => {
    expect(isObjectId('507f1f77bcf86cd7994390111')).toBe(false);
  });

  it('returns false for non-hex characters', () => {
    expect(isObjectId('507f1f77bcf86cd79943901g')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isObjectId(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isObjectId(undefined)).toBe(false);
  });

  it('returns false for number', () => {
    expect(isObjectId(123456)).toBe(false);
  });

  it('returns false for normal name', () => {
    expect(isObjectId('John Doe')).toBe(false);
  });
});

describe('getSafeDisplayName', () => {
  it('returns "Unknown" for null entity', () => {
    expect(getSafeDisplayName(null)).toBe('Unknown');
  });

  it('returns name when name is valid', () => {
    expect(getSafeDisplayName({ name: 'Alice', code: 'A001' })).toBe('Alice');
  });

  it('falls back to code when name is ObjectId', () => {
    expect(getSafeDisplayName({ name: VALID_OID, code: 'A001' })).toBe('A001');
  });

  it('falls back to email when name is ObjectId and code is missing', () => {
    expect(getSafeDisplayName({ name: VALID_OID, email: 'alice@school.com' })).toBe('alice@school.com');
  });

  it('returns User prefix when all fields are ObjectIds', () => {
    const entity = { name: VALID_OID, code: VALID_OID, _id: '123' };
    expect(getSafeDisplayName(entity)).toMatch(/^User/);
  });
});

describe('getSafeInitials', () => {
  it('returns "?" for null name', () => {
    expect(getSafeInitials(null)).toBe('?');
  });

  it('returns "?" for ObjectId name', () => {
    expect(getSafeInitials(VALID_OID)).toBe('?');
  });

  it('returns first letter for single name', () => {
    expect(getSafeInitials('Alice')).toBe('A');
  });

  it('returns first + last initials for full name', () => {
    expect(getSafeInitials('Alice Johnson')).toBe('AJ');
  });

  it('returns first + last initials for multi-word name', () => {
    expect(getSafeInitials('Alice Mary Johnson')).toBe('AJ');
  });

  it('is uppercase', () => {
    expect(getSafeInitials('alice')).toBe('A');
  });
});

describe('sanitizeObjectNames', () => {
  it('returns non-objects unchanged', () => {
    expect(sanitizeObjectNames(null)).toBe(null);
    expect(sanitizeObjectNames('string')).toBe('string');
  });

  it('does not modify valid name', () => {
    const obj = { name: 'Alice', age: 10 };
    expect(sanitizeObjectNames(obj).name).toBe('Alice');
  });

  it('replaces ObjectId name with safe display name', () => {
    const obj = { name: VALID_OID, code: 'A001' };
    const result = sanitizeObjectNames(obj);
    expect(result.name).not.toBe(VALID_OID);
    expect(result.name).toBe('A001');
  });

  it('handles nested objects', () => {
    const obj = { student: { name: VALID_OID, code: 'S001' } };
    const result = sanitizeObjectNames(obj);
    expect(result.student.name).toBe('S001');
  });
});
