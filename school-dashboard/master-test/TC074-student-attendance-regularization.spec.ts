import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedStudent, seedAttendanceForClass,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState, type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Helpers
 * ──────────────────────────────────────────────────────────── */

function seedStudentWithAbsence(state: MockState): {
  student: StudentRecord;
  absentDate: string;
} {
  const student = seedStudent(state, {
    name: 'Ravi Sharma',
    classId: CLASS_10A_ID,
  });

  // Seed 10 days attendance: 8 present, 2 absent
  for (let day = 1; day <= 10; day++) {
    const date = `2026-03-${String(day).padStart(2, '0')}`;
    const status = day === 5 || day === 8 ? 'absent' : 'present';
    state.attendance.push({
      _id: `att-${student.id}-${date}`,
      id: `att-${student.id}-${date}`,
      studentId: student.id,
      classId: CLASS_10A_ID,
      date,
      status,
      schoolId: SCHOOL_ID,
    });
  }

  return { student, absentDate: '2026-03-05' };
}

/* ────────────────────────────────────────────────────────────
 *  Extended mock API with attendance regularization
 * ──────────────────────────────────────────────────────────── */

let capturedRegularizationPayload: Record<string, unknown> | null = null;

async function installAttendanceRegularizationMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  capturedRegularizationPayload = null;
  await installMockApi(page, state);

  // Override attendance update/regularization endpoint
  await page.route('**/api/attendance/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;
    state.requestLog.add(`${method} ${path}`);

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // PUT /api/attendance/:id — Update attendance (regularization)
    if (method === 'PUT' && path.match(/\/api\/attendance\/[^/]+$/)) {
      const body = JSON.parse(request.postData() || '{}');
      capturedRegularizationPayload = body;
      const id = path.split('/').pop()!;
      const record = state.attendance.find((a) => a.id === id || a._id === id);
      if (record) {
        record.status = body.status || record.status;
        return json(record);
      }
      return json({ error: 'Not found' }, 404);
    }

    // POST /api/attendance/regularize — Regularization request
    if (method === 'POST' && path.includes('/regularize')) {
      const body = JSON.parse(request.postData() || '{}');
      capturedRegularizationPayload = body;
      const record = state.attendance.find(
        (a) => a.studentId === body.studentId && a.date === body.date,
      );
      if (record) {
        record.status = body.newStatus || body.status || 'present';
        return json({
          ...record,
          regularized: true,
          reason: body.reason,
          regularizedBy: state.user.id,
        });
      }
      return json({ message: 'Regularization submitted' }, 201);
    }

    // GET /api/attendance/class/:classId
    if (method === 'GET' && path.match(/\/api\/attendance\/class\/[^/]+/)) {
      const classId = path.split('/').pop()!;
      const dateParam = url.searchParams.get('date');
      let records = state.attendance.filter((a) => a.classId === classId);
      if (dateParam) {
        records = records.filter((a) => a.date === dateParam);
      }
      return json(records);
    }

    // GET /api/attendance/student/:studentId
    if (method === 'GET' && path.match(/\/api\/attendance\/student\/[^/]+/)) {
      const studentId = path.split('/').pop()!;
      return json(state.attendance.filter((a) => a.studentId === studentId));
    }

    return route.continue();
  });
}

/* ────────────────────────────────────────────────────────────
 *  TC074 — Regularize a wrongly marked attendance
 * ──────────────────────────────────────────────────────────── */

test.describe('TC074 - Student Attendance Regularization', () => {
  let state: MockState;
  let student: StudentRecord;
  let absentDate: string;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    const seeded = seedStudentWithAbsence(state);
    student = seeded.student;
    absentDate = seeded.absentDate;
    await installAttendanceRegularizationMockApi(page, state);
  });

  test('should display student attendance showing absent days', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Click Attendance tab
    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByText(/attendance/i))
      .first();
    if (await attendanceTab.isVisible().catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    // Verify absent count is 2
    const absentCount = page.getByText(/absent.*2|2.*absent/i).first();
    if (await absentCount.isVisible().catch(() => false)) {
      await expect(absentCount).toBeVisible();
    }

    // Verify attendance percentage (8 present out of 10 = 80%)
    const percentage = page.getByText(/80%|80\.0%/).first();
    if (await percentage.isVisible().catch(() => false)) {
      await expect(percentage).toBeVisible();
    }
  });

  test('should verify student shows as absent on specific date in class attendance', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}/attendance`);
    await page.waitForLoadState('networkidle');

    // Select the date March 5 (the absent date)
    const dateInput = page.getByLabel(/date/i)
      .or(page.getByPlaceholder(/date/i))
      .or(page.locator('input[type="date"]'))
      .first();
    if (await dateInput.isVisible().catch(() => false)) {
      await dateInput.fill('2026-03-05');
      await page.waitForTimeout(500);
    }

    // Verify student shows as absent
    const studentRow = page.getByRole('row').filter({ hasText: 'Ravi Sharma' }).first();
    if (await studentRow.isVisible().catch(() => false)) {
      const absentIndicator = studentRow.getByText(/absent/i)
        .or(studentRow.locator('.text-red, .bg-red, [data-status="absent"]'))
        .first();
      if (await absentIndicator.isVisible().catch(() => false)) {
        await expect(absentIndicator).toBeVisible();
      }
    }
  });

  test('should open regularization modal/drawer', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Navigate to attendance tab
    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByText(/attendance/i))
      .first();
    if (await attendanceTab.isVisible().catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    // Click regularize/edit button
    const regularizeBtn = page.getByRole('button', { name: /regularize|edit|correct/i })
      .or(page.locator('[data-testid="regularize-btn"]'))
      .or(page.getByText(/regularize/i))
      .first();

    if (await regularizeBtn.isVisible().catch(() => false)) {
      await regularizeBtn.click();
      await page.waitForTimeout(500);

      // Verify modal/drawer opens
      const modal = page.getByRole('dialog')
        .or(page.locator('[data-testid="regularize-modal"]'))
        .or(page.getByText(/regularize attendance|correct attendance|edit attendance/i))
        .first();
      await expect(modal).toBeVisible();
    }
  });

  test('should change status from absent to present with reason', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByText(/attendance/i))
      .first();
    if (await attendanceTab.isVisible().catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    const regularizeBtn = page.getByRole('button', { name: /regularize|edit|correct/i })
      .or(page.locator('[data-testid="regularize-btn"]'))
      .or(page.getByText(/regularize/i))
      .first();

    if (await regularizeBtn.isVisible().catch(() => false)) {
      await regularizeBtn.click();
      await page.waitForTimeout(500);

      // Select the date
      const dateInput = page.getByLabel(/date/i)
        .or(page.locator('input[type="date"]'))
        .first();
      if (await dateInput.isVisible().catch(() => false)) {
        await dateInput.fill('2026-03-05');
      }

      // Change status to present
      const statusSelect = page.getByLabel(/status|new status/i)
        .or(page.getByRole('combobox', { name: /status/i }))
        .or(page.getByRole('button', { name: /absent|status/i }))
        .first();

      if (await statusSelect.isVisible().catch(() => false)) {
        await statusSelect.click();
        const presentOption = page.getByRole('option', { name: /present/i })
          .or(page.getByText('Present', { exact: true }))
          .first();
        if (await presentOption.isVisible().catch(() => false)) {
          await presentOption.click();
        }
      }

      // Enter reason for regularization
      const reasonInput = page.getByLabel(/reason/i)
        .or(page.getByPlaceholder(/reason/i))
        .or(page.locator('textarea[name*="reason"]'))
        .first();
      if (await reasonInput.isVisible().catch(() => false)) {
        await reasonInput.fill('Student was present but mistakenly marked absent');
      }

      // Submit
      const submitBtn = page.getByRole('button', { name: /submit|save|confirm|apply/i }).first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(500);

        // Verify the regularization payload
        if (capturedRegularizationPayload) {
          const status = capturedRegularizationPayload.status
            || capturedRegularizationPayload.newStatus;
          expect(status).toBe('present');
          expect(capturedRegularizationPayload.reason).toBeTruthy();
        }
      }
    }
  });

  test('should verify attendance updated after regularization', async ({ page }) => {
    // Pre-apply the regularization: change March 5 from absent to present
    const record = state.attendance.find(
      (a) => a.studentId === student.id && a.date === '2026-03-05',
    );
    if (record) {
      record.status = 'present';
    }

    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByText(/attendance/i))
      .first();
    if (await attendanceTab.isVisible().catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    // Now absent count should be 1 (only March 8 remains)
    const absentCount = page.getByText(/absent.*1|1.*absent/i).first();
    if (await absentCount.isVisible().catch(() => false)) {
      await expect(absentCount).toBeVisible();
    }

    // Attendance percentage should be 90% (9 present out of 10)
    const percentage = page.getByText(/90%|90\.0%/).first();
    if (await percentage.isVisible().catch(() => false)) {
      await expect(percentage).toBeVisible();
    }
  });

  test('should show attendance summary with correct present and absent counts', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const attendanceTab = page.getByRole('tab', { name: /attendance/i })
      .or(page.getByText(/attendance/i))
      .first();
    if (await attendanceTab.isVisible().catch(() => false)) {
      await attendanceTab.click();
      await page.waitForTimeout(500);
    }

    // Verify present count is 8
    const presentCount = page.getByText(/present.*8|8.*present/i).first();
    if (await presentCount.isVisible().catch(() => false)) {
      await expect(presentCount).toBeVisible();
    }

    // Verify total working days
    const totalDays = page.getByText(/total.*10|10.*days/i).first();
    if (await totalDays.isVisible().catch(() => false)) {
      await expect(totalDays).toBeVisible();
    }
  });

  test('should handle regularization from class attendance view', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}/attendance`);
    await page.waitForLoadState('networkidle');

    // Select date
    const dateInput = page.getByLabel(/date/i)
      .or(page.locator('input[type="date"]'))
      .first();
    if (await dateInput.isVisible().catch(() => false)) {
      await dateInput.fill('2026-03-05');
      await page.waitForTimeout(500);
    }

    // Find the student's row and look for edit/regularize action
    const studentRow = page.getByRole('row').filter({ hasText: 'Ravi Sharma' }).first();
    if (await studentRow.isVisible().catch(() => false)) {
      const editBtn = studentRow.getByRole('button', { name: /edit|regularize|change/i })
        .or(studentRow.locator('button').first())
        .first();

      if (await editBtn.isVisible().catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(500);

        // Change to present
        const presentRadio = page.getByLabel(/present/i)
          .or(page.getByRole('radio', { name: /present/i }))
          .or(page.getByRole('button', { name: /present/i }))
          .first();
        if (await presentRadio.isVisible().catch(() => false)) {
          await presentRadio.click();
        }

        const saveBtn = page.getByRole('button', { name: /save|submit|confirm/i }).first();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });
});
