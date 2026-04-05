import { request, requestBlob } from './core.js';

export const calendarEventsApi = {
  getAll: (options) => options?.signal ? request('/calendar/events', { signal: options.signal }) : request('/calendar/events'),
  create: (data) => request('/calendar/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/calendar/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/calendar/events/${id}`, { method: 'DELETE' }),
};

// Intake Forms API
export const intakeFormsApi = {
  // Forms CRUD
  getAll: (type, status) => {
    const p = new URLSearchParams();
    if (type) p.set('type', type);
    if (status) p.set('status', status);
    const qs = p.toString();
    return request(`/intake-forms${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => request(`/intake-forms/${id}`),
  create: (data) => request('/intake-forms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/intake-forms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/intake-forms/${id}`, { method: 'DELETE' }),
  duplicate: (id, createdBy) => request(`/intake-forms/${id}/duplicate`, { method: 'POST', body: JSON.stringify({ createdBy }) }),

  // Form Assignment
  assign: (id, data) => request(`/intake-forms/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  getAssignments: (formId, status) => {
    const p = new URLSearchParams();
    if (formId) p.set('formId', formId);
    if (status) p.set('status', status);
    const qs = p.toString();
    return request(`/form-assignments${qs ? `?${qs}` : ''}`);
  },
  getAssignment: (id) => request(`/form-assignments/${id}`),
  resendAssignment: (id) => request(`/form-assignments/${id}/resend`, { method: 'PUT' }),
  deleteAssignment: (id) => request(`/form-assignments/${id}`, { method: 'DELETE' }),

  // Form Submissions
  getSubmissions: (formId, reviewStatus) => {
    const p = new URLSearchParams();
    if (formId) p.set('formId', formId);
    if (reviewStatus) p.set('reviewStatus', reviewStatus);
    const qs = p.toString();
    return request(`/form-submissions${qs ? `?${qs}` : ''}`);
  },
  getSubmission: (id) => request(`/form-submissions/${id}`),
  reviewSubmission: (id, data) => request(`/form-submissions/${id}/review`, { method: 'PUT', body: JSON.stringify(data) }),
  requestEdit: (id, data) => request(`/form-submissions/${id}/request-edit`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteSubmission: (id) => request(`/form-submissions/${id}`, { method: 'DELETE' }),
};

// Public API (for parent form submissions - no auth required, uses secured public.js routes)
export const publicApi = {
  getFormByToken: (token) => request(`/public/form-assignment/${token}`),
  submitForm: (token, data) => request(`/public/form-submission/${token}`, { method: 'POST', body: JSON.stringify(data) }),
  getSubmissionStatus: (token) => request(`/public/form-submission/${token}/status`),
};

// Notifications API
export const notificationsApi = {
  getAll: (params) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    return request(`/notifications${query ? `?${query}` : ''}`);
  },
  getUnreadCount: () => request('/notifications/unread-count'),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  clearAll: () => request('/notifications/clear-all', { method: 'DELETE' }),
  getPreferences: () => request('/notifications/preferences/me'),
  updatePreferences: (data) => request('/notifications/preferences/me', { method: 'PUT', body: JSON.stringify(data) }),
  resetPreferences: () => request('/notifications/preferences/reset', { method: 'POST' }),
};

// Fees API
export const feesApi = {
  // Payments
  getPayments: async (filters) => {
    const params = new URLSearchParams(filters).toString();
    const res = await request(`/fees/payments${params ? `?${params}` : ''}`);
    // Backend returns { payments, pagination }; preserve full shape for callers
    // For backward-compat with plain-array responses, normalize to { payments, pagination }
    if (Array.isArray(res)) return { payments: res, pagination: null };
    return { payments: res?.payments ?? [], pagination: res?.pagination ?? null };
  },
  getPaymentById: (id) => request(`/fees/payments/${id}`),
  createPayment: (data) => request('/fees/payments', { method: 'POST', body: JSON.stringify(data) }),
  updatePayment: (id, data) => request(`/fees/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePayment: (id) => request(`/fees/payments/${id}`, { method: 'DELETE' }),

  // Defaulters
  getDefaulters: (filters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, value);
        }
      });
    }
    const qs = params.toString();
    return request(`/student-fees/defaulters${qs ? `?${qs}` : ''}`);
  },

  // Student Summary
  getStudentSummary: (studentId, academicYear) => request(`/students/${studentId}/fee-summary${academicYear ? `?academicYear=${academicYear}` : ''}`),

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
  getFeeStructure: (classId, academicYear) => request(`/fee-structure/class/${classId}${academicYear ? `?academicYear=${academicYear}` : ''}`),
  saveFeeStructure: (data) => request('/fee-structure', { method: 'POST', body: JSON.stringify(data) }),
};

export const studentFeesApi = {
  getAll: (academicYear) => request(`/student-fees/all${academicYear ? `?academicYear=${academicYear}` : ''}`),
  getByStudent: (studentId, academicYear) => request(`/student-fees/student/${studentId}${academicYear ? `?academicYear=${academicYear}` : ''}`),
  getBatch: (studentIds, academicYear) => request('/student-fees/batch', {
    method: 'POST',
    body: JSON.stringify({ studentIds, academicYear })
  }),
  initialize: (studentId, academicYear) => request(`/student-fees/initialize/${studentId}`, {
    method: 'POST',
    body: JSON.stringify({ academicYear })
  }),
  recordPayment: (studentId, data) => request(`/student-fees/student/${studentId}/payment`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
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
  // [AUDIT-159] Now uses centralized requestBlob() for automatic token refresh
  exportPayroll: async (month, year) => {
    const response = await requestBlob(`/payroll/export/${month}/${year}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${month}-${year}.xlsx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      a.remove();
    }, 1000);
    return { success: true };
  },
  getAuditLogs: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payroll/audit-logs${query ? `?${query}` : ''}`);
  },
};

// Upload API
