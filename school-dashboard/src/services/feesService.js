/**
 * Fees domain service.
 * Re-exports from the domain module in api/.
 * Import directly from this file for tree-shaking:
 *   import { feesApi, studentFeesApi, payrollApi } from '../services/feesService'
 */
export {
  feesApi,
  studentFeesApi,
  payrollApi,
  calendarEventsApi,
  intakeFormsApi,
  publicApi,
  notificationsApi,
} from './api/fees.js';
