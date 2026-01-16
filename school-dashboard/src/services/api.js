const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('🌐 API URL configured:', API_URL);

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for Render cold starts

    // Get token from sessionStorage
    const storedUser = sessionStorage.getItem('app_user');
    let token = null;
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        token = userData.token;
      } catch (err) {
        console.error('❌ Failed to parse user data from sessionStorage:', err);
      }
    }
    
    console.log(`🔐 Token for ${endpoint}:`, token ? `${token.substring(0, 20)}...` : 'NONE');

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log(`✅ Authorization header added for ${endpoint}`);
    } else {
      console.warn(`⚠️ No token available for ${endpoint}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`✅ API Response: ${response.status} ${url}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      
      // If unauthorized, clear session storage
      if (response.status === 401) {
        console.warn('⚠️ 401 Unauthorized - clearing session');
        sessionStorage.removeItem('app_user');
      }
      
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`📦 API Data received from ${endpoint}:`, Array.isArray(data) ? `${data.length} items` : 'object');
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`⏱️ API Timeout: ${url}`);
      throw new Error('Request timeout - please check if backend is running');
    }
    console.error(`❌ API Error: ${url}`, error);
    throw error;
  }
}

// Staff API
export const staffApi = {
  getAll: () => request('/staff'),
  getById: (id) => request(`/staff/${id}`),
  create: (data) => request('/staff', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateCredentials: (id, data) => request(`/staff/${id}/credentials`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/staff/${id}`, { method: 'DELETE' }),
};

// Students API
export const studentsApi = {
  getAll: async (classId) => {
    const response = await request(`/students${classId ? `?classId=${classId}` : ''}`);
    // Backend returns paginated response with data property
    return response.data || response;
  },
  getById: (id) => request(`/students/${id}`),
  create: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/students/${id}`, { method: 'DELETE' }),
  getNextAdmissionId: () => request('/students/next-admission-id'),
};

// Classes API
export const classesApi = {
  getAll: () => request('/classes'),
  getById: (id) => request(`/classes/${id}`),
  create: (data) => request('/classes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/classes/${id}`, { method: 'DELETE' }),
  getStudents: (id) => request(`/classes/${id}/students`),
};

// Attendance API
export const attendanceApi = {
  mark: (data) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  markBulk: (data) => request('/attendance/bulk', { method: 'POST', body: JSON.stringify(data) }),
  getByClassDate: (classId, date) => request(`/attendance/${classId}/${date}`),
};

// Timetable API
export const timetableApi = {
  getByClass: (classId, academicYear) => request(`/timetable/${classId}${academicYear ? `?academicYear=${academicYear}` : ''}`),
  createOrUpdate: (data) => request('/timetable', { method: 'POST', body: JSON.stringify(data) }),
  updateSlot: (classId, data) => request(`/timetable/${classId}/slot`, { method: 'PUT', body: JSON.stringify(data) }),
  updatePeriods: (classId, data) => request(`/timetable/${classId}/periods`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (classId, academicYear) => request(`/timetable/${classId}${academicYear ? `?academicYear=${academicYear}` : ''}`, { method: 'DELETE' }),
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
    const token = localStorage.getItem('token');
    window.location.href = `${API_URL}/payroll/export/${month}/${year}?token=${token}`;
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
      body: formData,
      // Content-Type header is skipped so browser can set boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }
    return await response.json();
  }
};

export default { staffApi, studentsApi, classesApi, attendanceApi, timetableApi, settingsApi, intakeFormsApi, publicApi, notificationsApi, feesApi, payrollApi, uploadApi };
