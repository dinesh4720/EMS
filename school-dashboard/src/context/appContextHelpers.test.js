import { describe, it, expect } from 'vitest';
import {
  extractRoleNames,
  hasAnyRole,
  normalizeClassName,
  normalizeStaffMember,
  normalizeClassRecord,
  dedupeById,
  shouldHydrateStudentsForPath,
} from './appContextHelpers';

// ─── extractRoleNames ─────────────────────────────────────────────────────────

describe('extractRoleNames', () => {
  it('returns lowercased trimmed role for a plain string', () => {
    expect(extractRoleNames('Admin')).toEqual(['admin']);
  });

  it('trims whitespace from role strings', () => {
    expect(extractRoleNames('  teacher  ')).toEqual(['teacher']);
  });

  it('returns empty array for non-string, non-array value (number)', () => {
    expect(extractRoleNames(42)).toEqual([]);
  });

  it('returns empty array for null', () => {
    expect(extractRoleNames(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(extractRoleNames(undefined)).toEqual([]);
  });

  it('flattens a flat array of role strings', () => {
    expect(extractRoleNames(['Admin', 'Teacher'])).toEqual(['admin', 'teacher']);
  });

  it('flattens nested arrays of roles', () => {
    expect(extractRoleNames([['Admin'], ['Teacher', 'Staff']])).toEqual([
      'admin',
      'teacher',
      'staff',
    ]);
  });

  it('filters out falsy values from mixed arrays', () => {
    expect(extractRoleNames(['Admin', null, undefined, 'Teacher'])).toEqual([
      'admin',
      'teacher',
    ]);
  });

  it('returns empty array for an empty array input', () => {
    expect(extractRoleNames([])).toEqual([]);
  });
});

// ─── hasAnyRole ───────────────────────────────────────────────────────────────

describe('hasAnyRole', () => {
  it('returns true when user role matches an allowed role', () => {
    const user = { role: 'admin' };
    expect(hasAnyRole(user, new Set(['admin', 'superadmin']))).toBe(true);
  });

  it('returns true for a teacher role match', () => {
    const user = { role: 'Teacher' };
    expect(hasAnyRole(user, new Set(['teacher']))).toBe(true);
  });

  it('returns false when user role is not in the allowed set', () => {
    const user = { role: 'parent' };
    expect(hasAnyRole(user, new Set(['admin', 'teacher']))).toBe(false);
  });

  it('returns false for a null user', () => {
    expect(hasAnyRole(null, new Set(['admin']))).toBe(false);
  });

  it('returns false for an undefined user', () => {
    expect(hasAnyRole(undefined, new Set(['admin']))).toBe(false);
  });

  it('returns true when user has multiple roles and one matches', () => {
    const user = { role: ['parent', 'teacher'] };
    expect(hasAnyRole(user, new Set(['teacher']))).toBe(true);
  });

  it('returns false when allowed roles set is empty', () => {
    const user = { role: 'admin' };
    expect(hasAnyRole(user, new Set())).toBe(false);
  });
});

// ─── normalizeClassName ───────────────────────────────────────────────────────

describe('normalizeClassName', () => {
  it('strips the "Class " prefix from a name like "Class 5"', () => {
    expect(normalizeClassName('Class 5')).toBe('5');
  });

  it('strips "Class " prefix case-insensitively', () => {
    expect(normalizeClassName('class 10')).toBe('10');
  });

  it('strips "CLASS " prefix', () => {
    expect(normalizeClassName('CLASS 3A')).toBe('3A');
  });

  it('returns the name unchanged when there is no "Class " prefix', () => {
    expect(normalizeClassName('Grade 9')).toBe('Grade 9');
  });

  it('returns an empty string for an empty input', () => {
    expect(normalizeClassName('')).toBe('');
  });

  it('handles undefined by defaulting to empty string', () => {
    expect(normalizeClassName(undefined)).toBe('');
  });

  it('trims surrounding whitespace after stripping the prefix', () => {
    expect(normalizeClassName('Class  5 ')).toBe('5');
  });
});

// ─── normalizeStaffMember ─────────────────────────────────────────────────────

describe('normalizeStaffMember', () => {
  it('returns null when both staffMember and fallbackUser are null', () => {
    expect(normalizeStaffMember(null, null)).toBeNull();
  });

  it('returns null when staffMember is null and no fallback is given', () => {
    expect(normalizeStaffMember(null)).toBeNull();
  });

  it('uses id from _id when id is absent', () => {
    const staff = { _id: 'abc123', name: 'John' };
    const result = normalizeStaffMember(staff);
    expect(result.id).toBe('abc123');
  });

  it('prefers id over _id', () => {
    const staff = { id: 'primary', _id: 'secondary', name: 'John' };
    const result = normalizeStaffMember(staff);
    expect(result.id).toBe('primary');
  });

  it('defaults status to "active" when not provided', () => {
    const staff = { id: '1', name: 'Jane' };
    const result = normalizeStaffMember(staff);
    expect(result.status).toBe('active');
  });

  it('preserves an explicit status from the source', () => {
    const staff = { id: '1', name: 'Jane', status: 'inactive' };
    const result = normalizeStaffMember(staff);
    expect(result.status).toBe('inactive');
  });

  it('uses fallbackUser when staffMember is null', () => {
    const fallback = { id: 'fb1', name: 'Fallback User' };
    const result = normalizeStaffMember(null, fallback);
    expect(result.id).toBe('fb1');
  });

  it('prefers picture from staffMember over fallback', () => {
    const staff = { id: '1', picture: 'staff-pic.jpg' };
    const fallback = { picture: 'fallback-pic.jpg' };
    const result = normalizeStaffMember(staff, fallback);
    expect(result.picture).toBe('staff-pic.jpg');
  });

  it('falls back to photo when picture is absent', () => {
    const staff = { id: '1', photo: 'photo.jpg' };
    const result = normalizeStaffMember(staff);
    expect(result.picture).toBe('photo.jpg');
    expect(result.photo).toBe('photo.jpg');
  });

  it('sets picture and photo to null when neither are present', () => {
    const staff = { id: '1', name: 'No Photo' };
    const result = normalizeStaffMember(staff);
    expect(result.picture).toBeNull();
    expect(result.photo).toBeNull();
  });
});

// ─── normalizeClassRecord ─────────────────────────────────────────────────────

describe('normalizeClassRecord', () => {
  it('returns null for a null classItem', () => {
    expect(normalizeClassRecord(null)).toBeNull();
  });

  it('uses className over name when both are present', () => {
    const item = { id: '1', className: 'Class 5', name: 'Five' };
    const result = normalizeClassRecord(item);
    expect(result.name).toBe('5');
  });

  it('falls back to name when className is absent', () => {
    const item = { id: '1', name: 'Class 6' };
    const result = normalizeClassRecord(item);
    expect(result.name).toBe('6');
  });

  it('converts id from _id when id is absent', () => {
    const item = { _id: 'mongo123', name: 'Class 1' };
    const result = normalizeClassRecord(item);
    expect(result.id).toBe('mongo123');
  });

  it('uses studentCount when strength and students are absent', () => {
    const item = { id: '1', name: 'Class 2', studentCount: 30 };
    const result = normalizeClassRecord(item);
    expect(result.strength).toBe(30);
    expect(result.studentCount).toBe(30);
  });

  it('falls back to strength for student count', () => {
    const item = { id: '1', name: 'Class 3', strength: 25 };
    const result = normalizeClassRecord(item);
    expect(result.studentCount).toBe(25);
  });

  it('falls back to students for student count', () => {
    const item = { id: '1', name: 'Class 4', students: 18 };
    const result = normalizeClassRecord(item);
    expect(result.studentCount).toBe(18);
  });

  it('defaults studentCount to 0 when none of the count fields are present', () => {
    const item = { id: '1', name: 'Class 7' };
    const result = normalizeClassRecord(item);
    expect(result.studentCount).toBe(0);
    expect(result.strength).toBe(0);
  });

  it('defaults attendance to 0 when not provided', () => {
    const item = { id: '1', name: 'Class 8' };
    const result = normalizeClassRecord(item);
    expect(result.attendance).toBe(0);
  });

  it('preserves an existing attendance value', () => {
    const item = { id: '1', name: 'Class 9', attendance: 92 };
    const result = normalizeClassRecord(item);
    expect(result.attendance).toBe(92);
  });

  it('sets classTeacherId from fallback when isClassTeacher is true', () => {
    const item = { id: '1', name: 'Class 10', isClassTeacher: true };
    const result = normalizeClassRecord(item, 'teacher-456');
    expect(result.classTeacherId).toBe('teacher-456');
  });

  it('does not set classTeacherId from fallback when isClassTeacher is false', () => {
    const item = { id: '1', name: 'Class 10', isClassTeacher: false };
    const result = normalizeClassRecord(item, 'teacher-456');
    expect(result.classTeacherId).toBeNull();
  });

  it('defaults section to empty string when absent', () => {
    const item = { id: '1', name: 'Class 5' };
    const result = normalizeClassRecord(item);
    expect(result.section).toBe('');
  });
});

// ─── dedupeById ──────────────────────────────────────────────────────────────

describe('dedupeById', () => {
  it('returns an empty array for an empty input', () => {
    expect(dedupeById([])).toEqual([]);
  });

  it('removes duplicate items with the same id, keeping the last occurrence', () => {
    const items = [
      { id: '1', name: 'First' },
      { id: '1', name: 'Last' },
    ];
    const result = dedupeById(items);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Last');
  });

  it('keeps all items when ids are unique', () => {
    const items = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
    ];
    expect(dedupeById(items)).toHaveLength(3);
  });

  it('skips items without an id field', () => {
    const items = [{ name: 'No ID' }, { id: '1', name: 'Has ID' }];
    const result = dedupeById(items);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('coerces numeric ids to string for deduplication', () => {
    const items = [
      { id: 1, name: 'First' },
      { id: 1, name: 'Last' },
    ];
    const result = dedupeById(items);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Last');
  });

  it('handles arrays with null or undefined items gracefully', () => {
    const items = [null, undefined, { id: '1', name: 'Valid' }];
    const result = dedupeById(items);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});

// ─── shouldHydrateStudentsForPath ────────────────────────────────────────────

describe('shouldHydrateStudentsForPath', () => {
  it('returns false for the /students/ list page', () => {
    expect(shouldHydrateStudentsForPath('/students/')).toBe(false);
  });

  it('returns false for /students (no trailing slash)', () => {
    expect(shouldHydrateStudentsForPath('/students')).toBe(false);
  });

  it('returns true for a specific student detail path like /students/123', () => {
    expect(shouldHydrateStudentsForPath('/students/abc123')).toBe(true);
  });

  it('returns true for the root path /', () => {
    expect(shouldHydrateStudentsForPath('/')).toBe(true);
  });

  it('returns true for /analytics', () => {
    expect(shouldHydrateStudentsForPath('/analytics')).toBe(true);
  });

  it('returns true for /analytics/overview', () => {
    expect(shouldHydrateStudentsForPath('/analytics/overview')).toBe(true);
  });

  it('returns true for /classes', () => {
    expect(shouldHydrateStudentsForPath('/classes')).toBe(true);
  });

  it('returns true for /classes/section-a', () => {
    expect(shouldHydrateStudentsForPath('/classes/section-a')).toBe(true);
  });

  it('returns true for /messaging', () => {
    expect(shouldHydrateStudentsForPath('/messaging')).toBe(true);
  });

  it('returns true for /settings/subscription', () => {
    expect(shouldHydrateStudentsForPath('/settings/subscription')).toBe(true);
  });

  it('returns false for /login (unrecognised path)', () => {
    expect(shouldHydrateStudentsForPath('/login')).toBe(false);
  });

  it('returns false for /settings/profile (non-subscription settings)', () => {
    expect(shouldHydrateStudentsForPath('/settings/profile')).toBe(false);
  });

  it('returns false for an empty path string', () => {
    expect(shouldHydrateStudentsForPath('')).toBe(false);
  });
});
