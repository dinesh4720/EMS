/**
 * Shared defaults for API service modules.
 *
 * [PAG-30] Default cap for fetch-all calls over naturally bounded collections.
 * These endpoints (PTM sessions, transport vehicles, super-admin schools,
 * calendar events, etc.) are bounded today, but the call should never be
 * truly unbounded — a missing `limit` would let the server stream the
 * entire collection. The cap is a defense-in-depth backstop; callers may
 * pass a smaller explicit limit when they only need a page. The server-side
 * `max` is the authoritative ceiling; this is the floor.
 */
export const DEFAULT_FETCH_LIMIT = 500;

/**
 * Returns `params` with a default `limit` applied when one is not already
 * present. Preserves any explicit caller-provided limit.
 */
export const withDefaultLimit = (params) =>
  params && Object.prototype.hasOwnProperty.call(params, 'limit')
    ? params
    : { ...(params || {}), limit: DEFAULT_FETCH_LIMIT };
