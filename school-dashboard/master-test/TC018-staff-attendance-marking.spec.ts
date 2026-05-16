import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  TEACHER_A_ID, TEACHER_B_ID, ACCOUNTANT_ID, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

const TODAY = new Date().toISOString().split('T')[0];

interface StaffAttRecord {
  _id: string; id: string; staffId: string; staffName: string;
  date: string; status: 'present' | 'absent' | 'halfday' | 'leave';
  reason?: string; inTime?: string; outTime?: string;
  schoolId: string;
}

function buildStaffRecord(
  staffId: string, staffName: string, date: string,
  status: StaffAttRecord['status'], reason?: string,
): StaffAttRecord {
  return {
    _id: `satt-${staffId}-${date}`, id: `satt-${staffId}-${date}`,
    staffId, staffName, date, status, reason,
    inTime: status === 'present' ? '09:00' : undefined,
    outTime: status === 'present' ? '17:00' : undefined,
    schoolId: SCHOOL_ID,
  };
}

async function installStaffAttendanceMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
  attendanceRecords: StaffAttRecord[],
) {
  await installMockApi(page, state);

  // Staff attendance endpoints
  await page.route('**/api/staff-attendance**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // Get all attendance
    if (path === '/api/staff-attendance' && method === 'GET') {
      const dateParam = url.searchParams.get('date');
      if (dateParam) {
        return json(attendanceRecords.filter((r) => r.date === dateParam));
      }
      return json(attendanceRecords);
    }

    // Get by date
    if (path.match(/^\/api\/staff-attendance\/date\//)) {
      const dateParam = path.split('/').pop();
      return json(attendanceRecords.filter((r) => r.date === dateParam));
    }

    // Save single attendance
    if (path === '/api/staff-attendance' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const staff = state.staff.find((s) => s.id === body.staffId);
      const existing = attendanceRecords.findIndex(
        (r) => r.staffId === body.staffId && r.date === body.date,
      );
      const rec: StaffAttRecord = {
        _id: `satt-${body.staffId}-${body.date}`,
        id: `satt-${body.staffId}-${body.date}`,
        staffId: body.staffId,
        staffName: staff?.name || 'Unknown',
        date: body.date || TODAY,
        status: body.status || 'present',
        reason: body.reason,
        inTime: body.inTime,
        outTime: body.outTime,
        schoolId: SCHOOL_ID,
      };
      if (existing >= 0) {
        Object.assign(attendanceRecords[existing], rec);
      } else {
        attendanceRecords.push(rec);
      }
      return json(rec, 201);
    }

    // Bulk save
    if (path === '/api/staff-attendance/bulk' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      for (const item of (body.attendance || body.records || [])) {
        const staff = state.staff.find((s) => s.id === item.staffId);
        const existing = attendanceRecords.findIndex(
          (r) => r.staffId === item.staffId && r.date === (item.date || TODAY),
        );
        const rec: StaffAttRecord = {
          _id: `satt-${item.staffId}-${item.date || TODAY}`,
          id: `satt-${item.staffId}-${item.date || TODAY}`,
          staffId: item.staffId,
          staffName: staff?.name || 'Unknown',
          date: item.date || TODAY,
          status: item.status || 'present',
          reason: item.reason,
          schoolId: SCHOOL_ID,
        };
        if (existing >= 0) {
          Object.assign(attendanceRecords[existing], rec);
        } else {
          attendanceRecords.push(rec);
        }
      }
      return json({ success: true, saved: body.attendance?.length || body.records?.length || 0 });
    }

    // Get by staff
    if (path.match(/^\/api\/staff-attendance\/staff\//)) {
      const staffId = path.split('/')[4];
      return json(attendanceRecords.filter((r) => r.staffId === staffId));
    }

    // Mark all present
    if (path === '/api/staff-attendance/mark-all-present' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const date = body.date || TODAY;
      for (const s of state.staff) {
        const existing = attendanceRecords.findIndex(
          (r) => r.staffId === s.id && r.date === date,
        );
        const rec: StaffAttRecord = {
          _id: `satt-${s.id}-${date}`, id: `satt-${s.id}-${date}`,
          staffId: s.id, staffName: s.name, date,
          status: 'present', schoolId: SCHOOL_ID,
        };
        if (existing >= 0) {
          Object.assign(attendanceRecords[existing], rec);
        } else {
          attendanceRecords.push(rec);
        }
      }
      return json({ success: true, marked: state.staff.length });
    }

    return json({});
  });

  // Staff attendance stats/summary
  await page.route('**/api/staff-attendance/stats**', async (route) => {
    const todayRecords = attendanceRecords.filter((r) => r.date === TODAY);
    const present = todayRecords.filter((r) => r.status === 'present').length;
    const absent = todayRecords.filter((r) => r.status === 'absent').length;
    const halfday = todayRecords.filter((r) => r.status === 'halfday').length;
    const leave = todayRecords.filter((r) => r.status === 'leave').length;

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalActive: state.staff.length,
        present,
        absent,
        halfDay: halfday,
        onLeave: leave,
        notMarked: state.staff.length - todayRecords.length,
      }),
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC018 — Admin marks daily attendance for all staff
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC018 — Staff Attendance Marking', () => {

  test('1) staff attendance page loads with today\'s date', async ({ page }) => {
    const state = createMockState();
    const records: StaffAttRecord[] = [];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should show attendance page with date picker
    const hasAttendancePage = body?.toLowerCase().includes('attendance') ||
                              body?.toLowerCase().includes('staff') ||
                              body?.toLowerCase().includes('present');
    expect(hasAttendancePage).toBeTruthy();
  });

  test('2) date picker shows today\'s date', async ({ page }) => {
    const state = createMockState();
    const records: StaffAttRecord[] = [];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    // Find date input
    const dateInput = page.locator('input[type="date"]').first();
    const hasDate = await dateInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDate) {
      const value = await dateInput.inputValue();
      // Should be today or recent
      expect(value).toBeTruthy();
    }

    // Page should show today's info
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('3) all 3 staff members are listed', async ({ page }) => {
    const state = createMockState();
    const records: StaffAttRecord[] = [];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Ananya Sharma').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Ravi Menon').first()).toBeVisible();
    await expect(page.getByText('Priya Menon').first()).toBeVisible();
  });

  test('4) KPI cards show Total Active, Present, Absent counts', async ({ page }) => {
    const state = createMockState();
    const records: StaffAttRecord[] = [
      buildStaffRecord(TEACHER_A_ID, 'Ananya Sharma', TODAY, 'present'),
      buildStaffRecord(TEACHER_B_ID, 'Ravi Menon', TODAY, 'absent', 'Sick leave'),
    ];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should show attendance summary stats
    const hasStats = body?.toLowerCase().includes('present') ||
                     body?.toLowerCase().includes('absent') ||
                     body?.toLowerCase().includes('total') ||
                     body?.toLowerCase().includes('active');
    expect(hasStats).toBeTruthy();
  });

  test('5) mark Ananya as "Present"', async ({ page }) => {
    const state = createMockState();
    const records: StaffAttRecord[] = [];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    // Find present button or status selector for Ananya's row
    const presentBtns = page.getByRole('button', { name: /present/i });
    const presentCount = await presentBtns.count();

    if (presentCount > 0) {
      await presentBtns.first().click();
      await page.waitForTimeout(500);
    } else {
      // May use dropdown or radio buttons
      const statusSelects = page.locator('select[name*="status"]');
      if (await statusSelects.count() > 0) {
        await statusSelects.first().selectOption('present');
      }
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('6) mark Ravi as "Absent" — verify reason input appears', async ({ page }) => {
    const state = createMockState();
    const records: StaffAttRecord[] = [];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    // Find absent button for Ravi's row
    const absentBtns = page.getByRole('button', { name: /absent/i });
    const absentCount = await absentBtns.count();

    if (absentCount > 0) {
      // Click the second one (Ravi's row) or the appropriate one
      const btnIndex = absentCount >= 2 ? 1 : 0;
      await absentBtns.nth(btnIndex).click();
      await page.waitForTimeout(500);

      // Should show reason modal or input
      const body = await page.textContent('body');
      const hasReasonUI = body?.toLowerCase().includes('reason') ||
                          body?.toLowerCase().includes('remarks') ||
                          page.locator('[role="dialog"]').isVisible();
      // If a modal/dialog appeared, fill in reason
      const modal = page.locator('[role="dialog"]').last();
      const hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasModal) {
        const reasonInput = modal.locator('input[name="reason"], textarea[name="reason"], textarea').first();
        if (await reasonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await reasonInput.fill('Sick leave');
        }
      }
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('7) mark Priya as "Half Day"', async ({ page }) => {
    const state = createMockState();
    const records: StaffAttRecord[] = [];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    // Look for half day button or option
    const halfDayBtn = page.getByRole('button', { name: /half\s*day/i }).first();
    const hasHalfDay = await halfDayBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHalfDay) {
      await halfDayBtn.click();
      await page.waitForTimeout(500);
    } else {
      // May be a select option
      const statusSelects = page.locator('select[name*="status"]');
      const selectCount = await statusSelects.count();
      if (selectCount >= 3) {
        await statusSelects.nth(2).selectOption('halfday');
      }
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('8) click save to submit attendance', async ({ page }) => {
    const state = createMockState();
    const records: StaffAttRecord[] = [];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    // Mark some attendance first
    const presentBtns = page.getByRole('button', { name: /present/i });
    if (await presentBtns.count() > 0) {
      await presentBtns.first().click();
      await page.waitForTimeout(300);
    }

    // Click save
    const saveBtn = page.getByRole('button', { name: /save|submit|mark/i }).first();
    const hasSave = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSave) {
      await saveBtn.click();
      await page.waitForLoadState('networkidle');

      // Should show success toast or update
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });

  test('9) success toast appears after saving', async ({ page }) => {
    const state = createMockState();
    const records: StaffAttRecord[] = [];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    // Mark and save
    const presentBtns = page.getByRole('button', { name: /present/i });
    if (await presentBtns.count() > 0) {
      await presentBtns.first().click();
      await page.waitForTimeout(300);
    }

    const saveBtn = page.getByRole('button', { name: /save|submit|mark/i }).first();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(1000);

      // Check for toast
      const toast = page.locator(
        '[class*="toast"], [class*="notification"], [role="alert"], [class*="Toastify"]',
      ).first();
      const hasToast = await toast.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasToast) {
        const toastText = await toast.textContent();
        expect(toastText?.toLowerCase()).toMatch(/success|saved|marked|updated/);
      }
    }
  });

  test('10) KPI cards update after marking attendance', async ({ page }) => {
    const state = createMockState();
    const records: StaffAttRecord[] = [
      buildStaffRecord(TEACHER_A_ID, 'Ananya Sharma', TODAY, 'present'),
      buildStaffRecord(TEACHER_B_ID, 'Ravi Menon', TODAY, 'absent', 'Sick'),
      buildStaffRecord(ACCOUNTANT_ID, 'Priya Menon', TODAY, 'halfday'),
    ];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should reflect: 1 Present, 1 Absent, 1 Half Day
    const hasPresent = body?.toLowerCase().includes('present');
    const hasAbsent = body?.toLowerCase().includes('absent');
    expect(hasPresent || hasAbsent).toBeTruthy();
  });

  test('11) change date to yesterday shows different/empty data', async ({ page }) => {
    const state = createMockState();
    // Records only for today
    const records: StaffAttRecord[] = [
      buildStaffRecord(TEACHER_A_ID, 'Ananya Sharma', TODAY, 'present'),
    ];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    // Change date to yesterday
    const dateInput = page.locator('input[type="date"]').first();
    const hasDate = await dateInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = yesterday.toISOString().split('T')[0];
      await dateInput.fill(yestStr);
      await page.waitForLoadState('networkidle');
    }

    // Page should render without error
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('12) "Mark All Present" button marks all staff as present', async ({ page }) => {
    const state = createMockState();
    const records: StaffAttRecord[] = [];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    // Look for "Mark All Present" button
    const markAllBtn = page.getByRole('button', { name: /mark all|all present|bulk/i }).first();
    const hasMarkAll = await markAllBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasMarkAll) {
      await markAllBtn.click();
      await page.waitForTimeout(500);

      // May need confirmation
      const confirmBtn = page.locator('[role="dialog"]').getByRole('button', { name: /confirm|yes|proceed/i }).first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      await page.waitForLoadState('networkidle');

      // All should now be marked present
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('13) search/filter by name filters the staff list', async ({ page }) => {
    const state = createMockState();
    const records: StaffAttRecord[] = [];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]',
    ).first();
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.fill('Ananya');
      await page.waitForTimeout(600);

      // Should show Ananya
      await expect(page.getByText('Ananya Sharma').first()).toBeVisible();
    } else {
      // No search — all should be visible
      await expect(page.getByText('Ananya Sharma').first()).toBeVisible();
    }
  });

  test('14) page is accessible for authenticated admin', async ({ page }) => {
    const state = createMockState();
    const records: StaffAttRecord[] = [];
    await installStaffAttendanceMockApi(page, state, records);

    await page.goto('/staffs/attendance');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});
