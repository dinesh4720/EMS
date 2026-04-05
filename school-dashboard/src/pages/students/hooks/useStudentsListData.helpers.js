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
 * Filter students by academic performance.
 * @param {Array} students
 * @param {string} filter - 'all' | 'excellent' | 'good' | 'average' | 'below_average'
 * @returns {Array}
 */
export function filterByAcademicPerformance(students, filter) {
  if (filter === 'all') return students;
  return students.filter((student) => {
    if (!student.examResults || !Array.isArray(student.examResults) || student.examResults.length === 0) return false;
    const total = student.examResults.reduce((sum, e) => (e.percentage != null ? sum + e.percentage : sum), 0);
    const avg = total / student.examResults.length;
    switch (filter) {
      case 'excellent':     return avg >= 90;
      case 'good':          return avg >= 75 && avg < 90;
      case 'average':       return avg >= 50 && avg < 75;
      case 'below_average': return avg < 50;
      default:              return true;
    }
  });
}

/**
 * Filter students by attendance range.
 * @param {Array} students
 * @param {string} filter - 'all' | 'excellent' | 'good' | 'average' | 'below'
 * @returns {Array}
 */
export function filterByAttendance(students, filter) {
  if (filter === 'all') return students;
  return students.filter((student) => {
    const att = getAttendancePercentage(student);
    if (att == null) return false;
    switch (filter) {
      case 'excellent': return att >= 90;
      case 'good':      return att >= 75 && att < 90;
      case 'average':   return att >= 50 && att < 75;
      case 'below':     return att < 50;
      default:          return true;
    }
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
  return (
    (filters.classFilter !== 'all' ? 1 : 0) +
    (filters.feeStatusFilter !== 'all' ? 1 : 0) +
    (filters.academicYearFilter !== 'all' ? 1 : 0) +
    (filters.academicPerformanceFilter !== 'all' ? 1 : 0) +
    (filters.attendanceFilter !== 'all' ? 1 : 0)
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
