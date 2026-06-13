import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getPinnedPages,
  isPagePinned,
  togglePinnedPage,
  subscribePinnedPages,
} from './pinnedPages';

// Mock safeStorage so tests stay isolated from localStorage / jsdom quirks.
vi.mock('./safeStorage', () => ({
  safeGetItem: vi.fn(),
  safeSetItem: vi.fn(),
}));

import { safeGetItem, safeSetItem } from './safeStorage';

const KEY = 'ems.pinnedPages.v1';
const EVENT = 'ems:pinned-pages-changed';

describe('pinnedPages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    safeGetItem.mockReturnValue(null);
  });

  describe('getPinnedPages', () => {
    it('returns an empty array when nothing is stored', () => {
      expect(getPinnedPages()).toEqual([]);
    });

    it('returns parsed pins when valid JSON is stored', () => {
      safeGetItem.mockReturnValue(
        JSON.stringify([
          { href: '/students', label: 'Students' },
          { href: '/staff', label: 'Staff' },
        ])
      );
      expect(getPinnedPages()).toEqual([
        { href: '/students', label: 'Students' },
        { href: '/staff', label: 'Staff' },
      ]);
    });

    it('filters out invalid entries', () => {
      safeGetItem.mockReturnValue(
        JSON.stringify([
          { href: '/students', label: 'Students' },
          { href: 123, label: 'Bad' },
          { label: 'No href' },
          null,
        ])
      );
      expect(getPinnedPages()).toEqual([{ href: '/students', label: 'Students' }]);
    });

    it('returns an empty array when JSON is malformed', () => {
      safeGetItem.mockReturnValue('not json');
      expect(getPinnedPages()).toEqual([]);
    });

    it('returns an empty array when stored value is not an array', () => {
      safeGetItem.mockReturnValue(JSON.stringify({ href: '/students' }));
      expect(getPinnedPages()).toEqual([]);
    });
  });

  describe('isPagePinned', () => {
    it('returns false when no pins exist', () => {
      expect(isPagePinned('/students')).toBe(false);
    });

    it('returns true when the href is pinned', () => {
      safeGetItem.mockReturnValue(
        JSON.stringify([{ href: '/students', label: 'Students' }])
      );
      expect(isPagePinned('/students')).toBe(true);
    });

    it('returns false when the href is not pinned', () => {
      safeGetItem.mockReturnValue(
        JSON.stringify([{ href: '/staff', label: 'Staff' }])
      );
      expect(isPagePinned('/students')).toBe(false);
    });
  });

  describe('togglePinnedPage', () => {
    it('adds a new pin and returns true', () => {
      safeGetItem.mockReturnValue(null);
      const result = togglePinnedPage({ href: '/students', label: 'Students' });
      expect(result).toBe(true);
      expect(safeSetItem).toHaveBeenCalledWith(
        KEY,
        JSON.stringify([{ href: '/students', label: 'Students' }])
      );
    });

    it('removes an existing pin and returns false', () => {
      safeGetItem.mockReturnValue(
        JSON.stringify([{ href: '/students', label: 'Students' }])
      );
      const result = togglePinnedPage({ href: '/students', label: 'Students' });
      expect(result).toBe(false);
      expect(safeSetItem).toHaveBeenCalledWith(KEY, JSON.stringify([]));
    });

    it('caps the list at MAX_PINS (8)', () => {
      const pins = Array.from({ length: 8 }, (_, i) => ({
        href: `/page-${i}`,
        label: `Page ${i}`,
      }));
      safeGetItem.mockReturnValue(JSON.stringify(pins));
      togglePinnedPage({ href: '/new', label: 'New' });
      const stored = JSON.parse(safeSetItem.mock.calls[0][1]);
      expect(stored.length).toBe(8);
      expect(stored[0]).toEqual({ href: '/new', label: 'New' });
    });
  });

  describe('subscribePinnedPages', () => {
    let listeners;

    beforeEach(() => {
      listeners = {};
      vi.stubGlobal('window', {
        addEventListener: vi.fn((event, handler) => {
          listeners[event] = listeners[event] || [];
          listeners[event].push(handler);
        }),
        removeEventListener: vi.fn((event, handler) => {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter((h) => h !== handler);
          }
        }),
        dispatchEvent: vi.fn((event) => {
          const handlers = listeners[event.type] || [];
          handlers.forEach((handler) => handler(event));
        }),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns a no-op unsubscribe when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      const unsubscribe = subscribePinnedPages(vi.fn());
      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });

    it('registers listeners for custom and storage events', () => {
      subscribePinnedPages(vi.fn());
      expect(window.addEventListener).toHaveBeenCalledWith(EVENT, expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
    });

    it('calls the callback when the custom event fires', () => {
      const cb = vi.fn();
      safeGetItem.mockReturnValue(
        JSON.stringify([{ href: '/students', label: 'Students' }])
      );
      subscribePinnedPages(cb);
      window.dispatchEvent(new CustomEvent(EVENT));
      expect(cb).toHaveBeenCalledWith([{ href: '/students', label: 'Students' }]);
    });

    it('removes listeners on unsubscribe', () => {
      const unsubscribe = subscribePinnedPages(vi.fn());
      unsubscribe();
      expect(window.removeEventListener).toHaveBeenCalledWith(EVENT, expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
    });
  });
});
