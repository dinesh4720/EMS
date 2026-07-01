import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./core.js', () => ({ request: vi.fn() }));

import { request } from './core.js';
import { dashboardApi } from './dashboard.js';

beforeEach(() => {
  vi.clearAllMocks();
  request.mockResolvedValue({ students: {}, fees: {}, classDistribution: [] });
});

describe('dashboardApi', () => {
  it('getAnalyticsSummary without params calls the base URL', () => {
    dashboardApi.getAnalyticsSummary();
    expect(request).toHaveBeenCalledWith('/dashboard/analytics-summary');
  });

  it('getAnalyticsSummary appends provided query params', () => {
    dashboardApi.getAnalyticsSummary({ academicYear: '2025-26' });
    const url = request.mock.calls[0][0];
    expect(url).toContain('/dashboard/analytics-summary?');
    expect(url).toContain('academicYear=2025-26');
  });

  it('getAnalyticsSummary filters out empty and nullish values', () => {
    dashboardApi.getAnalyticsSummary({ academicYear: '', foo: null, bar: undefined });
    expect(request).toHaveBeenCalledWith('/dashboard/analytics-summary');
  });
});
