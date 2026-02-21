/**
 * Owlin Tracker - UMD Bundle
 * A comprehensive event tracking SDK for web applications
 *
 * @version 1.0.0
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? factory(exports)
    : typeof define === 'function' && define.amd
      ? define(['exports'], factory)
      : ((global = typeof globalThis !== 'undefined' ? globalThis : global || self),
        factory((global.OwlinTracker = {})));
})(this, function (exports) {
  'use strict';

  // =============================================================================
  // DOM Utilities
  // =============================================================================

  function getElementSelector(element) {
    if (!element || !element.tagName) return 'unknown';
    if (element.id) return `#${element.id}`;
    if (element.dataset && element.dataset.testid) {
      return `[data-testid="${element.dataset.testid}"]`;
    }

    let selector = element.tagName.toLowerCase();
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter((c) => c.trim());
      if (classes.length > 0) selector += '.' + classes.join('.');
    }

    if (element.parentElement) {
      const siblings = Array.from(element.parentElement.children).filter(
        (child) => child.tagName === element.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    return selector;
  }

  function getElementText(element, maxLength = 100) {
    if (!element) return '';
    const text = element.textContent || element.innerText || '';
    return text.trim().substring(0, maxLength);
  }

  function getElementAttributes(element) {
    if (!element || !element.attributes) return {};
    const attrs = {};
    const relevantAttrs = ['type', 'name', 'placeholder', 'aria-label', 'title', 'role'];
    for (const attr of relevantAttrs) {
      if (element.hasAttribute(attr)) {
        attrs[attr] = element.getAttribute(attr);
      }
    }
    return attrs;
  }

  function getElementHierarchy(element) {
    if (!element) return [];
    const hierarchy = [];
    let current = element;
    while (current && current !== document.body && hierarchy.length < 5) {
      const item = {
        tag: current.tagName?.toLowerCase() || 'unknown',
        id: current.id || undefined,
        class: current.className?.split?.(' ').filter(Boolean)[0] || undefined,
      };
      if (item.id || item.class) hierarchy.unshift(item);
      current = current.parentElement;
    }
    return hierarchy;
  }

  function getViewportInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    };
  }

  function getScrollPosition() {
    return {
      x: window.scrollX || window.pageXOffset,
      y: window.scrollY || window.pageYOffset,
    };
  }

  function findLabelText(element) {
    if (!element) return '';
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent.trim();
    }
    const parentLabel = element.closest('label');
    if (parentLabel) {
      const clone = parentLabel.cloneNode(true);
      const inputInClone = clone.querySelector('input, select, textarea');
      if (inputInClone) inputInClone.remove();
      return clone.textContent.trim();
    }
    return '';
  }

  function maskSensitiveData(value, type = 'text') {
    if (!value) return value;
    const sensitiveTypes = ['password', 'pin', 'ssn', 'creditcard', 'cvc', 'cvv'];
    const sensitiveNames = ['password', 'secret', 'token', 'ssn', 'card', 'credit', 'cvc', 'cvv', 'pin'];

    if (sensitiveTypes.includes(type.toLowerCase())) return '***';

    const lowerValue = value.toLowerCase();
    for (const keyword of sensitiveNames) {
      if (lowerValue.includes(keyword)) return '***';
    }

    if (value.includes('@') && value.length > 5) {
      const [local, domain] = value.split('@');
      return `${local.charAt(0)}${'*'.repeat(Math.min(local.length - 1, 3))}@${domain}`;
    }

    if (/^\d{8,}$/.test(value)) {
      return value.substring(0, 3) + '***' + value.substring(value.length - 2);
    }

    return value;
  }

  // =============================================================================
  // Event Sender
  // =============================================================================

  class EventSender {
    constructor(config = {}) {
      this.endpoint = config.endpoint || '/api/events';
      this.batchSize = config.batchSize || 10;
      this.flushInterval = config.flushInterval || 5000;
      this.maxRetries = config.maxRetries || 3;
      this.retryDelay = config.retryDelay || 1000;
      this.queue = [];
      this.isSending = false;
      this.flushTimer = null;
      this.debounceTimer = null;
      this.setupAutoFlush();
    }

    add(event) {
      const enrichedEvent = {
        ...event,
        timestamp: event.timestamp || Date.now(),
        queueTime: Date.now(),
      };
      this.queue.push(enrichedEvent);

      // Flush immediately if we hit the batch size limit
      if (this.queue.length >= this.batchSize) {
        this.cancelDebounce();
        this.flush();
        return;
      }

      // Otherwise debounce: flush 300ms after the last event in a burst.
      // This captures rapid clicks without waiting for the full interval.
      this.scheduleDebounce();
    }

    scheduleDebounce(delay = 300) {
      this.cancelDebounce();
      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = null;
        if (this.queue.length > 0) this.flush();
      }, delay);
    }

    cancelDebounce() {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
    }

    async flush() {
      // If already sending, don't block — the chained re-flush after send
      // will pick up any events that arrived during the in-flight request.
      if (this.isSending || this.queue.length === 0) return;

      this.isSending = true;
      const eventsToSend = [...this.queue];
      this.queue = [];

      try {
        await this.sendBatch(eventsToSend);
      } catch (error) {
        // Put events back at the front of the queue for retry
        this.queue.unshift(...eventsToSend);
        const retries = (eventsToSend[0]?.retries || 0) + 1;
        eventsToSend[0].retries = retries;
        if (retries < this.maxRetries) {
          setTimeout(() => this.flush(), this.retryDelay * retries);
        } else {
          // Drop to avoid infinite growth
          this.queue = this.queue.slice(eventsToSend.length);
        }
      } finally {
        this.isSending = false;
        // Chain: if more events arrived while we were sending, flush them now
        if (this.queue.length > 0) {
          // Small delay to avoid hammering the server
          setTimeout(() => this.flush(), 50);
        }
      }
    }

    async sendBatch(events) {
      const payload = {
        events,
        sentAt: Date.now(),
        batchSize: events.length,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Always use batch endpoint — it handles single events too
      const endpoint = this.endpoint.includes('/api/events')
        ? this.endpoint.replace('/api/events', '/api/events/batch')
        : this.endpoint;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tracker-Version': '1.0.0',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
          keepalive: true,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
    }

    sendBeacon(event) {
      const payload = JSON.stringify({
        events: [event],
        sentAt: Date.now(),
        batchSize: 1,
      });

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        return navigator.sendBeacon(this.endpoint, blob);
      }

      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', this.endpoint, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(payload);
        return true;
      } catch (error) {
        return false;
      }
    }

    setupAutoFlush() {
      if (this.flushTimer) clearInterval(this.flushTimer);
      // Safety net: flush every 1s in case debounce was missed
      this.flushTimer = setInterval(() => {
        if (this.queue.length > 0 && !this.isSending) this.flush();
      }, 1000);
    }

    stopAutoFlush() {
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }
      this.cancelDebounce();
    }

    getQueueSize() {
      return this.queue.length;
    }

    clear() {
      this.queue = [];
      this.cancelDebounce();
    }

    destroy() {
      this.stopAutoFlush();
      this.flush();
    }
  }

  // =============================================================================
  // Collectors
  // =============================================================================

  // Tags that are meaningful interactive elements to track
  const INTERACTIVE_TAGS = new Set(['a', 'button', 'select', 'summary', 'details']);
  // Input types that are clickable actions
  const INTERACTIVE_INPUT_TYPES = new Set(['submit', 'button', 'reset', 'checkbox', 'radio', 'file']);
  // ARIA roles that indicate interactivity
  const INTERACTIVE_ROLES = new Set([
    'button', 'link', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
    'option', 'treeitem', 'gridcell', 'row', 'listitem', 'checkbox', 'radio',
    'switch', 'combobox', 'spinbutton'
  ]);

  /**
   * Walk up the DOM from the raw click target to find the nearest
   * meaningful interactive element. Returns null if none found within
   * MAX_WALK_DEPTH levels (meaning the click was on a non-interactive area).
   */
  function findInteractiveAncestor(element, maxDepth = 6) {
    let current = element;
    let depth = 0;

    while (current && current !== document.body && depth < maxDepth) {
      const tag = current.tagName?.toLowerCase();

      // Always skip SVG internals — walk up
      if (tag === 'svg' || tag === 'path' || tag === 'use' || tag === 'circle' ||
        tag === 'rect' || tag === 'polygon' || tag === 'g' || tag === 'line') {
        current = current.parentElement;
        depth++;
        continue;
      }

      // Explicit interactive tags
      if (INTERACTIVE_TAGS.has(tag)) return current;

      // Input elements that are clickable
      if (tag === 'input') {
        const type = (current.getAttribute('type') || 'text').toLowerCase();
        if (INTERACTIVE_INPUT_TYPES.has(type)) return current;
      }

      // Elements with interactive ARIA roles
      const role = current.getAttribute('role');
      if (role && INTERACTIVE_ROLES.has(role)) return current;

      // Elements with explicit tabIndex (keyboard-navigable = interactive)
      const tabIndex = current.getAttribute('tabindex');
      if (tabIndex !== null && tabIndex !== '-1') return current;

      // Elements with onClick handlers (data-action, data-href, etc.)
      if (current.dataset && (current.dataset.action || current.dataset.href || current.dataset.link)) {
        return current;
      }

      // Table rows (clicking a student/staff row)
      if (tag === 'tr' || tag === 'li') return current;

      current = current.parentElement;
      depth++;
    }

    return null; // Not an interactive element
  }

  /**
   * Build a smart, human-readable label for an element.
   * Priority: aria-label > title > button text > input placeholder > element text
   * For table rows: "Name (Code)" format
   */
  function getSmartElementLabel(element) {
    if (!element) return '';
    const tag = element.tagName?.toLowerCase();

    // aria-label is the most explicit
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();

    // title attribute
    const title = element.getAttribute('title');
    if (title) return title.trim();

    // For table rows — try to extract "Name (Code)" from cells
    if (tag === 'tr') {
      const cells = Array.from(element.querySelectorAll('td'));
      if (cells.length > 0) {
        // First cell usually has the name, second might have admission/staff ID
        const firstCellText = cells[0]?.textContent?.trim() || '';
        const secondCellText = cells[1]?.textContent?.trim() || '';

        // Look for a code pattern (e.g. ADM2024161, STF001) in any cell
        const codePattern = /\b([A-Z]{2,}\d{3,})\b/;
        let code = '';
        for (const cell of cells) {
          const match = cell.textContent?.match(codePattern);
          if (match) { code = match[1]; break; }
        }

        if (firstCellText && code && !firstCellText.includes(code)) {
          return `${firstCellText} (${code})`;
        }
        if (firstCellText) return firstCellText.substring(0, 60);
      }
    }

    // For list items — extract meaningful text
    if (tag === 'li') {
      const text = element.textContent?.trim() || '';
      return text.substring(0, 60);
    }

    // For buttons/anchors — get direct text, ignoring nested SVG text
    if (tag === 'button' || tag === 'a') {
      // Clone and remove SVG children to get clean text
      const clone = element.cloneNode(true);
      clone.querySelectorAll('svg, img').forEach(n => n.remove());
      const text = clone.textContent?.trim() || '';
      if (text) return text.substring(0, 60);

      // If button only has an icon, check for aria-label on icon or data-tooltip
      const tooltip = element.getAttribute('data-tooltip') || element.getAttribute('data-title');
      if (tooltip) return tooltip.trim();

      // Last resort: check the first SVG's title element
      const svgTitle = element.querySelector('svg title');
      if (svgTitle) return svgTitle.textContent?.trim() || '';
    }

    // Generic: get text content
    const text = element.textContent?.trim() || '';
    return text.substring(0, 60);
  }

  /**
   * Get a concise element type label for display
   * e.g. "Tab", "Button", "Link", "Row", "List Item"
   */
  function getElementKind(element) {
    const tag = element.tagName?.toLowerCase();
    const role = element.getAttribute('role');

    if (role === 'tab') return 'Tab';
    if (role === 'button') return 'Button';
    if (role === 'menuitem') return 'Menu Item';
    if (role === 'option') return 'Option';
    if (role === 'listitem' || tag === 'li') return 'List Item';
    if (tag === 'button') {
      // Detect icon-only buttons
      const clone = element.cloneNode(true);
      clone.querySelectorAll('svg, img').forEach(n => n.remove());
      const text = clone.textContent?.trim() || '';
      if (!text) return 'Icon Button';
      return 'Button';
    }
    if (tag === 'a') return 'Link';
    if (tag === 'tr') return 'Row';
    if (tag === 'select') return 'Dropdown';
    if (tag === 'input') {
      const type = element.getAttribute('type') || 'text';
      if (type === 'checkbox') return 'Checkbox';
      if (type === 'radio') return 'Radio';
      return 'Input';
    }
    return 'Element';
  }

  class ClickCollector {
    constructor(tracker) {
      this.tracker = tracker;
      this.handleClick = this.handleClick.bind(this);
      this.isEnabled = true;
    }

    start() {
      document.addEventListener('click', this.handleClick, true);
    }

    stop() {
      document.removeEventListener('click', this.handleClick, true);
    }

    handleClick(event) {
      if (!this.isEnabled) return;
      const rawTarget = event.target;
      if (!rawTarget || rawTarget.closest('[data-owlin-ignore]')) return;

      // Walk up to find the nearest meaningful interactive element
      const interactiveEl = findInteractiveAncestor(rawTarget);

      // If no interactive element found, skip this click (it's on a plain div/span/p)
      if (!interactiveEl) return;

      const label = getSmartElementLabel(interactiveEl);
      const kind = getElementKind(interactiveEl);
      const tag = interactiveEl.tagName?.toLowerCase() || 'unknown';

      const clickData = {
        type: 'click',
        element: {
          kind,
          label: label || kind,
          tagName: tag,
          selector: getElementSelector(interactiveEl),
          text: label,
          attributes: getElementAttributes(interactiveEl),
        },
        position: {
          x: event.clientX,
          y: event.clientY,
          pageX: event.pageX,
          pageY: event.pageY,
        },
        viewport: getViewportInfo(),
        scroll: getScrollPosition(),
        meta: {
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
          button: event.button,
        },
      };

      if (tag === 'a' && interactiveEl.href) {
        clickData.element.href = interactiveEl.href;
      }

      const form = interactiveEl.closest('form');
      if (form) {
        clickData.form = {
          id: form.id || undefined,
          action: form.action || undefined,
          method: form.method || undefined,
        };
      }

      this.tracker.track(clickData);
    }

    enable() {
      this.isEnabled = true;
    }

    disable() {
      this.isEnabled = false;
    }
  }

  class InputCollector {
    constructor(tracker) {
      this.tracker = tracker;
      this.handleInput = this.handleInput.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.handleFocus = this.handleFocus.bind(this);
      this.handleBlur = this.handleBlur.bind(this);
      this.isEnabled = true;
      this.focusTimes = new Map();
    }

    start() {
      document.addEventListener('input', this.handleInput, true);
      document.addEventListener('change', this.handleChange, true);
      document.addEventListener('focusin', this.handleFocus, true);
      document.addEventListener('focusout', this.handleBlur, true);
    }

    stop() {
      document.removeEventListener('input', this.handleInput, true);
      document.removeEventListener('change', this.handleChange, true);
      document.removeEventListener('focusin', this.handleFocus, true);
      document.removeEventListener('focusout', this.handleBlur, true);
    }

    isTrackableInput(element) {
      if (!element) return false;
      const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
      if (!inputTags.includes(element.tagName)) return false;
      if (element.closest('[data-owlin-ignore]')) return false;
      return true;
    }

    isSensitiveField(element) {
      if (!element) return false;
      const sensitiveTypes = ['password', 'creditcard', 'cvc', 'cvv'];
      if (sensitiveTypes.includes(element.type?.toLowerCase())) return true;
      const sensitiveNames = ['password', 'secret', 'token', 'ssn', 'card', 'credit', 'cvc', 'cvv', 'pin'];
      const name = (element.name || element.id || element.className || '').toLowerCase();
      return sensitiveNames.some((sensitive) => name.includes(sensitive));
    }

    getInputEventData(element, action) {
      return {
        type: 'input',
        action,
        element: {
          selector: getElementSelector(element),
          tagName: element.tagName?.toLowerCase() || 'unknown',
          type: element.type || 'text',
          name: element.name || undefined,
          id: element.id || undefined,
          labelText: findLabelText(element),
          placeholder: element.placeholder || undefined,
          required: element.required || false,
          disabled: element.disabled || false,
          hierarchy: getElementHierarchy(element),
        },
      };
    }

    handleInput(event) {
      if (!this.isEnabled) return;
      const element = event.target;
      if (!this.isTrackableInput(element)) return;

      const inputData = this.getInputEventData(element, 'input');
      if (element.type !== 'password' && !this.isSensitiveField(element)) {
        inputData.value = maskSensitiveData(element.value, element.type);
        inputData.valueLength = element.value.length;
      }
      this.tracker.track(inputData);
    }

    handleChange(event) {
      if (!this.isEnabled) return;
      const element = event.target;
      if (!this.isTrackableInput(element)) return;

      const changeData = this.getInputEventData(element, 'change');

      if (element.tagName === 'SELECT') {
        const selectedOption = element.options[element.selectedIndex];
        changeData.selection = {
          index: element.selectedIndex,
          value: maskSensitiveData(element.value, element.type),
          text: selectedOption ? selectedOption.text : '',
        };
      }

      if (element.type === 'checkbox' || element.type === 'radio') {
        changeData.checked = element.checked;
      }

      const focusTime = this.focusTimes.get(element);
      if (focusTime) {
        changeData.timeSpent = Date.now() - focusTime;
        this.focusTimes.delete(element);
      }

      this.tracker.track(changeData);
    }

    handleFocus(event) {
      if (!this.isEnabled) return;
      const element = event.target;
      if (!this.isTrackableInput(element)) return;
      this.focusTimes.set(element, Date.now());
      const focusData = this.getInputEventData(element, 'focus');
      this.tracker.track(focusData);
    }

    handleBlur(event) {
      if (!this.isEnabled) return;
      const element = event.target;
      if (!this.isTrackableInput(element)) return;

      const focusTime = this.focusTimes.get(element);
      let timeSpent = null;
      if (focusTime) {
        timeSpent = Date.now() - focusTime;
        this.focusTimes.delete(element);
      }

      const blurData = this.getInputEventData(element, 'blur');
      blurData.timeSpent = timeSpent;

      if (element.validity) {
        blurData.validity = {
          valid: element.validity.valid,
          badInput: element.validity.badInput,
          customError: element.validity.customError,
          patternMismatch: element.validity.patternMismatch,
          rangeOverflow: element.validity.rangeOverflow,
          rangeUnderflow: element.validity.rangeUnderflow,
          tooLong: element.validity.tooLong,
          tooShort: element.validity.tooShort,
          typeMismatch: element.validity.typeMismatch,
          valueMissing: element.validity.valueMissing,
        };
      }

      this.tracker.track(blurData);
    }

    enable() {
      this.isEnabled = true;
    }

    disable() {
      this.isEnabled = false;
    }
  }

  class NavigationCollector {
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

    start() {
      this.wrapHistoryMethod('pushState', this.handlePushState);
      this.wrapHistoryMethod('replaceState', this.handleReplaceState);
      window.addEventListener('popstate', this.handlePopState);
      window.addEventListener('hashchange', this.handleHashChange);
      this.trackPageView('load');
    }

    stop() {
      window.removeEventListener('popstate', this.handlePopState);
      window.removeEventListener('hashchange', this.handleHashChange);
      if (this.originalPushState) window.history.pushState = this.originalPushState;
      if (this.originalReplaceState) window.history.replaceState = this.originalReplaceState;
    }

    wrapHistoryMethod(methodName, handler) {
      const original = window.history[methodName];
      this[`original${methodName.charAt(0).toUpperCase() + methodName.slice(1)}`] = original;

      window.history[methodName] = function (state, title, url) {
        handler.call(this, state, title, url);
        return original.apply(this, arguments);
      };
    }

    handlePushState(state, title, url) {
      if (!this.isEnabled) return;
      const oldUrl = window.location.href;
      const newUrl = url ? new URL(url, window.location.href).href : oldUrl;
      setTimeout(() => {
        this.trackNavigation('pushState', oldUrl, newUrl);
      }, 0);
    }

    handleReplaceState(state, title, url) {
      if (!this.isEnabled) return;
      const oldUrl = window.location.href;
      const newUrl = url ? new URL(url, window.location.href).href : oldUrl;
      setTimeout(() => {
        this.trackNavigation('replaceState', oldUrl, newUrl);
      }, 0);
    }

    handlePopState(event) {
      if (!this.isEnabled) return;
      const currentUrl = window.location.href;
      this.trackNavigation('popstate', this.currentPage || currentUrl, currentUrl);
    }

    handleHashChange(event) {
      if (!this.isEnabled) return;
      this.trackNavigation('hashchange', event.oldURL, event.newURL);
    }

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

      this.currentPage = pageData.page.url;
      this.tracker.track(pageData);
    }

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

      setTimeout(() => {
        this.trackPageView(method);
      }, 100);
    }

    trackRoute(path, params = {}) {
      const oldUrl = this.currentPage || window.location.href;
      const newUrl = window.location.origin + path;
      this.trackNavigation('route', oldUrl, newUrl);

      if (Object.keys(params).length > 0) {
        this.tracker.track({
          type: 'route_params',
          path,
          params,
        });
      }
    }

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

    enable() {
      this.isEnabled = true;
    }

    disable() {
      this.isEnabled = false;
    }
  }

  class ApiCollector {
    constructor(tracker) {
      this.tracker = tracker;
      this.originalFetch = window.fetch;
      this.originalXHR = window.XMLHttpRequest;
      this.isEnabled = true;
      this.requestMap = new Map();
    }

    start() {
      this.interceptFetch();
      this.interceptXHR();
    }

    stop() {
      window.fetch = this.originalFetch;
      window.XMLHttpRequest = this.originalXHR;
    }

    shouldIgnoreRequest(url) {
      if (url.includes('/api/events') || url.includes('/api/track')) return true;
      if (url.startsWith('chrome-extension://') || url.startsWith('moz-extension://')) return true;
      return false;
    }

    generateRequestId() {
      return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    sanitizeHeaders(headers) {
      if (!headers) return {};
      const sanitized = {};
      const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token'];

      if (headers instanceof Headers) {
        headers.forEach((value, key) => {
          sanitized[key] = sensitiveHeaders.includes(key.toLowerCase()) ? '[REDACTED]' : value;
        });
      } else if (typeof headers === 'object') {
        for (const [key, value] of Object.entries(headers)) {
          sanitized[key] = sensitiveHeaders.includes(key.toLowerCase()) ? '[REDACTED]' : value;
        }
      }

      return sanitized;
    }

    sanitizeBody(body) {
      if (!body) return body;
      if (typeof body === 'string') {
        try {
          const parsed = JSON.parse(body);
          return this.sanitizeJsonBody(parsed);
        } catch (e) {
          return body.substring(0, 100);
        }
      }
      if (body instanceof FormData) return '[FormData]';
      if (body instanceof URLSearchParams) return '[URLSearchParams]';
      if (body instanceof Blob) return `[Blob: ${body.type || 'unknown'}]`;
      if (body instanceof ArrayBuffer) return '[ArrayBuffer]';
      if (typeof body === 'object') return this.sanitizeJsonBody(body);
      return String(body).substring(0, 100);
    }

    sanitizeJsonBody(obj) {
      if (!obj || typeof obj !== 'object') return obj;
      const sensitiveKeys = ['password', 'secret', 'token', 'ssn', 'card', 'credit', 'cvc', 'cvv', 'pin'];
      const sanitized = Array.isArray(obj) ? [] : {};

      for (const [key, value] of Object.entries(obj)) {
        const isSensitive = sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive));
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
      };
    }

    interceptFetch() {
      const self = this;

      window.fetch = function (input, init) {
        const url = typeof input === 'string' ? input : input.url;
        const method = (init?.method || 'GET').toUpperCase();
        const requestId = self.generateRequestId();

        if (self.shouldIgnoreRequest(url)) {
          return self.originalFetch.apply(this, arguments);
        }

        const requestData = self.buildRequestData('fetch', url, method, init);
        requestData.requestId = requestId;
        self.tracker.track({ ...requestData, phase: 'start' });
        self.requestMap.set(requestId, { startTime: Date.now(), url, method });

        return self.originalFetch
          .apply(this, arguments)
          .then((response) => {
            const duration = Date.now() - self.requestMap.get(requestId)?.startTime;
            self.requestMap.delete(requestId);

            self.tracker.track({
              ...requestData,
              phase: 'complete',
              status: response.status,
              statusText: response.statusText,
              duration,
            });

            return response;
          })
          .catch((error) => {
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

    interceptXHR() {
      const self = this;
      const OriginalXHR = this.originalXHR;

      function TrackedXHR() {
        const xhr = new OriginalXHR();
        const requestId = self.generateRequestId();
        let requestData = null;
        let startTime = null;

        const originalOpen = xhr.open;
        xhr.open = function (method, url) {
          if (self.shouldIgnoreRequest(url)) {
            return originalOpen.apply(this, arguments);
          }

          requestData = self.buildRequestData('xhr', url, method.toUpperCase(), {});
          requestData.requestId = requestId;
          startTime = Date.now();

          return originalOpen.apply(this, arguments);
        };

        const originalSend = xhr.send;
        xhr.send = function (body) {
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

          xhr.addEventListener('loadend', function () {
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

      TrackedXHR.prototype = OriginalXHR.prototype;
      TrackedXHR.prototype.constructor = TrackedXHR;
      window.XMLHttpRequest = TrackedXHR;
    }

    enable() {
      this.isEnabled = true;
    }

    disable() {
      this.isEnabled = false;
    }
  }

  class ErrorCollector {
    constructor(tracker) {
      this.tracker = tracker;
      this.handleError = this.handleError.bind(this);
      this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
      this.originalConsoleError = null;
      this.isEnabled = true;
    }

    start() {
      window.addEventListener('error', this.handleError);
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
      this.interceptConsole();
    }

    stop() {
      window.removeEventListener('error', this.handleError);
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
      if (this.originalConsoleError) {
        console.error = this.originalConsoleError;
      }
    }

    interceptConsole() {
      const self = this;
      this.originalConsoleError = console.error;

      console.error = function (...args) {
        self.originalConsoleError.apply(console, args);
        if (!self.isEnabled) return;

        const stack = new Error().stack;
        if (stack.includes('owlin-tracker') || stack.includes('OwlinTracker')) return;

        self.tracker.track({
          type: 'console_error',
          source: 'console',
          message: args
            .map((arg) => {
              if (typeof arg === 'string') return arg;
              if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
              if (typeof arg === 'object' && arg !== null) {
                try {
                  return JSON.stringify(arg, null, 2);
                } catch (e) {
                  return '[Object]';
                }
              }
              return String(arg);
            })
            .join(' '),
          timestamp: Date.now(),
          page: {
            url: window.location.href,
            path: window.location.pathname,
          },
        });
      };
    }

    handleError(event) {
      if (!this.isEnabled) return;

      this.tracker.track({
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
      });
    }

    handleUnhandledRejection(event) {
      if (!this.isEnabled) return;

      const reason = event.reason;

      this.tracker.track({
        type: 'unhandled_rejection',
        message: reason?.message || String(reason),
        stack: reason?.stack || undefined,
        reason: reason instanceof Error ? { name: reason.name, message: reason.message } : String(reason),
        timestamp: Date.now(),
        page: {
          url: window.location.href,
          path: window.location.pathname,
        },
        promise: true,
      });
    }

    trackError(error, context = {}) {
      if (!this.isEnabled) return;

      this.tracker.track({
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
      });
    }

    enable() {
      this.isEnabled = true;
    }

    disable() {
      this.isEnabled = false;
    }
  }

  // =============================================================================
  // Main Tracker Class
  // =============================================================================

  class OwlinTracker {
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

      this.sender = new EventSender({
        endpoint: this.config.endpoint,
        batchSize: this.config.batchSize,
        flushInterval: this.config.flushInterval,
      });

      this.collectors = {
        click: new ClickCollector(this),
        input: new InputCollector(this),
        navigation: new NavigationCollector(this),
        api: new ApiCollector(this),
        error: new ErrorCollector(this),
      };

      this.sessionStart = Date.now();
      this.lastActivity = Date.now();

      if (this.config.autoStart) {
        this.start();
      }

      this.setupActivityTracking();
      this.setupVisibilityTracking();
      this.setupUnloadHandling();
    }

    start() {
      if (this.isRunning()) return;
      this._running = true;
      Object.values(this.collectors).forEach((collector) => {
        if (collector.start) collector.start();
      });
      this.log('Tracker started');
    }

    stop() {
      Object.values(this.collectors).forEach((collector) => {
        if (collector.stop) collector.stop();
      });
      this._running = false;
      this.log('Tracker stopped');
    }

    isRunning() {
      return this._running;
    }

    track(event, useBeacon = false) {
      this.lastActivity = Date.now();

      const enrichedEvent = {
        ...event,
        sessionId: this.config.sessionId,
        userId: this.config.userId,
        // Top-level userMetadata so the server can always read it regardless of batch order
        userMetadata: this.config.userMetadata || {},
        app: {
          name: this.config.appName,
          version: this.config.appVersion,
          environment: this.config.environment,
          user: this.config.userMetadata || {}
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

      if (!enrichedEvent.screen) {
        enrichedEvent.screen = {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          colorDepth: window.screen.colorDepth,
        };
      }

      this.log('Event tracked:', enrichedEvent);

      if (useBeacon) {
        this.sender.sendBeacon(enrichedEvent);
      } else {
        this.sender.add(enrichedEvent);
      }
    }

    trackEvent(eventName, properties = {}) {
      this.track({
        type: 'custom',
        event: eventName,
        properties,
      });
    }

    setUserId(userId) {
      this.config.userId = userId;
      this.track({
        type: 'user_identify',
        userId,
      });
    }

    setUserProperties(properties) {
      this.config.userMetadata = properties;
      this.track({
        type: 'user_properties',
        properties,
      });
    }

    trackSessionStart() {
      this.sessionStart = Date.now();
      this.config.sessionId = this.generateSessionId();
      this.track({
        type: 'session_start',
        sessionId: this.config.sessionId,
      });
    }

    trackSessionEnd() {
      this.track(
        {
          type: 'session_end',
          sessionId: this.config.sessionId,
          duration: Date.now() - this.sessionStart,
        },
        true
      );
    }

    async flush() {
      return this.sender.flush();
    }

    enableCollector(name) {
      if (this.collectors[name]) {
        if (this.collectors[name].enable) this.collectors[name].enable();
        this.log(`Collector "${name}" enabled`);
      }
    }

    disableCollector(name) {
      if (this.collectors[name]) {
        if (this.collectors[name].disable) this.collectors[name].disable();
        this.log(`Collector "${name}" disabled`);
      }
    }

    generateSessionId() {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    setupActivityTracking() {
      const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

      this._activityHandler = () => {
        this.lastActivity = Date.now();
      };

      activityEvents.forEach((event) => {
        document.addEventListener(event, this._activityHandler, { passive: true });
      });
    }

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

    setupUnloadHandling() {
      window.addEventListener('beforeunload', () => {
        this.collectors.navigation.trackUnload();
        this.sender.flush();
      });

      window.addEventListener('pagehide', () => {
        this.collectors.navigation.trackUnload();
        this.trackSessionEnd();
      });
    }

    log(...args) {
      if (this.config.debug) {
      }
    }

    destroy() {
      this.stop();

      if (this._activityHandler) {
        const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        activityEvents.forEach((event) => {
          document.removeEventListener(event, this._activityHandler);
        });
      }

      this.sender.destroy();
      this.log('Tracker destroyed');
    }
  }

  // =============================================================================
  // Global Instance
  // =============================================================================

  let globalTracker = null;

  function init(config) {
    if (globalTracker) {
      return globalTracker;
    }

    globalTracker = new OwlinTracker(config);
    return globalTracker;
  }

  function getTracker() {
    if (!globalTracker) {
      throw new Error('[Owlin Tracker] Not initialized. Call init() first.');
    }
    return globalTracker;
  }

  function destroy() {
    if (globalTracker) {
      globalTracker.destroy();
      globalTracker = null;
    }
  }

  // =============================================================================
  // Exports
  // =============================================================================

  exports.OwlinTracker = OwlinTracker;
  exports.init = init;
  exports.getTracker = getTracker;
  exports.destroy = destroy;
  exports.EventSender = EventSender;
  exports.ClickCollector = ClickCollector;
  exports.InputCollector = InputCollector;
  exports.NavigationCollector = NavigationCollector;
  exports.ApiCollector = ApiCollector;
  exports.ErrorCollector = ErrorCollector;
});
