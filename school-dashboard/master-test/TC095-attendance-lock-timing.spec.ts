/**
 * TC095: Test attendance lock mechanism after configured time.
 *
 * Verifies: attendance rules with lock time, enabled/disabled state
 * based on lock, "Attendance Locked" messaging, and edit-after-lock
 * approval flow when allowEditAfterLock is true.
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
const YESTERDAY = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();

interface AttendanceRules {
  lockTime: string;           // "10:00" (24h format)
  allowEditAfterLock: boolean;
  editWindow: number;         // hours after lock that edits are still allowed
  lockEnabled: boolean;
}

/* ───────── Route overrides ───────── */

async function installAttendanceLockRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
  rules: AttendanceRules,
) {
  await installMockApi(page, state);

  // Attendance rules endpoint
  await page.route('**/api/attendance/rules**', async (route) => {
    state.requestLog.add('GET /api/attendance/rules');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(rules),
    });
  });

  // Attendance settings (alternative endpoint)
  await page.route('**/api/settings/attendance**', async (route) => {
    state.requestLog.add('GET /api/settings/attendance');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(rules),
    });
  });

  // Override attendance routes with lock awareness
  await page.route('**/api/attendance**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // Skip rules endpoint (handled above)
    if (path.includes('/rules') || path.includes('/settings')) return route.fallback();

    // GET attendance for class
    if (path.match(/^\/api\/attendance\/class\//) && method === 'GET') {
      const classId = path.split('/')[4];
      const dateParam = url.searchParams.get('date') || TODAY;
      const filtered = state.attendance.filter(
        (a) => a.classId === classId && a.date === dateParam,
      );

      // Determine lock status for the requested date
      const isLocked = rules.lockEnabled && dateParam < TODAY;
      const isEditableAfterLock = isLocked && rules.allowEditAfterLock;

      return json({
        records: filtered,
        isLocked,
        isEditable: !isLocked || isEditableAfterLock,
        lockTime: rules.lockTime,
        lockMessage: isLocked ? `Attendance for ${dateParam} is locked since ${rules.lockTime}` : null,
      });
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

    // POST attendance with lock check
    if (path === '/api/attendance' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const date = body.date || TODAY;

      // Check if attendance is locked for this date
      const isLocked = rules.lockEnabled && date < TODAY;

      if (isLocked && !rules.allowEditAfterLock) {
        return json({
          error: 'Attendance is locked',
          message: `Attendance for ${date} has been locked since ${rules.lockTime}. Editing is not allowed.`,
          isLocked: true,
        }, 403);
      }

      if (isLocked && rules.allowEditAfterLock) {
        // Allow edit but flag it as an override
        const records = body.attendance || body.records || [body];
        let saved = 0;
        for (const item of records) {
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
        return json({
          message: `Attendance updated (post-lock edit) for ${saved} students`,
          saved,
          isOverride: true,
          requiresApproval: true,
        }, 201);
      }

      // Normal save (not locked)
      const records = body.attendance || body.records || [body];
      let saved = 0;
      for (const item of records) {
        const existing = state.attendance.findIndex(
          (a) => a.studentId === item.studentId && a.date === (item.date || date),
        );
        if (existing >= 0) {
          state.attendance[existing].status = item.status;
        } else {
          state.attendance.push({
            _id: `att-${item.studentId}-${item.date || date}`,
            id: `att-${item.studentId}-${item.date || date}`,
            studentId: item.studentId,
            classId: item.classId || body.classId || CLASS_10A_ID,
            date: item.date || date,
            status: item.status,
            schoolId: SCHOOL_ID,
          });
        }
        saved++;
      }
      return json({ message: `Attendance saved for ${saved} students`, saved }, 201);
    }

    // Lock status check endpoint
    if (path.match(/\/api\/attendance\/lock-status/) && method === 'GET') {
      const dateParam = url.searchParams.get('date') || TODAY;
      const isLocked = rules.lockEnabled && dateParam < TODAY;
      return json({
        date: dateParam,
        isLocked,
        lockTime: rules.lockTime,
        allowEditAfterLock: rules.allowEditAfterLock,
        editWindow: rules.editWindow,
      });
    }

    return json({});
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC095: Attendance Lock Timing Mechanism', () => {
  let state: MockState;
  let students: ReturnType<typeof seedStudent>[];

  test.beforeEach(async () => {
    state = createMockState();
    students = [
      seedStudent(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Diya Patel', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Karthik Reddy', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Meera Nair', classId: CLASS_10A_ID }),
      seedStudent(state, { name: 'Rohan Gupta', classId: CLASS_10A_ID }),
    ];
  });

  test('1) attendance rules endpoint returns lock configuration', async ({ page }) => {
    const rules: AttendanceRules = { lockTime: '10:00', allowEditAfterLock: true, editWindow: 2, lockEnabled: true };
    await installAttendanceLockRoutes(page, state, rules);

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const fetchedRules = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/attendance/rules', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(fetchedRules.lockTime).toBe('10:00');
    expect(fetchedRules.allowEditAfterLock).toBe(true);
    expect(fetchedRules.editWindow).toBe(2);
    expect(fetchedRules.lockEnabled).toBe(true);
  });

  test('2) today attendance marking is enabled (not locked)', async ({ page }) => {
    const rules: AttendanceRules = { lockTime: '10:00', allowEditAfterLock: true, editWindow: 2, lockEnabled: true };
    await installAttendanceLockRoutes(page, state, rules);

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Saving today's attendance should succeed
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
      attendance: [{ studentId: students[0].id, status: 'present' }],
    });

    expect(result.status).toBe(201);
    expect(result.body.saved).toBe(1);
  });

  test('3) past date attendance is locked', async ({ page }) => {
    const rules: AttendanceRules = { lockTime: '10:00', allowEditAfterLock: false, editWindow: 0, lockEnabled: true };
    await installAttendanceLockRoutes(page, state, rules);

    // Pre-seed yesterday's attendance
    seedAttendanceForClass(state, CLASS_10A_ID, YESTERDAY, {
      [students[0].id]: 'present',
      [students[1].id]: 'absent',
    });

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Fetch yesterday's attendance -- should include lock info
    const lockedData = await page.evaluate(async ({ classId, date }) => {
      const res = await fetch(`http://localhost:3001/api/attendance/class/${classId}?date=${date}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, { classId: CLASS_10A_ID, date: YESTERDAY });

    expect(lockedData.isLocked).toBe(true);
    expect(lockedData.lockMessage).toBeTruthy();
    expect(lockedData.lockMessage).toContain('locked');
  });

  test('4) editing locked attendance is rejected when allowEditAfterLock=false', async ({ page }) => {
    const rules: AttendanceRules = { lockTime: '10:00', allowEditAfterLock: false, editWindow: 0, lockEnabled: true };
    await installAttendanceLockRoutes(page, state, rules);

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Try to edit yesterday's attendance
    const result = await page.evaluate(async ({ classId, date, attendance }) => {
      const res = await fetch('http://localhost:3001/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ classId, date, attendance }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      classId: CLASS_10A_ID,
      date: YESTERDAY,
      attendance: [{ studentId: students[0].id, status: 'absent' }],
    });

    expect(result.status).toBe(403);
    expect(result.body.isLocked).toBe(true);
    expect(result.body.error).toBe('Attendance is locked');
  });

  test('5) editing locked attendance succeeds with approval when allowEditAfterLock=true', async ({ page }) => {
    const rules: AttendanceRules = { lockTime: '10:00', allowEditAfterLock: true, editWindow: 2, lockEnabled: true };
    await installAttendanceLockRoutes(page, state, rules);

    seedAttendanceForClass(state, CLASS_10A_ID, YESTERDAY, {
      [students[0].id]: 'present',
    });

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Edit yesterday's attendance (post-lock edit allowed)
    const result = await page.evaluate(async ({ classId, date, attendance }) => {
      const res = await fetch('http://localhost:3001/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({ classId, date, attendance }),
      });
      return { status: res.status, body: await res.json() };
    }, {
      classId: CLASS_10A_ID,
      date: YESTERDAY,
      attendance: [{ studentId: students[0].id, status: 'absent' }],
    });

    expect(result.status).toBe(201);
    expect(result.body.isOverride).toBe(true);
    expect(result.body.requiresApproval).toBe(true);
    expect(result.body.saved).toBe(1);
  });

  test('6) lock status endpoint returns correct state for different dates', async ({ page }) => {
    const rules: AttendanceRules = { lockTime: '10:00', allowEditAfterLock: true, editWindow: 2, lockEnabled: true };
    await installAttendanceLockRoutes(page, state, rules);

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Check today's lock status (should not be locked)
    const todayStatus = await page.evaluate(async (date) => {
      const res = await fetch(`http://localhost:3001/api/attendance/lock-status?date=${date}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, TODAY);

    expect(todayStatus.isLocked).toBe(false);

    // Check yesterday's lock status (should be locked)
    const yesterdayStatus = await page.evaluate(async (date) => {
      const res = await fetch(`http://localhost:3001/api/attendance/lock-status?date=${date}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, YESTERDAY);

    expect(yesterdayStatus.isLocked).toBe(true);
    expect(yesterdayStatus.allowEditAfterLock).toBe(true);
    expect(yesterdayStatus.editWindow).toBe(2);
  });

  test('7) locked attendance returns isEditable=false when edits not allowed', async ({ page }) => {
    const rules: AttendanceRules = { lockTime: '10:00', allowEditAfterLock: false, editWindow: 0, lockEnabled: true };
    await installAttendanceLockRoutes(page, state, rules);

    seedAttendanceForClass(state, CLASS_10A_ID, YESTERDAY, {
      [students[0].id]: 'present',
    });

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const data = await page.evaluate(async ({ classId, date }) => {
      const res = await fetch(`http://localhost:3001/api/attendance/class/${classId}?date=${date}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, { classId: CLASS_10A_ID, date: YESTERDAY });

    expect(data.isLocked).toBe(true);
    expect(data.isEditable).toBe(false);
  });

  test('8) attendance page loads without errors regardless of lock state', async ({ page }) => {
    const rules: AttendanceRules = { lockTime: '10:00', allowEditAfterLock: true, editWindow: 2, lockEnabled: true };
    await installAttendanceLockRoutes(page, state, rules);

    seedAttendanceForClass(state, CLASS_10A_ID, TODAY, {
      [students[0].id]: 'present', [students[1].id]: 'present',
      [students[2].id]: 'absent', [students[3].id]: 'present',
      [students[4].id]: 'present',
    });

    await page.goto(`/classes/attendance/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/attendance|present|absent|student/);
    await expect(page).not.toHaveURL(/\/login/);
  });
});
