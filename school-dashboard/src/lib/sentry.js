/**
 * Sentry SDK stub.
 *
 * Sentry is initialised lazily so the heavy SDK bundle is not loaded on every
 * page.  If you want to enable Sentry, install `@sentry/react` and replace
 * the stub below with the real initialisation call.
 *
 * Usage (after installing the SDK):
 *
 *   import * as SentrySDK from '@sentry/react';
 *
 *   SentrySDK.init({
 *     dsn: import.meta.env.VITE_SENTRY_DSN,
 *     release: import.meta.env.VITE_APP_VERSION,
 *     environment: import.meta.env.MODE,
 *     enabled: import.meta.env.PROD,
 *   });
 *
 *   export const Sentry = SentrySDK;
 */

// Stub — replace with the real SDK when Sentry is ready
export const Sentry = null;

/**
 * The current app version, sourced from VITE_APP_VERSION (set in .env / CI).
 * Consumed by Sentry `release` and can be displayed in the UI for support.
 */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'unknown';
