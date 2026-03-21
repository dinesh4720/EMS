/**
 * Centralized React Query key factory.
 *
 * Every query key in the app should be built from this file so that:
 *  1. Invalidation targets are always consistent with fetch keys.
 *  2. Typos are caught at import time, not at runtime.
 *  3. Parent-level invalidation (e.g. `queryKeys.students.all`) correctly
 *     matches all child keys (e.g. detail, attendance, remarks).
 *
 * Convention:
 *   - `.all`   → base prefix, used for broad invalidation
 *   - `.list`  → list/search queries (with filter params)
 *   - `.detail`→ single-entity queries
 *   - Specific sub-resources get their own key builder
 */

export const queryKeys = {
  // ── App-level context queries ──────────────────────────────────────
  appContext: {
    all: ['app-context-data'],
    data: (sessionVersion, userId, roleKey, includeStudents, year) => [
      'app-context-data', sessionVersion, userId, roleKey, includeStudents, year,
    ],
  },

  schoolSettings: {
    all: ['school-settings-data'],
    data: (sessionVersion, userId) => [
      'school-settings-data', sessionVersion, userId,
    ],
  },

  calendar: {
    all: ['calendar-data'],
    data: (sessionVersion, userId) => [
      'calendar-data', sessionVersion, userId,
    ],
  },

  feeSettings: {
    all: ['fee-settings-data'],
    data: (sessionVersion, userId) => [
      'fee-settings-data', sessionVersion, userId,
    ],
  },

  // ── Students ───────────────────────────────────────────────────────
  students: {
    all: ['students'],
    list: (...filters) => ['students-list', ...filters],
    detail: (studentId) => ['students', 'detail', studentId],
    attendance: (studentId, startDate, endDate) => [
      'students', 'attendance', studentId, startDate ?? null, endDate ?? null,
    ],
    results: (studentId, academicYear) => [
      'students', 'results', studentId, academicYear ?? null,
    ],
    remarks: (studentId, category) => [
      'students', 'remarks', studentId, ...(category ? [category] : []),
    ],
    feeHistory: (studentId) => ['students', 'fee-history', studentId],
  },

  // ── Student Fees ───────────────────────────────────────────────────
  studentFees: {
    all: ['student-fees'],
    detail: (studentId, academicYear, autoInitialize) => [
      'student-fees', studentId, academicYear, autoInitialize,
    ],
    batch: (academicYear, idsKey) => [
      'student-fees', 'batch', academicYear, idsKey,
    ],
  },

  // ── Dashboard ──────────────────────────────────────────────────────
  dashboard: {
    all: ['dashboard'],
    feed: (academicYear) => ['dashboard', 'feed', academicYear],
  },

  // ── Attendance ─────────────────────────────────────────────────────
  attendance: {
    all: ['attendance'],
    classSnapshot: (classId, date) => ['attendance', 'class-snapshot', classId, date],
  },
};
