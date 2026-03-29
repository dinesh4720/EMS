/**
 * HTML sanitization utilities for preventing XSS attacks.
 *
 * Use escapeHtml() whenever injecting user-controlled data into
 * HTML strings (e.g. document.write, innerHTML, template literals
 * destined for raw HTML contexts).
 */

/**
 * Escape HTML special characters to prevent XSS injection.
 * Converts &, <, >, ", and ' into their HTML entity equivalents.
 *
 * @param {*} str - The value to escape (coerced to string)
 * @returns {string} - HTML-safe string
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
