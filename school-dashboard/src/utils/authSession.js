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
  const sessionUser = parseStoredUser(sessionStorage);
  if (sessionUser) {
    return sessionUser;
  }

  const legacyLocalUser = parseStoredUser(localStorage);
  if (legacyLocalUser) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return legacyLocalUser;
  }

  return null;
}

export function getStoredUser() {
  return sanitizeStoredUser(getRawStoredUser());
}

export function getStoredAuthToken() {
  const storedUser = getRawStoredUser();
  return storedUser?.token || null;
}

export function getAuthHeaders(headers = {}) {
  const nextHeaders = { ...headers };
  const token = getStoredAuthToken();

  if (token) {
    nextHeaders.Authorization = `Bearer ${token}`;
  } else if (typeof nextHeaders.Authorization === 'string' && /^Bearer(?:\s+(?:null|undefined))?\s*$/i.test(nextHeaders.Authorization)) {
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

  const storedUser = user?.token
    ? { ...sanitizedUser, token: user.token }
    : sanitizedUser;

  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedUser));
  localStorage.removeItem(AUTH_STORAGE_KEY);
  dispatchAuthEvent('user-logged-in');
}

export function clearStoredUser() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
  dispatchAuthEvent('auth-session-cleared');
}
