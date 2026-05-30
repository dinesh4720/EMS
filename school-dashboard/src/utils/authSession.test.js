// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AUTH_STORAGE_KEY,
  getStoredUser,
  getStoredAuthToken,
  getAuthHeaders,
  saveStoredUser,
  clearStoredUser,
} from './authSession';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validUser = {
  id: 'usr_1',
  name: 'Alice',
  role: 'admin',
  email: 'alice@school.com',
  schoolId: 'sch_99',
};

function setSessionUser(user) {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

// ─── getStoredUser ────────────────────────────────────────────────────────────

describe('getStoredUser', () => {
  beforeEach(() => {
    sessionStorage.clear();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('returns null when nothing is stored', () => {
    expect(getStoredUser()).toBeNull();
  });

  it('returns the sanitized user from sessionStorage', () => {
    setSessionUser(validUser);
    const result = getStoredUser();
    expect(result).not.toBeNull();
    expect(result.id).toBe('usr_1');
    expect(result.name).toBe('Alice');
  });

  it('strips unknown fields not in STORED_USER_FIELDS', () => {
    setSessionUser({ ...validUser, extraField: 'should-be-removed' });
    const result = getStoredUser();
    expect(result.extraField).toBeUndefined();
  });

  it('returns null when stored user has no id field', () => {
    setSessionUser({ name: 'No ID User' });
    expect(getStoredUser()).toBeNull();
  });

  it('returns null when sessionStorage contains invalid JSON', () => {
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'not-valid-json{{{');
    expect(getStoredUser()).toBeNull();
  });

  it('ignores localStorage and uses sessionStorage only', () => {
    if (typeof localStorage === 'undefined') {
      // When localStorage is unavailable, the test is trivially satisfied.
      return;
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(validUser));
    const result = getStoredUser();
    expect(result).toBeNull();
  });
});

// ─── getStoredAuthToken ───────────────────────────────────────────────────────

describe('getStoredAuthToken', () => {
  it('always returns null (tokens live in httpOnly cookies)', () => {
    expect(getStoredAuthToken()).toBeNull();
  });
});

// ─── getAuthHeaders ───────────────────────────────────────────────────────────

describe('getAuthHeaders', () => {
  it('returns the provided headers unchanged when there is no stale auth header', () => {
    const headers = { 'Content-Type': 'application/json' };
    expect(getAuthHeaders(headers)).toEqual(headers);
  });

  it('removes a stale "Bearer null" Authorization header', () => {
    const headers = { Authorization: 'Bearer null' };
    const result = getAuthHeaders(headers);
    expect(result.Authorization).toBeUndefined();
  });

  it('removes a stale "Bearer undefined" Authorization header', () => {
    const headers = { Authorization: 'Bearer undefined' };
    const result = getAuthHeaders(headers);
    expect(result.Authorization).toBeUndefined();
  });

  it('keeps a valid token in the Authorization header', () => {
    const headers = { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig' };
    const result = getAuthHeaders(headers);
    expect(result.Authorization).toBeDefined();
  });

  it('returns an empty object when called with no arguments', () => {
    expect(getAuthHeaders()).toEqual({});
  });

  it('does not mutate the original headers object', () => {
    const headers = { Authorization: 'Bearer null', 'X-Custom': 'yes' };
    const original = { ...headers };
    getAuthHeaders(headers);
    expect(headers).toEqual(original);
  });
});

// ─── saveStoredUser / clearStoredUser ─────────────────────────────────────────

describe('saveStoredUser', () => {
  beforeEach(() => {
    sessionStorage.clear();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('saves a valid user to sessionStorage', () => {
    saveStoredUser(validUser);
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw);
    expect(stored.id).toBe('usr_1');
  });

  it('does not save a user without an id', () => {
    saveStoredUser({ name: 'No ID' });
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('does not persist tokens (strips token field)', () => {
    saveStoredUser({ ...validUser, token: 'secret-token' });
    const stored = JSON.parse(sessionStorage.getItem(AUTH_STORAGE_KEY));
    expect(stored.token).toBeUndefined();
  });

  it('preserves schoolId for multi-tenant isolation', () => {
    saveStoredUser(validUser);
    const stored = JSON.parse(sessionStorage.getItem(AUTH_STORAGE_KEY));
    expect(stored.schoolId).toBe('sch_99');
  });

  it('getStoredUser preserves schoolId through the save/get cycle', () => {
    saveStoredUser(validUser);
    const result = getStoredUser();
    expect(result.schoolId).toBe('sch_99');
  });

  it('does not store schoolId when it is null (treated as absent)', () => {
    saveStoredUser({ ...validUser, schoolId: null });
    const result = getStoredUser();
    expect(result).not.toBeNull();
    expect(result.schoolId).toBeUndefined();
  });

  it('dispatches user-logged-in event on successful save', () => {
    const listener = vi.fn();
    window.addEventListener('user-logged-in', listener, { once: true });
    saveStoredUser(validUser);
    expect(listener).toHaveBeenCalled();
  });
});

describe('clearStoredUser', () => {
  beforeEach(() => {
    sessionStorage.clear();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('removes the user from sessionStorage', () => {
    setSessionUser(validUser);
    clearStoredUser();
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('does not write auth data to localStorage', () => {
    saveStoredUser(validUser);
    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    }
  });

  it('falls back to in-memory storage when sessionStorage is unavailable', () => {
    // Simulate unavailable sessionStorage by overriding setItem to throw
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === AUTH_STORAGE_KEY) {
        throw new Error('sessionStorage disabled');
      }
      return originalSetItem.call(this, key, value);
    };

    try {
      saveStoredUser(validUser);
      const result = getStoredUser();
      expect(result).not.toBeNull();
      expect(result.id).toBe('usr_1');
    } finally {
      Storage.prototype.setItem = originalSetItem;
    }
  });

  it('dispatches auth-session-cleared event', () => {
    const listener = vi.fn();
    window.addEventListener('auth-session-cleared', listener, { once: true });
    clearStoredUser();
    expect(listener).toHaveBeenCalled();
  });

  it('getStoredUser returns null after clearing', () => {
    setSessionUser(validUser);
    clearStoredUser();
    expect(getStoredUser()).toBeNull();
  });
});
