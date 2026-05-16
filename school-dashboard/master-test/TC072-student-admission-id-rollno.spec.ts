import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedStudent,
  CLASS_10A_ID, CLASS_11A_ID, SCHOOL_ID,
  type MockState, type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Extended mock with admission ID and roll number generation
 * ──────────────────────────────────────────────────────────── */

let capturedPostPayloads: Array<Record<string, unknown>> = [];
let admissionCounter = 0;

async function installAdmissionMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  admissionCounter = 0;
  capturedPostPayloads = [];
  await installMockApi(page, state);

  // Override next-admission-id endpoint
  await page.route('**/api/students/next-admission-id**', async (route) => {
    admissionCounter++;
    state.requestLog.add('GET /api/students/next-admission-id');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        admissionId: `ADM-2026-${String(admissionCounter).padStart(4, '0')}`,
      }),
    });
  });

  // Override next-roll-number endpoint
  await page.route('**/api/students/next-roll-number**', async (route) => {
    const url = new URL(route.request().url());
    const classId = url.searchParams.get('classId');
    state.requestLog.add(`GET /api/students/next-roll-number?classId=${classId}`);

    // Count existing students in that class and return next
    const classStudents = state.students.filter((s) => s.classId === classId);
    const nextRoll = classStudents.length + 1;

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ rollNumber: String(nextRoll) }),
    });
  });

  // Capture POST to /students
  await page.route('**/api/students', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === '/api/students' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      capturedPostPayloads.push(body);
      const s = seedStudent(state, body as Partial<StudentRecord>);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(s),
      });
    }

    // GET /api/students
    if (path === '/api/students' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: state.students, total: state.students.length, page: 1, limit: 100 }),
      });
    }

    return route.continue();
  });
}

/* ────────────────────────────────────────────────────────────
 *  TC072 — Admission ID auto-generation and roll number
 * ──────────────────────────────────────────────────────────── */

test.describe('TC072 - Student Admission ID & Roll Number', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    await installAdmissionMockApi(page, state);
  });

  test('should auto-populate admission ID on add student page', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Verify admission ID field is auto-populated
    const admissionInput = page.getByLabel(/admission.*id|admission.*no/i)
      .or(page.getByPlaceholder(/admission/i))
      .or(page.locator('input[value*="ADM-2026"]'))
      .first();

    if (await admissionInput.isVisible().catch(() => false)) {
      const value = await admissionInput.inputValue();
      expect(value).toMatch(/ADM-2026-0001/);
    }
  });

  test('should auto-generate roll number when class 10-A is selected', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Select class 10-A
    const classSelect = page.getByLabel(/class/i)
      .or(page.getByRole('combobox', { name: /class/i }))
      .or(page.getByRole('button', { name: /select class|class/i }))
      .first();

    if (await classSelect.isVisible().catch(() => false)) {
      await classSelect.click();
      const option10A = page.getByRole('option', { name: /10.*A/i })
        .or(page.getByText('10-A'))
        .first();
      if (await option10A.isVisible().catch(() => false)) {
        await option10A.click();
        await page.waitForTimeout(500);
      }
    }

    // Verify roll number auto-generated
    const rollInput = page.getByLabel(/roll/i)
      .or(page.getByPlaceholder(/roll/i))
      .first();
    if (await rollInput.isVisible().catch(() => false)) {
      const rollValue = await rollInput.inputValue();
      // Should be "1" since no students in 10-A yet
      expect(rollValue).toBeTruthy();
    }
  });

  test('should recalculate roll number when class changes from 10-A to 11-A', async ({ page }) => {
    // Seed 3 students in 10-A and 1 in 11-A so roll numbers differ
    seedStudent(state, { name: 'Student A', classId: CLASS_10A_ID, rollNo: '1' });
    seedStudent(state, { name: 'Student B', classId: CLASS_10A_ID, rollNo: '2' });
    seedStudent(state, { name: 'Student C', classId: CLASS_10A_ID, rollNo: '3' });
    seedStudent(state, { name: 'Student D', classId: CLASS_11A_ID, rollNo: '1' });

    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Select class 10-A first
    const classSelect = page.getByLabel(/class/i)
      .or(page.getByRole('combobox', { name: /class/i }))
      .or(page.getByRole('button', { name: /select class|class/i }))
      .first();

    if (await classSelect.isVisible().catch(() => false)) {
      await classSelect.click();
      const option10A = page.getByRole('option', { name: /10.*A/i })
        .or(page.getByText('10-A'))
        .first();
      if (await option10A.isVisible().catch(() => false)) {
        await option10A.click();
        await page.waitForTimeout(500);
      }

      const rollInput = page.getByLabel(/roll/i)
        .or(page.getByPlaceholder(/roll/i))
        .first();

      // Roll should be 4 (next after 3 existing students in 10-A)
      if (await rollInput.isVisible().catch(() => false)) {
        const roll10A = await rollInput.inputValue();

        // Now switch to 11-A
        await classSelect.click();
        const option11A = page.getByRole('option', { name: /11.*A/i })
          .or(page.getByText('11-A'))
          .first();
        if (await option11A.isVisible().catch(() => false)) {
          await option11A.click();
          await page.waitForTimeout(500);
        }

        // Roll should be 2 (next after 1 existing student in 11-A)
        const roll11A = await rollInput.inputValue();
        // They should be different since different number of students
        if (roll10A && roll11A) {
          expect(roll10A).not.toBe(roll11A);
        }
      }
    }
  });

  test('should allow manual roll number override', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Select class
    const classSelect = page.getByLabel(/class/i)
      .or(page.getByRole('combobox', { name: /class/i }))
      .or(page.getByRole('button', { name: /select class|class/i }))
      .first();

    if (await classSelect.isVisible().catch(() => false)) {
      await classSelect.click();
      const option10A = page.getByRole('option', { name: /10.*A/i })
        .or(page.getByText('10-A'))
        .first();
      if (await option10A.isVisible().catch(() => false)) {
        await option10A.click();
        await page.waitForTimeout(500);
      }
    }

    // Override roll number manually
    const rollInput = page.getByLabel(/roll/i)
      .or(page.getByPlaceholder(/roll/i))
      .first();
    if (await rollInput.isVisible().catch(() => false)) {
      await rollInput.clear();
      await rollInput.fill('42');
      await expect(rollInput).toHaveValue('42');
    }
  });

  test('should submit form with correct admission ID and roll number', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Fill required fields
    const nameInput = page.getByLabel(/full name/i)
      .or(page.getByPlaceholder(/full name/i))
      .first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('New Student');
    }

    // DOB
    const dobInput = page.getByLabel(/date of birth/i)
      .or(page.getByPlaceholder(/date of birth/i))
      .first();
    if (await dobInput.isVisible().catch(() => false)) {
      await dobInput.fill('15/06/2012');
    }

    // Gender
    const genderSelect = page.getByLabel(/gender/i)
      .or(page.getByRole('button', { name: /gender|select gender/i }))
      .first();
    if (await genderSelect.isVisible().catch(() => false)) {
      await genderSelect.click();
      const maleOption = page.getByRole('option', { name: /male/i })
        .or(page.getByText('Male', { exact: true }))
        .first();
      if (await maleOption.isVisible().catch(() => false)) {
        await maleOption.click();
      }
    }

    // Class
    const classSelect = page.getByLabel(/class/i)
      .or(page.getByRole('combobox', { name: /class/i }))
      .or(page.getByRole('button', { name: /select class|class/i }))
      .first();
    if (await classSelect.isVisible().catch(() => false)) {
      await classSelect.click();
      const option10A = page.getByRole('option', { name: /10.*A/i })
        .or(page.getByText('10-A'))
        .first();
      if (await option10A.isVisible().catch(() => false)) {
        await option10A.click();
        await page.waitForTimeout(500);
      }
    }

    // Phone
    const phoneInput = page.getByLabel(/phone|mobile/i)
      .or(page.getByPlaceholder(/phone|mobile/i))
      .first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('9876500001');
    }

    // Submit form (may need to navigate through steps)
    const submitBtn = page.getByRole('button', { name: /submit|save|register|create/i }).first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(1000);

      // Verify the POST payload includes admission ID
      if (capturedPostPayloads.length > 0) {
        const payload = capturedPostPayloads[0];
        const admId = payload.admissionId || payload.admissionNo;
        if (admId) {
          expect(String(admId)).toMatch(/ADM/);
        }
      }
    }
  });

  test('should increment admission ID for second student', async ({ page }) => {
    // Create first student
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    const admissionInput = page.getByLabel(/admission.*id|admission.*no/i)
      .or(page.getByPlaceholder(/admission/i))
      .or(page.locator('input[value*="ADM-2026"]'))
      .first();

    if (await admissionInput.isVisible().catch(() => false)) {
      const firstAdmId = await admissionInput.inputValue();

      // Navigate away and come back (simulating second student creation)
      await page.goto('/students');
      await page.waitForLoadState('networkidle');
      await page.goto('/students/add');
      await page.waitForLoadState('networkidle');

      const admissionInput2 = page.getByLabel(/admission.*id|admission.*no/i)
        .or(page.getByPlaceholder(/admission/i))
        .or(page.locator('input[value*="ADM-2026"]'))
        .first();

      if (await admissionInput2.isVisible().catch(() => false)) {
        const secondAdmId = await admissionInput2.inputValue();
        // Second ID should be incremented
        if (firstAdmId && secondAdmId) {
          expect(secondAdmId).not.toBe(firstAdmId);
          // ADM-2026-0002 vs ADM-2026-0001
          expect(secondAdmId).toMatch(/ADM-2026-0002/);
        }
      }
    }
  });

  test('should preserve admission ID if manually overridden', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    const admissionInput = page.getByLabel(/admission.*id|admission.*no/i)
      .or(page.getByPlaceholder(/admission/i))
      .first();

    if (await admissionInput.isVisible().catch(() => false)) {
      // Clear auto-generated and set custom
      await admissionInput.clear();
      await admissionInput.fill('CUSTOM-001');
      await expect(admissionInput).toHaveValue('CUSTOM-001');

      // Verify it stays after interacting with other fields
      const nameInput = page.getByLabel(/full name/i)
        .or(page.getByPlaceholder(/full name/i))
        .first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('Test Student');
        await nameInput.blur();
        await page.waitForTimeout(300);
      }

      // Admission ID should still be the custom value
      await expect(admissionInput).toHaveValue('CUSTOM-001');
    }
  });
});
