import { describe, it, expect } from 'vitest';
import {
  extractRoleNames,
  hasAnyRole,
  normalizeClassName,
  normalizeStaffMember,
  normalizeClassRecord,
  dedupeById,
  shouldHydrateStudentsForPath,
  buildClassesWithTeachers,
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

// ─── buildClassesWithTeachers ─────────────────────────────────────────────────

describe('buildClassesWithTeachers', () => {
  it('returns [] when classes is not an array', () => {
    expect(buildClassesWithTeachers(null, [], [])).toEqual([]);
    expect(buildClassesWithTeachers(undefined, [], [])).toEqual([]);
  });

  it('returns [] when staff is not an array', () => {
    expect(buildClassesWithTeachers([], null, [])).toEqual([]);
  });

  it('returns [] when students is not an array', () => {
    expect(buildClassesWithTeachers([], [], null)).toEqual([]);
  });

  it('resolves teacher name and photo by staff id', () => {
    const classes = [{ id: 'c1', classTeacherId: 's1' }];
    const staff = [{ id: 's1', name: 'Alice', picture: 'alice.png' }];
    const result = buildClassesWithTeachers(classes, staff, []);
    expect(result[0].teacher).toBe('Alice');
    expect(result[0].teacherPhoto).toBe('alice.png');
  });

  it('resolves teacher by _id when id does not match (ObjectId shape)', () => {
    const classes = [{ id: 'c1', classTeacherId: 'abc123' }];
    const staff = [{ _id: 'abc123', name: 'Bob', picture: 'bob.png' }];
    const result = buildClassesWithTeachers(classes, staff, []);
    expect(result[0].teacher).toBe('Bob');
    expect(result[0].teacherPhoto).toBe('bob.png');
  });

  it('matches teacher ids across number/string type differences', () => {
    const classes = [{ id: 'c1', classTeacherId: 42 }];
    const staff = [{ id: '42', name: 'Carol', picture: null }];
    const result = buildClassesWithTeachers(classes, staff, []);
    expect(result[0].teacher).toBe('Carol');
    expect(result[0].teacherPhoto).toBeNull();
  });

  it('sets teacher and teacherPhoto to null when no staff matches', () => {
    const classes = [{ id: 'c1', classTeacherId: 'missing' }];
    const staff = [{ id: 's1', name: 'Alice', picture: 'alice.png' }];
    const result = buildClassesWithTeachers(classes, staff, []);
    expect(result[0].teacher).toBeNull();
    expect(result[0].teacherPhoto).toBeNull();
  });

  it('keeps Array.find "first match wins" semantics for duplicate keys', () => {
    const classes = [{ id: 'c1', classTeacherId: 's1' }];
    const staff = [
      { id: 's1', name: 'First', picture: 'first.png' },
      { id: 's1', name: 'Second', picture: 'second.png' },
    ];
    const result = buildClassesWithTeachers(classes, staff, []);
    expect(result[0].teacher).toBe('First');
  });

  it('counts only active, non-deleted students for the class', () => {
    const classes = [{ id: 'c1', classTeacherId: null }];
    const students = [
      { id: 'st1', classId: 'c1', status: 'active' },
      { id: 'st2', classId: 'c1' }, // status missing → defaults to active
      { id: 'st3', classId: 'c1', status: 'inactive' }, // excluded
      { id: 'st4', classId: 'c1', status: 'active', isDeleted: true }, // excluded
      { id: 'st5', classId: 'c2', status: 'active' }, // other class
    ];
    const result = buildClassesWithTeachers(classes, [], students);
    expect(result[0].studentCount).toBe(2);
  });

  it('matches studentCount across number/string classId type differences', () => {
    const classes = [{ id: 7, classTeacherId: null }];
    const students = [
      { id: 'st1', classId: '7', status: 'active' },
      { id: 'st2', classId: 7, status: 'active' },
    ];
    const result = buildClassesWithTeachers(classes, [], students);
    expect(result[0].studentCount).toBe(2);
  });

  it('returns 0 studentCount for a class with no students', () => {
    const classes = [{ id: 'c1', classTeacherId: null }];
    const result = buildClassesWithTeachers(classes, [], []);
    expect(result[0].studentCount).toBe(0);
  });

  it('preserves original class fields and order', () => {
    const classes = [
      { id: 'c1', classTeacherId: 's1', name: 'A', section: 'X' },
      { id: 'c2', classTeacherId: 's2', name: 'B', section: 'Y' },
    ];
    const staff = [
      { id: 's1', name: 'Alice', picture: 'a.png' },
      { id: 's2', name: 'Bob', picture: 'b.png' },
    ];
    const students = [
      { id: 'st1', classId: 'c1', status: 'active' },
      { id: 'st2', classId: 'c2', status: 'active' },
      { id: 'st3', classId: 'c2', status: 'active' },
    ];
    const result = buildClassesWithTeachers(classes, staff, students);
    expect(result.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(result[0]).toMatchObject({
      id: 'c1',
      name: 'A',
      section: 'X',
      teacher: 'Alice',
      teacherPhoto: 'a.png',
      studentCount: 1,
    });
    expect(result[1]).toMatchObject({
      id: 'c2',
      teacher: 'Bob',
      studentCount: 2,
    });
  });

  it('matches the brute-force join it replaces on a representative dataset', () => {
    const classes = Array.from({ length: 20 }, (_, i) => ({
      id: `c${i}`,
      classTeacherId: `s${i % 5}`,
      name: `Class ${i}`,
    }));
    const staff = Array.from({ length: 10 }, (_, i) => ({
      id: `s${i}`,
      _id: `oid${i}`,
      name: `Staff ${i}`,
      picture: `s${i}.png`,
    }));
    const students = Array.from({ length: 200 }, (_, i) => ({
      id: `st${i}`,
      classId: `c${i % 20}`,
      status: i % 7 === 0 ? 'inactive' : 'active',
      isDeleted: i % 11 === 0,
    }));

    const optimized = buildClassesWithTeachers(classes, staff, students);

    // Reference implementation = the previous inline O(n²) join.
    const reference = classes.map((c) => ({
      ...c,
      teacher:
        staff.find(
          (s) =>
            String(s.id) === String(c.classTeacherId) ||
            String(s._id) === String(c.classTeacherId)
        )?.name || null,
      teacherPhoto:
        staff.find(
          (s) =>
            String(s.id) === String(c.classTeacherId) ||
            String(s._id) === String(c.classTeacherId)
        )?.picture || null,
      studentCount: students.filter(
        (s) =>
          String(s.classId) === String(c.id) &&
          (s.status || 'active') === 'active' &&
          s.isDeleted !== true
      ).length,
    }));

    expect(optimized).toEqual(reference);
  });
});
