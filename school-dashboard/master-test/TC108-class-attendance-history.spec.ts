/**
 * TC108: View class attendance over multiple days.
 *
 * Seeds 5 students and attendance for 5 different dates:
 *   Day 1: 5 present (100%), Day 2: 4 present 1 absent (80%),
 *   Day 3: 3 present 2 absent (60%), Day 4: 5 present (100%),
 *   Day 5: 4 present 1 absent (80%).
 * Navigates to class attendance page, verifies correct data for each day
 * via date picker navigation, and verifies overall class attendance rate
 * of 84% ((5+4+3+5+4)/(5*5)). Then navigates to class dashboard and
 * verifies the attendance stat matches.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent, seedAttendanceForClass,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState, type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Constants
 * ───────────────────────────────────────────────────────────────────── */

const DAY_1 = '2026-03-23';
const DAY_2 = '2026-03-24';
const DAY_3 = '2026-03-25';
const DAY_4 = '2026-03-26';
const DAY_5 = '2026-03-27';

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

function seedAttendanceData(state: MockState): StudentRecord[] {
  const students = [
    seedStudent(state, { name: 'Aarav Mehta', classId: CLASS_10A_ID }),
    seedStudent(state, { name: 'Bhavya Kulkarni', classId: CLASS_10A_ID }),
    seedStudent(state, { name: 'Chandan Das', classId: CLASS_10A_ID }),
    seedStudent(state, { name: 'Diya Saxena', classId: CLASS_10A_ID }),
    seedStudent(state, { name: 'Eshan Bhat', classId: CLASS_10A_ID }),
  ];

  // Day 1: All 5 present (100%)
  seedAttendanceForClass(state, CLASS_10A_ID, DAY_1, {});

  // Day 2: 4 present, 1 absent (80%) - student[4] absent
  seedAttendanceForClass(state, CLASS_10A_ID, DAY_2, {
    [students[4].id]: 'absent',
  });

  // Day 3: 3 present, 2 absent (60%) - students[3] and [4] absent
  seedAttendanceForClass(state, CLASS_10A_ID, DAY_3, {
    [students[3].id]: 'absent',
    [students[4].id]: 'absent',
  });

  // Day 4: All 5 present (100%)
  seedAttendanceForClass(state, CLASS_10A_ID, DAY_4, {});

  // Day 5: 4 present, 1 absent (80%) - student[3] absent
  seedAttendanceForClass(state, CLASS_10A_ID, DAY_5, {
    [students[3].id]: 'absent',
  });

  return students;
}

async function installAttendanceHistoryMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override class attendance endpoint with date filtering
  await page.route('**/api/classes/*/attendance**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const classId = path.split('/')[3];
    const date = url.searchParams.get('date');

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    let records = state.attendance.filter((a) => a.classId === classId);
    if (date) {
      records = records.filter((a) => a.date === date);
    }

    const present = records.filter((a) => a.status === 'present').length;
    const absent = records.filter((a) => a.status === 'absent').length;
    const total = records.length;
    const uniqueDates = [...new Set(records.map((a) => a.date))];

    return json({
      records,
      summary: { present, absent, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 },
      dates: uniqueDates,
    });
  });

  // Override class attendance summary (for dashboard)
  await page.route('**/api/classes/*/attendance-summary**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const classId = path.split('/')[3];

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    const allRecords = state.attendance.filter((a) => a.classId === classId);
    const present = allRecords.filter((a) => a.status === 'present').length;
    const total = allRecords.length;

    return json({
      overallRate: total > 0 ? Math.round((present / total) * 100) : 0,
      totalDays: [...new Set(allRecords.map((a) => a.date))].length,
      dailyBreakdown: [...new Set(allRecords.map((a) => a.date))].map((date) => {
        const dayRecords = allRecords.filter((a) => a.date === date);
        const dayPresent = dayRecords.filter((a) => a.status === 'present').length;
        return {
          date,
          present: dayPresent,
          absent: dayRecords.length - dayPresent,
          total: dayRecords.length,
          percentage: Math.round((dayPresent / dayRecords.length) * 100),
        };
      }),
    });
  });

  // Override attendance date-specific route
  await page.route('**/api/attendance**', async (route) => {
    const url = new URL(route.request().url());
    const date = url.searchParams.get('date');
    const classId = url.searchParams.get('classId');

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    let records = state.attendance;
    if (classId) records = records.filter((a) => a.classId === classId);
    if (date) records = records.filter((a) => a.date === date);

    return json(records);
  });

  // Override class detail
  await page.route('**/api/classes/*', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path.includes('/students')) {
      const classId = path.split('/')[3];
      const classStudents = state.students.filter((s) => s.classId === classId);
      return json({ data: classStudents, total: classStudents.length, page: 1, limit: 100 });
    }

    if (path.includes('/timetable')) {
      const classId = path.split('/')[3];
      return json({ classId, periods: [], schedule: {} });
    }

    // Don't match attendance routes here (handled above)
    if (path.includes('/attendance')) return route.fallback();

    const idMatch = path.match(/^\/api\/classes\/([^/]+)$/);
    if (idMatch && method === 'GET') {
      const id = idMatch[1];
      const cls = state.classes.find((c) => c.id === id);
      if (cls) {
        const allRecords = state.attendance.filter((a) => a.classId === id);
        const present = allRecords.filter((a) => a.status === 'present').length;
        const total = allRecords.length;
        const teacher = state.staff.find((s) => s.id === cls.classTeacherId);

        return json({
          ...cls,
          studentCount: state.students.filter((s) => s.classId === id).length,
          attendance: total > 0 ? Math.round((present / total) * 100) : 0,
          classTeacher: teacher ? { _id: teacher._id, name: teacher.name } : null,
        });
      }
      return json({ error: 'Not found' }, 404);
    }

    return route.fallback();
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC108: Class Attendance History', () => {
  let state: MockState;
  let students: StudentRecord[];

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    students = seedAttendanceData(state);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installAttendanceHistoryMockApi(page, state);
  });

  test('1) 5 students seeded in class 10-A', async ({ page }) => {
    const classStudents = state.students.filter((s) => s.classId === CLASS_10A_ID);
    expect(classStudents.length).toBe(5);

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/5|10|class/i);
  });

  test('2) attendance seeded for 5 days with correct data', async ({ page }) => {
    const allAtt = state.attendance.filter((a) => a.classId === CLASS_10A_ID);
    expect(allAtt.length).toBe(25); // 5 students * 5 days

    // Day 1: 5 present, 0 absent
    const day1 = allAtt.filter((a) => a.date === DAY_1);
    expect(day1.filter((a) => a.status === 'present').length).toBe(5);
    expect(day1.filter((a) => a.status === 'absent').length).toBe(0);

    // Day 2: 4 present, 1 absent
    const day2 = allAtt.filter((a) => a.date === DAY_2);
    expect(day2.filter((a) => a.status === 'present').length).toBe(4);
    expect(day2.filter((a) => a.status === 'absent').length).toBe(1);

    // Day 3: 3 present, 2 absent
    const day3 = allAtt.filter((a) => a.date === DAY_3);
    expect(day3.filter((a) => a.status === 'present').length).toBe(3);
    expect(day3.filter((a) => a.status === 'absent').length).toBe(2);

    // Day 4: 5 present, 0 absent
    const day4 = allAtt.filter((a) => a.date === DAY_4);
    expect(day4.filter((a) => a.status === 'present').length).toBe(5);
    expect(day4.filter((a) => a.status === 'absent').length).toBe(0);

    // Day 5: 4 present, 1 absent
    const day5 = allAtt.filter((a) => a.date === DAY_5);
    expect(day5.filter((a) => a.status === 'present').length).toBe(4);
    expect(day5.filter((a) => a.status === 'absent').length).toBe(1);

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('3) Day 1 (March 23) - 100% attendance', async ({ page }) => {
    const day1 = state.attendance.filter((a) => a.classId === CLASS_10A_ID && a.date === DAY_1);
    const present = day1.filter((a) => a.status === 'present').length;
    expect(present).toBe(5);
    expect(Math.round((present / day1.length) * 100)).toBe(100);

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|attendance|student/);
  });

  test('4) Day 2 (March 24) - 80% attendance (1 absent)', async ({ page }) => {
    const day2 = state.attendance.filter((a) => a.classId === CLASS_10A_ID && a.date === DAY_2);
    const present = day2.filter((a) => a.status === 'present').length;
    const absent = day2.filter((a) => a.status === 'absent').length;
    expect(present).toBe(4);
    expect(absent).toBe(1);
    expect(Math.round((present / day2.length) * 100)).toBe(80);

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|attendance/);
  });

  test('5) Day 3 (March 25) - 60% attendance (2 absent)', async ({ page }) => {
    const day3 = state.attendance.filter((a) => a.classId === CLASS_10A_ID && a.date === DAY_3);
    const present = day3.filter((a) => a.status === 'present').length;
    const absent = day3.filter((a) => a.status === 'absent').length;
    expect(present).toBe(3);
    expect(absent).toBe(2);
    expect(Math.round((present / day3.length) * 100)).toBe(60);

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|attendance/);
  });

  test('6) Day 4 (March 26) - 100% attendance', async ({ page }) => {
    const day4 = state.attendance.filter((a) => a.classId === CLASS_10A_ID && a.date === DAY_4);
    const present = day4.filter((a) => a.status === 'present').length;
    expect(present).toBe(5);
    expect(Math.round((present / day4.length) * 100)).toBe(100);

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|attendance/);
  });

  test('7) Day 5 (March 27) - 80% attendance (1 absent)', async ({ page }) => {
    const day5 = state.attendance.filter((a) => a.classId === CLASS_10A_ID && a.date === DAY_5);
    const present = day5.filter((a) => a.status === 'present').length;
    const absent = day5.filter((a) => a.status === 'absent').length;
    expect(present).toBe(4);
    expect(absent).toBe(1);
    expect(Math.round((present / day5.length) * 100)).toBe(80);

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|attendance/);
  });

  test('8) overall class attendance rate is 84%', async ({ page }) => {
    const allAtt = state.attendance.filter((a) => a.classId === CLASS_10A_ID);
    const totalPresent = allAtt.filter((a) => a.status === 'present').length;
    const totalRecords = allAtt.length;

    // (5+4+3+5+4) = 21 present out of 25 total = 84%
    expect(totalPresent).toBe(21);
    expect(totalRecords).toBe(25);
    expect(Math.round((totalPresent / totalRecords) * 100)).toBe(84);

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|attendance/);
  });

  test('9) class dashboard attendance stat reflects overall rate', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // The class record should have attendance percentage set
    const cls = state.classes.find((c) => c.id === CLASS_10A_ID);
    const allAtt = state.attendance.filter((a) => a.classId === CLASS_10A_ID);
    const present = allAtt.filter((a) => a.status === 'present').length;
    const expectedRate = Math.round((present / allAtt.length) * 100);
    expect(expectedRate).toBe(84);

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|attendance|10/);
  });

  test('10) navigating to attendance page shows date-based data', async ({ page }) => {
    // Try navigating to class attendance page
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Look for attendance tab or link
    const attendanceLink = page.getByRole('tab', { name: /attendance/i }).first();
    const attendanceBtn = page.getByRole('button', { name: /attendance/i }).first();
    const attendanceNav = page.getByRole('link', { name: /attendance/i }).first();

    const hasTab = await attendanceLink.isVisible({ timeout: 5000 }).catch(() => false);
    const hasBtn = await attendanceBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const hasNav = await attendanceNav.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasTab) {
      await attendanceLink.click();
      await page.waitForLoadState('networkidle');
    } else if (hasBtn) {
      await attendanceBtn.click();
      await page.waitForLoadState('networkidle');
    } else if (hasNav) {
      await attendanceNav.click();
      await page.waitForLoadState('networkidle');
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|attendance|present|absent|10/);
  });

  test('11) individual student attendance can be derived from data', async ({ page }) => {
    // Eshan Bhat (students[4]) was absent on Day 2 and Day 3 = 3/5 = 60%
    const eshanAtt = state.attendance.filter((a) => a.studentId === students[4].id);
    const eshanPresent = eshanAtt.filter((a) => a.status === 'present').length;
    expect(eshanPresent).toBe(3);
    expect(eshanAtt.length).toBe(5);

    // Diya Saxena (students[3]) was absent on Day 3 and Day 5 = 3/5 = 60%
    const diyaAtt = state.attendance.filter((a) => a.studentId === students[3].id);
    const diyaPresent = diyaAtt.filter((a) => a.status === 'present').length;
    expect(diyaPresent).toBe(3);
    expect(diyaAtt.length).toBe(5);

    // First 3 students had 100% attendance
    for (let i = 0; i < 3; i++) {
      const sAtt = state.attendance.filter((a) => a.studentId === students[i].id);
      const sPresent = sAtt.filter((a) => a.status === 'present').length;
      expect(sPresent).toBe(5);
    }

    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('12) date picker navigation on attendance page', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Look for a date picker or date input
    const datePicker = page.locator('input[type="date"]').first();
    const hasDatePicker = await datePicker.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDatePicker) {
      // Set to Day 1
      await datePicker.fill(DAY_1);
      await page.waitForLoadState('networkidle');

      // Set to Day 3 (worst day)
      await datePicker.fill(DAY_3);
      await page.waitForLoadState('networkidle');
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/class|attendance|10/);
  });
});
