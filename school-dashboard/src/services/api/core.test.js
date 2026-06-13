// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for the pure utility function parseRetryAfterMs (internal) and
 * the exported clearApiCache function in core.js.
 *
 * The `request()` function itself is integration-level (uses fetch, queryClient,
 * requestQueue, etc.) and is tested via integration/E2E suites.
 *
 * Here we verify the thin utility logic via observable side effects.
 */

// ─── Mock heavy dependencies before importing core ────────────────────────────

vi.mock('../../lib/queryClient.js', () => ({
  queryClient: {
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
  },
}));

vi.mock('../../utils/requestQueue.js', () => ({
  requestQueue: {
    add: vi.fn().mockImplementation((fn) => fn()),
    applyRateLimitCooldown: vi.fn(),
  },
  retryRequest: vi.fn().mockImplementation((fn) => fn()),
}));

vi.mock('../../utils/authSession', () => ({
  clearStoredUser: vi.fn(),
  getAuthHeaders: vi.fn().mockImplementation((h) => h),
}));

vi.mock('../../config/api.js', () => ({
  API_URL: 'http://localhost:3002/api',
}));

import { clearApiCache } from './core';
import { queryClient } from '../../lib/queryClient.js';

// ─── clearApiCache ────────────────────────────────────────────────────────────

describe('clearApiCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls queryClient.invalidateQueries when invoked', () => {
    clearApiCache();
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
  });

  it('does not throw when called', () => {
    expect(() => clearApiCache()).not.toThrow();
  });

  it('can be called multiple times without error', () => {
    clearApiCache();
    clearApiCache();
    clearApiCache();
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(3);
  });
});

// ─── parseRetryAfterMs (indirectly via fetch mock) ────────────────────────────

describe('fetch request handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('resolves with JSON data on a 200 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ students: [] }),
    });

    const { request } = await import('./core');
    const result = await request('/students');
    expect(result).toEqual({ students: [] });
  });

  it('returns null for a 204 No Content response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: vi.fn(),
    });

    const { request } = await import('./core');
    const result = await request('/students/1', { method: 'DELETE' });
    expect(result).toBeNull();
  });

  it('throws an error with status for a 404 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: vi.fn().mockReturnValue(null) },
      json: vi.fn().mockResolvedValue({ error: 'Not found' }),
    });

    const { request } = await import('./core');
    await expect(request('/students/missing')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('throws a 409 ConflictError with type ConflictError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      headers: { get: vi.fn().mockReturnValue(null) },
      json: vi.fn().mockResolvedValue({ message: 'Duplicate entry', details: { field: 'email' } }),
    });

    const { request } = await import('./core');
    await expect(request('/students', { method: 'POST' })).rejects.toMatchObject({
      status: 409,
      type: 'ConflictError',
    });
  });

  it('throws a rate limit error with status 429 for Too Many Requests', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: vi.fn().mockReturnValue('60') },
      json: vi.fn().mockResolvedValue({ error: 'Too many requests' }),
    });

    const { request } = await import('./core');
    await expect(request('/students')).rejects.toMatchObject({
      status: 429,
      code: 'RATE_LIMITED',
      retryAfterMs: 60000,
    });
  });

  it('normalizes every thrown error to a single ApiError shape', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: vi.fn().mockReturnValue(null) },
      json: vi.fn().mockResolvedValue({ error: 'Boom' }),
    });

    const { request, ApiError } = await import('./core');
    await expect(request('/students')).rejects.toBeInstanceOf(ApiError);
    await expect(request('/students')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      code: 'SERVER',
      message: 'Boom',
    });
  });

  it('surfaces the first field-level message for a 400 validation error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: vi.fn().mockReturnValue(null) },
      json: vi.fn().mockResolvedValue({
        error: 'Validation failed',
        details: [{ message: 'Must be a valid email address' }],
      }),
    });

    const { request } = await import('./core');
    await expect(request('/students', { method: 'POST' })).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION',
      message: 'Must be a valid email address',
    });
  });

  it('classifies a transport failure (fetch reject) as a network ApiError', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const { request } = await import('./core');
    await expect(request('/students')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'NETWORK',
    });
  });

  it('on an unrecoverable 401, clears the session and emits session-expired', async () => {
    // First call (the request) → 401; second call (token refresh) → not ok.
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: { get: vi.fn().mockReturnValue(null) },
        json: vi.fn().mockResolvedValue({ error: 'Token expired' }),
      })
      .mockResolvedValueOnce({ ok: false, status: 401 });

    const sessionExpired = vi.fn();
    window.addEventListener('session-expired', sessionExpired, { once: true });

    const { request } = await import('./core');
    const { clearStoredUser } = await import('../../utils/authSession');

    await expect(request('/students')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });
    expect(clearStoredUser).toHaveBeenCalledTimes(1);
    expect(sessionExpired).toHaveBeenCalledTimes(1);
    expect(sessionExpired.mock.calls[0][0].detail.message).toMatch(/session has expired/i);
  });
});
