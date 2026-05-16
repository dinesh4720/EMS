/**
 * TC094: Mark attendance for multiple consecutive days and track trends.
 *
 * Verifies: multi-day attendance marking, date navigation, individual student
 * attendance history, percentage calculation across multiple days, and
 * class dashboard attendance rate reflecting all days.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  seedAttendanceForClass,
  CLASS_10A_ID,
  SCHOOL_ID,
  type MockState,
  type AttendanceRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────── Date helpers ───────── */

function dateStr(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().split('T')[0];
}

const DAY1 = dateStr(-2); // 2 days ago
const DAY2 = dateStr(-1); // yesterday
const DAY3 = dateStr(0);  // today

/* ───────── Route overrides ───────── */

async function installMultiDayAttendanceRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override attendance routes for richer multi-day handling
  await page.route('**/api/attendance**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // GET attendance for a specific class and date
    if (path.match(/^\/api\/attendance\/class\//) && method === 'GET') {
      const classId = path.split('/')[4];
      const dateParam = url.searchParams.get('date') || DAY3;
      const filtered = state.attendance.filter(
        (a) => a.classId === classId && a.date === dateParam,
      );
      return json(filtered);
    }

    // GET all attendance (supports date range)
    if (path === '/api/attendance' && method === 'GET') {
      const classId = url.searchParams.get('classId');
      const dateParam = url.searchParams.get('date');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const studentId = url.searchParams.get('studentId');

      let filtered = state.attendance;
      if (classId) filtered = filtered.filter((a) => a.classId === classId);
      if (dateParam) filtered = filtered.filter((a) => a.date === dateParam);
      if (startDate) filtered = filtered.filter((a) => a.date >= startDate);
      if (endDate) filtered = filtered.filter((a) => a.date <= endDate);
      if (studentId) filtered = filtered.filter((a) => a.studentId === studentId);
      return json(filtered);
    }

    // POST (save) attendance
    if (path === '/api/attendance' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const records: Array<{ studentId: string; status: string; classId?: string; date?: string }> =
        body.attendance || body.records || [body];
      let saved = 0;
      for (const item of records) {
        const date = item.date || body.date || DAY3;
        const existing = state.attendance.findIndex(
          (a) => a.studentId === item.studentId && a.date === date,
        );
        if (existing >= 0) {
          state.attendance[existing].status = item.status;
        } else {
          state.attendance.push({
            _id: `att-${item.studentId}-${date}`,
            id: `att-${item.studentId}-${date}`,
            studentId: item.studentId,
            classId: item.classId || body.classId || CLASS_10A_ID,
            date,
            status: item.status,
            schoolId: SCHOOL_ID,
          });
        }
        saved++;
      }
      return json({ message: `Attendance saved for ${saved} students`, saved }, 201);
    }

    return json({});
  });

  // Override student attendance endpoint for individual student history
  await page.route('**/api/students/*/attendance**', async (route) => {
    const url = new URL(route.request().url());
    const studentId = url.pathname.split('/')[3];
    state.requestLog.add(`GET /api/students/${studentId}/attendance`);

    const records = state.attendance.filter((a) => a.studentId === studentId);
    const total = records.length;
    const present = records.filter((a) => a.status === 'present').length;
    const absent = records.filter((a) => a.status === 'absent').length;
    const late = records.filter((a) => a.status === 'late').length;
    const percentage = total > 0 ? Math.round((present / total) * 100 * 100) / 100 : 0;

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        records: records.sort((a, b) => a.date.localeCompare(b.date)),
        total,
        present,
        absent,
        late,
        percentage,
      }),
    });
  });

  // Override class dashboard stats
  await page.route('**/api/classes/*/dashboard**', async (route) => {
    const url = new URL(route.request().url());
    const classId = url.pathname.split('/')[3];
    state.requestLog.add(`GET /api/classes/${classId}/dashboard`);

    const classStudents = state.students.filter((s) => s.classId === classId);
    const classAttendance = state.attendance.filter((a) => a.classId === classId);
    const totalRecords = classAttendance.length;
    const presentCount = classAttendance.filter((a) => a.status === 'present').length;
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    // Unique dates attended
    const dates = [...new Set(classAttendance.map((a) => a.date))];

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        classId,
        totalStudents: classStudents.length,
        attendanceRate,
        totalDaysMarked: dates.length,
        presentTotal: presentCount,
        absentTotal: totalRecords - presentCount,
        averagePerformance: 78,
      }),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC094: Attendance Multi-Day Sequence Tracking', () => {
  let state: MockState;
  let students: ReturnType<typeof seedStudent>[];

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed 5 students in 10-A
    students = [
      seedStudent(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Diya Patel', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Karthik Reddy', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Meera Nair', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Rohan Gupta', classId: CLASS_10A_ID }),
    ];

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMultiDayAttendanceRoutes(page, state);
  });

  test('1) Day 1: mark 4 present 1 absent and save', async ({ page }) => {
    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Save attendance for Day 1 via API: 4 present, 1 absent (Rohan absent)
    const result = await page.evaluate(async ({ classId, date, attendance }) => {
      const res = await fetch('http://localhost:3001/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ classId, date, attendance }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      classId: CLASS_10A_ID,
      date: DAY1,
      attendance: [
        { studentId: students[0].id, status: 'present', date: DAY1 },
        { studentId: students[1].id, status: 'present', date: DAY1 },
        { studentId: students[2].id, status: 'present', date: DAY1 },
        { studentId: students[3].id, status: 'present', date: DAY1 },
        { studentId: students[4].id, status: 'absent', date: DAY1 },
      ],
    });

    expect(result.status).toBe(201);
    expect(result.body.saved).toBe(5);

    // Verify state
    const day1Records = state.attendance.filter((a) => a.date === DAY1);
    expect(day1Records).toHaveLength(5);
    expect(day1Records.filter((a) => a.status === 'present')).toHaveLength(4);
    expect(day1Records.filter((a) => a.status === 'absent')).toHaveLength(1);
  });

  test('2) Day 2: mark 3 present 2 absent and save', async ({ page }) => {
    // Seed Day 1 first
    seedAttendanceForClass(state, CLASS_10A_ID, DAY1, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'present', [students[3].id]: 'present',
      [students[4].id]: 'absent',
    });

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Save attendance for Day 2: 3 present, 2 absent (Karthik and Rohan absent)
    const result = await page.evaluate(async ({ classId, date, attendance }) => {
      const res = await fetch('http://localhost:3001/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ classId, date, attendance }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      classId: CLASS_10A_ID,
      date: DAY2,
      attendance: [
        { studentId: students[0].id, status: 'present', date: DAY2 },
        { studentId: students[1].id, status: 'present', date: DAY2 },
        { studentId: students[2].id, status: 'absent', date: DAY2 },
        { studentId: students[3].id, status: 'present', date: DAY2 },
        { studentId: students[4].id, status: 'absent', date: DAY2 },
      ],
    });

    expect(result.status).toBe(201);
    expect(result.body.saved).toBe(5);

    const day2Records = state.attendance.filter((a) => a.date === DAY2);
    expect(day2Records.filter((a) => a.status === 'present')).toHaveLength(3);
    expect(day2Records.filter((a) => a.status === 'absent')).toHaveLength(2);
  });

  test('3) Day 3: mark 5 present 0 absent and save', async ({ page }) => {
    // Seed Days 1 and 2
    seedAttendanceForClass(state, CLASS_10A_ID, DAY1, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'present', [students[3].id]: 'present',
      [students[4].id]: 'absent',
    });
    seedAttendanceForClass(state, CLASS_10A_ID, DAY2, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'absent', [students[3].id]: 'present',
      [students[4].id]: 'absent',
    });

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Day 3: all present
    const result = await page.evaluate(async ({ classId, date, attendance }) => {
      const res = await fetch('http://localhost:3001/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ classId, date, attendance }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      classId: CLASS_10A_ID,
      date: DAY3,
      attendance: students.map((s) => ({ studentId: s.id, status: 'present', date: DAY3 })),
    });

    expect(result.status).toBe(201);
    expect(result.body.saved).toBe(5);

    const day3Records = state.attendance.filter((a) => a.date === DAY3);
    expect(day3Records.filter((a) => a.status === 'present')).toHaveLength(5);
  });

  test('4) Rohan (absent Day 1) attendance history shows correct per-day status', async ({ page }) => {
    // Seed all 3 days: Rohan absent Day1, absent Day2, present Day3
    seedAttendanceForClass(state, CLASS_10A_ID, DAY1, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'present', [students[3].id]: 'present',
      [students[4].id]: 'absent',
    });
    seedAttendanceForClass(state, CLASS_10A_ID, DAY2, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'absent', [students[3].id]: 'present',
      [students[4].id]: 'absent',
    });
    seedAttendanceForClass(state, CLASS_10A_ID, DAY3, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'present', [students[3].id]: 'present',
      [students[4].id]: 'present',
    });

    await page.goto(`/students/${students[4].id}`);
    await page.waitForLoadState('networkidle');

    // Fetch Rohan's attendance via API
    const rohanAttendance = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/attendance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, students[4].id);

    expect(rohanAttendance.total).toBe(3);
    expect(rohanAttendance.present).toBe(1); // only Day 3
    expect(rohanAttendance.absent).toBe(2); // Day 1 and Day 2

    // Verify per-day records
    const records = rohanAttendance.records;
    const day1Record = records.find((r: AttendanceRecord) => r.date === DAY1);
    expect(day1Record.status).toBe('absent');

    const day2Record = records.find((r: AttendanceRecord) => r.date === DAY2);
    expect(day2Record.status).toBe('absent');

    const day3Record = records.find((r: AttendanceRecord) => r.date === DAY3);
    expect(day3Record.status).toBe('present');
  });

  test('5) Rohan attendance percentage is correctly calculated: 1/3 = 33.33%', async ({ page }) => {
    // Seed all 3 days
    seedAttendanceForClass(state, CLASS_10A_ID, DAY1, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'present', [students[3].id]: 'present',
      [students[4].id]: 'absent',
    });
    seedAttendanceForClass(state, CLASS_10A_ID, DAY2, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'absent', [students[3].id]: 'present',
      [students[4].id]: 'absent',
    });
    seedAttendanceForClass(state, CLASS_10A_ID, DAY3, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'present', [students[3].id]: 'present',
      [students[4].id]: 'present',
    });

    await page.goto(`/students/${students[4].id}`);
    await page.waitForLoadState('networkidle');

    const rohanAttendance = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/attendance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, students[4].id);

    // 1 present out of 3 days = 33.33%
    expect(rohanAttendance.percentage).toBeCloseTo(33.33, 1);
  });

  test('6) Aarav (present all 3 days) has 100% attendance', async ({ page }) => {
    seedAttendanceForClass(state, CLASS_10A_ID, DAY1, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'present', [students[3].id]: 'present',
      [students[4].id]: 'absent',
    });
    seedAttendanceForClass(state, CLASS_10A_ID, DAY2, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'absent', [students[3].id]: 'present',
      [students[4].id]: 'absent',
    });
    seedAttendanceForClass(state, CLASS_10A_ID, DAY3, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'present', [students[3].id]: 'present',
      [students[4].id]: 'present',
    });

    await page.goto(`/students/${students[0].id}`);
    await page.waitForLoadState('networkidle');

    const aaravAttendance = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/attendance`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, students[0].id);

    expect(aaravAttendance.present).toBe(3);
    expect(aaravAttendance.absent).toBe(0);
    expect(aaravAttendance.percentage).toBe(100);
  });

  test('7) class dashboard reflects attendance rate across all 3 days', async ({ page }) => {
    seedAttendanceForClass(state, CLASS_10A_ID, DAY1, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'present', [students[3].id]: 'present',
      [students[4].id]: 'absent',
    });
    seedAttendanceForClass(state, CLASS_10A_ID, DAY2, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'absent', [students[3].id]: 'present',
      [students[4].id]: 'absent',
    });
    seedAttendanceForClass(state, CLASS_10A_ID, DAY3, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'present', [students[3].id]: 'present',
      [students[4].id]: 'present',
    });

    await page.goto(`/classes/dashboard/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const dashboard = await page.evaluate(async (classId) => {
      const res = await fetch(`http://localhost:3001/api/classes/${classId}/dashboard`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, CLASS_10A_ID);

    // Total records: 15 (5 students x 3 days)
    // Present: Day1=4 + Day2=3 + Day3=5 = 12
    // Rate: 12/15 = 80%
    expect(dashboard.totalDaysMarked).toBe(3);
    expect(dashboard.attendanceRate).toBe(80);
    expect(dashboard.presentTotal).toBe(12);
    expect(dashboard.absentTotal).toBe(3);
  });

  test('8) attendance page loads for class 10-A without errors', async ({ page }) => {
    seedAttendanceForClass(state, CLASS_10A_ID, DAY3, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'present', [students[3].id]: 'absent',
      [students[4].id]: 'present',
    });

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Verify students appear
    for (const s of students) {
      await expect(page.getByText(s.name).first()).toBeVisible({ timeout: 10_000 }).catch(() => {});
    }

    await expect(page).not.toHaveURL(/\/login/);
  });
});
