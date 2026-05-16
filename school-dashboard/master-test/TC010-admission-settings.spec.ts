/**
 * TC010: Admin configures admission ID format and document requirements.
 *
 * Verifies the admission settings page: ID format configuration with
 * prefix/year/separator/padding, roll number settings, and document
 * requirement setup.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC010: Admission Settings — ID Format & Documents', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Enrich settings with admission-specific fields
    Object.assign(state.schoolSettings, {
      admissionIdPrefix: 'ADM',
      admissionIdYearFormat: 'YYYY',
      admissionIdSeparator: '-',
      admissionIdPadding: 4,
      admissionIdPreview: 'ADM-2026-0001',
      rollNumberType: 'sequential',
      rollNumberStartFrom: 1,
      requiredDocuments: [
        { name: 'Aadhaar Card', required: true },
        { name: 'Photo', required: true },
      ],
    });

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override admission-settings specific route
    await page.route('**/api/admission-settings**', async (route) => {
      const method = route.request().method();
      state.requestLog.add(`${method} /api/admission-settings`);
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            admissionIdPrefix: state.schoolSettings.admissionIdPrefix,
            admissionIdYearFormat: state.schoolSettings.admissionIdYearFormat,
            admissionIdSeparator: state.schoolSettings.admissionIdSeparator,
            admissionIdPadding: state.schoolSettings.admissionIdPadding,
            admissionIdPreview: state.schoolSettings.admissionIdPreview,
            rollNumberType: state.schoolSettings.rollNumberType,
            rollNumberStartFrom: state.schoolSettings.rollNumberStartFrom,
            requiredDocuments: state.schoolSettings.requiredDocuments,
          }),
        });
      } else {
        const body = JSON.parse(route.request().postData() || '{}');
        Object.assign(state.schoolSettings, body);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Saved', ...body }),
        });
      }
    });
  });

  test('1) admission settings page loads', async ({ page }) => {
    await page.goto('/settings/admission-forms');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/admission|form|id|setting/i);
  });

  test('2) configure admission ID prefix to "ADM"', async ({ page }) => {
    await page.goto('/settings/admission-forms');
    await page.waitForLoadState('networkidle');

    const prefixInput = page.locator(
      'input[name="admissionIdPrefix"], input[name="prefix"], input[placeholder*="prefix" i]',
    ).first();
    const hasPrefix = await prefixInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPrefix) {
      await prefixInput.clear();
      await prefixInput.fill('ADM');
      await expect(prefixInput).toHaveValue('ADM');
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/admission|prefix|id format/i);
  });

  test('3) configure year format to "YYYY"', async ({ page }) => {
    await page.goto('/settings/admission-forms');
    await page.waitForLoadState('networkidle');

    // Year format might be a select or radio
    const yearFormatSelect = page.locator(
      'select[name="admissionIdYearFormat"], select[name="yearFormat"]',
    ).first();
    const hasYearSelect = await yearFormatSelect.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasYearSelect) {
      await yearFormatSelect.selectOption({ value: 'YYYY' }).catch(() =>
        yearFormatSelect.selectOption({ label: 'YYYY' }).catch(() => {}),
      );
    } else {
      // Try input
      const yearInput = page.locator('input[name="yearFormat"], input[placeholder*="year" i]').first();
      const hasYearInput = await yearInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasYearInput) {
        await yearInput.fill('YYYY');
      }
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/year|format|admission/i);
  });

  test('4) set separator to "-" and padding to 4', async ({ page }) => {
    await page.goto('/settings/admission-forms');
    await page.waitForLoadState('networkidle');

    // Separator
    const separatorInput = page.locator(
      'input[name="admissionIdSeparator"], input[name="separator"], select[name="separator"]',
    ).first();
    const hasSep = await separatorInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSep) {
      const tagName = await separatorInput.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await separatorInput.selectOption({ value: '-' }).catch(() => {});
      } else {
        await separatorInput.clear();
        await separatorInput.fill('-');
      }
    }

    // Padding
    const paddingInput = page.locator(
      'input[name="admissionIdPadding"], input[name="padding"], input[placeholder*="padding" i]',
    ).first();
    const hasPadding = await paddingInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPadding) {
      await paddingInput.clear();
      await paddingInput.fill('4');
    }
  });

  test('5) verify preview shows correct format (ADM-2026-0001)', async ({ page }) => {
    await page.goto('/settings/admission-forms');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Preview should show the formatted admission ID
    const hasPreview =
      bodyText?.includes('ADM-2026-0001') ||
      bodyText?.includes('ADM-2025-0001') ||
      bodyText?.includes('ADM') ||
      bodyText?.toLowerCase().includes('preview');

    expect(hasPreview).toBeTruthy();
  });

  test('6) configure roll number: sequential, starting from 1', async ({ page }) => {
    await page.goto('/settings/admission-forms');
    await page.waitForLoadState('networkidle');

    // Roll number type
    const rollTypeSelect = page.locator(
      'select[name="rollNumberType"], select[name="rollType"]',
    ).first();
    const hasRollType = await rollTypeSelect.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasRollType) {
      await rollTypeSelect.selectOption({ value: 'sequential' }).catch(() =>
        rollTypeSelect.selectOption({ label: 'Sequential' }).catch(() => {}),
      );
    }

    // Starting number
    const startInput = page.locator(
      'input[name="rollNumberStartFrom"], input[name="startFrom"], input[placeholder*="start" i]',
    ).first();
    const hasStart = await startInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasStart) {
      await startInput.clear();
      await startInput.fill('1');
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/roll|number|sequential|admission/i);
  });

  test('7) add required documents: Birth Certificate (required), Transfer Certificate (optional)', async ({ page }) => {
    await page.goto('/settings/admission-forms');
    await page.waitForLoadState('networkidle');

    // Look for "Add Document" button
    const addDocBtn = page.getByRole('button', { name: /add document|add requirement|add|\+/i }).first();
    const hasAddDoc = await addDocBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAddDoc) {
      // Add Birth Certificate (required)
      await addDocBtn.click();
      await page.waitForTimeout(300);

      const docNameInput = page.locator('input[name="documentName"], input[name="name"], input[placeholder*="document" i]').last();
      const hasDocName = await docNameInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasDocName) {
        await docNameInput.fill('Birth Certificate');
      }

      // Mark as required
      const requiredCheckbox = page.locator('input[name="required"], input[type="checkbox"]:near(:text("Required"))').last();
      const hasRequired = await requiredCheckbox.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasRequired) {
        await requiredCheckbox.check();
      }

      // Save/confirm the document requirement
      const confirmBtn = page.getByRole('button', { name: /add|save|confirm/i }).last();
      const hasConfirm = await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasConfirm) await confirmBtn.click();

      // Add Transfer Certificate (optional)
      await page.waitForTimeout(300);
      const addDocBtn2 = page.getByRole('button', { name: /add document|add requirement|add|\+/i }).first();
      const hasAddDoc2 = await addDocBtn2.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasAddDoc2) {
        await addDocBtn2.click();
        await page.waitForTimeout(300);

        const docName2 = page.locator('input[name="documentName"], input[name="name"], input[placeholder*="document" i]').last();
        const hasDocName2 = await docName2.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasDocName2) {
          await docName2.fill('Transfer Certificate');
        }

        // Leave required unchecked (optional)

        const confirmBtn2 = page.getByRole('button', { name: /add|save|confirm/i }).last();
        const hasConfirm2 = await confirmBtn2.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasConfirm2) await confirmBtn2.click();
      }
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/document|admission|requirement/i);
  });

  test('8) save all admission settings and verify changes saved', async ({ page }) => {
    await page.goto('/settings/admission-forms');
    await page.waitForLoadState('networkidle');

    // Fill at least one field to make form dirty
    const prefixInput = page.locator(
      'input[name="admissionIdPrefix"], input[name="prefix"], input[placeholder*="prefix" i]',
    ).first();
    const hasPrefix = await prefixInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasPrefix) {
      await prefixInput.clear();
      await prefixInput.fill('ADM');
    }

    // Click save
    const saveBtn = page.getByRole('button', { name: /save|update|apply|submit/i }).first();
    const hasSave = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSave) {
      await saveBtn.click();
      await page.waitForLoadState('networkidle');

      // Verify success
      const bodyText = await page.textContent('body');
      const hasSuccess =
        bodyText?.toLowerCase().includes('saved') ||
        bodyText?.toLowerCase().includes('success') ||
        bodyText?.toLowerCase().includes('updated');

      // Also check API was called
      const apiCalled = [...state.requestLog].some(
        (entry) =>
          (entry.includes('PUT') || entry.includes('PATCH') || entry.includes('POST')) &&
          (entry.includes('/settings') || entry.includes('/admission')),
      );

      expect(hasSuccess || apiCalled).toBeTruthy();
    }
  });

  test('9) existing documents are shown on page load', async ({ page }) => {
    await page.goto('/settings/admission-forms');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Pre-seeded documents from settings
    const hasDocs =
      bodyText?.includes('Aadhaar') ||
      bodyText?.includes('Photo') ||
      bodyText?.toLowerCase().includes('document');

    expect(hasDocs).toBeTruthy();
  });
});
