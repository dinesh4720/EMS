/**
 * Type definitions and validation for tracking events
 */

// Event types
export const EventType = {
  PAGE_VIEW: 'page_view',
  CLICK: 'click',
  FORM_SUBMIT: 'form_submit',
  FORM_ERROR: 'form_error',
  API_CALL: 'api_call',
  ERROR: 'error',
  CUSTOM: 'custom'
}

// Event categories
export const EventCategory = {
  NAVIGATION: 'navigation',
  INTERACTION: 'interaction',
  FORM: 'form',
  API: 'api',
  PERFORMANCE: 'performance',
  ERROR: 'error',
  BUSINESS: 'business'
}

/**
 * Validate event data structure
 * @param {Object} event - Event to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateEvent(event) {
  const errors = []

  // Accept any non-empty type string — the SDK sends types like
  // 'user_identify', 'user_properties', 'session_start', 'pageview', 'navigation'
  // that are not in the original EventType enum.
  if (!event.type || typeof event.type !== 'string') {
    errors.push('Event must have a type string')
  }

  // Category is optional — default to INTERACTION if missing
  // (don't reject events just because category is missing/unknown)

  if (!event.timestamp || isNaN(new Date(event.timestamp).getTime())) {
    errors.push('Invalid timestamp')
  }

  if (!event.userId && !event.sessionId) {
    errors.push('Event must have either userId or sessionId')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate session data
 * @param {Object} session - Session to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateSession(session) {
  const errors = []

  if (!session.userId) {
    errors.push('Session must have userId')
  }

  if (!session.startTime || isNaN(new Date(session.startTime).getTime())) {
    errors.push('Session must have valid startTime')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Create a validated event object
 * @param {Object} data - Raw event data
 * @returns {Object} Validated event with defaults
 */
export function createEvent(data) {
  return {
    id: data.id || generateId(),
    type: data.type,
    category: data.category || EventCategory.INTERACTION,
    timestamp: data.timestamp || new Date().toISOString(),
    userId: data.userId || null,
    sessionId: data.sessionId || null,
    page: data.page || null,
    action: data.action || null,
    metadata: data.metadata || {},
    userAgent: data.userAgent || null,
    viewport: data.viewport || null,
    app: data.app || null,  // Include app data with user metadata
    session: data.session || null,  // Include session data
    ...data  // Include any other fields from the original event
  }
}

/**
 * Generate unique ID
 * @returns {string} UUID
 */
export function generateId() {
  return crypto.randomUUID()
}
