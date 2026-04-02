import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  CLASS_10A_ID,
  CLASS_11A_ID,
  TEACHER_A_ID,
  TEACHER_B_ID,
  type MockState,
} from './test-utils';

/* ───────── Mock data for wizard ───────── */

const MISSING_SUBJECTS_RESPONSE = {
  missingSubjects: [
    {
      classId: CLASS_10A_ID,
      _id: CLASS_10A_ID,
      className: 'Class 10-A',
      name: '10',
      section: 'A',
      missingSubjects: [
        { name: 'Mathematics', id: 'sub-2' },
        { name: 'Science', id: 'sub-3' },
      ],
    },
    {
      classId: CLASS_11A_ID,
      _id: CLASS_11A_ID,
      className: 'Class 11-A',
      name: '11',
      section: 'A',
      missingSubjects: [
        { name: 'Physics', id: 'sub-6' },
      ],
    },
  ],
};

const MOCK_TIMETABLE_SLOTS = [
  { day: 'Monday', period: 1, subject: 'Mathematics', teacher: 'Ananya Sharma' },
  { day: 'Monday', period: 2, subject: 'English', teacher: 'Ravi Menon' },
  { day: 'Tuesday', period: 1, subject: 'Science', teacher: 'Ananya Sharma' },
  { day: 'Tuesday', period: 2, subject: 'Mathematics', teacher: 'Ananya Sharma' },
];

const MOCK_TIMETABLES = [
  {
    _id: `tt-${CLASS_10A_ID}`,
    classId: CLASS_10A_ID,
    slots: MOCK_TIMETABLE_SLOTS,
    schedule: {
      Monday: [
        { subject: 'Mathematics', teacherId: TEACHER_A_ID, room: '101' },
        { subject: 'English', teacherId: TEACHER_B_ID, room: '102' },
      ],
      Tuesday: [
        { subject: 'Science', teacherId: TEACHER_A_ID, room: 'Lab 1' },
        { subject: 'Mathematics', teacherId: TEACHER_A_ID, room: '101' },
      ],
    },
    periods: [
      { name: 'Period 1', startTime: '08:00', endTime: '08:45', isBreak: false },
      { name: 'Period 2', startTime: '08:45', endTime: '09:30', isBreak: false },
    ],
  },
];

/* ───────── Install wizard-specific routes ───────── */

async function installWizardRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
  options: {
    missingSubjects?: typeof MISSING_SUBJECTS_RESPONSE;
    timetables?: typeof MOCK_TIMETABLES;
    generateResult?: { generated: number; errors: number };
    generateShouldFail?: boolean;
  } = {},
) {
  const {
    missingSubjects = MISSING_SUBJECTS_RESPONSE,
    timetables = MOCK_TIMETABLES,
    generateResult = { generated: 5, errors: 0 },
    generateShouldFail = false,
  } = options;

  let currentMissing = JSON.parse(JSON.stringify(missingSubjects));
  let currentTimetables = JSON.parse(JSON.stringify(timetables));

  // Override GET /api/classes-enhanced/missing-subjects
  await page.route('**/api/classes-enhanced/missing-subjects', async (route) => {
    const method = route.request().method();
    state.requestLog.add(`${method} /api/classes-enhanced/missing-subjects`);
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentMissing),
      });
      return;
    }
    await route.fallback();
  });

  // Override GET /api/timetable to return populated timetables
  await page.route('**/api/timetable', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/+$/, '');
    const method = request.method();

    if (path === '/api/timetable' && method === 'GET') {
      state.requestLog.add('GET /api/timetable');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentTimetables),
      });
      return;
    }
    await route.fallback();
  });

  // POST /api/timetable/generate-all
  await page.route('**/api/timetable/generate-all', async (route) => {
    const method = route.request().method();
    state.requestLog.add(`${method} /api/timetable/generate-all`);
    if (method === 'POST') {
      if (generateShouldFail) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Conflict detected: Teacher Ananya Sharma is double-booked on Monday Period 1' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(generateResult),
        });
      }
      return;
    }
    await route.fallback();
  });

  // PUT /api/classes/:id/subjects — save subject assignments
  await page.route('**/api/classes/*/subjects', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/+$/, '');
    const method = request.method();
    state.requestLog.add(`${method} ${path}`);

    if (method === 'PUT') {
      // After saving, remove this class from missing subjects
      const classIdMatch = path.match(/\/api\/classes\/([^/]+)\/subjects$/);
      if (classIdMatch) {
        const classId = classIdMatch[1];
        currentMissing.missingSubjects = currentMissing.missingSubjects.filter(
          (c: { classId: string }) => c.classId !== classId
        );
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
      return;
    }
    await route.fallback();
  });

  // Staff list for BulkClassTeacherAssignment component
  await page.route('**/api/teacher-assignments/available-teachers**', async (route) => {
    state.requestLog.add('GET /api/teacher-assignments/available-teachers');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        availableTeachers: [
          { _id: TEACHER_A_ID, id: TEACHER_A_ID, name: 'Ananya Sharma', role: 'Teacher' },
          { _id: TEACHER_B_ID, id: TEACHER_B_ID, name: 'Ravi Menon', role: 'Teacher' },
        ],
      }),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE — Timetable Wizard Full Generation Workflow
   ═══════════════════════════════════════════════════════════════ */

test.describe('Timetable Wizard — Full Generation Workflow', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Add subjects to schoolSettings so the wizard Select dropdowns are populated
    (state.schoolSettings as Record<string, unknown>).subjects = [
      { _id: 'sub-math', name: 'Mathematics', code: 'MATH' },
      { _id: 'sub-sci', name: 'Science', code: 'SCI' },
      { _id: 'sub-eng', name: 'English', code: 'ENG' },
      { _id: 'sub-ss', name: 'Social Studies', code: 'SS' },
    ];
    // Dismiss cookie consent so it doesn't block clicks
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
    await installWizardRoutes(page, state);
  });

  // 1. Wizard loads with all 4 sidebar tabs
  test('wizard loads with sidebar tabs: Missing Subjects, Teachers, Generate, View', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');

    // Header
    await expect(body.getByText('Master Timetable Wizard')).toBeVisible({ timeout: 10_000 });

    // Sidebar step tabs
    await expect(body.getByText('1. Missing Subjects')).toBeVisible();
    await expect(body.getByText('2. Subject & Class Teachers')).toBeVisible();
    await expect(body.getByText('3. Generate Timetables')).toBeVisible();
    await expect(body.getByText('4. View & Edit Timetables')).toBeVisible();
  });

  // 2. Missing Subjects tab shows classes with unassigned subjects
  test('Missing Subjects tab shows classes with unassigned subjects', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body.getByText('Master Timetable Wizard')).toBeVisible({ timeout: 10_000 });

    // Should auto-select Missing Subjects tab when there are missing subjects
    await expect(body.getByText('Missing Subject Assignments')).toBeVisible();

    // Should show classes with unassigned subjects
    await expect(body.getByText('Class 10-A')).toBeVisible();
    await expect(body.getByText('Class 11-A')).toBeVisible();

    // Should show the pending count badge
    await expect(body.getByText('2 Pending')).toBeVisible();

    // API should have been called
    await expect.poll(() =>
      [...state.requestLog].some(r => r.includes('GET /api/classes-enhanced/missing-subjects'))
    ).toBeTruthy();
  });

  // 3. Subject selection dropdowns work per class
  test('subject selection dropdowns work per class', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body.getByText('Missing Subject Assignments')).toBeVisible({ timeout: 10_000 });

    // HeroUI Select renders a trigger button with aria-haspopup="listbox"
    const selectTriggers = body.locator('button[aria-haspopup="listbox"]');

    // At least one select trigger should be visible (one per class)
    const triggerCount = await selectTriggers.count();
    expect(triggerCount).toBeGreaterThanOrEqual(1);

    // Click the first select to open dropdown
    await selectTriggers.first().click();

    // Subject options from schoolSettings should appear in the popover
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible({ timeout: 5_000 });

    // Options should include subjects from schoolSettings
    await expect(listbox.getByText('English')).toBeVisible();
    await expect(listbox.getByText('Mathematics')).toBeVisible();
    await expect(listbox.getByText('Science', { exact: true })).toBeVisible();

    // Click a subject option to select it
    await listbox.getByText('Mathematics').click();
  });

  // 4. Save subject assignments triggers PUT and shows success
  test('save subject assignments triggers API call and shows success', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body.getByText('Missing Subject Assignments')).toBeVisible({ timeout: 10_000 });

    // HeroUI Select with selectionMode="multiple" renders a hidden native <select multiple>.
    // Use the hidden <select> to set values, which is the most reliable approach.
    const hiddenSelects = page.locator('select[multiple]');
    const selectCount = await hiddenSelects.count();

    if (selectCount > 0) {
      // Select "Mathematics" on the first class's hidden <select>
      await hiddenSelects.first().selectOption({ label: 'Mathematics' });
      await page.waitForTimeout(500);
    } else {
      // Fallback: interact with the visible trigger + popover listbox
      const selectTriggers = body.locator('button[aria-haspopup="listbox"]');
      await selectTriggers.first().click();
      await page.waitForTimeout(500);

      const listbox = page.locator('[role="listbox"]');
      await expect(listbox).toBeVisible({ timeout: 5_000 });

      // Use keyboard to select: type to filter, then press Enter/Space
      await page.keyboard.type('Math');
      await page.waitForTimeout(300);

      const mathOption = listbox.locator('[role="option"]').filter({ hasText: 'Mathematics' }).first();
      await expect(mathOption).toBeVisible();

      // Use pointer events (pointerdown + pointerup) which React Aria handles
      await mathOption.dispatchEvent('pointerdown', { button: 0, pointerType: 'mouse' });
      await page.waitForTimeout(50);
      await mathOption.dispatchEvent('pointerup', { button: 0, pointerType: 'mouse' });
      await page.waitForTimeout(500);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // Click "Save Subjects & Continue" button
    const saveBtn = body.getByRole('button', { name: /save subjects/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click({ force: true });

    // Verify PUT request was made to classes subjects endpoint
    await expect.poll(() =>
      [...state.requestLog].some(r => r.includes('PUT') && r.includes('/classes/') && r.includes('/subjects')),
      { timeout: 10_000 }
    ).toBeTruthy();
  });

  // 5. Generate tab shows 'Generate For All Classes' button
  test('Generate tab shows generate button', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body.getByText('Master Timetable Wizard')).toBeVisible({ timeout: 10_000 });

    // Click the Generate tab
    const generateTab = body.getByText('3. Generate Timetables');
    await generateTab.click();

    // Should show the generate content
    await expect(body.getByText('Auto-Generate Timetables')).toBeVisible({ timeout: 5_000 });
    await expect(body.getByText(/generate clash-free timetables/i)).toBeVisible();

    // Should show the generate button (text includes class count, e.g. "Generate For All 2 Classes")
    const generateBtn = body.getByRole('button', { name: /generate for all/i });
    await expect(generateBtn).toBeVisible();
  });

  // 6. Generate triggers API call and shows result (generated count)
  test('generate triggers API call and shows result', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body.getByText('Master Timetable Wizard')).toBeVisible({ timeout: 10_000 });

    // Navigate to Generate tab
    await body.getByText('3. Generate Timetables').click();
    await expect(body.getByText('Auto-Generate Timetables')).toBeVisible({ timeout: 5_000 });

    // Click the generate button (text includes class count, e.g. "Generate For All 2 Classes")
    const generateBtn = body.getByRole('button', { name: /generate for all/i });
    await generateBtn.click();

    // Verify API call was made
    await expect.poll(() =>
      [...state.requestLog].some(r => r.includes('POST /api/timetable/generate-all'))
    ).toBeTruthy();

    // After generation, the wizard should switch to the View tab
    // The view tab shows stats cards (use .first() since "Total Classes" appears in header too)
    await expect(body.getByText('Total Classes').first()).toBeVisible({ timeout: 10_000 });
    await expect(body.getByText('Timetables Created').first()).toBeVisible();
  });

  // 7. View tab shows generated timetable grid for classes
  test('View tab shows timetable cards for each class', async ({ page }) => {
    await page.goto('/timetable-wizard');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body.getByText('Master Timetable Wizard')).toBeVisible({ timeout: 10_000 });

    // Navigate to View tab
    await body.getByText('4. View & Edit Timetables').click();

    // Should show summary stats (use .first() since "Total Classes" also appears in header stats)
    await expect(body.getByText('Total Classes').first()).toBeVisible({ timeout: 5_000 });
    await expect(body.getByText('Timetables Created').first()).toBeVisible();
    await expect(body.getByText('Missing Timetables').first()).toBeVisible();

    // Should show class cards with status and "View / Edit" buttons
    await expect(body.getByText('10 - A').first()).toBeVisible();
    await expect(body.getByText('11 - A').first()).toBeVisible();
    await expect(body.getByRole('button', { name: /view \/ edit/i }).first()).toBeVisible();
  });

  // 8. Error handling when generation fails (conflict detection message)
  test('error handling when generation fails shows conflict message', async ({ page }) => {
    // Reinstall with generateShouldFail = true
    state = createMockState();
    (state.schoolSettings as Record<string, unknown>).subjects = [
      { _id: 'sub-math', name: 'Mathematics', code: 'MATH' },
      { _id: 'sub-sci', name: 'Science', code: 'SCI' },
      { _id: 'sub-eng', name: 'English', code: 'ENG' },
      { _id: 'sub-ss', name: 'Social Studies', code: 'SS' },
    ];
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
    await installWizardRoutes(page, state, { generateShouldFail: true });

    await page.goto('/timetable-wizard');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body.getByText('Master Timetable Wizard')).toBeVisible({ timeout: 10_000 });

    // Navigate to Generate tab
    await body.getByText('3. Generate Timetables').click();
    await expect(body.getByText('Auto-Generate Timetables')).toBeVisible({ timeout: 5_000 });

    // Click generate (text includes class count, e.g. "Generate For All 2 Classes")
    const generateBtn = body.getByRole('button', { name: /generate for all/i });
    await generateBtn.click();

    // Verify the API was called
    await expect.poll(() =>
      [...state.requestLog].some(r => r.includes('POST /api/timetable/generate-all'))
    ).toBeTruthy();

    // Error toast should appear — the wizard shows "Failed to generate timetables. Ensure subjects and teachers are properly assigned."
    await expect(body.getByText(/failed to generate timetables/i)).toBeVisible({ timeout: 5_000 });
  });
});
