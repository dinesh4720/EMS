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
 */
export const DEFAULT_PERIODS = ['1', '2', '3', '4', '5', '6', '7', '8'];

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
