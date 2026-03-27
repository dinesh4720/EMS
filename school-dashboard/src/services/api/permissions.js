import { request } from './core.js';

export const permissionsApi = {
  // Custom Roles
  getCustomRoles: () => request('/permissions/custom-roles'),
  createCustomRole: (data) => request('/permissions/custom-roles', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomRole: (id, data) => request(`/permissions/custom-roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomRole: (id) => request(`/permissions/custom-roles/${id}`, { method: 'DELETE' }),

  // User Permissions
  getUserPermissions: (userId) => request(`/permissions/user/${userId}`),
  updateUserPermissions: (userId, data) => request(`/permissions/user/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Permission Requests
  createPermissionRequest: (data) => request('/permissions/request', { method: 'POST', body: JSON.stringify(data) }),
  getPermissionRequests: (params) => {
    const p = new URLSearchParams();
    if (params?.status) p.set('status', params.status);
    if (params?.userId) p.set('userId', params.userId);
    const qs = p.toString();
    return request(`/permissions/requests${qs ? `?${qs}` : ''}`);
  },
  getPendingRequestsCount: () => request('/permissions/requests/count/pending'),
  reviewPermissionRequest: (requestId, data) => request(`/permissions/requests/${requestId}`, { method: 'PUT', body: JSON.stringify(data) }),
  getUserPermissionRequests: (userId, status) => {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    const qs = p.toString();
    return request(`/permissions/user/${userId}/requests${qs ? `?${qs}` : ''}`);
  },
};
