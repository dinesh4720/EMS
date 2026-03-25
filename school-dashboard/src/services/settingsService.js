/**
 * Settings domain service.
 * Re-exports from the domain module in api/.
 * Import directly from this file for tree-shaking:
 *   import { settingsApi, billingApi } from '../services/settingsService'
 */
export {
  settingsApi,
  billingApi,
  superAdminApi,
  changelogAdminApi,
  featureFlagsAdminApi,
  ssoApi,
} from './api/settings.js';
