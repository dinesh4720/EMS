/**
 * studentFormValidation.js
 * Centralized Zod validation schemas for the AddStudent form.
 * Mirrors backend createStudentSchema from validators/studentSchema.js
 */
import { z } from 'zod';
import { ddmmyyToIso, isoToDdmmyy } from './dateUtils';
import { VALIDATION_RULES } from '../constants/studentConstants';

// ── Health Info sub-schemas ──
const allergySchema = z.object({
  name: z.string().min(1, 'Allergy name is required').max(100),
  type: z.string().max(50).optional(),
  severity: z.string().max(50).optional(),
  reaction: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required').max(100),
  dosage: z.string().max(100).optional(),
  frequency: z.string().max(100).optional(),
  startDate: z.string().max(20).optional(),
  endDate: z.string().max(20).optional(),
  prescribedBy: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

const healthEmergencyContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required').max(100),
  relationship: z.string().max(50).optional(),
  phone: z.string().min(1, 'Phone is required').max(20),
  alternatePhone: z.string().max(20).optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  priority: z.number().int().min(1).nullish(),
});

const healthInfoSchema = z.object({
  allergies: z.array(allergySchema).optional(),
  medications: z.array(medicationSchema).optional(),
  emergencyContacts: z.array(healthEmergencyContactSchema).optional(),
}).optional();

/**
 * Strip empty health info items before sending to backend.
 * An allergy/medication is empty if name is blank.
 * An emergency contact is empty if name or phone is blank.
 */
export function cleanHealthInfo(healthInfo) {
  if (!healthInfo) return undefined;
  const cleaned = {
    allergies: (healthInfo.allergies || []).filter((a) => a.name?.trim()),
    medications: (healthInfo.medications || []).filter((m) => m.name?.trim()),
    emergencyContacts: (healthInfo.emergencyContacts || []).filter(
      (c) => c.name?.trim() && c.phone?.trim()
    ),
  };
  // If all arrays are empty, omit healthInfo entirely
  if (
    cleaned.allergies.length === 0 &&
    cleaned.medications.length === 0 &&
    cleaned.emergencyContacts.length === 0
  ) {
    return undefined;
  }
  return cleaned;
}

// ── Parent/Guardian validation schema ──
export const parentZodSchema = z.object({
  name: z.string().min(1, 'Parent name is required').max(100, 'Name must not exceed 100 characters'),
  phone: z.string().regex(VALIDATION_RULES.phone.pattern, VALIDATION_RULES.phone.message),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  relationship: z.string().optional(),
  occupation: z.string().max(100).optional(),
  isWhatsapp: z.boolean().optional(),
  isParent: z.boolean().optional(),
});

// ── Step 1: Personal Info validation ──
export const step1Schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters').trim(),
  dateOfBirth: z.string().min(1, 'Required').regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Please enter date in DD/MM/YYYY format'),
  gender: z.string().min(1, 'Required'),
  classGrade: z.string().min(1, 'Required'),
  section: z.string().min(1, 'Required'),
  aadhaarNumber: z.string().regex(/^[0-9]{12}$/, 'Aadhaar must be exactly 12 digits').or(z.literal('')).optional(),
  mobile: z.string().regex(VALIDATION_RULES.phone.pattern, VALIDATION_RULES.phone.message).or(z.literal('')).optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  zipCode: z.string().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits').or(z.literal('')).optional(),
});

/**
 * Validate a specific step of the student form.
 * @param {number} stepNum - Step number (1 or 2)
 * @param {Object} formData - Current form data
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateStep(stepNum, formData) {
  const newErrors = {};

  if (stepNum === 1) {
    const result = step1Schema.safeParse(formData);
    if (!result.success) {
      result.error.errors.forEach((err) => {
        const field = err.path[0];
        if (!newErrors[field]) newErrors[field] = err.message;
      });
    }
    // Additional calendar validity check for DOB
    if (!newErrors.dateOfBirth && formData.dateOfBirth) {
      const [day, month, year] = formData.dateOfBirth.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      const isValidDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
      if (!isValidDate) {
        newErrors.dateOfBirth = 'Invalid calendar date';
      } else if (year < 1900) {
        newErrors.dateOfBirth = 'Year must be 1900 or later';
      } else if (year > new Date().getFullYear()) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }
  }

  if (stepNum === 2) {
    if (formData.parents.length === 0 || !formData.parents[0].name.trim()) {
      newErrors.parentName = 'At least one parent/guardian is required';
    } else {
      const result = parentZodSchema.safeParse(formData.parents[0]);
      if (!result.success) {
        result.error.errors.forEach((err) => {
          if (err.path[0] === 'name') newErrors.parentName = err.message;
          if (err.path[0] === 'phone') newErrors.parentPhone = err.message;
          if (err.path[0] === 'email') newErrors.parentEmail = err.message;
        });
      }
    }
    // Validate additional parents' phone numbers
    formData.parents.slice(1).forEach((parent, i) => {
      if (parent.phone && !VALIDATION_RULES.phone.pattern.test(parent.phone)) {
        newErrors[`additionalParentPhone_${i + 1}`] = 'Phone must be 10 digits';
      }
      if (parent.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parent.email)) {
        newErrors[`additionalParentEmail_${i + 1}`] = 'Invalid email format';
      }
    });
    // Validate health info: empty cards are fine (they get stripped), but
    // partially-filled cards with missing required fields should block.
    const hi = formData.healthInfo;
    if (hi) {
      const emptyAllergy = (hi.allergies || []).findIndex((a) => !a.name?.trim());
      const emptyMed = (hi.medications || []).findIndex((m) => !m.name?.trim());
      const emptyContact = (hi.emergencyContacts || []).findIndex(
        (c) => !c.name?.trim() || !c.phone?.trim()
      );
      if (emptyAllergy !== -1) {
        newErrors.healthInfo = `Allergy #${emptyAllergy + 1} is missing a name`;
      } else if (emptyMed !== -1) {
        newErrors.healthInfo = `Medication #${emptyMed + 1} is missing a name`;
      } else if (emptyContact !== -1) {
        newErrors.healthInfo = `Emergency contact #${emptyContact + 1} is missing a name or phone`;
      }
    }
  }

  return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
}

// Re-export date conversion utilities from the canonical source (dateUtils.js)
export { ddmmyyToIso, isoToDdmmyy };

/**
 * Build the student data payload for API submission.
 * Maps form field names to backend field names.
 */
export function buildStudentPayload(formData, {
  classId,
  admissionId,
  academicYear,
  photoUrl,
  documents,
  initialData,
}) {
  let formattedDateOfBirth = formData.dateOfBirth;
  if (formData.dateOfBirth && formData.dateOfBirth.includes('/')) {
    formattedDateOfBirth = ddmmyyToIso(formData.dateOfBirth);
  }

  const studentData = {
    name: formData.fullName,
    admissionId,
    academicYear,
    classId,
    rollNo: formData.rollNumber ? parseInt(formData.rollNumber) : null,
    gender: formData.gender,
    dateOfBirth: formattedDateOfBirth,
    bloodGroup: formData.bloodGroup,
    email: formData.email,
    phone: formData.mobile,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    zipCode: formData.zipCode,
    parentName: formData.parents[0]?.name,
    parentPhone: formData.parents[0]?.phone,
    parentEmail: formData.parents[0]?.email,
    parentRelationship: formData.parents[0]?.relationship,
    parentOccupation: formData.parents[0]?.occupation,
    parents: formData.parents,
    siblings: formData.siblings,
    aadhaarNumber: formData.aadhaarNumber,
    nationality: formData.nationality,
    religion: formData.religion,
    category: formData.category,
    motherTongue: formData.motherTongue,
    previousSchool: formData.previousSchool,
    tcNumber: formData.tcNumber,
    mediumOfInstruction: formData.mediumOfInstruction,
    house: formData.house,
    transportRequired: formData.transportRequired,
    hostelRequired: formData.hostelRequired,
    medicalConditions: formData.medicalConditions,
    emergencyContactName: formData.emergencyContactName,
    emergencyContactPhone: formData.emergencyContactPhone,
    healthInfo: cleanHealthInfo(formData.healthInfo),
    alternatePhone: formData.alternatePhone,
    isWhatsapp: formData.isWhatsapp,
    whatsappNumber: formData.whatsappNumber,
    photo: photoUrl,
  };

  // Add documents
  if (documents && documents.length > 0) {
    studentData.documents = documents;
  } else if (initialData?.documents && initialData.documents.length > 0) {
    studentData.documents = initialData.documents;
  }

  // Status/fee (only for new students)
  if (!initialData) {
    studentData.status = 'active';
    studentData.feeStatus = 'pending';
  } else {
    if (initialData.status) studentData.status = initialData.status;
    if (initialData.feeStatus) studentData.feeStatus = initialData.feeStatus;
  }

  // Remove undefined values and empty objects
  Object.keys(studentData).forEach((key) => {
    if (studentData[key] === undefined) delete studentData[key];
    if (
      typeof studentData[key] === 'object' &&
      studentData[key] !== null &&
      !Array.isArray(studentData[key]) &&
      !(studentData[key] instanceof File) &&
      Object.keys(studentData[key]).length === 0
    ) {
      delete studentData[key];
    }
  });

  return studentData;
}
