import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeSessionGetItem,
  safeSessionSetItem,
  safeSessionRemoveItem,
  safeSessionClear,
} from './safeStorage';
import logger from './logger';

export const AUTH_STORAGE_KEY = 'app_user';

// SECURITY: Only these fields are persisted to sessionStorage. Crucially,
// `_roleVerified` is intentionally excluded — it is an in-memory-only flag
// set by AuthContext to indicate the role was confirmed by the server. This
// prevents an attacker from injecting `_roleVerified: true` into
// sessionStorage to bypass the permission verification check.
const STORED_USER_FIELDS = [
  'id',
  'name',
  'role',
  'email',
  'picture',
  'code',
  'employeeId',
  'schoolId',
];

function dispatchAuthEvent(eventName) {
  window.dispatchEvent(new Event(eventName));
}

function parseJSON(raw, removeKey) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    removeKey();
    return null;
  }
}

function sanitizeStoredUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const sanitizedUser = {};

  STORED_USER_FIELDS.forEach((field) => {
    if (user[field] !== undefined && user[field] !== null && user[field] !== '') {
      sanitizedUser[field] = user[field];
    }
  });

  return sanitizedUser.id ? sanitizedUser : null;
}

function getRawStoredUser() {
  const sessionUser = parseJSON(
    safeSessionGetItem(AUTH_STORAGE_KEY),
    () => safeSessionRemoveItem(AUTH_STORAGE_KEY),
  );
  if (sessionUser) return sessionUser;

  const legacyLocalUser = parseJSON(
    safeGetItem(AUTH_STORAGE_KEY),
    () => safeRemoveItem(AUTH_STORAGE_KEY),
  );
  if (legacyLocalUser) {
    safeRemoveItem(AUTH_STORAGE_KEY);
    return legacyLocalUser;
  }

  return null;
}

export function getStoredUser() {
  return sanitizeStoredUser(getRawStoredUser());
}

export function getStoredAuthToken() {
  // Tokens are now stored in httpOnly cookies (not accessible to JS).
  // This function is kept for API compatibility but always returns null.
  return null;
}

export function getAuthHeaders(headers = {}) {
  // Auth is now handled by httpOnly cookies sent automatically with
  // credentials: 'include'. No Authorization header needed.

  // Guard: if there is no stored user the session has definitely been cleared
  // on the client side. Warn in development so callers can detect this early
  // rather than silently proceeding to a 401 from the server.
  if (process.env.NODE_ENV !== 'production' && !getStoredUser()) {
    logger.warn(
      '[authSession] getAuthHeaders() called with no active session. ' +
      'The request will likely return 401. Ensure the caller handles 401 responses ' +
      'by calling clearStoredUser() to trigger the auth redirect.'
    );
  }

  const nextHeaders = { ...headers };

  // Clean up any stale/invalid Authorization headers
  if (typeof nextHeaders.Authorization === 'string' && /^Bearer(?:\s+(?:null|undefined))?\s*$/i.test(nextHeaders.Authorization)) {
    delete nextHeaders.Authorization;
  }

  return nextHeaders;
}

export function saveStoredUser(user) {
  const sanitizedUser = sanitizeStoredUser(user);

  if (!sanitizedUser) {
    clearStoredUser();
    return;
  }

  // Never store tokens in sessionStorage — they live in httpOnly cookies only.
  const serializedUser = JSON.stringify(sanitizedUser);

  // Try sessionStorage first; fall back to localStorage if blocked.
  safeSessionSetItem(AUTH_STORAGE_KEY, serializedUser);
  if (safeSessionGetItem(AUTH_STORAGE_KEY) === serializedUser) {
    safeRemoveItem(AUTH_STORAGE_KEY);
  } else {
    // sessionStorage unavailable — retry after clearing stale data.
    safeSessionClear();
    safeSessionSetItem(AUTH_STORAGE_KEY, serializedUser);

    // If still not written, fall back to localStorage.
    if (safeSessionGetItem(AUTH_STORAGE_KEY) !== serializedUser) {
      safeSetItem(AUTH_STORAGE_KEY, serializedUser);
    }
  }

  dispatchAuthEvent('user-logged-in');
}

export function clearStoredUser() {
  safeSessionRemoveItem(AUTH_STORAGE_KEY);
  safeRemoveItem(AUTH_STORAGE_KEY);
  dispatchAuthEvent('auth-session-cleared');
}
