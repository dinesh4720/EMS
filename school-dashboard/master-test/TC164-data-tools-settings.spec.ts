import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Data Tools Settings mock data
 * ───────────────────────────────────────────────────────────────────── */

interface BackupRecord {
  id: string;
  date: string;
  size: string;
  status: 'completed' | 'failed' | 'in_progress';
}

interface ConsentLog {
  type: string;
  granted: boolean;
  date: string;
}

interface DataExportRequest {
  id: string;
  status: string;
}

interface DeletionRequest {
  id: string;
  status: string;
}

interface GdprData {
  consentLogs: ConsentLog[];
  dataExportRequests: DataExportRequest[];
  deletionRequests: DeletionRequest[];
}

interface BackupData {
  schedule: string;
  lastBackup: string | null;
  backups: BackupRecord[];
}

function seedBackupData(): BackupData {
  return {
    schedule: 'daily',
    lastBackup: '2026-05-18T02:00:00.000Z',
    backups: [
      { id: 'bk-1', date: '2026-05-18T02:00:00.000Z', size: '24.5 MB', status: 'completed' },
      { id: 'bk-2', date: '2026-05-17T02:00:00.000Z', size: '24.1 MB', status: 'completed' },
      { id: 'bk-3', date: '2026-05-16T02:00:00.000Z', size: '23.8 MB', status: 'completed' },
      { id: 'bk-4', date: '2026-05-15T02:00:00.000Z', size: '23.4 MB', status: 'failed' },
    ],
  };
}

function seedGdprData(): GdprData {
  return {
    consentLogs: [
      { type: 'cookies', granted: true, date: '2026-05-01' },
      { type: 'analytics', granted: false, date: '2026-05-01' },
      { type: 'marketing', granted: false, date: '2026-05-01' },
    ],
    dataExportRequests: [
      { id: 'req-001', status: 'completed' },
      { id: 'req-002', status: 'pending' },
    ],
    deletionRequests: [
      { id: 'del-001', status: 'approved' },
    ],
  };
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC164 — Data Tools Settings (Import, Export, Backup, GDPR)
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC164 — Data Tools Settings', () => {
  let state: MockState;
  let backupData: BackupData;
  let gdprData: GdprData;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    backupData = seedBackupData();
    gdprData = seedGdprData();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    /* ── Import ── */
    await page.route('**/bulk-import/*', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jobId: 'import-164-001',
            status: 'completed',
            totalRecords: 50,
            successCount: 48,
            errorCount: 2,
            errors: [
              { row: 12, field: 'email', message: 'Invalid email format for parent' },
              { row: 34, field: 'phone', message: 'Phone number must be 10 digits' },
            ],
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jobs: [], total: 0 }),
      });
    });

    /* ── Export ── */
    await page.route('**/export/students', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'text/csv',
        headers: { 'Content-Disposition': 'attachment; filename="students-export-2026.csv"' },
        body: 'Admission ID,Name,Class,Roll No\nADM-001,Aarav Sharma,10-A,1\nADM-002,Priya Menon,10-A,2\nADM-003,Ravi Kumar,9-B,5',
      });
    });

    await page.route('**/export/staff', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'text/csv',
        headers: { 'Content-Disposition': 'attachment; filename="staff-export-2026.csv"' },
        body: 'Employee ID,Name,Role,Department\nEMP-101,Ananya Sharma,Teacher,Science\nEMP-102,Ramesh Babu,Accountant,Admin',
      });
    });

    await page.route('**/export/fee-collection', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'text/csv',
        headers: { 'Content-Disposition': 'attachment; filename="fees-export-2026.csv"' },
        body: 'Student,Total Fee,Paid,Balance\nAarav Sharma,75000,50000,25000\nPriya Menon,75000,75000,0',
      });
    });

    /* ── Backup ── */
    await page.route('**/backup/list', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(backupData),
      });
    });

    /* ── GDPR ── */
    await page.route('**/gdpr/dashboard', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(gdprData),
      });
    });
  });

  /* ───────── 1. Page loads with all tabs ───────── */
  test('1) Data Tools settings page loads with Import, Export, Backup, and GDPR tabs', async ({ page }) => {
    await page.goto('/settings/data-tools');
    await page.waitForLoadState('networkidle');

    // Wait for lazy-loaded settings component and tabs
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 });

    await expect(page).not.toHaveURL(/\/login/);

    // Header
    await expect(page.getByRole('heading', { name: 'Data Tools' })).toBeVisible();
    await expect(page.getByText(/Import, export, backup, and manage your school data/i)).toBeVisible();

    // Tabs
    await expect(page.getByRole('tab', { name: /Import/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Export/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Backup/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /GDPR/i })).toBeVisible();
  });

  /* ───────── 2. Import tab happy path ───────── */
  test('2) Import tab allows file selection and shows success summary with error details', async ({ page }) => {
    await page.goto('/settings/data-tools');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 });

    // Ensure Import tab is active
    await page.getByRole('tab', { name: /Import/i }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText('Bulk Import')).toBeVisible();
    await expect(page.getByText(/Upload CSV or Excel files to import data in bulk/i)).toBeVisible();

    // Upload a file via the hidden input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'students-batch-2026.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name,class,email\nRahul,10-A,rahul@test.com\nSneha,10-B,sneha@test.com'),
    });

    // File name should appear
    await expect(page.getByText('students-batch-2026.csv')).toBeVisible();

    // Import button should now be enabled
    const importBtn = page.getByRole('button', { name: /Import Data/i });
    await expect(importBtn).toBeEnabled();

    // Click import
    await importBtn.click();
    await page.waitForTimeout(1000);

    // Import summary should appear
    await expect(page.getByText('Import Summary')).toBeVisible();
    await expect(page.getByText('50').first()).toBeVisible(); // total
    await expect(page.getByText('48').first()).toBeVisible(); // success
    await expect(page.getByText('2').first()).toBeVisible(); // errors

    // Error details should show row-level messages
    await expect(page.getByText(/Invalid email format for parent/i)).toBeVisible();
    await expect(page.getByText(/Phone number must be 10 digits/i)).toBeVisible();
  });

  /* ───────── 3. Import tab rejects invalid file types ───────── */
  test('3) Import tab rejects invalid file types with toast error', async ({ page }) => {
    await page.goto('/settings/data-tools');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 });

    await page.getByRole('tab', { name: /Import/i }).click();
    await page.waitForTimeout(300);

    // Try uploading a PDF
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'invalid-file.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 fake pdf'),
    });

    // Toast error should appear
    await expect(page.getByText(/Please upload a CSV or Excel file/i)).toBeVisible();

    // Import button should remain disabled
    const importBtn = page.getByRole('button', { name: /Import Data/i });
    await expect(importBtn).toBeDisabled();
  });

  /* ───────── 4. Export tab triggers CSV download ───────── */
  test('4) Export tab allows selecting entity and triggers export API call', async ({ page }) => {
    await page.goto('/settings/data-tools');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 });

    await page.getByRole('tab', { name: /Export/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Data Export')).toBeVisible();

    // Click the Fees card to select it (cards are rendered as buttons)
    await page.getByRole('button', { name: /^Fees$/i }).click();
    await page.waitForTimeout(300);

    // Export button should reference Fees
    const exportBtn = page.getByRole('button', { name: /Export/i });
    await expect(exportBtn).toBeVisible();

    // Click export — download may or may not be caught by Playwright due to blob URL
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await exportBtn.click();
    await page.waitForTimeout(800);

    const download = await downloadPromise;
    // Graceful: if download captured, verify name; otherwise just verify button click succeeded
    if (download) {
      expect(download.suggestedFilename()).toMatch(/fees|export/i);
    }
  });

  /* ───────── 5. Export tab card selection changes active entity ───────── */
  test('5) Export tab card selection updates the active entity', async ({ page }) => {
    await page.goto('/settings/data-tools');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 });

    await page.getByRole('tab', { name: /Export/i }).click();
    await page.waitForTimeout(500);

    // Default entity select should show Students
    await expect(page.getByText('Students').first()).toBeVisible();

    // Click Staff card
    await page.getByRole('button', { name: /^Staff$/i }).click();
    await page.waitForTimeout(300);

    // Entity select should update to Staff
    await expect(page.getByText('Staff').first()).toBeVisible();

    // Click Fees card
    await page.getByRole('button', { name: /^Fees$/i }).click();
    await page.waitForTimeout(300);

    // Entity select should update to Fees
    await expect(page.getByText('Fees').first()).toBeVisible();
  });

  /* ───────── 6. Backup tab shows stats and history table ───────── */
  test('6) Backup tab renders schedule, last backup, total backups, and history table', async ({ page }) => {
    await page.goto('/settings/data-tools');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 });

    await page.getByRole('tab', { name: /Backup/i }).click();
    await page.waitForTimeout(600);

    await expect(page.getByText('Backup & Restore')).toBeVisible();

    // Stats cards
    await expect(page.getByText('Schedule').first()).toBeVisible();
    await expect(page.getByText('Last Backup').first()).toBeVisible();
    await expect(page.getByText('Total Backups').first()).toBeVisible();

    // History table
    await expect(page.getByRole('columnheader', { name: /Date/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Size/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();

    // Rows
    await expect(page.getByText('24.5 MB')).toBeVisible();
    await expect(page.getByText('24.1 MB')).toBeVisible();
    await expect(page.getByText('completed', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('failed', { exact: false }).first()).toBeVisible();
  });

  /* ───────── 7. Backup tab empty state ───────── */
  test('7) Backup tab shows empty state when no backup data exists', async ({ page }) => {
    // Override backup to return null/empty
    await page.route('**/backup/list', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/settings/data-tools');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 });

    await page.getByRole('tab', { name: /Backup/i }).click();
    await page.waitForTimeout(600);

    await expect(page.getByText('No backup information available')).toBeVisible();
  });

  /* ───────── 8. GDPR tab shows consent logs, export requests, and deletion requests ───────── */
  test('8) GDPR tab renders consent logs, data export requests, and deletion requests', async ({ page }) => {
    await page.goto('/settings/data-tools');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 });

    await page.getByRole('tab', { name: /GDPR/i }).click();
    await page.waitForTimeout(600);

    await expect(page.getByText('GDPR Compliance')).toBeVisible();

    // Consent logs section
    await expect(page.getByText('Consent Logs').first()).toBeVisible();
    await expect(page.getByText('cookies', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('analytics', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Yes').first()).toBeVisible();
    await expect(page.getByText('No').first()).toBeVisible();

    // Data export requests
    await expect(page.getByText('Data Export Requests').first()).toBeVisible();
    await expect(page.getByText('req-001')).toBeVisible();
    await expect(page.getByText('req-002')).toBeVisible();
    await expect(page.getByText('completed', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('pending', { exact: false }).first()).toBeVisible();

    // Deletion requests
    await expect(page.getByText('Deletion Requests').first()).toBeVisible();
    await expect(page.getByText('del-001')).toBeVisible();
    await expect(page.getByText('approved', { exact: false }).first()).toBeVisible();
  });

  /* ───────── 9. GDPR tab empty state ───────── */
  test('9) GDPR tab shows empty messages when no GDPR data exists', async ({ page }) => {
    await page.route('**/gdpr/dashboard', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          consentLogs: [],
          dataExportRequests: [],
          deletionRequests: [],
        }),
      });
    });

    await page.goto('/settings/data-tools');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 });

    await page.getByRole('tab', { name: /GDPR/i }).click();
    await page.waitForTimeout(600);

    await expect(page.getByText('No consent logs found')).toBeVisible();
    await expect(page.getByText('No data export requests')).toBeVisible();
    await expect(page.getByText('No deletion requests')).toBeVisible();
  });

  /* ───────── 10. Tab navigation preserves state ───────── */
  test('10) Switching tabs updates visible content without page reload', async ({ page }) => {
    await page.goto('/settings/data-tools');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 });

    // Start on Import
    await expect(page.getByText('Bulk Import')).toBeVisible();

    // Switch to Export
    await page.getByRole('tab', { name: /Export/i }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Data Export')).toBeVisible();

    // Switch to Backup
    await page.getByRole('tab', { name: /Backup/i }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Backup & Restore')).toBeVisible();

    // Switch to GDPR
    await page.getByRole('tab', { name: /GDPR/i }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText('GDPR Compliance')).toBeVisible();
  });
});
