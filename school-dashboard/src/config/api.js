/**
 * Centralized API configuration.
 * All API and socket URLs must be imported from here — never hardcoded inline.
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// Derive socket URL from API_URL by stripping the /api suffix, unless explicitly set
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/?$/, '');
