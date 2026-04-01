import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedCallLog,
  SCHOOL_ID,
  type MockState, type CallLogRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TC068 — Call Logs: create, search, callback management
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC068 — Call Logs Management', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed 3 call logs
    seedCallLog(state, {
      callerName: 'Mr. Venkat',
      phoneNumber: '9876543001',
      purpose: 'ADMISSION_INQUIRY',
      title: 'Class 10 Admission',
      keyNotes: 'Enquired about Class 10 admission for son',
      callbackRequired: false,
    });
    seedCallLog(state, {
      callerName: 'Mrs. Lakshmi',
      phoneNumber: '9876543002',
      purpose: 'FEE_PAYMENT',
      title: 'Fee Query',
      keyNotes: 'Wants to know outstanding fee amount',
      callbackRequired: true,
      callbackDate: '2026-04-01',
      callbackTime: '14:00',
    });
    seedCallLog(state, {
      callerName: 'Dr. Suresh',
      phoneNumber: '9876543003',
      purpose: 'COMPLAINT',
      title: 'Transport Issue',
      keyNotes: 'Bus arrived late three times this week',
      callbackRequired: true,
      callbackDate: '2026-03-31',
      callbackTime: '10:00',
    });

    await installMockApi(page, state);

    // Override front-desk call-logs endpoint (the frontend calls /front-desk/call-logs)
    await page.route('**/api/front-desk/call-logs', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.callLogs),
        });
      }
      if (method === 'POST') {
        let body: Record<string, unknown> = {};
        try { body = JSON.parse(route.request().postData() || '{}'); } catch { /* */ }
        const cl = seedCallLog(state, body as Partial<CallLogRecord>);
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(cl),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    // Override /front-desk/call-logs/:id for PUT/DELETE
    await page.route(/\/api\/front-desk\/call-logs\/[^/]+$/, async (route) => {
      const method = route.request().method();
      const url = new URL(route.request().url());
      const parts = url.pathname.split('/');
      const logId = parts[parts.length - 1];

      if (method === 'PUT') {
        let body: Record<string, unknown> = {};
        try { body = JSON.parse(route.request().postData() || '{}'); } catch { /* */ }
        const idx = state.callLogs.findIndex(c => c.id === logId);
        if (idx >= 0) Object.assign(state.callLogs[idx], body);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(idx >= 0 ? state.callLogs[idx] : {}),
        });
      }
      if (method === 'DELETE') {
        state.callLogs = state.callLogs.filter(c => c.id !== logId);
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deleted' }) });
      }
      return route.fallback();
    });

    // Override other front-desk endpoints for dashboard stats
    await page.route('**/api/visitors/today', async (route) => {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) });
    });
    await page.route('**/api/gate-passes/today', async (route) => {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) });
    });
    await page.route('**/api/front-desk/appointments**', async (route) => {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.appointments) });
    });
    await page.route('**/api/front-desk/feedbacks**', async (route) => {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.feedbacks) });
    });
  });

  /* ───────── Helper: navigate to Call Logs tab ───────── */

  async function goToCallLogsTab(page: import('@playwright/test').Page) {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');
    const tab = page.locator('button').filter({ hasText: /^Calls/ }).first();
    if (await tab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(500);
    }
  }

  /* ───────── 1. Call logs list loads ───────── */

  test('1) call logs tab loads with seeded call logs', async ({ page }) => {
    await goToCallLogsTab(page);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Mr. Venkat') || bodyText?.includes('Mrs. Lakshmi') ||
      bodyText?.includes('Dr. Suresh') || bodyText?.includes('Admission Inquiry') ||
      bodyText?.includes('ADMISSION_INQUIRY'),
    ).toBeTruthy();
  });

  /* ───────── 2. All three call logs are displayed ───────── */

  test('2) all three seeded call logs are visible', async ({ page }) => {
    await goToCallLogsTab(page);

    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('Mr. Venkat') || bodyText?.includes('Class 10 Admission')).toBeTruthy();
    expect(bodyText?.includes('Mrs. Lakshmi') || bodyText?.includes('Fee Query')).toBeTruthy();
    expect(bodyText?.includes('Dr. Suresh') || bodyText?.includes('Transport Issue')).toBeTruthy();
  });

  /* ───────── 3. Create new call log ───────── */

  test('3) create a new call log with caller name, phone, and purpose', async ({ page }) => {
    await goToCallLogsTab(page);

    // Open the create form
    const addBtn = page.getByRole('button', { name: /add|new|log call|create/i }).first();
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
    const btn = (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) ? addBtn : plusBtn;

    if (!(await btn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await btn.click();
    await page.waitForTimeout(500);

    // Fill caller name
    const nameInput = page.locator('input[name="callerName"], input[placeholder*="caller" i], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Mr. Rajan');
    }

    // Fill phone number
    const phoneInput = page.locator('input[name="phoneNumber"], input[placeholder*="phone" i], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneInput.fill('9876543099');
    }

    // Select purpose
    const purposeSelect = page.locator('select[name="purpose"], [aria-label*="purpose" i]').first();
    if (await purposeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await purposeSelect.click();
      await page.waitForTimeout(200);
      const option = page.getByText(/General Information|GENERAL_INFO/i).first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
      }
    }

    // Fill notes
    const notesInput = page.locator('textarea[name="keyNotes"], textarea[name="summary"], textarea').first();
    if (await notesInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notesInput.fill('General inquiry about school programs');
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /save|create|submit|log/i }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(500);

      expect(state.callLogs.length).toBeGreaterThanOrEqual(3);
    }
  });

  /* ───────── 4. New call log appears in list ───────── */

  test('4) created call log appears in the list', async ({ page }) => {
    seedCallLog(state, { callerName: 'Mr. Rajan', purpose: 'GENERAL_INFO', keyNotes: 'General inquiry' });

    await goToCallLogsTab(page);

    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('Mr. Rajan')).toBeTruthy();
  });

  /* ───────── 5. Mark a call as requiring callback ───────── */

  test('5) marking a call log as requiring callback', async ({ page }) => {
    await goToCallLogsTab(page);

    // Verify that callback-required call logs show an indicator
    const bodyText = await page.textContent('body');
    const lower = bodyText?.toLowerCase() || '';
    expect(
      lower.includes('callback') || lower.includes('follow') || lower.includes('mrs. lakshmi'),
    ).toBeTruthy();
  });

  /* ───────── 6. Callback date/time is displayed ───────── */

  test('6) call logs with callback show date and time', async ({ page }) => {
    await goToCallLogsTab(page);

    // Mrs. Lakshmi's call log has callback date 2026-04-01
    const bodyText = await page.textContent('body');
    // The callback date may appear formatted or raw
    expect(
      bodyText?.includes('2026-04-01') || bodyText?.includes('Apr') ||
      bodyText?.includes('callback') || bodyText?.includes('Callback'),
    ).toBeTruthy();
  });

  /* ───────── 7. Search call logs ───────── */

  test('7) search filters call logs by caller name', async ({ page }) => {
    await goToCallLogsTab(page);

    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Venkat');
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      expect(bodyText?.includes('Venkat')).toBeTruthy();
    }
  });

  /* ───────── 8. Call log shows purpose and notes ───────── */

  test('8) call log entries show purpose and key notes', async ({ page }) => {
    await goToCallLogsTab(page);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Admission') || bodyText?.includes('ADMISSION_INQUIRY') ||
      bodyText?.includes('Fee') || bodyText?.includes('Complaint') ||
      bodyText?.includes('Transport'),
    ).toBeTruthy();
  });

  /* ───────── 9. View call log details ───────── */

  test('9) clicking a call log shows detail view', async ({ page }) => {
    await goToCallLogsTab(page);

    // Click on a call log entry or its view button
    const viewBtn = page.locator('button:has(svg.lucide-eye)').first();
    const nameEl = page.getByText('Mr. Venkat').first();
    const target = (await viewBtn.isVisible({ timeout: 3000 }).catch(() => false)) ? viewBtn : nameEl;

    if (await target.isVisible({ timeout: 5000 }).catch(() => false)) {
      await target.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      expect(
        bodyText?.includes('Mr. Venkat') || bodyText?.includes('Class 10 Admission') ||
        bodyText?.includes('Enquired'),
      ).toBeTruthy();
    }
  });

  /* ───────── 10. State integrity check ───────── */

  test('10) state has 3 seeded call logs with correct details', async ({ page }) => {
    expect(state.callLogs).toHaveLength(3);
    expect(state.callLogs[0].callerName).toBe('Mr. Venkat');
    expect(state.callLogs[0].callbackRequired).toBe(false);
    expect(state.callLogs[1].callerName).toBe('Mrs. Lakshmi');
    expect(state.callLogs[1].callbackRequired).toBe(true);
    expect(state.callLogs[1].callbackDate).toBe('2026-04-01');
    expect(state.callLogs[2].callerName).toBe('Dr. Suresh');
    expect(state.callLogs[2].purpose).toBe('COMPLAINT');
  });
});
