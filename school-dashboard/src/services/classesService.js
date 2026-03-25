/**
 * Classes domain service.
 * Re-exports from the domain module in api/.
 * Import directly from this file for tree-shaking:
 *   import { classesApi, classesEnhancedApi } from '../services/classesService'
 */
export {
  classesApi,
  classesEnhancedApi,
  attendanceApi,
  staffAttendanceApi,
  timetableApi,
  teacherAssignmentsApi,
  teacherTimetableApi,
} from './api/classes.js';
