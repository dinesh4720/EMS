import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * api.js resolves API_URL / SOCKET_URL at module-evaluation time from
 * import.meta.env. Each test resets modules and re-imports under a controlled
 * env so the resolution logic can be exercised with different shapes.
 *
 * The SOCKET_URL derivation in particular must keep working whether API_URL
 * uses the legacy /api mount or the canonical /api/v1 mount — otherwise
 * moving API_URL to /api/v1 silently breaks the socket connection.
 */
describe('config/api URL resolution', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv);
  });

  it('DEV fallback resolves to /api/v1 (canonical v1 mount)', async () => {
    const api = await import('./api.js');
    expect(api.API_URL).toBe('http://localhost:3002/api/v1');
  });

  it('explicit VITE_API_URL is honored over the DEV fallback', async () => {
    import.meta.env.VITE_API_URL = 'https://api.example.com/api/v1';
    const api = await import('./api.js');
    expect(api.API_URL).toBe('https://api.example.com/api/v1');
  });

  it('SOCKET_URL strips the /api/v1 suffix to derive the socket origin', async () => {
    import.meta.env.VITE_API_URL = 'https://host.example.com/api/v1';
    const api = await import('./api.js');
    expect(api.SOCKET_URL).toBe('https://host.example.com');
  });

  it('SOCKET_URL strips the legacy /api suffix', async () => {
    import.meta.env.VITE_API_URL = 'https://host.example.com/api';
    const api = await import('./api.js');
    expect(api.SOCKET_URL).toBe('https://host.example.com');
  });

  it('SOCKET_URL tolerates a trailing slash on /api/v1/', async () => {
    import.meta.env.VITE_API_URL = 'https://host.example.com/api/v1/';
    const api = await import('./api.js');
    expect(api.SOCKET_URL).toBe('https://host.example.com');
  });

  it('explicit VITE_SOCKET_URL overrides derivation', async () => {
    import.meta.env.VITE_API_URL = 'https://host.example.com/api/v1';
    import.meta.env.VITE_SOCKET_URL = 'https://sockets.example.com';
    const api = await import('./api.js');
    expect(api.SOCKET_URL).toBe('https://sockets.example.com');
  });
});
