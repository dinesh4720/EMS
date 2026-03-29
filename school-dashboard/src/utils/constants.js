/**
 * Application-wide constants
 * Centralized configuration values that can be updated annually or fetched from settings
 */

export function getDefaultAcademicYear(referenceDate = new Date()) {
  const startYear = referenceDate.getMonth() >= 3
    ? referenceDate.getFullYear()
    : referenceDate.getFullYear() - 1;

  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

export function shiftAcademicYear(academicYear, offset) {
  const [startYearRaw] = String(academicYear || getDefaultAcademicYear()).split('-');
  const startYear = Number.parseInt(startYearRaw, 10);
  const nextStartYear = Number.isNaN(startYear)
    ? Number.parseInt(getDefaultAcademicYear().split('-')[0], 10) + offset
    : startYear + offset;

  return `${nextStartYear}-${String((nextStartYear + 1) % 100).padStart(2, '0')}`;
}

export function getAcademicYearOptions(currentAcademicYear = getDefaultAcademicYear(), { past = 2, future = 1 } = {}) {
  const options = [];

  for (let offset = future; offset >= 1; offset -= 1) {
    options.push(shiftAcademicYear(currentAcademicYear, offset));
  }

  options.push(currentAcademicYear);

  for (let offset = 1; offset <= past; offset += 1) {
    options.push(shiftAcademicYear(currentAcademicYear, -offset));
  }

  return Array.from(new Set(options));
}

/**
 * Current Academic Year
 * Can be updated annually or fetched from school settings
 * Format: 'YYYY-YY' (e.g., '2024-25' for 2024-2025 academic year)
 */
export const CURRENT_ACADEMIC_YEAR = import.meta.env.VITE_CURRENT_ACADEMIC_YEAR || getDefaultAcademicYear();

/**
 * Default periods for timetable
 * Used as fallback when school settings are not available
 * Shared between TeacherTimetableEditor and class Timetable components
 */
export const DEFAULT_PERIODS = [
  { name: "Period 1", startTime: "08:00", endTime: "08:45", isBreak: false },
  { name: "Period 2", startTime: "08:45", endTime: "09:30", isBreak: false },
  { name: "Break", startTime: "09:30", endTime: "09:45", isBreak: true },
  { name: "Period 3", startTime: "09:45", endTime: "10:30", isBreak: false },
  { name: "Period 4", startTime: "10:30", endTime: "11:15", isBreak: false },
  { name: "Lunch", startTime: "11:15", endTime: "12:00", isBreak: true },
  { name: "Period 5", startTime: "12:00", endTime: "12:45", isBreak: false },
  { name: "Period 6", startTime: "12:45", endTime: "13:30", isBreak: false },
];

/**
 * Days of the week for timetable
 */
export const TIMETABLE_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * API Response Constants
 */
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading'
};

/**
 * Common Fee Status Types
 */
export const FEE_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue'
};

/**
 * Attendance Status Types
 */
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late'
};

/**
 * Student Status Types
 */
export const STUDENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  GRADUATED: 'graduated',
  TRANSFERRED: 'transferred',
  ALUMNI: 'alumni'
};

/**
 * App Config Defaults
 * These should eventually be fetched from school settings.
 * In the meantime, centralizing them here makes them easy to find and configure.
 */
export const APP_CONFIG = {
  // Security
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,     // 15 minutes
  SESSION_IDLE_TIMEOUT_MS: 30 * 60 * 1000,  // 30 minutes
  SESSION_WARNING_COUNTDOWN_S: 120,          // 2 minutes
  ACTIVITY_THROTTLE_MS: 30 * 1000,           // 30 seconds

  // Uploads
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,     // 10 MB

  // Library
  MAX_LIBRARY_FINE: 5000,                    // ₹5000

  // Pagination
  ITEMS_PER_PAGE: 10,

  // Search
  SEARCH_DEBOUNCE_MS: 300,

  // Fee defaulter thresholds (days)
  DEFAULTER_THRESHOLDS: [7, 15, 30],
};
