import { request } from './core.js';

export const staffApi = {
  /**
   * Server-driven paginated list for the Staff dashboard (SCH-193 / PAG-28-FE).
   *
   * Mirrors `studentsApi.list` and returns the `{ data, pagination, facets }`
   * envelope from the paginated branch of `GET /staff` (added in EMS-backend
   * PR #131). The `facets` aggregate is computed server-side over
   * (schoolId + q + today) so the dashboard's filter pills can be driven
   * without scanning the full in-memory list.
   *
   * Params (`undefined`, `null`, `''` and `'all'` are stripped so the URL
   * stays clean — matches `studentsApi.list`):
   *   - page, limit                         — pagination
   *   - q                                   — server-side substring search
   *   - role, department, employmentType,
   *     gender, status                      — facet / status filters
   *   - today                               — 'true' restricts to staff with
   *                                          a present/absent/leave record
   *                                          for today (StaffAttendance join)
   *   - includeFacets                       — 'false' skips the 4 aggregation
   *                                          queries when only refreshing the
   *                                          page (e.g. paging within a fixed
   *                                          filter set)
   *
   * `opts.skipCache` is forwarded to `request`; `opts.signal` is passed through
   * so callers can abort in-flight requests on unmount or param change.
   *
   * NOTE: this is intentionally separate from `staffApi.getAll` (below) — the
   * AppContext bootstrap and ~40 consumers still use `getAll`, which returns
   * the full list and must not change shape.
   */
  list: async (params = {}, options = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all') {
        return;
      }
      // Arrays (e.g. role: ['Teacher', 'Admin']) become a single comma param,
      // matching the backend's parseCommaList semantics from PR #131.
      if (Array.isArray(value)) {
        if (value.length === 0) return;
        query.set(key, value.join(','));
        return;
      }
      query.set(key, value);
    });

    const queryString = query.toString();
    const { skipCache = false, ...restOpts } = options;
    const response = await request(`/staff${queryString ? `?${queryString}` : ''}`, {
      skipCache,
      ...restOpts,
    });

    return {
      data: response.data || [],
      pagination: response.pagination || {
        page: params.page || 1,
        limit: params.limit || 25,
        total: Array.isArray(response.data) ? response.data.length : 0,
        totalPages: 1,
      },
      facets: response.facets || {
        role: [],
        department: [],
        employmentType: [],
        gender: [],
      },
    };
  },
  getAll: (skipCache = false, opts) => request('/staff', { skipCache, ...opts }),
  getById: (id, opts) => request(`/staff/${id}`, opts),
  getClasses: (id, opts) => request(`/staff/${id}/classes`, opts),
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
    const { skipCache = false, ...restOpts } = options;
    const response = await request(`/students${queryString ? `?${queryString}` : ''}`, {
      skipCache,
      ...restOpts,
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
  /**
   * Bulk-fetch every student matching the given scope (all students when no
   * `classId` is provided; otherwise every student of one class). Internally
   * walks every page in a tight loop — at ~3k students with the default 100/page
   * cap this is ~30 sequential round-trips, and the app-context used to re-run
   * the loop after every student create/update/delete.
   *
   * [PAG-05] Do NOT call this from app-shell hydration. Per-screen pages must
   * fetch their own page via `studentsApi.list` + `usePaginatedQuery`. Reserve
   * `getAll` for narrow scopes where the full result set is small and bounded
   * (e.g. one classId, or a CSV duplicate check on import).
   */
  getAll: async (classIdOrOptions, { signal } = {}) => {
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
    const firstPage = await studentsApi.list({ ...params, page: 1, limit }, { skipCache, signal });
    const allStudents = [...firstPage.data];
    const totalPages = firstPage.pagination?.totalPages || 1;

    for (let page = 2; page <= totalPages; page += 1) {
      if (signal?.aborted) {
        const err = new Error('Aborted');
        err.name = 'AbortError';
        throw err;
      }
      const nextPage = await studentsApi.list({ ...params, page, limit }, { skipCache, signal });
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
  deleteDocument: (id, docId) => request(`/students/${id}/documents/${docId}`, { method: 'DELETE' }),
  fixDocuments: (id) => request(`/students/${id}/fix-documents`, { method: 'POST' }),
  sendReminder: (id, data) => request(`/students/${id}/send-reminder`, { method: 'POST', body: JSON.stringify(data) }),
  sendRemindersBulk: (data) => request('/students/send-reminders-bulk', { method: 'POST', body: JSON.stringify(data) }),
  promote: (id, data) => request(`/students/${id}/promote`, { method: 'POST', body: JSON.stringify(data) }),
  bulkPromote: (data) => request('/students/bulk-promote', { method: 'POST', body: JSON.stringify(data) }),
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
    method: 'POST',
    body: JSON.stringify({ trashItemIds })
  }),
};

// Exams API
