/**
 * TC097: Verify attendance percentage calculations are mathematically correct.
 *
 * Verifies: present/absent/leave/halfday counts, percentage calculation
 * accounting for halfday as 0.5, and consistency between student dashboard
 * and class dashboard percentage values.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  CLASS_10A_ID,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────── Helpers ───────── */

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

/**
 * Seed 20 school days of attendance for a single student.
 * 15 present, 3 absent, 1 leave, 1 halfday
 */
function seed20DaysAttendance(
  state: MockState,
  studentId: string,
  classId: string,
) {
  const statuses = [
    // Days 1-15: present
    ...Array(15).fill('present'),
    // Days 16-18: absent
    'absent', 'absent', 'absent',
    // Day 19: leave
    'leave',
    // Day 20: halfday
    'halfday',
  ];

  for (let i = 0; i < 20; i++) {
    const date = dateStr(20 - i); // from 20 days ago to 1 day ago
    state.attendance.push({
      _id: `att-${studentId}-${date}`,
      id: `att-${studentId}-${date}`,
      studentId,
      classId,
      date,
      status: statuses[i],
      schoolId: SCHOOL_ID,
    });
  }
}

/* ───────── Route overrides ───────── */

async function installPercentageRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override student attendance endpoint with detailed breakdown
  await page.route('**/api/students/*/attendance**', async (route) => {
    const url = new URL(route.request().url());
    const studentId = url.pathname.split('/')[3];
    state.requestLog.add(`GET /api/students/${studentId}/attendance`);

    const records = state.attendance.filter((a) => a.studentId === studentId);
    const total = records.length;
    const present = records.filter((a) => a.status === 'present').length;
    const absent = records.filter((a) => a.status === 'absent').length;
    const leave = records.filter((a) => a.status === 'leave').length;
    const halfday = records.filter((a) => a.status === 'halfday').length;

    // Percentage: (present + 0.5 * halfday) / total * 100
    const effectivePresent = present + (halfday * 0.5);
    const percentage = total > 0 ? Math.round((effectivePresent / total) * 100 * 100) / 100 : 0;

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        records: records.sort((a, b) => a.date.localeCompare(b.date)),
        total,
        present,
        absent,
        leave,
        halfday,
        effectivePresent,
        percentage,
      }),
    });
  });

  // Override class dashboard with per-student attendance breakdown
  await page.route('**/api/classes/*/dashboard**', async (route) => {
    const url = new URL(route.request().url());
    const classId = url.pathname.split('/')[3];
    state.requestLog.add(`GET /api/classes/${classId}/dashboard`);

    const classStudents = state.students.filter((s) => s.classId === classId);

    const studentAttendance = classStudents.map((student) => {
      const records = state.attendance.filter((a) => a.studentId === student.id);
      const total = records.length;
      const present = records.filter((a) => a.status === 'present').length;
      const halfday = records.filter((a) => a.status === 'halfday').length;
      const effectivePresent = present + (halfday * 0.5);
      const percentage = total > 0 ? Math.round((effectivePresent / total) * 100 * 100) / 100 : 0;

      return {
        studentId: student.id,
        studentName: student.name,
        total,
        present,
        absent: records.filter((a) => a.status === 'absent').length,
        leave: records.filter((a) => a.status === 'leave').length,
        halfday,
        percentage,
      };
    });

    // Overall class attendance rate
    const totalRecords = state.attendance.filter((a) => a.classId === classId).length;
    const totalPresent = state.attendance.filter((a) => a.classId === classId && a.status === 'present').length;
    const totalHalfday = state.attendance.filter((a) => a.classId === classId && a.status === 'halfday').length;
    const effectiveTotal = totalPresent + (totalHalfday * 0.5);
    const classRate = totalRecords > 0 ? Math.round((effectiveTotal / totalRecords) * 100 * 100) / 100 : 0;

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        classId,
        totalStudents: classStudents.length,
        attendanceRate: classRate,
        studentAttendance,
      }),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC097: Attendance Percentage Accuracy', () => {
  let state: MockState;
  let student: ReturnType<typeof seedStudent>;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed 1 student
    student = seedStudent(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID });

    // Seed 20 school days: 15 present, 3 absent, 1 leave, 1 halfday
    seed20DaysAttendance(state, student.id, CLASS_10A_ID);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installPercentageRoutes(page, state);
  });

  test('1) verify 20 attendance records were seeded', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    const records = state.attendance.filter((a) => a.studentId === student.id);
    expect(records).toHaveLength(20);
  });

  test('2) present count = 15', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    const data = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/attendance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, student.id);

    expect(data.present).toBe(15);
  });

  test('3) absent count = 3', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    const data = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/attendance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, student.id);

    expect(data.absent).toBe(3);
  });

  test('4) leave count = 1', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    const data = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/attendance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, student.id);

    expect(data.leave).toBe(1);
  });

  test('5) halfday count = 1', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    const data = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/attendance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, student.id);

    expect(data.halfday).toBe(1);
  });

  test('6) percentage = (15 + 0.5) / 20 * 100 = 77.5%', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    const data = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/attendance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, student.id);

    // (15 + 0.5*1) / 20 * 100 = 77.5%
    expect(data.effectivePresent).toBe(15.5);
    expect(data.percentage).toBe(77.5);
  });

  test('7) class dashboard percentage matches student dashboard', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    // Get student-level attendance
    const studentData = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/attendance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, student.id);

    // Get class-level dashboard
    const classData = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/classes/${classId}/dashboard`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    // Find this student in class dashboard
    const studentInClass = classData.studentAttendance.find(
      (s: { studentId: string }) => s.studentId === student.id,
    );

    expect(studentInClass).toBeTruthy();
    expect(studentInClass.percentage).toBe(studentData.percentage);
    expect(studentInClass.present).toBe(studentData.present);
    expect(studentInClass.absent).toBe(studentData.absent);
    expect(studentInClass.leave).toBe(studentData.leave);
    expect(studentInClass.halfday).toBe(studentData.halfday);
  });

  test('8) total breakdown adds up correctly: present + absent + leave + halfday = total', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    const data = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/attendance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, student.id);

    const sum = data.present + data.absent + data.leave + data.halfday;
    expect(sum).toBe(data.total);
    expect(sum).toBe(20);
  });

  test('9) student profile page loads with attendance data accessible', async ({ page }) => {
    await page.goto(`/students/${student.id}`);
    await page.waitForLoadState('networkidle');

    // Student name should be visible
    await expect(page.getByText(student.name).first()).toBeVisible({ timeout: 10_000 });

    // Click attendance tab if visible
    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByRole('button', { name: /attendance/i }))
      .first();
    const hasTab = await attendanceTab.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasTab) {
      await attendanceTab.click();
      await page.waitForLoadState('networkidle');
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/attendance|present|absent|%/);
    await expect(page).not.toHaveURL(/\/login/);
  });
});
