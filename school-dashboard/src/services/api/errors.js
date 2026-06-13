/**
 * Central API error layer — DK-847 / ENGINEERING_GAPS #4.
 *
 * Before this module, `request()` threw bare `Error` objects whose shape varied
 * by code path: some carried `error.message`, some `error.error`, some only
 * `error.details`, and network/timeout failures surfaced as raw fetch
 * `TypeError`s. Call sites coped with `toast.error(err.message || err.error || …)`
 * guesswork, so the same backend failure looked different on every screen.
 *
 * Everything the api client throws now flows through here and comes out as a
 * single normalized shape — an `ApiError` with `{ message, status, code,
 * details }` — so a component can rely on `err.message` for display and
 * `err.code` / `err.status` / the `is*` getters for branching.
 *
 * Cancellation is the one intentional exception: an aborted request is not a
 * user-facing failure, so we leave native `AbortError`s untouched (dozens of
 * call sites short-circuit on `err.name === 'AbortError'`).
 */

/**
 * Stable, machine-readable error codes. Branch on these at call sites instead
 * of magic HTTP numbers so intent survives refactors.
 * @readonly
 */
export const ApiErrorCode = Object.freeze({
  OFFLINE: 'OFFLINE',
  TIMEOUT: 'TIMEOUT',
  ABORTED: 'ABORTED',
  NETWORK: 'NETWORK',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
});

/**
 * Window event fired exactly once per failed session — when a 401 cannot be
 * recovered by a token refresh. Distinct from the existing
 * `auth-session-cleared` event (which also fires on a deliberate user logout):
 * `session-expired` means "the server rejected you", so a listener can surface
 * a "Your session has expired, please log in again" message. The redirect to
 * /login is already driven by `auth-session-cleared` via `clearStoredUser()`.
 */
export const SESSION_EXPIRED_EVENT = 'session-expired';

/** Friendly fallbacks used when the server gives us nothing human-readable. */
const DEFAULT_MESSAGES = Object.freeze({
  [ApiErrorCode.OFFLINE]: "You're offline. Check your internet connection and try again.",
  [ApiErrorCode.TIMEOUT]: 'The request timed out. Please try again.',
  [ApiErrorCode.NETWORK]: 'Network error. Please check your connection and try again.',
  [ApiErrorCode.UNAUTHORIZED]: 'Your session has expired. Please log in again.',
  [ApiErrorCode.FORBIDDEN]: "You don't have permission to do that.",
  [ApiErrorCode.NOT_FOUND]: 'The requested resource could not be found.',
  [ApiErrorCode.VALIDATION]: 'Please check the highlighted fields and try again.',
  [ApiErrorCode.CONFLICT]: 'This conflicts with existing data. Refresh and try again.',
  [ApiErrorCode.RATE_LIMITED]: 'Too many requests — please wait a moment and try again.',
  [ApiErrorCode.SERVER]: 'Something went wrong on our end. Please try again shortly.',
  [ApiErrorCode.ABORTED]: 'The request was cancelled.',
  [ApiErrorCode.UNKNOWN]: 'Something went wrong. Please try again.',
});

/** Map an HTTP status to a stable error code. */
export function codeForStatus(status) {
  switch (status) {
    case 400: return ApiErrorCode.VALIDATION;
    case 401: return ApiErrorCode.UNAUTHORIZED;
    case 403: return ApiErrorCode.FORBIDDEN;
    case 404: return ApiErrorCode.NOT_FOUND;
    case 409: return ApiErrorCode.CONFLICT;
    case 422: return ApiErrorCode.VALIDATION;
    case 429: return ApiErrorCode.RATE_LIMITED;
    default:
      if (typeof status === 'number' && status >= 500) return ApiErrorCode.SERVER;
      return ApiErrorCode.UNKNOWN;
  }
}

/**
 * The one error shape the api client emits. Extends `Error` so existing
 * `err.message` / `instanceof Error` consumers keep working.
 */
export class ApiError extends Error {
  /**
   * @param {string|null} message  Human-readable message; falls back to a
   *   friendly default for the code when empty.
   * @param {object} [opts]
   * @param {number|null} [opts.status]        HTTP status, when one exists.
   * @param {string}      [opts.code]          One of {@link ApiErrorCode}.
   * @param {*}           [opts.details]        Field-level validation / conflict info.
   * @param {number|null} [opts.retryAfterMs]   For rate limiting (429).
   * @param {*}           [opts.cause]          Original error, for debugging.
   */
  constructor(message, { status = null, code = ApiErrorCode.UNKNOWN, details = null, retryAfterMs = null, cause } = {}) {
    super(message || DEFAULT_MESSAGES[code] || DEFAULT_MESSAGES[ApiErrorCode.UNKNOWN]);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details ?? null;
    this.retryAfterMs = retryAfterMs ?? null;
    if (cause !== undefined) this.cause = cause;

    // Back-compat: several pages branch on `error.type === 'ConflictError'`
    // (see ExamScheduleConflict / Timetable / TeacherTimetableEditor). Keep
    // that discriminator alive for conflict errors.
    if (code === ApiErrorCode.CONFLICT) this.type = 'ConflictError';
  }

  get isOffline() { return this.code === ApiErrorCode.OFFLINE; }
  get isTimeout() { return this.code === ApiErrorCode.TIMEOUT; }
  get isAborted() { return this.code === ApiErrorCode.ABORTED; }
  /** True for any connectivity-level failure (offline, timeout, or transport). */
  get isNetwork() { return this.code === ApiErrorCode.NETWORK || this.isOffline || this.isTimeout; }
  get isAuthError() { return this.code === ApiErrorCode.UNAUTHORIZED; }
  get isForbidden() { return this.code === ApiErrorCode.FORBIDDEN; }
  get isNotFound() { return this.code === ApiErrorCode.NOT_FOUND; }
  get isValidation() { return this.code === ApiErrorCode.VALIDATION; }
  get isConflict() { return this.code === ApiErrorCode.CONFLICT; }
  get isRateLimited() { return this.code === ApiErrorCode.RATE_LIMITED; }
  get isServerError() { return this.code === ApiErrorCode.SERVER; }

  /** Serializable view, handy for logging / Sentry without leaking the stack. */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      retryAfterMs: this.retryAfterMs,
    };
  }
}

/** True when `err` is (or quacks like) a native cancellation. */
export function isAbortError(err) {
  return err?.name === 'AbortError';
}

/**
 * Parse a `Retry-After` header (delta-seconds or HTTP-date) into milliseconds.
 * Returns null when absent or unparseable.
 */
export function parseRetryAfterMs(retryAfterHeader) {
  if (!retryAfterHeader) return null;

  const numericValue = Number(retryAfterHeader);
  if (Number.isFinite(numericValue) && numericValue >= 0) {
    return numericValue * 1000;
  }

  const retryAt = Date.parse(retryAfterHeader);
  if (Number.isNaN(retryAt)) return null;

  return Math.max(retryAt - Date.now(), 0);
}

/**
 * Extract the most actionable message from a parsed JSON error body.
 * Backend bodies come in several shapes — `{ error }`, `{ message }`, and
 * `{ details: [{ message }] }` for Zod validation — so prefer the first
 * field-level validation message, then `error`, then `message`.
 */
export function extractServerMessage(body, status) {
  if (body && typeof body === 'object') {
    if (
      status === 400 &&
      Array.isArray(body.details) &&
      body.details.length > 0 &&
      body.details[0]?.message
    ) {
      return body.details[0].message;
    }
    if (typeof body.error === 'string' && body.error) return body.error;
    if (typeof body.message === 'string' && body.message) return body.message;
  }
  return null;
}

/**
 * Build a normalized {@link ApiError} from a non-OK HTTP response.
 *
 * @param {number} status            The HTTP status code.
 * @param {object} [body]            The parsed JSON error body (best effort).
 * @param {object} [opts]
 * @param {Headers} [opts.headers]   Response headers (used to read Retry-After).
 * @returns {ApiError}
 */
export function buildHttpError(status, body = {}, { headers } = {}) {
  // 409, or a 422 the backend explicitly tags as a conflict.
  if (status === 409 || (status === 422 && body?.type === 'ConflictError')) {
    return new ApiError(extractServerMessage(body, status) || DEFAULT_MESSAGES[ApiErrorCode.CONFLICT], {
      status,
      code: ApiErrorCode.CONFLICT,
      // Mirror the previous behaviour: fall back to the whole body when there is
      // no discrete `details` payload, so conflict UIs still get something.
      details: body?.details || body || null,
    });
  }

  if (status === 429) {
    return new ApiError('Too many requests - rate limit exceeded', {
      status,
      code: ApiErrorCode.RATE_LIMITED,
      retryAfterMs: parseRetryAfterMs(headers?.get?.('retry-after')),
    });
  }

  const code = codeForStatus(status);
  return new ApiError(extractServerMessage(body, status) || `Request failed with status ${status}`, {
    status,
    code,
    details: body?.details ?? null,
  });
}

/**
 * Idempotently coerce *any* thrown value into the canonical error shape.
 *
 * Use this in catch blocks (and React Query) when an error may have come from
 * the api client or from somewhere lower (raw fetch, third-party code) and you
 * want a consistent `{ message, status, code }` to work with.
 *
 * - Native cancellations (`AbortError`) pass through untouched — callers rely on
 *   `err.name === 'AbortError'` to ignore them.
 * - Existing `ApiError`s are returned as-is.
 * - Transport failures become OFFLINE (when the browser reports offline) or
 *   NETWORK, preserving the original message so connectivity heuristics that
 *   sniff for "Failed to fetch" / "Load failed" keep working.
 */
export function normalizeApiError(error) {
  if (error instanceof ApiError) return error;
  if (isAbortError(error)) return error;

  if (!error) {
    return new ApiError(null, { code: ApiErrorCode.UNKNOWN });
  }

  const message = typeof error === 'string' ? error : error.message;

  // Transport-level failure (fetch rejects with a TypeError, no HTTP status).
  const looksLikeNetwork =
    error instanceof TypeError ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(message || '');
  if (looksLikeNetwork && error.status == null) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return new ApiError(message || null, {
      code: offline ? ApiErrorCode.OFFLINE : ApiErrorCode.NETWORK,
      cause: error,
    });
  }

  // Anything already carrying an HTTP status — normalize around it.
  if (typeof error.status === 'number') {
    return new ApiError(message || null, {
      status: error.status,
      code: codeForStatus(error.status),
      details: error.details ?? null,
      cause: error,
    });
  }

  return new ApiError(message || null, { code: ApiErrorCode.UNKNOWN, details: error.details ?? null, cause: error });
}

/**
 * Announce that the session has expired (401 the refresh flow could not
 * recover). Fire-and-forget — listeners decide how to surface it. No-op when
 * there is no DOM (SSR / tests without jsdom).
 *
 * @param {string} [message] User-facing reason carried on `event.detail.message`.
 */
export function notifySessionExpired(message = DEFAULT_MESSAGES[ApiErrorCode.UNAUTHORIZED]) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { message } }));
}
