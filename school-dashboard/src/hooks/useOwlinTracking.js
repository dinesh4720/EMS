import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

// Store tracker globally for easy access
window.__OWLIN_TRACKER__ = null

const OWLIN_ENABLED_KEY = 'owlinTrackerEnabled'

/**
 * Check if Owlin tracker is enabled (defaults to true)
 */
export function isOwlinEnabled() {
  const stored = localStorage.getItem(OWLIN_ENABLED_KEY)
  // Default to true if never set
  return stored === null ? true : stored === 'true'
}

/**
 * Set Owlin tracker enabled/disabled and apply immediately
 */
export function setOwlinEnabled(enabled) {
  localStorage.setItem(OWLIN_ENABLED_KEY, String(enabled))
  if (!enabled) {
    destroyTracker()
  }
}

/**
 * Destroy the active tracker and remove the script
 */
function destroyTracker() {
  const tracker = window.__OWLIN_TRACKER__
  if (tracker) {
    if (typeof tracker.destroy === 'function') {
      tracker.destroy()
    }
    window.__OWLIN_TRACKER__ = null
  }
  // Remove the script tag so it doesn't keep running
  const existingScript = document.querySelector('script[src="/owlin-tracker.js"]')
  if (existingScript) {
    existingScript.remove()
  }
}

/**
 * Hook to integrate Owlin tracking with the school-dashboard
 * Tracks all user interactions: clicks, inputs, navigation, API calls, errors
 */
export function useOwlinTracking() {
  const { user } = useAuth()
  const initializedRef = useRef(false)
  const userIdRef = useRef(null)

  useEffect(() => {
    // Skip if disabled via settings
    if (!isOwlinEnabled()) return

    // Only initialize once
    if (initializedRef.current) return
    initializedRef.current = true

    // Check if OwlinTracker is already loaded
    if (window.OwlinTracker && window.OwlinTracker.init) {
      initTracker()
      return
    }

    // Load the SDK script
    const script = document.createElement('script')
    script.src = '/owlin-tracker.js'
    script.async = true
    script.onload = () => {
      initTracker()
    }
    script.onerror = (err) => {
    }
    document.head.appendChild(script)

    function initTracker() {
      try {
        if (!window.OwlinTracker || !window.OwlinTracker.init) {
          return
        }

        const config = {
          endpoint: 'http://localhost:4001/api/events',
          appName: 'School Dashboard',
          appVersion: '1.0.0',
          debug: true,
          batchSize: 5,      // flush immediately after 5 events
          flushInterval: 1000, // safety-net interval (EventSender uses 1s internally)
        }

        const tracker = window.OwlinTracker.init(config)
        window.__OWLIN_TRACKER__ = tracker

        // Track initial page load
        tracker.track({
          type: 'pageview',
          page: window.location.pathname,
        })
      } catch (error) {
      }
    }
  }, [])

  // Update user ID when user changes
  useEffect(() => {
    // Wait for tracker to be ready
    const checkAndSetUser = async () => {
      const tracker = window.__OWLIN_TRACKER__

      if (user && tracker && user.id !== userIdRef.current) {
        userIdRef.current = user.id
        try {
          // IMPORTANT: Use user.id as the userId, but ensure name/email/role are properly set
          const userName = user.name || user.username || 'Unknown User'
          const userEmail = user.email || ''
          const userRole = user.role || 'User'

          tracker.setUserId(user.id)
          tracker.setUserProperties({
            name: userName,
            email: userEmail,
            role: userRole,
          })

          // ── Immediately register user in the server store ──────────────────
          // This ensures the server can enrich events with the correct username
          // right away, without waiting for the next batch flush.
          try {
            await fetch('http://localhost:4001/api/users/identify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                metadata: { name: userName, email: userEmail, role: userRole },
              })
            })
          } catch (err) {
            // Non-fatal — server will still pick up metadata from the next event batch
          }

          // Start a session on the server with proper metadata
          try {
            await fetch('http://localhost:4001/api/session/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                metadata: {
                  name: userName,
                  email: userEmail,
                  role: userRole,
                }
              })
            })
          } catch (err) {
          }

        } catch (err) {
        }
      }
    }

    // Check immediately and then after a short delay
    checkAndSetUser()
    const timeout = setTimeout(checkAndSetUser, 1000)

    return () => clearTimeout(timeout)
  }, [user])

  return window.__OWLIN_TRACKER__
}

/**
 * Track a custom event
 */
export function trackEvent(eventName, properties = {}) {
  if (!isOwlinEnabled()) return
  const tracker = window.__OWLIN_TRACKER__
  if (tracker) {
    tracker.trackEvent(eventName, properties)
  }
}

/**
 * Track a page view manually
 */
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
