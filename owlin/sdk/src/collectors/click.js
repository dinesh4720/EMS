/**
 * Click Collector for Owlin Tracker
 * Captures all mouse click events with element details
 */

import { getElementSelector, getElementText, getElementAttributes, getElementHierarchy, getViewportInfo, getScrollPosition } from '../utils/dom.js';

export class ClickCollector {
  constructor(tracker) {
    this.tracker = tracker;
    this.handleClick = this.handleClick.bind(this);
    this.isEnabled = true;
  }

  /**
   * Start capturing clicks
   */
  start() {
    document.addEventListener('click', this.handleClick, true);
  }

  /**
   * Stop capturing clicks
   */
  stop() {
    document.removeEventListener('click', this.handleClick, true);
  }

  /**
   * Handle click event
   */
  handleClick(event) {
    if (!this.isEnabled) return;

    const element = event.target;
    if (!element) return;

    // Ignore clicks on tracker's own elements
    if (element.closest('[data-owlin-ignore]')) return;

    const clickData = {
      type: 'click',
      element: {
        selector: getElementSelector(element),
        tagName: element.tagName?.toLowerCase() || 'unknown',
        text: getElementText(element, 50),
        attributes: getElementAttributes(element),
        hierarchy: getElementHierarchy(element),
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

    // Add href for links
    if (element.tagName === 'A' && element.href) {
      clickData.element.href = element.href;
    }

    // Add form info
    const form = element.closest('form');
    if (form) {
      clickData.form = {
        id: form.id || undefined,
        action: form.action || undefined,
        method: form.method || undefined,
      };
    }

    this.tracker.track(clickData);
  }

  /**
   * Enable click tracking
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable click tracking
   */
  disable() {
    this.isEnabled = false;
  }
}
