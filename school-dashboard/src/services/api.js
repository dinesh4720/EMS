/**
 * API service barrel file — re-exports all domain API modules.
 *
 * Existing imports like `import { staffApi } from '../services/api'` continue to work.
 * For new code, prefer importing directly from the domain file:
 *   import { staffApi } from '../services/api/staff.js'
 */
export * from './api/index.js';
