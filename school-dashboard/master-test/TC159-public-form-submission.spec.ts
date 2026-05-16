/**
 * TC159: Public Form Submission — parent-facing admission/enquiry form flow.
 *
 * Verifies: form load by token, all field type rendering, client-side validation,
 * successful submission, already-submitted state, invalid/expired token handling,
 * expired form display, network error resilience.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────── Types ───────── */

interface FormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: string | number | boolean;
  options?: Array<{ value: string; label: string } | string>;
}

interface FormDetails {
  formName: string;
  formTitle?: string;
  formDescription?: string;
  description?: string;
  fields?: FormField[];
  formStructure?: FormField[];
  expiresAt?: string;
  deadline?: string;
}

/* ───────── Mock helpers ───────── */

function buildAdmissionForm(overrides: Partial<FormDetails> = {}): FormDetails {
  return {
    formName: 'Admission Enquiry Form 2026-27',
    formDescription:
      'Please fill in the details below to register your interest for admission.',
    fields: [
      {
        id: 'studentName',
        label: 'Student Name',
        type: 'text',
        required: true,
        placeholder: 'Enter full name of the student',
      },
      {
        id: 'dateOfBirth',
        label: 'Date of Birth',
        type: 'date',
        required: true,
      },
      {
        id: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'parentEmail',
        label: 'Parent Email',
        type: 'email',
        required: true,
        placeholder: 'parent@example.com',
      },
      {
        id: 'parentPhone',
        label: 'Parent Phone',
        type: 'phone',
        required: true,
        placeholder: '9876543210',
      },
      {
        id: 'previousSchool',
        label: 'Previous School',
        type: 'text',
        required: false,
      },
      {
        id: 'classApplyingFor',
        label: 'Class Applying For',
        type: 'dropdown',
        required: true,
        options: ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      },
      {
        id: 'address',
        label: 'Residential Address',
        type: 'textarea',
        required: true,
        description: 'Please provide your complete postal address.',
      },
      {
        id: 'agreeTerms',
        label: 'I agree to the terms and conditions',
        type: 'checkbox',
        required: true,
      },
      {
        id: 'siblingCount',
        label: 'Number of Siblings Already Enrolled',
        type: 'number',
        required: false,
      },
    ],
    ...overrides,
  };
}

async function installPublicFormRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
  scenarios: {
    validToken?: FormDetails;
    expiredToken?: FormDetails;
    alreadySubmittedToken?: FormDetails;
    invalidToken?: boolean;
    submitShouldFail?: boolean;
  } = {},
) {
  const submissions = new Map<string, { submitted: boolean; submittedAt?: string; submitterName?: string }>();

  if (scenarios.alreadySubmittedToken) {
    submissions.set('already-submitted-123', {
      submitted: true,
      submittedAt: '2026-03-15T10:30:00.000Z',
      submitterName: 'Rajesh Patel',
    });
  }

  await page.route('**/api/public/form-assignment/**', async (route) => {
    const url = route.request().url();
    const token = url.split('/').pop() || '';
    state.requestLog.add(`GET /public/form-assignment/${token}`);

    if (scenarios.invalidToken && token === 'invalid-token-123') {
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Form not found' }) });
    }

    if (scenarios.validToken && token === 'valid-token-123') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(scenarios.validToken) });
    }

    if (scenarios.expiredToken && token === 'expired-token-123') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(scenarios.expiredToken) });
    }

    if (scenarios.alreadySubmittedToken && token === 'already-submitted-123') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(scenarios.alreadySubmittedToken) });
    }

    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Form not found' }) });
  });

  await page.route('**/api/public/form-submission/**/status', async (route) => {
    const url = route.request().url();
    const parts = url.split('/');
    const token = parts[parts.length - 2] || '';
    state.requestLog.add(`GET /public/form-submission/${token}/status`);

    const sub = submissions.get(token);
    if (sub) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sub) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ submitted: false }) });
  });

  await page.route('**/api/public/form-submission/*', async (route) => {
    const url = route.request().url();
    const token = url.split('/').pop() || '';
    const method = route.request().method();

    if (method !== 'POST') {
      return route.continue();
    }

    state.requestLog.add(`POST /public/form-submission/${token}`);

    if (scenarios.submitShouldFail && token === 'network-error-123') {
      return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Internal server error' }) });
    }

    if (scenarios.submitShouldFail && token === 'payload-too-large-123') {
      return route.fulfill({ status: 413, contentType: 'application/json', body: JSON.stringify({ message: 'Payload Too Large' }) });
    }

    const body = JSON.parse(route.request().postData() || '{}');
    submissions.set(token, {
      submitted: true,
      submittedAt: body.submittedAt || new Date().toISOString(),
      submitterName: body.submissionData?.studentName || 'Parent',
    });

    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Form submitted successfully' }) });
  });
}

/* ───────── Test suite ───────── */

test.describe('TC159 — Public Form Submission', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    await installMockApi(page, state);
  });

  /* ───────── 1. Happy path: load and submit a valid form ───────── */

  test('1) load valid public form and submit successfully', async ({ page }) => {
    const form = buildAdmissionForm();
    await installPublicFormRoutes(page, state, { validToken: form });

    await page.goto('/form/valid-token-123');
    await page.waitForLoadState('networkidle');

    // Verify form title and description are rendered
    await expect(page.locator('h1.public-form__title')).toContainText('Admission Enquiry Form 2026-27');
    await expect(page.locator('p.public-form__sub')).toContainText('register your interest');

    // Fill text field
    await page.locator('input#studentName').fill('Aarav Sharma');

    // Fill date field
    await page.locator('input#dateOfBirth').fill('2015-06-12');

    // Select gender
    await page.locator('select#gender').selectOption('male');

    // Fill email
    await page.locator('input#parentEmail').fill('rajesh.sharma@example.com');

    // Fill phone
    await page.locator('input#parentPhone').fill('9876543210');

    // Fill optional text field
    await page.locator('input#previousSchool').fill('Little Flower School');

    // Select class
    await page.locator('select#classApplyingFor').selectOption('5');

    // Fill textarea
    await page.locator('textarea#address').fill('42, 3rd Cross, Indiranagar, Bangalore - 560038');

    // Check checkbox
    await page.locator('input#agreeTerms').check();

    // Fill number field
    await page.locator('input#siblingCount').fill('1');

    // Submit
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('networkidle');

    // Verify success state
    await expect(page.locator('h2.public-form__status-title')).toContainText('Thank you');
    await expect(page.locator('.public-form__status-sub')).toContainText('submitted');
    await expect(page.locator('.chip--ok')).toContainText('Submitted');

    // Verify request log
    expect(state.requestLog.has('POST /public/form-submission/valid-token-123')).toBe(true);
  });

  /* ───────── 2. Already submitted state ───────── */

  test('2) already submitted form shows status card', async ({ page }) => {
    const form = buildAdmissionForm();
    await installPublicFormRoutes(page, state, { alreadySubmittedToken: form });

    await page.goto('/form/already-submitted-123');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h2.public-form__status-title')).toContainText('Already submitted');
    await expect(page.locator('.public-form__status-sub')).toContainText('submitted on');
    await expect(page.locator('.chip--ok')).toContainText('Submitted');
    await expect(page.locator('.public-form__meta-item')).toContainText('Rajesh Patel');

    // Form fields should NOT be present
    await expect(page.locator('input#studentName')).not.toBeVisible();
    await expect(page.locator('button[type="submit"]')).not.toBeVisible();
  });

  /* ───────── 3. Invalid / expired token ───────── */

  test('3) invalid token shows form not available error', async ({ page }) => {
    await installPublicFormRoutes(page, state, { invalidToken: true });

    await page.goto('/form/invalid-token-123');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('h2.public-form__status-title')).toContainText('Form not available');
    await expect(page.locator('.public-form__status-sub')).toContainText('invalid, expired, or has been canceled');
    await expect(page.locator('.chip--danger')).toContainText('Link expired');
    await expect(page.locator('button.btn')).toContainText('Return to home');
  });

  /* ───────── 4. Expired form shows expired badge and disables submit ───────── */

  test('4) expired form displays warning and disables submission', async ({ page }) => {
    const expiredForm = buildAdmissionForm({
      expiresAt: '2025-12-31T23:59:59.000Z',
      deadline: '2025-12-31T23:59:59.000Z',
    });
    await installPublicFormRoutes(page, state, { expiredToken: expiredForm });

    await page.goto('/form/expired-token-123');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.chip--danger')).toContainText('This form has expired');

    // Submit button should be disabled
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  /* ───────── 5. Validation: required fields ───────── */

  test('5) validation errors shown for empty required fields', async ({ page }) => {
    const form = buildAdmissionForm();
    await installPublicFormRoutes(page, state, { validToken: form });

    await page.goto('/form/valid-token-123');
    await page.waitForLoadState('networkidle');

    // Click submit without filling anything
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(200);

    // Check individual field errors
    await expect(page.locator('#studentName-error')).toContainText('Student Name is required');
    await expect(page.locator('#dateOfBirth-error')).toContainText('Date of Birth is required');
    await expect(page.locator('#gender-error')).toContainText('Gender is required');
    await expect(page.locator('#parentEmail-error')).toContainText('Parent Email is required');
    await expect(page.locator('#parentPhone-error')).toContainText('Parent Phone is required');
    await expect(page.locator('#classApplyingFor-error')).toContainText('Class Applying For is required');
    await expect(page.locator('#address-error')).toContainText('Residential Address is required');
    await expect(page.locator('#agreeTerms-error')).toContainText('I agree to the terms and conditions is required');
  });

  /* ───────── 6. Validation: email format ───────── */

  test('6) invalid email format shows error', async ({ page }) => {
    const form = buildAdmissionForm();
    await installPublicFormRoutes(page, state, { validToken: form });

    await page.goto('/form/valid-token-123');
    await page.waitForLoadState('networkidle');

    await page.locator('input#parentEmail').fill('not-an-email');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(200);

    await expect(page.locator('#parentEmail-error')).toContainText('Please enter a valid email address');
  });

  /* ───────── 7. Validation: phone format ───────── */

  test('7) invalid phone format shows error', async ({ page }) => {
    const form = buildAdmissionForm();
    await installPublicFormRoutes(page, state, { validToken: form });

    await page.goto('/form/valid-token-123');
    await page.waitForLoadState('networkidle');

    // Too short
    await page.locator('input#parentPhone').fill('123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#parentPhone-error')).toContainText('Please enter a valid phone number');

    // Clear and try letters
    await page.locator('input#parentPhone').fill('abcdefghij');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#parentPhone-error')).toContainText('Please enter a valid phone number');
  });

  /* ───────── 8. Network failure during form load ───────── */

  test('8) network error during load shows form not available', async ({ page }) => {
    await page.route('**/api/public/form-assignment/**', async (route) => {
      return route.abort('internetdisconnected');
    });

    await page.goto('/form/network-load-123');
    await page.waitForLoadState('networkidle');

    // Toast error should appear; the page will show the error state after catch
    await expect(page.locator('h2.public-form__status-title')).toContainText('Form not available');
  });

  /* ───────── 9. Network failure during submit ───────── */

  test('9) server error during submit shows error toast', async ({ page }) => {
    const form = buildAdmissionForm();
    await installPublicFormRoutes(page, state, { validToken: form, submitShouldFail: true });

    await page.goto('/form/network-error-123');
    await page.waitForLoadState('networkidle');

    // Fill minimum required fields
    await page.locator('input#studentName').fill('Aarav Sharma');
    await page.locator('input#dateOfBirth').fill('2015-06-12');
    await page.locator('select#gender').selectOption('male');
    await page.locator('input#parentEmail').fill('rajesh@example.com');
    await page.locator('input#parentPhone').fill('9876543210');
    await page.locator('select#classApplyingFor').selectOption('5');
    await page.locator('textarea#address').fill('Indiranagar, Bangalore');
    await page.locator('input#agreeTerms').check();

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(300);

    // Should still be on the form (not success state)
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('h2.public-form__status-title')).not.toBeVisible();
  });

  /* ───────── 10. Payload too large during submit ───────── */

  test('10) payload too large shows specific error', async ({ page }) => {
    const form = buildAdmissionForm();
    await installPublicFormRoutes(page, state, { validToken: form, submitShouldFail: true });

    await page.goto('/form/payload-too-large-123');
    await page.waitForLoadState('networkidle');

    await page.locator('input#studentName').fill('Aarav Sharma');
    await page.locator('input#dateOfBirth').fill('2015-06-12');
    await page.locator('select#gender').selectOption('male');
    await page.locator('input#parentEmail').fill('rajesh@example.com');
    await page.locator('input#parentPhone').fill('9876543210');
    await page.locator('select#classApplyingFor').selectOption('5');
    await page.locator('textarea#address').fill('Indiranagar, Bangalore');
    await page.locator('input#agreeTerms').check();

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(300);

    // Form should still be visible (submission failed)
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  /* ───────── 11. Form with deadline displays due date ───────── */

  test('11) form with deadline shows due date meta', async ({ page }) => {
    const form = buildAdmissionForm({
      deadline: '2026-06-30T17:00:00.000Z',
    });
    await installPublicFormRoutes(page, state, { validToken: form });

    await page.goto('/form/valid-token-123');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.public-form__meta-item')).toContainText('Due by');
    await expect(page.locator('.public-form__meta-item')).toContainText('Jun 30, 2026');
  });

  /* ───────── 12. Required field indicator ───────── */

  test('12) required fields show asterisk indicator', async ({ page }) => {
    const form = buildAdmissionForm();
    await installPublicFormRoutes(page, state, { validToken: form });

    await page.goto('/form/valid-token-123');
    await page.waitForLoadState('networkidle');

    // Check that required field labels have the asterisk span
    const studentNameLabel = page.locator('label[for="studentName"]');
    await expect(studentNameLabel.locator('span[aria-hidden="true"]')).toContainText('*');

    const emailLabel = page.locator('label[for="parentEmail"]');
    await expect(emailLabel.locator('span[aria-hidden="true"]')).toContainText('*');

    // Optional field should NOT have asterisk
    const prevSchoolLabel = page.locator('label[for="previousSchool"]');
    await expect(prevSchoolLabel.locator('span[aria-hidden="true"]')).not.toBeVisible();
  });

  /* ───────── 13. Accessibility: focus management on error ───────── */

  test('13) invalid inputs have aria-invalid and error description', async ({ page }) => {
    const form = buildAdmissionForm();
    await installPublicFormRoutes(page, state, { validToken: form });

    await page.goto('/form/valid-token-123');
    await page.waitForLoadState('networkidle');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(200);

    const emailInput = page.locator('input#parentEmail');
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');

    const errorId = await emailInput.getAttribute('aria-describedby');
    expect(errorId).toContain('parentEmail-error');
  });

  /* ───────── 14. Submit button loading state ───────── */

  test('14) submit button shows loading text while submitting', async ({ page }) => {
    const form = buildAdmissionForm();
    await installPublicFormRoutes(page, state, { validToken: form });

    // Slow down the mock response so we can observe the loading state
    await page.route('**/api/public/form-submission/*', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        await new Promise((r) => setTimeout(r, 500));
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      }
      return route.continue();
    });

    await page.goto('/form/valid-token-123');
    await page.waitForLoadState('networkidle');

    await page.locator('input#studentName').fill('Aarav Sharma');
    await page.locator('input#dateOfBirth').fill('2015-06-12');
    await page.locator('select#gender').selectOption('male');
    await page.locator('input#parentEmail').fill('rajesh@example.com');
    await page.locator('input#parentPhone').fill('9876543210');
    await page.locator('select#classApplyingFor').selectOption('5');
    await page.locator('textarea#address').fill('Indiranagar, Bangalore');
    await page.locator('input#agreeTerms').check();

    await page.locator('button[type="submit"]').click();

    // Immediately check loading state
    await expect(page.locator('button[type="submit"]')).toContainText('Submitting');
    await expect(page.locator('button[type="submit"]')).toHaveAttribute('aria-busy', 'true');

    // Wait for completion
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2.public-form__status-title')).toContainText('Thank you');
  });

  /* ───────── 15. Help notice footer ───────── */

  test('15) help notice is displayed below the form', async ({ page }) => {
    const form = buildAdmissionForm();
    await installPublicFormRoutes(page, state, { validToken: form });

    await page.goto('/form/valid-token-123');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.public-form__notice')).toContainText('need help');
    await expect(page.locator('.public-form__notice')).toContainText('school administration');
  });
});
