/**
 * Environment variable validation for the school-dashboard frontend.
 *
 * Required variables are validated at module-evaluation time so a missing or
 * placeholder value fails fast before React mounts. In development the validator
 * is intentionally permissive — the dev server can run without a production env.
 */

// Placeholder pattern written into .env.production — must never reach a real build.
const PLACEHOLDER_PATTERN = /your-backend-app|example\.com|changeme/i;

export const REQUIRED_VARS = ['VITE_API_URL'];
export const OPTIONAL_URL_VARS = ['VITE_SOCKET_URL'];

/**
 * Validate frontend environment variables.
 *
 * @param {Record<string, string|boolean|undefined>} [env=import.meta.env]
 * @throws {Error} When a required variable is missing or still a placeholder in non-dev mode.
 */
export function validateEnvironment(env = import.meta.env) {
  const isDev = env.DEV ?? false;
  if (isDev) return;

  for (const key of REQUIRED_VARS) {
    const value = env[key];
    if (!value || typeof value !== 'string' || !value.trim()) {
      throw new Error(
        `Missing required environment variable: ${key}. ` +
          `Add it to your deployment environment variables before building.`
      );
    }

    const trimmed = value.trim();
    if (PLACEHOLDER_PATTERN.test(trimmed)) {
      throw new Error(
        `${key} is still set to the placeholder value "${trimmed}". ` +
          `Set it to your real backend URL in your CI/CD or hosting environment.`
      );
    }
  }

  for (const key of OPTIONAL_URL_VARS) {
    const value = env[key];
    if (value && typeof value === 'string' && PLACEHOLDER_PATTERN.test(value.trim())) {
      throw new Error(
        `${key} is still set to the placeholder value "${value.trim()}". ` +
          `Set it to your real socket server URL or remove it to auto-derive from VITE_API_URL.`
      );
    }
  }
}

validateEnvironment();

/**
 * Typed, validated environment object. Access values through this object in
 * application code instead of reading import.meta.env directly.
 */
export const env = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
  VITE_CURRENT_ACADEMIC_YEAR: import.meta.env.VITE_CURRENT_ACADEMIC_YEAR,
  VITE_OWLIN_ENDPOINT: import.meta.env.VITE_OWLIN_ENDPOINT,
};
