// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeGetItem, safeSetItem, safeRemoveItem } from './safeStorage';

describe('safeGetItem', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when key does not exist', () => {
    expect(safeGetItem('nonexistent')).toBeNull();
  });

  it('returns stored value', () => {
    localStorage.setItem('testKey', 'hello');
    expect(safeGetItem('testKey')).toBe('hello');
  });

  it('returns null when localStorage throws', () => {
    const mockGetItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });
    expect(safeGetItem('any')).toBeNull();
    mockGetItem.mockRestore();
  });
});

describe('safeSetItem', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores a value in localStorage', () => {
    safeSetItem('testKey', 'hello');
    expect(localStorage.getItem('testKey')).toBe('hello');
  });

  it('does not throw when localStorage throws (quota exceeded)', () => {
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => safeSetItem('key', 'value')).not.toThrow();
    mockSetItem.mockRestore();
  });
});

describe('safeRemoveItem', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes a key from localStorage', () => {
    localStorage.setItem('testKey', 'value');
    safeRemoveItem('testKey');
    expect(localStorage.getItem('testKey')).toBeNull();
  });

  it('does not throw when key does not exist', () => {
    expect(() => safeRemoveItem('nonexistent')).not.toThrow();
  });

  it('does not throw when localStorage throws', () => {
    const mockRemove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });
    expect(() => safeRemoveItem('any')).not.toThrow();
    mockRemove.mockRestore();
  });
});
