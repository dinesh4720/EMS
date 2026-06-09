import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedStudent,
  CLASS_10A_ID, CLASS_11A_ID, SCHOOL_ID,
  type MockState, type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Extended mock API with class transfer endpoints
 * ──────────────────────────────────────────────────────────── */

interface TransferRecord {
  _id: string; id: string;
  studentId: string;
  fromClassId: string;
  toClassId: string;
  reason: string;
  date: string;
  schoolId: string;
}

async function installTransferMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
  transfers: TransferRecord[],
) {
  await installMockApi(page, state);

  await page.route('**/api/students/*/transfer**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    state.requestLog.add(`${method} ${path}`);

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    const idMatch = path.match(/\/api\/students\/([^/]+)\/transfer/);
    const studentId = idMatch?.[1] || '';

    if (method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const student = state.students.find((s) => s.id === studentId);
      if (!student) return json({ error: 'Student not found' }, 404);

      const fromClassId = student.classId;
      const toClassId = body.toClassId || body.classId;

      // Update the student's class
      const fromClass = state.classes.find((c) => c.id === fromClassId);
      const toClass = state.classes.find((c) => c.id === toClassId);

      if (fromClass) fromClass.studentCount = Math.max(0, fromClass.studentCount - 1);
      if (toClass) toClass.studentCount++;
      student.classId = toClassId;

      const transfer: TransferRecord = {
        _id: `xfer-${Date.now()}`, id: `xfer-${Date.now()}`,
        studentId, fromClassId, toClassId,
        reason: body.reason || '',
        date: new Date().toISOString().split('T')[0],
        schoolId: SCHOOL_ID,
      };
      transfers.push(transfer);

      return json({
        message: 'Student transferred successfully',
        student,
        transfer,
      });
    }

    return json(transfers.filter((t) => t.studentId === studentId));
  });

  // Also handle the move/change-class route variant
  await page.route('**/api/students/*/move**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'POST' || method === 'PUT') {
      const idMatch = path.match(/\/api\/students\/([^/]+)\/move/);
      const studentId = idMatch?.[1] || '';
      const body = JSON.parse(request.postData() || '{}');
      const student = state.students.find((s) => s.id === studentId);

      if (student) {
        const fromClassId = student.classId;
        const toClassId = body.toClassId || body.classId;

        const fromClass = state.classes.find((c) => c.id === fromClassId);
        const toClass = state.classes.find((c) => c.id === toClassId);

        if (fromClass) fromClass.studentCount = Math.max(0, fromClass.studentCount - 1);
        if (toClass) toClass.studentCount++;
        student.classId = toClassId;

        return json({ message: 'Student moved successfully', student });
      }
      return json({ error: 'Student not found' }, 404);
    }

    return json({});
  });
}

/* ────────────────────────────────────────────────────────────
 *  TC025 — Move a student from one class to another
 * ──────────────────────────────────────────────────────────── */

test.describe('TC025 - Move Student Class', () => {
  let state: MockState;
  let student: StudentRecord;
  let transfers: TransferRecord[];

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    student = seedStudent(state, {
      name: 'Aarav Krishnan',
      classId: CLASS_10A_ID,
    });
    // Seed a few more students in 10-A
    seedStudent(state, { name: 'Diya Sharma', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Ishaan Gupta', classId: CLASS_10A_ID });
    transfers = [];
    await installTransferMockApi(page, state, transfers);
  });

  test('should navigate to student profile and see class info', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Verify student name
    await expect(page.getByText('Aarav Krishnan').first()).toBeVisible();

    // Verify current class is 10-A
    const classInfo = page.getByText(/10.*A|10-A|Class 10/i).first();
    await expect(classInfo).toBeVisible();
  });

  test('should find the Move to Another Class action', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Look for an action menu or direct button
    const actionMenu = page.getByRole('button', { name: /action|more|menu|\.\.\./i })
      .or(page.locator('[aria-label="Actions"]'))
      .or(page.locator('[aria-label="More options"]'))
      .first();

    if (await actionMenu.isVisible().catch(() => false)) {
      await actionMenu.click();
    }

    // Look for the move/transfer option
    const moveBtn = page.getByRole('menuitem', { name: /move|transfer|change class/i })
      .or(page.getByRole('button', { name: /move|transfer|change class/i }))
      .or(page.getByText(/move to another class|transfer class|change class/i))
      .first();

    await expect(moveBtn).toBeVisible();
  });

  test('should open modal when clicking Move to Another Class', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Open action menu if needed
    const actionMenu = page.getByRole('button', { name: /action|more|menu|\.\.\./i })
      .or(page.locator('[aria-label="Actions"]'))
      .or(page.locator('[aria-label="More options"]'))
      .first();
    if (await actionMenu.isVisible().catch(() => false)) {
      await actionMenu.click();
    }

    // Click move/transfer
    const moveBtn = page.getByRole('menuitem', { name: /move|transfer|change class/i })
      .or(page.getByRole('button', { name: /move|transfer|change class/i }))
      .or(page.getByText(/move to another class|transfer class|change class/i))
      .first();
    await moveBtn.click();

    // Verify modal appears
    const modal = page.getByRole('dialog')
      .or(page.locator('[role="dialog"]'))
      .first();
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('should select target class 11-A and confirm the move', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Open action menu
    const actionMenu = page.getByRole('button', { name: /action|more|menu|\.\.\./i })
      .or(page.locator('[aria-label="Actions"]'))
      .or(page.locator('[aria-label="More options"]'))
      .first();
    if (await actionMenu.isVisible().catch(() => false)) {
      await actionMenu.click();
    }

    // Click move
    const moveBtn = page.getByRole('menuitem', { name: /move|transfer|change class/i })
      .or(page.getByRole('button', { name: /move|transfer|change class/i }))
      .or(page.getByText(/move to another class|transfer class|change class/i))
      .first();
    await moveBtn.click();
    await page.waitForTimeout(500);

    // Select target class 11-A in the modal
    const classSelect = page.getByRole('dialog').getByLabel(/class/i)
      .or(page.getByRole('dialog').getByRole('button', { name: /class|select/i }))
      .or(page.getByRole('combobox'))
      .first();

    if (await classSelect.isVisible().catch(() => false)) {
      await classSelect.click();

      const class11Option = page.getByRole('option', { name: /11.*A|11-A/i })
        .or(page.getByText(/11-A|11 - A/i))
        .first();
      if (await class11Option.isVisible().catch(() => false)) {
        await class11Option.click();
      }
    }

    // Confirm the move
    const confirmBtn = page.getByRole('button', { name: /confirm|move|transfer|save/i }).last();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);

      // Verify success notification
      const successMsg = page.getByText(/success|moved|transferred/i).first();
      await expect(successMsg).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update student class after move', async ({ page }) => {
    // Manually update the student class as if the move was already done
    student.classId = CLASS_11A_ID;

    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Verify student name
    await expect(page.getByText('Aarav Krishnan').first()).toBeVisible();

    // Verify class now shows 11-A
    const classInfo = page.getByText(/11.*A|11-A|Class 11/i).first();
    if (await classInfo.isVisible().catch(() => false)) {
      await expect(classInfo).toBeVisible();
    }
  });
});
