import { request } from './core.js';

// [SCH-204] Server-computed student KPIs for the Analytics + Dashboard screens.
// PAG-05 removed global student hydration from AppContext, so these pages can no
// longer count students client-side. They read aggregated totals from here
// (status/fee breakdowns + per-class distribution) instead of the empty roster.
export const dashboardApi = {
  getAnalyticsSummary: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, v);
    });
    const qs = q.toString();
    return request(`/dashboard/analytics-summary${qs ? `?${qs}` : ''}`);
  },
};
