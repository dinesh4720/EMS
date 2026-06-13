import { queryClient } from '../../lib/queryClient.js';
import { requestQueue } from '../../utils/requestQueue.js';
import { clearStoredUser, getAuthHeaders } from '../../utils/authSession';
import { API_URL } from '../../config/api.js';
import logger from '../../utils/logger';
import { ApiError, ApiErrorCode, buildHttpError, normalizeApiError, notifySessionExpired } from './errors.js';

// [DK-847] Re-export the central error layer so call sites and React Query can
// `import { ApiError, normalizeApiError } from '.../services/api'` for one
// consistent error shape (see errors.js).
export { ApiError, ApiErrorCode, normalizeApiError, SESSION_EXPIRED_EVENT } from './errors.js';

// [AUDIT-572] Fail fast with a clear message if API_URL is misconfigured.
// Without this, undefined/empty API_URL causes confusing JSON parse errors
// from fetch("undefined/endpoint") or fetch("/endpoint") hitting the HTML page.
if (!API_URL || typeof API_URL !== 'string') {
  throw new Error(
    `API_URL is not configured (got ${JSON.stringify(API_URL)}). ` +
    'Set VITE_API_URL in your .env file or check config/api.js.'
  );
}


// Export cache clearing function
export function clearApiCache() {
  void queryClient.invalidateQueries();
}

// ── Token refresh logic ──────────────────────────────────────────────
// Prevents multiple concurrent refresh attempts when several requests
// receive 401 at the same time.
let _refreshPromise = null;

export async function attemptTokenRefresh() {
  // If a refresh is already in-flight, piggyback on it
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // sends the httpOnly refresh-token cookie
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// [AUDIT-857] In-flight request deduplication map for GET/HEAD requests.
// Prevents duplicate network requests when the same endpoint is called concurrently
// (e.g., React StrictMode double-mounts or multiple components requesting the same data).
const _inflightRequests = new Map();

export function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const method = options.method || 'GET';

  // [AUDIT-857] Return the existing in-flight promise for concurrent GET/HEAD calls
  // to avoid duplicate network requests for the same endpoint.
  // If the stored request was already aborted (e.g., React StrictMode remount),
  // do not reuse its promise — start a fresh request instead.
  if ((method === 'GET' || method === 'HEAD') && _inflightRequests.has(url)) {
    const inflight = _inflightRequests.get(url);
    if (!inflight.signal || !inflight.signal.aborted) {
      return inflight.promise;
    }
  }

  // Create the actual request function
  const makeRequest = async () => {
    const controller = new AbortController();
    const timeoutMs = options.timeout ?? 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // If an external signal is provided, abort the internal controller when it fires.
    // [AUDIT-573] Re-check after listener registration to close the race window
    // where the signal aborts between the initial check and addEventListener.
    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        const abortError = new Error('Request aborted');
        abortError.name = 'AbortError';
        throw abortError;
      }
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      if (options.signal.aborted) {
        controller.abort();
      }
    }

    try {
      const hasBody = method !== 'GET' && method !== 'HEAD' && method !== 'DELETE';
      const headers = getAuthHeaders({
        ...(hasBody && { 'Content-Type': 'application/json' }),
        ...options.headers
      });

      const { signal: _ignored, ...fetchOptions } = options;
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: options.credentials ?? 'include',
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));

        // If unauthorized, attempt a token refresh before logging the user out.
        // The refresh endpoint uses the 30-day httpOnly refresh-token cookie.
        if (response.status === 401) {
          const refreshed = await attemptTokenRefresh();
          if (refreshed) {
            // [AUDIT-155] Create a NEW AbortController for the retry — the original may
            // already be aborted (its signal stays aborted forever).
            const retryController = new AbortController();
            const retryTimeoutId = setTimeout(() => retryController.abort(), timeoutMs);

            try {
              // Re-fetch auth headers since the token was just refreshed
              const retryHeaders = getAuthHeaders({
                ...(hasBody && { 'Content-Type': 'application/json' }),
                ...options.headers
              });

              const retryResponse = await fetch(url, {
                ...fetchOptions,
                headers: retryHeaders,
                credentials: fetchOptions.credentials ?? 'include',
                signal: retryController.signal,
                cache: 'no-store',
              });

              clearTimeout(retryTimeoutId);

              if (retryResponse.ok) {
                if (retryResponse.status === 204) return null;
                return await retryResponse.json();
              }

              // [AUDIT-531] Only log out if the retry is also 401.
              // Non-401 errors (500, 403, etc.) should be thrown normally,
              // not cause a session clear.
              if (retryResponse.status !== 401) {
                const retryBody = await retryResponse.json().catch(() => ({ error: 'Request failed' }));
                throw buildHttpError(retryResponse.status, retryBody, { headers: retryResponse.headers });
              }
            } catch (retryErr) {
              clearTimeout(retryTimeoutId);
              // [AUDIT-531] If the retry threw a real error (not a 401 flow),
              // re-throw it instead of falling through to logout
              if (retryErr.status && retryErr.status !== 401) {
                throw retryErr;
              }
              // Network error during retry — fall through to logout
            }
          }
          // Refresh failed or retried request still 401 — log out and let the
          // app surface a "session expired" message (DK-847). clearStoredUser()
          // fires `auth-session-cleared` which drives the redirect to /login;
          // notifySessionExpired() additionally distinguishes an expiry from a
          // deliberate logout so the reason can be shown to the user.
          logger.warn('⚠️ 401 Unauthorized - token refresh failed, clearing session');
          clearStoredUser();
          queryClient.clear();
          notifySessionExpired();
        }

        // [DK-847] All non-OK responses now produce one normalized ApiError
        // (status + machine code + message + details) via the central layer.
        if (error.details) {
          logger.error('Validation details:', JSON.stringify(error.details, null, 2));
        }
        throw buildHttpError(response.status, error, { headers: response.headers });
      }

      // 204 No Content has no body — return null instead of parsing
      if (response.status === 204) {
        return null;
      }

      const data = await response.json();

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        // Distinguish between external cancellation and internal timeout.
        // Cancellation stays a native AbortError — dozens of call sites ignore
        // requests by checking `err.name === 'AbortError'`.
        if (options.signal?.aborted) {
          const abortErr = new Error('Request aborted');
          abortErr.name = 'AbortError';
          throw abortErr;
        }
        logger.error(`⏱️ API Timeout: ${url}`);
        throw new ApiError('Request timed out', { code: ApiErrorCode.TIMEOUT });
      }
      // [DK-847] Normalize everything else (transport TypeErrors, offline, and
      // ApiErrors thrown above pass through unchanged) into one shape.
      throw normalizeApiError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // [AUDIT-160] Use request queue for all requests.
  // Retries are handled by React Query's queryClient (see queryClient.js).
  // Do NOT add retryRequest() here — that creates a double retry layer
  // (up to 3 * 3 = 9 attempts per failed request).
  const promise = (async () => {
    try {
      return await requestQueue.add(makeRequest);
    } catch (error) {
      // Only log errors that aren't rate limiting, 404s, or aborts (reduce console spam)
      if (
        error.name !== 'AbortError' &&
        !error.message?.includes('rate limit') &&
        !error.message?.includes('Too many requests') &&
        error.status !== 404 &&
        !error.message?.includes('not found')
      ) {
        logger.error(`❌ API Error: ${url}`, error.message || error);
      }
      throw error;
    }
  })();

  // [AUDIT-857] Register and auto-clean GET/HEAD promises in the dedup map.
  if (method === 'GET' || method === 'HEAD') {
    _inflightRequests.set(url, { promise, signal: options.signal });
    void promise
      .finally(() => _inflightRequests.delete(url))
      .catch(() => {});
  }

  return promise;
}

/**
 * [AUDIT-159] Upload FormData (file uploads) through the centralized auth/retry pipeline.
 * Unlike request(), this does NOT set Content-Type (browser sets multipart boundary)
 * and returns parsed JSON.
 */
export async function requestUpload(endpoint, formData) {
  const url = `${API_URL}${endpoint}`;

  const makeUpload = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for uploads

    const doUpload = async (isRetry = false) => {
      const headers = getAuthHeaders();
      // Do NOT set Content-Type — let the browser set the multipart boundary
      delete headers['Content-Type'];

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));

          if (response.status === 401) {
            if (!isRetry) {
              const refreshed = await attemptTokenRefresh();
              if (refreshed) {
                return doUpload(true);
              }
            }
            // Either refresh failed, or retry still got 401 — clear session
            clearStoredUser();
            queryClient.clear();
            notifySessionExpired();
          }

          // [DK-847] Normalized error shape, same as request().
          throw buildHttpError(response.status, errorData, { headers: response.headers });
        }

        return response.json();
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Upload timed out', { code: ApiErrorCode.TIMEOUT });
        }
        throw normalizeApiError(error);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    return doUpload();
  };

  return requestQueue.add(makeUpload);
}

/**
 * [AUDIT-159] Fetch a binary blob (e.g., file export/download) through the centralized auth pipeline.
 * Returns the raw Response so callers can call .blob(), .arrayBuffer(), etc.
 */
export async function requestBlob(endpoint) {
  const url = `${API_URL}${endpoint}`;

  const makeFetch = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s for blob downloads

    const doFetch = async (isRetry = false) => {
      try {
        const response = await fetch(url, {
          credentials: 'include',
          headers: getAuthHeaders(),
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            if (!isRetry) {
              const refreshed = await attemptTokenRefresh();
              if (refreshed) {
                return doFetch(true);
              }
            }
            // Either refresh failed, or retry still got 401 — clear session
            clearStoredUser();
            queryClient.clear();
            notifySessionExpired();
          }

          // [DK-847] A blob endpoint may still return a JSON error body; try to
          // surface it, then fall back to a normalized status error.
          const errorData = await response.json().catch(() => ({}));
          throw buildHttpError(response.status, errorData, { headers: response.headers });
        }

        return response;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Export timed out', { code: ApiErrorCode.TIMEOUT });
        }
        throw normalizeApiError(error);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    return doFetch();
  };

  return requestQueue.add(makeFetch);
}
