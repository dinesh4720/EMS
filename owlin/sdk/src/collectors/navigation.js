/**
 * Navigation Collector for Owlin Tracker
 * Captures route changes, page views, and navigation events
 */

export class NavigationCollector {
  constructor(tracker) {
    this.tracker = tracker;
    this.handlePopState = this.handlePopState.bind(this);
    this.handlePushState = this.handlePushState.bind(this);
    this.handleReplaceState = this.handleReplaceState.bind(this);
    this.handleHashChange = this.handleHashChange.bind(this);
    this.isEnabled = true;
    this.currentPage = null;
    this.pageLoadTime = Date.now();
    this.navigationStartTime = Date.now();
  }

  /**
   * Start capturing navigation
   */
  start() {
    // Override history methods for SPA navigation
    this.wrapHistoryMethod('pushState', this.handlePushState);
    this.wrapHistoryMethod('replaceState', this.handleReplaceState);

    // Listen for browser navigation
    window.addEventListener('popstate', this.handlePopState);
    window.addEventListener('hashchange', this.handleHashChange);

    // Track initial page load
    this.trackPageView('load');
  }

  /**
   * Stop capturing navigation
   */
  stop() {
    window.removeEventListener('popstate', this.handlePopState);
    window.removeEventListener('hashchange', this.handleHashChange);

    // Restore original methods
    if (this.originalPushState) {
      window.history.pushState = this.originalPushState;
    }
    if (this.originalReplaceState) {
      window.history.replaceState = this.originalReplaceState;
    }
  }

  /**
   * Wrap a history method
   */
  wrapHistoryMethod(methodName, handler) {
    const original = window.history[methodName];
    this[`original${methodName.charAt(0).toUpperCase() + methodName.slice(1)}`] = original;

    window.history[methodName] = function(state, title, url) {
      handler.call(this, state, title, url);
      return original.apply(this, arguments);
    };
  }

  /**
   * Handle pushState navigation
   */
  handlePushState(state, title, url) {
    if (!this.isEnabled) return;

    const oldUrl = window.location.href;
    const newUrl = url ? new URL(url, window.location.href).href : oldUrl;

    // Wait for state to update
    setTimeout(() => {
      this.trackNavigation('pushState', oldUrl, newUrl);
    }, 0);
  }

  /**
   * Handle replaceState navigation
   */
  handleReplaceState(state, title, url) {
    if (!this.isEnabled) return;

    const oldUrl = window.location.href;
    const newUrl = url ? new URL(url, window.location.href).href : oldUrl;

    setTimeout(() => {
      this.trackNavigation('replaceState', oldUrl, newUrl);
    }, 0);
  }

  /**
   * Handle popstate navigation (back/forward buttons)
   */
  handlePopState(event) {
    if (!this.isEnabled) return;

    const currentUrl = window.location.href;
    this.trackNavigation('popstate', this.currentPage || currentUrl, currentUrl);
  }

  /**
   * Handle hash change
   */
  handleHashChange(event) {
    if (!this.isEnabled) return;

    const oldUrl = event.oldURL;
    const newUrl = event.newURL;

    this.trackNavigation('hashchange', oldUrl, newUrl);
  }

  /**
   * Track a page view
   */
  trackPageView(trigger = 'navigation') {
    const pageData = {
      type: 'pageview',
      trigger,
      page: {
        url: window.location.href,
        path: window.location.pathname,
        hash: window.location.hash,
        search: window.location.search,
        title: document.title || '',
        referrer: document.referrer || '',
      },
      timing: {
        loadTime: Date.now() - this.pageLoadTime,
        navigationTime: Date.now() - this.navigationStartTime,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    // Update current page
    this.currentPage = pageData.page.url;

    // Add to breadcrumbs for error context
    if (this.tracker.breadcrumbs) {
      this.tracker.breadcrumbs.navigation(pageData.page.path, `Navigated to ${pageData.page.path}`);
    }

    this.tracker.track(pageData);
  }

  /**
   * Track navigation event
   */
  trackNavigation(method, fromUrl, toUrl) {
    const navigationData = {
      type: 'navigation',
      method,
      from: fromUrl,
      to: toUrl,
      page: {
        url: toUrl,
        path: new URL(toUrl, window.location.origin).pathname,
        hash: new URL(toUrl, window.location.origin).hash,
        search: new URL(toUrl, window.location.origin).search,
        title: document.title || '',
      },
      timestamp: Date.now(),
    };

    this.currentPage = toUrl;
    this.navigationStartTime = Date.now();

    this.tracker.track(navigationData);

    // Also track as pageview after a short delay
    setTimeout(() => {
      this.trackPageView(method);
    }, 100);
  }

  /**
   * Manually track a route change (for React Router, etc.)
   */
  trackRoute(path, params = {}) {
    const oldUrl = this.currentPage || window.location.href;
    const newUrl = window.location.origin + path;

    this.trackNavigation('route', oldUrl, newUrl);

    // Add any additional params
    if (Object.keys(params).length > 0) {
      this.tracker.track({
        type: 'route_params',
        path,
        params,
      });
    }
  }

  /**
   * Track page unload
   */
  trackUnload() {
    const unloadData = {
      type: 'unload',
      page: {
        url: window.location.href,
        path: window.location.pathname,
      },
      duration: Date.now() - this.pageLoadTime,
    };

    this.tracker.track(unloadData, true);
  }

  /**
   * Enable navigation tracking
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable navigation tracking
   */
  disable() {
    this.isEnabled = false;
  }
}
