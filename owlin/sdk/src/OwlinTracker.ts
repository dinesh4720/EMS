// Owlin Tracking SDK - Core Tracker Class

import { OwlinConfig, OwlinEvent, QueuedEvent, OwlinSession } from './types'

export class OwlinTracker {
  private config: Required<OwlinConfig>
  private sessionId: string
  private eventQueue: QueuedEvent[] = []
  private isInitialized = false
  private flushTimer?: ReturnType<typeof setInterval>

  constructor(config: OwlinConfig) {
    this.config = {
      apiKey: config.apiKey,
      apiUrl: config.apiUrl || 'http://localhost:3002/api',
      wsUrl: config.wsUrl || 'http://localhost:3002',
      autoTrack: config.autoTrack ?? true,
      debug: config.debug ?? false,
      samplingRate: config.samplingRate ?? 1,
      flushInterval: config.flushInterval ?? 5000,
      batchSize: config.batchSize ?? 10,
      userId: config.userId || this.generateId(),
      userName: config.userName || 'Anonymous',
      userRole: config.userRole || 'user',
    }
    this.sessionId = this.generateId()
  }

  private generateId(): string {
    return `owlin_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  private log(...args: unknown[]) {
    if (this.config.debug) {
      console.log('[Owlin]', ...args)
    }
  }

  init(): void {
    if (this.isInitialized) {
      this.log('Already initialized')
      return
    }

    this.log('Initializing Owlin Tracker')
    this.isInitialized = true

    // Set up auto-tracking
    if (this.config.autoTrack) {
      this.setupAutoTracking()
    }

    // Set up flush interval
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)

    // Track session start
    this.track('session_start', {
      page: window.location.pathname,
      data: { userId: this.config.userId },
    })

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush()
    })
  }

  track(type: string, event: Partial<OwlinEvent>): void {
    if (!this.shouldTrack()) return

    const queuedEvent: QueuedEvent = {
      type: type as any,
      elementType: event.elementType,
      elementId: event.elementId,
      elementText: event.elementText,
      page: event.page || window.location.pathname,
      action: event.action || type,
      data: event.data,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.config.userId,
    }

    this.eventQueue.push(queuedEvent)
    this.log('Event tracked:', queuedEvent)

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush()
    }
  }

  private shouldTrack(): boolean {
    return Math.random() < this.config.samplingRate
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const eventsToSend = [...this.eventQueue]
    this.eventQueue = []

    this.log(`Flushing ${eventsToSend.length} events`)

    try {
      const response = await fetch(`${this.config.apiUrl}/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify({
          events: eventsToSend,
          sessionId: this.sessionId,
          userId: this.config.userId,
          userName: this.config.userName,
          userRole: this.config.userRole,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      this.log('Events flushed successfully')
    } catch (error) {
      this.log('Failed to flush events:', error)
      // Re-queue events on failure
      this.eventQueue = [...eventsToSend, ...this.eventQueue]
    }
  }

  private setupAutoTracking(): void {
    // Track clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      this.track('click', {
        elementType: target.tagName.toLowerCase(),
        elementId: target.id,
        elementText: target.textContent?.substring(0, 100),
        page: window.location.pathname,
        action: 'click',
      })
    }, true)

    // Track navigation
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function (...args) {
      originalPushState.apply(this, args)
      window.dispatchEvent(new Event('popstate'))
      window.dispatchEvent(new Event('locationchange'))
    }

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args)
      window.dispatchEvent(new Event('popstate'))
      window.dispatchEvent(new Event('locationchange'))
    }

    window.addEventListener('popstate', () => {
      window.dispatchEvent(new Event('locationchange'))
    })

    window.addEventListener('locationchange', () => {
      this.track('navigation', {
        page: window.location.pathname,
        action: 'navigate',
      })
    })

    // Track form submissions
    document.addEventListener('submit', (e) => {
      const target = e.target as HTMLFormElement
      this.track('form_submit', {
        elementType: 'form',
        elementId: target.id,
        page: window.location.pathname,
        action: 'submit',
        data: {
          formId: target.id,
          formAction: target.action,
        },
      })
    }, true)

    // Track errors
    window.addEventListener('error', (e) => {
      this.track('error', {
        elementType: 'window',
        page: window.location.pathname,
        action: 'error',
        data: {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
        },
      })
    })
  }

  identify(userId: string, userName?: string, userRole?: string): void {
    this.config.userId = userId
    if (userName) this.config.userName = userName
    if (userRole) this.config.userRole = userRole

    this.track('user_identify', {
      page: window.location.pathname,
      action: 'identify',
      data: { userId, userName, userRole },
    })
  }

  reset(): void {
    this.sessionId = this.generateId()
    this.eventQueue = []
    this.log('Session reset')
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flush()
    this.isInitialized = false
    this.log('Tracker destroyed')
  }
}

// Global instance
let globalTracker: OwlinTracker | null = null

export function initOwlin(config: OwlinConfig): OwlinTracker {
  if (!globalTracker) {
    globalTracker = new OwlinTracker(config)
    globalTracker.init()
  }
  return globalTracker
}

export function getOwlin(): OwlinTracker | null {
  return globalTracker
}
