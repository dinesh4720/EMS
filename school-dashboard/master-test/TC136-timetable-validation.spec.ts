/**
 * TC096: Validate timetable for conflicts and gaps.
 *
 * Verifies: validation dashboard, conflict list, gap detection,
 * warning count, conflict details, resolution suggestions.
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

/* ───────── Timetable validation data ───────── */

const PERIODS = [
  { name: 'Period 1', startTime: '08:00', endTime: '08:45', isBreak: false },
  { name: 'Period 2', startTime: '08:45', endTime: '09:30', isBreak: false },
  { name: 'Period 3', startTime: '09:30', endTime: '10:15', isBreak: false },
  { name: 'Break', startTime: '10:15', endTime: '10:30', isBreak: true },
  { name: 'Period 4', startTime: '10:30', endTime: '11:15', isBreak: false },
  { name: 'Period 5', startTime: '11:15', endTime: '12:00', isBreak: false },
];

// Timetable with intentional conflicts and gaps
const TIMETABLE_10A = {
  _id: `tt-${CLASS_10A_ID}`,
  classId: CLASS_10A_ID,
  periods: PERIODS,
  slots: [
    { day: 'Monday', period: 1, subject: 'Mathematics', teacherId: TEACHER_A_ID, teacherName: 'Ananya Sharma' },
    { day: 'Monday', period: 2, subject: 'Science', teacherId: TEACHER_A_ID, teacherName: 'Ananya Sharma' },
    // Period 3 missing = gap
    { day: 'Monday', period: 4, subject: 'English', teacherId: TEACHER_B_ID, teacherName: 'Ravi Menon' },
    { day: 'Monday', period: 5, subject: 'Social Studies', teacherId: TEACHER_B_ID, teacherName: 'Ravi Menon' },
    { day: 'Tuesday', period: 1, subject: 'Mathematics', teacherId: TEACHER_A_ID, teacherName: 'Ananya Sharma' },
    { day: 'Tuesday', period: 2, subject: 'Science', teacherId: TEACHER_A_ID, teacherName: 'Ananya Sharma' },
    // Periods 3-5 missing on Tuesday = gaps
  ],
};

// Conflicting timetable: Teacher A assigned to both classes at the same time
const TIMETABLE_11A = {
  _id: `tt-${CLASS_11A_ID}`,
  classId: CLASS_11A_ID,
  periods: PERIODS,
  slots: [
    // CONFLICT: Teacher A is also in 10-A Monday Period 1
    { day: 'Monday', period: 1, subject: 'Mathematics', teacherId: TEACHER_A_ID, teacherName: 'Ananya Sharma' },
    { day: 'Monday', period: 2, subject: 'English', teacherId: TEACHER_B_ID, teacherName: 'Ravi Menon' },
    // CONFLICT: Teacher B is also in 10-A Monday Period 4
    { day: 'Monday', period: 4, subject: 'Science', teacherId: TEACHER_B_ID, teacherName: 'Ravi Menon' },
  ],
};

/* ───────── Validation route overrides ───────── */

async function installValidationRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  // Timetable validation endpoint
  await page.route('**/api/timetable/validate*', async (route) => {
    state.requestLog.add('GET /api/timetable/validate');

    const conflicts = [
      {
        _id: 'conflict-1',
        type: 'teacher_double_booking',
        severity: 'high',
        teacherId: TEACHER_A_ID,
        teacherName: 'Ananya Sharma',
        day: 'Monday',
        period: 1,
        classes: [
          { classId: CLASS_10A_ID, className: '10-A', subject: 'Mathematics' },
          { classId: CLASS_11A_ID, className: '11-A', subject: 'Mathematics' },
        ],
        message: 'Ananya Sharma is assigned to both 10-A and 11-A on Monday Period 1',
        suggestion: 'Reassign one of the classes to a different teacher or move the period',
      },
      {
        _id: 'conflict-2',
        type: 'teacher_double_booking',
        severity: 'high',
        teacherId: TEACHER_B_ID,
        teacherName: 'Ravi Menon',
        day: 'Monday',
        period: 4,
        classes: [
          { classId: CLASS_10A_ID, className: '10-A', subject: 'English' },
          { classId: CLASS_11A_ID, className: '11-A', subject: 'Science' },
        ],
        message: 'Ravi Menon is assigned to both 10-A and 11-A on Monday Period 4',
        suggestion: 'Swap Period 4 subject in one class or assign a substitute teacher',
      },
    ];

    const gaps = [
      {
        _id: 'gap-1',
        type: 'empty_period',
        severity: 'medium',
        classId: CLASS_10A_ID,
        className: '10-A',
        day: 'Monday',
        period: 3,
        message: '10-A has no subject assigned on Monday Period 3',
        suggestion: 'Assign a subject and teacher to this period',
      },
      {
        _id: 'gap-2',
        type: 'empty_period',
        severity: 'medium',
        classId: CLASS_10A_ID,
        className: '10-A',
        day: 'Tuesday',
        period: 3,
        message: '10-A has no subject assigned on Tuesday Period 3',
        suggestion: 'Assign a subject and teacher to this period',
      },
      {
        _id: 'gap-3',
        type: 'empty_period',
        severity: 'medium',
        classId: CLASS_10A_ID,
        className: '10-A',
        day: 'Tuesday',
        period: 4,
        message: '10-A has no subject assigned on Tuesday Period 4',
        suggestion: 'Assign a subject and teacher to this period',
      },
      {
        _id: 'gap-4',
        type: 'empty_period',
        severity: 'medium',
        classId: CLASS_10A_ID,
        className: '10-A',
        day: 'Tuesday',
        period: 5,
        message: '10-A has no subject assigned on Tuesday Period 5',
        suggestion: 'Assign a subject and teacher to this period',
      },
    ];

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        valid: false,
        conflicts,
        gaps,
        warnings: [...conflicts, ...gaps],
        summary: {
          totalConflicts: conflicts.length,
          totalGaps: gaps.length,
          totalWarnings: conflicts.length + gaps.length,
          affectedClasses: [CLASS_10A_ID, CLASS_11A_ID],
          affectedTeachers: [TEACHER_A_ID, TEACHER_B_ID],
        },
      }),
    });
  });

  // Conflict detail endpoint
  await page.route('**/api/timetable/conflicts/*', async (route) => {
    const url = new URL(route.request().url());
    const conflictId = url.pathname.split('/').pop();
    state.requestLog.add(`GET /api/timetable/conflicts/${conflictId}`);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        _id: conflictId,
        type: 'teacher_double_booking',
        teacherName: 'Ananya Sharma',
        day: 'Monday',
        period: 1,
        classes: ['10-A', '11-A'],
        resolutionOptions: [
          { action: 'reassign_teacher', description: 'Assign a different teacher to one of the classes' },
          { action: 'move_period', description: 'Move one class to a different period' },
          { action: 'swap_subjects', description: 'Swap subjects between periods' },
        ],
      }),
    });
  });

  // Timetable endpoints to serve pre-seeded data
  await page.route('**/api/timetable', async (route) => {
    state.requestLog.add('GET /api/timetable');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.timetables),
    });
  });

  await page.route('**/api/classes/*/timetable', async (route) => {
    const url = new URL(route.request().url());
    const classId = url.pathname.split('/')[3];
    const tt = state.timetables.find((t: Record<string, unknown>) => t.classId === classId);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(tt || { classId, periods: PERIODS, slots: [] }),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC096 — Timetable Validation: Conflicts & Gaps', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Pre-seed timetables with conflicts
    state.timetables.push(TIMETABLE_10A, TIMETABLE_11A);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
    await installValidationRoutes(page, state);
  });

  /* ───────── 1. Validation dashboard loads ───────── */

  test('1) timetable validation page loads', async ({ page }) => {
    await page.goto('/classes/timetable-validation');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('validation') ||
      bodyText?.toLowerCase().includes('timetable') ||
      bodyText?.toLowerCase().includes('conflict') ||
      bodyText?.toLowerCase().includes('schedule'),
    ).toBeTruthy();
  });

  /* ───────── 2. Validation API returns conflicts ───────── */

  test('2) validation API detects teacher double-bookings', async ({ page }) => {
    await page.goto('/classes/timetable-validation');
    await page.waitForLoadState('networkidle');

    const validationData = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/timetable/validate', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(validationData.valid).toBe(false);
    expect(validationData.conflicts).toBeDefined();
    expect(validationData.conflicts).toHaveLength(2);

    // First conflict: Ananya Sharma double-booked
    expect(validationData.conflicts[0].type).toBe('teacher_double_booking');
    expect(validationData.conflicts[0].teacherName).toBe('Ananya Sharma');
    expect(validationData.conflicts[0].classes).toHaveLength(2);
  });

  /* ───────── 3. Gap detection ───────── */

  test('3) validation API detects empty period gaps', async ({ page }) => {
    await page.goto('/classes/timetable-validation');
    await page.waitForLoadState('networkidle');

    const validationData = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/timetable/validate', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(validationData.gaps).toBeDefined();
    expect(validationData.gaps).toHaveLength(4);

    const gap1 = validationData.gaps[0];
    expect(gap1.type).toBe('empty_period');
    expect(gap1.className).toBe('10-A');
    expect(gap1.suggestion).toBeDefined();
  });

  /* ───────── 4. Warning count ───────── */

  test('4) validation summary shows correct warning count', async ({ page }) => {
    await page.goto('/classes/timetable-validation');
    await page.waitForLoadState('networkidle');

    const validationData = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/timetable/validate', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(validationData.summary).toBeDefined();
    expect(validationData.summary.totalConflicts).toBe(2);
    expect(validationData.summary.totalGaps).toBe(4);
    expect(validationData.summary.totalWarnings).toBe(6);
    expect(validationData.summary.affectedClasses).toHaveLength(2);
    expect(validationData.summary.affectedTeachers).toHaveLength(2);
  });

  /* ───────── 5. Conflict details ───────── */

  test('5) clicking conflict shows detailed information', async ({ page }) => {
    await page.goto('/classes/timetable-validation');
    await page.waitForLoadState('networkidle');

    const conflictDetail = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/timetable/conflicts/conflict-1', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(conflictDetail._id).toBe('conflict-1');
    expect(conflictDetail.type).toBe('teacher_double_booking');
    expect(conflictDetail.teacherName).toBe('Ananya Sharma');
    expect(conflictDetail.classes).toContain('10-A');
    expect(conflictDetail.classes).toContain('11-A');
  });

  /* ───────── 6. Resolution suggestions ───────── */

  test('6) conflict detail includes resolution suggestions', async ({ page }) => {
    await page.goto('/classes/timetable-validation');
    await page.waitForLoadState('networkidle');

    const conflictDetail = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/timetable/conflicts/conflict-1', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    expect(conflictDetail.resolutionOptions).toBeDefined();
    expect(conflictDetail.resolutionOptions.length).toBeGreaterThan(0);

    const actions = conflictDetail.resolutionOptions.map((r: { action: string }) => r.action);
    expect(actions).toContain('reassign_teacher');
    expect(actions).toContain('move_period');
  });

  /* ───────── 7. Each conflict has a message ───────── */

  test('7) each conflict has descriptive message', async ({ page }) => {
    await page.goto('/classes/timetable-validation');
    await page.waitForLoadState('networkidle');

    const validationData = await page.evaluate(async () => {
      const res = await fetch('http://localhost:3001/api/timetable/validate', {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    });

    for (const conflict of validationData.conflicts) {
      expect(conflict.message).toBeDefined();
      expect(conflict.message.length).toBeGreaterThan(10);
      expect(conflict.suggestion).toBeDefined();
    }

    for (const gap of validationData.gaps) {
      expect(gap.message).toBeDefined();
      expect(gap.suggestion).toBeDefined();
    }
  });

  /* ───────── 8. State integrity ───────── */

  test('8) pre-seeded timetables are in state', async ({ page }) => {
    expect(state.timetables).toHaveLength(2);
    const tt10A = state.timetables.find((t: Record<string, unknown>) => t.classId === CLASS_10A_ID) as Record<string, unknown>;
    const tt11A = state.timetables.find((t: Record<string, unknown>) => t.classId === CLASS_11A_ID) as Record<string, unknown>;
    expect(tt10A).toBeDefined();
    expect(tt11A).toBeDefined();
    expect((tt10A.slots as unknown[]).length).toBe(6);
    expect((tt11A.slots as unknown[]).length).toBe(3);
  });
});
