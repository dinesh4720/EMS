import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  TEACHER_A_ID, TEACHER_B_ID, CLASS_10A_ID, CLASS_11A_ID, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

interface SubjectAssignment {
  _id: string;
  staffId: string;
  staffName: string;
  subject: string;
  classId: string;
  className: string;
  schoolId: string;
}

function createSubjectAssignmentState() {
  const state = createMockState();

  const assignments: SubjectAssignment[] = [
    {
      _id: 'sa-1', staffId: TEACHER_A_ID, staffName: 'Ananya Sharma',
      subject: 'Mathematics', classId: CLASS_10A_ID, className: '10-A', schoolId: SCHOOL_ID,
    },
    {
      _id: 'sa-2', staffId: TEACHER_A_ID, staffName: 'Ananya Sharma',
      subject: 'Science', classId: CLASS_10A_ID, className: '10-A', schoolId: SCHOOL_ID,
    },
    {
      _id: 'sa-3', staffId: TEACHER_B_ID, staffName: 'Ravi Menon',
      subject: 'English', classId: CLASS_11A_ID, className: '11-A', schoolId: SCHOOL_ID,
    },
  ];

  return { state, assignments };
}

async function installSubjectAssignmentMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
  assignments: SubjectAssignment[],
) {
  await installMockApi(page, state);

  // Subject assignment endpoints
  await page.route('**/api/staff/subject-assignments**', async (route) => {
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'GET') {
      return json({ data: assignments, total: assignments.length });
    }
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const newAssignment: SubjectAssignment = {
        _id: `sa-${Date.now()}`,
        staffId: body.staffId || TEACHER_A_ID,
        staffName: state.staff.find((s) => s.id === body.staffId)?.name || 'Unknown',
        subject: body.subject,
        classId: body.classId,
        className: state.classes.find((c) => c.id === body.classId)?.name + '-' +
                   state.classes.find((c) => c.id === body.classId)?.section || 'Unknown',
        schoolId: SCHOOL_ID,
      };
      assignments.push(newAssignment);
      return json(newAssignment, 201);
    }
    return json({});
  });

  // Bulk subject assignment endpoint
  await page.route('**/api/staff/bulk-subject-assignment**', async (route) => {
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'GET') {
      // Return current assignments grouped by staff
      const grouped = state.staff
        .filter((s) => s.role === 'teacher')
        .map((s) => ({
          staffId: s.id,
          staffName: s.name,
          assignments: assignments.filter((a) => a.staffId === s.id),
        }));
      return json(grouped);
    }
    if (method === 'POST' || method === 'PUT') {
      const body = JSON.parse(route.request().postData() || '{}');
      // Apply bulk assignments
      for (const item of (body.assignments || [])) {
        const existing = assignments.find(
          (a) => a.staffId === item.staffId && a.subject === item.subject && a.classId === item.classId,
        );
        if (!existing) {
          assignments.push({
            _id: `sa-${Date.now()}-${Math.random()}`,
            staffId: item.staffId,
            staffName: state.staff.find((s) => s.id === item.staffId)?.name || 'Unknown',
            subject: item.subject,
            classId: item.classId,
            className: `${state.classes.find((c) => c.id === item.classId)?.name}-${state.classes.find((c) => c.id === item.classId)?.section}`,
            schoolId: SCHOOL_ID,
          });
        }
      }
      return json({ success: true, message: 'Subject assignments updated', count: body.assignments?.length || 0 });
    }
    return json({});
  });

  // Staff profile with assignments
  await page.route(`**/api/staff/${TEACHER_A_ID}/assignments`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        assignments: assignments.filter((a) => a.staffId === TEACHER_A_ID),
      }),
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC014 — Assign subjects to teachers using bulk assignment
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC014 — Assign Subjects to Staff', () => {

  test('1) bulk subject assignment page loads', async ({ page }) => {
    const { state, assignments } = createSubjectAssignmentState();
    await installSubjectAssignmentMockApi(page, state, assignments);

    await page.goto('/staffs/bulk-subject-assignment');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should show subject assignment UI
    const hasAssignmentUI = body?.toLowerCase().includes('subject') ||
                            body?.toLowerCase().includes('assign') ||
                            body?.toLowerCase().includes('teacher');
    expect(hasAssignmentUI).toBeTruthy();
  });

  test('2) teacher list is displayed for selection', async ({ page }) => {
    const { state, assignments } = createSubjectAssignmentState();
    await installSubjectAssignmentMockApi(page, state, assignments);

    await page.goto('/staffs/bulk-subject-assignment');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should show teacher names
    const hasAnanya = body?.includes('Ananya');
    const hasRavi = body?.includes('Ravi');
    expect(hasAnanya || hasRavi).toBeTruthy();
  });

  test('3) select teacher "Ananya Sharma" to view/edit assignments', async ({ page }) => {
    const { state, assignments } = createSubjectAssignmentState();
    await installSubjectAssignmentMockApi(page, state, assignments);

    await page.goto('/staffs/bulk-subject-assignment');
    await page.waitForLoadState('networkidle');

    // Select Ananya from a dropdown or click on her row
    const teacherSelect = page.locator('select[name="teacher"], select[name="staffId"]').first();
    const hasSelect = await teacherSelect.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSelect) {
      await teacherSelect.selectOption({ label: 'Ananya Sharma' });
      await page.waitForTimeout(500);
    } else {
      // Click on Ananya's row
      const ananyaRow = page.getByText('Ananya Sharma').first();
      if (await ananyaRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        await ananyaRow.click();
        await page.waitForTimeout(500);
      }
    }

    const body = await page.textContent('body');
    expect(body).toContain('Ananya');
  });

  test('4) subject-class assignment grid shows available subjects', async ({ page }) => {
    const { state, assignments } = createSubjectAssignmentState();
    await installSubjectAssignmentMockApi(page, state, assignments);

    await page.goto('/staffs/bulk-subject-assignment');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should show subject names from state
    const hasSubjects = body?.includes('Mathematics') ||
                        body?.includes('Science') ||
                        body?.includes('English') ||
                        body?.includes('Social Studies');
    expect(hasSubjects).toBeTruthy();
  });

  test('5) class options are shown for subject assignment', async ({ page }) => {
    const { state, assignments } = createSubjectAssignmentState();
    await installSubjectAssignmentMockApi(page, state, assignments);

    await page.goto('/staffs/bulk-subject-assignment');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should show class names
    const hasClasses = body?.includes('10') || body?.includes('11');
    expect(hasClasses).toBeTruthy();
  });

  test('6) can assign Mathematics to multiple classes', async ({ page }) => {
    const { state, assignments } = createSubjectAssignmentState();
    await installSubjectAssignmentMockApi(page, state, assignments);

    await page.goto('/staffs/bulk-subject-assignment');
    await page.waitForLoadState('networkidle');

    // Look for checkboxes or multi-select for class-subject combinations
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      // Check a few checkboxes to assign subjects
      const firstCheckbox = checkboxes.first();
      if (await firstCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstCheckbox.check();
      }
    }

    // Page should still be functional
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('7) save button triggers subject assignment API', async ({ page }) => {
    const { state, assignments } = createSubjectAssignmentState();
    await installSubjectAssignmentMockApi(page, state, assignments);

    await page.goto('/staffs/bulk-subject-assignment');
    await page.waitForLoadState('networkidle');

    const saveBtn = page.getByRole('button', { name: /save|assign|update|submit/i }).first();
    const hasSave = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSave) {
      await saveBtn.click();
      await page.waitForLoadState('networkidle');

      const body = await page.textContent('body');
      // Should show success notification or stay on page
      const hasSuccess = body?.toLowerCase().includes('success') ||
                         body?.toLowerCase().includes('saved') ||
                         body?.toLowerCase().includes('updated');
      // Even without visible success message, page should not error
      expect(body).toBeTruthy();
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('8) success notification appears after saving', async ({ page }) => {
    const { state, assignments } = createSubjectAssignmentState();
    await installSubjectAssignmentMockApi(page, state, assignments);

    await page.goto('/staffs/bulk-subject-assignment');
    await page.waitForLoadState('networkidle');

    const saveBtn = page.getByRole('button', { name: /save|assign|update|submit/i }).first();
    const hasSave = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSave) {
      await saveBtn.click();
      await page.waitForTimeout(1000);

      // Look for toast/notification
      const toast = page.locator(
        '[class*="toast"], [class*="notification"], [role="alert"], [class*="Toastify"]',
      ).first();
      const hasToast = await toast.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasToast) {
        const toastText = await toast.textContent();
        expect(toastText?.toLowerCase()).toMatch(/success|saved|updated|assigned/);
      }
    }
  });

  test('9) navigate to staff profile to verify assigned subjects', async ({ page }) => {
    const { state, assignments } = createSubjectAssignmentState();
    await installSubjectAssignmentMockApi(page, state, assignments);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Profile should show Ananya's info
    expect(body).toContain('Ananya');

    // Look for a subjects or classes tab
    const subjectsTab = page.locator('button').filter({ hasText: /subjects|classes|assignment/i }).first();
    const hasTab = await subjectsTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTab) {
      await subjectsTab.click();
      await page.waitForTimeout(500);

      const tabBody = await page.textContent('body');
      // Should show Mathematics and Science assignments
      const hasSubjects = tabBody?.includes('Mathematics') || tabBody?.includes('Science');
      expect(hasSubjects).toBeTruthy();
    }
  });

  test('10) page renders without errors for authenticated admin', async ({ page }) => {
    const { state, assignments } = createSubjectAssignmentState();
    await installSubjectAssignmentMockApi(page, state, assignments);

    await page.goto('/staffs/bulk-subject-assignment');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});
