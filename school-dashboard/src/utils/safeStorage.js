/**
 * Safe storage wrappers that handle private browsing,
 * disabled storage, quota errors, and other exceptions.
 */

// --- localStorage wrappers ---

export function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Quota exceeded or storage disabled (e.g. private browsing)
  }
}

export function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage disabled
  }
}

// --- sessionStorage wrappers ---

export function safeSessionGetItem(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionSetItem(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Quota exceeded or storage disabled (e.g. private browsing)
  }
}

export function safeSessionRemoveItem(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Storage disabled
  }
}

export function safeSessionClear() {
  try {
    sessionStorage.clear();
  } catch {
    // Storage disabled
  }
}
