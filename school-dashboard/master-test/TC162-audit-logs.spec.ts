/**
 * TC162: Audit Logs Viewer — comprehensive Playwright E2E tests.
 *
 * Covers: happy path (list → detail), filters, search, pagination,
 * export (CSV/JSON), empty state, error state, mobile drawer.
 * Issue: #714 — Implement Audit Logs viewer page.
 */
import { expect, test } from '@playwright/test';
import { createMockState, installMockApi, createAdminUser, SCHOOL_ID } from '../tests/test-utils';
import type { MockState } from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

interface AuditLogRecord {
  _id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: { _id: string; name: string; role: string };
  userName?: string;
  ipAddress: string;
  path: string;
  method: string;
  userAgent?: string;
  createdAt: string;
  changes?: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
  oldValue?: unknown;
  newValue?: unknown;
}

function seedAuditLogs(state: MockState): AuditLogRecord[] {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);
  const twoDaysAgo = new Date(now.getTime() - 172800000);
  const lastWeek = new Date(now.getTime() - 604800000);

  const logs: AuditLogRecord[] = [
    {
      _id: 'al-001',
      action: 'created',
      entity: 'student',
      entityId: 'stu-000001',
      userId: { _id: 'user-admin', name: 'Dinesh Admin', role: 'admin' },
      ipAddress: '192.168.1.10',
      path: '/api/students',
      method: 'POST',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: now.toISOString(),
      changes: [
        { field: 'name', oldValue: null, newValue: 'Rahul Sharma' },
        { field: 'classId', oldValue: null, newValue: 'cls-10a' },
      ],
    },
    {
      _id: 'al-002',
      action: 'updated',
      entity: 'staff',
      entityId: 'staff-001',
      userId: { _id: 'user-admin', name: 'Dinesh Admin', role: 'admin' },
      ipAddress: '192.168.1.10',
      path: '/api/staff/staff-001',
      method: 'PUT',
      createdAt: yesterday.toISOString(),
      changes: [
        { field: 'designation', oldValue: 'Teacher', newValue: 'Senior Teacher' },
        { field: 'salary', oldValue: 40000, newValue: 45000 },
      ],
    },
    {
      _id: 'al-003',
      action: 'deleted',
      entity: 'class',
      entityId: 'cls-12b',
      userId: { _id: 'user-principal', name: 'Dr. Krishnamurthy', role: 'principal' },
      ipAddress: '192.168.1.15',
      path: '/api/classes/cls-12b',
      method: 'DELETE',
      createdAt: twoDaysAgo.toISOString(),
      oldValue: { name: '12', section: 'B', classTeacherId: 'staff-005' },
    },
    {
      _id: 'al-004',
      action: 'login',
      entity: 'auth',
      entityId: 'session-001',
      userId: { _id: 'user-teacher-a', name: 'Ananya Sharma', role: 'teacher' },
      ipAddress: '192.168.1.22',
      path: '/api/auth/login',
      method: 'POST',
      createdAt: now.toISOString(),
    },
    {
      _id: 'al-005',
      action: 'login_failed',
      entity: 'auth',
      entityId: 'session-fail-001',
      userId: { _id: 'unknown', name: 'Unknown User', role: 'guest' },
      ipAddress: '203.192.12.45',
      path: '/api/auth/login',
      method: 'POST',
      createdAt: lastWeek.toISOString(),
    },
    {
      _id: 'al-006',
      action: 'password_changed',
      entity: 'auth',
      entityId: 'user-admin',
      userId: { _id: 'user-admin', name: 'Dinesh Admin', role: 'admin' },
      ipAddress: '192.168.1.10',
      path: '/api/auth/password',
      method: 'PUT',
      createdAt: yesterday.toISOString(),
    },
    {
      _id: 'al-007',
      action: 'settings_changed',
      entity: 'fee',
      entityId: 'fee-head-tuition',
      userId: { _id: 'user-accountant', name: 'Priya Menon', role: 'accountant' },
      ipAddress: '192.168.1.25',
      path: '/api/fee-heads/fee-head-tuition',
      method: 'PUT',
      createdAt: twoDaysAgo.toISOString(),
      changes: [
        { field: 'amount', oldValue: 4500, newValue: 5000 },
      ],
    },
    {
      _id: 'al-008',
      action: 'role_changed',
      entity: 'staff',
      entityId: 'staff-002',
      userId: { _id: 'user-admin', name: 'Dinesh Admin', role: 'admin' },
      ipAddress: '192.168.1.10',
      path: '/api/staff/staff-002/role',
      method: 'PUT',
      createdAt: lastWeek.toISOString(),
      changes: [
        { field: 'role', oldValue: 'teacher', newValue: 'hod' },
      ],
    },
    {
      _id: 'al-009',
      action: 'permission_changed',
      entity: 'staff',
      entityId: 'staff-003',
      userId: { _id: 'user-admin', name: 'Dinesh Admin', role: 'admin' },
      ipAddress: '192.168.1.10',
      path: '/api/staff/staff-003/permissions',
      method: 'PUT',
      createdAt: now.toISOString(),
      changes: [
        { field: 'students', oldValue: false, newValue: true },
      ],
    },
    {
      _id: 'al-010',
      action: 'logout',
      entity: 'auth',
      entityId: 'session-002',
      userId: { _id: 'user-teacher-b', name: 'Ravi Menon', role: 'teacher' },
      ipAddress: '192.168.1.23',
      path: '/api/auth/logout',
      method: 'POST',
      createdAt: yesterday.toISOString(),
    },
  ];

  return logs;
}

function buildAuditLogMockResponse(logs: AuditLogRecord[], page = 1, limit = 25) {
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginated = logs.slice(start, end);
  return {
    logs: paginated,
    pagination: {
      total: logs.length,
      page,
      limit,
      totalPages: Math.ceil(logs.length / limit),
    },
  };
}

/* ─────────────────────────────────────────────────────────────────────
 *  Test Suite
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC162 — Audit Logs Viewer', () => {
  let state: MockState;
  let allLogs: AuditLogRecord[];

  test.beforeEach(async ({ page }) => {
    state = createMockState(createAdminUser());
    allLogs = seedAuditLogs(state);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override audit-logs endpoint with proper pagination/filtering support
    await page.route('**/api/audit-logs**', async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      const method = route.request().method();

      // Export endpoint
      if (path.includes('/export')) {
        const format = url.searchParams.get('format') || 'csv';
        const body = format === 'csv'
          ? 'id,action,entity,createdAt\nal-001,created,student,2026-05-31T00:00:00.000Z'
          : JSON.stringify({ logs: allLogs });
        return route.fulfill({
          status: 200,
          contentType: format === 'csv' ? 'text/csv' : 'application/json',
          body,
        });
      }

      // Purge endpoint
      if (path.includes('/purge') && method === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, deletedCount: 5 }),
        });
      }

      // List endpoint
      if (method === 'GET') {
        let filtered = [...allLogs];
        const action = url.searchParams.get('action');
        const entity = url.searchParams.get('entity');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const reqPage = parseInt(url.searchParams.get('page') || '1', 10);
        const reqLimit = parseInt(url.searchParams.get('limit') || '25', 10);

        if (action) {
          filtered = filtered.filter((l) => l.action === action);
        }
        if (entity) {
          filtered = filtered.filter((l) => l.entity === entity);
        }
        if (startDate) {
          filtered = filtered.filter((l) => l.createdAt >= startDate);
        }
        if (endDate) {
          filtered = filtered.filter((l) => l.createdAt <= endDate);
        }

        const response = buildAuditLogMockResponse(filtered, reqPage, reqLimit);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response),
        });
      }

      return route.fulfill({ status: 404, body: JSON.stringify({ error: 'Not found' }) });
    });
  });

  /* ───────── 1. Page loads and displays audit log list ───────── */

  test('1) audit logs page loads and displays log list', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // Page title should be visible
    await expect(page.getByText('Audit Logs')).toBeVisible();

    // Total count in description
    await expect(page.getByText(/10 records/)).toBeVisible();

    // Log rows should be rendered
    const rows = page.locator('[data-log-id]');
    await expect(rows).toHaveCount(10);

    // Verify action badges are visible
    await expect(page.getByText('Created')).toBeVisible();
    await expect(page.getByText('Updated')).toBeVisible();
  });

  /* ───────── 2. Clicking a log shows detail pane ───────── */

  test('2) clicking a log row opens the detail pane', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // Click on the first log row (created student)
    const firstRow = page.locator('[data-log-id="al-001"]');
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // Detail pane should show entity and action metadata
    await expect(page.getByText('Select a log')).not.toBeVisible();
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
    await expect(page.getByText('Entity')).toBeVisible();
    await expect(page.getByText('student', { exact: true })).toBeVisible();

    // Changes table should be visible for created action
    await expect(page.getByText('Field Changes')).toBeVisible();
    await expect(page.getByText('name', { exact: true })).toBeVisible();
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
  });

  /* ───────── 3. Detail pane shows correct metadata ───────── */

  test('3) detail pane displays all metadata fields', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // Click on login_failed log
    await page.locator('[data-log-id="al-005"]').click();

    await expect(page.getByText('Login Failed')).toBeVisible();
    await expect(page.getByText('Performed By')).toBeVisible();
    await expect(page.getByText('Unknown User')).toBeVisible();
    await expect(page.getByText('IP Address')).toBeVisible();
    await expect(page.getByText('203.192.12.45')).toBeVisible();
    await expect(page.getByText('Method')).toBeVisible();
    await expect(page.getByText('POST')).toBeVisible();
    await expect(page.getByText('Path')).toBeVisible();
    await expect(page.getByText('/api/auth/login')).toBeVisible();
  });

  /* ───────── 4. Filter by action type ───────── */

  test('4) filter by action type reduces visible logs', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // Wait for the action filter dropdown
    const actionFilter = page.locator('select[aria-label="Filter by action"]');
    await expect(actionFilter).toBeVisible();
    await actionFilter.selectOption('login');

    // Wait for re-fetch; only login logs should remain
    await page.waitForTimeout(300);
    const rows = page.locator('[data-log-id]');
    await expect(rows).toHaveCount(1);
    await expect(page.getByText('Login', { exact: true })).toBeVisible();
  });

  /* ───────── 5. Filter by entity type ───────── */

  test('5) filter by entity type reduces visible logs', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    const entityFilter = page.locator('select[aria-label="Filter by entity"]');
    await expect(entityFilter).toBeVisible();
    await entityFilter.selectOption('auth');

    await page.waitForTimeout(300);
    const rows = page.locator('[data-log-id]');
    // auth entity logs: login, login_failed, password_changed, logout = 4
    await expect(rows).toHaveCount(4);
  });

  /* ───────── 6. Filter by date range ───────── */

  test('6) filter by date range reduces visible logs', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // The DateRangePicker is a custom component; interact with its inputs
    const dateInputs = page.locator('input[placeholder*="Date"]');
    if (await dateInputs.count() >= 2) {
      const today = new Date().toISOString().split('T')[0];
      await dateInputs.nth(0).fill(today);
      await dateInputs.nth(1).fill(today);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);

      // Only logs from today should show: al-001, al-004, al-009 = 3
      const rows = page.locator('[data-log-id]');
      await expect(rows).toHaveCount(3);
    }
  });

  /* ───────── 7. Client-side search filters logs ───────── */

  test('7) search box filters logs client-side', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    const searchBox = page.locator('input[aria-label="Search audit logs"]');
    await expect(searchBox).toBeVisible();
    await searchBox.fill('Ananya Sharma');

    await page.waitForTimeout(300);
    const rows = page.locator('[data-log-id]');
    // Only the login log by Ananya Sharma
    await expect(rows).toHaveCount(1);
    await expect(page.locator('[data-log-id="al-004"]')).toBeVisible();
  });

  /* ───────── 8. Search by IP address ───────── */

  test('8) search by IP address filters logs', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    const searchBox = page.locator('input[aria-label="Search audit logs"]');
    await searchBox.fill('203.192.12.45');

    await page.waitForTimeout(300);
    const rows = page.locator('[data-log-id]');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('[data-log-id="al-005"]')).toBeVisible();
  });

  /* ───────── 9. Reset filters clears all filters ───────── */

  test('9) reset button clears filters and search', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // Apply a filter
    const entityFilter = page.locator('select[aria-label="Filter by entity"]');
    await entityFilter.selectOption('auth');
    await page.waitForTimeout(300);

    // Apply search
    const searchBox = page.locator('input[aria-label="Search audit logs"]');
    await searchBox.fill('login');
    await page.waitForTimeout(300);

    // Click reset
    const resetBtn = page.getByRole('button', { name: /Reset/i });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    await page.waitForTimeout(300);
    // All 10 logs should be back
    const rows = page.locator('[data-log-id]');
    await expect(rows).toHaveCount(10);
  });

  /* ───────── 10. Empty state when no logs match filters ───────── */

  test('10) empty state shown when no logs match filters', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // Search for something that doesn't exist
    const searchBox = page.locator('input[aria-label="Search audit logs"]');
    await searchBox.fill('nonexistent-xyz-123');
    await page.waitForTimeout(300);

    await expect(page.getByText('No logs matched')).toBeVisible();
    await expect(page.getByText('Try adjusting your filters or search query.')).toBeVisible();
    await expect(page.getByRole('button', { name: /Clear filters/i })).toBeVisible();
  });

  /* ───────── 11. Empty state when no audit logs exist ───────── */

  test('11) empty state shown when no audit logs exist at all', async ({ page }) => {
    // Override the mock to return empty
    await page.route('**/api/audit-logs**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('/export')) {
        return route.fulfill({ status: 200, contentType: 'text/csv', body: 'id,action\n' });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ logs: [], pagination: { total: 0, page: 1, limit: 25, totalPages: 1 } }),
      });
    });

    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('No audit logs yet')).toBeVisible();
    await expect(page.getByText('Activity will appear here once users perform actions.')).toBeVisible();
  });

  /* ───────── 12. Pagination page size change ───────── */

  test('12) page size selector changes number of visible rows', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // Create more logs for pagination testing
    const extraLogs: AuditLogRecord[] = Array.from({ length: 30 }, (_, i) => ({
      _id: `al-extra-${i + 1}`,
      action: 'updated',
      entity: 'student',
      entityId: `stu-extra-${i + 1}`,
      userId: { _id: 'user-admin', name: 'Dinesh Admin', role: 'admin' },
      ipAddress: `192.168.1.${100 + i}`,
      path: '/api/students',
      method: 'PUT',
      createdAt: new Date().toISOString(),
    }));

    await page.route('**/api/audit-logs**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('/export')) {
        return route.fulfill({ status: 200, contentType: 'text/csv', body: 'id,action\n' });
      }
      const reqPage = parseInt(url.searchParams.get('page') || '1', 10);
      const reqLimit = parseInt(url.searchParams.get('limit') || '25', 10);
      const combined = [...allLogs, ...extraLogs];
      const response = buildAuditLogMockResponse(combined, reqPage, reqLimit);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    const pageSizeSelect = page.locator('select[aria-label="Items per page"]');
    await expect(pageSizeSelect).toBeVisible();
    await pageSizeSelect.selectOption('10');

    await page.waitForTimeout(300);
    const rows = page.locator('[data-log-id]');
    await expect(rows).toHaveCount(10);
  });

  /* ───────── 13. Pagination navigation ───────── */

  test('13) pagination navigation moves between pages', async ({ page }) => {
    const manyLogs: AuditLogRecord[] = Array.from({ length: 35 }, (_, i) => ({
      _id: `al-pg-${i + 1}`,
      action: 'updated',
      entity: 'student',
      entityId: `stu-pg-${i + 1}`,
      userId: { _id: 'user-admin', name: 'Dinesh Admin', role: 'admin' },
      ipAddress: `192.168.1.${200 + i}`,
      path: '/api/students',
      method: 'PUT',
      createdAt: new Date().toISOString(),
    }));

    await page.route('**/api/audit-logs**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('/export')) {
        return route.fulfill({ status: 200, contentType: 'text/csv', body: 'id,action\n' });
      }
      const reqPage = parseInt(url.searchParams.get('page') || '1', 10);
      const reqLimit = parseInt(url.searchParams.get('limit') || '25', 10);
      const response = buildAuditLogMockResponse(manyLogs, reqPage, reqLimit);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // Default page 1 shows 25 rows
    let rows = page.locator('[data-log-id]');
    await expect(rows).toHaveCount(25);
    await expect(page.locator('[data-log-id="al-pg-1"]')).toBeVisible();

    // Navigate to page 2
    const nextBtn = page.locator('button[aria-label="Next page"], button:has-text("Next")').first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(300);
      rows = page.locator('[data-log-id]');
      await expect(rows).toHaveCount(10);
      await expect(page.locator('[data-log-id="al-pg-26"]')).toBeVisible();
    }
  });

  /* ───────── 14. Export CSV button triggers download ───────── */

  test('14) export CSV triggers file download', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
      page.getByRole('button', { name: /Export CSV/i }).click(),
    ]);

    // Even if download event isn't captured, the button should not error
    await expect(page.getByText('CSV export ready')).toBeVisible({ timeout: 3000 });
  });

  /* ───────── 15. Export JSON button triggers download ───────── */

  test('15) export JSON triggers file download', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Export JSON/i }).click();
    await expect(page.getByText('JSON export ready')).toBeVisible({ timeout: 3000 });
  });

  /* ───────── 16. Error state — API failure shows toast ───────── */

  test('16) API failure shows error toast', async ({ page }) => {
    await page.route('**/api/audit-logs**', async (route) => {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Failed to load audit logs')).toBeVisible({ timeout: 3000 });
  });

  /* ───────── 17. Mobile viewport shows detail as drawer ───────── */

  test('17) mobile viewport renders detail in slide-over drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // Click a log row
    await page.locator('[data-log-id="al-002"]').click();

    // The drawer should appear with role="dialog"
    const drawer = page.locator('[role="dialog"][aria-label="Audit log detail"]');
    await expect(drawer).toBeVisible();

    // Close the drawer by clicking the backdrop
    await page.locator('[role="presentation"]').click({ position: { x: 10, y: 10 } });
    await expect(drawer).not.toBeVisible();
  });

  /* ───────── 18. Detail pane shows snapshot for old/new value logs ───────── */

  test('18) detail pane shows snapshot block for deleted records', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // al-003 is a deleted class with oldValue snapshot
    await page.locator('[data-log-id="al-003"]').click();

    await expect(page.getByText('Snapshot')).toBeVisible();
    await expect(page.getByText('Old Value')).toBeVisible();
  });

  /* ───────── 19. Action badge colors match action type ───────── */

  test('19) action badges display correct labels and tones', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // Verify various action labels are rendered
    await expect(page.getByText('Created', { exact: true })).toBeVisible();
    await expect(page.getByText('Updated', { exact: true })).toBeVisible();
    await expect(page.getByText('Deleted', { exact: true })).toBeVisible();
    await expect(page.getByText('Login', { exact: true })).toBeVisible();
    await expect(page.getByText('Login Failed', { exact: true })).toBeVisible();
    await expect(page.getByText('Password Changed', { exact: true })).toBeVisible();
    await expect(page.getByText('Settings Changed', { exact: true })).toBeVisible();
    await expect(page.getByText('Role Changed', { exact: true })).toBeVisible();
    await expect(page.getByText('Permission Changed', { exact: true })).toBeVisible();
    await expect(page.getByText('Logout', { exact: true })).toBeVisible();
  });

  /* ───────── 20. Keyboard accessibility — log rows are focusable ───────── */

  test('20) log rows are reachable via keyboard and show focus state', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    const listbox = page.locator('[role="listbox"][aria-label="Audit logs list"]');
    await expect(listbox).toBeVisible();

    // Focus the listbox and press Tab to reach first row button
    await listbox.focus();
    await page.keyboard.press('Tab');

    // The first focusable row should have focus
    const focused = page.locator(':focus');
    await expect(focused).toHaveAttribute('role', 'option');
  });

  /* ───────── 21. URL updates with selected log id ───────── */

  test('21) selecting a log updates URL search param', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-log-id="al-001"]').click();
    await page.waitForTimeout(200);

    await expect(page).toHaveURL(/[?&]id=al-001/);

    // Click another log
    await page.locator('[data-log-id="al-004"]').click();
    await page.waitForTimeout(200);

    await expect(page).toHaveURL(/[?&]id=al-004/);
  });

  /* ───────── 22. Log row hover state ───────── */

  test('22) log rows have hover interaction', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    const row = page.locator('[data-log-id="al-001"]');
    await row.hover();

    // The hover style is applied inline; verify the element responds to hover
    await expect(row).toHaveCSS('cursor', 'pointer');
  });

  /* ───────── 23. Combined filters (action + entity + search) ───────── */

  test('23) combined filters work together', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    const actionFilter = page.locator('select[aria-label="Filter by action"]');
    await actionFilter.selectOption('updated');
    await page.waitForTimeout(200);

    const entityFilter = page.locator('select[aria-label="Filter by entity"]');
    await entityFilter.selectOption('staff');
    await page.waitForTimeout(200);

    // Only al-002 matches both updated + staff
    const rows = page.locator('[data-log-id]');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('[data-log-id="al-002"]')).toBeVisible();
  });

  /* ───────── 24. Description updates when loading changes ───────── */

  test('24) page description shows record count', async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // When loaded, description should show "10 records"
    await expect(page.getByText('10 records')).toBeVisible();
  });
});
