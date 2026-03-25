/**
 * DOM Utilities for Owlin Tracker
 */

/**
 * Get a unique selector for an element
 */
export function getElementSelector(element) {
  if (!element || !element.tagName) return 'unknown';

  // Use id if available
  if (element.id) {
    return `#${element.id}`;
  }

  // Use data-testid if available (React convention)
  if (element.dataset && element.dataset.testid) {
    return `[data-testid="${element.dataset.testid}"]`;
  }

  // Build path from classes and tag
  let selector = element.tagName.toLowerCase();

  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      selector += '.' + classes.join('.');
    }
  }

  // Add nth-child if needed for uniqueness
  if (element.parentElement) {
    const siblings = Array.from(element.parentElement.children).filter(
      child => child.tagName === element.tagName
    );
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      selector += `:nth-child(${index})`;
    }
  }

  return selector;
}

/**
 * Get element text content (truncated)
 */
export function getElementText(element, maxLength = 100) {
  if (!element) return '';

  const text = element.textContent || element.innerText || '';
  return text.trim().substring(0, maxLength);
}

/**
 * Get element attributes
 */
export function getElementAttributes(element) {
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

/**
 * Check if element is interactive
 */
export function isInteractiveElement(element) {
  if (!element) return false;

  const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'OPTION'];
  const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio'];

  return (
    interactiveTags.includes(element.tagName) ||
    (element.getAttribute('role') && interactiveRoles.includes(element.getAttribute('role'))) ||
    element.onclick !== null ||
    element.style.cursor === 'pointer'
  );
}

/**
 * Find closest labeled text for an element
 */
export function findLabelText(element) {
  if (!element) return '';

  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Check associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent.trim();
  }

  // Check parent label
  const parentLabel = element.closest('label');
  if (parentLabel) {
    // Get text excluding the input itself
    const clone = parentLabel.cloneNode(true);
    const inputInClone = clone.querySelector('input, select, textarea');
    if (inputInClone) inputInClone.remove();
    return clone.textContent.trim();
  }

  return '';
}

/**
 * Mask sensitive data
 */
export function maskSensitiveData(value, type = 'text') {
  if (!value) return value;

  const sensitiveTypes = ['password', 'pin', 'ssn', 'creditcard', 'cvc', 'cvv'];
  const sensitiveNames = ['password', 'secret', 'token', 'ssn', 'card', 'credit', 'cvc', 'cvv', 'pin'];

  // Check if field is sensitive
  if (sensitiveTypes.includes(type.toLowerCase())) {
    return '***';
  }

  // Check name/placeholder for sensitive keywords
  const lowerValue = value.toLowerCase();
  for (const keyword of sensitiveNames) {
    if (lowerValue.includes(keyword)) {
      return '***';
    }
  }

  // Mask email addresses
  if (value.includes('@') && value.length > 5) {
    const [local, domain] = value.split('@');
    return `${local.charAt(0)}${'*'.repeat(Math.min(local.length - 1, 3))}@${domain}`;
  }

  // Mask long numeric strings (could be phone numbers, IDs)
  if (/^\d{8,}$/.test(value)) {
    return value.substring(0, 3) + '***' + value.substring(value.length - 2);
  }

  return value;
}

/**
 * Get element hierarchy for better context
 */
export function getElementHierarchy(element) {
  if (!element) return [];

  const hierarchy = [];
  let current = element;

  while (current && current !== document.body && hierarchy.length < 5) {
    const item = {
      tag: current.tagName?.toLowerCase() || 'unknown',
      id: current.id || undefined,
      class: current.className?.split?.(' ').filter(Boolean)[0] || undefined,
    };

    // Only add if has identifying info
    if (item.id || item.class) {
      hierarchy.unshift(item);
    }

    current = current.parentElement;
  }

  return hierarchy;
}

/**
 * Get viewport info
 */
export function getViewportInfo() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  };
}

/**
 * Get scroll position
 */
export function getScrollPosition() {
  return {
    x: window.scrollX || window.pageXOffset,
    y: window.scrollY || window.pageYOffset,
  };
}
