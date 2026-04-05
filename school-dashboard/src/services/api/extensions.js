import { request, requestUpload } from './core.js';
import { getAuthHeaders, saveStoredUser } from '../../utils/authSession';
import { API_URL } from '../../config/api.js';

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

// Inventory API
export const inventoryApi = {
  getStats: () => request('/inventory/stats'),
  getReports: () => request('/inventory/reports'),

  getAssets: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') query.set(k, v);
    });
    const qs = query.toString();
    return request(`/inventory/assets${qs ? `?${qs}` : ''}`);
  },
  getAsset: (id) => request(`/inventory/assets/${id}`),
  getLowStockAssets: () => request('/inventory/assets/low-stock'),
  createAsset: (data) => request('/inventory/assets', { method: 'POST', body: JSON.stringify(data) }),
  updateAsset: (id, data) => request(`/inventory/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAsset: (id) => request(`/inventory/assets/${id}`, { method: 'DELETE' }),
  assignAsset: (id, data) => request(`/inventory/assets/${id}/assign`, { method: 'PUT', body: JSON.stringify(data) }),
  getAssetDepreciation: (id) => request(`/inventory/assets/${id}/depreciation`),

  getCategories: () => request('/inventory/categories'),
  createCategory: (data) => request('/inventory/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/inventory/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/inventory/categories/${id}`, { method: 'DELETE' }),

  getVendors: (search) => request(`/inventory/vendors${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createVendor: (data) => request('/inventory/vendors', { method: 'POST', body: JSON.stringify(data) }),
  updateVendor: (id, data) => request(`/inventory/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVendor: (id) => request(`/inventory/vendors/${id}`, { method: 'DELETE' }),

  getMaintenance: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, v);
    });
    const qs = query.toString();
    return request(`/inventory/maintenance${qs ? `?${qs}` : ''}`);
  },
  createMaintenance: (data) => request('/inventory/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateMaintenance: (id, data) => request(`/inventory/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getProcurement: (status) => request(`/inventory/procurement${status ? `?status=${status}` : ''}`),
  createProcurement: (data) => request('/inventory/procurement', { method: 'POST', body: JSON.stringify(data) }),
  updateProcurement: (id, data) => request(`/inventory/procurement/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProcurement: (id) => request(`/inventory/procurement/${id}`, { method: 'DELETE' }),

  getAudits: (status) => request(`/inventory/audits${status ? `?status=${status}` : ''}`),
  createAudit: (data) => request('/inventory/audits', { method: 'POST', body: JSON.stringify(data) }),
  updateAudit: (id, data) => request(`/inventory/audits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAudit: (id) => request(`/inventory/audits/${id}`, { method: 'DELETE' }),
};

export const libraryApi = {
  getStats: () => request('/v1/library/stats'),
  getReports: () => request('/v1/library/reports'),
  getBooks: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') query.set(k, v);
    });
    const qs = query.toString();
    return request(`/v1/library/books${qs ? `?${qs}` : ''}`);
  },
  getBook: (id) => request(`/v1/library/books/${id}`),
  createBook: (data) => request('/v1/library/books', { method: 'POST', body: JSON.stringify(data) }),
  updateBook: (id, data) => request(`/v1/library/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBook: (id) => request(`/v1/library/books/${id}`, { method: 'DELETE' }),
  getIssues: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') query.set(k, v);
    });
    const qs = query.toString();
    return request(`/v1/library/issues${qs ? `?${qs}` : ''}`);
  },
  issueBook: (data) => request('/v1/library/issues', { method: 'POST', body: JSON.stringify(data) }),
  returnBook: (id, data) => request(`/v1/library/issues/${id}/return`, { method: 'PUT', body: JSON.stringify(data) }),
  syncOverdue: () => request('/v1/library/sync-overdue', { method: 'POST' }),
};

// Transport API
export const transportApi = {
  // Vehicles
  getVehicles: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') q.set(k, v); });
    const qs = q.toString();
    return request(`/transport/vehicles${qs ? `?${qs}` : ''}`);
  },
  getVehicle: (id) => request(`/transport/vehicles/${id}`),
  createVehicle: (data) => request('/transport/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id, data) => request(`/transport/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVehicle: (id) => request(`/transport/vehicles/${id}`, { method: 'DELETE' }),

  // Routes
  getRoutes: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') q.set(k, v); });
    const qs = q.toString();
    return request(`/transport/routes${qs ? `?${qs}` : ''}`);
  },
  getRoute: (id) => request(`/transport/routes/${id}`),
  createRoute: (data) => request('/transport/routes', { method: 'POST', body: JSON.stringify(data) }),
  updateRoute: (id, data) => request(`/transport/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoute: (id) => request(`/transport/routes/${id}`, { method: 'DELETE' }),

  // Student assignments
  assignStudent: (routeId, data) => request(`/transport/routes/${routeId}/students`, { method: 'POST', body: JSON.stringify(data) }),
  removeStudent: (routeId, studentId) => request(`/transport/routes/${routeId}/students/${studentId}`, { method: 'DELETE' }),

  // Reports
  getReports: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') q.set(k, v); });
    const qs = q.toString();
    return request(`/transport/reports${qs ? `?${qs}` : ''}`);
  },
};

// Reports API
export const reportsApi = {
  dashboardMetrics: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/dashboard/metrics${q ? `?${q}` : ''}`);
  },
  classResults: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/academic/class-results${q ? `?${q}` : ''}`);
  },
  subjectAnalysis: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/academic/subject-analysis${q ? `?${q}` : ''}`);
  },
  rankList: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/academic/rank-list${q ? `?${q}` : ''}`);
  },
  gradeDistribution: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/academic/grade-distribution${q ? `?${q}` : ''}`);
  },
  feeCollection: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/financial/fee-collection${q ? `?${q}` : ''}`);
  },
  outstandingDues: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/financial/outstanding-dues${q ? `?${q}` : ''}`);
  },
  studentAttendance: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/attendance/student${q ? `?${q}` : ''}`);
  },
  classwiseAttendance: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/attendance/class-summary${q ? `?${q}` : ''}`);
  },
  staffAttendance: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/staff/attendance-summary${q ? `?${q}` : ''}`);
  },
  payrollSummary: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/staff/payroll-summary${q ? `?${q}` : ''}`);
  },
  studentStrength: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/operational/student-strength${q ? `?${q}` : ''}`);
  },
  admissions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/operational/admissions${q ? `?${q}` : ''}`);
  },
};

// Export API
export const exportApi = {
  students: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/export/students${q ? `?${q}` : ''}`);
  },
  staff: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/export/staff${q ? `?${q}` : ''}`);
  },
  feeCollection: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/export/fee-collection${q ? `?${q}` : ''}`);
  },
  attendance: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/export/attendance${q ? `?${q}` : ''}`);
  },
  examResults: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/export/exam-results${q ? `?${q}` : ''}`);
  },
  payroll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/export/payroll${q ? `?${q}` : ''}`);
  },
  govtUdise: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/export/govt/udise${q ? `?${q}` : ''}`);
  },
  govtCbse: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/export/govt/cbse${q ? `?${q}` : ''}`);
  },
  govtIcse: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/export/govt/icse${q ? `?${q}` : ''}`);
  },
  govtStateBoard: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/export/govt/state-board${q ? `?${q}` : ''}`);
  },
  govtAnnualReport: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/export/govt/annual-report${q ? `?${q}` : ''}`);
  },
  govtComplianceChecklist: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/export/govt/compliance-checklist${q ? `?${q}` : ''}`);
  },
};

// Bulk Import API
export const bulkImportApi = {
  downloadTemplate: (type) => request(`/bulk-import/template/${type}`),
  // [AUDIT-159] Now uses centralized requestUpload() for automatic token refresh
  upload: (formData) => requestUpload('/bulk-import/upload', formData),
  preview: (jobId) => request(`/bulk-import/preview/${jobId}`),
  confirm: (jobId) => request(`/bulk-import/confirm/${jobId}`, { method: 'POST' }),
};

// Hostel API
export const hostelApi = {
  getStats: () => request('/hostel/stats'),

  getHostels: (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request(`/hostel/hostels${query}`);
  },
  getHostel: (id) => request(`/hostel/hostels/${id}`),
  createHostel: (data) => request('/hostel/hostels', { method: 'POST', body: JSON.stringify(data) }),
  updateHostel: (id, data) => request(`/hostel/hostels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHostel: (id) => request(`/hostel/hostels/${id}`, { method: 'DELETE' }),

  getRooms: (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request(`/hostel/rooms${query}`);
  },
  getRoom: (id) => request(`/hostel/rooms/${id}`),
  createRoom: (data) => request('/hostel/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id, data) => request(`/hostel/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom: (id) => request(`/hostel/rooms/${id}`, { method: 'DELETE' }),

  getAllocations: (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request(`/hostel/allocations${query}`);
  },
  getAllocation: (id) => request(`/hostel/allocations/${id}`),
  createAllocation: (data) => request('/hostel/allocations', { method: 'POST', body: JSON.stringify(data) }),
  vacateAllocation: (id, data) => request(`/hostel/allocations/${id}/vacate`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Background Jobs API
export const jobsApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/jobs${q ? `?${q}` : ''}`);
  },
  stats: () => request('/jobs/stats'),
  getImportJob: (jobId) => request(`/jobs/import/${jobId}`),
  cancelJob: (jobId) => request(`/jobs/import/${jobId}`, { method: 'DELETE' }),
};

// PTM (Parent-Teacher Meetings) API
export const ptmApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/ptm${q ? `?${q}` : ''}`);
  },
  getById: (id) => request(`/ptm/${id}`),
  create: (data) => request('/ptm', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/ptm/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/ptm/${id}`, { method: 'DELETE' }),
  addSlot: (id, data) => request(`/ptm/${id}/slots`, { method: 'POST', body: JSON.stringify(data) }),
  updateSlot: (sessionId, slotId, data) => request(`/ptm/${sessionId}/slots/${slotId}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancelSlot: (sessionId, slotId) => request(`/ptm/${sessionId}/slots/${slotId}`, { method: 'DELETE' }),
};

// Webhooks API
export const webhooksApi = {
  getAll: () => request('/webhooks'),
  getEvents: () => request('/webhooks/events'),
  create: (data) => request('/webhooks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/webhooks/${id}`, { method: 'DELETE' }),
  test: (id) => request(`/webhooks/${id}/test`, { method: 'POST' }),
};

// Email Campaigns API
export const emailCampaignsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/email-campaigns${q ? `?${q}` : ''}`);
  },
  getById: (id) => request(`/email-campaigns/${id}`),
  create: (data) => request('/email-campaigns', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/email-campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/email-campaigns/${id}`, { method: 'DELETE' }),
  send: (id) => request(`/email-campaigns/${id}/send`, { method: 'POST' }),
  preview: (id) => request(`/email-campaigns/${id}/preview`),
};

// Promotion API
export const promotionApi = {
  preview: (classId, academicYear) => {
    const q = new URLSearchParams({ classId, ...(academicYear && { academicYear }) }).toString();
    return request(`/promotions/preview?${q}`);
  },
  execute: (data) => request('/promotions/execute', { method: 'POST', body: JSON.stringify(data) }),
  rollback: (recordId, data = {}) => request(`/promotions/rollback/${recordId}`, { method: 'POST', body: JSON.stringify(data) }),
  getRecords: () => request('/promotions/records'),
  getRecord: (recordId) => request(`/promotions/records/${recordId}`),
  getRules: () => request('/promotions/rules'),
  updateRules: (data) => request('/promotions/rules', { method: 'PUT', body: JSON.stringify(data) }),
  // Multi-class wizard endpoints
  checkYear: (academicYear) => request(`/promotions/check-year?academicYear=${encodeURIComponent(academicYear)}`),
  previewAll: (academicYear, toAcademicYear) => {
    const params = new URLSearchParams({ academicYear, ...(toAcademicYear && { toAcademicYear }) }).toString();
    return request(`/promotions/preview-all?${params}`);
  },
  executeAll: (data) => request('/promotions/execute-all', { method: 'POST', body: JSON.stringify(data) }),
  newAcademicYear: (data) => request('/promotions/new-academic-year', { method: 'POST', body: JSON.stringify(data) }),
};

// NPS API
export const npsApi = {
  getStatus: () => request('/nps/status'),
  submit: (data) => request('/nps/submit', { method: 'POST', body: JSON.stringify(data) }),
  dismiss: () => request('/nps/dismiss', { method: 'POST' }),
  getAnalytics: (params) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const query = qs.toString();
    return request(`/nps/analytics${query ? `?${query}` : ''}`);
  },
  getConfig: () => request('/nps/config'),
  updateConfig: (data) => request('/nps/config', { method: 'PUT', body: JSON.stringify(data) }),
};

// CBSE Report Card API
export const cbseReportCardApi = {
  getForStudent: (studentId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/cbse-report-card/student/${studentId}${q ? `?${q}` : ''}`);
  },
  create: (data) => request('/cbse-report-card', { method: 'POST', body: JSON.stringify(data) }),
  bulkCreate: (data) => request('/cbse-report-card/bulk', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/cbse-report-card/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/cbse-report-card/${id}`, { method: 'DELETE' }),
};

// CCE Config API
export const cceApi = {
  getConfig: (academicYear) => {
    const q = academicYear ? `?academicYear=${encodeURIComponent(academicYear)}` : '';
    return request(`/cce/config${q}`);
  },
  createConfig: (data) => request('/cce/config', { method: 'POST', body: JSON.stringify(data) }),
  updateConfig: (data, academicYear) => {
    const q = academicYear ? `?academicYear=${encodeURIComponent(academicYear)}` : '';
    return request(`/cce/config${q}`, { method: 'PUT', body: JSON.stringify(data) });
  },
};

// Expenses API
export const expensesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, v);
    });
    const qs = query.toString();
    return request(`/expenses${qs ? `?${qs}` : ''}`);
  },
  getSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/expenses/summary${query ? `?${query}` : ''}`);
  },
  create: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
};

// Silent refresh: verify session is still valid and refresh stored user data
export async function silentRefresh() {
  try {
    const response = await fetch(`${API_URL}/auth/session`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) return false;
    const sessionUser = await response.json();
    saveStoredUser(sessionUser);
    return true;
  } catch {
    return false;
  }
}




