import { expect, test } from '@playwright/test';
import { createMockState, installMockApi } from './test-utils';

const IMPORT_JOBS = [
  { _id: 'ij-1', type: 'students', fileName: 'students_2026.csv', status: 'completed', totalRows: 120, processedRows: 120, importedCount: 115, skippedCount: 3, failedCount: 2, createdAt: '2026-03-18T08:00:00Z', completedAt: '2026-03-18T08:02:30Z', initiatedBy: { name: 'Dinesh Admin' }, dryRun: false, errorMessage: null, rows: [] },
  { _id: 'ij-2', type: 'fees', fileName: 'fees_march.xlsx', status: 'running', totalRows: 200, processedRows: 80, importedCount: 78, skippedCount: 2, failedCount: 0, createdAt: '2026-03-20T09:00:00Z', completedAt: null, initiatedBy: { name: 'Dinesh Admin' }, dryRun: false, errorMessage: null, rows: [] },
];

const SYSTEM_JOBS = [
  { _id: 'sj-1', name: 'Daily Attendance Summary', status: 'scheduled', nextRunAt: '2026-03-21T00:00:00Z', lastRunAt: '2026-03-20T00:00:00Z', repeatInterval: 'every 24 hours' },
];

const BULK_HISTORY = [
  { _id: 'bij-1', type: 'students', status: 'completed', fileName: 'students_batch1.csv', importedCount: 45, skippedCount: 3, failedCount: 2, dryRun: false, createdAt: '2026-03-18T10:00:00Z', rows: [] },
];

async function injectAxe(page: any) {
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js',
  });
}

async function runAxe(page: any, context?: string) {
  // @ts-ignore
  return await page.evaluate((ctx: any) => {
    // @ts-ignore
    return window.axe.run(ctx || document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
      },
      resultTypes: ['violations'],
    });
  }, context);
}

test.describe('a11y — Data Tools module', () => {
  test.beforeEach(async ({ page }) => {
    const state = createMockState();
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);

    await page.route((url) => url.pathname === '/api/jobs/stats', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ importJobs: { total: 2, running: 1, completed: 1 }, systemJobs: { total: 1, scheduled: 1 } }) });
    });
    await page.route((url) => url.pathname === '/api/jobs', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ importJobs: IMPORT_JOBS, systemJobs: SYSTEM_JOBS, total: IMPORT_JOBS.length }) });
      } else route.fallback();
    });
    await page.route(/\/api\/bulk-import\/history(\?.*)?$/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jobs: BULK_HISTORY }) });
      } else route.fallback();
    });
    await page.route('**/api/bulk-import/template/*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/csv', body: 'name,email,phone\n', headers: { 'Content-Disposition': 'attachment; filename=template.csv' } });
    });
  });

  test('Background Jobs has no a11y violations', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForSelector('table[aria-label="Import jobs"]', { timeout: 15000 });
    await injectAxe(page);
    const results = await runAxe(page, 'main');
    expect(results.violations).toEqual([]);
  });

  test('Bulk Import has no a11y violations', async ({ page }) => {
    await page.goto('/data-tools/bulk-import');
    await page.waitForSelector('text=Bulk Import', { timeout: 15000 });
    await injectAxe(page);
    const results = await runAxe(page, 'main');
    expect(results.violations).toEqual([]);
  });

  test('Govt Export has no a11y violations', async ({ page }) => {
    await page.goto('/data-tools/govt-export');
    await page.waitForSelector('text=Government Portal Exports', { timeout: 15000 });
    await injectAxe(page);
    const results = await runAxe(page, 'main');
    expect(results.violations).toEqual([]);
  });
});
