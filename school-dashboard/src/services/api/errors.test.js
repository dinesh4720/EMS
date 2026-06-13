// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  ApiError,
  ApiErrorCode,
  codeForStatus,
  parseRetryAfterMs,
  extractServerMessage,
  buildHttpError,
  normalizeApiError,
  notifySessionExpired,
  isAbortError,
  SESSION_EXPIRED_EVENT,
} from './errors.js';

// ─── ApiError ─────────────────────────────────────────────────────────────────

describe('ApiError', () => {
  it('is an Error with a stable name and default code', () => {
    const err = new ApiError('boom');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
    expect(err.message).toBe('boom');
    expect(err.code).toBe(ApiErrorCode.UNKNOWN);
    expect(err.status).toBeNull();
    expect(err.details).toBeNull();
    expect(err.retryAfterMs).toBeNull();
  });

  it('falls back to a friendly default message for the code when none is given', () => {
    expect(new ApiError(null, { code: ApiErrorCode.OFFLINE }).message).toMatch(/offline/i);
    expect(new ApiError('', { code: ApiErrorCode.UNAUTHORIZED }).message).toMatch(/session has expired/i);
  });

  it('tags conflict errors with type=ConflictError for back-compat', () => {
    const err = new ApiError('dup', { status: 409, code: ApiErrorCode.CONFLICT });
    expect(err.type).toBe('ConflictError');
    expect(err.isConflict).toBe(true);
  });

  it('does not set type for non-conflict errors', () => {
    expect(new ApiError('x', { code: ApiErrorCode.VALIDATION }).type).toBeUndefined();
  });

  it('exposes correct boolean getters per code', () => {
    expect(new ApiError('', { code: ApiErrorCode.UNAUTHORIZED }).isAuthError).toBe(true);
    expect(new ApiError('', { code: ApiErrorCode.FORBIDDEN }).isForbidden).toBe(true);
    expect(new ApiError('', { code: ApiErrorCode.NOT_FOUND }).isNotFound).toBe(true);
    expect(new ApiError('', { code: ApiErrorCode.VALIDATION }).isValidation).toBe(true);
    expect(new ApiError('', { code: ApiErrorCode.RATE_LIMITED }).isRateLimited).toBe(true);
    expect(new ApiError('', { code: ApiErrorCode.SERVER }).isServerError).toBe(true);
    expect(new ApiError('', { code: ApiErrorCode.TIMEOUT }).isTimeout).toBe(true);
    expect(new ApiError('', { code: ApiErrorCode.OFFLINE }).isOffline).toBe(true);
  });

  it('treats offline and timeout as network-class failures', () => {
    expect(new ApiError('', { code: ApiErrorCode.OFFLINE }).isNetwork).toBe(true);
    expect(new ApiError('', { code: ApiErrorCode.TIMEOUT }).isNetwork).toBe(true);
    expect(new ApiError('', { code: ApiErrorCode.NETWORK }).isNetwork).toBe(true);
    expect(new ApiError('', { code: ApiErrorCode.VALIDATION }).isNetwork).toBe(false);
  });

  it('serializes to a stack-free JSON view', () => {
    const json = new ApiError('nope', { status: 422, code: ApiErrorCode.VALIDATION, details: [{ message: 'bad' }] }).toJSON();
    expect(json).toEqual({
      name: 'ApiError',
      message: 'nope',
      status: 422,
      code: ApiErrorCode.VALIDATION,
      details: [{ message: 'bad' }],
      retryAfterMs: null,
    });
  });
});

// ─── codeForStatus ──────────────────────────────────────────────────────────────

describe('codeForStatus', () => {
  it('maps common statuses to stable codes', () => {
    expect(codeForStatus(400)).toBe(ApiErrorCode.VALIDATION);
    expect(codeForStatus(401)).toBe(ApiErrorCode.UNAUTHORIZED);
    expect(codeForStatus(403)).toBe(ApiErrorCode.FORBIDDEN);
    expect(codeForStatus(404)).toBe(ApiErrorCode.NOT_FOUND);
    expect(codeForStatus(409)).toBe(ApiErrorCode.CONFLICT);
    expect(codeForStatus(422)).toBe(ApiErrorCode.VALIDATION);
    expect(codeForStatus(429)).toBe(ApiErrorCode.RATE_LIMITED);
    expect(codeForStatus(500)).toBe(ApiErrorCode.SERVER);
    expect(codeForStatus(503)).toBe(ApiErrorCode.SERVER);
    expect(codeForStatus(418)).toBe(ApiErrorCode.UNKNOWN);
  });
});

// ─── parseRetryAfterMs ──────────────────────────────────────────────────────────

describe('parseRetryAfterMs', () => {
  it('returns null for missing header', () => {
    expect(parseRetryAfterMs(null)).toBeNull();
    expect(parseRetryAfterMs(undefined)).toBeNull();
    expect(parseRetryAfterMs('')).toBeNull();
  });

  it('parses delta-seconds into milliseconds', () => {
    expect(parseRetryAfterMs('60')).toBe(60000);
    expect(parseRetryAfterMs('0')).toBe(0);
  });

  it('parses an HTTP-date into a non-negative delay', () => {
    const future = new Date(Date.now() + 30000).toUTCString();
    const ms = parseRetryAfterMs(future);
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(30000);
  });

  it('returns null for an unparseable value', () => {
    expect(parseRetryAfterMs('not-a-date')).toBeNull();
  });
});

// ─── extractServerMessage ───────────────────────────────────────────────────────

describe('extractServerMessage', () => {
  it('prefers the first field-level validation message for a 400', () => {
    const body = { error: 'Validation failed', details: [{ message: 'Email is invalid' }] };
    expect(extractServerMessage(body, 400)).toBe('Email is invalid');
  });

  it('falls back to error then message', () => {
    expect(extractServerMessage({ error: 'Nope' }, 500)).toBe('Nope');
    expect(extractServerMessage({ message: 'Conflict' }, 409)).toBe('Conflict');
  });

  it('returns null when nothing usable is present', () => {
    expect(extractServerMessage({}, 500)).toBeNull();
    expect(extractServerMessage(null, 500)).toBeNull();
    expect(extractServerMessage('string-body', 500)).toBeNull();
  });
});

// ─── buildHttpError ─────────────────────────────────────────────────────────────

describe('buildHttpError', () => {
  it('builds a conflict error for 409 with type and details', () => {
    const err = buildHttpError(409, { message: 'Duplicate', details: { field: 'email' } });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(err.code).toBe(ApiErrorCode.CONFLICT);
    expect(err.type).toBe('ConflictError');
    expect(err.message).toBe('Duplicate');
    expect(err.details).toEqual({ field: 'email' });
  });

  it('treats a 422 tagged ConflictError as a conflict', () => {
    const err = buildHttpError(422, { type: 'ConflictError', message: 'Overlap' });
    expect(err.code).toBe(ApiErrorCode.CONFLICT);
    expect(err.type).toBe('ConflictError');
  });

  it('treats a plain 422 as a validation error', () => {
    const err = buildHttpError(422, { error: 'Unprocessable' });
    expect(err.code).toBe(ApiErrorCode.VALIDATION);
    expect(err.type).toBeUndefined();
  });

  it('builds a rate-limit error from the Retry-After header', () => {
    const headers = { get: (name) => (name === 'retry-after' ? '120' : null) };
    const err = buildHttpError(429, { error: 'slow down' }, { headers });
    expect(err.status).toBe(429);
    expect(err.code).toBe(ApiErrorCode.RATE_LIMITED);
    expect(err.retryAfterMs).toBe(120000);
    // requestQueue / queryClient sniff the message — keep it recognizable.
    expect(err.message).toMatch(/too many requests/i);
  });

  it('surfaces the first validation message for a 400', () => {
    const err = buildHttpError(400, { error: 'Validation failed', details: [{ message: 'Must be a valid email address' }] });
    expect(err.status).toBe(400);
    expect(err.code).toBe(ApiErrorCode.VALIDATION);
    expect(err.message).toBe('Must be a valid email address');
    expect(err.details).toEqual([{ message: 'Must be a valid email address' }]);
  });

  it('falls back to a status message when the body is empty', () => {
    const err = buildHttpError(500, {});
    expect(err.code).toBe(ApiErrorCode.SERVER);
    expect(err.message).toBe('Request failed with status 500');
  });
});

// ─── normalizeApiError ──────────────────────────────────────────────────────────

describe('normalizeApiError', () => {
  afterEach(() => {
    // Restore navigator.onLine if a test overrode it.
    if (Object.getOwnPropertyDescriptor(navigator, 'onLine')?.configurable) {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    }
  });

  it('returns an existing ApiError untouched (idempotent)', () => {
    const original = new ApiError('x', { status: 404, code: ApiErrorCode.NOT_FOUND });
    expect(normalizeApiError(original)).toBe(original);
  });

  it('passes native AbortErrors through untouched', () => {
    const abort = new Error('Request aborted');
    abort.name = 'AbortError';
    expect(normalizeApiError(abort)).toBe(abort);
  });

  it('classifies a fetch TypeError as a network error and preserves the message', () => {
    const err = normalizeApiError(new TypeError('Failed to fetch'));
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe(ApiErrorCode.NETWORK);
    // Connectivity heuristics elsewhere sniff for "Failed to fetch" — keep it.
    expect(err.message).toBe('Failed to fetch');
  });

  it('classifies a transport failure as OFFLINE when the browser is offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const err = normalizeApiError(new TypeError('Failed to fetch'));
    expect(err.code).toBe(ApiErrorCode.OFFLINE);
    expect(err.isOffline).toBe(true);
  });

  it('normalizes a plain error carrying an HTTP status', () => {
    const raw = new Error('Server fell over');
    raw.status = 503;
    raw.details = { trace: 'abc' };
    const err = normalizeApiError(raw);
    expect(err.code).toBe(ApiErrorCode.SERVER);
    expect(err.status).toBe(503);
    expect(err.details).toEqual({ trace: 'abc' });
    expect(err.message).toBe('Server fell over');
  });

  it('wraps an unknown error and a bare string', () => {
    expect(normalizeApiError(new Error('weird')).code).toBe(ApiErrorCode.UNKNOWN);
    expect(normalizeApiError('just a string').message).toBe('just a string');
    expect(normalizeApiError(null)).toBeInstanceOf(ApiError);
  });
});

// ─── isAbortError ───────────────────────────────────────────────────────────────

describe('isAbortError', () => {
  it('detects AbortError by name', () => {
    const abort = new Error('cancelled');
    abort.name = 'AbortError';
    expect(isAbortError(abort)).toBe(true);
    expect(isAbortError(new Error('nope'))).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});

// ─── notifySessionExpired ───────────────────────────────────────────────────────

describe('notifySessionExpired', () => {
  it('dispatches a session-expired event carrying a message', () => {
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener, { once: true });
    notifySessionExpired('Your session has expired. Please log in again.');
    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0];
    expect(event.detail.message).toBe('Your session has expired. Please log in again.');
  });

  it('uses a sensible default message when none is provided', () => {
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener, { once: true });
    notifySessionExpired();
    expect(listener.mock.calls[0][0].detail.message).toMatch(/session has expired/i);
  });
});
