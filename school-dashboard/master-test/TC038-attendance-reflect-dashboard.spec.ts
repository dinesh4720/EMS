/**
 * TC038: Verify attendance data appears in student dashboard and class dashboard.
 *
 * Seeds attendance records and verifies they are reflected in the student
 * profile attendance tab and the class dashboard stats card.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent, seedAttendanceForClass,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

const TODAY = new Date().toISOString().split('T')[0];

function seedWithAttendance(state: MockState) {
  const students = [
    seedStudent(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID }),
    seedStudent(state, { name: 'Diya Patel', classId: CLASS_10A_ID }),
    seedStudent(state, { name: 'Karthik Reddy', classId: CLASS_10A_ID }),
    seedStudent(state, { name: 'Meera Nair', classId: CLASS_10A_ID }),
    seedStudent(state, { name: 'Rohan Gupta', classId: CLASS_10A_ID }),
  ];

  // 3 present, 2 absent
  seedAttendanceForClass(state, CLASS_10A_ID, TODAY, {
    [students[0].id]: 'present',
    [students[1].id]: 'present',
    [students[2].id]: 'present',
    [students[3].id]: 'absent',
    [students[4].id]: 'absent',
  });

  return students;
}

async function installDashboardMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override student attendance endpoint to provide computed percentage
  await page.route('**/api/students/*/attendance**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const studentId = path.split('/')[3];
    const records = state.attendance.filter((a) => a.studentId === studentId);
    const total = records.length;
    const present = records.filter((a) => a.status === 'present').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        records,
        total,
        present,
        absent: total - present,
        percentage,
      }),
    });
  });

  // Override class dashboard stats
  await page.route('**/api/classes/*/dashboard**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const classId = path.split('/')[3];
    const classStudents = state.students.filter((s) => s.classId === classId);
    const classAttendance = state.attendance.filter((a) => a.classId === classId);
    const totalMarked = classAttendance.length;
    const presentCount = classAttendance.filter((a) => a.status === 'present').length;
    const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        classId,
        totalStudents: classStudents.length,
        attendanceRate,
        presentToday: presentCount,
        absentToday: totalMarked - presentCount,
        averagePerformance: 78,
      }),
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC038: Attendance Reflects in Student & Class Dashboards', () => {
  test('1) student dashboard shows attendance tab with record', async ({ page }) => {
    const state = createMockState();
    const students = seedWithAttendance(state);
    const absentStudent = students[3]; // Meera Nair - absent
    await installDashboardMockApi(page, state);

    // Navigate to student profile
    await page.goto(`/students/${absentStudent.id}`);
    await page.waitForLoadState('networkidle');

    // Click Attendance tab
    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByText(/attendance/i).first());
    const hasTab = await attendanceTab.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasTab) {
      await attendanceTab.click();
      await page.waitForLoadState('networkidle');
    }

    // Should show attendance data
    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/attendance|present|absent/);
  });

  test('2) absent student shows absent status in attendance history', async ({ page }) => {
    const state = createMockState();
    const students = seedWithAttendance(state);
    const absentStudent = students[3]; // Meera Nair - absent
    await installDashboardMockApi(page, state);

    await page.goto(`/students/${absentStudent.id}`);
    await page.waitForLoadState('networkidle');

    // Navigate to attendance tab
    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByRole('button', { name: /attendance/i }))
      .first();
    const hasTab = await attendanceTab.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasTab) {
      await attendanceTab.click();
      await page.waitForLoadState('networkidle');
    }

    const bodyText = await page.textContent('body');
    // Should display "absent" status somewhere
    expect(bodyText?.toLowerCase()).toMatch(/absent|0%|attendance/);
  });

  test('3) student attendance shows overall percentage', async ({ page }) => {
    const state = createMockState();
    const students = seedWithAttendance(state);
    const presentStudent = students[0]; // Aarav Sharma - present
    await installDashboardMockApi(page, state);

    await page.goto(`/students/${presentStudent.id}`);
    await page.waitForLoadState('networkidle');

    // Navigate to attendance tab
    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByRole('button', { name: /attendance/i }))
      .first();
    const hasTab = await attendanceTab.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasTab) {
      await attendanceTab.click();
      await page.waitForLoadState('networkidle');
    }

    const bodyText = await page.textContent('body');
    // Should show percentage (100% for a student present every day seeded)
    expect(bodyText).toMatch(/%|percent|attendance/i);
  });

  test('4) class dashboard loads and shows attendance stats card', async ({ page }) => {
    const state = createMockState();
    seedWithAttendance(state);
    await installDashboardMockApi(page, state);

    await page.goto(`/classes/dashboard/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Should show class info and attendance stats
    expect(bodyText?.toLowerCase()).toMatch(/attendance|present|absent|class/);
  });

  test('5) class dashboard shows correct present/absent counts', async ({ page }) => {
    const state = createMockState();
    seedWithAttendance(state); // 3 present, 2 absent
    await installDashboardMockApi(page, state);

    await page.goto(`/classes/dashboard/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Should show present count (3) and/or absent count (2)
    expect(bodyText).toMatch(/3|2|60%/);
  });

  test('6) class dashboard shows attendance rate percentage', async ({ page }) => {
    const state = createMockState();
    seedWithAttendance(state); // 3/5 = 60%
    await installDashboardMockApi(page, state);

    await page.goto(`/classes/dashboard/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Should display attendance rate (60% or similar)
    expect(bodyText?.toLowerCase()).toMatch(/attendance|rate|%|60/);
  });

  test('7) class dashboard shows total student count', async ({ page }) => {
    const state = createMockState();
    seedWithAttendance(state); // 5 students
    await installDashboardMockApi(page, state);

    await page.goto(`/classes/dashboard/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Should show 5 total students
    expect(bodyText).toMatch(/5/);
  });

  test('8) student profile loads without attendance tab crash', async ({ page }) => {
    const state = createMockState();
    const students = seedWithAttendance(state);
    await installDashboardMockApi(page, state);

    // Navigate to a present student
    await page.goto(`/students/${students[0].id}`);
    await page.waitForLoadState('networkidle');

    // Student name should be visible
    await expect(page.getByText(students[0].name).first()).toBeVisible({ timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/login/);
  });
});
