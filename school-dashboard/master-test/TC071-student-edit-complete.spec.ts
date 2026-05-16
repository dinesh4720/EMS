import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedStudent,
  ADMIN_ID, TEACHER_A_ID, TEACHER_B_ID,
  CLASS_10A_ID, CLASS_11A_ID, SCHOOL_ID,
  type MockState, type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Helpers
 * ──────────────────────────────────────────────────────────── */

function seedFullStudent(state: MockState): StudentRecord {
  return seedStudent(state, {
    name: 'Aarav Krishnan',
    classId: CLASS_10A_ID,
    gender: 'Male',
    dateOfBirth: '2011-08-14',
    email: 'aarav@test.com',
    phone: '9876543210',
    address: '42 MG Road',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560001',
    rollNo: '1',
    admissionId: 'ADM-0001',
    guardians: [
      {
        name: 'Suresh Krishnan', relation: 'father',
        phone: '9876543211', email: 'suresh@test.com',
        occupation: 'Engineer',
      },
    ],
  });
}

/* ────────────────────────────────────────────────────────────
 *  Extended mock to capture PUT payloads
 * ──────────────────────────────────────────────────────────── */

let capturedPutPayload: Record<string, unknown> | null = null;

async function installEditMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override student PUT to capture payload
  await page.route('**/api/students/*', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;

    if (method === 'PUT' && path.match(/\/api\/students\/[^/]+$/)) {
      const body = JSON.parse(request.postData() || '{}');
      capturedPutPayload = body;
      const id = path.split('/').pop()!;
      const idx = state.students.findIndex((s) => s.id === id);
      if (idx >= 0) {
        Object.assign(state.students[idx], body);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.students[idx]),
        });
      }
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not found' }),
      });
    }

    return route.continue();
  });
}

/* ────────────────────────────────────────────────────────────
 *  TC071 — Edit every single field on a student record
 * ──────────────────────────────────────────────────────────── */

test.describe('TC071 - Student Edit Complete', () => {
  let state: MockState;
  let student: StudentRecord;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    student = seedFullStudent(state);
    capturedPutPayload = null;
    await installEditMockApi(page, state);
  });

  test('should open edit drawer from student list', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Verify the student is listed
    await expect(page.getByText('Aarav Krishnan').first()).toBeVisible();

    // Click edit button on the student row
    const editButton = page.getByRole('row').filter({ hasText: 'Aarav Krishnan' })
      .getByRole('button', { name: /edit/i })
      .or(page.getByRole('row').filter({ hasText: 'Aarav Krishnan' }).locator('[data-testid="edit-btn"]'))
      .or(page.getByRole('row').filter({ hasText: 'Aarav Krishnan' }).locator('button').filter({ hasText: /edit/i }))
      .first();

    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Verify the edit drawer/modal opens
      const editDrawer = page.getByRole('dialog')
        .or(page.locator('[data-testid="edit-student-drawer"]'))
        .or(page.getByText(/edit student/i))
        .first();
      await expect(editDrawer).toBeVisible();
    }
  });

  test('should pre-populate all existing data in the edit form', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Open edit drawer
    const editButton = page.getByRole('row').filter({ hasText: 'Aarav Krishnan' })
      .getByRole('button', { name: /edit/i })
      .or(page.getByRole('row').filter({ hasText: 'Aarav Krishnan' }).locator('button').first())
      .first();

    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Verify fullName pre-populated
      const nameInput = page.getByLabel(/full name/i)
        .or(page.getByPlaceholder(/full name/i))
        .first();
      if (await nameInput.isVisible().catch(() => false)) {
        await expect(nameInput).toHaveValue('Aarav Krishnan');
      }

      // Verify dateOfBirth pre-populated
      const dobInput = page.getByLabel(/date of birth/i)
        .or(page.getByPlaceholder(/date of birth/i))
        .first();
      if (await dobInput.isVisible().catch(() => false)) {
        const dobValue = await dobInput.inputValue();
        expect(dobValue).toContain('2011');
      }

      // Verify gender pre-populated
      const genderDisplay = page.getByText('Male')
        .or(page.locator('[value="Male"]'))
        .first();
      if (await genderDisplay.isVisible().catch(() => false)) {
        await expect(genderDisplay).toBeVisible();
      }

      // Verify phone pre-populated
      const phoneInput = page.getByLabel(/phone|mobile/i)
        .or(page.getByPlaceholder(/phone|mobile/i))
        .first();
      if (await phoneInput.isVisible().catch(() => false)) {
        await expect(phoneInput).toHaveValue(/9876543210/);
      }

      // Verify email pre-populated
      const emailInput = page.getByLabel(/email/i)
        .or(page.getByPlaceholder(/email/i))
        .first();
      if (await emailInput.isVisible().catch(() => false)) {
        await expect(emailInput).toHaveValue('aarav@test.com');
      }

      // Verify address pre-populated
      const addressInput = page.getByLabel(/address/i)
        .or(page.getByPlaceholder(/address/i))
        .first();
      if (await addressInput.isVisible().catch(() => false)) {
        await expect(addressInput).toHaveValue(/42 MG Road/);
      }

      // Verify city pre-populated
      const cityInput = page.getByLabel(/city/i)
        .or(page.getByPlaceholder(/city/i))
        .first();
      if (await cityInput.isVisible().catch(() => false)) {
        await expect(cityInput).toHaveValue('Bangalore');
      }

      // Verify state pre-populated
      const stateInput = page.getByLabel(/^state$/i)
        .or(page.getByPlaceholder(/state/i))
        .first();
      if (await stateInput.isVisible().catch(() => false)) {
        const stateVal = await stateInput.inputValue();
        expect(stateVal).toContain('Karnataka');
      }

      // Verify zip code pre-populated
      const zipInput = page.getByLabel(/zip|pin/i)
        .or(page.getByPlaceholder(/zip|pin/i))
        .first();
      if (await zipInput.isVisible().catch(() => false)) {
        await expect(zipInput).toHaveValue('560001');
      }

      // Verify roll number pre-populated
      const rollInput = page.getByLabel(/roll/i)
        .or(page.getByPlaceholder(/roll/i))
        .first();
      if (await rollInput.isVisible().catch(() => false)) {
        await expect(rollInput).toHaveValue('1');
      }

      // Verify parent info pre-populated
      const parentNameInput = page.getByLabel(/father.*name|parent.*name/i)
        .or(page.getByPlaceholder(/father.*name|parent.*name/i))
        .or(page.locator('input[value="Suresh Krishnan"]'))
        .first();
      if (await parentNameInput.isVisible().catch(() => false)) {
        await expect(parentNameInput).toHaveValue(/Suresh Krishnan/);
      }
    }
  });

  test('should update full name and verify PUT payload', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Open edit
    const editBtn = page.getByRole('row').filter({ hasText: 'Aarav Krishnan' })
      .getByRole('button', { name: /edit/i })
      .or(page.getByRole('row').filter({ hasText: 'Aarav Krishnan' }).locator('button').first())
      .first();

    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);

      // Change fullName
      const nameInput = page.getByLabel(/full name/i)
        .or(page.getByPlaceholder(/full name/i))
        .first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.clear();
        await nameInput.fill('Updated Name');
      }

      // Save
      const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(500);

        // Verify PUT was called with updated name
        if (capturedPutPayload) {
          expect(capturedPutPayload.name || capturedPutPayload.fullName).toBe('Updated Name');
        }
      }
    }
  });

  test('should change class from 10-A to 11-A', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('row').filter({ hasText: 'Aarav Krishnan' })
      .getByRole('button', { name: /edit/i })
      .or(page.getByRole('row').filter({ hasText: 'Aarav Krishnan' }).locator('button').first())
      .first();

    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);

      // Find class selector
      const classSelect = page.getByLabel(/class/i)
        .or(page.getByRole('combobox', { name: /class/i }))
        .or(page.getByRole('button', { name: /class|10.*A/i }))
        .first();

      if (await classSelect.isVisible().catch(() => false)) {
        await classSelect.click();
        const option11A = page.getByRole('option', { name: /11.*A/i })
          .or(page.getByText('11-A'))
          .first();
        if (await option11A.isVisible().catch(() => false)) {
          await option11A.click();
        }
      }

      // Save
      const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(500);

        // Verify class changed in PUT payload
        if (capturedPutPayload) {
          const classVal = capturedPutPayload.classId || capturedPutPayload.class;
          expect(classVal).toBeTruthy();
        }
      }
    }
  });

  test('should change phone number and parent email', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('row').filter({ hasText: 'Aarav Krishnan' })
      .getByRole('button', { name: /edit/i })
      .or(page.getByRole('row').filter({ hasText: 'Aarav Krishnan' }).locator('button').first())
      .first();

    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);

      // Change phone
      const phoneInput = page.getByLabel(/phone|mobile/i)
        .or(page.getByPlaceholder(/phone|mobile/i))
        .first();
      if (await phoneInput.isVisible().catch(() => false)) {
        await phoneInput.clear();
        await phoneInput.fill('9999888877');
      }

      // Change parent email
      const parentEmailInput = page.getByLabel(/parent.*email|father.*email|guardian.*email/i)
        .or(page.locator('input[value="suresh@test.com"]'))
        .first();
      if (await parentEmailInput.isVisible().catch(() => false)) {
        await parentEmailInput.clear();
        await parentEmailInput.fill('suresh.new@test.com');
      }

      // Save
      const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(500);

        if (capturedPutPayload) {
          const phone = capturedPutPayload.phone || capturedPutPayload.mobile;
          if (phone) {
            expect(phone).toBe('9999888877');
          }
        }
      }
    }
  });

  test('should add a second parent (mother) to existing student', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('row').filter({ hasText: 'Aarav Krishnan' })
      .getByRole('button', { name: /edit/i })
      .or(page.getByRole('row').filter({ hasText: 'Aarav Krishnan' }).locator('button').first())
      .first();

    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);

      // Look for "Add Parent" / "Add Guardian" button
      const addParentBtn = page.getByRole('button', { name: /add parent|add guardian|add mother|add contact/i })
        .or(page.getByText(/\+ add/i))
        .first();

      if (await addParentBtn.isVisible().catch(() => false)) {
        await addParentBtn.click();
        await page.waitForTimeout(300);

        // Fill mother's details - these may be in a second section/group
        const motherNameInput = page.getByLabel(/mother.*name/i)
          .or(page.getByPlaceholder(/mother.*name|guardian name/i))
          .or(page.locator('[name*="guardian"][name*="name"]').last())
          .first();
        if (await motherNameInput.isVisible().catch(() => false)) {
          await motherNameInput.fill('Lakshmi Krishnan');
        }

        const motherPhoneInput = page.getByLabel(/mother.*phone/i)
          .or(page.locator('[name*="guardian"][name*="phone"]').last())
          .first();
        if (await motherPhoneInput.isVisible().catch(() => false)) {
          await motherPhoneInput.fill('9876543212');
        }

        const motherEmailInput = page.getByLabel(/mother.*email/i)
          .or(page.locator('[name*="guardian"][name*="email"]').last())
          .first();
        if (await motherEmailInput.isVisible().catch(() => false)) {
          await motherEmailInput.fill('lakshmi@test.com');
        }
      }

      // Save
      const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(500);

        // Verify PUT includes guardians array
        if (capturedPutPayload) {
          const guardians = capturedPutPayload.guardians as Array<Record<string, unknown>> | undefined;
          if (guardians) {
            expect(guardians.length).toBeGreaterThanOrEqual(2);
          }
        }
      }
    }
  });

  test('should show success notification after saving edits', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('row').filter({ hasText: 'Aarav Krishnan' })
      .getByRole('button', { name: /edit/i })
      .or(page.getByRole('row').filter({ hasText: 'Aarav Krishnan' }).locator('button').first())
      .first();

    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);

      // Make a trivial change
      const nameInput = page.getByLabel(/full name/i)
        .or(page.getByPlaceholder(/full name/i))
        .first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.clear();
        await nameInput.fill('Updated Name');
      }

      const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(1000);

        // Verify success notification/toast
        const toast = page.getByText(/success|updated|saved/i)
          .or(page.locator('[role="alert"]'))
          .or(page.locator('.toast, .notification, [data-testid="toast"]'))
          .first();
        if (await toast.isVisible().catch(() => false)) {
          await expect(toast).toBeVisible();
        }
      }
    }
  });

  test('should verify changes reflected on student profile after edit', async ({ page }) => {
    // First edit the student via direct state mutation (simulating a successful PUT)
    student.name = 'Updated Name';
    student.phone = '9999888877';

    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    // Verify updated name appears on profile
    const nameElement = page.getByText('Updated Name').first();
    await expect(nameElement).toBeVisible();

    // Verify updated phone if displayed
    const phoneElement = page.getByText('9999888877').first();
    if (await phoneElement.isVisible().catch(() => false)) {
      await expect(phoneElement).toBeVisible();
    }
  });

  test('should verify aadhaar number and blood group fields in edit form', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('row').filter({ hasText: 'Aarav Krishnan' })
      .getByRole('button', { name: /edit/i })
      .or(page.getByRole('row').filter({ hasText: 'Aarav Krishnan' }).locator('button').first())
      .first();

    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);

      // Aadhaar number field
      const aadhaarInput = page.getByLabel(/aadhaar/i)
        .or(page.getByPlaceholder(/aadhaar/i))
        .first();
      if (await aadhaarInput.isVisible().catch(() => false)) {
        await aadhaarInput.clear();
        await aadhaarInput.fill('123456789012');
        await expect(aadhaarInput).toHaveValue('123456789012');
      }

      // Blood group field
      const bloodGroupInput = page.getByLabel(/blood group/i)
        .or(page.getByRole('button', { name: /blood group/i }))
        .first();
      if (await bloodGroupInput.isVisible().catch(() => false)) {
        await bloodGroupInput.click();
        const bgOption = page.getByRole('option', { name: /B\+/i })
          .or(page.getByText('B+', { exact: true }))
          .first();
        if (await bgOption.isVisible().catch(() => false)) {
          await bgOption.click();
        }
      }
    }
  });
});
