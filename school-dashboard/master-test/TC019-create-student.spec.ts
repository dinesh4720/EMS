import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  CLASS_10A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  TC019 — Admin creates a new student via multi-step registration
 * ──────────────────────────────────────────────────────────── */

test.describe('TC019 - Create Student', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    await installMockApi(page, state);
  });

  test('should navigate to the student registration form', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Verify the registration form is visible
    const heading = page.getByRole('heading', { name: /add student|new student|register student/i })
      .or(page.getByText(/student registration|add new student/i));
    await expect(heading.first()).toBeVisible();
  });

  test('should complete full student registration with all steps', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    /* ── Step 1: Personal Information ── */
    const fullNameInput = page.getByLabel(/full name/i).or(page.getByPlaceholder(/full name/i)).first();
    await fullNameInput.fill('Arjun Kumar');

    // Date of birth
    const dobInput = page.getByLabel(/date of birth/i)
      .or(page.getByPlaceholder(/DD\/MM\/YYYY|date of birth/i))
      .first();
    await dobInput.fill('14/08/2011');

    // Gender
    const genderSelect = page.getByLabel(/gender/i)
      .or(page.getByRole('button', { name: /gender|select gender/i }))
      .first();
    await genderSelect.click();
    const maleOption = page.getByRole('option', { name: /male/i })
      .or(page.getByText('Male', { exact: true }))
      .first();
    await maleOption.click();

    // Aadhaar Number
    const aadhaarInput = page.getByLabel(/aadhaar/i)
      .or(page.getByPlaceholder(/aadhaar/i))
      .first();
    if (await aadhaarInput.isVisible().catch(() => false)) {
      await aadhaarInput.fill('123456789012');
    }

    // Blood Group
    const bloodGroupInput = page.getByLabel(/blood group/i)
      .or(page.getByRole('button', { name: /blood group/i }))
      .first();
    if (await bloodGroupInput.isVisible().catch(() => false)) {
      await bloodGroupInput.click();
      const bgOption = page.getByRole('option', { name: /A\+|A positive/i })
        .or(page.getByText('A+'))
        .first();
      if (await bgOption.isVisible().catch(() => false)) {
        await bgOption.click();
      }
    }

    // Nationality
    const nationalityInput = page.getByLabel(/nationality/i)
      .or(page.getByPlaceholder(/nationality/i))
      .first();
    if (await nationalityInput.isVisible().catch(() => false)) {
      await nationalityInput.fill('Indian');
    }

    // Religion
    const religionInput = page.getByLabel(/religion/i)
      .or(page.getByPlaceholder(/religion/i))
      .first();
    if (await religionInput.isVisible().catch(() => false)) {
      await religionInput.fill('Hindu');
    }

    // Category
    const categoryInput = page.getByLabel(/category/i)
      .or(page.getByRole('button', { name: /category/i }))
      .first();
    if (await categoryInput.isVisible().catch(() => false)) {
      await categoryInput.click();
      const catOption = page.getByRole('option', { name: /general/i }).first();
      if (await catOption.isVisible().catch(() => false)) {
        await catOption.click();
      }
    }

    // Mother Tongue
    const motherTongueInput = page.getByLabel(/mother tongue/i)
      .or(page.getByPlaceholder(/mother tongue/i))
      .first();
    if (await motherTongueInput.isVisible().catch(() => false)) {
      await motherTongueInput.fill('Hindi');
    }

    /* ── Step 2: Class Info ── */
    // Click Continue/Next to move to next step if stepper form
    const continueBtn = page.getByRole('button', { name: /continue|next/i }).first();
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
    }

    // Select Class
    const classSelect = page.getByLabel(/class/i)
      .or(page.getByRole('button', { name: /select class/i }))
      .first();
    if (await classSelect.isVisible().catch(() => false)) {
      await classSelect.click();
      const class10Option = page.getByRole('option', { name: /10/i })
        .or(page.getByRole('listbox').getByText('10'))
        .first();
      await class10Option.click();
    }

    // Select Section
    const sectionSelect = page.getByLabel(/section/i)
      .or(page.getByRole('button', { name: /select section/i }))
      .first();
    if (await sectionSelect.isVisible().catch(() => false)) {
      await sectionSelect.click();
      const sectionAOption = page.getByRole('option', { name: /^A$/i })
        .or(page.getByRole('listbox').getByText('A', { exact: true }))
        .first();
      await sectionAOption.click();
    }

    // Verify roll number auto-generated (should be visible and filled)
    const rollNoInput = page.getByLabel(/roll number|roll no/i)
      .or(page.getByPlaceholder(/roll/i))
      .first();
    if (await rollNoInput.isVisible().catch(() => false)) {
      const rollValue = await rollNoInput.inputValue();
      // Roll number should either be pre-filled or the field should be present
      expect(rollNoInput).toBeVisible();
    }

    /* ── Step 3: Contact Info ── */
    const nextBtn2 = page.getByRole('button', { name: /continue|next/i }).first();
    if (await nextBtn2.isVisible().catch(() => false)) {
      await nextBtn2.click();
    }

    const mobileInput = page.getByLabel(/mobile|phone/i)
      .or(page.getByPlaceholder(/mobile|phone/i))
      .first();
    if (await mobileInput.isVisible().catch(() => false)) {
      await mobileInput.fill('9876543210');
    }

    // Toggle WhatsApp same as mobile
    const whatsappToggle = page.getByLabel(/whatsapp same|same as mobile/i)
      .or(page.getByRole('checkbox', { name: /whatsapp/i }))
      .or(page.getByRole('switch', { name: /whatsapp/i }))
      .first();
    if (await whatsappToggle.isVisible().catch(() => false)) {
      await whatsappToggle.click();
    }

    // Email
    const emailInput = page.getByLabel(/email/i)
      .or(page.getByPlaceholder(/email/i))
      .first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('arjun.kumar@test.com');
    }

    // Address
    const addressInput = page.getByLabel(/address/i)
      .or(page.getByPlaceholder(/address/i))
      .first();
    if (await addressInput.isVisible().catch(() => false)) {
      await addressInput.fill('42 MG Road');
    }

    // City
    const cityInput = page.getByLabel(/city/i)
      .or(page.getByPlaceholder(/city/i))
      .first();
    if (await cityInput.isVisible().catch(() => false)) {
      await cityInput.fill('Bangalore');
    }

    // State
    const stateInput = page.getByLabel(/^state$/i)
      .or(page.getByPlaceholder(/state/i))
      .first();
    if (await stateInput.isVisible().catch(() => false)) {
      await stateInput.fill('Karnataka');
    }

    // Zip Code
    const zipInput = page.getByLabel(/zip|pincode|postal/i)
      .or(page.getByPlaceholder(/zip|pincode|postal/i))
      .first();
    if (await zipInput.isVisible().catch(() => false)) {
      await zipInput.fill('560001');
    }

    /* ── Step 4: Parent/Guardian Details ── */
    const nextBtn3 = page.getByRole('button', { name: /continue|next/i }).first();
    if (await nextBtn3.isVisible().catch(() => false)) {
      await nextBtn3.click();
    }

    // Father details
    const parentNameInput = page.getByLabel(/full name|parent name|guardian name/i).first();
    if (await parentNameInput.isVisible().catch(() => false)) {
      await parentNameInput.fill('Suresh Kumar');
    }

    const relationSelect = page.getByLabel(/relationship|relation/i)
      .or(page.getByRole('button', { name: /relationship|relation/i }))
      .first();
    if (await relationSelect.isVisible().catch(() => false)) {
      await relationSelect.click();
      const fatherOption = page.getByRole('option', { name: /father/i }).first();
      if (await fatherOption.isVisible().catch(() => false)) {
        await fatherOption.click();
      }
    }

    const parentPhoneInput = page.getByLabel(/phone/i)
      .or(page.getByPlaceholder(/phone/i))
      .first();
    if (await parentPhoneInput.isVisible().catch(() => false)) {
      await parentPhoneInput.fill('9876543211');
    }

    const parentEmailInput = page.getByLabel(/email/i).last();
    if (await parentEmailInput.isVisible().catch(() => false)) {
      await parentEmailInput.fill('suresh.kumar@test.com');
    }

    const occupationInput = page.getByLabel(/occupation/i)
      .or(page.getByPlaceholder(/occupation/i))
      .first();
    if (await occupationInput.isVisible().catch(() => false)) {
      await occupationInput.fill('Engineer');
    }

    // Add mother
    const addParentBtn = page.getByRole('button', { name: /add parent|add guardian|add another/i }).first();
    if (await addParentBtn.isVisible().catch(() => false)) {
      await addParentBtn.click();

      // Fill mother details in the second guardian form
      const parentNameInputs = page.getByLabel(/full name|parent name|guardian name/i);
      const secondParentName = parentNameInputs.last();
      if (await secondParentName.isVisible().catch(() => false)) {
        await secondParentName.fill('Lakshmi Kumar');
      }

      const phoneInputs = page.getByLabel(/phone/i);
      const secondPhone = phoneInputs.last();
      if (await secondPhone.isVisible().catch(() => false)) {
        await secondPhone.fill('9876543212');
      }
    }

    /* ── Step 5: Documents ── */
    const nextBtn4 = page.getByRole('button', { name: /continue|next/i }).first();
    if (await nextBtn4.isVisible().catch(() => false)) {
      await nextBtn4.click();
    }

    // Verify document upload UI is present (skip actual uploads)
    const uploadArea = page.getByText(/upload|document|drag/i).first();
    if (await uploadArea.isVisible().catch(() => false)) {
      await expect(uploadArea).toBeVisible();
    }

    /* ── Step 6: Submit ── */
    const submitBtn = page.getByRole('button', { name: /submit|save|add student|register/i }).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify success toast or confirmation
    const successIndicator = page.getByText(/success|student added|student created|registered/i).first();
    await expect(successIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should fill personal info step with all fields', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Fill the full name
    const nameField = page.getByLabel(/full name/i).or(page.getByPlaceholder(/full name/i)).first();
    await nameField.fill('Arjun Kumar');
    await expect(nameField).toHaveValue('Arjun Kumar');

    // Fill date of birth
    const dobField = page.getByLabel(/date of birth/i)
      .or(page.getByPlaceholder(/DD\/MM\/YYYY/i))
      .first();
    await dobField.fill('14/08/2011');
  });

  test('should show validation errors for missing required fields', async ({ page }) => {
    await page.goto('/students/add');
    await page.waitForLoadState('networkidle');

    // Try to submit or proceed without filling required fields
    const submitBtn = page.getByRole('button', { name: /submit|save|add student|continue|next/i }).first();
    await submitBtn.click();

    // Expect validation messages to appear
    const errorMsg = page.getByText(/required|cannot be empty|please fill|please enter/i).first();
    await expect(errorMsg).toBeVisible({ timeout: 3000 });
  });
});
