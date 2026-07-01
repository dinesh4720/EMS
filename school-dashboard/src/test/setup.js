/**
 * Shared Vitest setup.
 *
 * jsdom 29+ does not provision localStorage for some test origins, and Node's
 * experimental localStorage global is undefined without the --localstorage-file
 * flag. Provide a minimal in-memory Storage implementation so unit tests that
 * touch localStorage (safeStorage, pinnedPages, theme settings, etc.) run
 * reliably without changing production code.
 */

import { expect } from 'vitest';
import { configure } from '@testing-library/dom';
import * as matchers from 'vitest-axe/matchers';
import '@testing-library/jest-dom/vitest';
import 'vitest-axe/extend-expect';

expect.extend(matchers);

// `findBy*` / `waitFor` default to a 1000ms ceiling, which flakes for
// async-data components (axe scans + data fetches) under parallel CPU load —
// e.g. the Library/Staff a11y suites pass in isolation but intermittently time
// out in a full run. Raise the ceiling so slow-under-load renders don't time
// out. Tests that resolve quickly are unaffected: this is only an upper bound,
// not a fixed delay.
configure({ asyncUtilTimeout: 5000 });

function createMemoryStorage() {
  const store = new Map();
  return {
    get length() {
      return store.size;
    },
    key(index) {
      return [...store.keys()][index] ?? null;
    },
    getItem(key) {
      return store.has(String(key)) ? store.get(String(key)) : null;
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
  };
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryStorage(),
    writable: true,
    configurable: true,
  });
}

if (typeof globalThis.sessionStorage === 'undefined') {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createMemoryStorage(),
    writable: true,
    configurable: true,
  });
}
