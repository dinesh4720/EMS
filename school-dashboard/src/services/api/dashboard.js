import { request } from './core.js';

export const dashboardApi = {
  getFeed: () => request('/dashboard/feed'),
};

export default dashboardApi;
