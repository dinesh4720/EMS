import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    // Only send events in production to avoid noise during development
    enabled: import.meta.env.PROD,
    // Capture 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Capture replays on 1% of errors
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.01,
  })
}

/**
 * The current app version, sourced from VITE_APP_VERSION (set in .env / CI).
 * Consumed by Sentry `release` and can be displayed in the UI for support.
 */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'unknown'

export { Sentry }
