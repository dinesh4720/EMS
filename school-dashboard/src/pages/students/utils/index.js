// Student utility functions
export {
  getAuthToken,
  formatFileSize,
  getNextClass,
  calculateAttendanceStats,
  getInitials,
  getAvatarColor,
} from './studentHelpers';

export {
  parseCSV,
  validateRequired,
  validateEmail,
  validatePhone,
  validateDate,
  validateAadhaar,
  validateZip,
  normalizeClassName,
  validateClassSection,
  validateStudentData,
  checkForDuplicates,
  groupStudentsByClassSection,
  transformStudentForImport,
  ALL_COLUMNS,
} from './studentImportUtils';
