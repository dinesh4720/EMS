/**
 * @ems/config/api
 *
 * Platform-agnostic API client constants shared across dashboard, parent-app, and staff-app.
 * Platform-specific URL resolution stays in each app's own config file.
 */

/** Default request timeout in milliseconds */
export const API_TIMEOUT_MS = 15_000;

/** Maximum number of automatic retries for failed requests */
export const API_MAX_RETRIES = 2;

/** Base delay (ms) between retry attempts — doubles each attempt */
export const API_RETRY_BASE_DELAY_MS = 1_000;

/** Slow-request warning threshold in milliseconds */
export const API_SLOW_REQUEST_THRESHOLD_MS = 5_000;

/** HTTP status codes that should NOT be retried */
export const NO_RETRY_STATUS_CODES = new Set([400, 401, 403, 404, 409, 422]);

/** HTTP status codes that indicate the user is not authenticated */
export const UNAUTHENTICATED_STATUS_CODES = new Set([401]);

/** Default API headers added to every request */
export const DEFAULT_API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
