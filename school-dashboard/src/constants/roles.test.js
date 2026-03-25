import { describe, it, expect } from 'vitest';
import {
  STAFF_ROLES, ROLE_MAPPING,
  getUserRoleFromStaffRole, getRoleDisplayName, normalizeRole,
} from './roles';

describe('STAFF_ROLES', () => {
  it('includes essential roles', () => {
    expect(STAFF_ROLES).toContain('Teacher');
    expect(STAFF_ROLES).toContain('Admin');
    expect(STAFF_ROLES).toContain('Principal');
    expect(STAFF_ROLES).toContain('Accountant');
  });

  it('is an array', () => {
    expect(Array.isArray(STAFF_ROLES)).toBe(true);
  });

  it('has no duplicates', () => {
    const unique = new Set(STAFF_ROLES);
    expect(unique.size).toBe(STAFF_ROLES.length);
  });
});

describe('getUserRoleFromStaffRole', () => {
  it('maps Admin → admin', () => {
    expect(getUserRoleFromStaffRole('Admin')).toBe('admin');
  });

  it('maps Teacher → teacher', () => {
    expect(getUserRoleFromStaffRole('Teacher')).toBe('teacher');
  });

  it('maps Principal → principal', () => {
    expect(getUserRoleFromStaffRole('Principal')).toBe('principal');
  });

  it('defaults to "teacher" for unknown roles', () => {
    expect(getUserRoleFromStaffRole('Unknown Role')).toBe('teacher');
  });

  it('handles null gracefully', () => {
    expect(getUserRoleFromStaffRole(null)).toBe('teacher');
  });
});

describe('getRoleDisplayName', () => {
  it('normalizes "Teaching" to "Teacher"', () => {
    expect(getRoleDisplayName('Teaching')).toBe('Teacher');
  });

  it('normalizes "Administrative" to "Admin"', () => {
    expect(getRoleDisplayName('Administrative')).toBe('Admin');
  });

  it('normalizes "Administration" to "Admin"', () => {
    expect(getRoleDisplayName('Administration')).toBe('Admin');
  });

  it('passes through modern roles unchanged', () => {
    expect(getRoleDisplayName('Principal')).toBe('Principal');
    expect(getRoleDisplayName('Accountant')).toBe('Accountant');
  });
});

describe('normalizeRole', () => {
  it('normalizes legacy "Teaching" to "Teacher"', () => {
    expect(normalizeRole('Teaching')).toBe('Teacher');
  });

  it('normalizes legacy "Administrative" to "Admin"', () => {
    expect(normalizeRole('Administrative')).toBe('Admin');
  });

  it('passes through current roles unchanged', () => {
    expect(normalizeRole('Teacher')).toBe('Teacher');
    expect(normalizeRole('Admin')).toBe('Admin');
  });
});

describe('ROLE_MAPPING', () => {
  it('has entries for all legacy role variants', () => {
    expect(ROLE_MAPPING['Administrative']).toBe('admin');
    expect(ROLE_MAPPING['Administration']).toBe('admin');
    expect(ROLE_MAPPING['Teaching']).toBe('teacher');
  });

  it('all values are lowercase strings', () => {
    Object.values(ROLE_MAPPING).forEach((v) => {
      expect(v).toBe(v.toLowerCase());
    });
  });
});
