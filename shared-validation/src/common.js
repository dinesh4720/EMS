/**
 * @ems/validation/common
 *
 * Reusable Zod field validators shared across all schema definitions.
 */
import { z } from 'zod';

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const phone10 = z
  .string()
  .transform(v => v.replace(/\D/g, ''))
  .pipe(z.string().length(10, 'Phone number must be 10 digits'));

export const aadhaar12 = z
  .string()
  .transform(v => v.replace(/\D/g, ''))
  .pipe(z.string().length(12, 'Aadhaar must be 12 digits'));

export const zip6 = z
  .string()
  .transform(v => v.replace(/\D/g, ''))
  .pipe(z.string().length(6, 'ZIP code must be 6 digits'));

export const isoDate = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
);

export const academicYear = z.string().regex(
  /^\d{4}-\d{4}$/,
  'Academic year must be in YYYY-YYYY format (e.g. 2025-2026)'
);

export const optionalString = z.string().optional().nullable();
export const optionalEmail = z.string().email().optional().nullable().or(z.literal(''));
