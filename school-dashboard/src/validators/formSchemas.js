/**
 * formSchemas.js
 * Centralised Zod validation schemas for all dashboard forms.
 * Mirrors the corresponding Mongoose schemas in the backend.
 */
import { z } from 'zod';

// ── Helper: converts empty-string / null form values to undefined before numeric validation ──
const optNum = (validator) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), validator.optional());

// ────────────────────────────────────────────────────────────
// ACADEMICS
// ────────────────────────────────────────────────────────────

const EXAM_TYPE_VALUES = [
  'unit_test', 'quiz', 'midterm', 'final', 'quarterly',
  'half_yearly', 'annual', 'practice', 'class_test', 'assignment',
];
const TERM_VALUES = ['term_1', 'term_2', 'term_3', 'final'];
const GRADING_TYPE_VALUES = ['numerical', 'grades', 'cgpa'];
const SESSION_TYPE_VALUES = ['morning', 'afternoon', 'both'];

export const createExamSchema = z
  .object({
    name: z.string().min(1, 'Exam name is required').max(200, 'Name too long').trim(),
    type: z.enum(EXAM_TYPE_VALUES, { errorMap: () => ({ message: 'Invalid exam type' }) }),
    classId: z.string().min(1, 'Please select a class'),
    subjectId: z.string().min(1, 'Please select a subject'),
    startDate: z
      .string()
      .min(1, 'Start date is required')
      .refine((d) => d >= new Date().toISOString().split('T')[0], {
        message: 'Start date cannot be in the past',
      }),
    endDate: z.string().optional(),
    maxMarks: z.coerce.number().int().min(1, 'Max marks must be greater than 0'),
    passingMarks: z.coerce.number().int().min(0, 'Passing marks must be 0 or greater'),
    weightage: optNum(z.number().min(0).max(100)),
    gradingType: z.enum(GRADING_TYPE_VALUES).optional(),
    term: z.enum(TERM_VALUES).optional(),
    duration: optNum(z.number().int().min(1)),
    instructions: z.string().max(2000).optional(),
    academicYear: z.string().optional(),
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  })
  .refine((d) => d.passingMarks <= d.maxMarks, {
    message: 'Passing marks cannot exceed max marks',
    path: ['passingMarks'],
  });

export const createExamScheduleSchema = z
  .object({
    name: z.string().min(1, 'Schedule name is required').trim(),
    type: z.enum(
      ['unit_test', 'quiz', 'midterm', 'final', 'quarterly', 'half_yearly', 'annual'],
      { errorMap: () => ({ message: 'Invalid exam type' }) }
    ),
    classIds: z.array(z.string().min(1)).min(1, 'Select at least one class'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    sessionType: z.enum(SESSION_TYPE_VALUES).optional(),
    defaultMaxMarks: z.coerce.number().int().min(1, 'Max marks must be > 0'),
    defaultPassingMarks: z.coerce.number().int().min(0, 'Passing marks must be 0 or greater'),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  })
  .refine((d) => d.defaultPassingMarks <= d.defaultMaxMarks, {
    message: 'Passing marks cannot exceed max marks',
    path: ['defaultPassingMarks'],
  });

// ────────────────────────────────────────────────────────────
// HOMEWORK
// ────────────────────────────────────────────────────────────

const homeworkAttachmentSchema = z.object({
  name: z.string().optional(),
  url: z.string().min(1, 'Attachment URL is required'),
  type: z.string().optional(),
});

export const homeworkSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(2000, 'Description too long')
      .trim(),
    subject: z.string().min(1, 'Please select a subject'),
    classId: z.string().min(1, 'Please select a class'),
    dueDate: z.string().min(1, 'Due date is required'),
    totalMarks: z.coerce.number().min(0, 'Total marks must be 0 or greater').max(1000).default(100),
    sentToParents: z.boolean().optional(),
    attachments: z.array(homeworkAttachmentSchema).optional(),
  })
  .refine(
    (data) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(data.dueDate) >= today;
    },
    { message: 'Due date cannot be in the past', path: ['dueDate'] }
  );

export const homeworkGradeSchema = z
  .object({
    studentId: z.string().min(1, 'Student is required'),
    marks: z.coerce.number().min(0, 'Marks cannot be negative'),
    feedback: z.string().max(1000).optional(),
    maxMarks: z.number().optional(),
  })
  .refine((data) => data.maxMarks == null || data.marks <= data.maxMarks, {
    message: 'Marks cannot exceed total marks',
    path: ['marks'],
  });

// ────────────────────────────────────────────────────────────
// FEES
// ────────────────────────────────────────────────────────────

export const feeStructureAssignmentSchema = z.object({
  classId: z.string().min(1, 'Please select a class'),
  feeHeads: z
    .array(z.object({ name: z.string().optional(), amount: z.coerce.number().min(0).optional() }))
    .min(1, 'At least one fee head is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
});

export const feeHeadSchema = z.object({
  name: z.string().min(1, 'Fee head name is required').max(200).trim(),
  category: z
    .enum(['Academic', 'Transport', 'Extra-curricular', 'Hostel', 'Other'])
    .optional(),
  frequency: z.enum(['monthly', 'quarterly', 'term', 'yearly', 'one-time']).optional(),
  mandatory: z.boolean().optional(),
  amount: optNum(z.number().min(0, 'Amount must be 0 or greater')),
  description: z.string().max(500).optional(),
  applicableTerms: z.array(z.number()).optional(),
  dueDay: z.coerce.number().int().min(1).max(31).optional(),
  refundable: z.boolean().optional(),
});

// Mirrors backend createFeePaymentSchema (EMS-backend/validators/feeSchema.js).
export const PAYMENT_MODE_VALUES = ['cash', 'cheque', 'online', 'card', 'upi', 'bank_transfer'];
const ONLINE_PAYMENT_MODES = ['online', 'card', 'upi', 'bank_transfer'];

export const feePaymentSchema = z
  .object({
    studentId: z.string().min(1, 'Student is required'),
    classId: z.string().min(1, 'Class is required'),
    paymentDate: z.string().optional(),
    amount: z.coerce
      .number()
      .min(1, 'Payment amount must be at least 1')
      .max(10000000, 'Payment amount seems too large'),
    paymentMode: z.enum(PAYMENT_MODE_VALUES, {
      errorMap: () => ({ message: 'Invalid payment mode' }),
    }),
    feeHeads: z
      .array(
        z.object({
          feeHeadId: z.string().optional(),
          name: z.string().optional(),
          amount: z.coerce.number().min(1, 'Fee head amount must be at least 1'),
          month: z.string().optional(),
        }),
      )
      .optional()
      .default([]),
    transactionId: z.string().max(100).optional().or(z.literal('')),
    remarks: z.string().max(500).optional().or(z.literal('')),
  })
  .refine(
    (d) => !ONLINE_PAYMENT_MODES.includes(d.paymentMode) || Boolean(d.transactionId),
    {
      message: 'Transaction ID is required for online, card, UPI, or bank transfer payments',
      path: ['transactionId'],
    },
  )
  .refine(
    (d) => {
      if (!Array.isArray(d.feeHeads) || d.feeHeads.length === 0) return true;
      const sum = d.feeHeads.reduce((s, h) => s + (h.amount || 0), 0);
      return Math.abs(sum - d.amount) < 0.01;
    },
    { message: 'Sum of selected fees must equal the total amount', path: ['amount'] },
  );

// Mirrors backend createRefundSchema (EMS-backend/validators/feeSchema.js).
export const REFUND_MODE_VALUES = ['cash', 'cheque', 'bank_transfer'];

export const createRefundSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  classId: z.string().min(1, 'Class is required'),
  amount: z.coerce
    .number()
    .min(1, 'Refund amount must be at least 1')
    .max(10000000, 'Refund amount seems too large'),
  reason: z
    .string()
    .min(10, 'Refund reason must be at least 10 characters')
    .max(500, 'Refund reason must not exceed 500 characters')
    .trim(),
  refundMode: z.enum(REFUND_MODE_VALUES, {
    errorMap: () => ({ message: 'Invalid refund mode' }),
  }),
  remarks: z.string().max(500).optional().or(z.literal('')),
});

// ────────────────────────────────────────────────────────────
// EXPENSES
// ────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORY_VALUES = [
  'salaries', 'utilities', 'maintenance', 'supplies', 'equipment',
  'events', 'transport', 'marketing', 'other',
];

export const EXPENSE_PAYMENT_MODE_VALUES = ['cash', 'cheque', 'bank_transfer', 'upi', 'other'];
export const EXPENSE_STATUS_VALUES = ['pending', 'approved', 'rejected'];

export const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters').trim(),
  amount: z.coerce.number().min(0, 'Amount must be 0 or greater'),
  category: z.enum(EXPENSE_CATEGORY_VALUES, { errorMap: () => ({ message: 'Category is required' }) }),
  paymentMode: z.enum(EXPENSE_PAYMENT_MODE_VALUES).default('cash'),
  expenseDate: z.string().min(1, 'Date is required'),
  description: z.string().max(1000, 'Description must be under 1000 characters').optional().or(z.literal('')),
  vendor: z.string().max(200, 'Vendor must be under 200 characters').optional().or(z.literal('')),
  receiptUrl: z
    .union([z.literal(''), z.string().url('Please enter a valid URL')])
    .optional()
    .or(z.literal('')),
  status: z.enum(EXPENSE_STATUS_VALUES).default('pending'),
  approvedBy: z.string().max(200).optional().or(z.literal('')),
});

// ────────────────────────────────────────────────────────────
// LIBRARY
// ────────────────────────────────────────────────────────────

export const addBookSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  author: z.string().min(1, 'Author is required').trim(),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  publishedYear: optNum(z.number().int().min(1000).max(new Date().getFullYear() + 1)),
  edition: z.string().optional(),
  category: z
    .enum(['textbook', 'reference', 'fiction', 'non-fiction', 'periodical', 'digital', 'other'])
    .optional(),
  subject: z.string().optional(),
  language: z.string().optional(),
  description: z.string().optional(),
  totalCopies: z.coerce.number().int().min(1, 'Total copies must be at least 1'),
  rackNumber: z.string().optional(),
  shelfNumber: z.string().optional(),
  digitalUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  finePerDay: optNum(z.number().min(0, 'Fine must be 0 or greater')),
  coverImageUrl: z.string().optional(),
});

export const issueBookSchema = z.object({
  bookId: z.string().min(1, 'Please select a book'),
  studentId: z.string().min(1, 'Please select a student'),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
});

// ────────────────────────────────────────────────────────────
// TRANSPORT
// ────────────────────────────────────────────────────────────

const stopSchema = z.object({
  name: z.string().min(1, 'Stop name is required'),
  address: z.string().optional(),
  pickupTime: z.string().optional(),
  dropTime: z.string().optional(),
});

export const routeSchema = z.object({
  routeName: z.string().min(1, 'Route name is required').trim(),
  routeNumber: z.string().min(1, 'Route number is required').trim(),
  vehicleId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
  notes: z.string().optional(),
  stops: z.array(stopSchema).optional(),
});

export const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required').trim(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: optNum(z.number().int().min(1900).max(new Date().getFullYear() + 1)),
  capacity: optNum(z.number().int().min(1, 'Capacity must be at least 1')),
  color: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
  notes: z.string().optional(),
  driver: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      licenseNumber: z.string().optional(),
      licenseExpiry: z.string().optional(),
    })
    .optional(),
  conductor: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

// ────────────────────────────────────────────────────────────
// HOSTEL
// ────────────────────────────────────────────────────────────

export const hostelSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  type: z.enum(['boys', 'girls', 'mixed'], {
    errorMap: () => ({ message: 'Type is required' }),
  }),
  wardenName: z.string().optional(),
  wardenPhone: z.string().optional(),
  wardenEmail: z.string().email('Invalid email').or(z.literal('')).optional(),
  address: z.string().optional(),
  description: z.string().optional(),
});

export const hostelRoomSchema = z.object({
  hostelId: z.string().min(1, 'Hostel is required'),
  roomNumber: z.string().min(1, 'Room number is required').trim(),
  floor: z.coerce.number().int().min(0).optional(),
  type: z.enum(['single', 'double', 'triple', 'dormitory']).optional(),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  monthlyFee: z.coerce.number().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const hostelAllocationSchema = z.object({
  hostelId: z.string().min(1, 'Hostel is required'),
  roomId: z.string().min(1, 'Room is required'),
  studentId: z.string().min(1, 'Student is required'),
  bedNumber: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  monthlyFee: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

// ────────────────────────────────────────────────────────────
// STAFF
// ────────────────────────────────────────────────────────────

export const addStaffStep1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  gender: z.string().min(1, 'Gender is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  staffType: z.array(z.string()).min(1, 'At least one staff role is required'),
  department: z.string().min(1, 'Department is required'),
  joinDate: z.string().min(1, 'Join date is required'),
  employmentType: z.string().min(1, 'Employment type is required'),
});

// ────────────────────────────────────────────────────────────
// PTM (Parent–Teacher Meetings)
// Mirrors EMS-backend/routes/ptm.js → createSessionSchema / addSlotSchema
// ────────────────────────────────────────────────────────────

const TIME_HHMM_REGEX = /^\d{2}:\d{2}$/;

export const ptmSessionSchema = z
  .object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional().default(''),
    sessionDate: z
      .string()
      .min(1, 'Session date is required')
      .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' }),
    startTime: z.string().regex(TIME_HHMM_REGEX, 'Use HH:MM format'),
    endTime: z.string().regex(TIME_HHMM_REGEX, 'Use HH:MM format'),
    slotDuration: z.coerce.number().int().min(5, 'Min 5 minutes').max(120, 'Max 120 minutes').default(15),
    classId: z.string().length(24, 'Please select a class'),
    staffId: z.string().length(24, 'Please select a teacher'),
    venue: z.string().max(300, 'Venue too long').optional().default(''),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: 'Start time must be before end time',
    path: ['endTime'],
  });

export const ptmSlotSchema = z.object({
  studentId: z.string().length(24, 'Please select a student'),
  parentName: z.string().trim().min(2, 'Parent name must be at least 2 characters').max(100, 'Parent name too long'),
  parentPhone: z
    .string()
    .regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone number')
    .optional()
    .or(z.literal('')),
  scheduledTime: z.string().regex(TIME_HHMM_REGEX, 'Use HH:MM format'),
  notes: z.string().max(500, 'Notes too long').optional().default(''),
});

// ────────────────────────────────────────────────────────────
// UTILITY
// ────────────────────────────────────────────────────────────

/**
 * Runs safeParse and converts Zod errors to a flat { [field]: firstMessage } map.
 * Nested paths are joined with "." (e.g. "driver.phone").
 *
 * @param {import('zod').ZodSchema} schema
 * @param {unknown} data
 * @returns {{ success: boolean, errors: Record<string, string> }}
 */
// ────────────────────────────────────────────────────────────
// AUTH (mirrors EMS-backend/middleware/validation/validation.js)
// ────────────────────────────────────────────────────────────

const passwordRules = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const emailRule = z.string().min(1, 'Email is required').email('Invalid email address');
const phoneRule = z.string().regex(/^\+?[0-9]{7,15}$/, 'Phone number must be 7–15 digits');

export const loginSchema = z
  .object({
    emailOrPhone: z
      .string()
      .min(1, 'Email or phone is required')
      .refine(
        (value) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^\+?[0-9]{7,15}$/.test(value),
        'Enter a valid email or phone number'
      ),
    password: z.string().min(1, 'Password is required').max(128),
  });

export const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    email: emailRule,
    schoolName: z.string().min(2, 'School name must be at least 2 characters').max(200).trim(),
    password: passwordRules,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreeToTerms: z
      .boolean()
      .refine((value) => value === true, {
        message: 'You must agree to the privacy policy',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z
  .object({
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({ email: emailRule });

export { phoneRule };

export function parseFormSchema(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, errors: {} };

  const errors = {};
  result.error.errors.forEach((err) => {
    const field = err.path.join('.');
    if (field && !errors[field]) errors[field] = err.message;
  });
  return { success: false, errors };
}
