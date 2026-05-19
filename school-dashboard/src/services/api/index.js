/**
 * Barrel re-export for all API domain modules.
 * Import from `../api.js` (the top-level api.js) for backward compatibility,
 * or import directly from individual domain files for tree-shaking.
 */

export { clearApiCache, request, requestUpload, requestBlob } from './core.js';
export { staffApi, studentsApi, trashApi } from './staff.js';
export { examsApi, homeworkApi, resultsApi, academicPerformanceApi, subjectsApi, examScheduleApi } from './academics.js';
export {
  classesApi, classesEnhancedApi, attendanceApi, staffAttendanceApi,
  timetableApi, teacherAssignmentsApi, teacherTimetableApi,
} from './classes.js';
export {
  settingsApi, billingApi, superAdminApi, changelogAdminApi, featureFlagsAdminApi,
  ssoApi,
} from './settings.js';
export {
  calendarEventsApi, intakeFormsApi, publicApi, notificationsApi,
  feesApi, studentFeesApi, payrollApi,
} from './fees.js';
export {
  uploadApi, announcementsApi, remindersApi, callsApi,
  visitorsApi, gatePassesApi, frontDeskApi, lookupPincode, substitutionAlertsApi,
  searchApi,
} from './operations.js';
export {
  parentApi, inventoryApi, libraryApi, transportApi, reportsApi,
  exportApi, bulkImportApi, hostelApi, jobsApi, silentRefresh,
  ptmApi, webhooksApi, emailCampaignsApi, promotionApi, npsApi,
  cbseReportCardApi, cceApi, expensesApi,
} from './extensions.js';
export { permissionsApi } from './permissions.js';
