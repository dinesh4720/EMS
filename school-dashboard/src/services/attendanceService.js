/**
 * Attendance domain service.
 * Re-exports from the domain module in api/.
 * Import directly from this file for tree-shaking:
 *   import { attendanceApi, staffAttendanceApi } from '../services/attendanceService'
 */
export { attendanceApi, staffAttendanceApi } from './api/classes.js';
