/**
 * Offline Attendance Storage Service
 *
 * Provides localStorage-based persistence for attendance records so that
 * teachers can mark attendance while offline and sync later when the
 * connection is restored.
 *
 * Uses safeStorage wrappers to handle private-browsing / quota-exceeded
 * failures gracefully.
 */

import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/safeStorage';

const PREFIX = 'ems:offline:attendance';
const QUEUE_KEY = `${PREFIX}:queue`;
const CACHE_KEY = (classId, date) => `${PREFIX}:cache:${classId}:${date}`;

/**
 * Save an attendance record to the offline queue.
 * If a record for the same class+date already exists it is overwritten.
 */
export function queueOfflineAttendance(record) {
  try {
    const queue = getOfflineQueue();
    const idx = queue.findIndex(
      (r) => r.classId === record.classId && r.date === record.date
    );
    const enriched = {
      ...record,
      queuedAt: new Date().toISOString(),
      pendingSync: true,
    };
    if (idx >= 0) {
      queue[idx] = enriched;
    } else {
      queue.push(enriched);
    }
    safeSetItem(QUEUE_KEY, JSON.stringify(queue));
    // Also cache the record so the UI can read it back immediately
    safeSetItem(CACHE_KEY(record.classId, record.date), JSON.stringify(enriched));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Retrieve the full offline queue.
 */
export function getOfflineQueue() {
  try {
    const raw = safeGetItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Retrieve a single cached attendance record for a class/date.
 */
export function getCachedAttendance(classId, date) {
  try {
    const raw = safeGetItem(CACHE_KEY(classId, date));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Remove a record from the queue (and its cache) after successful sync.
 */
export function removeFromOfflineQueue(classId, date) {
  try {
    const queue = getOfflineQueue().filter(
      (r) => !(r.classId === classId && r.date === date)
    );
    safeSetItem(QUEUE_KEY, JSON.stringify(queue));
    safeRemoveItem(CACHE_KEY(classId, date));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Clear every pending attendance record.
 */
export function clearOfflineQueue() {
  try {
    safeRemoveItem(QUEUE_KEY);
    // Best-effort: remove all keys with our prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        safeRemoveItem(key);
      }
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Count of records waiting to be synced.
 */
export function getPendingCount() {
  return getOfflineQueue().length;
}
