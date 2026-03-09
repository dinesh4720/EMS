import { requestQueue, retryRequest, requestCache } from '../utils/requestQueue.js';
import { clearStoredUser, getAuthHeaders } from '../utils/authSession';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('🌐 API URL configured:', API_URL);

// Export cache clearing function
export function clearApiCache() {
  requestCache.clear();
  console.log('🧹 API cache cleared');
}

export async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const method = options.method || 'GET';

  // Check cache for GET requests
  if (method === 'GET' && !options.skipCache) {
    const cached = requestCache.get(url);
    if (cached) {
      // console.log(`💾 Cache hit: ${url}`);
      return cached;
    }
  }

  // Create the actual request function
  const makeRequest = async () => {
    // console.log(`📡 API Request: ${method} ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const headers = getAuthHeaders({
        'Content-Type': 'application/json',
        ...options.headers
      });

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: options.credentials ?? 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // console.log(`✅ API Response: ${response.status} ${url}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));

        // If unauthorized, clear session storage
        if (response.status === 401) {
          console.warn('⚠️ 401 Unauthorized - clearing session');
          clearStoredUser();
        }

        // If rate limited, throw specific error
        if (response.status === 429) {
          throw new Error('Too many requests - rate limit exceeded');
        }

        // If conflict error (409), throw with detailed information
        if (response.status === 409) {
          const conflictError = new Error(error.message || error.error || 'Conflict detected');
          conflictError.type = 'ConflictError';
          conflictError.details = error.details || error;
          conflictError.status = 409;
          throw conflictError;
        }

        // Log validation details if available
        if (error.details) {
          console.error('Validation details:', JSON.stringify(error.details, null, 2));
        }

        const finalError = new Error(error.error || error.message || `Request failed with status ${response.status}`);
        finalError.status = response.status;
        throw finalError;
      }

      const data = await response.json();

      // Cache GET requests
      if (method === 'GET' && !options.skipCache) {
        requestCache.set(url, data);
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ API Timeout: ${url}`);
        throw new Error('Request timed out');
      }
      throw error;
    }
  };

  // Use request queue for all requests
  try {
    return await requestQueue.add(() => retryRequest(makeRequest, 2, 1000));
  } catch (error) {
    // Only log errors that aren't rate limiting or 404s (reduce console spam)
    if (
      !error.message?.includes('rate limit') &&
      !error.message?.includes('Too many requests') &&
      error.status !== 404 &&
      !error.message?.includes('not found')
    ) {
      console.error(`❌ API Error: ${url}`, error);
    }
    throw error;
  }
}

// Staff API
export const staffApi = {
  getAll: (skipCache = false) => request('/staff', { skipCache }),
  getById: (id) => request(`/staff/${id}`),
  getClasses: (id) => request(`/staff/${id}/classes`),
  create: (data) => request('/staff', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateCredentials: (id, data) => request(`/staff/${id}/credentials`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/staff/${id}`, { method: 'DELETE' }),
};

// Students API
export const studentsApi = {
  list: async (params = {}, options = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all') {
        return;
      }

      query.set(key, value);
    });

    const queryString = query.toString();
    const response = await request(`/students${queryString ? `?${queryString}` : ''}`, {
      skipCache: options.skipCache ?? false
    });

    return {
      data: response.data || [],
      pagination: response.pagination || {
        currentPage: params.page || 1,
        totalPages: 1,
        totalItems: Array.isArray(response.data) ? response.data.length : 0,
        itemsPerPage: params.limit || 50,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  },
  getAll: async (classIdOrOptions) => {
    let params = {};
    let skipCache = false;

    if (typeof classIdOrOptions === 'boolean') {
      skipCache = classIdOrOptions;
    } else if (typeof classIdOrOptions === 'string') {
      params.classId = classIdOrOptions;
    } else if (classIdOrOptions && typeof classIdOrOptions === 'object') {
      params = { ...classIdOrOptions };
      skipCache = classIdOrOptions.skipCache ?? false;
      delete params.skipCache;
    }

    const limit = params.limit || 100;
    const firstPage = await studentsApi.list({ ...params, page: 1, limit }, { skipCache });
    const allStudents = [...firstPage.data];
    const totalPages = firstPage.pagination?.totalPages || 1;

    for (let page = 2; page <= totalPages; page += 1) {
      const nextPage = await studentsApi.list({ ...params, page, limit }, { skipCache });
      allStudents.push(...nextPage.data);
    }

    return allStudents;
  },
  getById: (id) => request(`/students/${id}`),
  create: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/students/${id}`, { method: 'DELETE' }),
  getNextAdmissionId: () => request('/students/next-admission-id'),
  pin: (id) => request(`/students/${id}/pin`, { method: 'PUT' }),
  unpin: (id) => request(`/students/${id}/unpin`, { method: 'PUT' }),
  getResults: (id, academicYear) => request(`/students/${id}/results${academicYear ? `?academicYear=${academicYear}` : ''}`),
};

// Trash API
export const trashApi = {
  getAll: async (params = {}) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return request(`/trash${queryString ? `?${queryString}` : ''}`);
  },
  getStats: async () => request('/trash/stats'),
  restore: (trashItemId) => request(`/trash/${trashItemId}/restore`, {
    method: 'POST'
  }),
  permanentDelete: (trashItemId) => request(`/trash/${trashItemId}`, {
    method: 'DELETE'
  }),
  bulkRestore: (trashItemIds) => request('/trash/bulk-restore', {
    method: 'POST',
    body: JSON.stringify({ trashItemIds })
  }),
  bulkDelete: (trashItemIds) => request('/trash/bulk-delete', {
    method: 'DELETE',
    body: JSON.stringify({ trashItemIds })
  }),
};

// Exams API
export const examsApi = {
  getAll: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return request(`/exams${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => request(`/exams/${id}`),
  create: (data) => request('/exams', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/exams/${id}`, { method: 'DELETE' }),
  getByClass: (classId) => request(`/exams/class/${classId}`),
  getByStaff: (staffId) => request(`/exams/staff/${staffId}`),
  publish: (id) => request(`/exams/${id}/publish`, { method: 'POST' }),
  getResults: (id) => request(`/exams/${id}/results`),
  publishResults: (id, publish) => request(`/exams/${id}/publish-results`, { method: 'PUT', body: JSON.stringify({ publish }) }),
};

// Results API
export const resultsApi = {
  create: (data) => request('/results', { method: 'POST', body: JSON.stringify(data) }),
  bulkCreate: (results, examId, classId) => request('/results/bulk', { method: 'POST', body: JSON.stringify({ results, examId, classId }) }),
  update: (id, data) => request(`/results/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getByStudent: (studentId) => request(`/results/student/${studentId}`),
  getByClassExam: (classId, examId) => request(`/results/class/${classId}/exam/${examId}`),
};

// Academic Performance API
export const academicPerformanceApi = {
  getStudent: (studentId, params) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/academic-performance/student/${studentId}${query}`);
  },
  getClass: (classId, params) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/academic-performance/class/${classId}${query}`);
  },
  getReportCard: (studentId, params) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/academic-performance/report-card/${studentId}${query}`);
  },
  getTrends: (studentId) => request(`/academic-performance/trends/${studentId}`),
  recalculate: (studentId, data) => request(`/academic-performance/recalculate/${studentId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
};

// Subjects API
export const subjectsApi = {
  getAll: () => request('/subjects'),
  create: (data) => request('/subjects', { method: 'POST', body: JSON.stringify(data) }),
};

// Classes API
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

  // Class Settings
  getSettings: (id) => request(`/class-settings/${id}`),
  updateTag: async (id, tag) => {
    try {
      return await request(`/class-settings/${id}/tag`, {
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
      return await request(`/class-settings/${id}/subjects`, {
        method: 'PUT',
        body: JSON.stringify({ subjects: subjects })
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
export const settingsApi = {
  // School Settings
  getSchoolSettings: () => request('/settings/school'),
  updateSchoolSettings: (data) => request('/settings/school', { method: 'PUT', body: JSON.stringify(data) }),

  // Holidays
  getHolidays: () => request('/settings/holidays'),
  createHoliday: (data) => request('/settings/holidays', { method: 'POST', body: JSON.stringify(data) }),
  updateHoliday: (id, data) => request(`/settings/holidays/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHoliday: (id) => request(`/settings/holidays/${id}`, { method: 'DELETE' }),

  // Leave Types
  getLeaveTypes: () => request('/settings/leave-types'),
  createLeaveType: (data) => request('/settings/leave-types', { method: 'POST', body: JSON.stringify(data) }),
  updateLeaveType: (id, data) => request(`/settings/leave-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLeaveType: (id) => request(`/settings/leave-types/${id}`, { method: 'DELETE' }),

  // Fee Heads
  getFeeHeads: () => request('/settings/fee-heads'),
  createFeeHead: (data) => request('/settings/fee-heads', { method: 'POST', body: JSON.stringify(data) }),
  updateFeeHead: (id, data) => request(`/settings/fee-heads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFeeHead: (id) => request(`/settings/fee-heads/${id}`, { method: 'DELETE' }),

  // Subjects
  getSubjects: () => request('/settings/subjects'),
  createSubject: (data) => request('/settings/subjects', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id, data) => request(`/settings/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubject: (id) => request(`/settings/subjects/${id}`, { method: 'DELETE' }),

  // Payroll Settings
  getPayrollSettings: () => request('/settings/payroll'),
  updatePayrollSettings: (data) => request('/settings/payroll', { method: 'PUT', body: JSON.stringify(data) }),
  getPayrollReminder: () => request('/settings/payroll/reminder'),

  // Admission Form Configuration
  getAdmissionFormConfig: (fieldType) => request(`/settings/admission-form-config${fieldType ? `?fieldType=${fieldType}` : ''}`),
  createAdmissionFormConfig: (data) => request('/settings/admission-form-config', { method: 'POST', body: JSON.stringify(data) }),
  bulkUpdateAdmissionFormConfig: (configs) => request('/settings/admission-form-config/bulk', { method: 'PUT', body: JSON.stringify({ configs }) }),
  deleteAdmissionFormConfig: (id) => request(`/settings/admission-form-config/${id}`, { method: 'DELETE' }),

  // Admission ID Configuration
  getAdmissionIdConfig: () => request('/settings/admission-id-config'),
  updateAdmissionIdConfig: (data) => request('/settings/admission-id-config', { method: 'PUT', body: JSON.stringify(data) }),
  previewAdmissionId: (data) => request('/settings/admission-id-config/preview', { method: 'POST', body: JSON.stringify(data) }),

  // Roll Number Configuration
  getRollNumberConfig: () => request('/settings/roll-number-config'),
  updateRollNumberConfig: (data) => request('/settings/roll-number-config', { method: 'PUT', body: JSON.stringify(data) }),

  // Document Configuration
  getDocumentConfig: () => request('/settings/document-config'),
  createDocumentConfig: (data) => request('/settings/document-config', { method: 'POST', body: JSON.stringify(data) }),
  updateDocumentConfig: (id, data) => request(`/settings/document-config/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  bulkUpdateDocumentConfig: (configs) => request('/settings/document-config/bulk', { method: 'PUT', body: JSON.stringify({ configs }) }),
  deleteDocumentConfig: (id) => request(`/settings/document-config/${id}`, { method: 'DELETE' }),
};

// Calendar Events API
export const calendarEventsApi = {
  getAll: () => request('/calendar/events'),
  create: (data) => request('/calendar/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/calendar/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/calendar/events/${id}`, { method: 'DELETE' }),
};

// Intake Forms API
export const intakeFormsApi = {
  // Forms CRUD
  getAll: (type, status) => request(`/intake-forms${type || status ? `?${type ? `type=${type}` : ''}${status ? `&status=${status}` : ''}` : ''}`),
  getById: (id) => request(`/intake-forms/${id}`),
  create: (data) => request('/intake-forms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/intake-forms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/intake-forms/${id}`, { method: 'DELETE' }),
  duplicate: (id, createdBy) => request(`/intake-forms/${id}/duplicate`, { method: 'POST', body: JSON.stringify({ createdBy }) }),

  // Form Assignment
  assign: (id, data) => request(`/intake-forms/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  getAssignments: (formId, status) => request(`/form-assignments${formId || status ? `?${formId ? `formId=${formId}` : ''}${status ? `&status=${status}` : ''}` : ''}`),
  getAssignment: (id) => request(`/form-assignments/${id}`),
  resendAssignment: (id) => request(`/form-assignments/${id}/resend`, { method: 'PUT' }),
  deleteAssignment: (id) => request(`/form-assignments/${id}`, { method: 'DELETE' }),

  // Form Submissions
  getSubmissions: (formId, reviewStatus) => request(`/form-submissions${formId || reviewStatus ? `?${formId ? `formId=${formId}` : ''}${reviewStatus ? `&reviewStatus=${reviewStatus}` : ''}` : ''}`),
  getSubmission: (id) => request(`/form-submissions/${id}`),
  reviewSubmission: (id, data) => request(`/form-submissions/${id}/review`, { method: 'PUT', body: JSON.stringify(data) }),
  requestEdit: (id, data) => request(`/form-submissions/${id}/request-edit`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteSubmission: (id) => request(`/form-submissions/${id}`, { method: 'DELETE' }),
};

// Public API (for Teacher App - no auth required)
export const publicApi = {
  getFormByToken: (token) => request(`/public/form-assignment/${token}`),
  submitForm: (token, data) => request(`/public/form-submission/${token}`, { method: 'POST', body: JSON.stringify(data) }),
  getSubmissionStatus: (token) => request(`/public/form-submission/${token}/status`),
};

// Notifications API
export const notificationsApi = {
  getAll: (email, phone) => request(`/notifications${email || phone ? `?${email ? `email=${email}` : ''}${phone ? `&phone=${phone}` : ''}` : ''}`),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: (email, phone) => request('/notifications/read-all', { method: 'PUT', body: JSON.stringify({ email, phone }) }),
  delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  clearAll: (email, phone) => request('/notifications/clear-all', { method: 'DELETE', body: JSON.stringify({ email, phone }) }),
  getPreferences: () => request('/notification-preferences'),
  updatePreferences: (data) => request('/notification-preferences', { method: 'PUT', body: JSON.stringify(data) }),
  resetPreferences: (role) => request('/notification-preferences/reset', { method: 'POST', body: JSON.stringify({ role }) }),
};

// Fees API
export const feesApi = {
  // Payments
  getPayments: (filters) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/fees/payments${params ? `?${params}` : ''}`);
  },
  getPaymentById: (id) => request(`/fees/payments/${id}`),
  createPayment: (data) => request('/fees/payments', { method: 'POST', body: JSON.stringify(data) }),
  updatePayment: (id, data) => request(`/fees/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePayment: (id) => request(`/fees/payments/${id}`, { method: 'DELETE' }),

  // Defaulters
  getDefaulters: (filters) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/fees/defaulters${params ? `?${params}` : ''}`);
  },

  // Student Summary
  getStudentSummary: (studentId, academicYear) => request(`/fees/students/${studentId}/summary${academicYear ? `?academicYear=${academicYear}` : ''}`),

  // Refunds
  getRefunds: (filters) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/fees/refunds${params ? `?${params}` : ''}`);
  },
  getRefundById: (id) => request(`/fees/refunds/${id}`),
  createRefund: (data) => request('/fees/refunds', { method: 'POST', body: JSON.stringify(data) }),
  approveRefund: (id, data) => request(`/fees/refunds/${id}/approve`, { method: 'PUT', body: JSON.stringify(data) }),
  processRefund: (id, data) => request(`/fees/refunds/${id}/process`, { method: 'PUT', body: JSON.stringify(data) }),
  rejectRefund: (id, data) => request(`/fees/refunds/${id}/reject`, { method: 'PUT', body: JSON.stringify(data) }),
  updateRefund: (id, data) => request(`/fees/refunds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRefund: (id) => request(`/fees/refunds/${id}`, { method: 'DELETE' }),

  // Fee Structure
  getFeeStructure: (classId, academicYear) => request(`/fees/structure/${classId}${academicYear ? `?academicYear=${academicYear}` : ''}`),
  saveFeeStructure: (data) => request('/fees/structure', { method: 'POST', body: JSON.stringify(data) }),
};

// Payroll API
export const payrollApi = {
  getDashboard: (month, year) => request(`/payroll/dashboard/${month}/${year}`),
  getRecords: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payroll/records${query ? `?${query}` : ''}`);
  },
  validatePayroll: (data) => request('/payroll/validate', { method: 'POST', body: JSON.stringify(data) }),
  runPayroll: (data) => request('/payroll/run', { method: 'POST', body: JSON.stringify(data) }),
  markAsPaid: (id, data) => request(`/payroll/records/${id}/pay`, { method: 'PUT', body: JSON.stringify(data) }),
  reversePayment: (id, data) => request(`/payroll/records/${id}/reverse`, { method: 'PUT', body: JSON.stringify(data) }),
  bulkPay: (data) => request('/payroll/records/bulk-pay', { method: 'POST', body: JSON.stringify(data) }),
  fixSalaries: (data) => request('/payroll/fix-salaries', { method: 'POST', body: JSON.stringify(data || {}) }),
  exportPayroll: (month, year) => {
    window.location.href = `${API_URL}/payroll/export/${month}/${year}`;
    return Promise.resolve({ success: true });
  },
  getAuditLogs: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payroll/audit-logs${query ? `?${query}` : ''}`);
  },
};

// Upload API
export const uploadApi = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: formData,
      // Content-Type header is skipped so browser can set boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));

      if (response.status === 401) {
        console.warn('⚠️ 401 Unauthorized - clearing session');
        clearStoredUser();
      }

      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }
    return await response.json();
  }
};

// Announcements API
export const announcementsApi = {
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/announcements${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/announcements/${id}`),
  create: (data) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/announcements/${id}`, { method: 'DELETE' }),
  send: (id) => request(`/announcements/${id}/send`, { method: 'POST' }),
  resend: (id, data) => request(`/announcements/${id}/resend`, { method: 'POST', body: JSON.stringify(data || {}) }),
  getAnalytics: (id) => request(`/announcements/${id}/analytics`),
};

// Reminders API
export const remindersApi = {
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reminders${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/reminders/${id}`),
  create: (data) => request('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/reminders/${id}`, { method: 'DELETE' }),
  toggle: (id, active) => request(`/reminders/${id}/toggle`, { method: 'POST', body: JSON.stringify({ active }) }),
  duplicate: (id) => request(`/reminders/${id}/duplicate`, { method: 'POST' }),
  // Templates
  getTemplates: (type) => request(`/reminders/templates${type ? `?type=${type}` : ''}`),
  createTemplate: (data) => request('/reminders/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplate: (id, data) => request(`/reminders/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTemplate: (id) => request(`/reminders/templates/${id}`, { method: 'DELETE' }),
  setDefaultTemplate: (id) => request(`/reminders/templates/${id}/default`, { method: 'PUT' }),
};

// Calls API
export const callsApi = {
  initiate: (data) => request('/calls/initiate', { method: 'POST', body: JSON.stringify(data) }),
  accept: (id) => request(`/calls/${id}/accept`, { method: 'POST' }),
  reject: (id) => request(`/calls/${id}/reject`, { method: 'POST' }),
  end: (id, reason) => request(`/calls/${id}/end`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getHistory: (limit) => request(`/calls/history/me${limit ? `?limit=${limit}` : ''}`),
  getMissed: () => request('/calls/missed/me'),
};

// Front Office API
// Visitors API
export const visitorsApi = {
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/visitors${query ? `?${query}` : ''}`);
  },
  getActive: () => request('/visitors/active'),
  getToday: () => request('/visitors/today'),
  search: (query) => request(`/visitors/search?q=${encodeURIComponent(query)}`),
  getById: (id) => request(`/visitors/${id}`),
  create: (data) => request('/visitors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/visitors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/visitors/${id}`, { method: 'DELETE' }),
  checkOut: (id, notes = '') => request(`/visitors/${id}/check-out`, { method: 'POST', body: JSON.stringify({ notes }) }),
  downloadBadge: (id) => request(`/visitors/${id}/badge`),
  searchParents: (query) => request(`/visitors/parents/search?q=${encodeURIComponent(query)}`),
};

// Gate Passes API
export const gatePassesApi = {
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/gate-passes${query ? `?${query}` : ''}`);
  },
  getActive: () => request('/gate-passes/active'),
  getToday: () => request('/gate-passes/today'),
  getPending: () => request('/gate-passes/pending'),
  getByStudent: (id) => request(`/gate-passes/student/${id}`),
  getById: (id) => request(`/gate-passes/${id}`),
  create: (data) => request('/gate-passes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/gate-passes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/gate-passes/${id}`, { method: 'DELETE' }),
  approve: (id) => request(`/gate-passes/${id}/approve`, { method: 'POST' }),
  reject: (id, reason) => request(`/gate-passes/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  markUsed: (id, whoCollected, signatureUrl) => request(`/gate-passes/${id}/mark-used`, { method: 'POST', body: JSON.stringify({ whoCollected, signatureUrl }) }),
  cancel: (id, reason) => request(`/gate-passes/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  download: (id) => request(`/gate-passes/${id}/download`),
};

// Front Desk API
export const frontDeskApi = {
  // Visitors
  getVisitorsToday: () => request('/front-desk/visitors/today'),
  createVisitor: (data) => request('/front-desk/visitors', { method: 'POST', body: JSON.stringify(data) }),
  updateVisitor: (id, data) => request(`/front-desk/visitors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVisitor: (id) => request(`/front-desk/visitors/${id}`, { method: 'DELETE' }),

  // Admissions
  getAdmissions: (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request(`/front-desk/admissions${query}`);
  },
  createAdmission: (data) => request('/front-desk/admissions', { method: 'POST', body: JSON.stringify(data) }),
  updateAdmission: (id, data) => request(`/front-desk/admissions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdmission: (id) => request(`/front-desk/admissions/${id}`, { method: 'DELETE' }),

  // Gate Passes
  getGatePassesToday: () => request('/front-desk/gate-passes/today'),
  createGatePass: (data) => request('/front-desk/gate-passes', { method: 'POST', body: JSON.stringify(data) }),
  updateGatePass: (id, data) => request(`/front-desk/gate-passes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGatePass: (id) => request(`/front-desk/gate-passes/${id}`, { method: 'DELETE' }),

  // Appointments
  getAppointments: (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request(`/front-desk/appointments${query}`);
  },
  createAppointment: (data) => request('/front-desk/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointment: (id, data) => request(`/front-desk/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAppointment: (id) => request(`/front-desk/appointments/${id}`, { method: 'DELETE' }),

  // Feedbacks
  getFeedbacks: (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request(`/front-desk/feedbacks${query}`);
  },
  createFeedback: (data) => request('/front-desk/feedbacks', { method: 'POST', body: JSON.stringify(data) }),
  updateFeedback: (id, data) => request(`/front-desk/feedbacks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFeedback: (id) => request(`/front-desk/feedbacks/${id}`, { method: 'DELETE' }),

  // Call Logs
  getCallLogs: () => request('/front-desk/call-logs'),
  createCallLog: (data) => request('/front-desk/call-logs', { method: 'POST', body: JSON.stringify(data) }),
  updateCallLog: (id, data) => request(`/front-desk/call-logs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCallLog: (id) => request(`/front-desk/call-logs/${id}`, { method: 'DELETE' }),
};

// PIN Code Lookup API (External - No Auth Required)
export const lookupPincode = async (pincode) => {
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();

    // Check if response is valid and has data
    if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
      const postOffice = data[0].PostOffice[0];
      return {
        city: postOffice.Name,
        state: postOffice.State
      };
    }
    return null;
  } catch (error) {
    console.error('PIN code lookup failed:', error);
    return null;
  }
};

// Substitution Alerts API
export const substitutionAlertsApi = {
  getAlerts: (date) => request(`/substitution-alerts?date=${date}`),
  getAvailableTeachers: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/substitution-alerts/available-teachers?${query}`);
  },
  createFromAbsence: (teacherId, date, reason) => request('/substitution-alerts/from-absence', {
    method: 'POST',
    body: JSON.stringify({ teacherId, date, reason })
  }),
  assignSubstitute: (substitutionId, substituteTeacherId) => request(`/substitution-alerts/${substitutionId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ substituteTeacherId })
  }),
  notifySubstitute: (substitutionId, method = 'push') => request(`/substitution-alerts/${substitutionId}/notify`, {
    method: 'POST',
    body: JSON.stringify({ method })
  }),
  getStats: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return request(`/substitution-alerts/stats?${params.toString()}`);
  },
  bulkAssign: (assignments) => request('/substitution-alerts/bulk-assign', {
    method: 'POST',
    body: JSON.stringify({ assignments })
  })
};

// Parent Management API
export const parentApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/parents${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/parents/${id}`),
  resetPassword: (id) => request(`/parents/${id}/reset-password`, { method: 'POST' }),
  updateStatus: (id, status) => request(`/parents/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),
  bulkCreate: () => request('/parents/bulk-create', { method: 'POST' }),
};

export default {
  staffApi,
  studentsApi,
  trashApi,
  classesApi,
  classesEnhancedApi,
  attendanceApi,
  staffAttendanceApi,
  timetableApi,
  teacherAssignmentsApi,
  teacherTimetableApi,
  settingsApi,
  intakeFormsApi,
  publicApi,
  notificationsApi,
  feesApi,
  payrollApi,
  uploadApi,
  announcementsApi,
  remindersApi,
  callsApi,
  visitorsApi,
  gatePassesApi,
  frontDeskApi,
  examsApi,
  resultsApi,
  academicPerformanceApi,
  subjectsApi,
  substitutionAlertsApi,
  lookupPincode
};




