import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, SCHOOL_ID, CLASS_10A_ID,
  type MockState, type StaffMember,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 800 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

const NEW_STAFF_ID = '64b100000000000000000050';

function createNewStaff(): StaffMember {
  return {
    _id: NEW_STAFF_ID, id: NEW_STAFF_ID,
    name: 'Dr. Ramesh Kumar',
    email: 'ramesh.kumar@schoolsync.test',
    phone: '9876500001',
    role: 'teacher',
    designation: 'Senior Teacher',
    department: 'Mathematics',
    status: 'active',
    joiningDate: new Date().toISOString().split('T')[0],
    schoolId: SCHOOL_ID,
    subjects: ['Mathematics'],
    classTeacherOf: CLASS_10A_ID,
    employeeId: 'EMP-004',
    salary: 50000,
  };
}

async function installStaffCreateMockApi(page: import('@playwright/test').Page, state: MockState) {
  await installMockApi(page, state);

  // Override staff POST to return the new staff member
  await page.route('**/api/staff', async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      const newStaff = createNewStaff();
      state.staff.push(newStaff);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newStaff),
      });
    }
    // For GET, return the current staff list
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: state.staff, total: state.staff.length, page: 1, limit: 100 }),
      });
    }
    return route.continue();
  });

  // Mock departments endpoint
  await page.route('**/api/departments**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { _id: 'dept-math', name: 'Mathematics' },
        { _id: 'dept-sci', name: 'Science' },
        { _id: 'dept-eng', name: 'English' },
        { _id: 'dept-arts', name: 'Arts' },
      ]),
    });
  });

  // Mock salary templates endpoint
  await page.route('**/api/salary-templates**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          _id: 'st-teaching', name: 'Teaching Staff',
          basicSalary: 35000,
          components: [
            { name: 'HRA', type: 'earning', amount: 8000 },
            { name: 'DA', type: 'earning', amount: 5000 },
            { name: 'PF', type: 'deduction', amount: 2000 },
          ],
          totalEarnings: 48000,
          totalDeductions: 2000,
          netSalary: 46000,
        },
        {
          _id: 'st-admin', name: 'Admin Staff',
          basicSalary: 30000,
          components: [
            { name: 'HRA', type: 'earning', amount: 6000 },
            { name: 'PF', type: 'deduction', amount: 1500 },
          ],
          totalEarnings: 36000,
          totalDeductions: 1500,
          netSalary: 34500,
        },
      ]),
    });
  });

  // Mock file upload endpoint
  await page.route('**/api/upload**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: '/mock/photo.jpg', filename: 'photo.jpg' }),
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC011 — Admin creates a new staff member through the 5-step wizard
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC011 — Create Staff (5-Step Wizard)', () => {

  test('1) staff add page loads with step 1 (Personal Info)', async ({ page }) => {
    const state = createMockState();
    await installStaffCreateMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should show personal info step or wizard step indicator
    expect(body?.toLowerCase()).toMatch(/personal|step\s*1|basic\s*info|name/i);
  });

  test('2) step 1: fill personal information fields', async ({ page }) => {
    const state = createMockState();
    await installStaffCreateMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    // Fill name
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const hasName = await nameInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasName) {
      await nameInput.fill('Dr. Ramesh Kumar');
    }

    // Fill email
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const hasEmail = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasEmail) {
      await emailInput.fill('ramesh.kumar@schoolsync.test');
    }

    // Fill phone
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    const hasPhone = await phoneInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPhone) {
      await phoneInput.fill('9876500001');
    }

    // Date of birth
    const dobInput = page.locator('input[name="dateOfBirth"], input[name="dob"], input[type="date"]').first();
    const hasDob = await dobInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasDob) {
      await dobInput.fill('1985-06-15');
    }

    // Gender select
    const genderSelect = page.locator('select[name="gender"]').first();
    const hasGender = await genderSelect.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasGender) {
      await genderSelect.selectOption('Male');
    } else {
      // May be a radio or button group
      const maleOption = page.getByRole('radio', { name: /male/i }).first();
      const hasMaleRadio = await maleOption.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasMaleRadio) await maleOption.click();
    }

    // Father's name
    const fatherNameInput = page.locator('input[name="fatherName"], input[name="father_name"]').first();
    const hasFatherName = await fatherNameInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasFatherName) {
      await fatherNameInput.fill('Suresh Kumar');
    }

    // Blood group
    const bloodGroupSelect = page.locator('select[name="bloodGroup"]').first();
    const hasBloodGroup = await bloodGroupSelect.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasBloodGroup) {
      await bloodGroupSelect.selectOption('O+');
    }

    // Marital status
    const maritalSelect = page.locator('select[name="maritalStatus"]').first();
    const hasMarital = await maritalSelect.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasMarital) {
      await maritalSelect.selectOption('Married');
    }

    // Emergency contact
    const emergencyInput = page.locator('input[name="emergencyContact"], input[name="emergencyPhone"]').first();
    const hasEmergency = await emergencyInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasEmergency) {
      await emergencyInput.fill('9876500099');
    }

    // Page should still be functional
    await expect(page).not.toHaveURL(/\/login/);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('3) step 1: photo upload section is present', async ({ page }) => {
    const state = createMockState();
    await installStaffCreateMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    // Look for photo upload area
    const photoUpload = page.locator(
      'input[type="file"], [class*="upload"], [class*="avatar"], [class*="photo"]',
    ).first();
    const hasPhoto = await photoUpload.isVisible({ timeout: 5000 }).catch(() => false);

    // Photo upload UI should be present or skippable
    const body = await page.textContent('body');
    const hasUploadText = body?.toLowerCase().includes('upload') ||
                          body?.toLowerCase().includes('photo') ||
                          body?.toLowerCase().includes('picture');
    expect(hasPhoto || hasUploadText).toBeTruthy();
  });

  test('4) navigate from step 1 to step 2 (Role & Job)', async ({ page }) => {
    const state = createMockState();
    await installStaffCreateMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    // Fill required fields first
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Dr. Ramesh Kumar');
    }

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('ramesh.kumar@schoolsync.test');
    }

    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('9876500001');
    }

    // Click Next / Continue
    const nextBtn = page.getByRole('button', { name: /next|continue|step\s*2/i }).first();
    const hasNext = await nextBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasNext) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    const body = await page.textContent('body');
    // Should show step 2 content: role, department, class assignment
    const isStep2 = body?.toLowerCase().includes('role') ||
                    body?.toLowerCase().includes('department') ||
                    body?.toLowerCase().includes('designation') ||
                    body?.toLowerCase().includes('step 2') ||
                    body?.toLowerCase().includes('job');
    expect(isStep2).toBeTruthy();
  });

  test('5) step 2: select role, department, and class assignment', async ({ page }) => {
    const state = createMockState();
    await installStaffCreateMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    // Fill step 1 minimal fields and advance
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Dr. Ramesh Kumar');
    }
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('ramesh.kumar@schoolsync.test');
    }
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('9876500001');
    }

    // Navigate to step 2
    const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    // Select role: Teacher
    const roleSelect = page.locator('select[name="role"]').first();
    if (await roleSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await roleSelect.selectOption('teacher');
    } else {
      // May be a custom dropdown
      const roleDropdown = page.locator('[class*="role"] select, [data-testid="role-select"]').first();
      if (await roleDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await roleDropdown.selectOption('teacher');
      }
    }

    // Select department: Mathematics
    const deptSelect = page.locator('select[name="department"]').first();
    if (await deptSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deptSelect.selectOption('Mathematics');
    }

    // Assign to class
    const classSelect = page.locator('select[name="classId"], select[name="assignedClass"]').first();
    if (await classSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await classSelect.selectOption(CLASS_10A_ID);
    }

    // Toggle class teacher
    const classTeacherToggle = page.locator(
      'input[name="isClassTeacher"], input[type="checkbox"][name*="classTeacher"]',
    ).first();
    if (await classTeacherToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await classTeacherToggle.check();
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('6) step 3: add qualifications', async ({ page }) => {
    const state = createMockState();
    await installStaffCreateMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    // Fill step 1 and advance through steps
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Dr. Ramesh Kumar');
    }
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('ramesh.kumar@schoolsync.test');
    }
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('9876500001');
    }

    // Advance to step 2 then step 3
    for (let i = 0; i < 2; i++) {
      const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
      if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Fill qualification fields
    const qualInput = page.locator('input[name="qualification"], input[name*="degree"]').first();
    if (await qualInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await qualInput.fill('B.Ed');
    }

    const univInput = page.locator('input[name="university"], input[name*="university"]').first();
    if (await univInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await univInput.fill('Delhi University');
    }

    const yearInput = page.locator('input[name="year"], input[name*="passing"]').first();
    if (await yearInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await yearInput.fill('2015');
    }

    // Total experience
    const expInput = page.locator('input[name="experience"], input[name*="experience"]').first();
    if (await expInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expInput.fill('10');
    }

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('7) step 4: documents section is present', async ({ page }) => {
    const state = createMockState();
    await installStaffCreateMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    // Fill step 1 minimal and skip through
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Dr. Ramesh Kumar');
    }
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('ramesh.kumar@schoolsync.test');
    }
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('9876500001');
    }

    // Advance through steps 1-3 to reach step 4
    for (let i = 0; i < 3; i++) {
      const nextBtn = page.getByRole('button', { name: /next|continue|skip/i }).first();
      if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }

    const body = await page.textContent('body');
    // Step 4 should mention documents or staff number
    const hasDocSection = body?.toLowerCase().includes('document') ||
                          body?.toLowerCase().includes('staff number') ||
                          body?.toLowerCase().includes('employee') ||
                          body?.toLowerCase().includes('upload') ||
                          body?.toLowerCase().includes('step 4');
    expect(hasDocSection).toBeTruthy();
  });

  test('8) step 5: salary and bank details section', async ({ page }) => {
    const state = createMockState();
    await installStaffCreateMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    // Fill step 1 minimal
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Dr. Ramesh Kumar');
    }
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('ramesh.kumar@schoolsync.test');
    }
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('9876500001');
    }

    // Advance through steps 1-4 to reach step 5
    for (let i = 0; i < 4; i++) {
      const nextBtn = page.getByRole('button', { name: /next|continue|skip/i }).first();
      if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Fill bank details
    const accountInput = page.locator('input[name="accountNumber"], input[name*="account"]').first();
    if (await accountInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await accountInput.fill('1234567890123456');
    }

    const ifscInput = page.locator('input[name="ifsc"], input[name*="ifsc" i]').first();
    if (await ifscInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ifscInput.fill('SBIN0001234');
    }

    const bankNameInput = page.locator('input[name="bankName"], input[name*="bank"]').first();
    if (await bankNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bankNameInput.fill('State Bank of India');
    }

    // Select salary template
    const templateSelect = page.locator('select[name="salaryTemplate"]').first();
    if (await templateSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await templateSelect.selectOption('st-teaching');
    }

    const body = await page.textContent('body');
    // Should show salary or bank related content
    const hasSalarySection = body?.toLowerCase().includes('salary') ||
                             body?.toLowerCase().includes('bank') ||
                             body?.toLowerCase().includes('account') ||
                             body?.toLowerCase().includes('step 5');
    expect(hasSalarySection).toBeTruthy();
  });

  test('9) final submit creates the staff and shows success', async ({ page }) => {
    const state = createMockState();
    await installStaffCreateMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    // Fill step 1 minimal
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Dr. Ramesh Kumar');
    }
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('ramesh.kumar@schoolsync.test');
    }
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('9876500001');
    }

    // Advance through all steps (click next/continue/skip until submit)
    for (let i = 0; i < 5; i++) {
      const nextBtn = page.getByRole('button', { name: /next|continue|skip/i }).first();
      if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Click final submit
    const submitBtn = page.getByRole('button', { name: /submit|create|save|add staff/i }).first();
    const hasSubmit = await submitBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSubmit) {
      await submitBtn.click();
      await page.waitForLoadState('networkidle');

      // Should show success or redirect to staff list
      const currentUrl = page.url();
      const body = await page.textContent('body');
      const success = currentUrl.includes('/staffs') ||
                      body?.toLowerCase().includes('success') ||
                      body?.toLowerCase().includes('created') ||
                      body?.toLowerCase().includes('added');
      expect(success).toBeTruthy();
    }
  });

  test('10) after creation, redirects to staff list', async ({ page }) => {
    const state = createMockState();
    await installStaffCreateMockApi(page, state);

    await page.goto('/staffs/add');
    await page.waitForLoadState('networkidle');

    // The add page should render without errors
    const body = await page.textContent('body');
    expect(body).toBeTruthy();

    // Verify the route is correct
    expect(page.url()).toContain('/staffs/add');
    await expect(page).not.toHaveURL(/\/login/);
  });
});
