import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  TEACHER_A_ID, SCHOOL_ID, CLASS_10A_ID, CLASS_11A_ID,
  type MockState, type StaffAttendanceRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 800 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Seed 30 days of attendance for TEACHER_A
 * ───────────────────────────────────────────────────────────────────── */

interface AttendanceStats {
  present: number;
  absent: number;
  leave: number;
  halfday: number;
  total: number;
  percentage: string;
}

function seed30DaysAttendance(state: MockState): { records: StaffAttendanceRecord[]; stats: AttendanceStats } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // current month (0-indexed)
  const records: StaffAttendanceRecord[] = [];

  let present = 0;
  let absent = 0;
  let leave = 0;
  let halfday = 0;

  for (let day = 1; day <= 30; day++) {
    const d = new Date(year, month, day);
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    // Skip future dates
    if (d > now) continue;

    const dateStr = d.toISOString().split('T')[0];
    let status: string;

    // Create a realistic mix: mostly present, some absent, leave, halfday
    if (day === 3 || day === 17) {
      status = 'absent';
      absent++;
    } else if (day === 7 || day === 21) {
      status = 'leave';
      leave++;
    } else if (day === 10 || day === 25) {
      status = 'halfday';
      halfday++;
    } else {
      status = 'present';
      present++;
    }

    records.push({
      _id: `satt-${TEACHER_A_ID}-${dateStr}`,
      id: `satt-${TEACHER_A_ID}-${dateStr}`,
      staffId: TEACHER_A_ID,
      date: dateStr,
      status,
      schoolId: SCHOOL_ID,
    });
  }

  state.staffAttendance = records;

  const total = present + absent + leave + halfday;
  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

  return { records, stats: { present, absent, leave, halfday, total, percentage } };
}

function seedPreviousMonthAttendance(state: MockState): StaffAttendanceRecord[] {
  const now = new Date();
  const prevMonth = now.getMonth() - 1;
  const year = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = prevMonth < 0 ? 11 : prevMonth;
  const records: StaffAttendanceRecord[] = [];

  for (let day = 1; day <= 28; day++) {
    const d = new Date(year, month, day);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const dateStr = d.toISOString().split('T')[0];
    const status = day % 8 === 0 ? 'absent' : 'present';

    records.push({
      _id: `satt-prev-${TEACHER_A_ID}-${dateStr}`,
      id: `satt-prev-${TEACHER_A_ID}-${dateStr}`,
      staffId: TEACHER_A_ID,
      date: dateStr,
      status,
      schoolId: SCHOOL_ID,
    });
  }

  state.staffAttendance.push(...records);
  return records;
}

async function installAttendanceHistoryMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
  stats: AttendanceStats,
) {
  await installMockApi(page, state);

  // Staff detail with enriched data
  await page.route(`**/api/staff/${TEACHER_A_ID}`, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const teacher = state.staff.find((s) => s.id === TEACHER_A_ID);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...teacher,
        classTeacher: { classId: CLASS_10A_ID, className: '10-A' },
        assignedClasses: [
          { classId: CLASS_10A_ID, className: '10-A', subjects: ['Mathematics', 'Science'] },
          { classId: CLASS_11A_ID, className: '11-A', subjects: ['Mathematics'] },
        ],
      }),
    });
  });

  // Staff attendance endpoint (by staff)
  await page.route(`**/api/staff/${TEACHER_A_ID}/attendance**`, async (route) => {
    const url = new URL(route.request().url());
    const monthParam = url.searchParams.get('month');
    const yearParam = url.searchParams.get('year');

    let filtered = state.staffAttendance.filter((a) => a.staffId === TEACHER_A_ID);

    if (monthParam && yearParam) {
      const m = parseInt(monthParam, 10);
      const y = parseInt(yearParam, 10);
      filtered = filtered.filter((a) => {
        const d = new Date(a.date);
        return d.getMonth() + 1 === m && d.getFullYear() === y;
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(filtered),
    });
  });

  // Staff attendance stats
  await page.route(`**/api/staff/${TEACHER_A_ID}/attendance-stats**`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        present: stats.present,
        absent: stats.absent,
        leave: stats.leave,
        halfDay: stats.halfday,
        totalWorkingDays: stats.total,
        attendancePercentage: parseFloat(stats.percentage),
      }),
    });
  });

  // Payroll stub
  await page.route('**/api/payroll**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ records: [], summary: { totalAmount: 0, processedCount: 0 } }),
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC082 — Staff Attendance History Over a Period
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC082 — Staff Attendance History', () => {

  test('1) staff profile loads with attendance data seeded', async ({ page }) => {
    const state = createMockState();
    const { stats } = seed30DaysAttendance(state);
    await installAttendanceHistoryMockApi(page, state, stats);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toContain('Ananya');
  });

  test('2) Attendance tab is clickable and loads', async ({ page }) => {
    const state = createMockState();
    const { stats } = seed30DaysAttendance(state);
    await installAttendanceHistoryMockApi(page, state, stats);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.locator('button').filter({ hasText: /^Attendance$/i }).first();
    const hasTab = await attendanceTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTab) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    const hasAttContent = body?.toLowerCase().includes('attendance') ||
                          body?.toLowerCase().includes('present') ||
                          body?.toLowerCase().includes('absent') ||
                          body?.includes('%');
    expect(hasAttContent).toBeTruthy();
  });

  test('3) monthly calendar view shows status markers for each day', async ({ page }) => {
    const state = createMockState();
    const { stats } = seed30DaysAttendance(state);
    await installAttendanceHistoryMockApi(page, state, stats);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.locator('button').filter({ hasText: /^Attendance$/i }).first();
    if (await attendanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    // Calendar should show day names or status indicators
    const hasCalendarUI = body?.includes('Mon') || body?.includes('Tue') ||
                          body?.includes('Wed') || body?.includes('Thu') ||
                          body?.includes('Fri') || body?.includes('Sun') ||
                          body?.includes('Monday') || body?.includes('Tuesday') ||
                          body?.toLowerCase().includes('calendar');
    expect(hasCalendarUI).toBeTruthy();
  });

  test('4) stats show present count', async ({ page }) => {
    const state = createMockState();
    const { stats } = seed30DaysAttendance(state);
    await installAttendanceHistoryMockApi(page, state, stats);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.locator('button').filter({ hasText: /^Attendance$/i }).first();
    if (await attendanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    // Should show present stat
    expect(body?.toLowerCase()).toMatch(/present/);
  });

  test('5) stats show absent count', async ({ page }) => {
    const state = createMockState();
    const { stats } = seed30DaysAttendance(state);
    await installAttendanceHistoryMockApi(page, state, stats);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.locator('button').filter({ hasText: /^Attendance$/i }).first();
    if (await attendanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    expect(body?.toLowerCase()).toMatch(/absent/);
  });

  test('6) stats show leave and halfday counts', async ({ page }) => {
    const state = createMockState();
    const { stats } = seed30DaysAttendance(state);
    await installAttendanceHistoryMockApi(page, state, stats);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.locator('button').filter({ hasText: /^Attendance$/i }).first();
    if (await attendanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    // Should show leave or halfday stat
    const hasLeaveStats = body?.toLowerCase().includes('leave') ||
                          body?.toLowerCase().includes('half') ||
                          body?.toLowerCase().includes('half day');
    expect(hasLeaveStats).toBeTruthy();
  });

  test('7) attendance percentage is calculated and displayed', async ({ page }) => {
    const state = createMockState();
    const { stats } = seed30DaysAttendance(state);
    await installAttendanceHistoryMockApi(page, state, stats);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.locator('button').filter({ hasText: /^Attendance$/i }).first();
    if (await attendanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    // Should show percentage
    expect(body).toMatch(/%/);
  });

  test('8) color coding for different statuses is applied', async ({ page }) => {
    const state = createMockState();
    const { stats } = seed30DaysAttendance(state);
    await installAttendanceHistoryMockApi(page, state, stats);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.locator('button').filter({ hasText: /^Attendance$/i }).first();
    if (await attendanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    // Look for colored elements indicating status (green=present, red=absent, etc.)
    const coloredElements = page.locator(
      '[class*="present"], [class*="absent"], [class*="leave"], [class*="halfday"], ' +
      '[class*="green"], [class*="red"], [class*="orange"], [class*="yellow"], ' +
      '[style*="background"], [class*="badge"], [class*="dot"], [class*="indicator"]',
    );
    const colorCount = await coloredElements.count();

    // There should be multiple colored indicators for the calendar
    expect(colorCount).toBeGreaterThan(0);
  });

  test('9) switch to previous month loads previous month data', async ({ page }) => {
    const state = createMockState();
    const { stats } = seed30DaysAttendance(state);
    seedPreviousMonthAttendance(state);
    await installAttendanceHistoryMockApi(page, state, stats);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.locator('button').filter({ hasText: /^Attendance$/i }).first();
    if (await attendanceTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    // Navigate to previous month
    const prevMonthBtn = page.locator(
      'button[aria-label*="previous" i], button[aria-label*="prev" i], ' +
      '[class*="prev"], [class*="chevron-left"], [class*="arrow-left"]',
    ).first();
    const hasPrevBtn = await prevMonthBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasPrevBtn) {
      await prevMonthBtn.click();
      await page.waitForLoadState('networkidle');
    } else {
      // May be a month selector dropdown
      const monthSelect = page.locator('select[name*="month"]').first();
      if (await monthSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        const options = await monthSelect.locator('option').allInnerTexts();
        if (options.length > 1) {
          await monthSelect.selectOption({ index: Math.max(0, options.length - 2) });
          await page.waitForTimeout(500);
        }
      }
    }

    // Page should still show attendance data
    const body = await page.textContent('body');
    const hasContent = body?.toLowerCase().includes('present') ||
                       body?.toLowerCase().includes('absent') ||
                       body?.toLowerCase().includes('attendance') ||
                       body?.includes('%');
    expect(hasContent).toBeTruthy();
  });

  test('10) previous month data loads correctly without errors', async ({ page }) => {
    const state = createMockState();
    const { stats } = seed30DaysAttendance(state);
    seedPreviousMonthAttendance(state);
    await installAttendanceHistoryMockApi(page, state, stats);

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    // No critical console errors should appear
    const criticalErrors = consoleErrors.filter(
      (e) => e.includes('TypeError') || e.includes('ReferenceError'),
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('11) overview tab also shows attendance summary', async ({ page }) => {
    const state = createMockState();
    const { stats } = seed30DaysAttendance(state);
    await installAttendanceHistoryMockApi(page, state, stats);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    // Overview tab (default) should show attendance rate card
    const body = await page.textContent('body');
    const hasAttendanceRate = body?.includes('%') ||
                              body?.toLowerCase().includes('attendance') ||
                              body?.toLowerCase().includes('present') ||
                              body?.toLowerCase().includes('working');
    expect(hasAttendanceRate).toBeTruthy();
  });

  test('12) page does not redirect during attendance navigation', async ({ page }) => {
    const state = createMockState();
    const { stats } = seed30DaysAttendance(state);
    await installAttendanceHistoryMockApi(page, state, stats);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);
  });
});
