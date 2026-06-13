import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * environment.js validates required env vars at module-evaluation time.
 * Because the top-level validator runs immediately on import, each test uses
 * vi.resetModules() plus a dynamic import of the module under test so the
 * validation logic can be exercised with different env shapes.
 */

describe('environment validation', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv);
  });

  it('does not throw in development mode even when VITE_API_URL is missing', async () => {
    const env = { DEV: true };
    const { validateEnvironment } = await import('./environment.js');
    expect(() => validateEnvironment(env)).not.toThrow();
  });

  it('throws in production mode when VITE_API_URL is missing', async () => {
    const env = { DEV: false };
    const { validateEnvironment } = await import('./environment.js');
    expect(() => validateEnvironment(env)).toThrow(
      'Missing required environment variable: VITE_API_URL'
    );
  });

  it('throws in production mode when VITE_API_URL is an empty string', async () => {
    const env = { DEV: false, VITE_API_URL: '   ' };
    const { validateEnvironment } = await import('./environment.js');
    expect(() => validateEnvironment(env)).toThrow(
      'Missing required environment variable: VITE_API_URL'
    );
  });

  it('throws in production mode when VITE_API_URL is a placeholder', async () => {
    const env = { DEV: false, VITE_API_URL: 'https://your-backend-url.example.com/api' };
    const { validateEnvironment } = await import('./environment.js');
    expect(() => validateEnvironment(env)).toThrow(
      'VITE_API_URL is still set to the placeholder value'
    );
  });

  it('throws in production mode when optional VITE_SOCKET_URL is a placeholder', async () => {
    const env = {
      DEV: false,
      VITE_API_URL: 'https://api.myapp.com/api',
      VITE_SOCKET_URL: 'https://your-socket-server.example.com',
    };
    const { validateEnvironment } = await import('./environment.js');
    expect(() => validateEnvironment(env)).toThrow(
      'VITE_SOCKET_URL is still set to the placeholder value'
    );
  });

  it('passes when required and optional variables are valid in production', async () => {
    const env = {
      DEV: false,
      VITE_API_URL: 'https://api.myapp.com/api',
      VITE_SOCKET_URL: 'https://socket.myapp.com',
    };
    const { validateEnvironment } = await import('./environment.js');
    expect(() => validateEnvironment(env)).not.toThrow();
  });

  it('passes when only the required variable is set in production', async () => {
    const env = {
      DEV: false,
      VITE_API_URL: 'https://api.myapp.com/api',
    };
    const { validateEnvironment } = await import('./environment.js');
    expect(() => validateEnvironment(env)).not.toThrow();
  });

  it('treats DEV: undefined as production and validates', async () => {
    const env = { VITE_API_URL: 'https://api.myapp.com/api' };
    const { validateEnvironment } = await import('./environment.js');
    expect(() => validateEnvironment(env)).not.toThrow();
  });
});
