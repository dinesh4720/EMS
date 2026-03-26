import { request } from './core.js';

export const classesApi = {
  getAll: (skipCache = false) => request('/classes', { skipCache }),
  getPublic: () => request('/classes/public'),
  getById: (id) => request(`/classes/${id}`),
  create: (data) => request('/classes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/classes/${id}`, { method: 'DELETE' }),
  getStudents: (id) => request(`/classes/${id}/students`),
  getNextRollNumber: (classId) => request(`/classes/${classId}/next-roll-number`),
  checkCapacity: (id) => request(`/classes/${id}/capacity`),

  // Class Settings — uses properly scoped /classes/:id routes instead of separate /class-settings
  getSettings: (id) => request(`/classes/${id}/settings`),
  updateTag: async (id, tag) => {
    try {
      return await request(`/classes/${id}/tag`, {
        method: 'PUT',
        body: JSON.stringify({ classTag: tag })
      });
    } catch (error) {
      // Re-throw validation errors with enhanced information
      if (error.status === 400) {
        const validationError = new Error(error.message || 'Validation failed');
        validationError.type = 'ValidationError';
        validationError.details = error.details || error;
        throw validationError;
      }
      throw error;
    }
  },
  updateSubjects: async (id, subjects) => {
    try {
      return await request(`/classes/${id}/subjects`, {
        method: 'PUT',
        body: JSON.stringify({ assignedSubjects: subjects })
      });
    } catch (error) {
      // Re-throw validation errors with enhanced information
      if (error.status === 400) {
        const validationError = new Error(error.message || 'Validation failed');
        validationError.type = 'ValidationError';
        validationError.details = error.details || error;
        throw validationError;
      }
      throw error;
    }
  },
  updateClassTeacher: (id, teacherId) => request(`/classes/${id}/class-teacher`, { method: 'PUT', body: JSON.stringify({ classTeacherId: teacherId }) }),
};

// Classes Enhanced API
export const classesEnhancedApi = {
  // Academic Performance
  getAcademicPerformance: (id, academicYear) => request(`/classes-enhanced/${id}/academic-performance${academicYear ? `?academicYear=${academicYear}` : ''}`),
  recalculateAcademicPerformance: (id) => request(`/classes-enhanced/${id}/academic-performance/recalculate`, { method: 'POST' }),

  // Activity Log
  getActivityLog: (id, params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request(`/classes-enhanced/${id}/activity-log${query}`);
  },
  createActivityLog: (id, data) => request(`/classes-enhanced/${id}/activity-log`, { method: 'POST', body: JSON.stringify(data) }),

  // Class Rating
  getRating: (id, academicYear) => request(`/classes-enhanced/${id}/rating${academicYear ? `?academicYear=${academicYear}` : ''}`),
  recalculateRating: (id, data) => request(`/classes-enhanced/${id}/rating/recalculate`, { method: 'POST', body: JSON.stringify(data || {}) }),

  // Attendance Analytics
  getAttendanceAnalytics: (id, period) => request(`/classes-enhanced/${id}/attendance-analytics${period ? `?period=${period}` : ''}`),
  getChronicAbsentees: (id, threshold) => request(`/classes-enhanced/${id}/chronic-absentees${threshold ? `?threshold=${threshold}` : ''}`),

  // Today's Status
  getTodayStatus: (id) => request(`/classes-enhanced/${id}/today-status`),

  // Promotion
  promoteClass: (id, data) => request(`/classes-enhanced/${id}/promote`, { method: 'POST', body: JSON.stringify(data) }),

  // Subjects & Chapters
  getSubjects: (id, academicYear) => request(`/classes-enhanced/${id}/subjects${academicYear ? `?academicYear=${academicYear}` : ''}`),
  addSubject: (id, data) => request(`/classes-enhanced/${id}/subjects`, { method: 'POST', body: JSON.stringify(data) }),
  updateChapter: (chapterId, data) => request(`/classes-enhanced/chapters/${chapterId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Strength Limit
  adjustStrengthLimit: (id, data) => request(`/classes-enhanced/${id}/strength-limit`, { method: 'PUT', body: JSON.stringify(data) }),

  // Announcements
  getAnnouncements: (id, limit) => request(`/classes-enhanced/${id}/announcements${limit ? `?limit=${limit}` : ''}`),
  sendAnnouncement: (id, data) => request(`/classes-enhanced/${id}/announcements`, { method: 'POST', body: JSON.stringify(data) }),

  // Fees Overview
  getFeesOverview: (id, academicYear) => request(`/classes-enhanced/${id}/fees-overview${academicYear ? `?academicYear=${academicYear}` : ''}`),

  // Missing Subjects
  getMissingSubjects: () => request('/classes-enhanced/missing-subjects'),
};

// Attendance API
export const attendanceApi = {
  mark: (data) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  markBulk: (data) => request('/attendance/bulk', { method: 'POST', body: JSON.stringify(data) }),
  getByClassDate: (classId, date) => request(`/attendance/${classId}/${date}`),
  getStudentAttendance: (studentId, startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    const queryString = params.toString();
    return request(`/attendance/student/${studentId}${queryString ? `?${queryString}` : ''}`);
  },
};

// Staff Attendance API
export const staffAttendanceApi = {
  getAll: () => request('/staff-attendance'),
  getByDate: (date) => request(`/staff-attendance/date/${date}`),
  getByStaff: (staffId, startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    return request(`/staff-attendance/staff/${staffId}${queryString ? `?${queryString}` : ''}`);
  },
  mark: (data) => request('/staff-attendance', { method: 'POST', body: JSON.stringify(data) }),
  markBulk: (data) => request('/staff-attendance/bulk', { method: 'POST', body: JSON.stringify(data) }),
  regularize: (id, data) => request(`/staff-attendance/${id}/regularize`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Timetable API
export const timetableApi = {
  // Get all timetables at once
  getAll: (academicYear) => request(`/timetable${academicYear ? `?academicYear=${academicYear}` : ''}`),

  getByClass: (classId, academicYear) => request(`/timetable/${classId}${academicYear ? `?academicYear=${academicYear}` : ''}`),

  // Lazy loading: Get timetable with option to skip cache for fresh data
  getByClassLazy: (classId, academicYear, skipCache = false) =>
    request(`/timetable/${classId}${academicYear ? `?academicYear=${academicYear}` : ''}`, { skipCache }),

  create: (data) => request('/timetable', { method: 'POST', body: JSON.stringify(data) }),
  update: (classId, data) => request(`/timetable/${classId}`, { method: 'PUT', body: JSON.stringify(data) }),
  createOrUpdate: (data) => request('/timetable', { method: 'POST', body: JSON.stringify(data) }),

  // Generate/regenerate timetables for all classes
  generateAll: (data) => request('/timetable/generate-all', { method: 'POST', body: JSON.stringify(data) }),
  updateSlot: async (classId, data) => {
    try {
      return await request(`/timetable/${classId}/slot`, { method: 'PUT', body: JSON.stringify(data) });
    } catch (error) {
      // Re-throw conflict errors with enhanced information
      if (error.type === 'ConflictError') {
        throw error;
      }
      throw error;
    }
  },

  // Batch update multiple slots
  batchUpdateSlots: async (classId, slots, academicYear) => {
    try {
      return await request(`/timetable/${classId}/batch`, {
        method: 'POST',
        body: JSON.stringify({ slots, academicYear })
      });
    } catch (error) {
      // Handle batch conflict errors
      if (error.type === 'BatchConflictError' || error.status === 409) {
        throw error;
      }
      throw error;
    }
  },

  updatePeriods: (classId, data) => request(`/timetable/${classId}/periods`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (classId, academicYear) => request(`/timetable/${classId}${academicYear ? `?academicYear=${academicYear}` : ''}`, { method: 'DELETE' }),

  // Cache management
  clearCache: (pattern) => request('/timetable/cache/clear', { method: 'POST', body: JSON.stringify({ pattern }) }),
  getCacheStats: () => request('/timetable/cache/stats'),
};

// Teacher Assignments API
export const teacherAssignmentsApi = {
  getAll: (teacherId) => request(`/teacher-assignments/${teacherId}`),
  create: async (data) => {
    try {
      return await request('/teacher-assignments', { method: 'POST', body: JSON.stringify(data) });
    } catch (error) {
      // Re-throw validation errors with enhanced information
      if (error.status === 400) {
        const validationError = new Error(error.message || 'Validation failed');
        validationError.type = 'ValidationError';
        validationError.details = error.details || error;
        throw validationError;
      }
      throw error;
    }
  },
  update: async (id, data) => {
    try {
      return await request(`/teacher-assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch (error) {
      // Re-throw validation errors with enhanced information
      if (error.status === 400) {
        const validationError = new Error(error.message || 'Validation failed');
        validationError.type = 'ValidationError';
        validationError.details = error.details || error;
        throw validationError;
      }
      throw error;
    }
  },
  delete: (id, teacherId) => request(`/teacher-assignments/${id}?teacherId=${teacherId}`, { method: 'DELETE' }),
  getAvailableTeachers: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/teacher-assignments/available-teachers?${query}`);
  },
};

// Teacher Timetable API
export const teacherTimetableApi = {
  get: (teacherId, academicYear) => request(`/teacher-timetable/${teacherId}${academicYear ? `?academicYear=${academicYear}` : ''}`),
  create: (teacherId, data) => request(`/teacher-timetable/${teacherId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateSlot: async (teacherId, data) => {
    try {
      return await request(`/teacher-timetable/${teacherId}/slot`, { method: 'PUT', body: JSON.stringify(data) });
    } catch (error) {
      // Re-throw conflict errors with enhanced information
      if (error.type === 'ConflictError') {
        throw error;
      }
      throw error;
    }
  },
  getConflicts: (teacherId, academicYear) => request(`/teacher-timetable/${teacherId}/conflicts${academicYear ? `?academicYear=${academicYear}` : ''}`),
  switchClass: async (teacherId, data) => {
    try {
      return await request(`/teacher-timetable/${teacherId}/switch-class`, { method: 'POST', body: JSON.stringify(data) });
    } catch (error) {
      // Re-throw conflict errors with enhanced information
      if (error.type === 'ConflictError') {
        throw error;
      }
      throw error;
    }
  },
};

// Settings API
