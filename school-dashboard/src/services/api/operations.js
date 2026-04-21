import { request, requestUpload } from './core.js';
import logger from '../../utils/logger';

// [AUDIT-159] Upload now uses centralized requestUpload() for automatic token refresh
export const uploadApi = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return requestUpload('/upload', formData);
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
  getStats: () => request('/announcements/stats'),
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
  getTemplates: (type) => request(`/reminders/templates/all${type ? `?type=${type}` : ''}`),
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
  // Visitors — delegates to dedicated /visitors routes (with Zod validation)
  getVisitorsToday: () => request('/visitors/today').then((r) => r.data || []),
  getVisitorsByDate: (date) => request(`/visitors?startDate=${date}&endDate=${date}`).then((r) => r.data || []),
  createVisitor: (data) => request('/visitors', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.data),
  updateVisitor: (id, data) => request(`/visitors/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.data),
  checkoutVisitor: (id, data = {}) => request(`/visitors/${id}/check-out`, { method: 'POST', body: JSON.stringify(data) }).then((r) => r.data),
  deleteVisitor: (id) => request(`/visitors/${id}`, { method: 'DELETE' }),

  // Admissions
  getAdmissions: (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request(`/front-desk/admissions${query}`);
  },
  createAdmission: (data) => request('/front-desk/admissions', { method: 'POST', body: JSON.stringify(data) }),
  updateAdmission: (id, data) => request(`/front-desk/admissions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdmission: (id) => request(`/front-desk/admissions/${id}`, { method: 'DELETE' }),
  convertToStudent: (id) => request(`/front-desk/admissions/${id}/convert-to-student`, { method: 'POST' }),
  getAdmissionTracker: (id) => request(`/front-desk/admissions/${id}/tracker`),

  // Gate Passes — delegates to dedicated /gate-passes routes (with Zod validation)
  getGatePassesToday: () => request('/gate-passes/today').then((r) => r.data || []),
  getGatePassesByDate: (date) => request(`/gate-passes?startDate=${date}&endDate=${date}`).then((r) => r.data || []),
  createGatePass: (data) => request('/gate-passes', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.data),
  updateGatePass: (id, data) => request(`/gate-passes/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.data),
  deleteGatePass: (id) => request(`/gate-passes/${id}`, { method: 'DELETE' }),

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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      signal: controller.signal,
    });
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
    logger.error('PIN code lookup failed:', error);
    return null;
  } finally {
    clearTimeout(timeoutId);
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

// Global Search API
export const searchApi = {
  search: (params, options = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/search${query ? `?${query}` : ''}`, options);
  },
};

// Parent Management API
