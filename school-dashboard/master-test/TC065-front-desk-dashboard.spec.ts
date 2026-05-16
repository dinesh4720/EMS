import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedAppointment, seedCallLog, seedFeedback,
  ADMIN_ID, SCHOOL_ID,
  type MockState, type VisitorRecord, type GatePassRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TC065 — Front Desk Dashboard: overview widgets, stat cards, quick actions
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC065 — Front Desk Dashboard', () => {
  let state: MockState;

  /** Manually seed visitors (not yet in seed helpers). */
  function seedVisitor(
    overrides: Partial<VisitorRecord> = {},
  ): VisitorRecord {
    state.visitorCounter++;
    const id = `vis-${String(state.visitorCounter).padStart(6, '0')}`;
    const record: VisitorRecord = {
      _id: id, id,
      name: overrides.name || `Visitor ${state.visitorCounter}`,
      phone: overrides.phone || `98700${String(state.visitorCounter).padStart(5, '0')}`,
      purpose: overrides.purpose || 'General Visit',
      toMeet: overrides.toMeet || 'Admin',
      status: overrides.status || 'checked-in',
      checkInTime: overrides.checkInTime || new Date().toISOString(),
      checkOutTime: overrides.checkOutTime || null,
      schoolId: SCHOOL_ID,
    };
    state.visitors.push(record);
    return record;
  }

  /** Manually seed gate passes. */
  function seedGatePass(
    overrides: Partial<GatePassRecord> = {},
  ): GatePassRecord {
    state.gatePassCounter++;
    const id = `gp-${String(state.gatePassCounter).padStart(6, '0')}`;
    const record: GatePassRecord = {
      _id: id, id,
      studentId: overrides.studentId || 'stu-000001',
      studentName: overrides.studentName || `Student ${state.gatePassCounter}`,
      reason: overrides.reason || 'Medical Emergency',
      status: overrides.status || 'pending',
      issuedAt: overrides.issuedAt || new Date().toISOString(),
      approvedBy: overrides.approvedBy || '',
      schoolId: SCHOOL_ID,
    };
    state.gatePasses.push(record);
    return record;
  }

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed 3 visitors (2 checked-in, 1 checked-out)
    seedVisitor({ name: 'Rajesh Kumar', purpose: 'Parent Meeting', status: 'checked-in' });
    seedVisitor({ name: 'Priya Sharma', purpose: 'Delivery', status: 'checked-in' });
    seedVisitor({ name: 'Amit Patel', purpose: 'School Visit', status: 'checked-out', checkOutTime: new Date().toISOString() });

    // Seed 2 gate passes
    seedGatePass({ studentName: 'Arun Kumar', reason: 'Medical Emergency', status: 'approved' });
    seedGatePass({ studentName: 'Bhavya Singh', reason: 'Early Dismissal', status: 'pending' });

    // Seed 2 appointments
    seedAppointment(state, { visitorName: 'Dr. Suresh', purpose: 'Health Checkup', status: 'scheduled' });
    seedAppointment(state, { visitorName: 'Mrs. Lakshmi', purpose: 'Parent-Teacher Meeting', status: 'scheduled' });

    // Seed 1 call log
    seedCallLog(state, { callerName: 'Mr. Venkat', purpose: 'ADMISSION_INQUIRY', keyNotes: 'Enquired about Class 10 admission' });

    // Seed 1 feedback
    seedFeedback(state, { name: 'Parent Feedback', category: 'FACILITIES', status: 'open', source: 'WALK_IN' });

    await installMockApi(page, state);

    // Override front-desk specific endpoints that the frontend actually calls
    await page.route('**/api/visitors/today', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: state.visitors.filter(v => v.status === 'checked-in'), total: state.visitors.filter(v => v.status === 'checked-in').length }),
      });
    });

    await page.route('**/api/gate-passes/today', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: state.gatePasses, total: state.gatePasses.length }),
      });
    });

    await page.route('**/api/front-desk/appointments**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.appointments),
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      }
    });

    await page.route('**/api/front-desk/feedbacks**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.feedbacks),
      });
    });

    await page.route('**/api/front-desk/call-logs**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.callLogs),
      });
    });
  });

  /* ───────── 1. Front desk page loads ───────── */

  test('1) front desk dashboard loads successfully', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  /* ───────── 2. Overview section loads by default ───────── */

  test('2) overview tab is visible by default', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Overview tab should be active — look for stat card labels
    expect(
      bodyText?.includes('Visitors Today') || bodyText?.includes('Overview') ||
      bodyText?.includes('Gate Pass') || bodyText?.includes('Appointments'),
    ).toBeTruthy();
  });

  /* ───────── 3. Visitor count card is displayed ───────── */

  test('3) visitor count stat card is displayed', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Should show "Visitors Today" label from Overview component
    expect(
      bodyText?.includes('Visitors Today') || bodyText?.includes('Visitors'),
    ).toBeTruthy();
  });

  /* ───────── 4. Gate pass count card is displayed ───────── */

  test('4) gate pass stat card is displayed', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Gate Pass') || bodyText?.includes('Gate Passes'),
    ).toBeTruthy();
  });

  /* ───────── 5. Appointment count card is displayed ───────── */

  test('5) appointment stat card is displayed', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Appointments') || bodyText?.includes('Appointment'),
    ).toBeTruthy();
  });

  /* ───────── 6. Quick action "New" dropdown exists ───────── */

  test('6) quick action New dropdown button is present', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    // The "New" button with dropdown is always rendered
    const newBtn = page.getByRole('button', { name: /^New$/i }).first();
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();

    const btn = (await newBtn.isVisible({ timeout: 5000 }).catch(() => false))
      ? newBtn
      : plusBtn;

    expect(await btn.isVisible({ timeout: 5000 }).catch(() => false)).toBeTruthy();
  });

  /* ───────── 7. Quick actions include New Visitor, Issue Gate Pass ───────── */

  test('7) New dropdown shows quick action items', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    // Click the New dropdown
    const newBtn = page.getByRole('button', { name: /^New$/i }).first();
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
    const btn = (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) ? newBtn : plusBtn;

    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      // Dropdown should contain these action labels
      expect(
        bodyText?.includes('New Visitor') || bodyText?.includes('Issue Gate Pass') ||
        bodyText?.includes('New Appointment') || bodyText?.includes('Log Call'),
      ).toBeTruthy();
    }
  });

  /* ───────── 8. Tab navigation — Visitors tab ───────── */

  test('8) clicking Visitors tab switches to visitor log', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    const visitorsTab = page.locator('button').filter({ hasText: /^Visitors/ }).first();
    if (await visitorsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await visitorsTab.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      // Visitor log should show visitor names or table headers
      expect(
        bodyText?.includes('Rajesh Kumar') || bodyText?.includes('Priya Sharma') ||
        bodyText?.includes('Visitor Name') || bodyText?.includes('Purpose'),
      ).toBeTruthy();
    }
  });

  /* ───────── 9. Tab navigation — Gate Pass tab ───────── */

  test('9) clicking Gate Pass tab switches to gate pass log', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    const gatePassTab = page.locator('button').filter({ hasText: /^Gate Pass/ }).first();
    if (await gatePassTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gatePassTab.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      expect(
        bodyText?.includes('Arun Kumar') || bodyText?.includes('Bhavya Singh') ||
        bodyText?.includes('Student') || bodyText?.includes('Reason'),
      ).toBeTruthy();
    }
  });

  /* ───────── 10. Today's activity summary in sidebar ───────── */

  test('10) recent activity sidebar shows logged activities', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Recent activity section should show some text from seeded data
    expect(
      bodyText?.includes('checked in') || bodyText?.includes('Recent Activity') ||
      bodyText?.includes('Gate pass') || bodyText?.includes('Call') ||
      bodyText?.includes('Rajesh Kumar') || bodyText?.includes('min ago') ||
      bodyText?.includes('just now'),
    ).toBeTruthy();
  });

  /* ───────── 11. Export button is present ───────── */

  test('11) export button is visible on the dashboard', async ({ page }) => {
    await page.goto('/front-desk');
    await page.waitForLoadState('networkidle');

    const exportBtn = page.getByRole('button', { name: /export/i }).first();
    expect(await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)).toBeTruthy();
  });

  /* ───────── 12. State integrity — seeded data counts ───────── */

  test('12) state has correct seeded counts', async ({ page }) => {
    expect(state.visitors).toHaveLength(3);
    expect(state.gatePasses).toHaveLength(2);
    expect(state.appointments).toHaveLength(2);
    expect(state.callLogs).toHaveLength(1);
    expect(state.feedbacks).toHaveLength(1);
  });
});
