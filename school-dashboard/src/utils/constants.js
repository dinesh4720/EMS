/**
 * Application-wide constants
 * Centralized configuration values that can be updated annually or fetched from settings
 */

/**
 * Current Academic Year
 * Can be updated annually or fetched from school settings
 * Format: 'YYYY-YY' (e.g., '2024-25' for 2024-2025 academic year)
 */
export const CURRENT_ACADEMIC_YEAR = '2024-25';

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
  TRANSFERRED: 'transferred'
};
