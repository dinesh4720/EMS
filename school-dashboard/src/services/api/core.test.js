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
    });
  });
});
