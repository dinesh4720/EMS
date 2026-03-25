import { describe, it, expect } from 'vitest';
import { isObjectId, getSafeDisplayName, getSafeInitials, sanitizeObjectNames } from './objectIdHelper';

// ─── isObjectId ───────────────────────────────────────────────────────────────

describe('isObjectId', () => {
  it('returns true for a valid 24-char lowercase hex string', () => {
    expect(isObjectId('507f1f77bcf86cd799439011')).toBe(true);
  });

  it('returns true for uppercase hex string', () => {
    expect(isObjectId('507F1F77BCF86CD799439011')).toBe(true);
  });

  it('returns true for mixed-case hex string', () => {
    expect(isObjectId('507f1F77bcf86cD799439011')).toBe(true);
  });

  it('returns false for 23-character string', () => {
    expect(isObjectId('507f1f77bcf86cd79943901')).toBe(false);
  });

  it('returns false for 25-character string', () => {
    expect(isObjectId('507f1f77bcf86cd7994390111')).toBe(false);
  });

  it('returns false for non-hex characters', () => {
    expect(isObjectId('507f1f77bcf86cd79943901z')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isObjectId('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isObjectId(null)).toBe(false);
  });

  it('returns false for a plain name', () => {
    expect(isObjectId('Alice Smith')).toBe(false);
  });
});

// ─── getSafeDisplayName ───────────────────────────────────────────────────────

describe('getSafeDisplayName', () => {
  it('returns entity.name when it is not an ObjectId', () => {
    expect(getSafeDisplayName({ name: 'Alice' })).toBe('Alice');
  });

  it('returns "Unknown" for null entity', () => {
    expect(getSafeDisplayName(null)).toBe('Unknown');
  });

  it('falls back to fallbackField when name is an ObjectId', () => {
    const entity = { name: '507f1f77bcf86cd799439011', code: 'STF001' };
    expect(getSafeDisplayName(entity, 'code')).toBe('STF001');
  });

  it('falls back to email when name is missing and code is ObjectId', () => {
    const entity = { name: '507f1f77bcf86cd799439011', code: '507f1f77bcf86cd799439012', email: 'alice@example.com' };
    expect(getSafeDisplayName(entity)).toBe('alice@example.com');
  });

  it('returns User <id> as last resort', () => {
    const entity = { _id: 'xyz999', name: '507f1f77bcf86cd799439011' };
    const result = getSafeDisplayName(entity);
    expect(result).toContain('xyz999');
  });

  it('returns "Unknown" when entity has no id at all', () => {
    const entity = { name: '507f1f77bcf86cd799439011' };
    const result = getSafeDisplayName(entity);
    expect(result).toContain('Unknown');
  });
});

// ─── getSafeInitials ──────────────────────────────────────────────────────────

describe('getSafeInitials', () => {
  it('returns first character uppercase for single-word name', () => {
    expect(getSafeInitials('Alice')).toBe('A');
  });

  it('returns first and last initials for multi-word name', () => {
    expect(getSafeInitials('Alice Smith')).toBe('AS');
  });

  it('uses first and last word for three-word names', () => {
    expect(getSafeInitials('John Michael Doe')).toBe('JD');
  });

  it('returns fallback "?" for ObjectId name', () => {
    expect(getSafeInitials('507f1f77bcf86cd799439011')).toBe('?');
  });

  it('returns fallback "?" for null', () => {
    expect(getSafeInitials(null)).toBe('?');
  });

  it('returns custom fallback when name is invalid', () => {
    expect(getSafeInitials(null, 'X')).toBe('X');
  });

  it('returns initials in uppercase', () => {
    expect(getSafeInitials('alice doe')).toBe('AD');
  });

  it('trims surrounding whitespace before splitting', () => {
    expect(getSafeInitials('  Alice  ')).toBe('A');
  });
});

// ─── sanitizeObjectNames ─────────────────────────────────────────────────────

describe('sanitizeObjectNames', () => {
  it('returns the object unchanged when no name fields contain ObjectIds', () => {
    const obj = { name: 'Alice', age: 12 };
    const result = sanitizeObjectNames(obj);
    expect(result.name).toBe('Alice');
  });

  it('returns non-object values unchanged', () => {
    expect(sanitizeObjectNames(null)).toBeNull();
    expect(sanitizeObjectNames('string')).toBe('string');
    expect(sanitizeObjectNames(42)).toBe(42);
  });

  it('replaces ObjectId in name field with getSafeDisplayName result', () => {
    const obj = { name: '507f1f77bcf86cd799439011', code: 'STF001' };
    const result = sanitizeObjectNames(obj);
    expect(result.name).not.toBe('507f1f77bcf86cd799439011');
  });

  it('recursively sanitizes nested objects', () => {
    const obj = {
      student: { name: '507f1f77bcf86cd799439011', code: 'S001' }
    };
    const result = sanitizeObjectNames(obj);
    expect(result.student.name).not.toBe('507f1f77bcf86cd799439011');
  });

  it('preserves non-name fields with ObjectId-like values', () => {
    const obj = { _id: '507f1f77bcf86cd799439011', name: 'Alice' };
    const result = sanitizeObjectNames(obj);
    // _id is not in nameFields so it should remain unchanged
    expect(result._id).toBe('507f1f77bcf86cd799439011');
  });

  it('handles custom nameFields parameter', () => {
    const obj = { staffName: '507f1f77bcf86cd799439011', code: 'STF001' };
    const result = sanitizeObjectNames(obj, ['staffName']);
    expect(result.staffName).not.toBe('507f1f77bcf86cd799439011');
  });
});
