import { Sentry } from './sentry'
import logger from '../utils/logger'

/**
 * Install window-level handlers for unhandled promise rejections and
 * uncaught runtime errors.  Sentry's browser SDK already captures these
 * in production, but:
 *   - Sentry is disabled in dev (`enabled: import.meta.env.PROD`), so
 *     rejections vanish silently during development.
 *   - An explicit handler gives us a single place to add future
 *     behaviour (e.g. user-facing toast, telemetry, etc.).
 */
let installed = false

export function initGlobalErrorHandlers() {
  if (installed) return
  installed = true

  // --- Unhandled promise rejections --------------------------------
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    logger.error('[Unhandled Promise Rejection]', error)

    // Forward to Sentry when available (production)
    if (Sentry?.captureException) {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
        tags: { mechanism: 'unhandledrejection' },
      })
    }
  })

  // --- Uncaught synchronous errors (outside React tree) ------------
  window.addEventListener('error', (event) => {
    // Ignore errors from cross-origin scripts (no useful info)
    if (event.message === 'Script error.' && !event.filename) return

    logger.error('[Uncaught Error]', event.error || event.message)

    if (Sentry?.captureException && event.error) {
      Sentry.captureException(event.error, {
        tags: { mechanism: 'onerror' },
      })
    }
  })
}
