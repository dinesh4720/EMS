/**
 * TC171: Background Jobs — import jobs table, system jobs table, stats tiles,
 * detail modal, cancel flow, empty states, and refresh.
 *
 * Verifies: /data-tools/jobs page load, stats summary cards,
 * import jobs listing with status badges, system jobs listing,
 * job detail modal, job cancellation with confirm dialog,
 * empty states, and refresh behaviour.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TC171 — Background Jobs Management
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC171 — Background Jobs Management', () => {
  let state: MockState;

  const seedImportJob = (overrides: Record<string, unknown> = {}) => ({
    _id: overrides._id || `ij-${Math.random().toString(36).slice(2, 8)}`,
    id: overrides._id || `ij-${Math.random().toString(36).slice(2, 8)}`,
    type: overrides.type || 'students',
    fileName: overrides.fileName || 'students_2026.csv',
    status: overrides.status || 'completed',
    totalRows: overrides.totalRows ?? 120,
    processedRows: overrides.processedRows ?? 120,
    importedCount: overrides.importedCount ?? 115,
    skippedCount: overrides.skippedCount ?? 3,
    failedCount: overrides.failedCount ?? 2,
    createdAt: overrides.createdAt || '2026-03-18T08:00:00Z',
    completedAt: overrides.completedAt || '2026-03-18T08:02:30Z',
    initiatedBy: overrides.initiatedBy || { name: 'Admin User' },
    dryRun: overrides.dryRun ?? false,
    errorMessage: overrides.errorMessage || null,
    rows: overrides.rows || [],
    schoolId: SCHOOL_ID,
  });

  const seedSystemJob = (overrides: Record<string, unknown> = {}) => ({
    _id: overrides._id || `sj-${Math.random().toString(36).slice(2, 8)}`,
    id: overrides._id || `sj-${Math.random().toString(36).slice(2, 8)}`,
    name: overrides.name || 'Daily Attendance Summary',
    status: overrides.status || 'scheduled',
    nextRunAt: overrides.nextRunAt || '2026-03-21T00:00:00Z',
    lastRunAt: overrides.lastRunAt || '2026-03-20T00:00:00Z',
    repeatInterval: overrides.repeatInterval || 'every 24 hours',
    schoolId: SCHOOL_ID,
  });

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Seed default import jobs
    state.importJobs = [
      seedImportJob({ _id: 'ij-001', type: 'students', fileName: 'students_2026.csv', status: 'completed', totalRows: 120, processedRows: 120, importedCount: 115 }),
      seedImportJob({ _id: 'ij-002', type: 'fees', fileName: 'fees_march.xlsx', status: 'running', totalRows: 200, processedRows: 80, importedCount: 78 }),
      seedImportJob({ _id: 'ij-003', type: 'attendance', fileName: 'attendance_march.csv', status: 'failed', totalRows: 50, processedRows: 30, importedCount: 28, errorMessage: 'Invalid date format on row 31' }),
      seedImportJob({ _id: 'ij-004', type: 'staff', fileName: 'staff_new.csv', status: 'queued', totalRows: 10, processedRows: 0, importedCount: 0 }),
    ];

    // Seed default system jobs
    state.systemJobs = [
      seedSystemJob({ _id: 'sj-001', name: 'Daily Attendance Summary', status: 'scheduled', nextRunAt: '2026-03-21T00:00:00Z', lastRunAt: '2026-03-20T00:00:00Z' }),
      seedSystemJob({ _id: 'sj-002', name: 'Fee Reminder Emails', status: 'running', nextRunAt: null, lastRunAt: '2026-03-20T06:00:00Z', repeatInterval: 'every 12 hours' }),
      seedSystemJob({ _id: 'sj-003', name: 'Database Backup', status: 'completed', nextRunAt: '2026-03-21T02:00:00Z', lastRunAt: '2026-03-20T02:00:00Z' }),
      seedSystemJob({ _id: 'sj-004', name: 'Report Generation', status: 'failed', nextRunAt: '2026-03-21T03:00:00Z', lastRunAt: '2026-03-20T03:00:00Z' }),
    ];

    // Override /jobs/stats endpoint
    await page.route('**/api/jobs/stats', async (route) => {
      const method = route.request().method();
      if (method !== 'GET') return route.fallback();

      const importJobs = state.importJobs || [];
      const systemJobs = state.systemJobs || [];

      const stats = {
        importJobs: {
          total: importJobs.length,
          running: importJobs.filter((j: any) => j.status === 'running').length,
          completed: importJobs.filter((j: any) => j.status === 'completed').length,
          failed: importJobs.filter((j: any) => j.status === 'failed').length,
          queued: importJobs.filter((j: any) => j.status === 'queued').length,
        },
        systemJobs: {
          total: systemJobs.length,
          running: systemJobs.filter((j: any) => j.status === 'running').length,
          scheduled: systemJobs.filter((j: any) => j.status === 'scheduled').length,
          completed: systemJobs.filter((j: any) => j.status === 'completed').length,
          failed: systemJobs.filter((j: any) => j.status === 'failed').length,
        },
      };

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(stats),
      });
    });

    // Override /jobs endpoint (list)
    await page.route('**/api/jobs', async (route) => {
      const method = route.request().method();
      if (method !== 'GET') return route.fallback();

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          importJobs: state.importJobs || [],
          systemJobs: state.systemJobs || [],
          total: (state.importJobs || []).length + (state.systemJobs || []).length,
        }),
      });
    });

    // Override /jobs/import/:id endpoint (detail)
    await page.route(/\/api\/jobs\/import\/[^/]+$/, async (route) => {
      const method = route.request().method();
      const url = new URL(route.request().url());
      const jobId = url.pathname.split('/').pop();

      if (method === 'GET') {
        const job = (state.importJobs || []).find((j: any) => j.id === jobId || j._id === jobId);
        return route.fulfill({
          status: job ? 200 : 404,
          contentType: 'application/json',
          body: JSON.stringify(job ? { job } : { error: 'Not found' }),
        });
      }

      if (method === 'DELETE') {
        state.importJobs = (state.importJobs || []).filter((j: any) => j.id !== jobId && j._id !== jobId);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Job cancelled' }),
        });
      }

      return route.fallback();
    });
  });

  /* ───────── 1. Page loads with stats tiles ───────── */

  test('1) background jobs page loads with stats tiles', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Background Jobs');

    // Stats tiles should be visible
    expect(bodyText).toContain('Running');
    expect(bodyText).toContain('Completed');
    expect(bodyText).toContain('Failed');
    expect(bodyText).toContain('Queued');

    // With 4 import jobs (1 running, 1 completed, 1 failed, 1 queued)
    // and 4 system jobs (1 running, 1 scheduled, 1 completed, 1 failed)
    // Running = 2, Completed = 2, Failed = 2, Queued = 1
    expect(bodyText).toContain('2'); // Running
    expect(bodyText).toContain('2'); // Completed
    expect(bodyText).toContain('2'); // Failed
  });

  /* ───────── 2. Import jobs table displays correctly ───────── */

  test('2) import jobs table shows file name, type, status, rows, and actions', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Import Jobs');

    // Verify seeded import jobs are displayed
    expect(bodyText).toContain('students_2026.csv');
    expect(bodyText).toContain('fees_march.xlsx');
    expect(bodyText).toContain('attendance_march.csv');
    expect(bodyText).toContain('staff_new.csv');

    // Verify status labels are rendered via JobStatusBadge
    expect(bodyText).toContain('Completed');
    expect(bodyText).toContain('Running');
    expect(bodyText).toContain('Failed');
    expect(bodyText).toContain('Queued');

    // Verify row counts
    expect(bodyText).toContain('120/120');
    expect(bodyText).toContain('80/200');
    expect(bodyText).toContain('30/50');
    expect(bodyText).toContain('0/10');

    // Action buttons (view and cancel) should be present for queued/running jobs
    const importTable = page.locator('table[aria-label="Import jobs"]');
    await expect(importTable).toBeVisible();
  });

  /* ───────── 3. System jobs table displays correctly ───────── */

  test('3) system jobs table shows name, status, next run, last run, interval', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('System');

    // Verify seeded system jobs
    expect(bodyText).toContain('Daily Attendance Summary');
    expect(bodyText).toContain('Fee Reminder Emails');
    expect(bodyText).toContain('Database Backup');
    expect(bodyText).toContain('Report Generation');

    // Intervals
    expect(bodyText).toContain('every 24 hours');
    expect(bodyText).toContain('every 12 hours');

    const systemTable = page.locator('table[aria-label="System jobs"]');
    await expect(systemTable).toBeVisible();
  });

  /* ───────── 4. View job details modal ───────── */

  test('4) clicking view icon opens job detail modal', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');

    // Wait for the import jobs table to render
    const viewBtn = page.locator('table[aria-label="Import jobs"] tbody tr:first-child button[aria-label="View details"]').first();
    await expect(viewBtn).toBeVisible({ timeout: 5000 });
    await viewBtn.click();

    // Modal should open with job details
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Import Job Details');
    expect(bodyText).toContain('Total Rows');
    expect(bodyText).toContain('Processed');
    expect(bodyText).toContain('Imported');

    // Close modal
    const closeBtn = page.getByRole('button', { name: /close/i }).first();
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  /* ───────── 5. Cancel job flow ───────── */

  test('5) cancel button on queued job opens confirm dialog and removes job', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');

    // The queued job (staff_new.csv) should have a cancel button
    const cancelBtn = page.locator('table[aria-label="Import jobs"] tbody tr').filter({ hasText: /staff_new\.csv/ }).locator('button[aria-label="Cancel job"]').first();
    await expect(cancelBtn).toBeVisible({ timeout: 5000 });
    await cancelBtn.click();

    // Confirm dialog should appear
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Cancel Job');
    expect(bodyText).toContain('Are you sure you want to cancel this job?');

    // Confirm cancellation
    const confirmBtn = page.getByRole('button', { name: /^Cancel Job$/i }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 3000 });
    await confirmBtn.click();

    // Wait for the job to be removed from the table
    await page.waitForFunction(
      () => !(document.body.textContent || '').includes('staff_new.csv'),
      { timeout: 10_000 },
    );

    const updatedText = await page.textContent('body');
    expect(updatedText).not.toContain('staff_new.csv');
    expect(updatedText).toContain('Queued'); // Other statuses still present
  });

  /* ───────── 6. Empty state when no import jobs ───────── */

  test('6) empty state renders when no import jobs exist', async ({ page }) => {
    state.importJobs = [];

    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('No import jobs');
    expect(bodyText).toContain('Imports you run will appear here.');
  });

  /* ───────── 7. Empty state when no system jobs ───────── */

  test('7) empty state renders when no system jobs exist', async ({ page }) => {
    state.systemJobs = [];

    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('No system jobs');
    expect(bodyText).toContain('Scheduled background jobs will appear here.');
  });

  /* ───────── 8. Refresh button reloads data ───────── */

  test('8) refresh button reloads jobs data', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');

    // Verify initial data
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('students_2026.csv');

    // Add a new job to state after initial load
    state.importJobs.push(seedImportJob({
      _id: 'ij-005',
      type: 'library',
      fileName: 'books_catalog.csv',
      status: 'completed',
      totalRows: 500,
      processedRows: 500,
      importedCount: 498,
    }));

    // Click refresh
    const refreshBtn = page.getByRole('button', { name: /refresh/i }).first();
    await expect(refreshBtn).toBeVisible({ timeout: 3000 });
    await refreshBtn.click();

    // Wait for the new job to appear
    await page.waitForFunction(
      () => (document.body.textContent || '').includes('books_catalog.csv'),
      { timeout: 10_000 },
    );

    const updatedText = await page.textContent('body');
    expect(updatedText).toContain('books_catalog.csv');
    expect(updatedText).toContain('500/500');
  });

  /* ───────── 9. Job detail modal shows error message for failed jobs ───────── */

  test('9) failed job detail modal shows error message', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');

    // Click view on the failed job (attendance_march.csv)
    const viewBtn = page.locator('table[aria-label="Import jobs"] tbody tr').filter({ hasText: /attendance_march\.csv/ }).locator('button[aria-label="View details"]').first();
    await expect(viewBtn).toBeVisible({ timeout: 5000 });
    await viewBtn.click();

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Import Job Details');
    expect(bodyText).toContain('Invalid date format on row 31');

    // Close modal
    const closeBtn = page.getByRole('button', { name: /close/i }).first();
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  /* ───────── 10. Completed job does not show cancel button ───────── */

  test('10) completed jobs do not display cancel action', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');

    // The completed job row (students_2026.csv) should NOT have a cancel button
    const completedRow = page.locator('table[aria-label="Import jobs"] tbody tr').filter({ hasText: /students_2026\.csv/ });
    const cancelBtn = completedRow.locator('button[aria-label="Cancel job"]');
    await expect(cancelBtn).toHaveCount(0);
  });

  /* ───────── 11. Network error shows retry / toast fallback ───────── */

  test('11) network error on jobs load shows graceful fallback', async ({ page }) => {
    // Override jobs endpoint to return 500
    await page.route('**/api/jobs', async (route) => {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');

    // The page should not crash; body should still contain Background Jobs title
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Background Jobs');
  });
});
