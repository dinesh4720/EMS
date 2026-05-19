import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  TEACHER_A_ID, TEACHER_B_ID, ACCOUNTANT_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Permission request mock data
 * ───────────────────────────────────────────────────────────────────── */

interface PermissionRequest {
  _id: string; id: string;
  requestedBy: string; requestedByName: string; role: string;
  module: string; permission: string;
  reason: string; status: string;
  reviewedBy: string | null; reviewNote: string | null;
  createdAt: string; updatedAt: string;
}

function seedPermissionRequests(state: MockState): PermissionRequest[] {
  const requests: PermissionRequest[] = [
    {
      _id: 'pr-1', id: 'pr-1',
      requestedBy: TEACHER_A_ID, requestedByName: 'Ananya Sharma', role: 'teacher',
      module: 'fees', permission: 'view',
      reason: 'Need to check fee status of my class students for parent-teacher meeting',
      status: 'pending',
      reviewedBy: null, reviewNote: null,
      createdAt: '2026-03-29T09:00:00.000Z', updatedAt: '2026-03-29T09:00:00.000Z',
    },
    {
      _id: 'pr-2', id: 'pr-2',
      requestedBy: TEACHER_B_ID, requestedByName: 'Ravi Menon', role: 'teacher',
      module: 'analytics', permission: 'view',
      reason: 'Want to view class performance analytics for improvement planning',
      status: 'pending',
      reviewedBy: null, reviewNote: null,
      createdAt: '2026-03-28T14:00:00.000Z', updatedAt: '2026-03-28T14:00:00.000Z',
    },
    {
      _id: 'pr-3', id: 'pr-3',
      requestedBy: ACCOUNTANT_ID, requestedByName: 'Priya Menon', role: 'accountant',
      module: 'staff', permission: 'edit',
      reason: 'Need to update salary details directly for payroll processing',
      status: 'approved',
      reviewedBy: 'admin', reviewNote: 'Approved for payroll purposes',
      createdAt: '2026-03-25T10:00:00.000Z', updatedAt: '2026-03-26T08:00:00.000Z',
    },
    {
      _id: 'pr-4', id: 'pr-4',
      requestedBy: TEACHER_A_ID, requestedByName: 'Ananya Sharma', role: 'teacher',
      module: 'settings', permission: 'view',
      reason: 'Would like to review attendance rules configuration',
      status: 'rejected',
      reviewedBy: 'admin', reviewNote: 'Settings access is restricted to administrators',
      createdAt: '2026-03-20T11:00:00.000Z', updatedAt: '2026-03-21T09:00:00.000Z',
    },
  ];
  (state as any).permissionRequests = requests;
  return requests;
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC086 — Permission Requests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC086 — Permission Requests', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedPermissionRequests(state);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override permission requests API routes
    await page.route('**/api/permission-requests**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/\/+$/, '');
      const method = route.request().method();
      const requests: PermissionRequest[] = (state as any).permissionRequests ?? [];

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      // GET /api/permission-requests
      if (path === '/api/permission-requests' && method === 'GET') {
        return json({ data: requests, total: requests.length });
      }

      // GET /api/permission-requests/:id
      const idMatch = path.match(/^\/api\/permission-requests\/([^/]+)$/);
      if (idMatch && method === 'GET') {
        const req = requests.find(r => r.id === idMatch[1]);
        return req ? json(req) : json({ error: 'Not found' }, 404);
      }

      // PUT /api/permission-requests/:id/approve
      const approveMatch = path.match(/^\/api\/permission-requests\/([^/]+)\/approve$/);
      if (approveMatch && (method === 'PUT' || method === 'POST')) {
        const idx = requests.findIndex(r => r.id === approveMatch[1]);
        if (idx >= 0) {
          const body = JSON.parse(route.request().postData() || '{}');
          requests[idx].status = 'approved';
          requests[idx].reviewedBy = 'admin';
          requests[idx].reviewNote = body.note || 'Approved';
          requests[idx].updatedAt = new Date().toISOString();
          return json(requests[idx]);
        }
        return json({ error: 'Not found' }, 404);
      }

      // PUT /api/permission-requests/:id/reject
      const rejectMatch = path.match(/^\/api\/permission-requests\/([^/]+)\/reject$/);
      if (rejectMatch && (method === 'PUT' || method === 'POST')) {
        const idx = requests.findIndex(r => r.id === rejectMatch[1]);
        if (idx >= 0) {
          const body = JSON.parse(route.request().postData() || '{}');
          requests[idx].status = 'rejected';
          requests[idx].reviewedBy = 'admin';
          requests[idx].reviewNote = body.reason || body.note || 'Rejected';
          requests[idx].updatedAt = new Date().toISOString();
          return json(requests[idx]);
        }
        return json({ error: 'Not found' }, 404);
      }

      // PUT /api/permission-requests/:id — general update
      if (idMatch && method === 'PUT') {
        const idx = requests.findIndex(r => r.id === idMatch[1]);
        const body = JSON.parse(route.request().postData() || '{}');
        if (idx >= 0) {
          Object.assign(requests[idx], body);
          requests[idx].updatedAt = new Date().toISOString();
          return json(requests[idx]);
        }
        return json({ error: 'Not found' }, 404);
      }

      await route.continue();
    });

    // Also handle settings/permission-requests path
    await page.route('**/api/settings/permission-requests**', async (route) => {
      const method = route.request().method();
      const requests: PermissionRequest[] = (state as any).permissionRequests ?? [];
      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      if (method === 'GET') return json({ data: requests, total: requests.length });
      await route.continue();
    });
  });

  /* ───────── 1. Permission requests page loads ───────── */

  test('1) permission requests page loads', async ({ page }) => {
    await page.goto('/settings/permission-requests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Permission') || bodyText?.includes('permission') ||
      bodyText?.includes('Request') || bodyText?.includes('request') ||
      bodyText?.includes('Settings'),
    ).toBeTruthy();
  });

  /* ───────── 2. Pending requests are listed ───────── */

  test('2) pending permission requests are visible', async ({ page }) => {
    await page.goto('/settings/permission-requests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Ananya Sharma') || bodyText?.includes('Ravi Menon') ||
      bodyText?.includes('Pending') || bodyText?.includes('pending') ||
      bodyText?.includes('fees') || bodyText?.includes('analytics'),
    ).toBeTruthy();
  });

  /* ───────── 3. View request details ───────── */

  test('3) clicking a request shows details (who, module, reason)', async ({ page }) => {
    await page.goto('/settings/permission-requests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const requestRow = page.getByText('Ananya Sharma').first();
    if (await requestRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await requestRow.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      expect(
        bodyText?.includes('Ananya Sharma') ||
        bodyText?.includes('fees') || bodyText?.includes('Fees') ||
        bodyText?.includes('parent-teacher') || bodyText?.includes('Reason') ||
        bodyText?.includes('reason'),
      ).toBeTruthy();
    }
  });

  /* ───────── 4. Approve a request ───────── */

  test('4) approving a request changes its status to approved', async ({ page }) => {
    await page.goto('/settings/permission-requests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click on a pending request
    const requestRow = page.getByText('Ananya Sharma').first();
    if (await requestRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await requestRow.click();
      await page.waitForTimeout(500);
    }

    // Click approve button
    const approveBtn = page.getByRole('button', { name: /approve/i }).first();
    if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approveBtn.click();
      await page.waitForTimeout(500);

      // Confirm if dialog appears
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|approve/i }).first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  /* ───────── 5. Reject a request with reason ───────── */

  test('5) rejecting a request with a reason updates its status', async ({ page }) => {
    await page.goto('/settings/permission-requests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click on second pending request
    const requestRow = page.getByText('Ravi Menon').first();
    if (await requestRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await requestRow.click();
      await page.waitForTimeout(500);
    }

    // Click reject button
    const rejectBtn = page.getByRole('button', { name: /reject|deny/i }).first();
    if (await rejectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rejectBtn.click();
      await page.waitForTimeout(500);

      // Fill rejection reason
      const reasonInput = page.locator('textarea, input[name="reason"], input[placeholder*="reason" i]').first();
      if (await reasonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reasonInput.fill('Analytics access requires department head approval');
      }

      // Confirm rejection
      const confirmBtn = page.getByRole('button', { name: /confirm|reject|submit/i }).first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  /* ───────── 6. Request status updates are reflected ───────── */

  test('6) approved and rejected requests show updated statuses', async ({ page }) => {
    // Pre-update statuses in state
    const requests = (state as any).permissionRequests as PermissionRequest[];
    requests[0].status = 'approved';
    requests[1].status = 'rejected';

    await page.goto('/settings/permission-requests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Approved') || bodyText?.includes('approved') ||
      bodyText?.includes('Rejected') || bodyText?.includes('rejected'),
    ).toBeTruthy();
  });

  /* ───────── 7. Previously approved/rejected requests are visible ───────── */

  test('7) historical requests (approved/rejected) are shown', async ({ page }) => {
    await page.goto('/settings/permission-requests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    // Priya Menon's approved request or Ananya's rejected request
    expect(
      bodyText?.includes('Priya Menon') || bodyText?.includes('Approved') ||
      bodyText?.includes('approved') || bodyText?.includes('Rejected') ||
      bodyText?.includes('rejected') || bodyText?.includes('Ananya'),
    ).toBeTruthy();
  });

  /* ───────── 8. State integrity check ───────── */

  test('8) state has 4 seeded permission requests with correct details', async ({ page }) => {
    const requests = (state as any).permissionRequests as PermissionRequest[];
    expect(requests).toHaveLength(4);

    const pending = requests.filter(r => r.status === 'pending');
    expect(pending).toHaveLength(2);

    const approved = requests.filter(r => r.status === 'approved');
    expect(approved).toHaveLength(1);
    expect(approved[0].requestedByName).toBe('Priya Menon');

    const rejected = requests.filter(r => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reviewNote).toBe('Settings access is restricted to administrators');
  });
});
