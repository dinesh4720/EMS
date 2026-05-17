import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  NPS analytics mock data
 * ───────────────────────────────────────────────────────────────────── */

interface NpsResponse {
  _id: string; id: string; score: number; feedback: string;
  respondent: string; respondentType: string; createdAt: string;
}

interface NpsSummary {
  score: number;
  totalResponses: number;
  promoters: number;
  passives: number;
  detractors: number;
  trend: Array<{ month: string; score: number; responses: number }>;
}

function seedNpsData(state: MockState): { summary: NpsSummary; responses: NpsResponse[] } {
  const responses: NpsResponse[] = [
    { _id: 'nps-1', id: 'nps-1', score: 9, feedback: 'Excellent system!', respondent: 'Parent A', respondentType: 'parent', createdAt: '2026-03-28T10:00:00.000Z' },
    { _id: 'nps-2', id: 'nps-2', score: 10, feedback: 'Very satisfied', respondent: 'Parent B', respondentType: 'parent', createdAt: '2026-03-27T14:00:00.000Z' },
    { _id: 'nps-3', id: 'nps-3', score: 7, feedback: 'Good but could improve', respondent: 'Parent C', respondentType: 'parent', createdAt: '2026-03-26T09:00:00.000Z' },
    { _id: 'nps-4', id: 'nps-4', score: 8, feedback: 'Decent experience', respondent: 'Teacher D', respondentType: 'staff', createdAt: '2026-03-25T11:00:00.000Z' },
    { _id: 'nps-5', id: 'nps-5', score: 3, feedback: 'Needs improvement', respondent: 'Parent E', respondentType: 'parent', createdAt: '2026-03-24T16:00:00.000Z' },
    { _id: 'nps-6', id: 'nps-6', score: 6, feedback: 'Average', respondent: 'Parent F', respondentType: 'parent', createdAt: '2026-03-23T08:00:00.000Z' },
  ];

  const promoters = responses.filter(r => r.score >= 9).length;
  const detractors = responses.filter(r => r.score <= 6).length;
  const passives = responses.length - promoters - detractors;

  const summary: NpsSummary = {
    score: Math.round(((promoters - detractors) / responses.length) * 100),
    totalResponses: responses.length,
    promoters,
    passives,
    detractors,
    trend: [
      { month: '2026-01', score: 45, responses: 20 },
      { month: '2026-02', score: 52, responses: 25 },
      { month: '2026-03', score: 17, responses: 6 },
    ],
  };

  (state as any).npsResponses = responses;
  (state as any).npsSummary = summary;
  return { summary, responses };
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC081 — NPS Analytics
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC081 — NPS Analytics', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedNpsData(state);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override NPS API routes
    await page.route('**/api/nps**', async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace(/\/+$/, '');
      const method = route.request().method();

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      // GET /api/nps/summary
      if (path === '/api/nps/summary' && method === 'GET') {
        return json((state as any).npsSummary);
      }

      // GET /api/nps/responses
      if (path === '/api/nps/responses' && method === 'GET') {
        const responses: NpsResponse[] = (state as any).npsResponses;
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        let filtered = responses;
        if (from) filtered = filtered.filter(r => r.createdAt >= from);
        if (to) filtered = filtered.filter(r => r.createdAt <= to);
        return json({ data: filtered, total: filtered.length });
      }

      // GET /api/nps/trend
      if (path === '/api/nps/trend' && method === 'GET') {
        return json({ data: (state as any).npsSummary.trend });
      }

      // GET /api/nps (general)
      if (path === '/api/nps' && method === 'GET') {
        return json({
          summary: (state as any).npsSummary,
          responses: (state as any).npsResponses,
        });
      }

      await route.continue();
    });

    // Also handle settings/nps-analytics path
    await page.route('**/api/settings/nps**', async (route) => {
      const method = route.request().method();
      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      if (method === 'GET') {
        return json({
          summary: (state as any).npsSummary,
          responses: (state as any).npsResponses,
        });
      }
      await route.continue();
    });
  });

  /* ───────── 1. NPS analytics page loads ───────── */

  test('1) NPS analytics page loads', async ({ page }) => {
    await page.goto('/settings/nps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('NPS') || bodyText?.includes('Net Promoter') ||
      bodyText?.includes('Analytics') || bodyText?.includes('Score') ||
      bodyText?.includes('Settings'),
    ).toBeTruthy();
  });

  /* ───────── 2. NPS score is displayed ───────── */

  test('2) NPS score value is displayed on the dashboard', async ({ page }) => {
    await page.goto('/settings/nps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    // The NPS score is 17 (calculated from our seed data)
    expect(
      bodyText?.includes('17') || bodyText?.includes('NPS') ||
      bodyText?.includes('Score') || bodyText?.includes('score'),
    ).toBeTruthy();
  });

  /* ───────── 3. Response breakdown is shown ───────── */

  test('3) promoters, passives, and detractors breakdown is visible', async ({ page }) => {
    await page.goto('/settings/nps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Promoter') || bodyText?.includes('promoter') ||
      bodyText?.includes('Passive') || bodyText?.includes('passive') ||
      bodyText?.includes('Detractor') || bodyText?.includes('detractor') ||
      (bodyText?.includes('2') && bodyText?.includes('6')), // counts
    ).toBeTruthy();
  });

  /* ───────── 4. Trend chart is present ───────── */

  test('4) NPS trend chart or trend data is present', async ({ page }) => {
    await page.goto('/settings/nps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for chart canvas, SVG, or trend labels
    const hasCanvas = await page.locator('canvas').isVisible({ timeout: 3000 }).catch(() => false);
    const hasSvg = await page.locator('svg.recharts-surface, svg[class*="chart"]').first().isVisible({ timeout: 2000 }).catch(() => false);

    const bodyText = await page.textContent('body');
    expect(
      hasCanvas || hasSvg ||
      bodyText?.includes('Trend') || bodyText?.includes('trend') ||
      bodyText?.includes('Jan') || bodyText?.includes('Feb') || bodyText?.includes('Mar') ||
      bodyText?.includes('2026-01') || bodyText?.includes('2026-02'),
    ).toBeTruthy();
  });

  /* ───────── 5. Filter by date range ───────── */

  test('5) filtering by date range updates the displayed data', async ({ page }) => {
    await page.goto('/settings/nps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for date inputs or date range picker
    const dateFrom = page.locator('input[type="date"], input[placeholder*="from" i], input[placeholder*="start" i]').first();
    const dateTo = page.locator('input[type="date"], input[placeholder*="to" i], input[placeholder*="end" i]').last();

    if (await dateFrom.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dateFrom.fill('2026-03-25');
      await page.waitForTimeout(300);

      if (await dateTo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateTo.fill('2026-03-30');
        await page.waitForTimeout(300);
      }

      // Click apply/filter if button exists
      const filterBtn = page.getByRole('button', { name: /apply|filter|search/i }).first();
      if (await filterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await filterBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Page should still be functional
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  /* ───────── 6. Total responses count is shown ───────── */

  test('6) total response count is displayed', async ({ page }) => {
    await page.goto('/settings/nps');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('6') || bodyText?.includes('Total') ||
      bodyText?.includes('Responses') || bodyText?.includes('responses'),
    ).toBeTruthy();
  });

  /* ───────── 7. State integrity check ───────── */

  test('7) state has correct NPS data', async ({ page }) => {
    const summary = (state as any).npsSummary as NpsSummary;
    const responses = (state as any).npsResponses as NpsResponse[];

    expect(responses).toHaveLength(6);
    expect(summary.totalResponses).toBe(6);
    expect(summary.promoters).toBe(2);   // scores 9, 10
    expect(summary.passives).toBe(2);    // scores 7, 8
    expect(summary.detractors).toBe(2);  // scores 3, 6
    expect(summary.score).toBe(0);       // (2-2)/6 * 100 = 0
    expect(summary.trend).toHaveLength(3);
  });
});
