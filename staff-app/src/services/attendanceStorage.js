// Attendance Storage Service
// Handles offline storage using AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const KEYS = {
  CLASSES_CACHE: '@staff_app_classes_cache',
  ATTENDANCE_CACHE: '@staff_app_attendance_cache',
  SYNC_QUEUE: '@staff_app_sync_queue',
  ATTENDANCE_HISTORY: '@staff_app_attendance_history',
};

// Cache classes for a staff member
export const cacheClasses = async (staffId, classes) => {
  try {
    const cacheKey = `${KEYS.CLASSES_CACHE}_${staffId}`;
    const cacheData = {
      data: classes,
      cachedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    console.error('Error caching classes:', error);
    return false;
  }
};

// Get cached classes for a staff member
export const getCachedClasses = async (staffId) => {
  try {
    const cacheKey = `${KEYS.CLASSES_CACHE}_${staffId}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);

    if (!cachedData) return null;

    const { data, cachedAt } = JSON.parse(cachedData);

    // Check if cache is older than 24 hours
    const cacheAge = Date.now() - new Date(cachedAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (cacheAge > maxAge) {
      // Cache expired, remove it
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting cached classes:', error);
    return null;
  }
};

// Save attendance offline
export const saveOfflineAttendance = async (attendanceRecord) => {
  try {
    const { classId, date } = attendanceRecord;
    const cacheKey = `${KEYS.ATTENDANCE_CACHE}_${classId}_${date}`;

    const record = {
      ...attendanceRecord,
      savedOfflineAt: new Date().toISOString(),
      pendingSync: true,
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(record));
    return true;
  } catch (error) {
    console.error('Error saving offline attendance:', error);
    return false;
  }
};

// Get offline attendance for a class and date
export const getOfflineAttendance = async (classId, date) => {
  try {
    const cacheKey = `${KEYS.ATTENDANCE_CACHE}_${classId}_${date}`;
    const data = await AsyncStorage.getItem(cacheKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting offline attendance:', error);
    return null;
  }
};

// Add record to sync queue
export const addToSyncQueue = async (attendanceRecord) => {
  try {
    const queueData = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
    const queue = queueData ? JSON.parse(queueData) : [];

    // Check if record already exists in queue
    const existingIndex = queue.findIndex(
      item => item.classId === attendanceRecord.classId && item.date === attendanceRecord.date
    );

    if (existingIndex !== -1) {
      // Update existing record
      queue[existingIndex] = {
        ...attendanceRecord,
        queuedAt: new Date().toISOString(),
      };
    } else {
      // Add new record
      queue.push({
        ...attendanceRecord,
        queuedAt: new Date().toISOString(),
      });
    }

    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    return false;
  }
};

// Get pending sync queue
export const getPendingSyncQueue = async () => {
  try {
    const queueData = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
    return queueData ? JSON.parse(queueData) : [];
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
};

// Remove record from sync queue
export const removeFromSyncQueue = async (classId, date) => {
  try {
    const queueData = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
    const queue = queueData ? JSON.parse(queueData) : [];

    const filteredQueue = queue.filter(
      item => !(item.classId === classId && item.date === date)
    );

    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(filteredQueue));

    // Also remove from offline cache
    const cacheKey = `${KEYS.ATTENDANCE_CACHE}_${classId}_${date}`;
    await AsyncStorage.removeItem(cacheKey);

    return true;
  } catch (error) {
    console.error('Error removing from sync queue:', error);
    return false;
  }
};

// Clear pending records for a class and date
export const clearPendingRecords = async (classId, date) => {
  try {
    await removeFromSyncQueue(classId, date);
    return true;
  } catch (error) {
    console.error('Error clearing pending records:', error);
    return false;
  }
};

// Cache attendance history
export const cacheAttendanceHistory = async (classId, history) => {
  try {
    const cacheKey = `${KEYS.ATTENDANCE_HISTORY}_${classId}`;
    const cacheData = {
      data: history,
      cachedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    console.error('Error caching attendance history:', error);
    return false;
  }
};

// Get cached attendance history
export const getCachedAttendanceHistory = async (classId) => {
  try {
    const cacheKey = `${KEYS.ATTENDANCE_HISTORY}_${classId}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);

    if (!cachedData) return null;

    const { data, cachedAt } = JSON.parse(cachedData);

    // Check if cache is older than 1 hour
    const cacheAge = Date.now() - new Date(cachedAt).getTime();
    const maxAge = 60 * 60 * 1000; // 1 hour

    if (cacheAge > maxAge) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting cached attendance history:', error);
    return null;
  }
};

// Clear all cache
export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter(key =>
      key.startsWith('@staff_app_')
    );
    await AsyncStorage.multiRemove(appKeys);
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

// Get cache stats
export const getCacheStats = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter(key =>
      key.startsWith('@staff_app_')
    );

    const stats = {
      totalKeys: appKeys.length,
      syncQueueSize: 0,
    };

    const queueData = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
    if (queueData) {
      const queue = JSON.parse(queueData);
      stats.syncQueueSize = queue.length;
    }

    return stats;
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { totalKeys: 0, syncQueueSize: 0 };
  }
};

export default {
  cacheClasses,
  getCachedClasses,
  saveOfflineAttendance,
  getOfflineAttendance,
  addToSyncQueue,
  getPendingSyncQueue,
  removeFromSyncQueue,
  clearPendingRecords,
  cacheAttendanceHistory,
  getCachedAttendanceHistory,
  clearAllCache,
  getCacheStats,
};
