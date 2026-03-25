import { request } from './core.js';

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

  // Communication Settings
  getCommunicationSettings: () => request('/settings/communication'),
  updateCommunicationSettings: (data) => request('/settings/communication', { method: 'PUT', body: JSON.stringify(data) }),
};

export const billingApi = {
  getSummary: (skipCache = true) => request('/billing/summary', { skipCache }),
  updateAccount: (data) => request('/billing/account', { method: 'PUT', body: JSON.stringify(data) }),
  updateAutoRenew: (autoRenew) => request('/billing/auto-renew', {
    method: 'POST',
    body: JSON.stringify({ autoRenew })
  }),
  createCheckout: (data) => request('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  validateCoupon: (code) => request('/billing/coupon/validate', {
    method: 'POST',
    body: JSON.stringify({ code })
  }),
  getInvoices: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/billing/invoices${qs ? `?${qs}` : ''}`);
  },
  downloadInvoicePdf: (invoiceNumber) => request(`/billing/invoices/${invoiceNumber}/pdf`, { skipCache: true })
    .then((data) => {
      if (data?.url) {
        const a = document.createElement('a');
        a.href = data.url;
        a.download = `invoice-${invoiceNumber}.pdf`;
        a.rel = 'noopener noreferrer';
        a.click();
      }
    }),
  markInvoicePaid: (invoiceNumber) => request(`/billing/invoices/${invoiceNumber}/mark-paid`, { method: 'POST' }),
};

export const superAdminApi = {
  getOverview: () => request('/super-admin/overview'),
  getSchools: () => request('/super-admin/schools'),
  createSchool: (data) => request('/super-admin/schools', { method: 'POST', body: JSON.stringify(data) }),
  updateSchool: (id, data) => request(`/super-admin/schools/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  provisionSchool: (id, data) => request(`/super-admin/schools/${id}/provision`, { method: 'POST', body: JSON.stringify(data) }),
  // School health
  getSchoolHealth: () => request('/super-admin/school-health'),
  // Jobs
  getJobsMetrics: () => request('/super-admin/jobs/metrics'),
  getJobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/super-admin/jobs${qs ? `?${qs}` : ''}`);
  },
  getJobDetail: (id) => request(`/super-admin/jobs/${id}`),
  retryJob: (id) => request(`/super-admin/jobs/${id}/retry`, { method: 'POST' }),
  cancelJob: (id) => request(`/super-admin/jobs/${id}`, { method: 'DELETE' }),
  getDeadLetterJobs: () => request('/super-admin/jobs/dead-letter'),
  scheduleJob: (data) => request('/super-admin/jobs/schedule', { method: 'POST', body: JSON.stringify(data) }),
  // Growth analytics
  getGrowthAnalytics: () => request('/super-admin/growth-analytics'),
  getGrowthFunnel: () => request('/super-admin/growth-analytics/funnel'),
  getSchoolGrowth: (schoolId) => request(`/super-admin/growth-analytics/${schoolId}`),
};

// Changelog API (super-admin)
export const changelogAdminApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/changelog/admin${qs ? `?${qs}` : ''}`);
  },
  create: (data) => request('/changelog/admin', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/changelog/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/changelog/admin/${id}`, { method: 'DELETE' }),
};

// Feature Flags API (super-admin)
export const featureFlagsAdminApi = {
  getAll: () => request('/feature-flags/admin/all'),
  create: (data) => request('/feature-flags/admin', { method: 'POST', body: JSON.stringify(data) }),
  update: (key, data) => request(`/feature-flags/admin/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (key) => request(`/feature-flags/admin/${key}`, { method: 'DELETE' }),
  setOverride: (key, data) => request(`/feature-flags/admin/${key}/override`, { method: 'POST', body: JSON.stringify(data) }),
  removeOverride: (key, schoolId) => request(`/feature-flags/admin/${key}/override/${schoolId}`, { method: 'DELETE' }),
  getAuditLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/feature-flags/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },
};

// SSO & SCIM API
export const ssoApi = {
  getConfig: () => request('/auth/sso/config'),
  updateConfig: (data) => request('/auth/sso/config', { method: 'PUT', body: JSON.stringify(data) }),
  getScimToken: () => request('/auth/sso/scim/token'),
  regenerateScimToken: () => request('/auth/sso/scim/regenerate-token', { method: 'POST' }),
};

// Calendar Events API
