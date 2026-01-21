/**
 * Validation utilities for Front Desk module
 */

/**
 * Validate phone number (exactly 10 digits for Indian numbers)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const validatePhone = (phone) => {
  if (!phone) return true; // Phone is optional
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
  const date = new Date(dateTime);
  const now = new Date();
  return date >= now;
};

/**
 * Validate fromDateTime is before toDateTime
 * @param {string} from - From date time
 * @param {string} to - To date time
 * @returns {boolean} - True if from is before to
 */
export const validateDateRange = (from, to) => {
  if (!from || !to) return true;
  return new Date(from) < new Date(to);
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
