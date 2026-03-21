/**
 * Safe localStorage wrappers that handle private browsing,
 * disabled storage, quota errors, and other exceptions.
 */

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
