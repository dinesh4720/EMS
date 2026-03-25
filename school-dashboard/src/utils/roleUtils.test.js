import { describe, it, expect } from 'vitest';
import { extractRoleNames, isSuperAdminRole } from './roleUtils';

describe('extractRoleNames', () => {
  it('returns empty array for null', () => {
    expect(extractRoleNames(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(extractRoleNames(undefined)).toEqual([]);
  });

  it('returns empty array for number input', () => {
    expect(extractRoleNames(42)).toEqual([]);
  });

  it('returns trimmed lowercase string in array', () => {
    expect(extractRoleNames('Admin')).toEqual(['admin']);
  });

  it('trims whitespace from role string', () => {
    expect(extractRoleNames('  Teacher  ')).toEqual(['teacher']);
  });

  it('handles array of strings', () => {
    expect(extractRoleNames(['Admin', 'Teacher'])).toEqual(['admin', 'teacher']);
  });

  it('filters falsy values from array', () => {
    expect(extractRoleNames([null, 'Admin', undefined, ''])).toEqual(['admin']);
  });

  it('handles nested arrays (flat)', () => {
    expect(extractRoleNames([['Admin'], 'Teacher'])).toEqual(['admin', 'teacher']);
  });

  it('returns empty array for empty string', () => {
    expect(extractRoleNames('')).toEqual(['']);
  });
});

describe('isSuperAdminRole', () => {
  it('returns true for "super admin" (with space)', () => {
    expect(isSuperAdminRole('super admin')).toBe(true);
  });

  it('returns true for "superadmin" (no space)', () => {
    expect(isSuperAdminRole('superadmin')).toBe(true);
  });

  it('returns true for mixed case', () => {
    expect(isSuperAdminRole('Super Admin')).toBe(true);
    expect(isSuperAdminRole('SUPERADMIN')).toBe(true);
  });

  it('returns false for regular admin', () => {
    expect(isSuperAdminRole('admin')).toBe(false);
  });

  it('returns false for teacher', () => {
    expect(isSuperAdminRole('teacher')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isSuperAdminRole(null)).toBe(false);
  });

  it('returns true when array contains super admin', () => {
    expect(isSuperAdminRole(['teacher', 'super admin'])).toBe(true);
  });

  it('returns false when array has no super admin', () => {
    expect(isSuperAdminRole(['teacher', 'admin'])).toBe(false);
  });
});
