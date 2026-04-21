import { validatePhone, validateEmail } from "../../../../utils/validations";

/**
 * Validates a single field in real-time as the user types.
 * Returns an error string or null.
 * Also calls setErrors to update state directly.
 */
export const validateSingleField = ({ field, value, editingStaff, allStaff, setErrors }) => {
  let newError = null;
  switch (field) {
    case "name":
      if (!value.trim()) newError = "Required";
      break;
    case "phone":
      if (!value.trim()) newError = "Required";
      else if (!validatePhone(value, true)) newError = "Invalid phone number";
      else {
        // BUG-19: check for duplicate phone among existing staff
        const editingId = editingStaff?._id || editingStaff?.id;
        const phoneDupe = Array.isArray(allStaff) && allStaff.length > 0 && allStaff.find(s =>
          s.phone && s.phone === value.trim() &&
          (s._id || s.id) !== editingId
        );
        if (phoneDupe) {
          newError = `Phone already used by ${phoneDupe.name}${phoneDupe.code ? ` (${phoneDupe.code})` : ''}`;
        }
      }
      break;
    case "email":
      if (value.trim()) {
        if (!validateEmail(value.trim())) {
          newError = "Invalid email address";
        } else {
          // Check for duplicate email among existing staff
          const editingId = editingStaff?._id || editingStaff?.id;
          const duplicate = Array.isArray(allStaff) && allStaff.find(s =>
            s.email && s.email.toLowerCase() === value.trim().toLowerCase() &&
            (s._id || s.id) !== editingId
          );
          if (duplicate) {
            newError = `Email already used by ${duplicate.name}${duplicate.code ? ` (${duplicate.code})` : ''}`;
          }
        }
      }
      break;
    case "staffType":
      if (!value) newError = "Required";
      break;
    case "dob":
      if (!value) {
        newError = "Required";
      } else {
        const dobDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dobDate > today) {
          newError = "Date of birth cannot be in the future";
        }
      }
      break;
    case "gender":
      if (!value) newError = "Required";
      break;
    case "fatherName":
      if (!value.trim()) newError = "Required";
      break;
    case "department":
      if (!value) newError = "Required";
      break;
    case "ifscCode":
      if (value.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.toUpperCase())) {
        newError = "Invalid IFSC format (e.g., SBIN0001234)";
      }
      break;
    default:
      break;
  }
  setErrors(prev => ({ ...prev, [field]: newError }));
};

/**
 * Validates all fields for a given step number.
 * Returns true if valid, false if there are errors.
 * Calls setErrors with the error map.
 */
export const validateStep = ({ stepNum, formData, editingStaff, allStaff, setErrors }) => {
  const newErrors = {};
  if (stepNum === 1) {
    // Personal Info validation
    if (!formData.name.trim()) newErrors.name = "Required";
    if (!formData.dob) {
      newErrors.dob = "Required";
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dobDate > today) {
        newErrors.dob = "Date of birth cannot be in the future";
      }
    }
    if (!formData.gender) newErrors.gender = "Required";
    // fatherName is required for new staff, optional when editing existing records
    if (!editingStaff && !formData.fatherName.trim()) newErrors.fatherName = "Required";
    if (!formData.phone.trim()) newErrors.phone = "Required";
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Invalid";
    if (formData.email.trim()) {
      if (!validateEmail(formData.email.trim())) {
        newErrors.email = "Invalid email address";
      } else {
        const editingId = editingStaff?._id || editingStaff?.id;
        const duplicate = Array.isArray(allStaff) && allStaff.find(s =>
          s.email && s.email.toLowerCase() === formData.email.trim().toLowerCase() &&
          (s._id || s.id) !== editingId
        );
        if (duplicate) {
          newErrors.email = `Email already used by ${duplicate.name}${duplicate.code ? ` (${duplicate.code})` : ''}`;
        }
      }
    }
    // Emergency contact phone validation
    formData.emergencyContacts.forEach((contact, i) => {
      if (contact.phone && !/^\d{10}$/.test(contact.phone)) {
        newErrors[`emergencyPhone_${i}`] = "Invalid phone number";
      }
    });
  }
  if (stepNum === 2) {
    // Job Details validation
    if (!formData.staffType || (Array.isArray(formData.staffType) && formData.staffType.length === 0)) {
      newErrors.staffType = "At least one role is required";
    }
    if (!formData.department) newErrors.department = "Required";
  }
  if (stepNum === 3) {
    // Education validation - At least one degree is required for NEW staff only
    if (!editingStaff && formData.professionalQualifications.length === 0) {
      newErrors.qualifications = "At least one degree is required";
    }
    formData.professionalQualifications.forEach((q, i) => {
      // Skip validation for completely empty entries (no name, no year, no institution)
      const isEmpty = !q.name && !q.year && !q.institution;
      if (isEmpty) return;
      if (!q.name) newErrors[`qualName_${i}`] = "Required";
      if (q.year && !/^\d{4}$/.test(q.year)) newErrors[`qualYear_${i}`] = "Invalid Year";
      if (q.year && (parseInt(q.year) < 1950 || parseInt(q.year) > new Date().getFullYear())) {
        newErrors[`qualYear_${i}`] = "Invalid Year";
      }
    });
  }
  // Step 4 (Documents) has no required validations
  if (stepNum === 5) {
    // Salary details validation (optional, but IFSC should be validated if provided)
    if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
      newErrors.ifscCode = "Invalid IFSC format (e.g., SBIN0001234)";
    }
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
