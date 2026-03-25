/**
 * @ems/config
 *
 * Platform-agnostic constants shared across the EMS monorepo.
 * Import specific sub-modules for tree-shaking:
 *   import { API_TIMEOUT_MS } from '@ems/config/api';
 *   import { DEFAULT_PAGE_SIZE } from '@ems/config/pagination';
 */
export * from './api.js';
export * from './pagination.js';
