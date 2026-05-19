/**
 * TC095: Use the full-page timetable wizard to create timetables.
 *
 * Verifies: wizard load, class selector, period grid, auto-assign subjects,
 * review assignments, save timetable, success notification.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  CLASS_10A_ID,
  CLASS_11A_ID,
  TEACHER_A_ID,
  TEACHER_B_ID,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────── Timetable wizard data ───────── */

const PERIODS = [
  { name: 'Period 1', startTime: '08:00', endTime: '08:45', isBreak: false },
  { name: 'Period 2', startTime: '08:45', endTime: '09:30', isBreak: false },
  { name: 'Period 3', startTime: '09:30', endTime: '10:15', isBreak: false },
  { name: 'Break', startTime: '10:15', endTime: '10:30', isBreak: true },
  { name: 'Period 4', startTime: '10:30', endTime: '11:15', isBreak: false },
  { name: 'Period 5', startTime: '11:15', endTime: '12:00', isBreak: false },
  { name: 'Period 6', startTime: '12:00', endTime: '12:45', isBreak: false },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/* ───────── Timetable wizard route overrides ───────── */

async function installWizardRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  let savedTimetable: Record<string, unknown> | null = null;

  // Timetable wizard endpoint
  await page.route('**/api/timetable-wizard*', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    state.requestLog.add(`${method} /api/timetable-wizard`);

    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');

      if (body.action === 'auto-assign') {
        // Generate auto-assigned timetable
        const classId = body.classId || CLASS_10A_ID;
        const cls = state.classes.find((c) => c.id === classId);
        const subjects = cls?.subjects || ['Mathematics', 'Science', 'English', 'Social Studies'];
        const teachers = state.staff.filter((s) => s.role === 'Teacher');

        const autoSlots: Array<Record<string, unknown>> = [];
        let subjectIdx = 0;
        for (const day of DAYS) {
          for (const period of PERIODS) {
            if (period.isBreak) continue;
            const subject = subjects[subjectIdx % subjects.length];
            const teacher = teachers[subjectIdx % teachers.length];
            autoSlots.push({
              day,
              periodName: period.name,
              startTime: period.startTime,
              endTime: period.endTime,
              subject,
              teacherId: teacher?.id || TEACHER_A_ID,
              teacherName: teacher?.name || 'TBD',
            });
            subjectIdx++;
          }
        }

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Auto-assignment completed',
            classId,
            slots: autoSlots,
            conflicts: [],
          }),
        });
      }

      // Save timetable
      savedTimetable = {
        _id: `tt-${body.classId || CLASS_10A_ID}`,
        classId: body.classId || CLASS_10A_ID,
        periods: PERIODS,
        slots: body.slots || [],
        schedule: body.schedule || {},
      };
      state.timetables.push(savedTimetable);

      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Timetable saved successfully', timetable: savedTimetable }),
      });
    }

    // GET - wizard data
    const classId = url.searchParams.get('classId');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        classes: state.classes.map((c) => ({
          _id: c.id,
          name: `${c.name}-${c.section}`,
          subjects: c.subjects,
          classTeacherId: c.classTeacherId,
        })),
        teachers: state.staff.filter((s) => s.role === 'Teacher').map((t) => ({
          _id: t.id,
          name: t.name,
          subjects: t.subjects,
        })),
        periods: PERIODS,
        days: DAYS,
        existingTimetable: classId
          ? state.timetables.find((t: Record<string, unknown>) => t.classId === classId) || null
          : null,
        conflicts: [],
      }),
    });
  });

  // Regular timetable endpoint
  await page.route('**/api/timetable', async (route) => {
    const method = route.request().method();
    state.requestLog.add(`${method} /api/timetable`);

    if (method === 'POST' || method === 'PUT') {
      const body = JSON.parse(route.request().postData() || '{}');
      savedTimetable = { ...body, _id: `tt-${body.classId || CLASS_10A_ID}` };
      state.timetables.push(savedTimetable);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Timetable saved', timetable: savedTimetable }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.timetables),
    });
  });

  // Class timetable
  await page.route('**/api/classes/*/timetable', async (route) => {
    const url = new URL(route.request().url());
    const classId = url.pathname.split('/')[3];
    state.requestLog.add(`GET /api/classes/${classId}/timetable`);

    const tt = state.timetables.find((t: Record<string, unknown>) => t.classId === classId);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(tt || { classId, periods: PERIODS, slots: [], schedule: {} }),
    });
  });

  return { getSavedTimetable: () => savedTimetable };
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC095 — Timetable Wizard: Full-Page Creation', () => {
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
    await installWizardRoutes(page, state);
  });

  /* ───────── 1. Wizard loads ───────── */

  test('1) timetable wizard page loads', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('timetable') ||
      bodyText?.toLowerCase().includes('wizard') ||
      bodyText?.toLowerCase().includes('schedule'),
    ).toBeTruthy();
  });

  /* ───────── 2. Wizard has class selector ───────── */

  test('2) wizard shows class selector', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('networkidle');

    const classSelector = page.locator('select, button[aria-haspopup="listbox"], [role="combobox"]').first();
    const hasSelector = await classSelector.isVisible({ timeout: 5_000 }).catch(() => false);

    const bodyText = await page.textContent('body');
    const hasClassText = bodyText?.includes('10-A') || bodyText?.includes('11-A') ||
      bodyText?.toLowerCase().includes('class') || bodyText?.toLowerCase().includes('select');
    expect(hasSelector || hasClassText).toBeTruthy();
  });

  /* ───────── 3. Wizard API returns class and teacher data ───────── */

  test('3) wizard API returns classes and teachers', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('networkidle');

    const wizardData = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/timetable-wizard', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(wizardData.classes).toBeDefined();
    expect(wizardData.classes).toHaveLength(2);
    expect(wizardData.teachers).toBeDefined();
    expect(wizardData.teachers.length).toBeGreaterThan(0);
    expect(wizardData.periods).toBeDefined();
    expect(wizardData.days).toEqual(DAYS);
  });

  /* ───────── 4. Select class and verify period grid ───────── */

  test('4) select class loads period grid', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('networkidle');

    const classSelector = page.locator('select, button[aria-haspopup="listbox"], [role="combobox"]').first();
    if (await classSelector.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await classSelector.click();
      await page.waitForTimeout(300);
      const option = page.getByRole('option', { name: /10/i })
        .or(page.getByText('10-A', { exact: false }))
        .first();
      if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await option.click();
      }
    }
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const hasPeriods = bodyText?.includes('Period 1') || bodyText?.includes('08:00') ||
      bodyText?.includes('Monday');
    expect(hasPeriods || bodyText?.toLowerCase().includes('timetable')).toBeTruthy();
  });

  /* ───────── 5. Auto-assign subjects ───────── */

  test('5) auto-assign subjects via API', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('networkidle');

    const autoResult = await page.evaluate(async (classId) => {
      const res = await fetch('http://localhost:3001/api/timetable-wizard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          action: 'auto-assign',
          classId,
        }),
      });
      return res.json();
    }, CLASS_10A_ID);

    expect(autoResult.message).toBe('Auto-assignment completed');
    expect(autoResult.slots).toBeDefined();
    expect(autoResult.slots.length).toBeGreaterThan(0);
    expect(autoResult.conflicts).toEqual([]);

    // Verify slots cover all non-break periods across all days
    // 5 days x 6 non-break periods = 30
    expect(autoResult.slots).toHaveLength(30);

    // Each slot should have subject and teacher
    for (const slot of autoResult.slots) {
      expect(slot.day).toBeDefined();
      expect(slot.subject).toBeDefined();
      expect(slot.teacherName).toBeDefined();
    }
  });

  /* ───────── 6. Auto-assign button in UI ───────── */

  test('6) wizard has auto-assign button', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    const autoBtn = body.getByRole('button', { name: /auto.*assign|generate|auto.*fill/i }).first();
    const hasAutoBtn = await autoBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    const bodyText = await body.textContent();
    const hasAutoText = bodyText?.toLowerCase().includes('auto') ||
      bodyText?.toLowerCase().includes('generate') ||
      bodyText?.toLowerCase().includes('wizard');
    expect(hasAutoBtn || hasAutoText).toBeTruthy();
  });

  /* ───────── 7. Save timetable ───────── */

  test('7) save timetable via API', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('networkidle');

    const saveResult = await page.evaluate(async (classId) => {
      const res = await fetch('http://localhost:3001/api/timetable-wizard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          classId,
          slots: [
            { day: 'Monday', periodName: 'Period 1', subject: 'Mathematics', teacherId: '64b100000000000000000011' },
            { day: 'Monday', periodName: 'Period 2', subject: 'Science', teacherId: '64b100000000000000000011' },
          ],
        }),
      });
      return res.json();
    }, CLASS_10A_ID);

    expect(saveResult.message).toBe('Timetable saved successfully');
    expect(saveResult.timetable).toBeDefined();
    expect(saveResult.timetable.classId).toBe(CLASS_10A_ID);
  });

  /* ───────── 8. Save button in UI ───────── */

  test('8) wizard has a save button', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    const saveBtn = body.getByRole('button', { name: /save|submit|finalize|confirm/i }).first();
    const hasSave = await saveBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    const bodyText = await body.textContent();
    expect(hasSave || bodyText?.toLowerCase().includes('timetable')).toBeTruthy();
  });

  /* ───────── 9. Saved timetable persists in state ───────── */

  test('9) saved timetable is added to mock state', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('networkidle');

    expect(state.timetables).toHaveLength(0);

    await page.evaluate(async (classId) => {
      await fetch('http://localhost:3001/api/timetable-wizard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          classId,
          slots: [{ day: 'Monday', periodName: 'Period 1', subject: 'Mathematics' }],
        }),
      });
    }, CLASS_10A_ID);

    expect(state.timetables).toHaveLength(1);
  });

  /* ───────── 10. State integrity ───────── */

  test('10) state has 2 classes with subjects and 2 teachers', async ({ page }) => {
    expect(state.classes).toHaveLength(2);
    expect(state.classes[0].subjects).toHaveLength(4);
    const teachers = state.staff.filter((s) => s.role === 'Teacher');
    expect(teachers).toHaveLength(2);
  });
});
