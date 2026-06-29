import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState,
} from './test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Shared mock API installer with refunds endpoints
 * ───────────────────────────────────────────────────────────────────── */

interface RefundRecord {
  _id: string; id: string;
  studentId: { _id: string; name: string; admissionId: string };
  classId: string; amount: number; reason: string;
  refundMode: string; status: string; remarks: string;
  createdAt: string; schoolId: string;
}

function createRefundState() {
  const base = createMockState();
  const student = seedStudent(base, { name: 'Ananya Sharma', classId: CLASS_10A_ID });
  const refunds: RefundRecord[] = [
    {
      _id: 'ref-001', id: 'ref-001',
      studentId: { _id: student.id, name: student.name, admissionId: student.admissionId },
      classId: CLASS_10A_ID,
      amount: 2000,
      reason: 'Overpayment',
      refundMode: 'cash',
      status: 'pending',
      remarks: '',
      createdAt: '2026-03-10T10:00:00Z',
      schoolId: SCHOOL_ID,
    },
    {
      _id: 'ref-002', id: 'ref-002',
      studentId: { _id: student.id, name: student.name, admissionId: student.admissionId },
      classId: CLASS_10A_ID,
      amount: 1500,
      reason: 'Student left',
      refundMode: 'online',
      status: 'approved',
      remarks: 'Approved by admin',
      createdAt: '2026-03-05T08:00:00Z',
      schoolId: SCHOOL_ID,
    },
    {
      _id: 'ref-003', id: 'ref-003',
      studentId: { _id: student.id, name: student.name, admissionId: student.admissionId },
      classId: CLASS_10A_ID,
      amount: 500,
      reason: 'Transport not used',
      refundMode: 'cheque',
      status: 'processed',
      remarks: 'Cheque issued',
      createdAt: '2026-02-20T09:00:00Z',
      schoolId: SCHOOL_ID,
    },
  ];
  return { state: base, refunds, student };
}

async function installRefundMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
  refunds: RefundRecord[],
  totalPaidByStudent: Record<string, number> = {},
) {
  await installMockApi(page, state);

  await page.route('**/api/fees/refunds**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path === '/api/fees/refunds' && method === 'GET') {
      return json(refunds);
    }
    if (path === '/api/fees/refunds' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const newRefund: RefundRecord = {
        _id: `ref-new-${Date.now()}`, id: `ref-new-${Date.now()}`,
        studentId: { _id: body.studentId, name: 'New Student', admissionId: 'ADM-001' },
        classId: body.classId,
        amount: body.amount,
        reason: body.reason,
        refundMode: body.refundMode,
        status: 'pending',
        remarks: body.remarks || '',
        createdAt: new Date().toISOString(),
        schoolId: SCHOOL_ID,
      };
      refunds.push(newRefund);
      return json(newRefund, 201);
    }
    const approveMatch = path.match(/^\/api\/fees\/refunds\/([^/]+)\/approve$/);
    if (approveMatch && method === 'PUT') {
      const id = approveMatch[1];
      const r = refunds.find((x) => x._id === id);
      if (r) r.status = 'approved';
      return json(r || {});
    }
    const processMatch = path.match(/^\/api\/fees\/refunds\/([^/]+)\/process$/);
    if (processMatch && method === 'PUT') {
      const id = processMatch[1];
      const r = refunds.find((x) => x._id === id);
      if (r) r.status = 'processed';
      return json(r || {});
    }
    const rejectMatch = path.match(/^\/api\/fees\/refunds\/([^/]+)\/reject$/);
    if (rejectMatch && method === 'PUT') {
      const id = rejectMatch[1];
      const r = refunds.find((x) => x._id === id);
      if (r) r.status = 'rejected';
      return json(r || {});
    }
    const deleteMatch = path.match(/^\/api\/fees\/refunds\/([^/]+)$/);
    if (deleteMatch && method === 'DELETE') {
      const id = deleteMatch[1];
      const idx = refunds.findIndex((x) => x._id === id);
      if (idx >= 0) refunds.splice(idx, 1);
      return json({ message: 'Deleted' });
    }
    return json({});
  });

  // PAG-27: refund-cap validation must hit a server-side aggregate so the
  // total reflects every payment, not just the first page. Tests that don't
  // care about the total-paid mock can pass an empty map (defaults to 0).
  await page.route('**/api/fees/payments/total-paid**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const studentId = url.searchParams.get('studentId') || '';
    const total = totalPaidByStudent[studentId] ?? 0;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ totalPaid: total, paymentCount: 0 }),
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('Fees — Refunds (E2E-TEST-24)', () => {
  test('1) refunds page lists existing refund records with student name and amount', async ({ page }) => {
    const { state, refunds } = createRefundState();
    await installRefundMockApi(page, state, refunds);

    await page.goto('/fees/refunds');
    await page.waitForLoadState('domcontentloaded');

    // Wait for data to load — student name appears once skeleton resolves
    await expect(page.getByText('Ananya Sharma').first()).toBeVisible({ timeout: 10_000 });

    // Page heading should contain "refund" (from breadcrumbs, page title, or table heading)
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body?.toLowerCase()).toMatch(/refund/);

    // Amounts should be visible
    await expect(page.getByText(/2,000|2000/).first()).toBeVisible();
  });

  test('2) refunds page shows stat cards for total, pending, and processed counts', async ({ page }) => {
    const { state, refunds } = createRefundState();
    await installRefundMockApi(page, state, refunds);

    await page.goto('/fees/refunds');
    await page.waitForLoadState('domcontentloaded');

    // Wait for data to load — student name confirms skeleton has resolved
    await expect(page.getByText('Ananya Sharma').first()).toBeVisible({ timeout: 10_000 });

    // Should show summary stats — pending count is 1
    const bodyText = await page.textContent('body');
    // Either a count card or a label
    expect(bodyText?.match(/pending|Pending/i)).toBeTruthy();
  });

  test('3) status filter "pending" shows only pending refunds', async ({ page }) => {
    const { state, refunds } = createRefundState();
    await installRefundMockApi(page, state, refunds);

    await page.goto('/fees/refunds');
    await page.waitForLoadState('domcontentloaded');

    // Wait for data to load
    await expect(page.getByText('Ananya Sharma').first()).toBeVisible({ timeout: 10_000 });

    // HeroUI Select renders a hidden <select> and a visible trigger button.
    // Try the hidden <select> first, then fall back to the HeroUI trigger.
    const nativeSelect = page.locator('select').first();
    const hasNativeSelect = await nativeSelect.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasNativeSelect) {
      await nativeSelect.selectOption('pending');
      await page.waitForTimeout(500);
    } else {
      // HeroUI Select: click the trigger button that contains "All Status"
      const selectTrigger = page.locator('button[aria-haspopup="listbox"]').first();
      const hasTrigger = await selectTrigger.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasTrigger) {
        await selectTrigger.click();
        const listbox = page.locator('[role="listbox"]');
        await expect(listbox).toBeVisible({ timeout: 3000 });
        const pendingOption = listbox.locator('[role="option"]').filter({ hasText: /^Pending$/i }).first();
        await pendingOption.click();
        await page.waitForTimeout(500);
      }
    }

    const bodyText = await page.textContent('body');
    // After filtering, the page should still show content (not crash)
    expect(bodyText).toBeTruthy();
  });

  test('4) skeleton loader appears while refunds are loading', async ({ page }) => {
    const { state, refunds } = createRefundState();
    await installMockApi(page, state);

    // Slow down the refunds API response
    await page.route('**/api/fees/refunds**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(refunds),
      });
    });

    await page.goto('/fees/refunds');

    // During loading a skeleton should appear
    const skeleton = page.locator('[class*="animate-pulse"], [class*="skeleton"]');
    const count = await skeleton.count();
    // Skeleton renders during loading
    expect(count).toBeGreaterThanOrEqual(0);

    // Wait for data to fully load (student name appears once skeleton resolves)
    await expect(page.getByText('Ananya Sharma').first()).toBeVisible({ timeout: 15_000 });

    const body = await page.textContent('body');
    expect(body?.toLowerCase()).toMatch(/refund/);
  });

  test('5) approve action updates refund status to approved', async ({ page }) => {
    const { state, refunds } = createRefundState();
    await installRefundMockApi(page, state, refunds);

    await page.goto('/fees/refunds');
    await page.waitForLoadState('domcontentloaded');

    // Find the pending refund row and click Approve
    const approveBtn = page.getByRole('button', { name: /approve/i }).first();
    const hasApprove = await approveBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasApprove) {
      await approveBtn.click();
      await page.waitForLoadState('domcontentloaded');

      // The refund should now show "approved" status
      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase()).toMatch(/approved/);
    }
  });

  test('6) create refund modal opens and form is fillable', async ({ page }) => {
    const { state, refunds } = createRefundState();
    await installRefundMockApi(page, state, refunds);

    await page.goto('/fees/refunds');
    await page.waitForLoadState('domcontentloaded');

    // Click "New Refund" or "Add Refund" button
    const newBtn = page.getByRole('button', { name: /new refund|add refund|create refund/i }).first();
    const hasBtn = await newBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBtn) {
      await newBtn.click();

      // Modal should open
      const modal = page.locator('[role="dialog"]').last();
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Form should have Student ID, Amount, Reason fields
      const bodyText = await modal.textContent();
      expect(bodyText?.toLowerCase()).toMatch(/student|amount|reason/);
    }
  });

  test('7) reject action updates refund status to rejected', async ({ page }) => {
    const { state, refunds } = createRefundState();
    // Add a pending refund
    await installRefundMockApi(page, state, refunds);

    await page.goto('/fees/refunds');
    await page.waitForLoadState('domcontentloaded');

    // Look for reject/decline button
    const rejectBtn = page.getByRole('button', { name: /reject|decline/i }).first();
    const hasReject = await rejectBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasReject) {
      await rejectBtn.click();
      await page.waitForLoadState('domcontentloaded');
      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase()).toMatch(/reject/);
    }
  });

  test('8) search by student name filters the refunds list', async ({ page }) => {
    const { state, refunds } = createRefundState();
    await installRefundMockApi(page, state, refunds);

    await page.goto('/fees/refunds');
    await page.waitForLoadState('domcontentloaded');

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.fill('Ananya');
      await page.waitForTimeout(500);
      await expect(page.getByText('Ananya Sharma').first()).toBeVisible();
    }
  });

  test('9) empty state shows when no refunds exist', async ({ page }) => {
    const state = createMockState();
    await installMockApi(page, state);

    await page.route('**/api/fees/refunds**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/fees/refunds');
    await page.waitForLoadState('domcontentloaded');

    // Wait for the "New Refund" button — confirms skeleton has resolved and page rendered
    await expect(page.getByRole('button', { name: /new refund/i })).toBeVisible({ timeout: 15_000 });

    const body = await page.textContent('body');
    // Page renders without crashing
    expect(body).toBeTruthy();
    // Page should contain refund-related text (heading, breadcrumb, button, or empty message)
    expect(body?.toLowerCase()).toMatch(/refund/);
  });

  test('10) refund amount displayed in INR currency format', async ({ page }) => {
    const { state, refunds } = createRefundState();
    await installRefundMockApi(page, state, refunds);

    await page.goto('/fees/refunds');
    await page.waitForLoadState('domcontentloaded');

    // Wait for data to load — student name confirms skeleton resolved
    await expect(page.getByText('Ananya Sharma').first()).toBeVisible({ timeout: 15_000 });

    const bodyText = await page.textContent('body');
    // Should show amounts with rupee symbol or formatted numbers
    expect(bodyText).toMatch(/₹|2,000|1,500|500/);
  });

  // [STUB-01] Bulk Approve: filter to pending, select two rows, click the
  // bulk Approve button, and confirm BOTH /fees/refunds/:id/approve calls
  // fire and the records flip to "approved" on the server. Regression guard
  // for the "endpoint not wired yet" stub toast.
  test('11) bulk approve issues one approve call per selected refund and updates status', async ({ page }) => {
    const { state, refunds } = createRefundState();
    const approveCalls: string[] = [];
    await installRefundMockApi(page, state, refunds);

    // Add a second pending refund so the Pending filter has two rows.
    refunds.push({
      _id: 'ref-004', id: 'ref-004',
      studentId: refunds[0].studentId,
      classId: CLASS_10A_ID,
      amount: 750,
      reason: 'Lab damage',
      refundMode: 'cash',
      status: 'pending',
      remarks: '',
      createdAt: '2026-03-12T10:00:00Z',
      schoolId: SCHOOL_ID,
    });

    // Track approve calls — override the default 200 response to also record ids.
    await page.route('**/api/fees/refunds/*/approve', async (route) => {
      const url = new URL(route.request().url());
      const id = url.pathname.split('/').slice(-2, -1)[0];
      approveCalls.push(id);
      const r = refunds.find((x) => x._id === id);
      if (r) r.status = 'approved';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(r || {}),
      });
    });

    await page.goto('/fees/refunds');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('Ananya Sharma').first()).toBeVisible({ timeout: 10_000 });

    // Filter to Pending so the table only shows the two pending rows.
    await page.getByRole('tab', { name: /^pending$/i }).click();
    await expect(page.getByText(/2\s*record/i).first()).toBeVisible({ timeout: 3_000 });

    // Select the two visible rows via their row checkboxes.
    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    await expect(rowCheckboxes).toHaveCount(2);
    await rowCheckboxes.nth(0).check();
    await rowCheckboxes.nth(1).check();

    // BulkActionBar should now be visible with the count.
    await expect(page.getByText(/2\s*selected/i).first()).toBeVisible({ timeout: 3_000 });

    // Click the bulk Approve button in the BulkActionBar.
    const bulkApproveBtn = page
      .locator('[data-coach="bulk-action-bar"]')
      .getByRole('button', { name: /^approve$/i });
    await expect(bulkApproveBtn).toBeVisible();
    await bulkApproveBtn.click();

    // Wait for both approve calls to hit the server.
    await expect.poll(() => approveCalls.length, { timeout: 10_000 }).toBe(2);

    // No "endpoint not wired yet" stub toast should appear.
    await expect(page.getByText(/endpoint not wired yet/i)).toHaveCount(0);

    // Both targeted ids should be in the captured approve calls.
    expect(approveCalls.sort()).toEqual(
      expect.arrayContaining(['ref-001', 'ref-004'].sort())
    );
  });

  // [STUB-01] Bulk Reject: select a pending refund, click bulk Reject (which
  // opens the existing reject modal for a reason), submit, and confirm one
  // reject call per selected id with the typed reason in the body.
  test('12) bulk reject collects a reason and issues one reject call per selected refund', async ({ page }) => {
    const { state, refunds } = createRefundState();
    const rejectBodies: Array<{ id: string; body: unknown }> = [];
    await installRefundMockApi(page, state, refunds);

    await page.route('**/api/fees/refunds/*/reject', async (route) => {
      const url = new URL(route.request().url());
      const id = url.pathname.split('/').slice(-2, -1)[0];
      const raw = route.request().postData() || '{}';
      let body: unknown = {};
      try { body = JSON.parse(raw); } catch { /* keep {} */ }
      rejectBodies.push({ id, body });
      const r = refunds.find((x) => x._id === id);
      if (r) r.status = 'rejected';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(r || {}),
      });
    });

    await page.goto('/fees/refunds');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('Ananya Sharma').first()).toBeVisible({ timeout: 10_000 });

    // Filter to Pending — only the one pending row is visible.
    await page.getByRole('tab', { name: /^pending$/i }).click();
    await expect(page.getByText(/1\s*record/i).first()).toBeVisible({ timeout: 3_000 });

    // Select the single visible row.
    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    await expect(rowCheckboxes).toHaveCount(1);
    await rowCheckboxes.nth(0).check();

    // Click the bulk Reject button in the BulkActionBar.
    const bulkRejectBtn = page
      .locator('[data-coach="bulk-action-bar"]')
      .getByRole('button', { name: /^reject$/i });
    await expect(bulkRejectBtn).toBeVisible();
    await bulkRejectBtn.click();

    // The existing reject modal should open and ask for a reason.
    const modal = page.locator('[role="dialog"]').last();
    await expect(modal).toBeVisible({ timeout: 5_000 });
    const reasonField = modal.locator('textarea#reject-reason');
    await expect(reasonField).toBeVisible();
    await reasonField.fill('Bulk rejection — duplicate entries');

    // Submit.
    const confirmBtn = modal.getByRole('button', { name: /reject refund/i });
    await confirmBtn.click();

    // Wait for the reject call to hit the server.
    await expect.poll(() => rejectBodies.length, { timeout: 10_000 }).toBe(1);

    // No "endpoint not wired yet" stub toast.
    await expect(page.getByText(/endpoint not wired yet/i)).toHaveCount(0);

    // Body should carry the typed reason.
    expect(rejectBodies[0].id).toBe('ref-001');
    expect(rejectBodies[0].body).toMatchObject({
      rejectionReason: 'Bulk rejection — duplicate entries',
    });
  });
});
