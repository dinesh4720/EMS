/**
 * Vitest global setup — runs before every test file (see `setupFiles` in
 * vite.config.js).
 *
 * Web Storage polyfill
 * --------------------
 * Node >= 22 ships an experimental global `localStorage`. Unless the process is
 * started with `--localstorage-file`, that global resolves to `undefined`, and
 * because it is defined on `globalThis` it shadows the `localStorage` jsdom
 * would otherwise provide. The net effect under Node 22+ is that `sessionStorage`
 * works but `localStorage` is `undefined`, so unit tests touching localStorage
 * throw `Cannot read properties of undefined`.
 *
 * To keep the suite stable across Node versions (CI runs Node 22, local dev may
 * run newer), we install a faithful in-memory Web Storage implementation when
 * `localStorage` is missing. Both `localStorage` and `sessionStorage` are made
 * instances of the same `Storage` class so that `vi.spyOn(Storage.prototype, …)`
 * — used by several tests to simulate "storage disabled" — patches the prototype
 * both areas actually use. When jsdom already provides a working `localStorage`
 * (e.g. older Node), this block is skipped and the native implementation is used.
 */
if (typeof localStorage === 'undefined') {
  const backing = new WeakMap();

  class MemoryStorage {
    constructor() {
      backing.set(this, new Map());
    }

    get length() {
      return backing.get(this).size;
    }

    key(index) {
      const keys = Array.from(backing.get(this).keys());
      return index >= 0 && index < keys.length ? keys[index] : null;
    }

    getItem(key) {
      const store = backing.get(this);
      return store.has(String(key)) ? store.get(String(key)) : null;
    }

    setItem(key, value) {
      backing.get(this).set(String(key), String(value));
    }

    removeItem(key) {
      backing.get(this).delete(String(key));
    }

    clear() {
      backing.get(this).clear();
    }
  }

  const localStore = new MemoryStorage();
  const sessionStore = new MemoryStorage();

  globalThis.Storage = MemoryStorage;
  globalThis.localStorage = localStore;
  globalThis.sessionStorage = sessionStore;

  if (typeof window !== 'undefined') {
    window.Storage = MemoryStorage;
    window.localStorage = localStore;
    window.sessionStorage = sessionStore;
  }
}
