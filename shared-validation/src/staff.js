/**
 * @ems/validation/staff
 *
 * Zod schemas for staff create/update operations.
 */
import { z } from 'zod';
import { objectId, phone10, isoDate, optionalString, optionalEmail } from './common.js';

export const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  designation: z.string().min(1, 'Designation is required'),
  department: optionalString,
  role: z.enum(['teacher', 'admin', 'support', 'management']).default('teacher'),
  phone: phone10,
  email: z.string().email('Valid email required'),
  dateOfJoining: isoDate,
  dateOfBirth: isoDate.optional().nullable(),
  gender: z.enum(['Male', 'Female', 'Other']).optional().nullable(),
  qualification: optionalString,
  experience: z.number().int().min(0).optional().nullable(),
  salary: z.number().positive().optional().nullable(),
  salaryType: z.enum(['monthly', 'hourly', 'contract']).default('monthly'),
  status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).default('active'),
  address: optionalString,
  subjects: z.array(objectId).optional().default([]),
  classIds: z.array(objectId).optional().default([]),
});

export const updateStaffSchema = createStaffSchema.partial();
