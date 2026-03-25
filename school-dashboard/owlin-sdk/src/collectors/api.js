/**
 * API Collector for Owlin Tracker
 * Intercepts and tracks all fetch/XHR requests
 */

export class ApiCollector {
  constructor(tracker) {
    this.tracker = tracker;
    this.originalFetch = window.fetch;
    this.originalXHR = window.XMLHttpRequest;
    this.isEnabled = true;
    this.requestMap = new Map();
  }

  /**
   * Start intercepting API calls
   */
  start() {
    this.interceptFetch();
    this.interceptXHR();
  }

  /**
   * Stop intercepting API calls
   */
  stop() {
    window.fetch = this.originalFetch;
    window.XMLHttpRequest = this.originalXHR;
  }

  /**
   * Intercept fetch API
   */
  interceptFetch() {
    const self = this;

    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input.url;
      const method = (init?.method || 'GET').toUpperCase();
      const requestId = self.generateRequestId();

      // Skip tracker's own requests
      if (self.shouldIgnoreRequest(url, init)) {
        return self.originalFetch.apply(this, arguments);
      }

      // Track request start
      const requestData = self.buildRequestData('fetch', url, method, init);
      requestData.requestId = requestId;
      self.tracker.track({ ...requestData, phase: 'start' });
      self.requestMap.set(requestId, { startTime: Date.now(), url, method });

      return self.originalFetch
        .apply(this, arguments)
        .then(response => {
          const duration = Date.now() - self.requestMap.get(requestId)?.startTime;
          self.requestMap.delete(requestId);

          // Clone response to read body without consuming it
          const clonedResponse = response.clone();

          self.tracker.track({
            ...requestData,
            phase: 'complete',
            status: response.status,
            statusText: response.statusText,
            headers: self.getResponseHeaders(response),
            duration,
          });

          return response;
        })
        .catch(error => {
          const duration = Date.now() - self.requestMap.get(requestId)?.startTime;
          self.requestMap.delete(requestId);

          self.tracker.track({
            ...requestData,
            phase: 'error',
            error: error.message,
            duration,
          });

          throw error;
        });
    };
  }

  /**
   * Intercept XMLHttpRequest
   */
  interceptXHR() {
    const self = this;
    const OriginalXHR = this.originalXHR;

    function TrackedXHR() {
      const xhr = new OriginalXHR();
      const requestId = self.generateRequestId();
      let requestData = null;
      let startTime = null;

      // Track request open
      const originalOpen = xhr.open;
      xhr.open = function(method, url) {
        if (self.shouldIgnoreRequest(url, {})) {
          return originalOpen.apply(this, arguments);
        }

        requestData = self.buildRequestData('xhr', url, method.toUpperCase(), {});
        requestData.requestId = requestId;
        startTime = Date.now();

        return originalOpen.apply(this, arguments);
      };

      // Track request send
      const originalSend = xhr.send;
      xhr.send = function(body) {
        if (requestData) {
          if (body) {
            try {
              requestData.body = self.sanitizeBody(body);
            } catch (e) {
              requestData.body = '[Unable to read body]';
            }
          }

          self.tracker.track({ ...requestData, phase: 'start' });
        }

        // Track response
        xhr.addEventListener('loadend', function() {
          if (requestData) {
            const duration = Date.now() - startTime;

            self.tracker.track({
              ...requestData,
              phase: 'complete',
              status: xhr.status,
              statusText: xhr.statusText,
              duration,
            });
          }
        });

        return originalSend.apply(this, arguments);
      };

      return xhr;
    }

    // Copy prototype
    TrackedXHR.prototype = OriginalXHR.prototype;
    TrackedXHR.prototype.constructor = TrackedXHR;

    window.XMLHttpRequest = TrackedXHR;
  }

  /**
   * Build request data object
   */
  buildRequestData(source, url, method, init) {
    const urlObj = new URL(url, window.location.origin);

    return {
      type: 'api',
      source,
      method,
      url: {
        full: url,
        origin: urlObj.origin,
        path: urlObj.pathname,
        search: urlObj.search,
        hash: urlObj.hash,
      },
      headers: this.sanitizeHeaders(init?.headers),
      body: init?.body ? this.sanitizeBody(init.body) : undefined,
      cache: init?.cache,
      credentials: init?.credentials,
      mode: init?.mode,
      redirect: init?.redirect,
      referrer: init?.referrer,
    };
  }

  /**
   * Get response headers from fetch response
   */
  getResponseHeaders(response) {
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  /**
   * Sanitize headers (remove sensitive data)
   */
  sanitizeHeaders(headers) {
    if (!headers) return {};

    const sanitized = {};

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        sanitized[key] = this.sanitizeHeader(key, value);
      });
    } else if (typeof headers === 'object') {
      for (const [key, value] of Object.entries(headers)) {
        sanitized[key] = this.sanitizeHeader(key, value);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize individual header value
   */
  sanitizeHeader(key, value) {
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token'];

    if (sensitiveHeaders.includes(key.toLowerCase())) {
      return '[REDACTED]';
    }

    return value;
  }

  /**
   * Sanitize request body
   */
  sanitizeBody(body) {
    if (!body) return body;

    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        return this.sanitizeJsonBody(parsed);
      } catch (e) {
        // Not JSON, truncate
        return body.substring(0, 100);
      }
    }

    if (body instanceof FormData) {
      return '[FormData]';
    }

    if (body instanceof URLSearchParams) {
      return '[URLSearchParams]';
    }

    if (body instanceof Blob) {
      return `[Blob: ${body.type || 'unknown'}]`;
    }

    if (body instanceof ArrayBuffer) {
      return '[ArrayBuffer]';
    }

    if (typeof body === 'object') {
      return this.sanitizeJsonBody(body);
    }

    return String(body).substring(0, 100);
  }

  /**
   * Sanitize JSON body (remove sensitive fields)
   */
  sanitizeJsonBody(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const sensitiveKeys = ['password', 'secret', 'token', 'ssn', 'card', 'credit', 'cvc', 'cvv', 'pin'];
    const sanitized = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = sensitiveKeys.some(sensitive =>
        key.toLowerCase().includes(sensitive)
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeJsonBody(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if request should be ignored
   */
  shouldIgnoreRequest(url, init) {
    // Ignore tracker's own endpoint
    if (url.includes('/api/events') || url.includes('/api/track')) {
      return true;
    }

    // Ignore browser extensions
    if (url.startsWith('chrome-extension://') || url.startsWith('moz-extension://')) {
      return true;
    }

    return false;
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enable API tracking
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable API tracking
   */
  disable() {
    this.isEnabled = false;
  }
}
