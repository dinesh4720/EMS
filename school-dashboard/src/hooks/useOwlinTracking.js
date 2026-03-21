import { useEffect, useRef } from 'react'
import { init as initOwlinTracker, destroy as destroyOwlinTracker } from '@owlin/tracker-sdk'
import { useAuth } from '../context/AuthContext'

if (typeof window !== 'undefined' && !window.__OWLIN_TRACKER__) {
  window.__OWLIN_TRACKER__ = null
}

const OWLIN_ENABLED_KEY = 'owlinTrackerEnabled'
const OWLIN_ENDPOINT = import.meta.env.VITE_OWLIN_ENDPOINT?.trim() || ''
const OWLIN_API_BASE = OWLIN_ENDPOINT.replace(/\/api\/events\/?$/, '')
const IS_OWLIN_CONFIGURED = Boolean(OWLIN_ENDPOINT)

export function isOwlinEnabled() {
  if (!IS_OWLIN_CONFIGURED) {
    return false
  }

  const stored = localStorage.getItem(OWLIN_ENABLED_KEY)
  return stored === null ? true : stored === 'true'
}

export function setOwlinEnabled(enabled) {
  localStorage.setItem(OWLIN_ENABLED_KEY, String(enabled))
  if (!enabled) {
    destroyTracker()
  }
}

function destroyTracker() {
  if (window.__OWLIN_TRACKER__) {
    destroyOwlinTracker()
    window.__OWLIN_TRACKER__ = null
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
        appName: 'School Dashboard',
        appVersion: '1.0.0',
        debug: false,
        batchSize: 5,
        flushInterval: 1000,
      })

      window.__OWLIN_TRACKER__ = tracker

      tracker.track({
        type: 'pageview',
        page: window.location.pathname,
      })
    } catch (error) {
      // ignored
    }
  }, [])

  useEffect(() => {
    const checkAndSetUser = async () => {
      const tracker = window.__OWLIN_TRACKER__

      if (user && tracker && user.id !== userIdRef.current) {
        userIdRef.current = user.id

        try {
          const userName = user.name || user.username || 'Unknown User'
          const userEmail = user.email || ''
          const userRole = user.role || 'User'

          tracker.setUserId(user.id)
          tracker.setUserProperties({
            name: userName,
            email: userEmail,
            role: userRole,
          })

          // Register the user immediately so server-side event enrichment has metadata
          // before the next queued batch flushes.
          try {
            await fetch(`${OWLIN_API_BASE}/api/users/identify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                metadata: { name: userName, email: userEmail, role: userRole },
              }),
            })
          } catch (err) {
            // Non-fatal: metadata will still arrive with the next event batch.
          }

          try {
            await fetch(`${OWLIN_API_BASE}/api/session/start`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                metadata: {
                  name: userName,
                  email: userEmail,
                  role: userRole,
                },
              }),
            })
          } catch (err) {
            // ignored
          }
        } catch (err) {
          // ignored
        }
      }
    }

    checkAndSetUser()
    const timeout = setTimeout(checkAndSetUser, 1000)

    return () => clearTimeout(timeout)
  }, [user])

  return window.__OWLIN_TRACKER__
}

export function trackEvent(eventName, properties = {}) {
  if (!isOwlinEnabled()) return

  const tracker = window.__OWLIN_TRACKER__
  if (tracker) {
    tracker.trackEvent(eventName, properties)
  }
}

export function trackPageView(pageName, properties = {}) {
  if (!isOwlinEnabled()) return

  const tracker = window.__OWLIN_TRACKER__
  if (tracker) {
    tracker.track({
      type: 'pageview',
      page: pageName,
      ...properties,
    })
  }
}
