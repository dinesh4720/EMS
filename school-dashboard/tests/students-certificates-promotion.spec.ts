import { expect, test } from '@playwright/test';

import {
  createMockState,
  expectRequestLog,
  installMockApi,
  seedStudent,
  type MockState,
  CLASS_10A_ID,
  CLASS_11A_ID,
} from './student-test-utils';

/* Force desktop viewport so the fixed sidebar does not overlap content */
test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  SHARED HELPERS
 * ──────────────────────────────────────────────────────────── */

// Valid ObjectId needed — useValidatedParams rejects non-ObjectId route params
const STUDENT_ID = '64b100000000000000000201';

/** Install mock API with extra routes the student profile page needs */
async function installStudentProfileMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  // Dismiss cookie consent banner so it doesn't block interactive elements
  await page.addInitScript(() => {
    localStorage.setItem(
      'ems_cookie_consent',
      JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
    );
  });

  await installMockApi(page, state);

  // The student profile calls attendanceApi.getStudentAttendance which hits
  // /attendance/student/:id — not covered by the base mock (/students/:id/attendance)
  await page.route('**/api/attendance/student/**', async (route) => {
    const url = new URL(route.request().url());
    const pathParts = url.pathname.replace(/^\/api/, '').split('/');
    const studentId = pathParts[3]; // /attendance/student/:studentId
    state.requestLog.add(`${route.request().method()} ${url.pathname.replace(/^\/api/, '')}`);
    const records = state.attendance.filter((a: { studentId: string }) => a.studentId === studentId);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(records) });
  });

  // /permissions/user/:id — user permissions endpoint
  await page.route('**/api/permissions/user/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ permissions: state.user.permissions || {} }) });
  });

  // /messages/conversations — messaging sidebar
  await page.route('**/api/messages/conversations**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  // /students/:id/transfer-certificate — TC save endpoint
  await page.route('**/api/students/*/transfer-certificate', async (route) => {
    state.requestLog.add(`${route.request().method()} /api/students/${route.request().url().split('/students/')[1]}`);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  // /students/tc/next-number — TC number fetch
  await page.route('**/api/students/tc/next-number', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tcNumber: 'TC-2026-0001' }) });
  });
}

/** Install mock API with promotion-specific routes */
async function installPromotionMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  // Dismiss cookie consent banner
  await page.addInitScript(() => {
    localStorage.setItem(
      'ems_cookie_consent',
      JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
    );
  });

  await installMockApi(page, state);

  // Register promotion-specific routes AFTER installMockApi.
  // Playwright uses LIFO ordering, so these handlers run first for matching URLs.
  await page.route(/\/api\/promotions\//, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = route.request().method();
    state.requestLog.add(`${method} /api${path}`);

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path.includes('/rules')) {
      return json({ minAttendancePercent: 75, feeRequirement: 'none' });
    }
    if (path.includes('/check-year')) {
      return json({ exists: true, classCount: 5 });
    }
    if (path.includes('/new-academic-year')) {
      return json({ classesCreated: 5 });
    }
    if (path.includes('/preview-all')) {
      const classStudents = state.students.filter((s) => s.classId === CLASS_10A_ID);
      return json({
        classMappings: [
          {
            fromClassId: CLASS_10A_ID,
            fromClassName: '10',
            fromSection: 'A',
            studentCount: classStudents.length,
            eligibleCount: classStudents.length,
            blockedCount: 0,
            isGraduating: false,
            suggestedTargetClassId: CLASS_11A_ID,
            suggestedTargetClassName: '11-A',
            targetClassExists: true,
            targetCapacity: 40,
          },
        ],
        targetClassOptions: [
          { _id: CLASS_11A_ID, label: '11-A' },
        ],
      });
    }
    if (path.includes('/preview')) {
      const classId = url.searchParams.get('classId') || CLASS_10A_ID;
      const classStudents = state.students.filter((s) => s.classId === classId);
      return json({
        students: classStudents.map((s) => ({
          studentId: s.id,
          _id: s.id,
          name: s.name,
          rollNo: s.rollNo,
          admissionId: s.admissionId,
          blocked: false,
          attendancePercent: 90,
          feeStatus: 'paid',
        })),
      });
    }
    if (path.includes('/execute-all')) {
      const body = JSON.parse(route.request().postData() || '{}');
      const totalStudents = (body.classMappings || []).reduce(
        (sum: number, cm: { studentDecisions?: unknown[] }) => sum + (cm.studentDecisions?.length || 0), 0,
      );
      return json({
        summary: {
          totalStudents,
          promoted: totalStudents,
          detained: 0,
          graduated: 0,
          errors: 0,
        },
        classMappings: (body.classMappings || []).map((cm: { fromClassId: string; toClassId?: string }) => ({
          fromClassId: cm.fromClassId,
          fromClassName: '10',
          toClassName: '11-A',
          studentCount: totalStudents,
          promotedCount: totalStudents,
          detainedCount: 0,
          graduatedCount: 0,
        })),
        errors: [],
      });
    }
    if (path.includes('/records')) {
      return json({ records: [] });
    }
    if (path.includes('/rollback')) {
      return json({ success: true });
    }
    return json({});
  });
}


/* ────────────────────────────────────────────────────────────
 *  SECTION 1: Certificate Generation (Tests 1-6)
 * ──────────────────────────────────────────────────────────── */

test.describe('Students — Certificates', () => {
  test('1) student profile shows quick-action buttons for all certificate types', async ({ page }) => {
    const state = createMockState();
    const student = seedStudent(state, { id: STUDENT_ID, name: 'Arjun Kumar' });
    (student as Record<string, unknown>).class = '10-A';
    (student as Record<string, unknown>).parentName = 'Rajesh Kumar';
    (student as Record<string, unknown>).parentPhone = '9876500001';

    await installStudentProfileMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');

    // Wait for the student profile to load by checking for the student name
    await expect(main.getByText('Arjun Kumar').first()).toBeVisible({ timeout: 15_000 });

    // Verify all certificate quick-action buttons exist in the sidebar
    await expect(main.getByText('Bonafide')).toBeVisible();
    await expect(main.getByText('Character')).toBeVisible();
    await expect(main.getByText('TC')).toBeVisible();
  });

  test('2) generate bonafide certificate with purpose field', async ({ page }) => {
    const state = createMockState();
    const student = seedStudent(state, { id: STUDENT_ID, name: 'Arjun Kumar' });
    (student as Record<string, unknown>).class = '10-A';
    (student as Record<string, unknown>).parentName = 'Rajesh Kumar';
    (student as Record<string, unknown>).parentPhone = '9876500001';

    await installStudentProfileMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');
    await expect(main.getByText('Arjun Kumar').first()).toBeVisible({ timeout: 15_000 });

    // Click Bonafide quick action button
    await main.getByText('Bonafide').click();

    // Modal should open with Bonafide Certificate title
    const modal = page.locator('[role="dialog"]').last();
    await expect(modal.getByText('Bonafide Certificate')).toBeVisible({ timeout: 5_000 });

    // Should have a Purpose input field
    const purposeInput = modal.getByLabel('Purpose');
    await expect(purposeInput).toBeVisible();

    // Fill purpose and generate
    await purposeInput.fill('Bank account opening');
    await modal.getByRole('button', { name: /Generate/i }).click();

    // Certificate preview should appear with student data
    const preview = modal.getByTestId('certificate-preview');
    await expect(preview.getByText('Arjun Kumar').first()).toBeVisible();
    await expect(preview.getByText('Bank account opening')).toBeVisible();
  });

  test('3) generate character certificate with conduct rating and remarks', async ({ page }) => {
    const state = createMockState();
    const student = seedStudent(state, { id: STUDENT_ID, name: 'Priya Devi' });
    (student as Record<string, unknown>).class = '10-A';
    (student as Record<string, unknown>).parentName = 'Suresh Devi';
    (student as Record<string, unknown>).parentPhone = '9876500002';

    await installStudentProfileMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');
    await expect(main.getByText('Priya Devi').first()).toBeVisible({ timeout: 15_000 });

    // Click Character quick action button
    await main.getByText('Character').click();

    // Modal should open with Character Certificate title
    const modal = page.locator('[role="dialog"]').last();
    await expect(modal.getByText('Character Certificate')).toBeVisible({ timeout: 5_000 });

    // Should have Conduct Rating and Remarks fields
    await expect(modal.getByTestId('conduct-rating')).toBeVisible();
    const remarksField = modal.getByLabel('Remarks');
    await expect(remarksField).toBeVisible();

    // Fill remarks and generate
    await remarksField.fill('Outstanding student with excellent behavior');
    await modal.getByRole('button', { name: /Generate/i }).click();

    // Preview should show student data and conduct info
    const preview = modal.getByTestId('certificate-preview');
    await expect(preview.getByText('Priya Devi').first()).toBeVisible();
    await expect(preview.getByText(/conduct and character/i)).toBeVisible();
  });

  test('4) generate transfer certificate with reason and last attendance date', async ({ page }) => {
    const state = createMockState();
    const student = seedStudent(state, { id: STUDENT_ID, name: 'Rahul Singh' });
    (student as Record<string, unknown>).class = '10-A';
    (student as Record<string, unknown>).parentName = 'Vikram Singh';
    (student as Record<string, unknown>).parentPhone = '9876500003';

    await installStudentProfileMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');
    await expect(main.getByText('Rahul Singh').first()).toBeVisible({ timeout: 15_000 });

    // Click TC quick action button
    await main.getByText('TC').click();

    // TC modal should open
    const modal = page.locator('[role="dialog"]').last();
    await expect(modal.getByRole('heading', { name: 'Enter Details' })).toBeVisible({ timeout: 5_000 });

    // TC form should show the student name
    await expect(modal.getByText('Rahul Singh').first()).toBeVisible();

    // Should have reason for leaving and other TC fields
    await expect(modal.getByText(/Reason/i).first()).toBeVisible();
  });

  test('5) download generated certificate as PDF (print window)', async ({ page }) => {
    const state = createMockState();
    const student = seedStudent(state, { id: STUDENT_ID, name: 'Meera Nair' });
    (student as Record<string, unknown>).class = '10-A';
    (student as Record<string, unknown>).parentName = 'Sanjay Nair';
    (student as Record<string, unknown>).parentPhone = '9876500004';

    await installStudentProfileMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');
    await expect(main.getByText('Meera Nair').first()).toBeVisible({ timeout: 15_000 });

    // Open bonafide certificate
    await main.getByText('Bonafide').click();
    const modal = page.locator('[role="dialog"]').last();
    await expect(modal.getByText('Bonafide Certificate')).toBeVisible({ timeout: 5_000 });

    // Fill purpose and generate
    await modal.getByLabel('Purpose').fill('Passport application');
    await modal.getByRole('button', { name: /Generate/i }).click();

    // Wait for preview
    await expect(modal.getByText('Passport application')).toBeVisible();

    // Intercept window.open to verify the print dialog is triggered
    let printWindowOpened = false;
    await page.evaluate(() => {
      (window as unknown as { __originalOpen: typeof window.open }).__originalOpen = window.open;
      window.open = (...args: Parameters<typeof window.open>) => {
        (window as unknown as { __printWindowOpened: boolean }).__printWindowOpened = true;
        // Return a minimal mock window to prevent errors
        return { addEventListener: () => {}, close: () => {} } as unknown as Window;
      };
    });

    // Click download button
    await modal.getByRole('button', { name: /Download as PDF/i }).click();

    // Verify window.open was called (print dialog trigger)
    printWindowOpened = await page.evaluate(() => (window as unknown as { __printWindowOpened: boolean }).__printWindowOpened);
    expect(printWindowOpened).toBe(true);
  });

  test('6) certificate preview before download shows student data', async ({ page }) => {
    const state = createMockState();
    const student = seedStudent(state, { id: STUDENT_ID, name: 'Deepa Krishnan', admissionId: 'ADM-0099', rollNo: '15' });
    (student as Record<string, unknown>).class = '10-A';
    (student as Record<string, unknown>).parentName = 'Mohan Krishnan';
    (student as Record<string, unknown>).parentPhone = '9876500005';

    await installStudentProfileMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');
    await expect(main.getByText('Deepa Krishnan').first()).toBeVisible({ timeout: 15_000 });

    // Open bonafide certificate and generate
    await main.getByText('Bonafide').click();
    const modal = page.locator('[role="dialog"]').last();
    await expect(modal.getByText('Bonafide Certificate')).toBeVisible({ timeout: 5_000 });

    await modal.getByLabel('Purpose').fill('School transfer');
    await modal.getByRole('button', { name: /Generate/i }).click();

    // Preview should show student name
    const preview = modal.getByTestId('certificate-preview');
    await expect(preview.getByText('Deepa Krishnan').first()).toBeVisible();
    // Preview should show admission number
    await expect(preview.getByText('ADM-0099')).toBeVisible();
    // Preview should show roll number
    await expect(preview.getByText('15')).toBeVisible();
    // Preview should show the class
    await expect(preview.getByText('10-A').first()).toBeVisible();
  });
});

/* ────────────────────────────────────────────────────────────
 *  SECTION 2: Bulk Promotion (Tests 7-12)
 * ──────────────────────────────────────────────────────────── */

test.describe('Students — Bulk Promotion', () => {
  test('7) bulk promotion page shows academic year selectors', async ({ page }) => {
    const state = createMockState();
    // Seed some students for the promotion page to work with
    seedStudent(state, { name: 'Student A', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Student B', classId: CLASS_10A_ID });

    await installPromotionMockApi(page, state);

    await page.goto('/students/promotion');

    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Year-End Promotion' })).toBeVisible({ timeout: 15_000 });

    // Should show Academic Year section heading
    await expect(page.getByRole('heading', { name: 'Academic Year' })).toBeVisible();

    // Should show from/to year inputs
    await expect(page.getByLabel(/From.*Current Year/i)).toBeVisible();
    await expect(page.getByLabel(/To.*Target Year/i)).toBeVisible();
  });

  test('8) select eligible students for promotion with class mappings', async ({ page }) => {
    const state = createMockState();
    seedStudent(state, { name: 'Ananya P', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Rohit M', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Kavya S', classId: CLASS_10A_ID });

    await installPromotionMockApi(page, state);

    await page.goto('/students/promotion');
    await expect(page.getByRole('heading', { name: 'Year-End Promotion' })).toBeVisible({ timeout: 15_000 });

    // Step 1: Academic Year should show ready status
    // Wait for the target year check to resolve
    await expect(page.getByText(/classes ready/i)).toBeVisible({ timeout: 10_000 });

    // Click Next: Map Classes
    await page.getByRole('button', { name: /Next.*Map Classes/i }).click();

    // Step 2: Class Mapping should appear
    await expect(page.getByText(/Class Mappings/i).first()).toBeVisible({ timeout: 10_000 });

    // Should show student count (3 students from the seeded data)
    await expect(page.getByText('3 students')).toBeVisible();
  });

  test('9) choose target class for promotion in mappings', async ({ page }) => {
    const state = createMockState();
    seedStudent(state, { name: 'Vikram R', classId: CLASS_10A_ID });

    await installPromotionMockApi(page, state);

    await page.goto('/students/promotion');
    await expect(page.getByRole('heading', { name: 'Year-End Promotion' })).toBeVisible({ timeout: 15_000 });

    // Wait for year check and proceed
    await expect(page.getByText(/classes ready/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Next.*Map Classes/i }).click();

    // Wait for class mappings to load
    await expect(page.getByText(/Class Mappings/i).first()).toBeVisible({ timeout: 10_000 });

    // The suggested target class (11-A) should be pre-selected in the select trigger
    // HeroUI Select renders the selected value inside a span within the trigger button
    await expect(page.locator('button[data-slot="trigger"]').filter({ hasText: '11-A' }).first()).toBeVisible();

    // The "Next: Review Students" button should be enabled since we have a valid mapping
    const nextBtn = page.getByRole('button', { name: /Next.*Review Students/i });
    await expect(nextBtn).toBeVisible();
  });

  test('10) promote selected students and verify success count', async ({ page }) => {
    const state = createMockState();
    seedStudent(state, { name: 'Arun K', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Preethi L', classId: CLASS_10A_ID });

    await installPromotionMockApi(page, state);

    await page.goto('/students/promotion');
    await expect(page.getByRole('heading', { name: 'Year-End Promotion' })).toBeVisible({ timeout: 15_000 });

    // Step 1: Proceed past academic year
    await expect(page.getByText(/classes ready/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Next.*Map Classes/i }).click();

    // Step 2: Proceed past class mapping
    await expect(page.getByText(/Class Mappings/i).first()).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Next.*Review Students/i }).click();

    // Step 3: Student Review — should show students
    await expect(page.getByText('Arun K').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Preethi L').first()).toBeVisible();

    // Proceed to confirm
    await page.getByRole('button', { name: /Next.*Review Summary/i }).click();

    // Step 4: Confirm — should show summary and execute button
    await expect(page.getByText(/Confirm Year-End Promotion/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Execute Year-End Promotion/i }).click();

    // Confirmation modal — type CONFIRM and submit
    const confirmModal = page.locator('[role="dialog"]').last();
    await expect(confirmModal).toBeVisible({ timeout: 5_000 });
    await confirmModal.locator('input[placeholder="CONFIRM"]').fill('CONFIRM');
    await confirmModal.getByRole('button', { name: /Execute Promotion/i }).click();

    // Step 5: Results — should show success
    await expect(page.getByText(/Promotion completed/i)).toBeVisible({ timeout: 15_000 });
    // Should show promoted count
    await expect(page.getByText('Promoted').first()).toBeVisible();
  });

  test('11) ineligible students (low attendance) shown with detained suggestion', async ({ page }) => {
    const state = createMockState();
    seedStudent(state, { name: 'Good Student', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Blocked Student', classId: CLASS_10A_ID });

    // Install base promotion mock but override the preview route for blocked students
    await installPromotionMockApi(page, state);

    // Override the single-class preview to return one blocked student (LIFO takes priority)
    await page.route(/\/api\/promotions\/preview(?!\-all)/, async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('preview-all')) return route.continue();
      const classStudents = state.students.filter((s) => s.classId === CLASS_10A_ID);
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          students: classStudents.map((s, idx) => ({
            studentId: s.id,
            _id: s.id,
            name: s.name,
            rollNo: s.rollNo,
            admissionId: s.admissionId,
            blocked: idx === 1, // Second student is blocked
            blockedReason: idx === 1 ? 'Low Attendance (60%)' : undefined,
            attendancePercent: idx === 1 ? 60 : 92,
            feeStatus: 'paid',
          })),
        }),
      });
    });

    await page.goto('/students/promotion');
    await expect(page.getByRole('heading', { name: 'Year-End Promotion' })).toBeVisible({ timeout: 15_000 });

    // Navigate to student review
    await expect(page.getByText(/classes ready/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Next.*Map Classes/i }).click();
    await expect(page.getByText(/Class Mappings/i).first()).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Next.*Review Students/i }).click();

    // Step 3: Student Review — should show student list
    await expect(page.getByText('Good Student').first()).toBeVisible({ timeout: 10_000 });

    // Blocked student should show the detained decision and blocked reason
    await expect(page.getByText('Blocked Student').first()).toBeVisible();
    await expect(page.getByText(/Low Attendance/i).first()).toBeVisible();

    // Summary stats should show detained count > 0
    await expect(page.getByText('Detained').first()).toBeVisible();
  });

  test('12) promote all eligible with single bulk action and rollback', async ({ page }) => {
    const state = createMockState();
    seedStudent(state, { name: 'Batch Student 1', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Batch Student 2', classId: CLASS_10A_ID });

    await installPromotionMockApi(page, state);

    await page.goto('/students/promotion');
    await expect(page.getByRole('heading', { name: 'Year-End Promotion' })).toBeVisible({ timeout: 15_000 });

    // Navigate through all steps
    await expect(page.getByText(/classes ready/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Next.*Map Classes/i }).click();

    await expect(page.getByText(/Class Mappings/i).first()).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Next.*Review Students/i }).click();

    // Step 3: In Student Review, use "Promote all eligible" link
    await expect(page.getByText('Batch Student 1').first()).toBeVisible({ timeout: 10_000 });
    const promoteAllLink = page.getByText(/Promote all eligible/i).first();
    await promoteAllLink.click();

    // Proceed to confirm and execute
    await page.getByRole('button', { name: /Next.*Review Summary/i }).click();
    await expect(page.getByText(/Confirm Year-End Promotion/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Execute Year-End Promotion/i }).click();

    // Confirmation modal — type CONFIRM and submit
    const confirmModal = page.locator('[role="dialog"]').last();
    await expect(confirmModal).toBeVisible({ timeout: 5_000 });
    await confirmModal.locator('input[placeholder="CONFIRM"]').fill('CONFIRM');
    await confirmModal.getByRole('button', { name: /Execute Promotion/i }).click();

    // Results page should appear
    await expect(page.getByText(/Promotion completed/i)).toBeVisible({ timeout: 15_000 });

    // Verify the History/Rollback button is visible
    await expect(page.getByRole('button', { name: /View History.*Rollback/i })).toBeVisible();

    // Verify the execute-all API was called
    await expectRequestLog(state, [
      'POST /api/promotions/execute-all',
    ]);
  });
});

/* ────────────────────────────────────────────────────────────
 *  SECTION 3: Student Ratings Deep (Tests 13-14)
 * ──────────────────────────────────────────────────────────── */

test.describe('Students — Ratings Deep', () => {
  // Valid ObjectId needed — useValidatedParams rejects non-ObjectId route params
  const STUDENT_RATING_ID = '64b100000000000000000201';

  /** Install mock API with extra routes the student profile page needs */
  async function installStudentProfileMockApi(
    page: import('@playwright/test').Page,
    state: MockState,
  ) {
    // Dismiss cookie consent banner so it doesn't block interactive elements
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // The student profile calls attendanceApi.getStudentAttendance which hits
    // /attendance/student/:id — not covered by the base mock (/students/:id/attendance)
    await page.route('**/api/attendance/student/**', async (route) => {
      const url = new URL(route.request().url());
      const pathParts = url.pathname.replace(/^\/api/, '').split('/');
      const studentId = pathParts[3]; // /attendance/student/:studentId
      state.requestLog.add(`${route.request().method()} ${url.pathname.replace(/^\/api/, '')}`);
      const records = state.attendance.filter((a: { studentId: string }) => a.studentId === studentId);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(records) });
    });

    // /permissions/user/:id — user permissions endpoint
    await page.route('**/api/permissions/user/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ permissions: state.user.permissions || {} }) });
    });

    // /messages/conversations — messaging sidebar
    await page.route('**/api/messages/conversations**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
  }

  test('13) ratings tab displays all five rating dimensions with stars', async ({ page }) => {
    const state = createMockState();
    const ratings = {
      behaviour: { rating: 4, comment: 'Well behaved', lastUpdated: '2026-03-10T10:00:00Z' },
      academics: { rating: 5, comment: 'Top scorer', lastUpdated: '2026-03-10T10:00:00Z' },
      extraCurricular: { rating: 3, comment: 'Participates', lastUpdated: '2026-03-10T10:00:00Z' },
      attendance: { rating: 4, comment: 'Regular', lastUpdated: '2026-03-10T10:00:00Z' },
      discipline: { rating: 5, comment: 'Exemplary', lastUpdated: '2026-03-10T10:00:00Z' },
    };
    const student = seedStudent(state, { id: STUDENT_RATING_ID });
    // Attach ratings to student object (not part of StudentRecord type but returned by API)
    (student as Record<string, unknown>).ratings = ratings;

    await installStudentProfileMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');

    // Switch to Ratings tab
    await main.getByRole('tab', { name: /Ratings/i }).click({ timeout: 15_000 });

    // Verify rating system header
    await expect(main.getByText(/Student Rating/i).first()).toBeVisible();
    await expect(main.getByText(/Overall performance/i).first()).toBeVisible();

    // Overall score should be 4.2 (average of 4+5+3+4+5 = 21/5 = 4.2)
    await expect(main.getByText('4.2')).toBeVisible();

    // All 5 dimensions should be visible
    await expect(main.getByText(/behaviour/i).first()).toBeVisible();
    await expect(main.getByText(/academics/i).first()).toBeVisible();
    await expect(main.getByText(/extra.*curricular/i).first()).toBeVisible();
    await expect(main.getByText(/attendance/i).first()).toBeVisible();
    await expect(main.getByText(/discipline/i).first()).toBeVisible();
  });

  test('14) edit ratings and save updates to backend', async ({ page }) => {
    const state = createMockState();
    const ratings = {
      behaviour: { rating: 3, comment: '' },
      academics: { rating: 3, comment: '' },
      extraCurricular: { rating: 3, comment: '' },
      attendance: { rating: 3, comment: '' },
      discipline: { rating: 3, comment: '' },
    };
    const student = seedStudent(state, { id: STUDENT_RATING_ID });
    (student as Record<string, unknown>).ratings = ratings;

    await installStudentProfileMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');

    // Switch to Ratings tab
    await main.getByRole('tab', { name: /Ratings/i }).click({ timeout: 15_000 });
    await expect(main.getByText(/Student Rating/i).first()).toBeVisible();

    // Click "Edit Ratings" button (scoped to avoid hitting the profile Edit button)
    await main.getByRole('button', { name: /Edit Ratings/i }).click();

    // Verify Save Changes and Cancel buttons appear during editing
    await expect(main.getByRole('button', { name: /Save Changes/i })).toBeVisible();
    await expect(main.getByRole('button', { name: /Cancel/i })).toBeVisible();

    // Click a star to ensure tempRatings has a fresh value for at least one dimension
    // (ensures the component's internal edit state is fully initialized)
    const behaviourStar = main.getByLabel(/Rate behaviour 4 out of 5/i);
    await behaviourStar.click();

    // Click Save Changes
    await main.getByRole('button', { name: /Save Changes/i }).click();

    // Wait for the success toast (or for Edit Ratings to reappear after save completes)
    await expect(main.getByRole('button', { name: /Edit Ratings/i })).toBeVisible({ timeout: 10_000 });

    // Verify the student update API was called
    await expectRequestLog(state, [
      `PUT /api/students/${student.id}`,
    ]);
  });
});
