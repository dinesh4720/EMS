import { queryClient } from '../../lib/queryClient.js';
import { requestQueue, retryRequest } from '../../utils/requestQueue.js';
import { clearStoredUser, getAuthHeaders } from '../../utils/authSession';
import { API_URL } from '../../config/api.js';


// Export cache clearing function
export function clearApiCache() {
  void queryClient.invalidateQueries();
}

// ── Token refresh logic ──────────────────────────────────────────────
// Prevents multiple concurrent refresh attempts when several requests
// receive 401 at the same time.
let _refreshPromise = null;

async function attemptTokenRefresh() {
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

function parseRetryAfterMs(retryAfterHeader) {
  if (!retryAfterHeader) {
    return null;
  }

  const numericValue = Number(retryAfterHeader);
  if (Number.isFinite(numericValue) && numericValue >= 0) {
    return numericValue * 1000;
  }

  const retryAt = Date.parse(retryAfterHeader);
  if (Number.isNaN(retryAt)) {
    return null;
  }

  return Math.max(retryAt - Date.now(), 0);
}

export async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const method = options.method || 'GET';

  // Create the actual request function
  const makeRequest = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    // If an external signal is provided, abort the internal controller when it fires
    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        const abortError = new Error('Request aborted');
        abortError.name = 'AbortError';
        throw abortError;
      }
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const headers = getAuthHeaders({
        'Content-Type': 'application/json',
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
            // Retry the original request once with the new access token
            const retryResponse = await fetch(url, {
              ...fetchOptions,
              headers,
              credentials: fetchOptions.credentials ?? 'include',
              signal: controller.signal,
              cache: 'no-store',
            });
            if (retryResponse.ok) {
              clearTimeout(timeoutId);
              if (retryResponse.status === 204) return null;
              return await retryResponse.json();
            }
          }
          // Refresh failed or retried request still 401 — log out
          console.warn('⚠️ 401 Unauthorized - token refresh failed, clearing session');
          clearStoredUser();
          queryClient.clear();
        }

        // If rate limited, throw specific error
        if (response.status === 429) {
          const rateLimitError = new Error('Too many requests - rate limit exceeded');
          rateLimitError.status = 429;
          rateLimitError.retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'));
          throw rateLimitError;
        }

        // If conflict error (409), throw with detailed information
        if (response.status === 409) {
          const conflictError = new Error(error.message || error.error || 'Conflict detected');
          conflictError.type = 'ConflictError';
          conflictError.details = error.details || error;
          conflictError.status = 409;
          throw conflictError;
        }

        // Log validation details if available
        if (error.details) {
          console.error('Validation details:', JSON.stringify(error.details, null, 2));
        }

        const finalError = new Error(error.error || error.message || `Request failed with status ${response.status}`);
        finalError.status = response.status;
        throw finalError;
      }

      // 204 No Content has no body — return null instead of parsing
      if (response.status === 204) {
        return null;
      }

      const data = await response.json();

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        // Distinguish between external cancellation and internal timeout
        if (options.signal?.aborted) {
          // Re-throw as AbortError so callers can detect cancellation
          const abortErr = new Error('Request aborted');
          abortErr.name = 'AbortError';
          throw abortErr;
        }
        console.error(`⏱️ API Timeout: ${url}`);
        throw new Error('Request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Use request queue for all requests
  try {
    return await requestQueue.add(() => retryRequest(makeRequest, 2, 1000));
  } catch (error) {
    // Only log errors that aren't rate limiting, 404s, or aborts (reduce console spam)
    if (
      error.name !== 'AbortError' &&
      !error.message?.includes('rate limit') &&
      !error.message?.includes('Too many requests') &&
      error.status !== 404 &&
      !error.message?.includes('not found')
    ) {
      console.error(`❌ API Error: ${url}`, error.message || error);
    }
    throw error;
  }
}


