import { useState } from "react";

/**
 * Hook that provides real-time DOB validation state and a validate function.
 * Used by the AddStudent form's date-of-birth field.
 *
 * Returns:
 *   dobValidation  - { isValid, message, warning }
 *   validateDOBInRealTime(dateStr, setErrors) - validates the date string and
 *     updates dobValidation; callers must pass their own setErrors so that the
 *     dateOfBirth error key is set/cleared correctly.
 */
function useDOBValidation() {
  const [dobValidation, setDobValidation] = useState({ isValid: false, message: '', warning: '' });

  const validateDOBInRealTime = (dateStr, setErrors) => {
    const digits = dateStr.replace(/\D/g, '');
    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validation = { isValid: false, message: '', warning: '' };

    if (!dateStr || dateStr.length === 0) {
      setDobValidation(validation);
      setErrors(prev => ({ ...prev, dateOfBirth: null }));
      return;
    }

    if (digits.length < 8) {
      validation.message = `Keep typing... (${digits.length}/8 digits)`;
      setDobValidation(validation);
      setErrors(prev => ({ ...prev, dateOfBirth: null }));
      return;
    }

    const day = parseInt(digits.slice(0, 2));
    const month = parseInt(digits.slice(2, 4));
    const year = parseInt(digits.slice(4, 8));

    if (day < 1 || day > 31) {
      validation.message = 'Invalid day (must be 01-31)';
      setErrors(prev => ({ ...prev, dateOfBirth: 'Day must be between 01 and 31' }));
      setDobValidation(validation);
      return;
    }

    if (month < 1 || month > 12) {
      validation.message = 'Invalid month (must be 01-12)';
      setErrors(prev => ({ ...prev, dateOfBirth: 'Month must be between 01 and 12' }));
      setDobValidation(validation);
      return;
    }

    if (year < 1900) {
      validation.message = 'Year too old (must be 1900 or later)';
      setErrors(prev => ({ ...prev, dateOfBirth: 'Year must be 1900 or later' }));
      setDobValidation(validation);
      return;
    }

    if (year >= currentYear) {
      validation.message = 'Future dates not allowed';
      setErrors(prev => ({ ...prev, dateOfBirth: 'Year cannot be current year or future' }));
      setDobValidation(validation);
      return;
    }

    const date = new Date(year, month - 1, day);
    const isValidCalendar = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

    if (!isValidCalendar) {
      validation.message = 'Invalid date (does not exist in calendar)';
      setErrors(prev => ({ ...prev, dateOfBirth: 'Invalid calendar date' }));
      setDobValidation(validation);
      return;
    }

    const inputDate = new Date(year, month - 1, day);
    inputDate.setHours(0, 0, 0, 0);
    if (inputDate > today) {
      validation.message = 'Future dates not allowed';
      setErrors(prev => ({ ...prev, dateOfBirth: 'Date cannot be in the future' }));
      setDobValidation(validation);
      return;
    }

    const ageInYears = today.getFullYear() - year - (today.getMonth() < month || (today.getMonth() === month && today.getDate() < day) ? 1 : 0);

    if (ageInYears > 100) {
      validation.warning = 'Person appears to be over 100 years old';
      validation.isValid = true;
      validation.message = `Age: ${ageInYears} years`;
      setErrors(prev => ({ ...prev, dateOfBirth: null }));
      setDobValidation(validation);
      return;
    }

    validation.isValid = true;
    validation.message = `Age: ${ageInYears} years`;
    setErrors(prev => ({ ...prev, dateOfBirth: null }));
    setDobValidation(validation);
  };

  return { dobValidation, validateDOBInRealTime };
}

export default useDOBValidation;
