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

      // Store in recent console errors buffer for breadcrumb context
      const message = args.map(arg => self.formatArgument(arg)).join(' ');
      self.consoleErrors.push({
        level: 'error',
        message: message.slice(0, 500),
        timestamp: Date.now(),
      });
      // Keep only last 10 console errors
      if (self.consoleErrors.length > 10) self.consoleErrors.shift();

      // Build error data from console args
      const errorData = {
        type: 'console_error',
        source: 'console',
        message,
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

  /** Detect module from current URL path. */
  detectModule() {
    const path = window.location.pathname;
    const map = {
      '/students': 'Students', '/classes': 'Classes', '/fees': 'Fees',
      '/academics': 'Academics', '/staffs': 'Staff', '/attendance': 'Attendance',
      '/messaging': 'Messaging', '/settings': 'Settings', '/front-desk': 'Front Desk',
      '/transport': 'Transport', '/library': 'Library', '/hostel': 'Hostel',
      '/homework': 'Homework', '/payroll': 'Payroll', '/timetable': 'Timetable',
    };
    for (const [prefix, name] of Object.entries(map)) {
      if (path.startsWith(prefix)) return name;
    }
    return path === '/' || path === '/dashboard' ? 'Dashboard' : 'Other';
  }

  /** Get recent console errors captured by the interceptor. */
  getRecentConsoleErrors() {
    return this.consoleErrors.slice(-5);
  }

  /** Build the enriched error payload with breadcrumbs and context. */
  buildErrorPayload(base) {
    const breadcrumbs = this.tracker.breadcrumbs?.getBreadcrumbs() ?? [];
    // Add the error itself as the final breadcrumb
    this.tracker.breadcrumbs?.error(base.message || 'Unknown error');

    return {
      ...base,
      type: 'error',
      severity: base.severity || 'error',
      source: base.source || 'frontend',
      file: base.file || base.source || null,
      line: base.line || base.lineno || null,
      col: base.col || base.colno || null,
      stackTrace: base.stack || null,
      module: this.detectModule(),
      page: window.location.pathname,
      action: base.action || null,
      breadcrumbs,
      consoleErrors: this.getRecentConsoleErrors(),
      metadata: {
        ...(base.metadata || {}),
        message: base.message,
        source: base.file || base.source,
        lineno: base.line || base.lineno,
        colno: base.col || base.colno,
        stack: base.stack,
        browser: navigator.userAgent,
        os: navigator.platform,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Handle JavaScript runtime errors
   */
  handleError(event) {
    if (!this.isEnabled) return;

    const errorPayload = this.buildErrorPayload({
      message: event.message || 'Unknown error',
      file: event.filename || 'unknown',
      line: event.lineno,
      col: event.colno,
      stack: event.error?.stack || undefined,
      severity: 'error',
    });

    this.tracker.track(errorPayload);
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection(event) {
    if (!this.isEnabled) return;

    const reason = event.reason;

    const errorPayload = this.buildErrorPayload({
      message: reason?.message || String(reason),
      stack: reason?.stack || undefined,
      severity: 'unhandled_rejection',
    });

    this.tracker.track(errorPayload);
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

    const errorPayload = this.buildErrorPayload({
      message: error?.message || String(error),
      stack: error?.stack || undefined,
      severity: 'error',
      action: context.action || null,
      ...(context.apiError ? { apiError: context.apiError } : {}),
    });

    this.tracker.track(errorPayload);
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
