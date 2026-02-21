/**
 * Main Tracker Class for Owlin Tracker
 */

import { EventSender } from './utils/sender.js';
import { ClickCollector } from './collectors/click.js';
import { InputCollector } from './collectors/input.js';
import { NavigationCollector } from './collectors/navigation.js';
import { ApiCollector } from './collectors/api.js';
import { ErrorCollector } from './collectors/error.js';

export class OwlinTracker {
  constructor(config = {}) {
    this.config = {
      endpoint: config.endpoint || '/api/events',
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 5000,
      autoStart: config.autoStart !== false,
      debug: config.debug || false,
      userId: config.userId || null,
      sessionId: config.sessionId || this.generateSessionId(),
      appName: config.appName || '',
      appVersion: config.appVersion || '',
      environment: config.environment || 'production',
      ...config,
    };

    // Initialize sender
    this.sender = new EventSender({
      endpoint: this.config.endpoint,
      batchSize: this.config.batchSize,
      flushInterval: this.config.flushInterval,
    });

    // Initialize collectors
    this.collectors = {
      click: new ClickCollector(this),
      input: new InputCollector(this),
      navigation: new NavigationCollector(this),
      api: new ApiCollector(this),
      error: new ErrorCollector(this),
    };

    // Session tracking
    this.sessionStart = Date.now();
    this.lastActivity = Date.now();

    // Auto-start if enabled
    if (this.config.autoStart) {
      this.start();
    }

    // Setup activity tracking
    this.setupActivityTracking();

    // Setup page visibility tracking
    this.setupVisibilityTracking();

    // Warn on beforeunload
    this.setupUnloadHandling();
  }

  /**
   * Start all collectors
   */
  start() {
    if (this.isRunning()) return;

    Object.values(this.collectors).forEach(collector => {
      // Skip API collector - only track clicks, not API calls
      if (collector === this.collectors.api) return;
      
      if (collector.start) collector.start();
    });

    this.log('Tracker started');
  }

  /**
   * Stop all collectors
   */
  stop() {
    Object.values(this.collectors).forEach(collector => {
      if (collector.stop) collector.stop();
    });

    this.log('Tracker stopped');
  }

  /**
   * Check if tracker is running
   */
  isRunning() {
    return this._running;
  }

  /**
   * Track an event
   */
  track(event, useBeacon = false) {
    // Update activity timestamp
    this.lastActivity = Date.now();

    // Enrich event with common context
    const enrichedEvent = {
      ...event,
      sessionId: this.config.sessionId,
      userId: this.config.userId,
      app: {
        name: this.config.appName,
        version: this.config.appVersion,
        environment: this.config.environment,
      },
      session: {
        duration: Date.now() - this.sessionStart,
        idleTime: Date.now() - this.lastActivity,
      },
      page: event.page || {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: event.timestamp || Date.now(),
    };

    // Add screen info if not present
    if (!enrichedEvent.screen) {
      enrichedEvent.screen = {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
      };
    }

    // Log in debug mode
    this.log('Event tracked:', enrichedEvent);

    // Send via beacon if requested (for page unload)
    if (useBeacon) {
      this.sender.sendBeacon(enrichedEvent);
    } else {
      this.sender.add(enrichedEvent);
    }
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName, properties = {}) {
    this.track({
      type: 'custom',
      event: eventName,
      properties,
    });
  }

  /**
   * Set user ID
   */
  setUserId(userId) {
    this.config.userId = userId;
    this.track({
      type: 'user_identify',
      userId,
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties) {
    this.track({
      type: 'user_properties',
      properties,
    });
  }

  /**
   * Track a session start
   */
  trackSessionStart() {
    this.sessionStart = Date.now();
    this.config.sessionId = this.generateSessionId();

    this.track({
      type: 'session_start',
      sessionId: this.config.sessionId,
    });
  }

  /**
   * Track a session end
   */
  trackSessionEnd() {
    this.track({
      type: 'session_end',
      sessionId: this.config.sessionId,
      duration: Date.now() - this.sessionStart,
    }, true);
  }

  /**
   * Flush pending events
   */
  async flush() {
    return this.sender.flush();
  }

  /**
   * Enable a specific collector
   */
  enableCollector(name) {
    if (this.collectors[name]) {
      if (this.collectors[name].enable) {
        this.collectors[name].enable();
      }
      this.log(`Collector "${name}" enabled`);
    }
  }

  /**
   * Disable a specific collector
   */
  disableCollector(name) {
    if (this.collectors[name]) {
      if (this.collectors[name].disable) {
        this.collectors[name].disable();
      }
      this.log(`Collector "${name}" disabled`);
    }
  }

  /**
   * Generate a random session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup activity tracking
   */
  setupActivityTracking() {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    this._activityHandler = () => {
      this.lastActivity = Date.now();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, this._activityHandler, { passive: true });
    });
  }

  /**
   * Setup page visibility tracking
   */
  setupVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track({
          type: 'page_hide',
          duration: Date.now() - this.sessionStart,
        });
      } else {
        this.track({
          type: 'page_show',
          awayTime: Date.now() - this.lastActivity,
        });
      }
    });
  }

  /**
   * Setup beforeunload handling
   */
  setupUnloadHandling() {
    window.addEventListener('beforeunload', () => {
      // Flush events and track session end
      this.collectors.navigation.trackUnload();
      this.sender.flush();
    });

    // Also use pagehide for better mobile support
    window.addEventListener('pagehide', () => {
      this.collectors.navigation.trackUnload();
      this.trackSessionEnd();
    });
  }

  /**
   * Log message in debug mode
   */
  log(...args) {
    if (this.config.debug) {
      console.log('[Owlin Tracker]', ...args);
    }
  }

  /**
   * Destroy the tracker
   */
  destroy() {
    this.stop();

    // Remove activity listeners
    if (this._activityHandler) {
      const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      activityEvents.forEach(event => {
        document.removeEventListener(event, this._activityHandler);
      });
    }

    // Destroy sender
    this.sender.destroy();

    this.log('Tracker destroyed');
  }
}

/**
 * Global tracker instance
 */
let globalTracker = null;

/**
 * Initialize the global tracker
 */
export function init(config) {
  if (globalTracker) {
    console.warn('[Owlin Tracker] Tracker already initialized. Call destroy() first to reinitialize.');
    return globalTracker;
  }

  globalTracker = new OwlinTracker(config);
  return globalTracker;
}

/**
 * Get the global tracker instance
 */
export function getTracker() {
  if (!globalTracker) {
    throw new Error('[Owlin Tracker] Tracker not initialized. Call init() first.');
  }
  return globalTracker;
}

/**
 * Destroy the global tracker
 */
export function destroy() {
  if (globalTracker) {
    globalTracker.destroy();
    globalTracker = null;
  }
}
