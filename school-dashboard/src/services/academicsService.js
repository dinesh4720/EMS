/**
 * Academics domain service.
 * Re-exports from the domain module in api/.
 * Import directly from this file for tree-shaking:
 *   import { examsApi, resultsApi, homeworkApi } from '../services/academicsService'
 */
export {
  examsApi,
  homeworkApi,
  resultsApi,
  academicPerformanceApi,
  subjectsApi,
} from './api/academics.js';
