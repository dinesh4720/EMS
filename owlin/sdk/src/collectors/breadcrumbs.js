/**
 * Breadcrumb Ring Buffer — tracks last N user actions for error context.
 * Every click, navigation, form submit, and API call is logged.
 * When an error fires, the entire buffer is attached to the error event.
 */

const MAX_BREADCRUMBS = 20;

export class BreadcrumbCollector {
  constructor(tracker) {
    this.tracker = tracker;
    this.breadcrumbs = [];
  }

  /** Add a breadcrumb to the ring buffer. */
  add(type, detail, data = null) {
    const breadcrumb = {
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      timestamp: Date.now(),
      type,
      detail,
    };
    if (data) breadcrumb.data = data;

    this.breadcrumbs.push(breadcrumb);
    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  /** Get the current breadcrumbs (last N actions). */
  getBreadcrumbs() {
    return [...this.breadcrumbs];
  }

  /** Clear all breadcrumbs. */
  clear() {
    this.breadcrumbs = [];
  }

  // ── Auto-tracking helpers (called by other collectors) ──────────────────

  /** Log a navigation event. */
  navigation(page, detail) {
    this.add('navigation', detail || `Navigated to ${page}`);
  }

  /** Log a click event. */
  click(element, text) {
    const tag = element?.tagName?.toLowerCase() || 'element';
    const label = text ? `'${text.slice(0, 50)}'` : tag;
    this.add('click', `Clicked ${label}`);
  }

  /** Log a form submission. */
  formSubmit(formId) {
    this.add('form_submit', `Submitted form${formId ? ` (${formId})` : ''}`);
  }

  /** Log an API call. */
  apiCall(method, url, status, durationMs) {
    const shortUrl = url.length > 60 ? url.slice(0, 57) + '...' : url;
    this.add('api_call', `${method} ${shortUrl} → ${status} (${durationMs}ms)`);
  }

  /** Log an input change. */
  input(fieldName) {
    this.add('input', `Changed field: ${fieldName || 'unknown'}`);
  }

  /** Log a custom event. */
  custom(detail) {
    this.add('custom', detail);
  }

  /** Log an error (this is the final breadcrumb before the error is sent). */
  error(message) {
    this.add('error', message);
  }
}
