import { describe, it, expect } from 'vitest';
import { extractRoleNames, isSuperAdminRole } from './roleUtils';

// ─── extractRoleNames ─────────────────────────────────────────────────────────

describe('extractRoleNames (extended)', () => {
  it('returns an empty array for a non-string, non-array value', () => {
    expect(extractRoleNames(null)).toEqual([]);
    expect(extractRoleNames(undefined)).toEqual([]);
    expect(extractRoleNames(42)).toEqual([]);
    expect(extractRoleNames({})).toEqual([]);
  });

  it('returns lowercased, trimmed single role from a plain string', () => {
    expect(extractRoleNames('Admin')).toEqual(['admin']);
  });

  it('trims surrounding whitespace from a string role', () => {
    expect(extractRoleNames('  Teacher  ')).toEqual(['teacher']);
  });

  it('flattens an array of strings', () => {
    expect(extractRoleNames(['Admin', 'Teacher'])).toEqual(['admin', 'teacher']);
  });

  it('handles nested arrays by flattening recursively', () => {
    expect(extractRoleNames([['Admin'], 'Teacher'])).toEqual(['admin', 'teacher']);
  });

  it('filters out falsy entries produced by non-string items in array', () => {
    const result = extractRoleNames([null, 'Admin', undefined]);
    expect(result).toEqual(['admin']);
  });

  it('returns empty array for an empty array input', () => {
    expect(extractRoleNames([])).toEqual([]);
  });

  it('preserves multiple valid roles', () => {
    const result = extractRoleNames(['Super Admin', 'Principal', 'Teacher']);
    expect(result).toHaveLength(3);
    expect(result).toContain('super admin');
    expect(result).toContain('principal');
    expect(result).toContain('teacher');
  });
});

// ─── isSuperAdminRole ─────────────────────────────────────────────────────────

describe('isSuperAdminRole (extended)', () => {
  it('returns true for "super admin" (lowercase)', () => {
    expect(isSuperAdminRole('super admin')).toBe(true);
  });

  it('returns true for "Super Admin" (mixed case)', () => {
    expect(isSuperAdminRole('Super Admin')).toBe(true);
  });

  it('returns true for "superadmin" (no space)', () => {
    expect(isSuperAdminRole('superadmin')).toBe(true);
  });

  it('returns true for "SUPERADMIN" (uppercase)', () => {
    expect(isSuperAdminRole('SUPERADMIN')).toBe(true);
  });

  it('returns false for "admin" alone', () => {
    expect(isSuperAdminRole('admin')).toBe(false);
  });

  it('returns false for "teacher"', () => {
    expect(isSuperAdminRole('teacher')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isSuperAdminRole(null)).toBe(false);
  });

  it('returns true when array includes "super admin"', () => {
    expect(isSuperAdminRole(['teacher', 'super admin'])).toBe(true);
  });

  it('returns false when array has no super admin role', () => {
    expect(isSuperAdminRole(['teacher', 'principal'])).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(isSuperAdminRole([])).toBe(false);
  });
});
