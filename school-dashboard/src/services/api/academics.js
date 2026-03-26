import { request } from './core.js';

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
  publishResults: (id) => request(`/exams/${id}/publish`, { method: 'POST' }),
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
  bulkCreate: (results, examId, classId, loadedAt) => request('/results/bulk', { method: 'POST', body: JSON.stringify({ results, examId, classId, ...(loadedAt ? { loadedAt } : {}) }) }),
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
