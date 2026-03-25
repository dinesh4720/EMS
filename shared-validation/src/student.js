/**
 * @ems/validation/student
 *
 * Zod schemas for student create/update operations.
 * Used by backend routes, dashboard forms, and mobile apps.
 */
import { z } from 'zod';
import { objectId, phone10, aadhaar12, zip6, isoDate, optionalString, optionalEmail, academicYear } from './common.js';

export const parentSchema = z.object({
  name: z.string().min(1, 'Parent name is required'),
  relationship: z.string().default('Parent'),
  phone: phone10.optional(),
  email: optionalEmail,
  occupation: optionalString,
  isWhatsapp: z.boolean().default(true),
});

export const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  admissionId: z.string().min(1, 'Admission ID is required'),
  classId: objectId,
  academicYear: academicYear,
  rollNo: z.number().int().positive().optional().nullable(),

  // Personal
  gender: z.enum(['Male', 'Female', 'Other']).optional().nullable(),
  dateOfBirth: isoDate.optional().nullable(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional().nullable(),
  nationality: optionalString,
  religion: optionalString,
  category: optionalString,
  motherTongue: optionalString,
  aadhaarNumber: aadhaar12.optional().nullable(),

  // Contact
  phone: phone10.optional().nullable(),
  email: optionalEmail,
  whatsappNumber: optionalString,
  address: optionalString,
  city: optionalString,
  state: optionalString,
  zipCode: zip6.optional().nullable(),

  // Parents
  parents: z.array(parentSchema).min(1, 'At least one parent is required'),

  // Emergency
  emergencyContactName: optionalString,
  emergencyContactPhone: optionalString,

  // Academic history
  previousSchool: optionalString,
  tcNumber: optionalString,
  medicalConditions: optionalString,

  // Status
  status: z.enum(['active', 'inactive', 'alumni']).default('active'),
  feeStatus: z.enum(['paid', 'pending', 'overdue', 'partial']).default('pending'),
  transportRequired: z.boolean().default(false),
  hostelRequired: z.boolean().default(false),
});

export const updateStudentSchema = createStudentSchema.partial().omit({ classId: true, admissionId: true, academicYear: true });

export const studentStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'alumni']),
});
