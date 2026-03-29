/**
 * Event Sender for Owlin Tracker
 * Handles batching and sending events to the endpoint
 */

export class EventSender {
  constructor(config = {}) {
    this.endpoint = config.endpoint || '/api/v1/events/batch';
    this.apiKey = config.apiKey || null;
    this.batchSize = config.batchSize || 10;
    this.flushInterval = config.flushInterval || 5000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.maxQueueSize = config.maxQueueSize || 100;
    this.pauseUntil = 0;

    this.queue = [];
    this.isSending = false;
    this.flushTimer = null;

    this.setupAutoFlush();
  }

  /**
   * Add an event to the queue
   */
  add(event) {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      queueTime: Date.now(),
    };

    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift();
    }

    this.queue.push(enrichedEvent);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Send all queued events
   */
  async flush() {
    if (this.isSending || this.queue.length === 0 || Date.now() < this.pauseUntil) {
      return;
    }

    this.isSending = true;
    const eventsToSend = [...this.queue];
    this.queue = [];

    try {
      await this.sendBatch(eventsToSend);
    } catch (error) {
      const retries = eventsToSend[0].retries !== undefined
        ? eventsToSend[0].retries + 1
        : 1;

      eventsToSend[0].retries = retries;

      // Retry logic
      if (retries < this.maxRetries) {
        this.queue.unshift(...eventsToSend);
        setTimeout(() => this.flush(), this.retryDelay * retries);
      } else {
        // Max retries reached, discard this batch and pause future sends briefly.
        this.pauseUntil = Date.now() + 30000;
        console.error('[Owlin Tracker] Failed to send events after max retries:', error);
      }
    } finally {
      this.isSending = false;
    }
  }

  /**
   * Send a batch of events to the endpoint
   */
  async sendBatch(events) {
    const payload = {
      events,
      sentAt: Date.now(),
      batchSize: events.length,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Tracker-Version': '2.0.0',
      };
      if (this.apiKey) headers['X-API-Key'] = this.apiKey;

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Don't use fetch for sendBeacon fallback (it's already a fetch call)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  /**
   * Send event using navigator.sendBeacon (for unload events)
   */
  sendBeacon(event) {
    const payload = JSON.stringify({
      events: [event],
      sentAt: Date.now(),
      batchSize: 1,
    });

    // Try sendBeacon first
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      return navigator.sendBeacon(this.endpoint, blob);
    }

    // Fallback to sync XHR
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this.endpoint, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payload);
      return true;
    } catch (error) {
      console.error('[Owlin Tracker] Beacon send failed:', error);
      return false;
    }
  }

  /**
   * Setup auto-flush interval
   */
  setupAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  /**
   * Stop auto-flush
   */
  stopAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get queue size
   */
  getQueueSize() {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
  }

  /**
   * Destroy the sender
   */
  destroy() {
    this.stopAutoFlush();
    this.flush();
  }
}

/**
 * Create a singleton sender instance
 */
let defaultSender = null;

export function getSender(config) {
  if (!defaultSender) {
    defaultSender = new EventSender(config);
  }
  return defaultSender;
}

export function resetSender() {
  if (defaultSender) {
    defaultSender.destroy();
    defaultSender = null;
  }
}
