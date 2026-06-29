/**
 * useStudentsListData.helpers.js
 * Pure computational functions extracted from useStudentsListData for testability.
 */

/**
 * Compute status counts from a students array.
 * @param {Array} students
 * @returns {{ all: number, active: number, inactive: number, alumni: number, graduated: number, transferred: number }}
 */
export function computeStatusCounts(students) {
  let active = 0, inactive = 0, alumni = 0, graduated = 0, transferred = 0;
  for (const student of students) {
    const status = student.status || 'active';
    if (status === 'active') active++;
    else if (status === 'inactive') inactive++;
    else if (status === 'alumni') alumni++;
    else if (status === 'graduated') graduated++;
    else if (status === 'transferred') transferred++;
  }
  return { all: students.length, active, inactive, alumni, graduated, transferred };
}

/**
 * Get attendance percentage from a student record.
 * @param {Object} student
 * @returns {number|null}
 */
export function getAttendancePercentage(student) {
  if (student.attendancePercentage != null) return student.attendancePercentage;
  return null;
}

/**
 * Filter students by academic performance (multi-select).
 * @param {Array} students
 * @param {string[]} filter - array of categories, empty = no filter
 * @returns {Array}
 */
export function filterByAcademicPerformance(students, filter) {
  if (!filter || filter.length === 0) return students;
  return students.filter((student) => {
    if (!student.examResults || !Array.isArray(student.examResults) || student.examResults.length === 0) return false;
    const total = student.examResults.reduce((sum, e) => (e.percentage != null ? sum + e.percentage : sum), 0);
    const avg = total / student.examResults.length;
    return filter.some((category) => {
      switch (category) {
        case 'excellent':     return avg >= 90;
        case 'good':          return avg >= 75 && avg < 90;
        case 'average':       return avg >= 50 && avg < 75;
        case 'below_average': return avg < 50;
        default:              return false;
      }
    });
  });
}

/**
 * Filter students by attendance range (multi-select).
 * @param {Array} students
 * @param {string[]} filter - array of categories, empty = no filter
 * @returns {Array}
 */
export function filterByAttendance(students, filter) {
  if (!filter || filter.length === 0) return students;
  return students.filter((student) => {
    const att = getAttendancePercentage(student);
    if (att == null) return false;
    return filter.some((category) => {
      switch (category) {
        case 'excellent': return att >= 90;
        case 'good':      return att >= 75 && att < 90;
        case 'average':   return att >= 50 && att < 75;
        case 'below':     return att < 50;
        default:          return false;
      }
    });
  });
}

/**
 * Sort items with pinned students first, ordered by pinnedAt descending.
 * @param {Array} items
 * @returns {Array}
 */
export function sortWithPinned(items) {
  const pinned = items.filter((s) => s.isPinned);
  const unpinned = items.filter((s) => !s.isPinned);
  pinned.sort((a, b) => {
    if (a.pinnedAt && b.pinnedAt) return new Date(b.pinnedAt) - new Date(a.pinnedAt);
    return 0;
  });
  return [...pinned, ...unpinned];
}

/**
 * Compute the number of active (non-default) filters.
 * @param {Object} filters - { classFilter, feeStatusFilter, academicYearFilter, academicPerformanceFilter, attendanceFilter }
 * @returns {number}
 */
export function computeActiveFiltersCount(filters) {
  const countFilter = (filter) => {
    if (Array.isArray(filter)) return filter.length;
    if (typeof filter === 'string') return filter !== 'all' && filter ? 1 : 0;
    return 0;
  };

  return (
    (filters.classFilter && filters.classFilter !== 'all' ? 1 : 0) +
    countFilter(filters.feeStatusFilter) +
    countFilter(filters.academicYearFilter) +
    countFilter(filters.academicPerformanceFilter) +
    countFilter(filters.attendanceFilter)
  );
}

/**
 * Compute per-filter value counts from students array.
 * @param {Array} students
 * @param {string} currentAcademicYear
 * @returns {Object}
 */
export function computeFilterCounts(students, currentAcademicYear) {
  const classCounts = {};
  const feeStatusCounts = {};
  const academicYearCounts = {};
  const academicPerformanceCounts = {};
  const attendanceCounts = {};

  for (const student of students) {
    if (student.class) classCounts[student.class] = (classCounts[student.class] || 0) + 1;
    if (student.feeStatus) feeStatusCounts[student.feeStatus] = (feeStatusCounts[student.feeStatus] || 0) + 1;
    const yr = student.academicYear || currentAcademicYear;
    academicYearCounts[yr] = (academicYearCounts[yr] || 0) + 1;
    if (student.academicPerformance) {
      academicPerformanceCounts[student.academicPerformance] = (academicPerformanceCounts[student.academicPerformance] || 0) + 1;
    }
    const att = getAttendancePercentage(student);
    if (att != null) {
      let cat = 'below';
      if (att >= 90) cat = 'excellent';
      else if (att >= 75) cat = 'good';
      else if (att >= 50) cat = 'average';
      attendanceCounts[cat] = (attendanceCounts[cat] || 0) + 1;
    }
  }

  return {
    class: classCounts,
    feeStatus: feeStatusCounts,
    academicYear: academicYearCounts,
    academicPerformance: academicPerformanceCounts,
    attendance: attendanceCounts,
  };
}

/**
 * Resolve selected student IDs from a selection set.
 * @param {Set|'all'} selectedKeys
 * @param {Array} filteredItems
 * @returns {string[]}
 */
export function resolveSelectedIds(selectedKeys, filteredItems) {
  if (selectedKeys === 'all') return filteredItems.map((s) => String(s.id));
  return Array.from(selectedKeys);
}

// PAG-04 (SCH-102): real server pagination. The backend caps `limit` at
// MAX_STUDENTS_LIST_PAGE_SIZE per page, so anything bigger would be silently
// clamped server-side anyway. Mirroring the cap on the client keeps the UI
// honest about what one page actually contains.
export const MAX_STUDENTS_LIST_PAGE_SIZE = 100;

/**
 * Clamp a requested page size into the server-accepted range.
 * - Drops non-finite / non-positive values down to the default.
 * - Floors fractional values.
 * - Caps at MAX_STUDENTS_LIST_PAGE_SIZE so the request matches what the
 *   backend will return.
 *
 * @param {unknown} size
 * @param {number} defaultSize
 * @returns {number}
 */
export function clampPageSize(size, defaultSize) {
  const n = Number(size);
  const fallback = Number.isFinite(defaultSize) && defaultSize > 0 ? Math.floor(defaultSize) : MAX_STUDENTS_LIST_PAGE_SIZE;
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), MAX_STUDENTS_LIST_PAGE_SIZE);
}

// Filter keys whose changes should reset the students list back to page 1.
// Anything NOT in this set runs client-side on the current page (e.g.
// academicPerformance / attendance) and shouldn't trigger a server refetch.
export const SERVER_FILTER_KEYS = Object.freeze([
  'search',
  'classId',
  'feeStatus',
  'status',
  'academicYear',
  'sortBy',
  'sortOrder',
]);

/**
 * Detect whether any server-side filter changed between two snapshots.
 * Client-only filters (academicPerformance / attendance) are ignored — they
 * run over the current page on the client and must not re-trigger a fetch.
 *
 * @param {Record<string, unknown>} prev
 * @param {Record<string, unknown>} next
 * @returns {boolean}
 */
export function serverFiltersChanged(prev = {}, next = {}) {
  for (const key of SERVER_FILTER_KEYS) {
    const a = prev[key];
    const b = next[key];
    if (Array.isArray(a) || Array.isArray(b)) {
      const aStr = Array.isArray(a) ? a.join(',') : a ?? '';
      const bStr = Array.isArray(b) ? b.join(',') : b ?? '';
      if (aStr !== bStr) return true;
      continue;
    }
    if ((a ?? '') !== (b ?? '')) return true;
  }
  return false;
}
