/**
 * Centralized API configuration.
 * All API and socket URLs must be imported from here — never hardcoded inline.
 *
 * NOTE: This module intentionally does NOT throw at module-evaluation time.
 * Throwing during ES module evaluation causes a blank white screen because
 * React hasn't mounted yet and no error boundary can catch it.
 * Instead, CONFIG_ERROR is exported and checked in main.jsx before React mounts,
 * which renders a user-friendly error page via plain DOM when invalid.
 */

// Placeholder pattern written into .env.production — must never reach a real build
const PLACEHOLDER_PATTERN = /your-backend-app|example\.com|changeme/i;

const resolveApiUrl = () => {
  const raw = import.meta.env.VITE_API_URL;
  if (raw && typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:3002/api';
  }
  return null; // missing in production — CONFIG_ERROR will be set
};

export const API_URL = resolveApiUrl();

// CONFIG_ERROR is non-null when the env config is invalid.
// Checked in main.jsx before React mounts so we can show a friendly error page.
export const CONFIG_ERROR = (() => {
  if (import.meta.env.DEV) return null;
  if (!API_URL) {
    return 'VITE_API_URL is not set. Add it to your deployment environment variables before building.';
  }
  if (PLACEHOLDER_PATTERN.test(API_URL)) {
    return (
      `VITE_API_URL is still set to the placeholder value "${API_URL}". ` +
      'Set it to your real backend URL in your CI/CD or hosting environment variables.'
    );
  }
  const socketRaw = import.meta.env.VITE_SOCKET_URL;
  if (socketRaw && PLACEHOLDER_PATTERN.test(socketRaw)) {
    return (
      `VITE_SOCKET_URL is still set to the placeholder value "${socketRaw}". ` +
      'Set it to your real socket server URL or remove it to auto-derive from VITE_API_URL.'
    );
  }
  return null;
})();

// Derive socket URL from API_URL by stripping the /api suffix, unless explicitly overridden.
// Override via VITE_SOCKET_URL when API and socket servers run on different domains.
const resolveSocketUrl = () => {
  const raw = import.meta.env.VITE_SOCKET_URL;
  if (raw && typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  if (!API_URL) return null; // CONFIG_ERROR will be set; app won't mount
  return API_URL.replace(/\/api\/?$/, '');
};

export const SOCKET_URL = resolveSocketUrl();
