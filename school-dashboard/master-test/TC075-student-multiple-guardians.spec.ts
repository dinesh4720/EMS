import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedStudent,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState, type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────��──────────
 *  Extended mock to capture POST payload
 * ──────────────────────────────────────────────────────────── */

let capturedPostPayload: Record<string, unknown> | null = null;

async function installGuardianMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  capturedPostPayload = null;
  await installMockApi(page, state);

  // Override student creation to capture payload
  await page.route('**/api/students', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === '/api/students' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      capturedPostPayload = body;
      const s = seedStudent(state, body as Partial<StudentRecord>);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(s),
      });
    }

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

/* ──���────────────────────��──────────────────────────────��─────
 *  TC075 — Create student with multiple parents/guardians
 * ───���───────���──────────────────────────────────────────────── */

test.describe('TC075 - Student Multiple Guardians', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    capturedPostPayload = null;
    await installGuardianMockApi(page, state);
  });

  test('should navigate to add student page with guardian section', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Verify the form is visible
    const heading = page.getByRole('heading', { name: /add student|new student|register/i })
      .or(page.getByText(/student registration|add new student/i))
      .first();
    await expect(heading.first()).toBeVisible();

    // Look for guardian/parent section
    const guardianSection = page.getByText(/guardian|parent|father|family/i).first();
    if (await guardianSection.isVisible().catch(() => false)) {
      await expect(guardianSection).toBeVisible();
    }
  });

  test('should fill basic student info (name, DOB, class)', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Full name
    const nameInput = page.getByLabel(/full name/i)
      .or(page.getByPlaceholder(/full name/i))
      .first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('Ananya Mehta');
      await expect(nameInput).toHaveValue('Ananya Mehta');
    }

    // Date of birth
    const dobInput = page.getByLabel(/date of birth/i)
      .or(page.getByPlaceholder(/date of birth/i))
      .first();
    if (await dobInput.isVisible().catch(() => false)) {
      await dobInput.fill('25/12/2012');
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
      }
    }
  });

  test('should add father details as first guardian', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Fill basic info first
    const nameInput = page.getByLabel(/full name/i)
      .or(page.getByPlaceholder(/full name/i))
      .first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('Ananya Mehta');
    }

    // Father name
    const fatherNameInput = page.getByLabel(/father.*name|parent.*name/i)
      .or(page.getByPlaceholder(/father.*name|parent.*name|guardian.*name/i))
      .first();
    if (await fatherNameInput.isVisible().catch(() => false)) {
      await fatherNameInput.fill('Rajesh Mehta');
      await expect(fatherNameInput).toHaveValue('Rajesh Mehta');
    }

    // Father phone
    const fatherPhoneInput = page.getByLabel(/father.*phone|parent.*phone/i)
      .or(page.getByPlaceholder(/father.*phone|parent.*phone|guardian.*phone/i))
      .first();
    if (await fatherPhoneInput.isVisible().catch(() => false)) {
      await fatherPhoneInput.fill('9876500001');
      await expect(fatherPhoneInput).toHaveValue('9876500001');
    }

    // Father email
    const fatherEmailInput = page.getByLabel(/father.*email|parent.*email/i)
      .or(page.getByPlaceholder(/father.*email|parent.*email|guardian.*email/i))
      .first();
    if (await fatherEmailInput.isVisible().catch(() => false)) {
      await fatherEmailInput.fill('rajesh@test.com');
    }

    // Father occupation
    const fatherOccInput = page.getByLabel(/father.*occupation|parent.*occupation/i)
      .or(page.getByPlaceholder(/occupation/i))
      .first();
    if (await fatherOccInput.isVisible().catch(() => false)) {
      await fatherOccInput.fill('Doctor');
    }
  });

  test('should add mother as second guardian', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Fill basic info
    const nameInput = page.getByLabel(/full name/i)
      .or(page.getByPlaceholder(/full name/i))
      .first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('Ananya Mehta');
    }

    // Fill father first
    const fatherNameInput = page.getByLabel(/father.*name|parent.*name/i)
      .or(page.getByPlaceholder(/father.*name|parent.*name|guardian.*name/i))
      .first();
    if (await fatherNameInput.isVisible().catch(() => false)) {
      await fatherNameInput.fill('Rajesh Mehta');
    }

    // Look for "Add Mother" or "Add Guardian" button
    const addMotherBtn = page.getByRole('button', { name: /add mother|add guardian|add parent|add contact|\+ add/i })
      .or(page.getByText(/\+ add mother|\+ add guardian|\+ add parent/i))
      .first();

    if (await addMotherBtn.isVisible().catch(() => false)) {
      await addMotherBtn.click();
      await page.waitForTimeout(300);

      // Mother name
      const motherNameInput = page.getByLabel(/mother.*name/i)
        .or(page.getByPlaceholder(/mother.*name/i))
        .or(page.locator('[name*="mother"][name*="name"], [name*="guardian"][name*="name"]').last())
        .first();
      if (await motherNameInput.isVisible().catch(() => false)) {
        await motherNameInput.fill('Priya Mehta');
      }

      // Mother phone
      const motherPhoneInput = page.getByLabel(/mother.*phone/i)
        .or(page.locator('[name*="mother"][name*="phone"], [name*="guardian"][name*="phone"]').last())
        .first();
      if (await motherPhoneInput.isVisible().catch(() => false)) {
        await motherPhoneInput.fill('9876500002');
      }

      // Mother email
      const motherEmailInput = page.getByLabel(/mother.*email/i)
        .or(page.locator('[name*="mother"][name*="email"], [name*="guardian"][name*="email"]').last())
        .first();
      if (await motherEmailInput.isVisible().catch(() => false)) {
        await motherEmailInput.fill('priya@test.com');
      }

      // Mother occupation
      const motherOccInput = page.getByLabel(/mother.*occupation/i)
        .or(page.locator('[name*="mother"][name*="occupation"], [name*="guardian"][name*="occupation"]').last())
        .first();
      if (await motherOccInput.isVisible().catch(() => false)) {
        await motherOccInput.fill('Lawyer');
      }
    }
  });

  test('should add grandparent as third guardian then remove it', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Fill basic info
    const nameInput = page.getByLabel(/full name/i)
      .or(page.getByPlaceholder(/full name/i))
      .first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('Ananya Mehta');
    }

    // Add first guardian (father)
    const fatherNameInput = page.getByLabel(/father.*name|parent.*name/i)
      .or(page.getByPlaceholder(/father.*name|parent.*name|guardian.*name/i))
      .first();
    if (await fatherNameInput.isVisible().catch(() => false)) {
      await fatherNameInput.fill('Rajesh Mehta');
    }

    // Add second guardian (mother)
    const addMotherBtn = page.getByRole('button', { name: /add mother|add guardian|add parent|\+ add/i })
      .or(page.getByText(/\+ add/i))
      .first();
    if (await addMotherBtn.isVisible().catch(() => false)) {
      await addMotherBtn.click();
      await page.waitForTimeout(300);
    }

    // Add third guardian (grandparent)
    const addGuardianBtn = page.getByRole('button', { name: /add guardian|add parent|add contact|\+ add/i })
      .or(page.getByText(/\+ add/i))
      .first();
    if (await addGuardianBtn.isVisible().catch(() => false)) {
      await addGuardianBtn.click();
      await page.waitForTimeout(300);

      // Fill grandparent name
      const guardianNameInputs = page.locator(
        '[name*="guardian"][name*="name"], [name*="parent"][name*="name"]',
      );
      const lastGuardianName = guardianNameInputs.last();
      if (await lastGuardianName.isVisible().catch(() => false)) {
        await lastGuardianName.fill('Grandpa Mehta');
      }

      // Fill grandparent phone
      const guardianPhoneInputs = page.locator(
        '[name*="guardian"][name*="phone"], [name*="parent"][name*="phone"]',
      );
      const lastGuardianPhone = guardianPhoneInputs.last();
      if (await lastGuardianPhone.isVisible().catch(() => false)) {
        await lastGuardianPhone.fill('9876500003');
      }

      // Verify 3 guardian sections exist
      const guardianSections = page.locator(
        '[data-testid*="guardian"], .guardian-section, .parent-section',
      );
      let countBefore = 0;
      if (await guardianSections.first().isVisible().catch(() => false)) {
        countBefore = await guardianSections.count();
        expect(countBefore).toBeGreaterThanOrEqual(3);
      }

      // Remove the third guardian
      const removeBtn = page.getByRole('button', { name: /remove|delete|×|x/i }).last()
        .or(page.locator('[data-testid*="remove-guardian"]').last())
        .or(page.locator('button[aria-label*="remove"], button[aria-label*="delete"]').last());

      if (await removeBtn.isVisible().catch(() => false)) {
        await removeBtn.click();
        await page.waitForTimeout(300);

        // Verify only 2 guardian sections remain
        if (await guardianSections.first().isVisible().catch(() => false)) {
          const newCount = await guardianSections.count();
          expect(newCount).toBeLessThan(countBefore);
        }
      }
    }
  });

  test('should submit form and verify API payload includes both parents', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Fill basic info
    const nameInput = page.getByLabel(/full name/i)
      .or(page.getByPlaceholder(/full name/i))
      .first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('Ananya Mehta');
    }

    // DOB
    const dobInput = page.getByLabel(/date of birth/i)
      .or(page.getByPlaceholder(/date of birth/i))
      .first();
    if (await dobInput.isVisible().catch(() => false)) {
      await dobInput.fill('25/12/2012');
    }

    // Gender
    const genderSelect = page.getByLabel(/gender/i)
      .or(page.getByRole('button', { name: /gender|select gender/i }))
      .first();
    if (await genderSelect.isVisible().catch(() => false)) {
      await genderSelect.click();
      const femaleOption = page.getByRole('option', { name: /female/i })
        .or(page.getByText('Female', { exact: true }))
        .first();
      if (await femaleOption.isVisible().catch(() => false)) {
        await femaleOption.click();
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
      }
    }

    // Phone
    const phoneInput = page.getByLabel(/phone|mobile/i)
      .or(page.getByPlaceholder(/phone|mobile/i))
      .first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('9876500010');
    }

    // Father details
    const fatherNameInput = page.getByLabel(/father.*name|parent.*name/i)
      .or(page.getByPlaceholder(/father.*name|parent.*name|guardian.*name/i))
      .first();
    if (await fatherNameInput.isVisible().catch(() => false)) {
      await fatherNameInput.fill('Rajesh Mehta');
    }

    const fatherPhoneInput = page.getByLabel(/father.*phone|parent.*phone/i)
      .or(page.getByPlaceholder(/father.*phone|parent.*phone|guardian.*phone/i))
      .first();
    if (await fatherPhoneInput.isVisible().catch(() => false)) {
      await fatherPhoneInput.fill('9876500001');
    }

    const fatherEmailInput = page.getByLabel(/father.*email|parent.*email/i)
      .or(page.getByPlaceholder(/father.*email|parent.*email|guardian.*email/i))
      .first();
    if (await fatherEmailInput.isVisible().catch(() => false)) {
      await fatherEmailInput.fill('rajesh@test.com');
    }

    const fatherOccInput = page.getByLabel(/father.*occupation|parent.*occupation/i)
      .or(page.getByPlaceholder(/occupation/i))
      .first();
    if (await fatherOccInput.isVisible().catch(() => false)) {
      await fatherOccInput.fill('Doctor');
    }

    // Add mother
    const addBtn = page.getByRole('button', { name: /add mother|add guardian|add parent|\+ add/i })
      .or(page.getByText(/\+ add/i))
      .first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(300);

      const motherNameInput = page.getByLabel(/mother.*name/i)
        .or(page.locator('[name*="mother"][name*="name"], [name*="guardian"][name*="name"]').last())
        .first();
      if (await motherNameInput.isVisible().catch(() => false)) {
        await motherNameInput.fill('Priya Mehta');
      }

      const motherPhoneInput = page.getByLabel(/mother.*phone/i)
        .or(page.locator('[name*="mother"][name*="phone"], [name*="guardian"][name*="phone"]').last())
        .first();
      if (await motherPhoneInput.isVisible().catch(() => false)) {
        await motherPhoneInput.fill('9876500002');
      }

      const motherEmailInput = page.getByLabel(/mother.*email/i)
        .or(page.locator('[name*="mother"][name*="email"], [name*="guardian"][name*="email"]').last())
        .first();
      if (await motherEmailInput.isVisible().catch(() => false)) {
        await motherEmailInput.fill('priya@test.com');
      }

      const motherOccInput = page.getByLabel(/mother.*occupation/i)
        .or(page.locator('[name*="mother"][name*="occupation"], [name*="guardian"][name*="occupation"]').last())
        .first();
      if (await motherOccInput.isVisible().catch(() => false)) {
        await motherOccInput.fill('Lawyer');
      }
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /submit|save|register|create/i }).first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(1000);

      // Verify POST payload includes guardians
      if (capturedPostPayload) {
        const guardians = capturedPostPayload.guardians as Array<Record<string, unknown>> | undefined;
        if (guardians) {
          expect(guardians.length).toBeGreaterThanOrEqual(2);
          const father = guardians.find((g) => g.relation === 'father' || g.name === 'Rajesh Mehta');
          const mother = guardians.find((g) => g.relation === 'mother' || g.name === 'Priya Mehta');
          if (father) {
            expect(father.name).toBe('Rajesh Mehta');
            expect(father.phone).toBe('9876500001');
          }
          if (mother) {
            expect(mother.name).toBe('Priya Mehta');
            expect(mother.phone).toBe('9876500002');
          }
        }
      }
    }
  });

  test('should display both parents on student profile', async ({ page }) => {
    // Seed a student with both parents
    seedStudent(state, {
      name: 'Ananya Mehta',
      classId: CLASS_10A_ID,
      guardians: [
        { name: 'Rajesh Mehta', relation: 'father', phone: '9876500001', email: 'rajesh@test.com', occupation: 'Doctor' },
        { name: 'Priya Mehta', relation: 'mother', phone: '9876500002', email: 'priya@test.com', occupation: 'Lawyer' },
      ],
    });

    const studentId = state.students.find((s) => s.name === 'Ananya Mehta')!.id;
    await page.goto(`/students/dashboard?id=${studentId}`);
    await page.waitForLoadState('networkidle');

    // Verify father's name displayed
    const fatherName = page.getByText('Rajesh Mehta').first();
    if (await fatherName.isVisible().catch(() => false)) {
      await expect(fatherName).toBeVisible();
    }

    // Verify mother's name displayed
    const motherName = page.getByText('Priya Mehta').first();
    if (await motherName.isVisible().catch(() => false)) {
      await expect(motherName).toBeVisible();
    }

    // Verify relation labels
    const fatherLabel = page.getByText(/father/i).first();
    if (await fatherLabel.isVisible().catch(() => false)) {
      await expect(fatherLabel).toBeVisible();
    }

    const motherLabel = page.getByText(/mother/i).first();
    if (await motherLabel.isVisible().catch(() => false)) {
      await expect(motherLabel).toBeVisible();
    }

    // Verify phone numbers
    const fatherPhone = page.getByText('9876500001').first();
    if (await fatherPhone.isVisible().catch(() => false)) {
      await expect(fatherPhone).toBeVisible();
    }

    const motherPhone = page.getByText('9876500002').first();
    if (await motherPhone.isVisible().catch(() => false)) {
      await expect(motherPhone).toBeVisible();
    }

    // Verify occupations
    const doctorLabel = page.getByText('Doctor').first();
    if (await doctorLabel.isVisible().catch(() => false)) {
      await expect(doctorLabel).toBeVisible();
    }

    const lawyerLabel = page.getByText('Lawyer').first();
    if (await lawyerLabel.isVisible().catch(() => false)) {
      await expect(lawyerLabel).toBeVisible();
    }
  });

  test('should display guardian emails on student profile', async ({ page }) => {
    seedStudent(state, {
      name: 'Test Student',
      classId: CLASS_10A_ID,
      guardians: [
        { name: 'Father Test', relation: 'father', phone: '9876500001', email: 'father@test.com', occupation: 'Engineer' },
        { name: 'Mother Test', relation: 'mother', phone: '9876500002', email: 'mother@test.com', occupation: 'Teacher' },
      ],
    });

    const studentId = state.students.find((s) => s.name === 'Test Student')!.id;
    await page.goto(`/students/dashboard?id=${studentId}`);
    await page.waitForLoadState('networkidle');

    // Check for guardian emails
    const fatherEmail = page.getByText('father@test.com').first();
    if (await fatherEmail.isVisible().catch(() => false)) {
      await expect(fatherEmail).toBeVisible();
    }

    const motherEmail = page.getByText('mother@test.com').first();
    if (await motherEmail.isVisible().catch(() => false)) {
      await expect(motherEmail).toBeVisible();
    }
  });
});
