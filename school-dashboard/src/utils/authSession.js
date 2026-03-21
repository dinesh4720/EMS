export const AUTH_STORAGE_KEY = 'app_user';
const STORED_USER_FIELDS = [
  'id',
  'name',
  'role',
  'email',
  'picture',
  'code',
  'employeeId',
];

function dispatchAuthEvent(eventName) {
  window.dispatchEvent(new Event(eventName));
}

function getSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseStoredUser(storage) {
  const storedUser = storage.getItem(AUTH_STORAGE_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    storage.removeItem(AUTH_STORAGE_KEY);
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
  const sessionStorageRef = getSessionStorage();
  const localStorageRef = getLocalStorage();

  const sessionUser = sessionStorageRef ? parseStoredUser(sessionStorageRef) : null;
  if (sessionUser) {
    return sessionUser;
  }

  const legacyLocalUser = localStorageRef ? parseStoredUser(localStorageRef) : null;
  if (legacyLocalUser) {
    localStorageRef?.removeItem(AUTH_STORAGE_KEY);
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
  const sessionStorageRef = getSessionStorage();
  const localStorageRef = getLocalStorage();

  if (sessionStorageRef) {
    sessionStorageRef.setItem(AUTH_STORAGE_KEY, serializedUser);
    localStorageRef?.removeItem(AUTH_STORAGE_KEY);
  } else if (localStorageRef) {
    // Fallback for browsers that block sessionStorage in this context.
    localStorageRef.setItem(AUTH_STORAGE_KEY, serializedUser);
  }
  dispatchAuthEvent('user-logged-in');
}

export function clearStoredUser() {
  getSessionStorage()?.removeItem(AUTH_STORAGE_KEY);
  getLocalStorage()?.removeItem(AUTH_STORAGE_KEY);
  dispatchAuthEvent('auth-session-cleared');
}
