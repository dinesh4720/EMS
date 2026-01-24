/**
 * Validation utilities for Front Desk module
 */

/**
 * Validate phone number (exactly 10 digits for Indian numbers)
 * @param {string} phone - Phone number to validate
 * @param {boolean} required - Whether phone is required (default: false)
 * @returns {boolean} - True if valid
 */
export const validatePhone = (phone, required = false) => {
  if (!phone) return !required; // Return true if optional and empty, false if required
  // Remove all non-digit characters and check if exactly 10 digits
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
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
  // FIX: Use local date comparison to avoid timezone issues
  // Parse the input date and strip time component for fair comparison
  const inputDate = new Date(dateTime);
  const today = new Date();

  // Reset both dates to midnight for fair comparison
  inputDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

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
 * @returns {string} - Error message
 */
export const getErrorMessage = (field) => {
  const messages = {
    visitorName: 'Visitor name is required',
    studentName: 'Student name is required',
    parentName: 'Parent name is required',
    callerName: 'Caller name is required',
    name: 'Name is required',
    phoneNumber: 'Please enter a valid 10-digit phone number',
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
export const validateClassData = (data) => {
  const errors = {};

  if (!data.name || data.name.trim() === '') {
    errors.name = 'Class name is required';
  } else if (!/^[A-Za-z0-9\s-]+$/.test(data.name)) {
    errors.name = 'Class name can only contain letters, numbers, and hyphens';
  }

  if (!data.section || data.section.trim() === '') {
    errors.section = 'Section is required';
  } else if (!/^[A-Za-z0-9-]+$/.test(data.section)) {
    errors.section = 'Section can only contain letters, numbers, and hyphens';
  }

  if (data.strength !== undefined) {
    if (data.strength <= 0) {
      errors.strength = 'Strength must be greater than 0';
    } else if (data.strength > 100) {
      errors.strength = 'Strength cannot exceed 100';
    }
  }

  if (!data.academicYear || data.academicYear.trim() === '') {
    errors.academicYear = 'Academic year is required';
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
export const validateSubjectData = (data) => {
  const errors = {};

  if (!data.subjectName || data.subjectName.trim() === '') {
    errors.subjectName = 'Subject name is required';
  }

  if (data.chapters && data.chapters <= 0) {
    errors.chapters = 'Number of chapters must be greater than 0';
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
export const validateTimetableSlot = (data) => {
  const errors = {};

  if (!data.day || data.day.trim() === '') {
    errors.day = 'Day is required';
  }

  if (data.periodIndex === undefined || data.periodIndex < 0) {
    errors.periodIndex = 'Valid period is required';
  }

  if (!data.subject || data.subject.trim() === '') {
    errors.subject = 'Subject is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
