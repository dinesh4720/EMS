import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { classesApi, ATTENDANCE_STATUS } from '../services/api';
import * as attendanceStorage from '../services/attendanceStorage';
import { useAuth } from './AuthContext';

const ClassContext = createContext();

export const useClassContext = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error('useClassContext must be used within a ClassProvider');
  }
  return context;
};

export const ClassProvider = ({ children }) => {
  const { user } = useAuth();

  // State
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  // Load offline queue on mount
  useEffect(() => {
    const loadOfflineData = async () => {
      try {
        const queue = await attendanceStorage.getPendingSyncQueue();
        setOfflineQueue(queue);
      } catch (err) {
        console.error('Error loading offline queue:', err);
      }
    };
    loadOfflineData();
  }, []);

  // Fetch staff classes
  const fetchClasses = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Try to get from cache first
      const cachedClasses = await attendanceStorage.getCachedClasses(user.id);
      if (cachedClasses && cachedClasses.length > 0) {
        setClasses(cachedClasses);
      }

      // Fetch fresh data from API
      const data = await classesApi.getStaffClasses(user.id);
      setClasses(data || []);

      // Cache the data
      await attendanceStorage.cacheClasses(user.id, data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);

      // Try to use cached data
      const cachedClasses = await attendanceStorage.getCachedClasses(user.id);
      if (cachedClasses && cachedClasses.length > 0) {
        setClasses(cachedClasses);
        setError('Using cached data - network unavailable');
      } else {
        setError(err.message || 'Failed to fetch classes');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch students for a class
  const fetchStudents = useCallback(async (classId) => {
    if (!classId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await classesApi.getClassStudents(classId);
      setStudents(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to fetch students');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch attendance for a class and date
  const fetchAttendance = useCallback(async (classId, date) => {
    if (!classId || !date) return;

    setLoading(true);
    setError(null);

    try {
      const data = await classesApi.getClassAttendance(classId, date);
      // Convert array to object keyed by student ID
      const attendanceMap = {};
      (data || []).forEach(record => {
        attendanceMap[record.studentId] = {
          status: record.status || ATTENDANCE_STATUS.PRESENT,
          remarks: record.remarks || '',
          markedAt: record.markedAt,
        };
      });
      setAttendance(attendanceMap);
      return attendanceMap;
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message || 'Failed to fetch attendance');
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  // Update attendance status for a student
  const updateAttendanceStatus = useCallback((studentId, status, remarks = '') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        status,
        remarks,
        markedAt: new Date().toISOString(),
      },
    }));
  }, []);

  // Mark all students with a status
  const markAllAttendance = useCallback((status) => {
    setAttendance(prev => {
      const updated = { ...prev };
      students.forEach(student => {
        updated[student.id] = {
          status,
          remarks: '',
          markedAt: new Date().toISOString(),
        };
      });
      return updated;
    });
  }, [students]);

  // Save attendance (with offline support)
  const saveAttendance = useCallback(async (classId, date) => {
    if (!classId || !date) {
      return { success: false, error: 'Missing class ID or date' };
    }

    // Convert attendance object to array format
    const attendanceArray = Object.entries(attendance).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      remarks: data.remarks || '',
    }));

    // Add any students not in attendance as present by default
    students.forEach(student => {
      if (!attendanceArray.find(a => a.studentId === student.id)) {
        attendanceArray.push({
          studentId: student.id,
          status: ATTENDANCE_STATUS.PRESENT,
          remarks: '',
        });
      }
    });

    const attendanceRecord = {
      classId,
      date,
      attendance: attendanceArray,
      markedBy: user?.id,
      markedAt: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        // Try to save online
        const result = await classesApi.markAttendance(classId, date, attendanceArray);

        // Clear any pending records for this class/date
        await attendanceStorage.clearPendingRecords(classId, date);

        return { success: true, data: result };
      } else {
        // Save offline
        await attendanceStorage.saveOfflineAttendance(attendanceRecord);

        // Add to sync queue
        await attendanceStorage.addToSyncQueue(attendanceRecord);
        setOfflineQueue(prev => [...prev, attendanceRecord]);

        return { success: true, offline: true };
      }
    } catch (err) {
      console.error('Error saving attendance:', err);

      // Save offline if network error
      if (!isOnline || err.message?.includes('Network')) {
        await attendanceStorage.saveOfflineAttendance(attendanceRecord);
        await attendanceStorage.addToSyncQueue(attendanceRecord);
        setOfflineQueue(prev => [...prev, attendanceRecord]);

        return { success: true, offline: true };
      }

      return { success: false, error: err.message };
    }
  }, [attendance, students, user?.id, isOnline]);

  // Fetch attendance history
  const fetchAttendanceHistory = useCallback(async (classId, startDate, endDate) => {
    if (!classId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await classesApi.getAttendanceHistory(classId, startDate, endDate);
      setAttendanceHistory(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setError(err.message || 'Failed to fetch attendance history');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync offline attendance
  const syncOfflineAttendance = useCallback(async () => {
    if (offlineQueue.length === 0) return { synced: 0 };

    let syncedCount = 0;
    const failedRecords = [];

    for (const record of offlineQueue) {
      try {
        await classesApi.markAttendance(record.classId, record.date, record.attendance);
        await attendanceStorage.removeFromSyncQueue(record.classId, record.date);
        syncedCount++;
      } catch (err) {
        console.error('Error syncing record:', err);
        failedRecords.push(record);
      }
    }

    setOfflineQueue(failedRecords);

    return { synced: syncedCount, failed: failedRecords.length };
  }, [offlineQueue]);

  // Clear current attendance state
  const clearAttendance = useCallback(() => {
    setAttendance({});
  }, []);

  // Calculate attendance summary
  const getAttendanceSummary = useCallback(() => {
    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      unmarked: 0,
      total: students.length,
    };

    students.forEach(student => {
      const record = attendance[student.id];
      if (!record || !record.status) {
        summary.unmarked++;
      } else if (record.status === ATTENDANCE_STATUS.PRESENT) {
        summary.present++;
      } else if (record.status === ATTENDANCE_STATUS.ABSENT) {
        summary.absent++;
      } else if (record.status === ATTENDANCE_STATUS.LATE) {
        summary.late++;
      } else if (record.status === ATTENDANCE_STATUS.EXCUSED) {
        summary.excused++;
      } else {
        summary.unmarked++;
      }
    });

    summary.percentage = summary.total > 0
      ? Math.round(((summary.present + summary.late + summary.excused) / summary.total) * 100)
      : 0;

    return summary;
  }, [attendance, students]);

  const value = {
    // State
    classes,
    selectedClass,
    students,
    attendance,
    attendanceHistory,
    loading,
    error,
    offlineQueue,
    isOnline,

    // Actions
    setSelectedClass,
    fetchClasses,
    fetchStudents,
    fetchAttendance,
    updateAttendanceStatus,
    markAllAttendance,
    saveAttendance,
    fetchAttendanceHistory,
    syncOfflineAttendance,
    clearAttendance,
    getAttendanceSummary,
    setError,
    setIsOnline,
  };

  return (
    <ClassContext.Provider value={value}>
      {children}
    </ClassContext.Provider>
  );
};

export default ClassContext;
