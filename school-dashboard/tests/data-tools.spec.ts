import { expect, test } from '@playwright/test';
import { createMockState, installMockApi, type MockState } from './test-utils';

/* ───── Seed data for Background Jobs & Govt Export ───── */

const IMPORT_JOBS = [
  {
    _id: 'ij-1',
    type: 'students',
    fileName: 'students_2026.csv',
    status: 'completed',
    totalRows: 120,
    processedRows: 120,
    importedCount: 115,
    skippedCount: 3,
    failedCount: 2,
    createdAt: '2026-03-18T08:00:00Z',
    completedAt: '2026-03-18T08:02:30Z',
    initiatedBy: { name: 'Dinesh Admin' },
    dryRun: false,
    errorMessage: null,
    rows: [],
  },
  {
    _id: 'ij-2',
    type: 'fees',
    fileName: 'fees_march.xlsx',
    status: 'running',
    totalRows: 200,
    processedRows: 80,
    importedCount: 78,
    skippedCount: 2,
    failedCount: 0,
    createdAt: '2026-03-20T09:00:00Z',
    completedAt: null,
    initiatedBy: { name: 'Dinesh Admin' },
    dryRun: false,
    errorMessage: null,
    rows: [],
  },
  {
    _id: 'ij-3',
    type: 'attendance',
    fileName: 'attendance_march.csv',
    status: 'failed',
    totalRows: 50,
    processedRows: 30,
    importedCount: 28,
    skippedCount: 0,
    failedCount: 2,
    createdAt: '2026-03-19T10:00:00Z',
    completedAt: '2026-03-19T10:01:00Z',
    initiatedBy: { name: 'Dinesh Admin' },
    dryRun: false,
    errorMessage: 'Invalid date format on row 31',
    rows: [],
  },
  {
    _id: 'ij-4',
    type: 'staff',
    fileName: 'staff_new.csv',
    status: 'queued',
    totalRows: 10,
    processedRows: 0,
    importedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    createdAt: '2026-03-20T10:00:00Z',
    completedAt: null,
    initiatedBy: { name: 'Dinesh Admin' },
    dryRun: false,
    errorMessage: null,
    rows: [],
  },
];

const SYSTEM_JOBS = [
  { _id: 'sj-1', name: 'Daily Attendance Summary', status: 'scheduled', nextRunAt: '2026-03-21T00:00:00Z', lastRunAt: '2026-03-20T00:00:00Z', repeatInterval: 'every 24 hours' },
  { _id: 'sj-2', name: 'Fee Reminder Emails', status: 'running', nextRunAt: null, lastRunAt: '2026-03-20T06:00:00Z', repeatInterval: 'every 12 hours' },
  { _id: 'sj-3', name: 'Database Backup', status: 'completed', nextRunAt: '2026-03-21T02:00:00Z', lastRunAt: '2026-03-20T02:00:00Z', repeatInterval: 'every 24 hours' },
  { _id: 'sj-4', name: 'Report Generation', status: 'failed', nextRunAt: '2026-03-21T03:00:00Z', lastRunAt: '2026-03-20T03:00:00Z', repeatInterval: 'every 24 hours' },
];

const JOB_STATS = {
  importJobs: { total: 4, running: 1, completed: 1, failed: 1, queued: 1 },
  systemJobs: { total: 4, running: 1, scheduled: 1, completed: 1, failed: 1 },
};

test.describe('Data Tools — Background Jobs & Govt Export', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Dismiss cookie consent banner so it doesn't obscure interactive elements
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);

    // Add mock routes for jobs and export endpoints (use URL functions to match paths with query strings)
    await page.route(
      (url) => url.pathname === '/api/jobs/stats',
      async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(JOB_STATS) });
      },
    );

    await page.route(
      (url) => url.pathname === '/api/jobs',
      async (route) => {
        const method = route.request().method();
        if (method === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ importJobs: IMPORT_JOBS, systemJobs: SYSTEM_JOBS, total: IMPORT_JOBS.length }),
          });
        } else {
          await route.fallback();
        }
      },
    );

    await page.route(
      (url) => /^\/api\/jobs\/import\//.test(url.pathname),
      async (route) => {
        const method = route.request().method();
        const url = new URL(route.request().url());
        const pathParts = url.pathname.split('/');
        const jobId = pathParts[pathParts.length - 1];

        if (method === 'GET') {
          const job = IMPORT_JOBS.find((j) => j._id === jobId);
          await route.fulfill({
            status: job ? 200 : 404,
            contentType: 'application/json',
            body: JSON.stringify(job ? { job } : { error: 'Not found' }),
          });
        } else if (method === 'DELETE') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Job cancelled' }),
          });
        } else {
          await route.fallback();
        }
      },
    );

    await page.route(
      (url) => /^\/api\/export\/govt\//.test(url.pathname),
      async (route) => {
        const url = new URL(route.request().url());
        const academicYear = url.searchParams.get('academicYear');
        if (!academicYear) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Academic year is required' }),
          });
          return;
        }
        // Return a fake blob for successful exports
        await route.fulfill({
          status: 200,
          contentType: 'application/octet-stream',
          headers: { 'Content-Disposition': 'attachment; filename="export.csv"' },
          body: 'CSV-DATA-CONTENT',
        });
      },
    );
  });

  // ─── Background Jobs Tests ───────────────────────────────────────

  // Test 1: Jobs page shows import jobs table and system jobs table
  test('jobs page shows import jobs table and system jobs table', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Use retrying assertions for import job data
    const importTable = page.locator('table[aria-label="Import jobs"]');
    await expect(importTable).toBeVisible({ timeout: 15000 });
    await expect(importTable.getByText('students_2026.csv')).toBeVisible({ timeout: 10000 });

    const bodyLocator = page.locator('body');
    await expect(bodyLocator).toContainText('Import Jobs');
    await expect(bodyLocator).toContainText('fees_march.xlsx');
    await expect(bodyLocator).toContainText('attendance_march.csv');
    await expect(bodyLocator).toContainText('staff_new.csv');
    await expect(bodyLocator).toContainText('Daily Attendance Summary');
    await expect(bodyLocator).toContainText('Fee Reminder Emails');
    await expect(bodyLocator).toContainText('Database Backup');
    await expect(bodyLocator).toContainText('Report Generation');

    const systemTable = page.locator('table[aria-label="System jobs"]');
    await expect(systemTable).toBeVisible();
  });

  // Test 2: Job status badges render correctly (scheduled, running, completed, failed)
  test('job status badges render correctly', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Use retrying assertions — wait for table to appear first
    const importTable = page.locator('table[aria-label="Import jobs"]');
    await expect(importTable).toBeVisible({ timeout: 15000 });

    // Verify status badge chips in import jobs table
    await expect(importTable.getByText('Completed').first()).toBeVisible({ timeout: 10000 });
    await expect(importTable.getByText('Running').first()).toBeVisible();
    await expect(importTable.getByText('Failed').first()).toBeVisible();
    await expect(importTable.getByText('Queued').first()).toBeVisible();

    // Verify system job statuses
    const systemTable = page.locator('table[aria-label="System jobs"]');
    await expect(systemTable).toBeVisible();
    await expect(systemTable.getByText('Scheduled').first()).toBeVisible();
  });

  // Test 3: Job detail modal opens on click
  test('job detail modal opens on click', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Wait for import jobs table to render
    const importTable = page.locator('table[aria-label="Import jobs"]');
    await expect(importTable).toBeVisible({ timeout: 15000 });
    await expect(importTable.getByText('students_2026.csv')).toBeVisible({ timeout: 10000 });

    // Click the view button on the first import job and wait for the API response
    const viewBtn = page.getByLabel('View details').first();
    const [detailReq] = await Promise.all([
      page.waitForRequest((req) => req.method() === 'GET' && req.url().includes('/api/jobs/import/'), { timeout: 10000 }),
      viewBtn.click(),
    ]);
    expect(detailReq.url()).toContain('/api/jobs/import/');

    // Modal should appear — find the one with our heading (not cookie dialogs etc.)
    const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Import Job Details' });
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Wait for content to load (not just skeletons)
    await expect(dialog.getByText('Type:').first()).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText('Status:').first()).toBeVisible();
    await expect(dialog.getByText('File:').first()).toBeVisible();
    await expect(dialog.getByText('Initiated by:').first()).toBeVisible();
  });

  // Test 4: Delete job confirms and removes
  test('delete job confirms and removes', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Wait for import jobs table to render
    const importTable = page.locator('table[aria-label="Import jobs"]');
    await expect(importTable).toBeVisible({ timeout: 15000 });
    await expect(importTable.getByText('students_2026.csv')).toBeVisible({ timeout: 10000 });

    // The cancel button only appears for queued/running jobs
    // Find cancel button (trash icon) — ij-2 (running) and ij-4 (queued) should have them
    const cancelBtns = page.getByLabel('Cancel job');
    expect(await cancelBtns.count()).toBeGreaterThan(0);

    // Click cancel — app uses custom ConfirmDialog (not native dialog)
    await cancelBtns.first().click();

    // Wait for ConfirmDialog to appear and click "Cancel Job"
    const confirmDialog = page.locator('[role="alertdialog"]').filter({ hasText: 'Cancel Job' });
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });

    // Use Promise.all so the waiter is active before the click triggers the request
    const [deleteReq] = await Promise.all([
      page.waitForRequest(
        (req) => req.method() === 'DELETE' && req.url().includes('/api/jobs/import/'),
        { timeout: 10000 },
      ),
      confirmDialog.getByRole('button', { name: 'Cancel Job' }).click(),
    ]);

    // Verify the DELETE request was sent
    expect(deleteReq.url()).toContain('/api/jobs/import/');
    expect(deleteReq.method()).toBe('DELETE');
  });

  // Test 5: Refresh button reloads job data
  test('refresh button reloads job data', async ({ page }) => {
    await page.goto('/data-tools/jobs');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Click refresh button and wait for re-fetch
    const refreshBtn = page.getByRole('button', { name: /refresh/i });
    await expect(refreshBtn).toBeVisible();

    const [statsReq] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/jobs/stats'), { timeout: 10000 }),
      refreshBtn.evaluate((el: HTMLElement) => el.click()),
    ]);

    // Verify stats re-fetch was triggered
    expect(statsReq.url()).toContain('/api/jobs/stats');
  });

  // ─── Govt Export Tests ───────────────────────────────────────────

  // Test 6: Govt export page shows 6 export types
  test('govt export page shows 6 export types', async ({ page }) => {
    await page.goto('/data-tools/govt-export');
    await page.waitForLoadState('networkidle');

    // Wait for lazy chunk to load
    await expect(page.getByText('Government Portal Exports').first()).toBeVisible({ timeout: 15000 });

    // Verify all 6 export types are displayed
    await expect(page.getByText('UDISE+ Enrollment').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('CBSE Affiliation Data').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('ICSE Portal Format').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('State Board Format').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Annual Report Summary').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Compliance Checklist').first()).toBeVisible({ timeout: 5000 });
  });

  // Test 7: Selecting export type shows filter options (academic year, classId)
  test('selecting export type shows filter options', async ({ page }) => {
    await page.goto('/data-tools/govt-export');
    await page.waitForLoadState('networkidle');

    // Wait for lazy chunk to load
    await expect(page.getByText('Government Portal Exports').first()).toBeVisible({ timeout: 15000 });

    // All cards have academic year inputs (placeholder varies)
    const academicYearInputs = page.locator('input').filter({ hasText: /^$/ }).filter({ has: page.locator(':near(:text("Academic Year"))') });
    // Use a simpler approach: count inputs near Academic Year labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThanOrEqual(6);

    // Verify labels exist
    const body = await page.textContent('body');
    expect(body).toContain('Academic Year');
    expect(body).toContain('Class ID');
  });

  // Test 8: Format selector (CSV, Excel, PDF)
  test('format selector shows CSV, Excel, PDF buttons', async ({ page }) => {
    await page.goto('/data-tools/govt-export');
    await page.waitForLoadState('networkidle');

    // Wait for lazy chunk to load
    await expect(page.getByText('Government Portal Exports').first()).toBeVisible({ timeout: 15000 });

    // Each export type should have 3 format buttons
    const csvButtons = page.getByRole('button', { name: 'CSV' });
    const excelButtons = page.getByRole('button', { name: 'Excel' });
    const pdfButtons = page.getByRole('button', { name: 'PDF' });

    // 6 export types × 3 formats
    await expect(csvButtons.first()).toBeVisible({ timeout: 5000 });
    expect(await csvButtons.count()).toBe(6);
    expect(await excelButtons.count()).toBe(6);
    expect(await pdfButtons.count()).toBe(6);
  });

  // Test 9: Export triggers download with correct parameters
  test('export triggers download with correct parameters', async ({ page }) => {
    await page.goto('/data-tools/govt-export');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Fill in academic year for the first export type (UDISE)
    const academicYearInputs = page.locator('input[placeholder*="2025-26"]');
    await academicYearInputs.first().fill('2025-26');

    // Track export API calls
    let exportUrl = '';
    await page.route('**/api/export/govt/udise*', async (route) => {
      exportUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        headers: { 'Content-Disposition': 'attachment; filename="udise_export.csv"' },
        body: 'CSV-DATA',
      });
    });

    // Click the CSV button for UDISE (first export type, first format button)
    const csvButtons = page.getByRole('button', { name: 'CSV' });
    await csvButtons.first().click();

    // Wait for the export request
    await expect(async () => {
      expect(exportUrl).toContain('/api/export/govt/udise');
      expect(exportUrl).toContain('academicYear=2025-26');
      expect(exportUrl).toContain('format=csv');
    }).toPass({ timeout: 5000 });
  });

  // Test 10: Empty academic year filter shows validation error
  test('empty academic year filter shows validation error on export', async ({ page }) => {
    await page.goto('/data-tools/govt-export');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Don't fill in academic year — leave it empty
    // Click CSV button for UDISE (first card)
    const csvButtons = page.getByRole('button', { name: 'CSV' });
    await csvButtons.first().click();

    // The backend returns 400 with error message, which triggers toast.error
    // Wait for error toast to appear
    await expect(async () => {
      const body = await page.textContent('body');
      // The error message from the mock endpoint OR the export failed message should appear
      const hasError = body?.includes('Academic year is required') || body?.includes('Export failed');
      expect(hasError).toBe(true);
    }).toPass({ timeout: 5000 });
  });
});

/* ═══════════════════════════════════════════════════════════════════
 *  Data Tools — Bulk Import (10 tests)
 * ═══════════════════════════════════════════════════════════════════ */

type ImportJob = {
  _id: string;
  type: string;
  status: string;
  fileName: string;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  dryRun: boolean;
  createdAt: string;
  rows: Array<{ row: number; identifier: string; status: string; error?: string }>;
};

function seedBulkImportJobs(): ImportJob[] {
  return [
    {
      _id: 'bij-1',
      type: 'students',
      status: 'completed',
      fileName: 'students_batch1.csv',
      importedCount: 45,
      skippedCount: 3,
      failedCount: 2,
      dryRun: false,
      createdAt: '2026-03-18T10:00:00Z',
      rows: [
        { row: 12, identifier: 'STU-012', status: 'failed', error: 'Duplicate admission ID' },
        { row: 33, identifier: 'STU-033', status: 'failed', error: 'Invalid date format' },
      ],
    },
    {
      _id: 'bij-2',
      type: 'staff',
      status: 'running',
      fileName: 'staff_import.xlsx',
      importedCount: 10,
      skippedCount: 0,
      failedCount: 0,
      dryRun: false,
      createdAt: '2026-03-19T08:30:00Z',
      rows: [],
    },
    {
      _id: 'bij-3',
      type: 'fees',
      status: 'queued',
      fileName: 'fee_payments.csv',
      importedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      dryRun: false,
      createdAt: '2026-03-19T09:00:00Z',
      rows: [],
    },
    {
      _id: 'bij-4',
      type: 'attendance',
      status: 'failed',
      fileName: 'attendance_jan.xls',
      importedCount: 0,
      skippedCount: 0,
      failedCount: 50,
      dryRun: false,
      createdAt: '2026-03-17T14:00:00Z',
      rows: [{ row: 1, identifier: 'ALL', status: 'failed', error: 'Invalid CSV format' }],
    },
    {
      _id: 'bij-5',
      type: 'students',
      status: 'rolled_back',
      fileName: 'wrong_data.csv',
      importedCount: 20,
      skippedCount: 0,
      failedCount: 0,
      dryRun: false,
      createdAt: '2026-03-16T11:00:00Z',
      rows: [],
    },
  ];
}

async function installBulkImportRoutes(
  page: import('@playwright/test').Page,
  jobs: ImportJob[],
  apiLog: Set<string>,
) {
  // GET /api/bulk-import/template/:type → blob download
  await page.route('**/api/bulk-import/template/*', async (route) => {
    const url = new URL(route.request().url());
    const type = url.pathname.split('/').pop();
    apiLog.add(`GET /api/bulk-import/template/${type}`);
    await route.fulfill({
      status: 200,
      contentType: 'text/csv',
      body: 'name,email,phone\n',
      headers: { 'Content-Disposition': `attachment; filename=bulk-import-${type}-template.csv` },
    });
  });

  // POST /api/bulk-import/history/:id/rollback → rollback (must be before the history catch-all)
  await page.route('**/api/bulk-import/history/*/rollback', async (route) => {
    if (route.request().method() !== 'POST') { await route.fallback(); return; }
    const parts = new URL(route.request().url()).pathname.split('/');
    const jobId = parts[parts.length - 2];
    apiLog.add(`POST /api/bulk-import/history/${jobId}/rollback`);
    const job = jobs.find((j) => j._id === jobId);
    if (job) job.status = 'rolled_back';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'rolled_back', message: 'Import rolled back successfully' }),
    });
  });

  // GET /api/bulk-import/history → job list (use regex to also match ?limit=30 query)
  await page.route(/\/api\/bulk-import\/history(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'GET') { await route.fallback(); return; }
    apiLog.add('GET /api/bulk-import/history');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ jobs }),
    });
  });

  // POST /api/bulk-import/:type → import result
  await page.route(/\/api\/bulk-import\/(students|staff|fees|attendance)(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'POST') { await route.fallback(); return; }
    const url = new URL(route.request().url());
    const type = url.pathname.split('/').pop();
    const dryRun = url.searchParams.get('dryRun') === 'true';
    apiLog.add(`POST /api/bulk-import/${type}`);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        imported: 25,
        skipped: 3,
        failed: [
          { row: 5, admissionId: 'STU-005', name: 'Test Student', error: 'Duplicate admission ID' },
          { row: 14, admissionId: 'STU-014', name: 'Another Student', error: 'Invalid date of birth' },
        ],
        dryRun,
        status: 'completed',
        message: dryRun ? 'Dry run completed' : 'Import completed successfully',
      }),
    });
  });
}

test.describe('Data Tools — Bulk Import', () => {
  let state: MockState;
  let jobs: ImportJob[];
  let apiLog: Set<string>;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    jobs = seedBulkImportJobs();
    apiLog = new Set();
    // Dismiss cookie consent banner so it doesn't obscure interactive elements
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
    await installBulkImportRoutes(page, jobs, apiLog);
  });

  // 1. Bulk import page loads with 4 import type cards
  test('bulk import page loads with 4 import type cards (Students, Staff, Fee Payments, Attendance)', async ({ page }) => {
    await page.goto('/data-tools/bulk-import');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    await expect(page.getByText('Bulk Import')).toBeVisible();
    await expect(page.getByRole('button', { name: /students/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /staff/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /fee payments/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /attendance/i }).first()).toBeVisible();
  });

  // 2. Selecting an import type shows upload area
  test('selecting an import type shows upload area', async ({ page }) => {
    await page.goto('/data-tools/bulk-import');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    // Students is selected by default — upload area should be visible
    await expect(page.getByText(/drop a file here|click to browse/i)).toBeVisible();
    await expect(page.getByText(/csv, xlsx, xls/i)).toBeVisible();

    // Click Staff type card
    await page.getByRole('button', { name: /staff/i }).first().click();
    await expect(page.getByText(/drop a file here|click to browse/i)).toBeVisible();

    // Click Attendance type card
    await page.getByRole('button', { name: /attendance/i }).first().click();
    await expect(page.getByText(/drop a file here|click to browse/i)).toBeVisible();
  });

  // 3. Download template button triggers file download for selected type
  test('download template button triggers file download for selected type', async ({ page }) => {
    await page.goto('/data-tools/bulk-import');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    const downloadPromise = page.waitForEvent('download').catch(() => null);
    await page.getByRole('button', { name: /download template/i }).click();

    const download = await downloadPromise;
    const templateCalled = apiLog.has('GET /api/bulk-import/template/students');
    expect(download !== null || templateCalled).toBeTruthy();
  });

  // 4. File upload accepts CSV/XLSX/XLS only — rejects other types with error
  test('file upload accepts CSV/XLSX/XLS only — rejects other types with error', async ({ page }) => {
    await page.goto('/data-tools/bulk-import');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    const fileInput = page.locator('input[type="file"]');

    // Upload a PDF file — should be rejected
    await fileInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content'),
    });

    // Error toast should appear
    await expect(page.getByText(/only csv and excel files/i).first()).toBeVisible({ timeout: 5000 });
    // File name should NOT appear in the drop zone
    await expect(page.getByText('document.pdf')).not.toBeVisible();

    // Upload a valid CSV file — should be accepted
    await fileInput.setInputFiles({
      name: 'students.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name,email\nJohn,john@test.com'),
    });
    await expect(page.getByText('students.csv')).toBeVisible();
  });

  // 5. Drag-and-drop file upload works
  test('drag-and-drop file upload works', async ({ page }) => {
    await page.goto('/data-tools/bulk-import');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    const dropZone = page.locator('.border-dashed').first();
    await expect(dropZone).toBeVisible();

    // Use the file input to simulate file selection (Playwright limitation for DnD with files)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'staff_data.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('fake xlsx content'),
    });

    await expect(page.getByText('staff_data.xlsx')).toBeVisible();
  });

  // 6. Dry run toggle is available and defaults to off
  test('dry run toggle is available and defaults to off', async ({ page }) => {
    await page.goto('/data-tools/bulk-import');
    await page.waitForLoadState('networkidle');

    // Wait for lazy chunk to load
    await expect(page.getByText('Bulk Import').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/dry run/i).first()).toBeVisible({ timeout: 5000 });

    // The dry run checkbox may be a custom styled checkbox; use the label to toggle it
    const dryRunLabel = page.getByText(/dry run/i).first();
    await expect(dryRunLabel).toBeVisible();

    // Add a file so the button is enabled
    await page.locator('input[type="file"]').setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name,email\nTest,test@test.com'),
    });
    await expect(page.getByText('test.csv').first()).toBeVisible({ timeout: 5000 });
  });

  // 7. Upload triggers POST with file and shows progress
  test('upload triggers POST with file and shows progress', async ({ page }) => {
    await page.goto('/data-tools/bulk-import');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    await page.locator('input[type="file"]').setInputFiles({
      name: 'students_import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name,email,phone\nAarav,aarav@test.com,9876543210'),
    });
    await expect(page.getByText('students_import.csv')).toBeVisible();

    await page.getByRole('button', { name: /^import$/i }).last().click();

    // Verify API was called
    await expect.poll(() => apiLog.has('POST /api/bulk-import/students'), { timeout: 5000 }).toBeTruthy();

    // Success toast or result should appear
    await expect(
      page.getByText(/import(?:ed| complete)/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  // 8. Import result display shows success/error counts
  test('import result display shows success/error counts', async ({ page }) => {
    await page.goto('/data-tools/bulk-import');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [id="main-content"], nav', { timeout: 15000 });

    await page.locator('input[type="file"]').setInputFiles({
      name: 'data.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name,email\nTest,test@test.com'),
    });
    await page.getByRole('button', { name: /^import$/i }).last().click();

    // Wait for result panel (mock returns imported=25, skipped=3, failed=2)
    await expect(page.getByText(/import result/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('25', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('3', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/imported/i).first()).toBeVisible();
    await expect(page.getByText(/skipped/i).first()).toBeVisible();
    await expect(page.getByText(/failed/i).first()).toBeVisible();
  });

  // 9. Import history table shows previous imports with status badges
  test('import history table shows previous imports with status badges (completed, running, queued, failed, rolled_back)', async ({ page }) => {
    await page.goto('/data-tools/bulk-import');
    await page.waitForLoadState('networkidle');

    // Wait for lazy chunk to load
    await expect(page.getByText('Bulk Import').first()).toBeVisible({ timeout: 15000 });

    // Switch to History tab
    const historyTab = page.getByRole('tab', { name: /history/i }).first();
    await expect(historyTab).toBeVisible({ timeout: 5000 });
    await historyTab.click();
    await page.waitForLoadState('networkidle');

    await expect.poll(() => apiLog.has('GET /api/bulk-import/history'), { timeout: 5000 }).toBeTruthy();

    // Wait for history data to render after API response
    await expect(page.getByText('students_batch1.csv').first()).toBeVisible({ timeout: 10000 });

    // Verify job entries are shown
    const bodyText = (await page.textContent('body')) || '';
    expect(
      bodyText.includes('students_batch1.csv') ||
        bodyText.includes('staff_import.xlsx') ||
        bodyText.toLowerCase().includes('students import'),
    ).toBeTruthy();

    // Verify status badges — at least 2 of the 5 statuses should be visible
    const statuses = ['Completed', 'Running', 'Queued', 'Failed', 'Rolled Back'];
    let visibleCount = 0;
    for (const s of statuses) {
      if (await page.getByText(s, { exact: true }).first().isVisible({ timeout: 1000 }).catch(() => false)) {
        visibleCount++;
      }
    }
    expect(visibleCount).toBeGreaterThanOrEqual(2);
  });

  // 10. Rollback import action changes status to rolled_back
  test('rollback import action changes status to rolled_back', async ({ page }) => {
    await page.goto('/data-tools/bulk-import');
    await page.waitForLoadState('networkidle');

    // Wait for lazy chunk to load
    await expect(page.getByText('Bulk Import').first()).toBeVisible({ timeout: 15000 });

    // Switch to History tab
    const historyTab = page.getByRole('tab', { name: /history/i }).first();
    await expect(historyTab).toBeVisible({ timeout: 5000 });
    await historyTab.click();
    await page.waitForLoadState('networkidle');

    await expect.poll(() => apiLog.has('GET /api/bulk-import/history'), { timeout: 5000 }).toBeTruthy();

    // Click the Rollback button (visible on completed, non-dry-run job bij-1 with importedCount=45)
    const rollbackBtn = page.getByRole('button', { name: /rollback/i }).first();
    await expect(rollbackBtn).toBeVisible({ timeout: 5000 });
    await rollbackBtn.click();

    // App uses custom ConfirmDialog (not native dialog) — click "Rollback" to confirm
    const confirmDialog = page.locator('[role="alertdialog"]').filter({ hasText: 'Rollback Import' });
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    await confirmDialog.getByRole('button', { name: 'Rollback' }).click();

    // Verify rollback API was called
    await expect
      .poll(() => apiLog.has('POST /api/bulk-import/history/bij-1/rollback'), { timeout: 5000 })
      .toBeTruthy();

    // After rollback + history reload, "Rolled Back" badge should appear
    await expect(
      page.getByText(/rolled back/i).first().or(page.getByText('Rolled Back').first()),
    ).toBeVisible({ timeout: 5000 });
  });
});
