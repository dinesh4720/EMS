import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import {
  getOfflineQueue,
  removeFromOfflineQueue,
} from '../services/offlineAttendance';
import { attendanceApi } from '../services/api';
import logger from '../utils/logger';

/**
 * Hook that watches network status and automatically syncs any queued
 * offline attendance records when the browser comes back online.
 *
 * Returns:
 *   pendingCount   – number of records still waiting to sync
 *   syncing        – whether a sync is currently in progress
 *   lastSyncResult – { synced, failed } from the most recent sync attempt
 *   syncNow        – manual trigger (returns a promise)
 */
export function useOfflineAttendanceSync() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(() => getOfflineQueue().length);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const isMountedRef = useRef(true);

  const refreshCount = useCallback(() => {
    if (isMountedRef.current) {
      setPendingCount(getOfflineQueue().length);
    }
  }, []);

  const syncNow = useCallback(async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) {
      refreshCount();
      return { synced: 0, failed: 0 };
    }

    setSyncing(true);
    setLastSyncResult(null);
    let synced = 0;
    let failed = 0;

    for (const record of queue) {
      try {
        await attendanceApi.markBulk({
          classId: record.classId,
          date: record.date,
          attendance: record.attendance,
          clientTimestamp: record.queuedAt || new Date().toISOString(),
        });
        removeFromOfflineQueue(record.classId, record.date);
        synced++;
      } catch (err) {
        logger.error('Offline sync failed for record:', err?.message);
        failed++;
      }
    }

    refreshCount();
    const result = { synced, failed };
    setLastSyncResult(result);
    setSyncing(false);
    return result;
  }, [refreshCount]);

  // Auto-sync when we transition from offline → online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncing) {
      syncNow();
    }
  }, [isOnline, pendingCount, syncing, syncNow]);

  // Keep count in sync with other tabs / external changes
  useEffect(() => {
    const onStorage = () => refreshCount();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshCount]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { pendingCount, syncing, lastSyncResult, syncNow };
}
