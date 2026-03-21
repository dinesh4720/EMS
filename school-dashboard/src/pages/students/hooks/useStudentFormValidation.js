import { useState, useCallback } from "react";

/**
 * Custom hook for student form validation
 * Handles step-by-step validation, DOB real-time validation, and error scrolling
 *
 * Extracted from AddStudent.jsx to improve maintainability
 *
 * @param {Object} formData - The current form data state
 * @param {Function} updateField - Function to update a single form field
 * @returns {Object} Validation state and handlers
 */
export function useStudentFormValidation(formData, updateField) {
  const [errors, setErrors] = useState({});
  const [dobValidation, setDobValidation] = useState({ isValid: false, message: '', warning: '' });

  /**
   * Validate a specific step of the form
   * @param {number} stepNum - The step number to validate (1 or 2)
   * @returns {{ isValid: boolean, errors: Object }} Validation result
   */
  const validateStep = useCallback((stepNum) => {
    const newErrors = {};
    if (stepNum === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = "Required";

      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Required";
      } else {
        const ddmmyyPattern = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!ddmmyyPattern.test(formData.dateOfBirth)) {
          newErrors.dateOfBirth = "Please enter date in DD/MM/YYYY format";
        } else {
          const [day, month, year] = formData.dateOfBirth.split('/').map(Number);
          const currentYear = new Date().getFullYear();
          const date = new Date(year, month - 1, day);
          const isValidDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

          if (!isValidDate) {
            newErrors.dateOfBirth = "Invalid calendar date";
          } else if (year < 1900) {
            newErrors.dateOfBirth = "Year must be 1900 or later";
          } else if (year === currentYear) {
            newErrors.dateOfBirth = "Year cannot be the current year";
          }
        }
      }

      if (!formData.gender) newErrors.gender = "Required";
      if (!formData.classGrade) newErrors.classGrade = "Required";
      if (!formData.section) newErrors.section = "Required";
      if (formData.zipCode && !/^\d{6}$/.test(formData.zipCode)) newErrors.zipCode = "ZIP code must be exactly 6 digits";
    }
    if (stepNum === 2) {
      // Phone: international format matching backend optionalPhoneIntl (7–20 chars: digits, +, spaces, dashes, parens)
      const phonePattern = /^\+?[0-9\s\-().]{7,20}$/;
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (formData.parents.length === 0 || !formData.parents[0]?.name?.trim()) {
        newErrors.parentName = "At least one parent/guardian is required";
      }

      // Validate every parent/guardian entry that has any data
      const parentErrors = {};
      formData.parents.forEach((p, idx) => {
        const entryErrors = {};
        const hasAnyData = p.name?.trim() || p.phone?.trim() || p.email?.trim() || p.occupation?.trim();

        if (idx === 0) {
          // Primary parent: name and phone are required
          if (!p.name?.trim()) {
            entryErrors.name = "Name is required";
          }
          if (!p.phone?.trim()) {
            entryErrors.phone = "Phone is required";
          } else if (!phonePattern.test(p.phone)) {
            entryErrors.phone = "Invalid phone number";
          }
        } else if (hasAnyData) {
          // Non-primary entries: name is required if any field is filled
          if (!p.name?.trim()) {
            entryErrors.name = "Name is required";
          }
          if (p.phone?.trim() && !phonePattern.test(p.phone)) {
            entryErrors.phone = "Invalid phone number";
          }
        }

        // Email format (all entries)
        if (p.email?.trim() && !emailPattern.test(p.email)) {
          entryErrors.email = "Invalid email address";
        }

        if (Object.keys(entryErrors).length > 0) {
          parentErrors[idx] = entryErrors;
        }
      });

      if (Object.keys(parentErrors).length > 0) {
        newErrors.parentErrors = parentErrors;
        // Keep legacy keys for scroll-to-error support
        if (parentErrors[0]?.name) newErrors.parentName = parentErrors[0].name;
        if (parentErrors[0]?.phone) newErrors.parentPhone = parentErrors[0].phone;
      }
    }
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  }, [formData]);

  /**
   * Clear a specific field error
   * @param {string} field - The field name to clear the error for
   */
  const clearFieldError = useCallback((field) => {
    setErrors(prev => ({ ...prev, [field]: null }));
  }, []);

  /**
   * Validate DOB in real-time as the user types
   * @param {string} dateStr - The date string being typed (DD/MM/YYYY format)
   */
  const validateDOBInRealTime = useCallback((dateStr) => {
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
  }, []);

  /**
   * Handle DOB input with smart formatting and digit filtering
   * Auto-formats to DD/MM/YYYY as user types, with validation rules for each segment
   * @param {string} value - Raw input value
   */
  const handleDobChange = useCallback((value) => {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear - 1;
    const digits = value.replace(/\D/g, '');
    const existingDigits = (formData.dateOfBirth || '').replace(/\D/g, '');
    const isDeleting = digits.length < existingDigits.length;

    let filteredDigits = '';
    let dayPart = '';
    let monthPart = '';
    const yearPart = '';

    if (digits.length > 0) {
      const firstDigit = digits[0];
      if (firstDigit >= '4') {
        filteredDigits = '';
      } else {
        dayPart = firstDigit;
        if (digits.length >= 2) {
          const secondDigit = digits[1];
          if (firstDigit <= '2') {
            dayPart = firstDigit + secondDigit;
          } else if (firstDigit === '3') {
            if (secondDigit === '0' || secondDigit === '1') {
              dayPart = firstDigit + secondDigit;
            } else {
              dayPart = firstDigit;
            }
          }
        }
        filteredDigits = dayPart;

        if (digits.length >= 3 && dayPart.length === 2) {
          const monthFirstDigit = digits[2];
          if (monthFirstDigit >= '2') {
            monthPart = '';
          } else {
            monthPart = monthFirstDigit;
            if (digits.length >= 4) {
              const monthSecondDigit = digits[3];
              if (monthFirstDigit === '0') {
                monthPart = monthFirstDigit + monthSecondDigit;
              } else if (monthFirstDigit === '1') {
                if (monthSecondDigit >= '0' && monthSecondDigit <= '2') {
                  monthPart = monthFirstDigit + monthSecondDigit;
                } else {
                  monthPart = monthFirstDigit;
                }
              }
            }
            filteredDigits = dayPart + monthPart;
          }

          if (digits.length >= 5 && monthPart.length === 2) {
            const yearDigits = digits.slice(4);
            if (yearDigits.length <= 4) {
              let yearToCheck = yearDigits;
              if (yearDigits.length === 4) {
                const fullYear = parseInt(yearDigits);
                if (fullYear < 1900) {
                  yearToCheck = '';
                } else if (fullYear > maxYear) {
                  yearToCheck = '';
                } else {
                  yearToCheck = yearDigits;
                }
              } else {
                if (yearDigits.length >= 1) {
                  const firstYearDigit = yearDigits[0];
                  if (firstYearDigit === '0' || firstYearDigit === '1') {
                    yearToCheck = '';
                  } else if (firstYearDigit === '2') {
                    if (yearDigits.length >= 2) {
                      const secondYearDigit = yearDigits[1];
                      if (secondYearDigit !== '0') {
                        yearToCheck = '2';
                      } else {
                        yearToCheck = yearDigits;
                      }
                    } else {
                      yearToCheck = yearDigits;
                    }
                  } else if (firstYearDigit >= '3') {
                    yearToCheck = '';
                  } else {
                    yearToCheck = yearDigits;
                  }
                }
              }
              filteredDigits = dayPart + monthPart + yearToCheck;
            }
          }
        }
      }
    }

    let formatted = '';
    if (filteredDigits.length >= 1) {
      formatted += filteredDigits.slice(0, 2);
      if (filteredDigits.length >= 3) {
        formatted += '/' + filteredDigits.slice(2, 4);
        if (filteredDigits.length >= 5) {
          formatted += '/' + filteredDigits.slice(4, 8);
        }
      }
    }

    updateField("dateOfBirth", formatted);

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(formatted)) {
      validateDOBInRealTime(formatted);
    } else {
      setDobValidation({ isValid: false, message: '', warning: '' });
    }
  }, [formData.dateOfBirth, updateField, validateDOBInRealTime]);

  /**
   * Scroll to the first error field in a given step
   * @param {number} stepNum - Step number (1 or 2)
   * @param {Object} errorObj - Error object with field names as keys
   * @param {Object} refs - Object mapping field names to React refs
   */
  const scrollToError = useCallback((stepNum, errorObj, refs) => {
    requestAnimationFrame(() => {
      if (stepNum === 1) {
        if (errorObj.fullName && refs.fullNameRef?.current) {
          refs.fullNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errorObj.dateOfBirth && refs.dobRef?.current) {
          refs.dobRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errorObj.gender && refs.genderRef?.current) {
          refs.genderRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if ((errorObj.classGrade || errorObj.section) && refs.classRef?.current) {
          refs.classRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (stepNum === 2) {
        if (errorObj.parentName && refs.parentNameRef?.current) {
          refs.parentNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errorObj.parentPhone && refs.parentPhoneRef?.current) {
          refs.parentPhoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  }, []);

  return {
    errors,
    setErrors,
    dobValidation,
    validateStep,
    clearFieldError,
    validateDOBInRealTime,
    handleDobChange,
    scrollToError,
  };
}
