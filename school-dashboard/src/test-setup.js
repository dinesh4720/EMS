/**
 * Vitest setup file for school-dashboard unit tests.
 *
 * Node.js 22+ introduces an experimental localStorage API that does not
 * expose a working global `localStorage` without `--localstorage-file`.
 * This causes jsdom's `localStorage` to be shadowed / unavailable, breaking
 * any test that touches browser storage.
 *
 * We explicitly polyfill both `localStorage` and `sessionStorage` here so
 * unit tests run reliably across Node versions.
 */

function createMockStorage() {
  const store = new Map();
  return {
    getItem(key) {
      const value = store.get(String(key));
      return value === undefined ? null : value;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
  };
}

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = createMockStorage();
}
if (typeof globalThis.sessionStorage === 'undefined') {
  globalThis.sessionStorage = createMockStorage();
}
