import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Keep the unit isolated from env-coupled config and the real socket.io client.
// The reconnect branch under test never calls `io()`, so a stub is enough.
vi.mock('socket.io-client', () => ({ io: vi.fn() }));
vi.mock('../config/api.js', () => ({ SOCKET_URL: 'http://localhost:3001' }));
vi.mock('../utils/logger', () => ({
  default: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import socketService from './socketServiceEnhanced';

// Minimal event emitter that mirrors the slice of the socket.io client API the
// reconnect path uses: once()/off()/emit() plus a `connected` flag.
function createFakeSocket() {
  const handlers = new Map(); // event -> Set<fn>
  return {
    connected: false,
    once(event, fn) {
      const wrapper = (...args) => {
        this.off(event, wrapper);
        fn(...args);
      };
      wrapper._original = fn;
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event).add(wrapper);
    },
    off(event, fn) {
      const set = handlers.get(event);
      if (!set) return;
      for (const registered of set) {
        if (registered === fn || registered._original === fn) set.delete(registered);
      }
    },
    emit(event, ...args) {
      const set = handlers.get(event);
      if (!set) return;
      for (const registered of [...set]) registered(...args);
    },
    listenerCount(event) {
      return handlers.get(event)?.size ?? 0;
    },
  };
}

describe('socketServiceEnhanced.connect() reconnect path — MEM-07', () => {
  let fakeSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    // Reset the singleton into the "socket exists but is disconnected" state.
    fakeSocket = createFakeSocket();
    socketService.socket = fakeSocket;
    socketService.connected = false;
    socketService.authenticated = false;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    socketService.socket = null;
  });

  it('removes the once("authenticated") listener when the reconnect timeout fires', async () => {
    const promise = socketService.connect();
    // Avoid an unhandled rejection while timers advance.
    const settled = promise.catch((err) => err);

    expect(fakeSocket.listenerCount('authenticated')).toBe(1);

    vi.advanceTimersByTime(5000);
    const err = await settled;

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Reconnection timeout');
    // Regression: the listener must be gone after the timeout rejects.
    expect(fakeSocket.listenerCount('authenticated')).toBe(0);
  });

  it('does not accrue listeners across repeated connect() calls on a down server', async () => {
    const settled = [];
    for (let i = 0; i < 5; i++) {
      settled.push(socketService.connect().catch((e) => e));
    }

    expect(fakeSocket.listenerCount('authenticated')).toBe(5);

    vi.advanceTimersByTime(5000);
    await Promise.all(settled);

    expect(fakeSocket.listenerCount('authenticated')).toBe(0);
  });

  it('resolves and clears the listener when authentication arrives before the timeout', async () => {
    const promise = socketService.connect();

    expect(fakeSocket.listenerCount('authenticated')).toBe(1);

    fakeSocket.emit('authenticated');
    await expect(promise).resolves.toBeUndefined();
    // once() auto-removed the listener on fire.
    expect(fakeSocket.listenerCount('authenticated')).toBe(0);

    // The pending timeout must not reject the already-resolved promise.
    vi.advanceTimersByTime(5000);
    await expect(promise).resolves.toBeUndefined();
  });
});
