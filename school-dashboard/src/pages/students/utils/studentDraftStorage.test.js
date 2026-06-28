import { describe, it, expect, beforeEach } from 'vitest';
import {
  STUDENT_DRAFT_KEY,
  STUDENT_DRAFT_TTL_MS,
  saveStudentDraft,
  readStudentDraft,
  clearStudentDraft,
} from './studentDraftStorage';

// Minimal in-memory Storage stand-in so the TTL logic is exercised without
// jsdom. Mirrors the bits of the Web Storage API the util touches.
function makeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, val) => map.set(key, String(val)),
    removeItem: (key) => map.delete(key),
    has: (key) => map.has(key),
    size: () => map.size,
  };
}

const T0 = 1_700_000_000_000; // fixed "now" for deterministic TTL math
const FORM = { fullName: 'Asha Rao', dateOfBirth: '2015-04-02', admissionId: 'ADM-9' };

describe('saveStudentDraft', () => {
  let storage;
  beforeEach(() => {
    storage = makeStorage();
  });

  it('writes a timestamped envelope under the draft key', () => {
    expect(saveStudentDraft(FORM, storage, T0)).toBe(true);
    const stored = JSON.parse(storage.getItem(STUDENT_DRAFT_KEY));
    expect(stored).toEqual({ savedAt: T0, data: FORM });
  });

  it('returns false (and swallows) when storage throws', () => {
    const throwing = {
      setItem: () => {
        throw new Error('QuotaExceeded');
      },
    };
    expect(saveStudentDraft(FORM, throwing, T0)).toBe(false);
  });
});

describe('readStudentDraft', () => {
  let storage;
  beforeEach(() => {
    storage = makeStorage();
  });

  it('returns null when no draft is stored', () => {
    expect(readStudentDraft(storage, T0)).toBeNull();
  });

  it('round-trips a freshly saved draft', () => {
    saveStudentDraft(FORM, storage, T0);
    expect(readStudentDraft(storage, T0)).toEqual(FORM);
  });

  it('restores a draft still within the TTL window', () => {
    saveStudentDraft(FORM, storage, T0);
    const justInside = T0 + STUDENT_DRAFT_TTL_MS - 1;
    expect(readStudentDraft(storage, justInside)).toEqual(FORM);
    expect(storage.has(STUDENT_DRAFT_KEY)).toBe(true);
  });

  it('discards AND purges a draft past the TTL window', () => {
    saveStudentDraft(FORM, storage, T0);
    const expired = T0 + STUDENT_DRAFT_TTL_MS + 1;
    expect(readStudentDraft(storage, expired)).toBeNull();
    // stale PII must not linger in storage
    expect(storage.has(STUDENT_DRAFT_KEY)).toBe(false);
  });

  it('discards AND purges a legacy un-stamped draft (raw form object)', () => {
    storage.setItem(STUDENT_DRAFT_KEY, JSON.stringify(FORM)); // pre-TTL shape
    expect(readStudentDraft(storage, T0)).toBeNull();
    expect(storage.has(STUDENT_DRAFT_KEY)).toBe(false);
  });

  it('discards AND purges a corrupt (non-JSON) draft', () => {
    storage.setItem(STUDENT_DRAFT_KEY, '{not valid json');
    expect(readStudentDraft(storage, T0)).toBeNull();
    expect(storage.has(STUDENT_DRAFT_KEY)).toBe(false);
  });

  it('returns null when storage access throws', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readStudentDraft(throwing, T0)).toBeNull();
  });
});

describe('clearStudentDraft', () => {
  it('removes the draft key', () => {
    const storage = makeStorage();
    saveStudentDraft(FORM, storage, T0);
    clearStudentDraft(storage);
    expect(storage.has(STUDENT_DRAFT_KEY)).toBe(false);
  });

  it('swallows errors from storage', () => {
    const throwing = {
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(() => clearStudentDraft(throwing)).not.toThrow();
  });
});
