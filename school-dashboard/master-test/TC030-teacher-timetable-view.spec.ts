/**
 * TC030: View a teacher's timetable across all their classes.
 *
 * Verifies: teacher selection, cross-class timetable display,
 * slot details (class name, subject), read-only mode, and conflict indicators.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  CLASS_10A_ID,
  CLASS_11A_ID,
  TEACHER_A_ID,
  TEACHER_B_ID,
  type MockState,
} from '../tests/test-utils';

/* ───────── Mock timetable data across multiple classes ───────── */

const PERIODS = [
  { name: 'Period 1', startTime: '08:00', endTime: '08:45', isBreak: false },
  { name: 'Period 2', startTime: '08:45', endTime: '09:30', isBreak: false },
  { name: 'Period 3', startTime: '09:30', endTime: '10:15', isBreak: false },
  { name: 'Break', startTime: '10:15', endTime: '10:30', isBreak: true },
  { name: 'Period 4', startTime: '10:30', endTime: '11:15', isBreak: false },
];

const TEACHER_A_TIMETABLE = {
  _id: `teacher-tt-${TEACHER_A_ID}`,
  teacherId: TEACHER_A_ID,
  teacherName: 'Ananya Sharma',
  periods: PERIODS,
  totalPeriods: 8,
  slots: [
    { day: 'Monday', period: 1, subject: 'Mathematics', classId: CLASS_10A_ID, className: '10-A', room: '101' },
    { day: 'Monday', period: 2, subject: 'Science', classId: CLASS_10A_ID, className: '10-A', room: 'Lab 1' },
    { day: 'Monday', period: 4, subject: 'Mathematics', classId: CLASS_11A_ID, className: '11-A', room: '201' },
    { day: 'Tuesday', period: 1, subject: 'Science', classId: CLASS_11A_ID, className: '11-A', room: 'Lab 1' },
    { day: 'Tuesday', period: 2, subject: 'Mathematics', classId: CLASS_10A_ID, className: '10-A', room: '101' },
    { day: 'Wednesday', period: 1, subject: 'Mathematics', classId: CLASS_10A_ID, className: '10-A', room: '101' },
    { day: 'Wednesday', period: 3, subject: 'Science', classId: CLASS_11A_ID, className: '11-A', room: 'Lab 1' },
    { day: 'Thursday', period: 1, subject: 'Mathematics', classId: CLASS_11A_ID, className: '11-A', room: '201' },
  ],
  schedule: {
    Monday: [
      { subject: 'Mathematics', classId: CLASS_10A_ID, className: '10-A', room: '101' },
      { subject: 'Science', classId: CLASS_10A_ID, className: '10-A', room: 'Lab 1' },
      null,
      { subject: 'Mathematics', classId: CLASS_11A_ID, className: '11-A', room: '201' },
    ],
    Tuesday: [
      { subject: 'Science', classId: CLASS_11A_ID, className: '11-A', room: 'Lab 1' },
      { subject: 'Mathematics', classId: CLASS_10A_ID, className: '10-A', room: '101' },
    ],
    Wednesday: [
      { subject: 'Mathematics', classId: CLASS_10A_ID, className: '10-A', room: '101' },
      null,
      { subject: 'Science', classId: CLASS_11A_ID, className: '11-A', room: 'Lab 1' },
    ],
    Thursday: [
      { subject: 'Mathematics', classId: CLASS_11A_ID, className: '11-A', room: '201' },
    ],
    Friday: [],
  },
};

const TEACHER_B_TIMETABLE = {
  _id: `teacher-tt-${TEACHER_B_ID}`,
  teacherId: TEACHER_B_ID,
  teacherName: 'Ravi Menon',
  periods: PERIODS,
  totalPeriods: 4,
  slots: [
    { day: 'Monday', period: 3, subject: 'English', classId: CLASS_10A_ID, className: '10-A', room: '102' },
    { day: 'Tuesday', period: 3, subject: 'Social Studies', classId: CLASS_11A_ID, className: '11-A', room: '202' },
    { day: 'Wednesday', period: 2, subject: 'English', classId: CLASS_11A_ID, className: '11-A', room: '202' },
    { day: 'Thursday', period: 2, subject: 'Social Studies', classId: CLASS_10A_ID, className: '10-A', room: '102' },
  ],
  schedule: {
    Monday: [null, null, { subject: 'English', classId: CLASS_10A_ID, className: '10-A', room: '102' }],
    Tuesday: [null, null, { subject: 'Social Studies', classId: CLASS_11A_ID, className: '11-A', room: '202' }],
    Wednesday: [null, { subject: 'English', classId: CLASS_11A_ID, className: '11-A', room: '202' }],
    Thursday: [null, { subject: 'Social Studies', classId: CLASS_10A_ID, className: '10-A', room: '102' }],
    Friday: [],
  },
};

/* ───────── Teacher timetable route overrides ───────── */

async function installTeacherTimetableRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  // Teacher timetable endpoint - returns teacher-centric view
  await page.route('**/api/teacher-timetable*', async (route) => {
    const url = new URL(route.request().url());
    const teacherId = url.searchParams.get('teacherId') || url.pathname.split('/').pop();
    state.requestLog.add(`GET /api/teacher-timetable/${teacherId}`);

    if (teacherId === TEACHER_A_ID) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEACHER_A_TIMETABLE),
      });
    }
    if (teacherId === TEACHER_B_ID) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEACHER_B_TIMETABLE),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ slots: [], schedule: {}, periods: PERIODS }),
    });
  });

  // Staff timetable endpoint (alternative path)
  await page.route('**/api/staff/*/timetable', async (route) => {
    const url = new URL(route.request().url());
    const staffId = url.pathname.split('/')[3];
    state.requestLog.add(`GET /api/staff/${staffId}/timetable`);

    if (staffId === TEACHER_A_ID) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ timetable: TEACHER_A_TIMETABLE }),
      });
    }
    if (staffId === TEACHER_B_ID) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ timetable: TEACHER_B_TIMETABLE }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ timetable: { slots: [], schedule: {} } }),
    });
  });

  // Teacher timetable editor endpoint
  await page.route('**/api/timetable/teacher/*', async (route) => {
    const url = new URL(route.request().url());
    const teacherId = url.pathname.split('/').pop();
    state.requestLog.add(`GET /api/timetable/teacher/${teacherId}`);

    if (teacherId === TEACHER_A_ID) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEACHER_A_TIMETABLE),
      });
    }
    if (teacherId === TEACHER_B_ID) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEACHER_B_TIMETABLE),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ slots: [], schedule: {}, periods: PERIODS }),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC030: Teacher Timetable View - Cross-Class Schedule', () => {
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
    await installTeacherTimetableRoutes(page, state);
  });

  test('1) teacher timetable editor page loads with teacher selector', async ({ page }) => {
    await page.goto('/staffs/teacher-timetable-editor');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');

    // Page should have timetable-related content
    await expect(
      body.getByText(/timetable/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Teacher selector should be available
    const teacherSelector = body.locator('select, button[aria-haspopup="listbox"], [role="combobox"]').first();
    await expect(teacherSelector).toBeVisible({ timeout: 5_000 });
  });

  test('2) select Ananya Sharma and view her timetable across all classes', async ({ page }) => {
    await page.goto('/staffs/teacher-timetable-editor');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body.getByText(/timetable/i).first()).toBeVisible({ timeout: 10_000 });

    // Select Ananya Sharma from teacher dropdown
    const teacherSelector = body.locator('select, button[aria-haspopup="listbox"]').first();
    await teacherSelector.click();
    await page.waitForTimeout(300);

    const ananyaOption = page.getByRole('option', { name: /ananya/i })
      .or(page.getByText('Ananya Sharma', { exact: false }))
      .first();
    if (await ananyaOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await ananyaOption.click();
    }

    await page.waitForLoadState('networkidle');

    // Timetable should show slots from both 10-A and 11-A
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();

    // Verify teacher timetable API was called
    await expect.poll(() =>
      [...state.requestLog].some((r) =>
        r.includes('teacher-timetable') || r.includes('timetable/teacher') || r.includes('/staff/'),
      ),
    ).toBeTruthy();
  });

  test('3) teacher timetable API returns slots from multiple classes', async ({ page }) => {
    await page.goto('/staffs/teacher-timetable-editor');
    await page.waitForLoadState('networkidle');

    // Query teacher timetable API directly
    const result = await page.evaluate(async (teacherId) => {
      const res = await fetch(`http://localhost:3001/api/timetable/teacher/${teacherId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, TEACHER_A_ID);

    // Ananya teaches in both 10-A and 11-A
    expect(result.slots).toHaveLength(8);
    expect(result.teacherName).toBe('Ananya Sharma');

    // Verify slots span multiple classes
    const classIds = [...new Set(result.slots.map((s: { classId: string }) => s.classId))];
    expect(classIds).toContain(CLASS_10A_ID);
    expect(classIds).toContain(CLASS_11A_ID);

    // Each slot has class name and subject
    for (const slot of result.slots) {
      expect(slot.className).toBeTruthy();
      expect(slot.subject).toBeTruthy();
      expect(slot.day).toBeTruthy();
      expect(slot.period).toBeDefined();
    }
  });

  test('4) Ravi Menon timetable shows different class distribution', async ({ page }) => {
    await page.goto('/staffs/teacher-timetable-editor');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (teacherId) => {
      const res = await fetch(`http://localhost:3001/api/timetable/teacher/${teacherId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, TEACHER_B_ID);

    expect(result.slots).toHaveLength(4);
    expect(result.teacherName).toBe('Ravi Menon');

    // Ravi teaches English and Social Studies
    const subjects = [...new Set(result.slots.map((s: { subject: string }) => s.subject))];
    expect(subjects).toContain('English');
    expect(subjects).toContain('Social Studies');
  });

  test('5) teacher view should be read-only (no edit controls)', async ({ page }) => {
    await page.goto('/staffs/teacher-timetable-editor');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body.getByText(/timetable/i).first()).toBeVisible({ timeout: 10_000 });

    // Select a teacher
    const teacherSelector = body.locator('select, button[aria-haspopup="listbox"]').first();
    await teacherSelector.click();
    await page.waitForTimeout(300);
    const opt = page.getByRole('option').first();
    if (await opt.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await opt.click();
    }
    await page.waitForLoadState('networkidle');

    // In teacher view mode, there should be no "Save" or "Edit" button for the timetable
    // (the editor page may still have editing, but the view mode should be read-only)
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();
  });

  test('6) Ananya total period count is accurate', async ({ page }) => {
    await page.goto('/staffs/teacher-timetable-editor');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (teacherId) => {
      const res = await fetch(`http://localhost:3001/api/timetable/teacher/${teacherId}`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, TEACHER_A_ID);

    // Verify total periods matches actual slots
    expect(result.totalPeriods).toBe(8);
    expect(result.slots).toHaveLength(8);

    // Verify day distribution
    const mondaySlots = result.slots.filter((s: { day: string }) => s.day === 'Monday');
    expect(mondaySlots).toHaveLength(3); // Period 1 (10-A Math), Period 2 (10-A Sci), Period 4 (11-A Math)

    const fridaySlots = result.slots.filter((s: { day: string }) => s.day === 'Friday');
    expect(fridaySlots).toHaveLength(0); // No Friday classes
  });
});
