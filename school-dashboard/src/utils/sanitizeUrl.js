/**
 * URL protocol allowlist for href/src attributes.
 *
 * Use sanitizeUrl() on any URL that originates from user/external input
 * before assigning it to an <a href>, <img src>, etc. Disallows every
 * protocol except http(s)/mailto — neutralising `javascript:`, `data:`,
 * `vbscript:` and similar code-execution schemes.
 *
 * Defence-in-depth: browsers strip ASCII control characters (tabs, newlines,
 * etc.) from URLs at navigation time, so a payload like `java\nscript:`
 * evaluates as `javascript:`. We therefore strip all C0 control chars
 * (0x00–0x1F) and DEL (0x7F) from the entire URL *before* validating the
 * protocol — otherwise the allowlist regex would be bypassable.
 */

const SAFE_PROTOCOLS = /^(https?:|mailto:)/i;
// A leading URL scheme: an ASCII letter followed by letters/digits/+/-/. and a
// colon, anchored at the start. Distinguishes "this URL declares a protocol"
// (e.g. javascript:, data:) from a scheme-less relative URL.
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
// Browsers drop ASCII control chars (0x00–0x1F, 0x7F) at navigation time, so
// a payload like `java\nscript:` evaluates as `javascript:` unless we strip
// them ourselves before validating the protocol.
// eslint-disable-next-line no-control-regex -- intentional; this is the security guarantee.
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

/**
 * Return a URL safe to assign to href/src, or '#' if not allowed.
 *
 * @param {*} url - Candidate URL (coerced to string; non-strings rejected).
 * @returns {string} Sanitised URL, or '#' when the protocol is not allowlisted.
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') return '#';
  const cleaned = url.replace(CONTROL_CHARS, '').trim();
  if (!cleaned) return '#';
  // Protocol-relative URLs (//host/…) inherit the page scheme and can point at
  // an arbitrary origin — reject before the relative-URL allowance below.
  if (cleaned.startsWith('//')) return '#';
  // If the URL declares a scheme, it must be on the allowlist. This is what
  // neutralises javascript:, data:, vbscript:, etc.
  if (HAS_SCHEME.test(cleaned)) {
    return SAFE_PROTOCOLS.test(cleaned) ? cleaned : '#';
  }
  // No scheme and not protocol-relative → a same-origin relative URL (e.g.
  // `/students/1`, `?tab=x`, `#anchor`). Safe to keep intact — a scheme-looking
  // substring in a query/fragment is never parsed as the URL's protocol.
  return cleaned;
}

export default sanitizeUrl;
