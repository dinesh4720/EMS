/**
 * Input Collector for Owlin Tracker
 * Captures all form inputs, text areas with sensitive data masking
 */

import { getElementSelector, getElementText, findLabelText, maskSensitiveData, getElementHierarchy } from '../utils/dom.js';

export class InputCollector {
  constructor(tracker) {
    this.tracker = tracker;
    this.handleInput = this.handleInput.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.isEnabled = true;
    this.focusTimes = new Map();
  }

  /**
   * Start capturing inputs
   */
  start() {
    // Use capture phase for earlier detection
    document.addEventListener('input', this.handleInput, true);
    document.addEventListener('change', this.handleChange, true);
    document.addEventListener('focusin', this.handleFocus, true);
    document.addEventListener('focusout', this.handleBlur, true);
  }

  /**
   * Stop capturing inputs
   */
  stop() {
    document.removeEventListener('input', this.handleInput, true);
    document.removeEventListener('change', this.handleChange, true);
    document.removeEventListener('focusin', this.handleFocus, true);
    document.removeEventListener('focusout', this.handleBlur, true);
  }

  /**
   * Handle input events (typing, pasting, etc.)
   */
  handleInput(event) {
    if (!this.isEnabled) return;

    const element = event.target;
    if (!this.isTrackableInput(element)) return;

    const inputData = this.getInputEventData(element, 'input');

    // Track value change with masking
    if (element.type !== 'password' && !this.isSensitiveField(element)) {
      inputData.value = maskSensitiveData(element.value, element.type);
      inputData.valueLength = element.value.length;
    }

    this.tracker.track(inputData);
  }

  /**
   * Handle change events (dropdowns, checkboxes, radios)
   */
  handleChange(event) {
    if (!this.isEnabled) return;

    const element = event.target;
    if (!this.isTrackableInput(element)) return;

    const changeData = this.getInputEventData(element, 'change');

    // Add selection info for select elements
    if (element.tagName === 'SELECT') {
      const selectedOption = element.options[element.selectedIndex];
      changeData.selection = {
        index: element.selectedIndex,
        value: maskSensitiveData(element.value, element.type),
        text: selectedOption ? selectedOption.text : '',
      };
    }

    // Add checked state for checkboxes/radios
    if (element.type === 'checkbox' || element.type === 'radio') {
      changeData.checked = element.checked;
    }

    // Calculate time spent in field
    const focusTime = this.focusTimes.get(element);
    if (focusTime) {
      changeData.timeSpent = Date.now() - focusTime;
      this.focusTimes.delete(element);
    }

    this.tracker.track(changeData);
  }

  /**
   * Handle focus events
   */
  handleFocus(event) {
    if (!this.isEnabled) return;

    const element = event.target;
    if (!this.isTrackableInput(element)) return;

    // Record focus time for duration tracking
    this.focusTimes.set(element, Date.now());

    const focusData = this.getInputEventData(element, 'focus');
    this.tracker.track(focusData);
  }

  /**
   * Handle blur events
   */
  handleBlur(event) {
    if (!this.isEnabled) return;

    const element = event.target;
    if (!this.isTrackableInput(element)) return;

    // Calculate time spent in field
    const focusTime = this.focusTimes.get(element);
    let timeSpent = null;

    if (focusTime) {
      timeSpent = Date.now() - focusTime;
      this.focusTimes.delete(element);
    }

    const blurData = this.getInputEventData(element, 'blur');
    blurData.timeSpent = timeSpent;

    // Track validation state
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

  /**
   * Get base input event data
   */
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

  /**
   * Check if element is a trackable input
   */
  isTrackableInput(element) {
    if (!element) return false;

    const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
    if (!inputTags.includes(element.tagName)) return false;

    // Ignore tracker's own inputs
    if (element.closest('[data-owlin-ignore]')) return false;

    return true;
  }

  /**
   * Check if field contains sensitive data
   */
  isSensitiveField(element) {
    if (!element) return false;

    const sensitiveTypes = ['password', 'creditcard', 'cvc', 'cvv'];
    if (sensitiveTypes.includes(element.type?.toLowerCase())) {
      return true;
    }

    const sensitiveNames = ['password', 'secret', 'token', 'ssn', 'card', 'credit', 'cvc', 'cvv', 'pin'];
    const name = (element.name || element.id || element.className || '').toLowerCase();

    return sensitiveNames.some(sensitive => name.includes(sensitive));
  }

  /**
   * Enable input tracking
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable input tracking
   */
  disable() {
    this.isEnabled = false;
  }
}
