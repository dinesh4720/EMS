import { describe, it, expect } from 'vitest';
import { isObjectId, getSafeDisplayName, getSafeInitials, sanitizeObjectNames } from './objectIdHelper';

// Additional edge-case coverage not in objectIdHelper.test.js / objectIdHelperExtended.test.js

describe('isObjectId — boundary cases', () => {
  it('returns false for a 23-char hex string (one short)', () => {
    expect(isObjectId('507f1f77bcf86cd79943016')).toBe(false); // 23 chars
  });

  it('returns false for a 25-char hex string (one over)', () => {
    expect(isObjectId('507f1f77bcf86cd7994301600')).toBe(false); // 25 chars
  });

  it('returns true for uppercase hex', () => {
    expect(isObjectId('507F1F77BCF86CD799430160')).toBe(true);
  });

  it('returns false for a 24-char string with a non-hex char (g)', () => {
    expect(isObjectId('507f1f77bcf86cd79943016g')).toBe(false);
  });

  it('returns false for a UUID (wrong length and format)', () => {
    expect(isObjectId('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
  });
});

describe('getSafeDisplayName — additional cases', () => {
  it('returns last-resort "User Unknown" for empty object (no id or name)', () => {
    // No name, no fallback fields, no id → "User Unknown"
    expect(getSafeDisplayName({})).toBe('User Unknown');
  });

  it('uses name field directly when present', () => {
    const entity = { name: 'Alice' };
    expect(getSafeDisplayName(entity)).toBe('Alice');
  });

  it('falls back to email when name is absent', () => {
    const entity = { email: 'alice@school.com' };
    const result = getSafeDisplayName(entity);
    expect(result).toBe('alice@school.com');
  });

  it('returns "User Unknown" for a plain ObjectId string (no .name property)', () => {
    // String input: entity.name = undefined, all fallbacks undefined, id undefined
    const result = getSafeDisplayName('507f1f77bcf86cd799430160');
    expect(result).toBe('User Unknown');
  });
});

describe('getSafeInitials — additional cases', () => {
  it('returns first+last initials for three-word names', () => {
    // getSafeInitials takes a string, not an object
    const initials = getSafeInitials('John Paul Smith');
    expect(initials).toBe('JS'); // first + last char of split
  });

  it('returns uppercase initials for lowercase names', () => {
    const initials = getSafeInitials('alice bob');
    expect(initials).toBe('AB');
  });

  it('returns fallback "?" for null input', () => {
    const initials = getSafeInitials(null);
    expect(initials).toBe('?');
  });
});

describe('sanitizeObjectNames — additional cases', () => {
  it('returns an empty object for empty input', () => {
    expect(sanitizeObjectNames({})).toEqual({});
  });

  it('preserves non-name numeric fields untouched', () => {
    const input = { count: 42, active: true };
    const result = sanitizeObjectNames(input);
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
  });

  it('handles null values in name fields gracefully', () => {
    const input = { name: null };
    expect(() => sanitizeObjectNames(input)).not.toThrow();
  });
});
