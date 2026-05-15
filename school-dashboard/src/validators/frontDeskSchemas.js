/**
 * frontDeskSchemas.js
 * Zod validation schemas for Front Desk forms (Visitors, Gate Passes).
 * Mirrors EMS-backend/validators/frontDeskSchema.js exactly.
 */
import { z } from 'zod';

export const VISIT_PURPOSE_VALUES = [
  'PARENT_MEETING',
  'STUDENT_PICKUP_DROP_OFF',
  'SCHOOL_VISIT_INQUIRY',
  'DELIVERY_VENDOR',
  'OFFICIAL_BUSINESS',
  'VOLUNTEER_EVENT',
  'OTHER',
];

export const GATE_PASS_REASON_VALUES = [
  'MEDICAL_EMERGENCY',
  'FAMILY_EMERGENCY',
  'SPECIAL_EVENT',
  'EARLY_DISMISSAL',
  'SUSPENSION_EXPULSION',
  'OTHER',
];

export const LEAVING_WITH_VALUES = ['PARENTS', 'OTHERS'];
export const APPROVED_BY_VALUES = ['CLASS_TEACHER', 'FRONT_OFFICE', 'PRINCIPAL', 'OTHER'];

const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
const allRepeatedDigits = (val) => /^(\d)\1{9,}$/.test((val || '').replace(/\D/g, ''));

const phoneField = z
  .string()
  .regex(phoneRegex, 'Phone must be 7–20 characters with valid characters')
  .refine((val) => {
    const digits = val.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }, { message: 'Phone must contain 7–15 digits' })
  .refine((val) => !allRepeatedDigits(val), {
    message: 'Phone number cannot be all repeated digits',
  });

const optionalEmail = z
  .string()
  .email('Invalid email')
  .or(z.literal(''))
  .optional();

// ── VISITOR: CREATE (check-in) ─────────────────────────────
export const createVisitorSchema = z
  .object({
    name: z.string().min(1, 'Visitor name is required').max(100, 'Name too long').trim(),
    phone: phoneField,
    email: optionalEmail,
    purpose: z.enum(VISIT_PURPOSE_VALUES, {
      errorMap: () => ({ message: 'Please select a reason for visit' }),
    }),
    whomToMeet: z.string().max(200).optional().or(z.literal('')),
    studentId: z.string().optional().or(z.literal('')),
    gatePassRequired: z.boolean().optional(),
    appointmentRequired: z.boolean().optional(),
    otherPurpose: z.string().max(500).optional().or(z.literal('')),
    companyName: z.string().max(200).optional().or(z.literal('')),
    deliveryPerson: z.string().max(100).optional().or(z.literal('')),
    notes: z.string().max(2000).optional().or(z.literal('')),
  })
  .refine((d) => d.purpose !== 'OTHER' || (d.otherPurpose && d.otherPurpose.trim().length > 0), {
    message: 'Please specify the purpose',
    path: ['otherPurpose'],
  })
  .refine(
    (d) => d.purpose !== 'DELIVERY_VENDOR' || (d.companyName && d.companyName.trim().length > 0),
    { message: 'Company name is required for delivery/vendor', path: ['companyName'] }
  );

// ── VISITOR: UPDATE ───────────────────────────────────────
export const updateVisitorSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  phone: phoneField.optional(),
  email: optionalEmail,
  whomToMeet: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

// ── GATE PASS: CREATE ─────────────────────────────────────
export const createGatePassSchema = z
  .object({
    studentId: z.string().min(1, 'Please select a student'),
    reason: z.enum(GATE_PASS_REASON_VALUES, {
      errorMap: () => ({ message: 'Please select a reason' }),
    }),
    otherReason: z.string().max(500).optional().or(z.literal('')),
    leavingDate: z.string().min(1, 'Leaving date is required'),
    leavingTime: z.string().min(1, 'Leaving time is required').max(10),
    expectedReturnDate: z.string().optional().or(z.literal('')),
    expectedReturnTime: z.string().max(10).optional().or(z.literal('')),
    leavingWith: z.enum(LEAVING_WITH_VALUES, {
      errorMap: () => ({ message: 'Select who the student is leaving with' }),
    }),
    escortName: z.string().max(100).optional().or(z.literal('')),
    escortRelation: z.string().max(100).optional().or(z.literal('')),
    escortPhone: z.string().max(20).optional().or(z.literal('')),
    approvedBy: z.enum(APPROVED_BY_VALUES, {
      errorMap: () => ({ message: 'Select who approved this gate pass' }),
    }),
    approvedByStaffId: z.string().min(1, 'Please select a staff member'),
    notes: z.string().max(2000).optional().or(z.literal('')),
  })
  .refine(
    (d) => d.reason !== 'OTHER' || (d.otherReason && d.otherReason.trim().length > 0),
    { message: 'Please specify the reason', path: ['otherReason'] }
  )
  .refine(
    (d) => d.leavingWith !== 'OTHERS' || (d.escortName && d.escortName.trim().length > 0),
    { message: 'Escort name is required when leaving with someone other than parents', path: ['escortName'] }
  )
  .refine(
    (d) => {
      if (!d.expectedReturnDate || !d.leavingDate) return true;
      const left = new Date(`${d.leavingDate}T${d.leavingTime || '00:00'}`);
      const ret = new Date(`${d.expectedReturnDate}T${d.expectedReturnTime || '00:00'}`);
      return ret >= left;
    },
    {
      message: 'Expected return date/time cannot be before the leaving date/time',
      path: ['expectedReturnDate'],
    }
  );

export const updateGatePassSchema = createGatePassSchema;

// ── ADMISSION ENQUIRY ─────────────────────────────────────
export const ADMISSION_STATUS_VALUES = [
  'inquiry-logged',
  'form-sent',
  'form-submitted',
  'documents-verified',
  'test-scheduled',
  'test-cleared',
  'test-failed',
  'test-no-show',
  'admission-approved',
  'admission-rejected',
  'fee-paid',
  'student-admitted',
];

export const ADMISSION_SOURCE_VALUES = ['walk-in', 'call', 'website', 'reference'];
export const ADMISSION_HSC_GROUP_VALUES = ['BIOLOGY', 'COMPUTER_SCIENCE', 'COMMERCE'];
export const ADMISSION_PAYMENT_MODE_VALUES = ['CASH', 'ONLINE', 'CHEQUE', 'INCLUDED_IN_FORM'];
export const ADMISSION_DECISION_VALUES = ['pending', 'approved', 'rejected'];
export const ADMISSION_TEST_RESULT_VALUES = ['pending', 'cleared', 'failed'];
export const ADMISSION_PAYMENT_STATUS_VALUES = ['unpaid', 'paid', 'pending'];

const nameRegex = /^[a-zA-Z\s]+$/;
const tenDigitPhone = z
  .string()
  .min(1, 'Phone number is required')
  .transform((v) => (v || '').replace(/\D/g, '').slice(0, 10))
  .refine((v) => v.length === 10, { message: 'Please enter a valid 10-digit phone number' })
  .refine((v) => !/^(\d)\1{9}$/.test(v), {
    message: 'Phone number cannot be all repeated digits',
  });

export const admissionSchema = z
  .object({
    studentName: z
      .string()
      .min(1, 'Student name is required')
      .regex(nameRegex, 'Student name should contain only letters')
      .trim(),
    dateOfBirth: z.string().optional().or(z.literal('')),
    parentName: z
      .string()
      .min(1, 'Parent name is required')
      .regex(nameRegex, 'Parent name should contain only letters')
      .trim(),
    phoneNumber: tenDigitPhone,
    email: optionalEmail,
    classApplyingFor: z.string().min(1, 'Please enter a class'),
    hscGroup: z.enum(ADMISSION_HSC_GROUP_VALUES).optional().or(z.literal('')),
    assessmentRequired: z.boolean().optional(),
    assignedTeacher: z.string().optional().or(z.literal('')).nullable(),
    testDate: z.string().optional().or(z.literal('')),
    testTime: z.string().optional().or(z.literal('')),
    testResult: z.enum(ADMISSION_TEST_RESULT_VALUES).optional(),
    source: z.enum(ADMISSION_SOURCE_VALUES).optional(),
    status: z.enum(ADMISSION_STATUS_VALUES).optional(),
    admissionDecision: z.enum(ADMISSION_DECISION_VALUES).optional(),
    decisionRemarks: z.string().max(2000).optional().or(z.literal('')),
    paymentStatus: z.enum(ADMISSION_PAYMENT_STATUS_VALUES).optional(),
    paymentMode: z.enum(ADMISSION_PAYMENT_MODE_VALUES).optional().or(z.literal('')),
    paymentAmount: z.union([z.string(), z.number()]).optional().or(z.literal('')),
    paymentDate: z.string().optional().or(z.literal('')),
    transactionId: z.string().max(100).optional().or(z.literal('')),
  })
  .refine(
    (d) => {
      if (!d.assessmentRequired) return true;
      return !!d.assignedTeacher;
    },
    { message: 'Please assign a teacher', path: ['assignedTeacher'] }
  )
  .refine(
    (d) => {
      if (!d.assessmentRequired || !d.testDate) return true;
      return d.testDate >= new Date().toISOString().split('T')[0];
    },
    { message: 'Test date must be in the future', path: ['testDate'] }
  );
