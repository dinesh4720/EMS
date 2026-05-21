/**
 * Validation utilities for Front Desk module
 */

// Allowed domains for document/image URLs (all uploads go through Cloudinary)
const ALLOWED_URL_DOMAINS = [
  'res.cloudinary.com',
];

/**
 * Check whether a URL string belongs to an allowed upload domain.
 * Returns true for File/Blob objects (they haven't been uploaded yet).
 * Returns true for empty/null values (optional fields).
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export const isAllowedDocumentUrl = (url) => {
  if (!url || typeof url !== 'string') return true;
  try {
    const parsed = new URL(url);
    return ALLOWED_URL_DOMAINS.includes(parsed.hostname);
  } catch {
    return false;
  }
};

/**
 * Validate phone number — accepts Indian (10-digit) and international (7-15 digit) formats.
 * Supports optional leading + and country codes, spaces, hyphens, parentheses.
 * @param {string} phone - Phone number to validate
 * @param {boolean} required - Whether phone is required (default: false)
 * @returns {boolean} - True if valid
 */
export const validatePhone = (phone, required = false) => {
  if (!phone) return !required;
  const digitsOnly = phone.replace(/\D/g, '');
  // Accepts 7–15 digits (ITU-T E.164 range)
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};

/**
 * Check if a phone number is all the same digit repeated (e.g. "1111111111").
 * @param {string} phone - Phone number to check
 * @returns {boolean} True if every digit is identical
 */
export const isRepeatedDigits = (phone) => {
  if (!phone) return false;
  return /^(\d)\1{9}$/.test(phone);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const validateEmail = (email) => {
  if (!email) return true; // Email is optional
  // Improved email regex - more thorough validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate required fields
 * @param {object} data - Form data object
 * @param {string[]} requiredFields - Array of required field names
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validateRequired = (data, requiredFields) => {
  const errors = [];

  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate date is not in the past (for appointments, gate passes)
 * @param {string} dateTime - ISO date string
 * @returns {boolean} - True if date is in future or today
 */
export const validateFutureDate = (dateTime) => {
  if (!dateTime) return true;
  // Parse YYYY-MM-DD as local-day to avoid the UTC-midnight off-by-one
  // (e.g. "2026-05-05" should be today even when the user's clock is past
  // 18:30 IST and JS parses the bare string as 2026-05-05T00:00:00Z).
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let inputDate;
  if (typeof dateTime === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateTime)) {
    const [y, m, d] = dateTime.split("-").map(Number);
    inputDate = new Date(y, m - 1, d);
  } else {
    inputDate = new Date(dateTime);
    inputDate.setHours(0, 0, 0, 0);
  }
  return inputDate >= today;
};

/**
 * Validate fromDateTime is before toDateTime
 * @param {string} from - From date time
 * @param {string} to - To date time
 * @returns {boolean} - True if from is before to
 */
export const validateDateRange = (from, to) => {
  if (!from || !to) return true;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  // FIX: Check if dates are the same and return false to prevent same-time appointments
  if (fromDate.getTime() === toDate.getTime()) {
    return false;
  }
  return fromDate < toDate;
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  return phone;
};

/**
 * Get validation error message
 * @param {string} field - Field name
 * @param {Function} [t] - Optional i18n translation function
 * @returns {string} - Error message
 */
export const getErrorMessage = (field, t) => {
  const keyMap = {
    visitorName: 'validation.visitorNameRequired',
    studentName: 'validation.studentNameRequired',
    parentName: 'validation.parentNameRequired',
    callerName: 'validation.callerNameRequired',
    name: 'validation.nameRequired',
    phoneNumber: 'validation.phoneInvalid',
    email: 'validation.emailInvalid',
    classApplyingFor: 'validation.classRequired',
    personId: 'validation.personRequired',
    fromDateTime: 'validation.fromDateInvalid',
    toDateTime: 'validation.toDateInvalid',
  };
  if (t && keyMap[field]) return t(keyMap[field]);
  const messages = {
    visitorName: 'Visitor name is required',
    studentName: 'Student name is required',
    parentName: 'Parent name is required',
    callerName: 'Caller name is required',
    name: 'Name is required',
    phoneNumber: 'Please enter a valid phone number (7–15 digits)',
    email: 'Please enter a valid email address',
    classApplyingFor: 'Please select a class',
    personId: 'Please select a person',
    fromDateTime: 'From date must be before to date',
    toDateTime: 'To date must be after from date',
  };
  return messages[field] || `${field} is invalid`;
};

/**
 * Validation category options for feedbacks
 */
export const FEEDBACK_CATEGORIES = [
  'Academic',
  'Administrative',
  'Facility',
  'Suggestion',
  'Complaint',
  'Other'
];

/**
 * Validation intent options for call logs
 */
export const CALL_INTENT_OPTIONS = [
  'Interested',
  'Follow-up required',
  'Urgent',
  'Information',
  'Business',
  'Not interested'
];

// ============ CLASS MODULE VALIDATIONS ============

/**
 * Validate class data for creation/editing
 * @param {object} data - Class data
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateClassData = (data, t) => {
  const errors = {};
  const msg = (key, fallback) => (t ? t(key) : fallback);

  if (!data.name || data.name.trim() === '') {
    errors.name = msg('validation.classNameRequired', 'Class name is required');
  } else if (!/^[A-Za-z0-9\s.()-]+$/.test(data.name)) {
    errors.name = msg('validation.classNameInvalid', 'Class name can only contain letters, numbers, spaces, hyphens, dots, and parentheses');
  }

  if (!data.section || data.section.trim() === '') {
    errors.section = msg('validation.sectionRequired', 'Section is required');
  } else if (!/^[A-Za-z0-9()-]+$/.test(data.section)) {
    errors.section = msg('validation.sectionInvalid', 'Section can only contain letters, numbers, hyphens, and parentheses');
  }

  if (data.strength !== undefined) {
    if (data.strength <= 0) {
      errors.strength = msg('validation.strengthPositive', 'Strength must be greater than 0');
    } else if (data.strength > 100) {
      errors.strength = msg('validation.strengthMax', 'Strength cannot exceed 100');
    }
  }

  if (!data.academicYear || data.academicYear.trim() === '') {
    errors.academicYear = msg('validation.academicYearRequired', 'Academic year is required');
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate subject data
 * @param {object} data - Subject data
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateSubjectData = (data, t) => {
  const errors = {};
  const msg = (key, fallback) => (t ? t(key) : fallback);

  if (!data.subjectName || data.subjectName.trim() === '') {
    errors.subjectName = msg('validation.subjectNameRequired', 'Subject name is required');
  }

  if (data.chapters != null && data.chapters <= 0) {
    errors.chapters = msg('validation.chaptersPositive', 'Number of chapters must be greater than 0');
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate timetable slot
 * @param {object} data - Timetable slot data
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateTimetableSlot = (data, t) => {
  const errors = {};
  const msg = (key, fallback) => (t ? t(key) : fallback);

  if (!data.day || data.day.trim() === '') {
    errors.day = msg('validation.dayRequired', 'Day is required');
  }

  if (data.periodIndex === undefined || data.periodIndex < 0) {
    errors.periodIndex = msg('validation.periodRequired', 'Valid period is required');
  }

  if (!data.subject || data.subject.trim() === '') {
    errors.subject = msg('validation.subjectRequired', 'Subject is required');
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
