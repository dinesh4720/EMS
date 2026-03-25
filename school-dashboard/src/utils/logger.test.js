import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setLogLevel } from './logger';

/**
 * logger.js wraps console methods and filters by level.
 * We test the exported API surface: setLogLevel, and the sanitization
 * of sensitive data by inspecting what the logger actually forwards
 * to the underlying console via spy.
 *
 * NOTE: import.meta.env.DEV is true in the vitest environment, so the
 * default active log level begins at 'debug'.
 */

describe('setLogLevel', () => {
  it('returns true for a valid level string', () => {
    expect(setLogLevel('warn')).toBe(true);
  });

  it('returns true for level provided in uppercase (case-insensitive)', () => {
    expect(setLogLevel('ERROR')).toBe(true);
  });

  it('returns false for an unrecognised level', () => {
    expect(setLogLevel('verbose')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(setLogLevel('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(setLogLevel(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(setLogLevel(undefined)).toBe(false);
  });

  it('accepts all six valid levels', () => {
    for (const level of ['trace', 'debug', 'info', 'warn', 'error', 'silent']) {
      expect(setLogLevel(level)).toBe(true);
    }
  });

  it('suppresses lower-priority messages after changing level', async () => {
    // Set level to 'silent' — nothing should be logged
    setLogLevel('silent');

    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { default: logger } = await import('./logger');
    logger.warn('should be suppressed');
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
    // Reset to debug for other tests
    setLogLevel('debug');
  });
});

describe('logger sanitization', () => {
  let consoleWarnSpy;

  beforeEach(() => {
    // Reset module cache so each test gets a fresh logger instance that
    // captures the spy as its originalConsole.warn
    vi.resetModules();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('redacts Bearer tokens in string arguments', async () => {
    const { default: logger, setLogLevel: setLevel } = await import('./logger');
    setLevel('warn');
    logger.warn('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig');
    const callArg = String(consoleWarnSpy.mock.calls[0]?.[0] ?? '');
    expect(callArg).not.toContain('eyJhbGciOiJIUzI1NiJ9');
  });

  it('redacts password key in objects', async () => {
    const { default: logger, setLogLevel: setLevel } = await import('./logger');
    setLevel('warn');
    logger.warn({ password: 'super-secret' });
    const callArg = JSON.stringify(consoleWarnSpy.mock.calls[0]?.[0] ?? {});
    expect(callArg).not.toContain('super-secret');
    expect(callArg).toContain('[REDACTED]');
  });

  it('redacts token key in objects', async () => {
    const { default: logger, setLogLevel: setLevel } = await import('./logger');
    setLevel('warn');
    logger.warn({ token: 'abc123' });
    const callArg = JSON.stringify(consoleWarnSpy.mock.calls[0]?.[0] ?? {});
    expect(callArg).not.toContain('abc123');
  });

  it('preserves non-sensitive object keys', async () => {
    const { default: logger, setLogLevel: setLevel } = await import('./logger');
    setLevel('warn');
    logger.warn({ userId: '42', name: 'Alice' });
    const callArg = JSON.stringify(consoleWarnSpy.mock.calls[0]?.[0] ?? {});
    expect(callArg).toContain('Alice');
    expect(callArg).toContain('42');
  });

  it('passes numbers through unchanged', async () => {
    const { default: logger, setLogLevel: setLevel } = await import('./logger');
    setLevel('warn');
    logger.warn(42);
    expect(consoleWarnSpy.mock.calls[0]?.[0]).toBe(42);
  });

  it('passes booleans through unchanged', async () => {
    const { default: logger, setLogLevel: setLevel } = await import('./logger');
    setLevel('warn');
    logger.warn(false);
    expect(consoleWarnSpy.mock.calls[0]?.[0]).toBe(false);
  });
});
