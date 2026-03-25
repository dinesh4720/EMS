/**
 * Operations domain service (uploads, announcements, front-desk, messaging helpers).
 * Re-exports from the domain module in api/.
 * Import directly from this file for tree-shaking:
 *   import { uploadApi, announcementsApi, frontDeskApi } from '../services/operationsService'
 */
export {
  uploadApi,
  announcementsApi,
  remindersApi,
  callsApi,
  visitorsApi,
  gatePassesApi,
  frontDeskApi,
  lookupPincode,
  substitutionAlertsApi,
} from './api/operations.js';
