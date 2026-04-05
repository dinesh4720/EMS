/**
 * Central services barrel file.
 * Import all service modules from here for consistent access.
 */

// REST API client and domain APIs
export {
  clearApiCache,
  request,
  silentRefresh,
  staffApi,
  studentsApi,
  trashApi,
  examsApi,
  homeworkApi,
  resultsApi,
  academicPerformanceApi,
  subjectsApi,
  classesApi,
  classesEnhancedApi,
  attendanceApi,
  staffAttendanceApi,
  timetableApi,
  teacherAssignmentsApi,
  teacherTimetableApi,
  settingsApi,
  billingApi,
  superAdminApi,
  changelogAdminApi,
  featureFlagsAdminApi,
  ssoApi,
  calendarEventsApi,
  intakeFormsApi,
  publicApi,
  notificationsApi,
  feesApi,
  studentFeesApi,
  payrollApi,
  uploadApi,
  announcementsApi,
  remindersApi,
  callsApi,
  visitorsApi,
  gatePassesApi,
  frontDeskApi,
  lookupPincode,
  substitutionAlertsApi,
  searchApi,
  parentApi,
  inventoryApi,
  libraryApi,
  transportApi,
  reportsApi,
  exportApi,
  bulkImportApi,
  hostelApi,
  jobsApi,
  ptmApi,
  webhooksApi,
  emailCampaignsApi,
  promotionApi,
  npsApi,
  cbseReportCardApi,
  cceApi,
  expensesApi,
  permissionsApi,
} from './api.js';

// AI service
export { aiService } from './aiService.js';

// Video call service
export { videoCallService } from './videoCallService.js';

// Socket services (default exports re-exported as named)
export { default as socketService } from './socketService.js';
export { default as socketServiceEnhanced } from './socketServiceEnhanced.js';

// Chat services
export { default as chatService } from './chatService.js';
export { default as chatServiceEnhanced } from './chatServiceEnhanced.js';
