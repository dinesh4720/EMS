/**
 * Extensions domain service (parent, inventory, library, transport, reports, hostel, etc.).
 * Re-exports from the domain module in api/.
 * Import directly from this file for tree-shaking:
 *   import { libraryApi, transportApi, hostelApi } from '../services/extensionsService'
 */
export {
  parentApi,
  inventoryApi,
  libraryApi,
  transportApi,
  reportsApi,
  exportApi,
  bulkImportApi,
  hostelApi,
  jobsApi,
  silentRefresh,
  ptmApi,
  webhooksApi,
  emailCampaignsApi,
  promotionApi,
  npsApi,
  cbseReportCardApi,
  cceApi,
} from './api/extensions.js';
