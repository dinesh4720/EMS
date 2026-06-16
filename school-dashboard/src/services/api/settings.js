import { request } from './core.js';
import { withDefaultLimit } from './fetchDefaults.js';

export const settingsApi = {
  // School Settings
  getSchoolSettings: (options) => options?.signal ? request('/settings/school', { signal: options.signal }) : request('/settings/school'),
  updateSchoolSettings: (data, options) => request('/settings/school', { method: 'PUT', body: JSON.stringify(data), ...(options?.signal ? { signal: options.signal } : {}) }),

  // Holidays
  getHolidays: (options) => options?.signal ? request('/settings/holidays', { signal: options.signal }) : request('/settings/holidays'),
  createHoliday: (data, options) => request('/settings/holidays', { method: 'POST', body: JSON.stringify(data), ...(options?.signal ? { signal: options.signal } : {}) }),
  updateHoliday: (id, data, options) => request(`/settings/holidays/${id}`, { method: 'PUT', body: JSON.stringify(data), ...(options?.signal ? { signal: options.signal } : {}) }),
  deleteHoliday: (id, options) => request(`/settings/holidays/${id}`, { method: 'DELETE', ...(options?.signal ? { signal: options.signal } : {}) }),

  // Leave Types
  getLeaveTypes: (options) => options?.signal ? request('/settings/leave-types', { signal: options.signal }) : request('/settings/leave-types'),
  createLeaveType: (data) => request('/settings/leave-types', { method: 'POST', body: JSON.stringify(data) }),
  updateLeaveType: (id, data) => request(`/settings/leave-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLeaveType: (id) => request(`/settings/leave-types/${id}`, { method: 'DELETE' }),

  // Fee Heads
  getFeeHeads: (options) => options?.signal ? request('/settings/fee-heads', { signal: options.signal }) : request('/settings/fee-heads'),
  createFeeHead: (data) => request('/settings/fee-heads', { method: 'POST', body: JSON.stringify(data) }),
  updateFeeHead: (id, data) => request(`/settings/fee-heads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFeeHead: (id) => request(`/settings/fee-heads/${id}`, { method: 'DELETE' }),

  // Subjects
  getSubjects: (options) => options?.signal ? request('/settings/subjects', { signal: options.signal }) : request('/settings/subjects'),
  createSubject: (data, options) => request('/settings/subjects', { method: 'POST', body: JSON.stringify(data), ...(options?.signal ? { signal: options.signal } : {}) }),
  updateSubject: (id, data, options) => request(`/settings/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data), ...(options?.signal ? { signal: options.signal } : {}) }),
  deleteSubject: (id, options) => request(`/settings/subjects/${id}`, { method: 'DELETE', ...(options?.signal ? { signal: options.signal } : {}) }),
  syncSubjectsToClasses: () => request('/settings/subjects/sync', { method: 'POST' }),

  // Salary Templates
  getSalaryTemplates: () => request('/settings/salary-templates'),
  createSalaryTemplate: (data) => request('/settings/salary-templates', { method: 'POST', body: JSON.stringify(data) }),
  updateSalaryTemplate: (id, data) => request(`/settings/salary-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSalaryTemplate: (id) => request(`/settings/salary-templates/${id}`, { method: 'DELETE' }),

  // Payroll Settings
  getPayrollSettings: (options) => options?.signal ? request('/settings/payroll', { signal: options.signal }) : request('/settings/payroll'),
  updatePayrollSettings: (data, options) => request('/settings/payroll', { method: 'PUT', body: JSON.stringify(data), ...(options?.signal ? { signal: options.signal } : {}) }),
  getPayrollReminder: (options) => options?.signal ? request('/settings/payroll/reminder', { signal: options.signal }) : request('/settings/payroll/reminder'),

  // Salary Components
  getSalaryComponents: (options) => options?.signal ? request('/settings/salary-components', { signal: options.signal }) : request('/settings/salary-components'),
  updateSalaryComponents: (data, options) => request('/settings/salary-components', { method: 'PUT', body: JSON.stringify(data), ...(options?.signal ? { signal: options.signal } : {}) }),

  // Admission Form Configuration
  getAdmissionFormConfig: (fieldType) => request(`/settings/admission-form-config${fieldType ? `?fieldType=${fieldType}` : ''}`),
  createAdmissionFormConfig: (data) => request('/settings/admission-form-config', { method: 'POST', body: JSON.stringify(data) }),
  bulkUpdateAdmissionFormConfig: (configs) => request('/settings/admission-form-config/bulk', { method: 'PUT', body: JSON.stringify({ configs }) }),
  deleteAdmissionFormConfig: (id) => request(`/settings/admission-form-config/${id}`, { method: 'DELETE' }),

  // Admission ID Configuration
  getAdmissionIdConfig: (options) => options?.signal ? request('/settings/admission-id-config', { signal: options.signal }) : request('/settings/admission-id-config'),
  updateAdmissionIdConfig: (data) => request('/settings/admission-id-config', { method: 'PUT', body: JSON.stringify(data) }),
  previewAdmissionId: (data) => request('/settings/admission-id-config/preview', { method: 'POST', body: JSON.stringify(data) }),

  // Roll Number Configuration
  getRollNumberConfig: (options) => options?.signal ? request('/settings/roll-number-config', { signal: options.signal }) : request('/settings/roll-number-config'),
  updateRollNumberConfig: (data) => request('/settings/roll-number-config', { method: 'PUT', body: JSON.stringify(data) }),

  // Document Configuration
  getDocumentConfig: (options) => options?.signal ? request('/settings/document-config', { signal: options.signal }) : request('/settings/document-config'),
  createDocumentConfig: (data) => request('/settings/document-config', { method: 'POST', body: JSON.stringify(data) }),
  updateDocumentConfig: (id, data) => request(`/settings/document-config/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  bulkUpdateDocumentConfig: (configs) => request('/settings/document-config/bulk', { method: 'PUT', body: JSON.stringify({ configs }) }),
  deleteDocumentConfig: (id) => request(`/settings/document-config/${id}`, { method: 'DELETE' }),
  saveDocumentConfigAtomic: (configs) => request('/settings/document-config/atomic', { method: 'PUT', body: JSON.stringify({ configs }) }),

  // Communication Settings
  getCommunicationSettings: (options) => options?.signal ? request('/settings/communication', { signal: options.signal }) : request('/settings/communication'),
  updateCommunicationSettings: (data, options) => request('/settings/communication', { method: 'PUT', body: JSON.stringify(data), ...(options?.signal ? { signal: options.signal } : {}) }),

  // Email Templates
  getEmailTemplates: () => request('/settings/email-templates'),
  getEmailTemplate: (id) => request(`/settings/email-templates/${id}`),
  createEmailTemplate: (data) => request('/settings/email-templates', { method: 'POST', body: JSON.stringify(data) }),
  updateEmailTemplate: (id, data) => request(`/settings/email-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmailTemplate: (id) => request(`/settings/email-templates/${id}`, { method: 'DELETE' }),
  previewEmailTemplate: (id, data) => request(`/settings/email-templates/${id}/preview`, { method: 'POST', body: JSON.stringify(data) }),

  // SMS Templates
  getSmsTemplates: () => request('/settings/sms-templates'),
  getSmsTemplate: (id) => request(`/settings/sms-templates/${id}`),
  createSmsTemplate: (data) => request('/settings/sms-templates', { method: 'POST', body: JSON.stringify(data) }),
  updateSmsTemplate: (id, data) => request(`/settings/sms-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSmsTemplate: (id) => request(`/settings/sms-templates/${id}`, { method: 'DELETE' }),

  // Email Domain
  getEmailDomain: () => request('/settings/email-domain'),
  createEmailDomain: (data) => request('/settings/email-domain', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmailDomain: () => request('/settings/email-domain/verify', { method: 'POST' }),
  deleteEmailDomain: () => request('/settings/email-domain', { method: 'DELETE' }),

  // Data Residency
  getDataResidency: () => request('/settings/data-residency'),
  updateDataResidency: (data) => request('/settings/data-residency', { method: 'PUT', body: JSON.stringify(data) }),
  lockDataResidency: () => request('/settings/data-residency/lock', { method: 'POST' }),

  // Exam Configuration
  getExamDefaults: () => request('/settings/exam-defaults'),
  getExamConfig: () => request('/settings/exam-config'),
  getBoardConfigPresets: () => request('/settings/board-config/presets'),

  // Academic Year
  getAcademicYear: () => request('/settings/academic-year'),
  updateAcademicYear: (data) => request('/settings/academic-year', { method: 'PUT', body: JSON.stringify(data) }),
  getAcademicYearTransitionPreview: () => request('/settings/academic-year/transition-preview'),

  // Attendance Rules
  getAttendanceRules: (options) => options?.signal ? request('/settings/attendance-rules', { signal: options.signal }) : request('/settings/attendance-rules'),
  updateAttendanceRules: (data, options) => request('/settings/attendance-rules', { method: 'PUT', body: JSON.stringify(data), ...(options?.signal ? { signal: options.signal } : {}) }),

  // Onboarding
  getOnboardingStatus: () => request('/settings/onboarding-status'),
  updateOnboardingProgress: (data) => request('/settings/onboarding-progress', { method: 'PUT', body: JSON.stringify(data) }),
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
  validateCoupon: (code) => request('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code })
  }),
  getInvoices: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/billing/invoices${qs ? `?${qs}` : ''}`);
  },
  downloadInvoicePdf: async (invoiceNumber) => {
    const data = await request(`/billing/invoices/${invoiceNumber}/pdf`, { skipCache: true });
    if (!data?.url) {
      throw new Error('Invoice PDF URL not available');
    }
    const a = document.createElement('a');
    a.href = data.url;
    a.download = `invoice-${invoiceNumber}.pdf`;
    a.rel = 'noopener noreferrer';
    a.click();
    return data;
  },
  markInvoicePaid: (invoiceNumber) => request(`/billing/invoices/${invoiceNumber}/mark-paid`, { method: 'POST' }),
};

export const superAdminApi = {
  getOverview: () => request('/super-admin/overview'),
  getSchools: (params = {}) => {
    const qs = new URLSearchParams(withDefaultLimit(params)).toString();
    return request(`/super-admin/schools${qs ? `?${qs}` : ''}`);
  },
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
  getConfig: (options) => options?.signal ? request('/auth/sso/config', { signal: options.signal }) : request('/auth/sso/config'),
  updateConfig: (data) => request('/auth/sso/config', { method: 'PUT', body: JSON.stringify(data) }),
  getScimToken: (options) => options?.signal ? request('/auth/sso/scim/token', { signal: options.signal }) : request('/auth/sso/scim/token'),
  regenerateScimToken: (options) => request('/auth/sso/scim/regenerate-token', { method: 'POST', ...(options?.signal ? { signal: options.signal } : {}) }),
};

// Audit Logs API
export const auditLogsApi = {
  getLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/audit-logs${qs ? `?${qs}` : ''}`);
  },
  getLog: (id) => request(`/audit-logs/${id}`),
  exportLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/audit-logs/export${qs ? `?${qs}` : ''}`);
  },
  purgeLogs: (retentionMonths = 12) => request('/audit-logs/purge', { method: 'POST', body: JSON.stringify({ retentionMonths }) }),
};

// Calendar Events API
