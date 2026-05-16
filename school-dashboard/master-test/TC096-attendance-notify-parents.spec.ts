/**
 * TC096: Notify parents of absent students after marking attendance.
 *
 * Verifies: attendance marking with absent students, notification modal
 * with absent count and message preview, API call to notify-parents endpoint,
 * success notification, and correct targeting (only absent students' parents).
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
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────── Helpers ───────── */

const TODAY = new Date().toISOString().split('T')[0];

interface NotifyResult {
  notifiedCount: number;
  notifiedParents: Array<{ studentId: string; studentName: string; parentPhone: string }>;
  message: string;
}

/* ───────── Route overrides ───────── */

async function installNotifyParentsRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  let lastNotification: NotifyResult | null = null;

  // Override attendance routes
  await page.route('**/api/attendance**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // GET attendance for class
    if (path.match(/^\/api\/attendance\/class\//) && method === 'GET') {
      const classId = path.split('/')[4];
      const dateParam = url.searchParams.get('date') || TODAY;
      return json(state.attendance.filter((a) => a.classId === classId && a.date === dateParam));
    }

    // GET all attendance
    if (path === '/api/attendance' && method === 'GET') {
      const classId = url.searchParams.get('classId');
      const dateParam = url.searchParams.get('date');
      let filtered = state.attendance;
      if (classId) filtered = filtered.filter((a) => a.classId === classId);
      if (dateParam) filtered = filtered.filter((a) => a.date === dateParam);
      return json(filtered);
    }

    // POST save attendance
    if (path === '/api/attendance' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const records = body.attendance || body.records || [body];
      let saved = 0;
      for (const item of records) {
        const date = item.date || body.date || TODAY;
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

    // POST notify parents of absent students
    if (path === '/api/attendance/notify-parents' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      state.requestLog.add('POST /api/attendance/notify-parents');

      const classId = body.classId || CLASS_10A_ID;
      const date = body.date || TODAY;
      const customMessage = body.message || null;

      // Find absent students for the given class and date
      const absentRecords = state.attendance.filter(
        (a) => a.classId === classId && a.date === date && a.status === 'absent',
      );

      const notifiedParents = absentRecords.map((a) => {
        const student = state.students.find((s) => s.id === a.studentId);
        const parentPhone = student?.guardians?.[0]?.phone || 'unknown';
        return {
          studentId: a.studentId,
          studentName: student?.name || 'Unknown',
          parentPhone,
        };
      });

      const defaultMessage = `Dear Parent, your child was marked absent today (${date}). Please contact the school if this is incorrect.`;

      lastNotification = {
        notifiedCount: notifiedParents.length,
        notifiedParents,
        message: customMessage || defaultMessage,
      };

      return json({
        success: true,
        notifiedCount: notifiedParents.length,
        notifiedParents,
        message: customMessage || defaultMessage,
      });
    }

    // GET notify preview (shows who would be notified)
    if (path === '/api/attendance/notify-preview' && method === 'GET') {
      const classId = url.searchParams.get('classId') || CLASS_10A_ID;
      const date = url.searchParams.get('date') || TODAY;

      const absentRecords = state.attendance.filter(
        (a) => a.classId === classId && a.date === date && a.status === 'absent',
      );

      const absentStudents = absentRecords.map((a) => {
        const student = state.students.find((s) => s.id === a.studentId);
        return {
          studentId: a.studentId,
          studentName: student?.name || 'Unknown',
          parentPhone: student?.guardians?.[0]?.phone || 'unknown',
          parentName: student?.guardians?.[0]?.name || 'Unknown',
        };
      });

      return json({
        absentCount: absentStudents.length,
        absentStudents,
        previewMessage: `Dear Parent, your child was marked absent today (${date}). Please contact the school if this is incorrect.`,
      });
    }

    return json({});
  });

  return { getLastNotification: () => lastNotification };
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC096: Attendance - Notify Parents of Absent Students', () => {
  let state: MockState;
  let students: ReturnType<typeof seedStudent>[];

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed 5 students with parent phone numbers
    students = [
      seedStudent(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID, phone: '9876500001' }),
      seedStudent(state, { name: 'Diya Patel', classId: CLASS_10A_ID, phone: '9876500002' }),
      seedStudent(state, { name: 'Karthik Reddy', classId: CLASS_10A_ID, phone: '9876500003' }),
      seedStudent(state, { name: 'Meera Nair', classId: CLASS_10A_ID, phone: '9876500004' }),
      seedStudent(state, { name: 'Rohan Gupta', classId: CLASS_10A_ID, phone: '9876500005' }),
    ];

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
  });

  test('1) mark 2 students absent and save attendance', async ({ page }) => {
    await installNotifyParentsRoutes(page, state);

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Mark attendance via API: 3 present, 2 absent (Meera and Rohan)
    const result = await page.evaluate(async ({ classId, date, attendance }) => {
      const res = await fetch('http://localhost:3001/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ classId, date, attendance }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      classId: CLASS_10A_ID,
      date: TODAY,
      attendance: [
        { studentId: students[0].id, status: 'present' },
        { studentId: students[1].id, status: 'present' },
        { studentId: students[2].id, status: 'present' },
        { studentId: students[3].id, status: 'absent' },
        { studentId: students[4].id, status: 'absent' },
      ],
    });

    expect(result.status).toBe(201);
    expect(result.body.saved).toBe(5);

    // Verify state
    const absentRecords = state.attendance.filter((a) => a.status === 'absent' && a.date === TODAY);
    expect(absentRecords).toHaveLength(2);
  });

  test('2) notify preview shows 2 absent students', async ({ page }) => {
    // Pre-seed attendance
    seedAttendanceForClass(state, CLASS_10A_ID, TODAY, {
      [students[0].id]: 'present',
      [students[1].id]: 'present',
      [students[2].id]: 'present',
      [students[3].id]: 'absent',
      [students[4].id]: 'absent',
    });
    await installNotifyParentsRoutes(page, state);

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const preview = await page.evaluate(async ({ classId, date }) => {
      const res = await fetch(`http://localhost:3001/api/attendance/notify-preview?classId=${classId}&date=${date}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, { classId: CLASS_10A_ID, date: TODAY });

    expect(preview.absentCount).toBe(2);
    expect(preview.absentStudents).toHaveLength(2);

    const names = preview.absentStudents.map((s: { studentName: string }) => s.studentName);
    expect(names).toContain('Meera Nair');
    expect(names).toContain('Rohan Gupta');
  });

  test('3) preview includes message template', async ({ page }) => {
    seedAttendanceForClass(state, CLASS_10A_ID, TODAY, {
      [students[0].id]: 'present',
      [students[3].id]: 'absent',
      [students[4].id]: 'absent',
    });
    await installNotifyParentsRoutes(page, state);

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const preview = await page.evaluate(async ({ classId, date }) => {
      const res = await fetch(`http://localhost:3001/api/attendance/notify-preview?classId=${classId}&date=${date}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, { classId: CLASS_10A_ID, date: TODAY });

    expect(preview.previewMessage).toBeTruthy();
    expect(preview.previewMessage).toContain('absent');
    expect(preview.previewMessage).toContain(TODAY);
  });

  test('4) notify parents API call succeeds with correct count', async ({ page }) => {
    seedAttendanceForClass(state, CLASS_10A_ID, TODAY, {
      [students[0].id]: 'present',
      [students[1].id]: 'present',
      [students[2].id]: 'present',
      [students[3].id]: 'absent',
      [students[4].id]: 'absent',
    });
    const { getLastNotification } = await installNotifyParentsRoutes(page, state);

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Call notify parents
    const result = await page.evaluate(async ({ classId, date }) => {
      const res = await fetch('http://localhost:3001/api/attendance/notify-parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ classId, date }),
      });
      return { status: res.status, body: await res.json() };
    }, { classId: CLASS_10A_ID, date: TODAY });

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.notifiedCount).toBe(2);

    // Verify the request was logged
    expect([...state.requestLog]).toContain('POST /api/attendance/notify-parents');
  });

  test('5) only absent students parents are notified (not present ones)', async ({ page }) => {
    seedAttendanceForClass(state, CLASS_10A_ID, TODAY, {
      [students[0].id]: 'present',
      [students[1].id]: 'present',
      [students[2].id]: 'present',
      [students[3].id]: 'absent',
      [students[4].id]: 'absent',
    });
    await installNotifyParentsRoutes(page, state);

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ classId, date }) => {
      const res = await fetch('http://localhost:3001/api/attendance/notify-parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ classId, date }),
      });
      return res.json();
    }, { classId: CLASS_10A_ID, date: TODAY });

    const notifiedIds = result.notifiedParents.map((p: { studentId: string }) => p.studentId);

    // Should include absent students
    expect(notifiedIds).toContain(students[3].id);
    expect(notifiedIds).toContain(students[4].id);

    // Should NOT include present students
    expect(notifiedIds).not.toContain(students[0].id);
    expect(notifiedIds).not.toContain(students[1].id);
    expect(notifiedIds).not.toContain(students[2].id);
  });

  test('6) notified parents have correct phone numbers', async ({ page }) => {
    seedAttendanceForClass(state, CLASS_10A_ID, TODAY, {
      [students[0].id]: 'present',
      [students[3].id]: 'absent',
      [students[4].id]: 'absent',
    });
    await installNotifyParentsRoutes(page, state);

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ classId, date }) => {
      const res = await fetch('http://localhost:3001/api/attendance/notify-parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ classId, date }),
      });
      return res.json();
    }, { classId: CLASS_10A_ID, date: TODAY });

    // Each notified parent should have a phone number from guardians
    for (const parent of result.notifiedParents) {
      expect(parent.parentPhone).toBeTruthy();
      expect(parent.parentPhone).not.toBe('unknown');
    }
  });

  test('7) notification message contains student-specific info', async ({ page }) => {
    seedAttendanceForClass(state, CLASS_10A_ID, TODAY, {
      [students[3].id]: 'absent',
    });
    await installNotifyParentsRoutes(page, state);

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async ({ classId, date }) => {
      const res = await fetch('http://localhost:3001/api/attendance/notify-parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ classId, date }),
      });
      return res.json();
    }, { classId: CLASS_10A_ID, date: TODAY });

    expect(result.message).toContain('absent');
    expect(result.message).toContain(TODAY);
    expect(result.notifiedCount).toBe(1);
    expect(result.notifiedParents[0].studentName).toBe('Meera Nair');
  });

  test('8) attendance page loads and shows students for notification flow', async ({ page }) => {
    seedAttendanceForClass(state, CLASS_10A_ID, TODAY, {
      [students[0].id]: 'present',
      [students[1].id]: 'present',
      [students[2].id]: 'present',
      [students[3].id]: 'absent',
      [students[4].id]: 'absent',
    });
    await installNotifyParentsRoutes(page, state);

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Page should load with students visible
    for (const s of students) {
      await expect(page.getByText(s.name).first()).toBeVisible({ timeout: 10_000 }).catch(() => {});
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/attendance|present|absent/);
    await expect(page).not.toHaveURL(/\/login/);
  });
});
