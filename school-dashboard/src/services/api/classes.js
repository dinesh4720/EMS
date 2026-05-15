import { request } from './core.js';

export const classesApi = {
  getAll: (skipCache = false, opts) => request('/classes', { skipCache, ...opts }),
  getPublic: () => request('/classes/public'),
  getById: (id, opts) => request(`/classes/${id}`, opts),
  create: (data) => request('/classes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/classes/${id}`, { method: 'DELETE' }),
  getStudents: (id, options) => request(`/classes/${id}/students`, options),
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
  updateClassTeacher: (id, teacherId, { force } = {}) => request(`/classes/${id}/class-teacher`, { method: 'PUT', body: JSON.stringify({ classTeacherId: teacherId, ...(force ? { force: true } : {}) }) }),
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
  /** Fetch today's attendance snapshot for all classes in a single request. */
  getTodaySnapshot: () => request('/attendance/today-snapshot'),
  getByClassDate: (classId, date) => request(`/attendance/${classId}/${date}`),
  getStudentAttendance: (studentId, startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    const queryString = params.toString();
    return request(`/attendance/student/${studentId}${queryString ? `?${queryString}` : ''}`);
  },
  /** Fetch raw attendance records for a class within a date range — used for the calendar heatmap. */
  getClassHistory: (classId, startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    const queryString = params.toString();
    return request(`/attendance/history/${classId}${queryString ? `?${queryString}` : ''}`);
  },
  notifyParents: (data) => request('/attendance/notify-parents', { method: 'POST', body: JSON.stringify(data) }),
};

// Staff Attendance API
export const staffAttendanceApi = {
  getAll: (opts) => request('/staff-attendance', opts),
  getByDate: (date) => request(`/staff-attendance/date/${date}`),
  getReport: (startDate, endDate) => request(`/staff-attendance/report?startDate=${startDate}&endDate=${endDate}`),
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
  getPendingLeaves: () => request('/staff-attendance/leave/pending'),
  approveLeave: (id, data) => request(`/staff-attendance/leave/${id}/approve`, { method: 'PUT', body: JSON.stringify(data) }),
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
  createOrUpdate: (data) => request(`/timetable/${data.classId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Generate/regenerate timetables for all classes
  generateAll: (data) => request('/timetable/generate-all', { method: 'POST', body: JSON.stringify(data) }),
  updateSlot: (classId, data) => request(`/timetable/${classId}/slot`, { method: 'PUT', body: JSON.stringify(data) }),

  // Batch update multiple slots
  batchUpdateSlots: (classId, slots, academicYear) => request(`/timetable/${classId}/batch`, {
    method: 'POST',
    body: JSON.stringify({ slots, academicYear })
  }),

  updatePeriods: (classId, data) => request(`/timetable/${classId}/periods`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (classId, academicYear) => request(`/timetable/${classId}${academicYear ? `?academicYear=${academicYear}` : ''}`, { method: 'DELETE' }),

  // Cache management (removed dead endpoints - no backend handlers exist)
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
  updateSlot: (teacherId, data) => request(`/teacher-timetable/${teacherId}/slot`, { method: 'PUT', body: JSON.stringify(data) }),
  getConflicts: (teacherId, academicYear) => request(`/teacher-timetable/${teacherId}/conflicts${academicYear ? `?academicYear=${academicYear}` : ''}`),
  switchClass: (teacherId, data) => request(`/teacher-timetable/${teacherId}/switch-class`, { method: 'POST', body: JSON.stringify(data) }),
};

// Settings API
