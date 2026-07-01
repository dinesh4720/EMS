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

/**
 * CONFIG_ERROR drives the plain-DOM config-error page rendered in main.jsx
 * before React mounts. In production it must reject a plaintext / mixed-content
 * API or socket URL so credentials never travel over http on an https app.
 * The DEV branch short-circuits, so these tests force DEV: false.
 */
describe('config/api CONFIG_ERROR https enforcement', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv);
  });

  it('is null in development regardless of scheme', async () => {
    import.meta.env.DEV = true;
    import.meta.env.VITE_API_URL = 'http://localhost:3002/api';
    const api = await import('./api.js');
    expect(api.CONFIG_ERROR).toBeNull();
  });

  it('flags a plaintext http:// VITE_API_URL in production', async () => {
    import.meta.env.DEV = false;
    import.meta.env.VITE_API_URL = 'http://api.school.com/api';
    delete import.meta.env.VITE_SOCKET_URL;
    const api = await import('./api.js');
    expect(api.CONFIG_ERROR).toMatch(/must use https:\/\//);
  });

  it('flags a scheme-less VITE_API_URL in production', async () => {
    import.meta.env.DEV = false;
    import.meta.env.VITE_API_URL = 'api.school.com/api';
    delete import.meta.env.VITE_SOCKET_URL;
    const api = await import('./api.js');
    expect(api.CONFIG_ERROR).toMatch(/must use https:\/\//);
  });

  it('accepts an https:// VITE_API_URL in production', async () => {
    import.meta.env.DEV = false;
    import.meta.env.VITE_API_URL = 'https://api.school.com/api';
    delete import.meta.env.VITE_SOCKET_URL;
    const api = await import('./api.js');
    expect(api.CONFIG_ERROR).toBeNull();
  });

  it('flags a plaintext ws:// VITE_SOCKET_URL in production', async () => {
    import.meta.env.DEV = false;
    import.meta.env.VITE_API_URL = 'https://api.school.com/api';
    import.meta.env.VITE_SOCKET_URL = 'ws://sockets.school.com';
    const api = await import('./api.js');
    expect(api.CONFIG_ERROR).toMatch(/must use https:\/\/ or wss:\/\//);
  });

  it('accepts a wss:// VITE_SOCKET_URL in production', async () => {
    import.meta.env.DEV = false;
    import.meta.env.VITE_API_URL = 'https://api.school.com/api';
    import.meta.env.VITE_SOCKET_URL = 'wss://sockets.school.com';
    const api = await import('./api.js');
    expect(api.CONFIG_ERROR).toBeNull();
  });
});
