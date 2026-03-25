import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ErrorTypes,
  hasSpecificServerMessage,
  parseError,
  formatConflictDetails,
  formatValidationErrors,
  retryWithBackoff,
} from './errorHandling';

// ─── hasSpecificServerMessage ─────────────────────────────────────────────────

describe('hasSpecificServerMessage', () => {
  it('returns false for null', () => {
    expect(hasSpecificServerMessage(null)).toBe(false);
  });

  it('returns false for error without message', () => {
    expect(hasSpecificServerMessage({})).toBe(false);
  });

  it('returns false for AbortError', () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    expect(hasSpecificServerMessage(err)).toBe(false);
  });

  it('returns false for generic "Request failed" message', () => {
    expect(hasSpecificServerMessage({ message: 'Request failed' })).toBe(false);
  });

  it('returns false for "Request failed with status 500" pattern', () => {
    expect(hasSpecificServerMessage({ message: 'Request failed with status 500' })).toBe(false);
  });

  it('returns false for "Failed to fetch"', () => {
    expect(hasSpecificServerMessage({ message: 'Failed to fetch' })).toBe(false);
  });

  it('returns false for "Load failed"', () => {
    expect(hasSpecificServerMessage({ message: 'Load failed' })).toBe(false);
  });

  it('returns true for a descriptive server message', () => {
    expect(hasSpecificServerMessage({ message: 'Student already enrolled in this class' })).toBe(true);
  });
});

// ─── parseError ───────────────────────────────────────────────────────────────

describe('parseError', () => {
  it('returns UNKNOWN type for null/undefined', () => {
    expect(parseError(null).type).toBe(ErrorTypes.UNKNOWN);
    expect(parseError(undefined).type).toBe(ErrorTypes.UNKNOWN);
  });

  it('returns TIMEOUT type for AbortError', () => {
    const err = new Error('abort');
    err.name = 'AbortError';
    expect(parseError(err).type).toBe(ErrorTypes.TIMEOUT);
  });

  it('returns TIMEOUT type for timeout in message', () => {
    expect(parseError({ message: 'request timeout exceeded' }).type).toBe(ErrorTypes.TIMEOUT);
  });

  it('returns NETWORK type for "Failed to fetch"', () => {
    expect(parseError({ message: 'Failed to fetch' }).type).toBe(ErrorTypes.NETWORK);
  });

  it('returns AUTHORIZATION type for 401 status', () => {
    expect(parseError({ status: 401 }).type).toBe(ErrorTypes.AUTHORIZATION);
  });

  it('returns AUTHORIZATION type for 403 status', () => {
    expect(parseError({ status: 403 }).type).toBe(ErrorTypes.AUTHORIZATION);
  });

  it('returns NOT_FOUND type for 404 status', () => {
    expect(parseError({ status: 404 }).type).toBe(ErrorTypes.NOT_FOUND);
  });

  it('returns CONFLICT type for 409 status', () => {
    expect(parseError({ status: 409 }).type).toBe(ErrorTypes.CONFLICT);
  });

  it('returns VALIDATION type for 400 status', () => {
    expect(parseError({ status: 400 }).type).toBe(ErrorTypes.VALIDATION);
  });

  it('preserves existing error.type when already structured', () => {
    const err = { type: ErrorTypes.SYNC, message: 'sync failed' };
    expect(parseError(err).type).toBe(ErrorTypes.SYNC);
  });

  it('includes status in the result', () => {
    expect(parseError({ status: 404, message: 'not found' }).status).toBe(404);
  });

  it('uses error.message in the parsed result', () => {
    expect(parseError({ status: 400, message: 'bad data' }).message).toBe('bad data');
  });
});

// ─── formatConflictDetails ───────────────────────────────────────────────────

describe('formatConflictDetails', () => {
  it('returns generic message when conflict is null', () => {
    expect(formatConflictDetails(null)).toContain('conflict');
  });

  it('returns generic message when conflict has no details', () => {
    expect(formatConflictDetails({})).toContain('conflict');
  });

  it('uses teacherName and conflictingClass when present', () => {
    const conflict = { details: { teacherName: 'Mr. Smith', conflictingClass: 'Class 5A' } };
    const msg = formatConflictDetails(conflict);
    expect(msg).toContain('Mr. Smith');
    expect(msg).toContain('Class 5A');
  });

  it('uses details.message as fallback when no teacherName', () => {
    const conflict = { details: { message: 'Custom conflict reason' } };
    expect(formatConflictDetails(conflict)).toBe('Custom conflict reason');
  });
});

// ─── formatValidationErrors ───────────────────────────────────────────────────

describe('formatValidationErrors', () => {
  it('returns default message array for null error', () => {
    const result = formatValidationErrors(null);
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns error details when details is an array', () => {
    const error = { details: ['name is required', 'class is required'] };
    expect(formatValidationErrors(error)).toEqual(['name is required', 'class is required']);
  });

  it('formats object details as field:message pairs', () => {
    const error = { details: { name: 'required', email: 'invalid' } };
    const result = formatValidationErrors(error);
    expect(result).toContain('name: required');
    expect(result).toContain('email: invalid');
  });

  it('wraps string details in an array', () => {
    const error = { details: 'Validation failed' };
    expect(formatValidationErrors(error)).toEqual(['Validation failed']);
  });

  it('returns default message when error has no details', () => {
    const result = formatValidationErrors({ status: 400 });
    expect(result[0]).toContain('Invalid');
  });
});

// ─── retryWithBackoff ─────────────────────────────────────────────────────────

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves on first successful attempt', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const promise = retryWithBackoff(fn, 3, 0);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on transient error and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ message: 'transient', status: 500 })
      .mockResolvedValue('success');
    const promise = retryWithBackoff(fn, 3, 0);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 401 (authorization error)', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 401, message: 'Unauthorized' });
    const promise = retryWithBackoff(fn, 3, 0);
    promise.catch(() => {}); // suppress unhandled rejection warning
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toBeDefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 404 (not found error)', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 404, message: 'Not found' });
    const promise = retryWithBackoff(fn, 3, 0);
    promise.catch(() => {}); // suppress unhandled rejection warning
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toBeDefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry on validation error (400)', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 400, message: 'Bad request' });
    const promise = retryWithBackoff(fn, 3, 0);
    promise.catch(() => {}); // suppress unhandled rejection warning
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toBeDefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries and throws last error', async () => {
    const err = { message: 'Server error', status: 500 };
    const fn = vi.fn().mockRejectedValue(err);
    const promise = retryWithBackoff(fn, 2, 0);
    promise.catch(() => {}); // suppress unhandled rejection warning
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toBeDefined();
    expect(fn).toHaveBeenCalledTimes(2); // maxRetries attempts only
  });
});
