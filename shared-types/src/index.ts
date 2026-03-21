// Common base types used across the EMS monorepo

/** MongoDB ObjectId as string */
export type ObjectId = string;

/** ISO 8601 date string */
export type ISODateString = string;

/** Base fields present on all multi-tenant documents */
export interface BaseDocument {
  _id: ObjectId;
  schoolId: ObjectId;
  isDeleted?: boolean;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

/** Authenticated user attached to requests */
export interface AuthUser {
  _id: ObjectId;
  schoolId: ObjectId;
  role: 'admin' | 'teacher' | 'parent' | 'superadmin';
  name: string;
  email: string;
}

/** Standard paginated API response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Standard API error response */
export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ path: string; message: string }>;
}

/** Standard API success response */
export interface ApiSuccess<T = unknown> {
  success: true;
  message?: string;
  data: T;
}

/** API response union */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/** Academic year string format e.g. "2025-2026" */
export type AcademicYear = string;

/** Common status enums */
export type StudentStatus = 'active' | 'inactive' | 'transferred' | 'graduated';
export type StaffStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export type FeePaymentStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'holiday';
export type ExamStatus = 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'published';
