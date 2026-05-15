// Mirrors the backend ALLOWED_MIME_TYPES whitelist in EMS-backend/routes/upload.js
// Must stay in sync with backend — extension-based accept attributes can be bypassed

// Must match the multer fileSize limit in EMS-backend/routes/upload.js
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Audio
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  // Video
  'video/mp4',
  'video/webm',
  'video/ogg',
]);

/**
 * Validates a File object's MIME type against the allowed whitelist.
 * Returns an error message string if invalid, or null if valid.
 * This is a defense-in-depth check — the backend enforces the same list.
 */
export function validateFileType(file) {
  if (!file || !file.type) {
    return `Cannot determine file type for "${file?.name ?? 'unknown'}"`;
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `File type "${file.type}" is not allowed for "${file.name}"`;
  }
  return null;
}

/**
 * Validates a File object's size against the backend limit.
 * Returns an error message string if too large, or null if valid.
 */
export function validateFileSize(file) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return `"${file.name}" is too large (${sizeMb} MB). Maximum allowed size is 10 MB.`;
  }
  return null;
}

/**
 * Filters an array of File objects to allowed MIME types and size.
 * Returns { valid: File[], rejected: string[] } where rejected contains error messages.
 */
export function filterAllowedFiles(files) {
  const valid = [];
  const rejected = [];
  for (const file of files) {
    const typeErr = validateFileType(file);
    if (typeErr) {
      rejected.push(typeErr);
      continue;
    }
    const sizeErr = validateFileSize(file);
    if (sizeErr) {
      rejected.push(sizeErr);
      continue;
    }
    valid.push(file);
  }
  return { valid, rejected };
}
