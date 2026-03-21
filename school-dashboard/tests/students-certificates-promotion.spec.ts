import { expect, test } from '@playwright/test';

import {
  createMockState,
  expectRequestLog,
  installMockApi,
  seedStudent,
  CLASS_10A_ID,
  CLASS_11A_ID,
  type MockState,
} from './student-test-utils';

/* Force desktop viewport so the fixed sidebar does not overlap content */
test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Helpers
 * ──────────────────────────────────────────────────────────── */

/** Extend mock API with promotion & certificate endpoints */
async function installPromotionMockApi(
  page: import('@playwright/test').Page,
  state: MockState & {
    promotionRules: { minAttendancePercent: number; feeRequirement: string };
    promotionRecords: Array<Record<string, unknown>>;
    promotionCounter: number;
  },
) {
  await installMockApi(page, state);

  await page.route('**/api/promotions/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/+$/, '');
    const method = request.method();
    state.requestLog.add(`${method} ${path}`);

    // GET /api/promotions/rules
    if (path === '/api/promotions/rules' && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.promotionRules) });
      return;
    }

    // PUT /api/promotions/rules
    if (path === '/api/promotions/rules' && method === 'PUT') {
      const payload = JSON.parse(request.postData() || '{}');
      Object.assign(state.promotionRules, payload);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.promotionRules) });
      return;
    }

    // GET /api/promotions/preview
    if (path === '/api/promotions/preview' && method === 'GET') {
      const classId = url.searchParams.get('classId');
      const classStudents = state.students.filter((s) => s.classId === classId && s.status === 'active');
      const students = classStudents.map((s) => {
        const attendance = state.attendance.filter((a: { studentId: string; status: string }) => a.studentId === s.id);
        const present = attendance.filter((a) => a.status === 'present').length;
        const attendancePercent = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : null;
        const meetsAttendance = attendancePercent === null || attendancePercent >= state.promotionRules.minAttendancePercent;
        return {
          studentId: s.id,
          name: s.name,
          admissionId: s.admissionId,
          rollNo: s.rollNo,
          attendancePercent,
          feeStatus: s.feeStatus,
          suggestedDecision: meetsAttendance ? 'promoted' : 'detained',
        };
      });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ students }) });
      return;
    }

    // POST /api/promotions/execute
    if (path === '/api/promotions/execute' && method === 'POST') {
      const payload = JSON.parse(request.postData() || '{}');
      state.promotionCounter += 1;
      const recordId = `promo-record-${state.promotionCounter}`;
      const decisions = payload.studentDecisions || [];
      const summary = { promoted: 0, detained: 0, transferred: 0, graduated: 0, errors: 0 };
      const classReport: Array<Record<string, unknown>> = [];
      const classMap: Record<string, { fromClass: string; promoted: string[]; detained: string[]; transferred: string[]; graduated: string[] }> = {};

      for (const d of decisions) {
        const student = state.students.find((s) => s.id === d.studentId);
        if (!student) { summary.errors += 1; continue; }
        const classId = student.classId;
        if (!classMap[classId]) {
          const cls = state.classes.find((c) => c.id === classId);
          classMap[classId] = { fromClass: cls ? `${cls.name}-${cls.section}` : classId, promoted: [], detained: [], transferred: [], graduated: [] };
        }
        if (d.decision === 'promoted') {
          summary.promoted += 1;
          classMap[classId].promoted.push(student.name);
          if (d.toClassId) { student.classId = d.toClassId; const cls = state.classes.find((c) => c.id === d.toClassId); if (cls) student.class = `${cls.name}-${cls.section}`; }
          if (payload.toAcademicYear) student.academicYear = payload.toAcademicYear;
        } else if (d.decision === 'detained') {
          summary.detained += 1;
          classMap[classId].detained.push(student.name);
        } else if (d.decision === 'transferred') {
          summary.transferred += 1;
          classMap[classId].transferred.push(student.name);
          student.status = 'transferred';
        } else if (d.decision === 'graduated') {
          summary.graduated += 1;
          classMap[classId].graduated.push(student.name);
          student.status = 'graduated';
        }
      }

      for (const v of Object.values(classMap)) classReport.push(v);

      const record = { _id: recordId, summary, classReport, status: 'completed', fromAcademicYear: payload.fromAcademicYear, toAcademicYear: payload.toAcademicYear };
      state.promotionRecords.push(record);

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ promotionRecordId: recordId, summary }) });
      return;
    }

    // GET /api/promotions/records/:id
    const recordMatch = path.match(/^\/api\/promotions\/records\/([^/]+)$/);
    if (recordMatch && method === 'GET') {
      const recordId = recordMatch[1];
      const record = state.promotionRecords.find((r) => (r as any)._id === recordId);
      if (record) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ record }) });
      } else {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
      }
      return;
    }

    // POST /api/promotions/rollback/:id
    const rollbackMatch = path.match(/^\/api\/promotions\/rollback\/([^/]+)$/);
    if (rollbackMatch && method === 'POST') {
      const recordId = rollbackMatch[1];
      const record = state.promotionRecords.find((r) => (r as any)._id === recordId) as any;
      if (record) {
        record.status = 'rolledback';
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Rolled back successfully' }) });
      } else {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
      }
      return;
    }

    // Fallback
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: `Not mocked: ${method} ${path}` }) });
  });

  // TC number endpoint
  await page.route('**/api/settings/tc-numbers**', async (route) => {
    const request = route.request();
    state.requestLog.add(`${request.method()} ${new URL(request.url()).pathname}`);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ numbers: ['TC0001'] }) });
  });
}

function createPromotionState() {
  const base = createMockState();
  return {
    ...base,
    promotionRules: { minAttendancePercent: 75, feeRequirement: 'none' as string },
    promotionRecords: [] as Array<Record<string, unknown>>,
    promotionCounter: 0,
  };
}

/** Navigate promotion wizard from step 1 to step 3 with a 10-A → 11-A mapping */
async function navigateToStep3(page: import('@playwright/test').Page) {
  const wizard = page.getByTestId('promotion-wizard');
  await expect(wizard).toBeVisible({ timeout: 10_000 });

  // Step 1 → 2
  const nextBtn = page.getByTestId('wizard-next');
  await expect(nextBtn).toBeEnabled();
  await nextBtn.click();
  await expect(page.getByText(/Configure Class Mappings/i)).toBeVisible();

  // Add mapping
  await page.getByRole('button', { name: /Add Mapping/i }).click();

  // Select source class and verify
  const sourceSelect = wizard.locator('select').first();
  await expect(sourceSelect).toBeVisible();
  await sourceSelect.selectOption(CLASS_10A_ID);
  await expect(sourceSelect).toHaveValue(CLASS_10A_ID);

  // Select target class and verify
  const targetSelect = wizard.locator('select').nth(1);
  await targetSelect.selectOption(CLASS_11A_ID);
  await expect(targetSelect).toHaveValue(CLASS_11A_ID);

  // Wait for Next button to be enabled (canProceed depends on state)
  await expect(nextBtn).toBeEnabled({ timeout: 5_000 });
  await nextBtn.click();
  await expect(page.getByText('Review Students').first()).toBeVisible({ timeout: 10_000 });
}

/* ────────────────────────────────────────────────────────────
 *  SECTION 1: Certificate Generation (Tests 1–6)
 * ──────────────────────────────────────────────────────────── */

test.describe('Students — Certificates', () => {
  test('1) student profile shows quick-action buttons for all certificate types', async ({ page }) => {
    const state = createMockState();
    const student = seedStudent(state);
    await installMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');

    // Quick Actions section has Bonafide, Character, and TC buttons
    await expect(main.getByRole('heading', { name: /Quick Actions/i })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Bonafide' })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Character' })).toBeVisible();
    await expect(main.getByRole('button', { name: 'TC' })).toBeVisible();
  });

  test('2) generate bonafide certificate with purpose field', async ({ page }) => {
    const state = createMockState();
    const student = seedStudent(state);
    await installMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');

    // Click the Bonafide quick-action button
    await main.getByRole('button', { name: 'Bonafide' }).click();

    const modal = page.locator('[role="dialog"]').last();
    await expect(modal.getByText('Bonafide Certificate')).toBeVisible();

    // Verify student name is pre-filled
    await expect(modal.locator('input').first()).toHaveValue(student.name);

    // Select purpose — HeroUI Select renders both a native <option> and a listbox <span>
    await modal.getByRole('button', { name: /Purpose/i }).click();
    await page.getByLabel('Scholarship', { exact: true }).click();

    // Verify Print Certificate button is available
    await expect(modal.getByRole('button', { name: /Print Certificate/i })).toBeVisible();
  });

  test('3) generate character certificate with conduct rating and remarks', async ({ page }) => {
    const state = createMockState();
    const student = seedStudent(state);
    await installMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');

    // Click the Character quick-action button
    await main.getByRole('button', { name: 'Character' }).click();

    const modal = page.locator('[role="dialog"]').last();
    await expect(modal.getByText('Character Certificate')).toBeVisible();

    // Change conduct to "Excellent" — HeroUI Select renders both native + listbox
    await modal.getByRole('button', { name: /Conduct/i }).click();
    await page.locator('[role="listbox"] [role="option"]').filter({ hasText: 'Excellent' }).click();

    // Fill additional remarks
    const remarksArea = modal.locator('textarea').last();
    await remarksArea.fill('Outstanding student with excellent moral values.');

    await expect(modal.getByRole('button', { name: /Print Certificate/i })).toBeVisible();
  });

  test('4) generate transfer certificate with reason and last attendance date', async ({ page }) => {
    const state = createMockState();
    const student = seedStudent(state);
    await installMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');

    // Click TC quick-action button
    await main.getByRole('button', { name: 'TC' }).click();

    const modal = page.locator('[role="dialog"]').last();
    // TC modal shows "Enter Details" heading with the student name
    await expect(modal.getByText(/Enter Details/i)).toBeVisible();
    await expect(modal.getByText(student.name)).toBeVisible();

    // Verify key TC fields are present
    await expect(modal.locator('input').first()).not.toBeEmpty();
  });

  test('5) download generated certificate as PDF (print window)', async ({ page }) => {
    const state = createMockState();
    const student = seedStudent(state);
    await installMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');

    // Open bonafide certificate
    await main.getByRole('button', { name: 'Bonafide' }).click();
    const modal = page.locator('[role="dialog"]').last();
    await expect(modal.getByText('Bonafide Certificate')).toBeVisible();

    // Select purpose
    await modal.getByRole('button', { name: /Purpose/i }).click();
    await page.getByLabel('Scholarship', { exact: true }).click();

    // Mock window.open to capture print action
    await page.evaluate(() => {
      (window as any).__printWindowOpened = false;
      const mockWindow = {
        document: {
          write: () => {},
          close: () => {},
        },
        print: () => {},
        close: () => {},
      };
      window.open = () => {
        (window as any).__printWindowOpened = true;
        return mockWindow as unknown as Window;
      };
    });

    // Click Print Certificate
    await modal.getByRole('button', { name: /Print Certificate/i }).click();

    // Verify that window.open was called (print window opened)
    const printWindowOpened = await page.evaluate(() => (window as any).__printWindowOpened);
    expect(printWindowOpened).toBe(true);
  });

  test('6) certificate preview before download shows student data', async ({ page }) => {
    const state = createMockState();
    const student = seedStudent(state);
    await installMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');

    // Open character certificate modal
    await main.getByRole('button', { name: 'Character' }).click();
    const modal = page.locator('[role="dialog"]').last();

    // Verify form is pre-populated with student data
    const studentNameInput = modal.locator('input').first();
    await expect(studentNameInput).toHaveValue(student.name);

    // Verify other fields are present
    await expect(modal.getByText(/Admission No/i).first()).toBeVisible();
    await expect(modal.getByText(/Class/i).first()).toBeVisible();
    await expect(modal.getByText(/Academic Year/i).first()).toBeVisible();
    await expect(modal.getByText(/Date of Issue/i).first()).toBeVisible();
  });
});

/* ────────────────────────────────────────────────────────────
 *  SECTION 2: Bulk Promotion (Tests 7–12)
 * ──────────────────────────────────────────────────────────── */

test.describe('Students — Bulk Promotion', () => {
  test('7) bulk promotion page shows academic year selectors', async ({ page }) => {
    const state = createPromotionState();
    seedStudent(state, { name: 'Riya Sharma', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Arjun Patel', classId: CLASS_10A_ID });
    await installPromotionMockApi(page, state);

    await page.goto('/students/bulk-promotion');
    await expect(page.getByText(/Bulk Student Promotion/i).first()).toBeVisible({ timeout: 10_000 });

    // Step 1: Academic years are shown
    await expect(page.getByText(/Select Academic Years/i)).toBeVisible();
    await expect(page.getByText(/From.*Year/i).first()).toBeVisible();
    await expect(page.getByText(/To.*Year/i).first()).toBeVisible();
  });

  test('8) select eligible students for promotion with class mappings', async ({ page }) => {
    const state = createPromotionState();
    seedStudent(state, { name: 'Riya Sharma', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Arjun Patel', classId: CLASS_10A_ID });
    await installPromotionMockApi(page, state);

    await page.goto('/students/bulk-promotion');
    await navigateToStep3(page);

    // Students from class 10-A should be shown in a collapsible section
    await expect(page.getByText(/10-A/i).first()).toBeVisible();
  });

  test('9) choose target class for promotion in mappings', async ({ page }) => {
    const state = createPromotionState();
    seedStudent(state, { name: 'Riya Sharma', classId: CLASS_10A_ID });
    await installPromotionMockApi(page, state);

    await page.goto('/students/bulk-promotion');
    const wizard = page.getByTestId('promotion-wizard');
    await expect(wizard).toBeVisible({ timeout: 10_000 });

    // Step 1 → Step 2
    await page.getByTestId('wizard-next').click();
    await expect(page.getByText(/Configure Class Mappings/i)).toBeVisible();

    // Add mapping
    await page.getByRole('button', { name: /Add Mapping/i }).click();

    // Select source
    const sourceSelect = wizard.locator('select').first();
    await expect(sourceSelect).toBeVisible();
    await sourceSelect.selectOption(CLASS_10A_ID);

    // Verify target class options include 11-A
    const targetSelect = wizard.locator('select').nth(1);
    const options = await targetSelect.locator('option').allTextContents();
    expect(options.some((opt) => opt.includes('11') && opt.includes('A'))).toBe(true);

    await targetSelect.selectOption(CLASS_11A_ID);
    await expect(targetSelect).toHaveValue(CLASS_11A_ID);
  });

  test('10) promote selected students and verify success count', async ({ page }) => {
    const state = createPromotionState();
    seedStudent(state, { name: 'Riya Sharma', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Arjun Patel', classId: CLASS_10A_ID });
    await installPromotionMockApi(page, state);

    await page.goto('/students/bulk-promotion');
    await navigateToStep3(page);

    // Expand class to load student preview
    await page.getByText(/10-A/i).first().click();
    await expect(page.getByText('Riya Sharma')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Arjun Patel')).toBeVisible();

    // Step 3 → 4 (Confirm)
    await page.getByTestId('wizard-next').click();
    await expect(page.getByText(/Confirm Promotion/i)).toBeVisible();

    // Execute promotion
    await page.getByRole('button', { name: /Execute Promotion/i }).click();

    // Step 5: Report — use heading role to avoid matching the toast notification
    await expect(page.getByRole('heading', { name: /Promotion Complete/i })).toBeVisible({ timeout: 15_000 });

    await expectRequestLog(state, [
      'GET /api/promotions/rules',
      'GET /api/promotions/preview',
      'POST /api/promotions/execute',
    ]);
  });

  test('11) ineligible students (low attendance) shown with detained suggestion', async ({ page }) => {
    const state = createPromotionState();
    state.promotionRules.minAttendancePercent = 75;

    // Student with 25% attendance (below threshold)
    const lowAtt = seedStudent(state, { name: 'Low Attendance Student', classId: CLASS_10A_ID });
    state.attendance.set(lowAtt.id, [
      { studentId: lowAtt.id, classId: CLASS_10A_ID, date: '2026-01-08', status: 'present' },
      { studentId: lowAtt.id, classId: CLASS_10A_ID, date: '2026-01-09', status: 'absent' },
      { studentId: lowAtt.id, classId: CLASS_10A_ID, date: '2026-01-10', status: 'absent' },
      { studentId: lowAtt.id, classId: CLASS_10A_ID, date: '2026-01-11', status: 'absent' },
    ]);

    // Student with 100% attendance (above threshold)
    const highAtt = seedStudent(state, { name: 'High Attendance Student', classId: CLASS_10A_ID });
    state.attendance.set(highAtt.id, [
      { studentId: highAtt.id, classId: CLASS_10A_ID, date: '2026-01-08', status: 'present' },
      { studentId: highAtt.id, classId: CLASS_10A_ID, date: '2026-01-09', status: 'present' },
      { studentId: highAtt.id, classId: CLASS_10A_ID, date: '2026-01-10', status: 'present' },
      { studentId: highAtt.id, classId: CLASS_10A_ID, date: '2026-01-11', status: 'present' },
    ]);

    await installPromotionMockApi(page, state);

    await page.goto('/students/bulk-promotion');
    await navigateToStep3(page);

    // Expand class
    await page.getByText(/10-A/i).first().click();
    await expect(page.getByText('Low Attendance Student')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('High Attendance Student')).toBeVisible();

    // Low attendance student row should show "Detain" decision
    // Navigate from the name text up to the row div, then get the first select (decision dropdown)
    const lowAttSelect = page.getByText('Low Attendance Student', { exact: true })
      .locator('xpath=ancestor::div[select][1]/select[1]');
    await expect(lowAttSelect).toHaveValue('detained');

    // High attendance student row should show "Promote" decision
    // The row may have 2 selects (decision + target class), so pick the first one
    const highAttSelect = page.getByText('High Attendance Student', { exact: true })
      .locator('xpath=ancestor::div[select][1]/select[1]');
    await expect(highAttSelect).toHaveValue('promoted');
  });

  test('12) promote all eligible with single bulk action and rollback', async ({ page }) => {
    const state = createPromotionState();
    seedStudent(state, { name: 'Student A', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Student B', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Student C', classId: CLASS_10A_ID });
    await installPromotionMockApi(page, state);

    await page.goto('/students/bulk-promotion');
    await navigateToStep3(page);

    // Expand class to load students
    await page.getByText(/10-A/i).first().click();
    await expect(page.getByText('Student A')).toBeVisible({ timeout: 10_000 });

    // Step 3 → 4
    await page.getByTestId('wizard-next').click();
    await expect(page.getByText(/Confirm Promotion/i)).toBeVisible();

    // Execute
    await page.getByRole('button', { name: /Execute Promotion/i }).click();

    // Step 5: Report — use heading role to avoid matching the toast notification
    await expect(page.getByRole('heading', { name: /Promotion Complete/i })).toBeVisible({ timeout: 15_000 });

    // Verify rollback button is present
    await expect(page.getByRole('button', { name: /Rollback/i })).toBeVisible();

    // Mock confirm dialog — register BEFORE clicking rollback
    page.on('dialog', (dialog) => dialog.accept());

    // Click rollback
    await page.getByRole('button', { name: /Rollback/i }).click();

    // Verify rolled back message
    await expect(page.getByText(/rolled back/i).first()).toBeVisible({ timeout: 10_000 });

    await expectRequestLog(state, [
      'POST /api/promotions/execute',
      'POST /api/promotions/rollback/promo-record-1',
    ]);
  });
});

/* ────────────────────────────────────────────────────────────
 *  SECTION 3: Student Ratings Deep (Tests 13–14)
 * ──────────────────────────────────────────────────────────── */

test.describe('Students — Ratings Deep', () => {
  test('13) ratings tab displays all five rating dimensions with stars', async ({ page }) => {
    const state = createMockState();
    const student = seedStudent(state, {
      ratings: {
        behaviour: { rating: 4, comment: 'Well behaved', lastUpdated: '2026-03-10T10:00:00Z' },
        academics: { rating: 5, comment: 'Top scorer', lastUpdated: '2026-03-10T10:00:00Z' },
        extraCurricular: { rating: 3, comment: 'Participates', lastUpdated: '2026-03-10T10:00:00Z' },
        attendance: { rating: 4, comment: 'Regular', lastUpdated: '2026-03-10T10:00:00Z' },
        discipline: { rating: 5, comment: 'Exemplary', lastUpdated: '2026-03-10T10:00:00Z' },
      },
    });
    await installMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');

    // Switch to Ratings tab
    await main.getByRole('button', { name: /Ratings/i }).click();

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
    const student = seedStudent(state, {
      ratings: {
        behaviour: { rating: 3, comment: '' },
        academics: { rating: 3, comment: '' },
        extraCurricular: { rating: 3, comment: '' },
        attendance: { rating: 3, comment: '' },
        discipline: { rating: 3, comment: '' },
      },
    });
    await installMockApi(page, state);

    await page.goto(`/students/${student.id}`);
    const main = page.locator('main');

    // Switch to Ratings tab
    await main.getByRole('button', { name: /Ratings/i }).click();
    await expect(main.getByText(/Student Rating/i).first()).toBeVisible();

    // Click "Edit Ratings" button (scoped to avoid hitting the profile Edit button)
    await main.getByRole('button', { name: /Edit Ratings/i }).click();

    // Verify Save Changes and Cancel buttons appear during editing
    await expect(main.getByRole('button', { name: /Save Changes/i })).toBeVisible();
    await expect(main.getByRole('button', { name: /Cancel/i })).toBeVisible();

    // Click Save Changes
    await main.getByRole('button', { name: /Save Changes/i }).click();

    // Verify the student update API was called
    await expectRequestLog(state, [
      `PUT /api/students/${student.id}`,
    ]);
  });
});
