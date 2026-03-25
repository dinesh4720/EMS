import { request } from './core.js';

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
  getRemarks: (id, category) => request(`/students/${id}/remarks${category && category !== 'all' ? `?category=${category}` : ''}`),
  addDocument: (id, data) => request(`/students/${id}/documents`, { method: 'POST', body: JSON.stringify(data) }),
  deleteDocument: (id, documentIndex) => request(`/students/${id}/documents/${documentIndex}`, { method: 'DELETE' }),
  fixDocuments: (id) => request(`/students/${id}/fix-documents`, { method: 'POST' }),
  sendReminder: (id, data) => request(`/students/${id}/send-reminder`, { method: 'POST', body: JSON.stringify(data) }),
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
