// Constants for parent-app

// User roles
export const USER_ROLES = {
  PARENT: 'parent',
  STUDENT: 'student',
  GUARDIAN: 'guardian',
};

// Attendance status
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LEAVE: 'leave',
  LATE: 'late',
  HOLIDAY: 'holiday',
};

// Fee status
export const FEE_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  PARTIAL: 'partial',
};

// Exam types
export const EXAM_TYPES = {
  UNIT_TEST: 'unit_test',
  MID_TERM: 'mid_term',
  FINAL: 'final',
  PRACTICAL: 'practical',
};

// Result status
export const RESULT_STATUS = {
  PUBLISHED: 'published',
  PENDING: 'pending',
  DRAFT: 'draft',
};

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  VOICE: 'voice',
};

// Tab navigation keys
export const TAB_KEYS = {
  HOME: 'HomeTab',
  ATTENDANCE: 'AttendanceTab',
  FEES: 'FeesTab',
  EXAMS: 'ExamsTab',
  CHAT: 'ChatTab',
  PROFILE: 'ProfileTab',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  AUTH_ERROR: 'Authentication failed. Please login again.',
  UNAUTHORIZED: 'You are not authorized to access this.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  MESSAGE_SENT: 'Message sent successfully.',
};

// Regex patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9]{10,15}$/,
  ADMISSION_NUMBER: /^[A-Z0-9]{5,20}$/,
};

// Date formats
export const DATE_FORMATS = {
  SHORT: 'MMM DD, YYYY',
  LONG: 'dddd, MMMM DD, YYYY',
  TIME: 'HH:mm',
  DATETIME: 'MMM DD, YYYY HH:mm',
};

// Default values
export const DEFAULTS = {
  PAGE_SIZE: 20,
  TIMEOUT: 30000,
  AVATAR_SIZE: 120,
  THUMBNAIL_SIZE: 60,
};

export default {
  USER_ROLES,
  ATTENDANCE_STATUS,
  FEE_STATUS,
  EXAM_TYPES,
  RESULT_STATUS,
  MESSAGE_TYPES,
  TAB_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PATTERNS,
  DATE_FORMATS,
  DEFAULTS,
};
