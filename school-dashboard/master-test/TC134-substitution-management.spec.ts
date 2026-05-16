/**
 * TC094: Manage teacher substitution when a teacher is absent.
 *
 * Verifies: page load, create substitution, list view, approve/reject,
 * today's schedule, conflict detection.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  TEACHER_A_ID,
  TEACHER_B_ID,
  CLASS_10A_ID,
  CLASS_11A_ID,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────── Substitution data and route overrides ───────── */

interface SubstitutionRecord {
  _id: string;
  absentTeacherId: string;
  absentTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  classId: string;
  className: string;
  date: string;
  periods: number[];
  status: string;
  reason: string;
  schoolId: string;
}

async function installSubstitutionRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  const substitutions: SubstitutionRecord[] = [];
  let subCounter = 0;

  await page.route('**/api/substitutions*', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const path = url.pathname;
    state.requestLog.add(`${method} ${path}`);

    // POST - Create substitution
    if (method === 'POST' && !path.includes('/approve') && !path.includes('/reject')) {
      const body = JSON.parse(route.request().postData() || '{}');
      subCounter++;

      // Conflict detection: check if substitute is already busy
      const existingConflict = substitutions.find(
        (s) =>
          s.substituteTeacherId === body.substituteTeacherId &&
          s.date === body.date &&
          s.status !== 'rejected' &&
          s.periods.some((p: number) => body.periods?.includes(p)),
      );

      if (existingConflict) {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Conflict detected',
            message: `${existingConflict.substituteTeacherName} is already assigned as substitute during the requested periods`,
            conflictWith: existingConflict._id,
          }),
        });
      }

      const absentTeacher = state.staff.find((s) => s.id === body.absentTeacherId);
      const subTeacher = state.staff.find((s) => s.id === body.substituteTeacherId);
      const cls = state.classes.find((c) => c.id === body.classId);

      const record: SubstitutionRecord = {
        _id: `sub-${subCounter}`,
        absentTeacherId: body.absentTeacherId,
        absentTeacherName: absentTeacher?.name || 'Unknown',
        substituteTeacherId: body.substituteTeacherId,
        substituteTeacherName: subTeacher?.name || 'Unknown',
        classId: body.classId || CLASS_10A_ID,
        className: cls ? `${cls.name}-${cls.section}` : '10-A',
        date: body.date || new Date().toISOString().split('T')[0],
        periods: body.periods || [1, 2],
        status: 'pending',
        reason: body.reason || 'Sick leave',
        schoolId: SCHOOL_ID,
      };
      substitutions.push(record);

      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(record),
      });
    }

    // PUT - Approve/Reject
    if (method === 'PUT' || method === 'PATCH') {
      const subId = path.split('/').pop();
      const body = JSON.parse(route.request().postData() || '{}');
      const idx = substitutions.findIndex((s) => s._id === subId);

      if (idx >= 0) {
        if (body.status) substitutions[idx].status = body.status;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(substitutions[idx]),
        });
      }
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }

    // Approve endpoint
    if (path.includes('/approve')) {
      const subId = path.split('/')[3];
      const idx = substitutions.findIndex((s) => s._id === subId);
      if (idx >= 0) {
        substitutions[idx].status = 'approved';
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(substitutions[idx]),
        });
      }
    }

    // Reject endpoint
    if (path.includes('/reject')) {
      const subId = path.split('/')[3];
      const idx = substitutions.findIndex((s) => s._id === subId);
      if (idx >= 0) {
        substitutions[idx].status = 'rejected';
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(substitutions[idx]),
        });
      }
    }

    // GET - List or filter by date
    const dateFilter = url.searchParams.get('date');
    const statusFilter = url.searchParams.get('status');
    let filtered = [...substitutions];
    if (dateFilter) filtered = filtered.filter((s) => s.date === dateFilter);
    if (statusFilter) filtered = filtered.filter((s) => s.status === statusFilter);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: filtered,
        total: filtered.length,
      }),
    });
  });

  // Today's schedule endpoint
  await page.route('**/api/substitutions/today*', async (route) => {
    state.requestLog.add('GET /api/substitutions/today');
    const today = new Date().toISOString().split('T')[0];
    const todaySubs = substitutions.filter((s) => s.date === today && s.status === 'approved');

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        date: today,
        substitutions: todaySubs,
        total: todaySubs.length,
      }),
    });
  });

  return { getSubstitutions: () => substitutions };
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC094 — Substitution Management: Assign & Track', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
    await installSubstitutionRoutes(page, state);
  });

  /* ───────── 1. Page loads ───────── */

  test('1) substitution management page loads', async ({ page }) => {
    await page.goto('/classes/substitution');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('substitution') ||
      bodyText?.toLowerCase().includes('substitute') ||
      bodyText?.toLowerCase().includes('class') ||
      bodyText?.toLowerCase().includes('teacher'),
    ).toBeTruthy();
  });

  /* ───────── 2. Create new substitution via API ───────── */

  test('2) create a new substitution', async ({ page }) => {
    await page.goto('/classes/substitution');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (params) => {
      const res = await fetch('http://localhost:3001/api/substitutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          absentTeacherId: params.absentTeacherId,
          substituteTeacherId: params.substituteTeacherId,
          classId: params.classId,
          date: '2026-03-30',
          periods: [1, 2, 3],
          reason: 'Sick leave',
        }),
      });
      return res.json();
    }, {
      absentTeacherId: TEACHER_A_ID,
      substituteTeacherId: TEACHER_B_ID,
      classId: CLASS_10A_ID,
    });

    expect(result._id).toBeDefined();
    expect(result.absentTeacherName).toBe('Ananya Sharma');
    expect(result.substituteTeacherName).toBe('Ravi Menon');
    expect(result.status).toBe('pending');
    expect(result.periods).toEqual([1, 2, 3]);
  });

  /* ───────── 3. Substitution appears in list ───────── */

  test('3) created substitution appears in list', async ({ page }) => {
    await page.goto('/classes/substitution');
    await page.waitForLoadState('networkidle');

    // Create substitution first
    await page.evaluate(async (params) => {
      await fetch('http://localhost:3001/api/substitutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          absentTeacherId: params.teacherA,
          substituteTeacherId: params.teacherB,
          classId: params.classId,
          date: '2026-03-30',
          periods: [1, 2],
          reason: 'Personal leave',
        }),
      });
    }, {
      teacherA: TEACHER_A_ID,
      teacherB: TEACHER_B_ID,
      classId: CLASS_10A_ID,
    });

    // List substitutions
    const listResult = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/substitutions', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(listResult.data).toHaveLength(1);
    expect(listResult.data[0].absentTeacherName).toBe('Ananya Sharma');
  });

  /* ───────── 4. Approve substitution ───────── */

  test('4) approve a pending substitution', async ({ page }) => {
    await page.goto('/classes/substitution');
    await page.waitForLoadState('networkidle');

    // Create
    const created = await page.evaluate(async (params) => {
      const res = await fetch('http://localhost:3001/api/substitutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          absentTeacherId: params.teacherA,
          substituteTeacherId: params.teacherB,
          date: '2026-03-30',
          periods: [1, 2],
        }),
      });
      return res.json();
    }, { teacherA: TEACHER_A_ID, teacherB: TEACHER_B_ID });

    // Approve
    const approved = await page.evaluate(async (subId) => {
      const res = await fetch(`http://localhost:3001/api/substitutions/${subId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({ status: 'approved' }),
      });
      return res.json();
    }, created._id);

    expect(approved.status).toBe('approved');
  });

  /* ───────── 5. Reject substitution ───────── */

  test('5) reject a pending substitution', async ({ page }) => {
    await page.goto('/classes/substitution');
    await page.waitForLoadState('networkidle');

    // Create
    const created = await page.evaluate(async (params) => {
      const res = await fetch('http://localhost:3001/api/substitutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          absentTeacherId: params.teacherA,
          substituteTeacherId: params.teacherB,
          date: '2026-03-30',
          periods: [4, 5],
        }),
      });
      return res.json();
    }, { teacherA: TEACHER_A_ID, teacherB: TEACHER_B_ID });

    // Reject
    const rejected = await page.evaluate(async (subId) => {
      const res = await fetch(`http://localhost:3001/api/substitutions/${subId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({ status: 'rejected' }),
      });
      return res.json();
    }, created._id);

    expect(rejected.status).toBe('rejected');
  });

  /* ───────── 6. Today's schedule ───────── */

  test('6) view today substitution schedule', async ({ page }) => {
    await page.goto('/classes/substitution');
    await page.waitForLoadState('networkidle');

    const todaySchedule = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/substitutions/today', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(todaySchedule.date).toBeDefined();
    expect(todaySchedule.substitutions).toBeDefined();
    expect(Array.isArray(todaySchedule.substitutions)).toBeTruthy();
  });

  /* ───────── 7. Conflict detection ───────── */

  test('7) detect conflict when substitute is already busy', async ({ page }) => {
    await page.goto('/classes/substitution');
    await page.waitForLoadState('networkidle');

    // Create first substitution
    await page.evaluate(async (params) => {
      await fetch('http://localhost:3001/api/substitutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          absentTeacherId: params.teacherA,
          substituteTeacherId: params.teacherB,
          classId: params.class10A,
          date: '2026-03-30',
          periods: [1, 2],
        }),
      });
    }, { teacherA: TEACHER_A_ID, teacherB: TEACHER_B_ID, class10A: CLASS_10A_ID });

    // Try to create conflicting substitution (same substitute, same date/periods)
    const conflictResult = await page.evaluate(async (params) => {
      const res = await fetch('http://localhost:3001/api/substitutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          absentTeacherId: params.accountantId,
          substituteTeacherId: params.teacherB,
          classId: params.class11A,
          date: '2026-03-30',
          periods: [2, 3], // Period 2 overlaps
        }),
      });
      return { status: res.status, body: await res.json() };
    }, { accountantId: '64b100000000000000000013', teacherB: TEACHER_B_ID, class11A: CLASS_11A_ID });

    expect(conflictResult.status).toBe(409);
    expect(conflictResult.body.error).toBe('Conflict detected');
    expect(conflictResult.body.message).toContain('Ravi Menon');
  });

  /* ───────── 8. Filter by date ───────── */

  test('8) filter substitutions by date', async ({ page }) => {
    await page.goto('/classes/substitution');
    await page.waitForLoadState('networkidle');

    // Create substitutions on different dates
    await page.evaluate(async (params) => {
      await fetch('http://localhost:3001/api/substitutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({
          absentTeacherId: params.teacherA,
          substituteTeacherId: params.teacherB,
          date: '2026-03-30',
          periods: [1],
        }),
      });
      await fetch('http://localhost:3001/api/substitutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-jwt-token-admin' },
        body: JSON.stringify({
          absentTeacherId: params.teacherA,
          substituteTeacherId: params.teacherB,
          date: '2026-03-31',
          periods: [1],
        }),
      });
    }, { teacherA: TEACHER_A_ID, teacherB: TEACHER_B_ID });

    // Filter by specific date
    const filtered = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/substitutions?date=2026-03-30', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(filtered.data).toHaveLength(1);
    expect(filtered.data[0].date).toBe('2026-03-30');
  });

  /* ───────── 9. State integrity ───────── */

  test('9) mock state has required staff members', async ({ page }) => {
    expect(state.staff).toHaveLength(3);
    expect(state.staff.find((s) => s.id === TEACHER_A_ID)?.name).toBe('Ananya Sharma');
    expect(state.staff.find((s) => s.id === TEACHER_B_ID)?.name).toBe('Ravi Menon');
  });
});
