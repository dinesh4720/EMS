/**
 * Error Collector for Owlin Tracker
 * Captures console errors and JavaScript runtime errors
 */

export class ErrorCollector {
  constructor(tracker) {
    this.tracker = tracker;
    this.handleError = this.handleError.bind(this);
    this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
    this.originalConsoleError = null;
    this.consoleErrors = [];
    this.isEnabled = true;
  }

  /**
   * Start capturing errors
   */
  start() {
    // Capture JavaScript errors
    window.addEventListener('error', this.handleError);

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Intercept console.error
    this.interceptConsole();
  }

  /**
   * Stop capturing errors
   */
  stop() {
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Restore original console.error
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
    }
  }

  /**
   * Intercept console.error to capture logged errors
   */
  interceptConsole() {
    const self = this;
    this.originalConsoleError = console.error;

    console.error = function(...args) {
      // Call original first
      self.originalConsoleError.apply(console, args);

      if (!self.isEnabled) return;
      if (self.shouldIgnoreConsoleArgs(args)) return;

      // Skip if called from tracker itself
      const stack = new Error().stack;
      if (stack.includes('owlin-tracker') || stack.includes('OwlinTracker')) {
        return;
      }

      // Build error data from console args
      const errorData = {
        type: 'console_error',
        source: 'console',
        message: args.map(arg => self.formatArgument(arg)).join(' '),
        args: args.map(arg => self.sanitizeArgument(arg)),
        timestamp: Date.now(),
        page: {
          url: window.location.href,
          path: window.location.pathname,
        },
      };

      self.tracker.track(errorData);
    };
  }

  shouldIgnoreConsoleArgs(args = []) {
    return args.some((arg) => {
      if (typeof arg === 'string') {
        return arg.includes('[Owlin Tracker]');
      }

      if (arg instanceof Error) {
        return arg.message?.includes('[Owlin Tracker]');
      }

      return false;
    });
  }

  /**
   * Handle JavaScript runtime errors
   */
  handleError(event) {
    if (!this.isEnabled) return;

    const errorData = {
      type: 'runtime_error',
      message: event.message || 'Unknown error',
      source: event.filename || 'unknown',
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack || undefined,
      error: event.error?.name || 'Error',
      timestamp: Date.now(),
      page: {
        url: window.location.href,
        path: window.location.pathname,
      },
    };

    this.tracker.track(errorData);
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection(event) {
    if (!this.isEnabled) return;

    const reason = event.reason;

    const errorData = {
      type: 'unhandled_rejection',
      message: reason?.message || String(reason),
      stack: reason?.stack || undefined,
      reason: this.formatReason(reason),
      timestamp: Date.now(),
      page: {
        url: window.location.href,
        path: window.location.pathname,
      },
      promise: true,
    };

    this.tracker.track(errorData);
  }

  /**
   * Format console argument
   */
  formatArgument(arg) {
    if (typeof arg === 'string') {
      return arg;
    }

    if (arg instanceof Error) {
      return `${arg.name}: ${arg.message}`;
    }

    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return '[Object]';
      }
    }

    return String(arg);
  }

  /**
   * Sanitize argument for logging (remove sensitive data)
   */
  sanitizeArgument(arg) {
    if (typeof arg === 'string') {
      return arg;
    }

    if (arg instanceof Error) {
      return {
        name: arg.name,
        message: arg.message,
        stack: arg.stack,
      };
    }

    if (typeof arg === 'object' && arg !== null) {
      const sanitized = {};

      for (const [key, value] of Object.entries(arg)) {
        sanitized[key] = this.sanitizeValue(key, value);
      }

      return sanitized;
    }

    return arg;
  }

  /**
   * Sanitize individual value
   */
  sanitizeValue(key, value) {
    const sensitiveKeys = ['password', 'secret', 'token', 'ssn', 'card', 'credit', 'authorization'];

    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      return '[REDACTED]';
    }

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(v => this.sanitizeValue('', v));
      }

      const sanitized = {};
      for (const [k, v] of Object.entries(value)) {
        sanitized[k] = this.sanitizeValue(k, v);
      }
      return sanitized;
    }

    return value;
  }

  /**
   * Format rejection reason
   */
  formatReason(reason) {
    if (reason instanceof Error) {
      return {
        name: reason.name,
        message: reason.message,
      };
    }

    if (typeof reason === 'object' && reason !== null) {
      return JSON.stringify(reason);
    }

    return String(reason);
  }

  /**
   * Manually track an error
   */
  trackError(error, context = {}) {
    if (!this.isEnabled) return;

    const errorData = {
      type: 'manual_error',
      message: error?.message || String(error),
      stack: error?.stack || undefined,
      error: error?.name || 'Error',
      context,
      timestamp: Date.now(),
      page: {
        url: window.location.href,
        path: window.location.pathname,
      },
    };

    this.tracker.track(errorData);
  }

  /**
   * Enable error tracking
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable error tracking
   */
  disable() {
    this.isEnabled = false;
  }
}
