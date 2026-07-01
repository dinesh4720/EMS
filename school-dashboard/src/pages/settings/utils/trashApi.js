import { request } from "../../../services/api";

/**
 * Trash API — page-local client used by the Trash settings screen.
 *
 * NOTE (cleanup follow-up): a near-identical `trashApi` is also exported from
 * `services/api/staff.js` (the one the rest of the app imports). These two
 * should be consolidated into a single canonical module in a later pass; kept
 * separate here to preserve the Trash page's exact current behaviour.
 */
export const trashApi = {
  getAll: async (page = 1, limit = 50, options = {}) => {
    const response = await request(`/trash?page=${page}&limit=${limit}`, options);
    // Backend returns { success: true, data: trashItems, total, pagination }
    return {
      items: response.data || [],
      total: response.total || 0,
      pagination: response.pagination || { page, limit, totalPages: 1, hasMore: false }
    };
  },
  getStats: async (options = {}) => {
    const response = await request("/trash/stats", options);
    // Backend returns { success: true, byType, totalExpiring }
    return response.byType || response;
  },
  restore: (id) => request(`/trash/${id}/restore`, { method: "POST" }),
  restoreBulk: (ids) => request("/trash/bulk-restore", {
    method: "POST",
    body: JSON.stringify({ trashItemIds: ids })
  }),
  permanentDelete: (id) => request(`/trash/${id}`, { method: "DELETE" }),
  permanentDeleteBulk: (ids) => request("/trash/bulk-delete", {
    method: "DELETE",
    body: JSON.stringify({ trashItemIds: ids })
  }),
};
