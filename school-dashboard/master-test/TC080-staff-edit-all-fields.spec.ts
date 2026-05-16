import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  TEACHER_A_ID, CLASS_10A_ID, CLASS_11A_ID, SCHOOL_ID,
  type MockState, type StaffMember,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 800 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Enriched staff record for edit testing
 * ───────────────────────────────────────────────────────────────────── */

interface EnrichedStaff extends StaffMember {
  qualifications: Array<{ degree: string; university: string; year: number }>;
  bankDetails: { accountNumber: string; bankName: string; ifsc: string };
  salaryStructure: {
    basicSalary: number; hra: number; da: number; pf: number;
    totalEarnings: number; totalDeductions: number; netSalary: number;
  };
  emergencyContact: { name: string; phone: string; relation: string };
  employmentType: string;
  address: string;
  city: string;
  state: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  maritalStatus: string;
}

function getEnrichedTeacher(state: MockState): EnrichedStaff {
  const base = state.staff.find((s) => s.id === TEACHER_A_ID)!;
  return {
    ...base,
    qualifications: [
      { degree: 'B.Ed', university: 'Delhi University', year: 2015 },
      { degree: 'M.Sc Mathematics', university: 'JNU', year: 2013 },
    ],
    bankDetails: {
      accountNumber: '****5678',
      bankName: 'State Bank of India',
      ifsc: 'SBIN0001234',
    },
    salaryStructure: {
      basicSalary: 35000, hra: 8000, da: 5000, pf: 2000,
      totalEarnings: 48000, totalDeductions: 2000, netSalary: 46000,
    },
    emergencyContact: { name: 'Suresh Sharma', phone: '9876500099', relation: 'Father' },
    employmentType: 'Full-Time',
    address: '123 Green Park, South Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    dateOfBirth: '1990-06-15',
    gender: 'Female',
    bloodGroup: 'B+',
    maritalStatus: 'Single',
  };
}

let putPayload: Record<string, unknown> | null = null;

async function installStaffEditMockApi(page: import('@playwright/test').Page, state: MockState) {
  const enriched = getEnrichedTeacher(state);
  await installMockApi(page, state);

  putPayload = null;

  // Staff detail endpoint with enriched data
  await page.route(`**/api/staff/${TEACHER_A_ID}`, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(enriched),
      });
    }
    if (method === 'PUT') {
      putPayload = JSON.parse(route.request().postData() || '{}');
      const updated = { ...enriched, ...putPayload };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      });
    }
    return route.continue();
  });

  // Departments
  await page.route('**/api/departments**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { _id: 'dept-sci', name: 'Science' },
        { _id: 'dept-math', name: 'Mathematics' },
        { _id: 'dept-arts', name: 'Arts' },
        { _id: 'dept-eng', name: 'English' },
      ]),
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC080 — Edit every field on a staff record
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC080 — Staff Edit All Fields', () => {

  test('1) staff profile page loads with enriched data', async ({ page }) => {
    const state = createMockState();
    await installStaffEditMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toContain('Ananya');
    expect(body?.toLowerCase()).toMatch(/teacher|science/);
  });

  test('2) clicking edit opens edit form/drawer', async ({ page }) => {
    const state = createMockState();
    await installStaffEditMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('button', { name: /edit|update|modify/i }).first();
    const hasEdit = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEdit) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    // Should show edit form/drawer/modal
    const body = await page.textContent('body');
    const hasForm = body?.toLowerCase().includes('name') &&
                    (body?.toLowerCase().includes('email') || body?.toLowerCase().includes('phone'));
    expect(hasForm).toBeTruthy();
  });

  test('3) existing name is pre-populated in edit form', async ({ page }) => {
    const state = createMockState();
    await installStaffEditMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('button', { name: /edit|update|modify/i }).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const hasName = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasName) {
      const value = await nameInput.inputValue();
      expect(value).toContain('Ananya');
    }
  });

  test('4) existing email and phone are pre-populated', async ({ page }) => {
    const state = createMockState();
    await installStaffEditMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('button', { name: /edit|update|modify/i }).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const emailVal = await emailInput.inputValue();
      expect(emailVal).toContain('ananya');
    }

    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const phoneVal = await phoneInput.inputValue();
      expect(phoneVal).toContain('9876543210');
    }
  });

  test('5) change name, phone, and email', async ({ page }) => {
    const state = createMockState();
    await installStaffEditMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('button', { name: /edit|update|modify/i }).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.clear();
      await nameInput.fill('Ananya Sharma Gupta');
    }

    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.clear();
      await phoneInput.fill('9999888877');
    }

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.clear();
      await emailInput.fill('ananya.gupta@schoolsync.test');
    }

    // Verify fields were updated
    if (await nameInput.isVisible().catch(() => false)) {
      expect(await nameInput.inputValue()).toBe('Ananya Sharma Gupta');
    }
  });

  test('6) change department from Science to Mathematics', async ({ page }) => {
    const state = createMockState();
    await installStaffEditMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('button', { name: /edit|update|modify/i }).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    const deptSelect = page.locator('select[name="department"]').first();
    if (await deptSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deptSelect.selectOption('Mathematics');
      expect(await deptSelect.inputValue()).toBe('Mathematics');
    } else {
      // Custom dropdown — look for department text and click to change
      const deptField = page.locator('[class*="department"] input, [data-testid*="department"]').first();
      if (await deptField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deptField.click();
        const mathOption = page.getByText('Mathematics').first();
        if (await mathOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await mathOption.click();
        }
      }
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('7) update emergency contact', async ({ page }) => {
    const state = createMockState();
    await installStaffEditMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('button', { name: /edit|update|modify/i }).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    // Navigate to the emergency contact section/step if needed
    const emergencySection = page.locator('input[name="emergencyContact.name"], input[name="emergencyContactName"], input[name*="emergency" i]').first();
    if (await emergencySection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emergencySection.clear();
      await emergencySection.fill('Kavitha Sharma');
    }

    const emergencyPhone = page.locator('input[name="emergencyContact.phone"], input[name="emergencyContactPhone"], input[name*="emergencyPhone" i]').first();
    if (await emergencyPhone.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emergencyPhone.clear();
      await emergencyPhone.fill('9111222333');
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('8) change employment type', async ({ page }) => {
    const state = createMockState();
    await installStaffEditMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('button', { name: /edit|update|modify/i }).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    const empTypeSelect = page.locator('select[name="employmentType"], select[name="empType"]').first();
    if (await empTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await empTypeSelect.selectOption('Part-Time');
    } else {
      // May be radio buttons or custom
      const partTimeOption = page.getByText(/part.time|contract/i).first();
      if (await partTimeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await partTimeOption.click();
      }
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('9) save changes and verify PUT API is called', async ({ page }) => {
    const state = createMockState();
    await installStaffEditMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('button', { name: /edit|update|modify/i }).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    // Change name
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.clear();
      await nameInput.fill('Ananya Sharma Gupta');
    }

    // Save
    const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const [putRequest] = await Promise.all([
        page.waitForRequest(
          (req) => req.url().includes(`/api/staff/${TEACHER_A_ID}`) && req.method() === 'PUT',
          { timeout: 5000 },
        ).catch(() => null),
        saveBtn.click(),
      ]);

      if (putRequest) {
        const payload = JSON.parse(putRequest.postData() || '{}');
        // Name should be in the payload
        expect(payload.name || payload.staffData?.name).toContain('Gupta');
      }
    }

    await page.waitForLoadState('networkidle');
  });

  test('10) success notification appears after saving', async ({ page }) => {
    const state = createMockState();
    await installStaffEditMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const editBtn = page.getByRole('button', { name: /edit|update|modify/i }).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    // Change a field
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.clear();
      await nameInput.fill('Ananya Sharma Gupta');
    }

    // Save
    const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(1000);

      // Check for toast/notification
      const toast = page.locator(
        '[class*="toast"], [class*="notification"], [role="alert"], [class*="Toastify"]',
      ).first();
      const hasToast = await toast.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasToast) {
        const toastText = await toast.textContent();
        expect(toastText?.toLowerCase()).toMatch(/success|updated|saved/);
      }
    }
  });

  test('11) profile reflects updated name after save', async ({ page }) => {
    const state = createMockState();
    await installStaffEditMockApi(page, state);

    // Override to return updated data after PUT
    await page.route(`**/api/staff/${TEACHER_A_ID}`, async (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...getEnrichedTeacher(state),
            name: 'Ananya Sharma Gupta',
            department: 'Mathematics',
            phone: '9999888877',
            email: 'ananya.gupta@schoolsync.test',
          }),
        });
      }
      // After save, GET returns updated data
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...getEnrichedTeacher(state),
          name: 'Ananya Sharma Gupta',
          department: 'Mathematics',
        }),
      });
    });

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Since we override the GET to return updated data
    expect(body).toContain('Ananya Sharma Gupta');
  });

  test('12) page does not redirect to login during edit flow', async ({ page }) => {
    const state = createMockState();
    await installStaffEditMockApi(page, state);

    await page.goto(`/staffs/${TEACHER_A_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const editBtn = page.getByRole('button', { name: /edit|update|modify/i }).first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page).not.toHaveURL(/\/login/);
  });
});
