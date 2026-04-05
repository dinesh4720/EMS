import { safeGetItem, safeSetItem } from '../utils/safeStorage';
import { useEffect, useRef } from 'react'
import { init as initOwlinTracker, destroy as destroyOwlinTracker } from '@owlin/tracker-sdk'
import { useAuth } from '../context/AuthContext'

// Module-scoped tracker instance (not exposed on window)
let _trackerInstance = null

const OWLIN_ENABLED_KEY = 'owlinTrackerEnabled'
const OWLIN_ENDPOINT = import.meta.env.VITE_OWLIN_ENDPOINT?.trim() || ''
const OWLIN_API_KEY = import.meta.env.VITE_OWLIN_API_KEY?.trim() || ''
const OWLIN_API_BASE = OWLIN_ENDPOINT.replace(/\/api\/v1\/events\/batch\/?$/, '').replace(/\/api\/events\/?$/, '')
const IS_OWLIN_CONFIGURED = Boolean(OWLIN_ENDPOINT)

export function isOwlinEnabled() {
  if (!IS_OWLIN_CONFIGURED) {
    return false
  }

  const stored = safeGetItem(OWLIN_ENABLED_KEY)
  return stored === null ? true : stored === 'true'
}

export function setOwlinEnabled(enabled) {
  safeSetItem(OWLIN_ENABLED_KEY, String(enabled))
  if (!enabled) {
    destroyTracker()
  }
}

function destroyTracker() {
  if (_trackerInstance) {
    destroyOwlinTracker()
    _trackerInstance = null
  }
}

export function useOwlinTracking() {
  const { user } = useAuth()
  const initializedRef = useRef(false)
  const userIdRef = useRef(null)

  useEffect(() => {
    if (!isOwlinEnabled()) return

    if (initializedRef.current) return
    initializedRef.current = true

    try {
      const tracker = initOwlinTracker({
        endpoint: OWLIN_ENDPOINT,
        apiKey: OWLIN_API_KEY,
        appName: 'School Dashboard',
        appVersion: '2.0.0',
        debug: false,
        batchSize: 5,
        flushInterval: 1000,
      })

      _trackerInstance = tracker

      tracker.track({
        type: 'pageview',
        page: window.location.pathname,
      })
    } catch (error) {
      console.warn('[Owlin] Tracker init failed:', error)
    }

    return () => {
      destroyTracker()
      initializedRef.current = false
      userIdRef.current = null
    }
  }, [])

  useEffect(() => {
    const checkAndSetUser = async () => {
      const tracker = _trackerInstance

      if (user && tracker && user.id !== userIdRef.current) {
        userIdRef.current = user.id

        try {
          const userRole = user.role || 'User'
          const schoolId = user.schoolId || ''

          tracker.setUserId(user.id)
          tracker.setUserProperties({
            role: userRole,
            schoolId,
          })

          // Register the user immediately so server-side event enrichment has metadata
          // before the next queued batch flushes.
          // NOTE: Only send non-PII data (role, schoolId). Never send name or email.
          const owlinHeaders = { 'Content-Type': 'application/json' }
          if (OWLIN_API_KEY) owlinHeaders['X-API-Key'] = OWLIN_API_KEY

          try {
            await fetch(`${OWLIN_API_BASE}/api/v1/users/identify`, {
              method: 'POST',
              headers: owlinHeaders,
              body: JSON.stringify({
                userId: user.id,
                metadata: { role: userRole, schoolId },
              }),
            })
          } catch (err) {
            console.warn('[Owlin] User identify failed (non-fatal):', err)
          }

          try {
            await fetch(`${OWLIN_API_BASE}/api/v1/sessions/start`, {
              method: 'POST',
              headers: owlinHeaders,
              body: JSON.stringify({
                userId: user.id,
                metadata: {
                  role: userRole,
                  schoolId,
                },
              }),
            })
          } catch (err) {
            console.warn('[Owlin] Session start failed (non-fatal):', err)
          }
        } catch (err) {
          console.warn('[Owlin] User setup failed:', err)
        }
      }
    }

    checkAndSetUser()
    const timeout = setTimeout(checkAndSetUser, 1000)

    return () => clearTimeout(timeout)
  }, [user])

  return _trackerInstance
}

export function trackEvent(eventName, properties = {}) {
  if (!isOwlinEnabled()) return

  const tracker = _trackerInstance
  if (tracker) {
    tracker.trackEvent(eventName, properties)
  }
}

export function trackPageView(pageName, properties = {}) {
  if (!isOwlinEnabled()) return

  const tracker = _trackerInstance
  if (tracker) {
    tracker.track({
      type: 'pageview',
      page: pageName,
      ...properties,
    })
  }
}
