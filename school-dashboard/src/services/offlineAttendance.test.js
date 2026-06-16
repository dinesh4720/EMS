import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  queueOfflineAttendance,
  getOfflineQueue,
  getCachedAttendance,
  removeFromOfflineQueue,
  clearOfflineQueue,
  getPendingCount,
} from './offlineAttendance';

const createMockStorage = () => {
  const store = new Map();
  return {
    getItem: vi.fn((key) => store.get(key) ?? null),
    setItem: vi.fn((key, value) => store.set(key, value)),
    removeItem: vi.fn((key) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() { return store.size; },
    key: vi.fn((index) => Array.from(store.keys())[index] ?? null),
    _store: store,
  };
};

describe('offlineAttendance', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    Object.defineProperty(global, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  it('queues an attendance record', () => {
    const record = {
      classId: 'class-1',
      date: '2026-06-09',
      attendance: [{ studentId: 's1', status: 'present' }],
    };
    const result = queueOfflineAttendance(record);
    expect(result.success).toBe(true);
    expect(getPendingCount()).toBe(1);
  });

  it('overwrites an existing record for the same class+date', () => {
    const record = {
      classId: 'class-1',
      date: '2026-06-09',
      attendance: [{ studentId: 's1', status: 'present' }],
    };
    queueOfflineAttendance(record);
    queueOfflineAttendance({ ...record, attendance: [{ studentId: 's1', status: 'absent' }] });
    expect(getPendingCount()).toBe(1);
    const queue = getOfflineQueue();
    expect(queue[0].attendance[0].status).toBe('absent');
  });

  it('caches the record for the given class+date', () => {
    const record = {
      classId: 'class-1',
      date: '2026-06-09',
      attendance: [{ studentId: 's1', status: 'present' }],
    };
    queueOfflineAttendance(record);
    const cached = getCachedAttendance('class-1', '2026-06-09');
    expect(cached).not.toBeNull();
    expect(cached.attendance[0].status).toBe('present');
  });

  it('removes a record from the queue and cache', () => {
    queueOfflineAttendance({ classId: 'class-1', date: '2026-06-09', attendance: [] });
    queueOfflineAttendance({ classId: 'class-1', date: '2026-06-10', attendance: [] });
    removeFromOfflineQueue('class-1', '2026-06-09');
    expect(getPendingCount()).toBe(1);
    expect(getCachedAttendance('class-1', '2026-06-09')).toBeNull();
  });

  it('clears all records', () => {
    queueOfflineAttendance({ classId: 'class-1', date: '2026-06-09', attendance: [] });
    queueOfflineAttendance({ classId: 'class-2', date: '2026-06-09', attendance: [] });
    clearOfflineQueue();
    expect(getPendingCount()).toBe(0);
  });

  it('returns empty array when localStorage is empty', () => {
    expect(getOfflineQueue()).toEqual([]);
    expect(getPendingCount()).toBe(0);
  });

});
