import { request } from './core.js';

export const examsApi = {
  getAll: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return request(`/exams${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id, options) => request(`/exams/${id}`, options),
  create: (data) => request('/exams', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/exams/${id}`, { method: 'DELETE' }),
  getByClass: (classId) => request(`/exams/class/${classId}`),
  getByStaff: (staffId) => request(`/exams/staff/${staffId}`),
  publish: (id) => request(`/exams/${id}/publish`, { method: 'POST' }),
  getResults: (id) => request(`/exams/${id}/results`),
};

// Homework API
export const homeworkApi = {
  getAll: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return request(`/homework${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => request(`/homework/${id}`),
  create: (data) => request('/homework', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/homework/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/homework/${id}`, { method: 'DELETE' }),
};

// Results API
export const resultsApi = {
  create: (data) => request('/results', { method: 'POST', body: JSON.stringify(data) }),
  bulkCreate: (results, examId, classId, loadedAt, { forceOverwrite } = {}) => request('/results/bulk', { method: 'POST', body: JSON.stringify({ results, examId, classId, ...(loadedAt ? { loadedAt } : {}), ...(forceOverwrite ? { forceOverwrite: true } : {}) }) }),
  update: (id, data) => request(`/results/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getByStudent: (studentId) => request(`/students/${studentId}/results`),
  getByClassExam: (classId, examId, options) => request(`/results/class/${classId}/exam/${examId}`, options),
};

// Academic Performance API
export const academicPerformanceApi = {
  getDashboard: (params) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request(`/academic-performance/dashboard${query}`);
  },
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

// Subjects API — uses /settings/subjects (backend settings route)
export const subjectsApi = {
  getAll: () => request('/settings/subjects'),
  create: (data) => request('/settings/subjects', { method: 'POST', body: JSON.stringify(data) }),
};

// Classes API
