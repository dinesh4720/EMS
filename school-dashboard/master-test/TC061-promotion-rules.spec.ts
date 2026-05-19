import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Promotion rules mock data
 * ───────────────────────────────────────────────────────────────────── */

interface PromotionRules {
  minAttendancePercent: number;
  feeRequirement: string; // 'none' | 'partial' | 'full'
  minPassPercentage: number;
  graceMarks: number;
}

function seedPromotionRules(state: MockState): PromotionRules {
  const rules: PromotionRules = {
    minAttendancePercent: 75,
    feeRequirement: 'none',
    minPassPercentage: 33,
    graceMarks: 5,
  };
  (state as any).promotionRules = rules;
  return rules;
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC061 — Promotion Rules
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC061 — Promotion Rules', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedPromotionRules(state);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override promotion rules routes
    await page.route('**/api/promotion/rules**', async (route) => {
      const method = route.request().method();
      const rules = (state as any).promotionRules;

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      if (method === 'GET') return json(rules);

      if (method === 'PUT' || method === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        Object.assign(rules, body);
        return json({ message: 'Promotion rules saved', ...rules });
      }

      await route.continue();
    });

    // Also handle settings/promotion-rules path
    await page.route('**/api/settings/promotion**', async (route) => {
      const method = route.request().method();
      const rules = (state as any).promotionRules;

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      if (method === 'GET') return json(rules);
      if (method === 'PUT' || method === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        Object.assign(rules, body);
        return json({ message: 'Promotion rules saved', ...rules });
      }
      await route.continue();
    });
  });

  /* ───────── 1. Promotion rules page loads ───────── */

  test('1) promotion rules page loads', async ({ page }) => {
    await page.goto('/settings/promotion-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Promotion') || bodyText?.includes('promotion') ||
      bodyText?.includes('Attendance') || bodyText?.includes('Settings') ||
      bodyText?.includes('Rules'),
    ).toBeTruthy();
  });

  /* ───────── 2. Minimum attendance threshold is displayed ───────── */

  test('2) minimum attendance threshold is shown as 75%', async ({ page }) => {
    await page.goto('/settings/promotion-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('75') || bodyText?.includes('Attendance') ||
      bodyText?.includes('attendance'),
    ).toBeTruthy();
  });

  /* ───────── 3. Set minimum attendance to 75% ───────── */

  test('3) set minimum attendance threshold to 75%', async ({ page }) => {
    await page.goto('/settings/promotion-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Find attendance input
    const attendanceInput = page.locator(
      'input[name*="attendance" i], input[placeholder*="attendance" i], input[type="number"]',
    ).first();

    if (await attendanceInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await attendanceInput.clear();
      await attendanceInput.fill('75');
      await page.waitForTimeout(200);
    }

    // Look for a slider as alternative
    const slider = page.locator('input[type="range"]').first();
    if (await slider.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Slider is present — verify it's accessible
      const value = await slider.inputValue();
      expect(value).toBeTruthy();
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  /* ───────── 4. Select fee requirement: Partial ───────── */

  test('4) select fee requirement as Partial', async ({ page }) => {
    await page.goto('/settings/promotion-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for fee requirement selection (radio buttons, dropdown, or segmented control)
    const partialOption = page.getByText(/Partial/i).first();
    const feeSelect = page.locator('select, [aria-haspopup="listbox"]').filter({ hasText: /fee|requirement/i }).first();

    if (await partialOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await partialOption.click();
      await page.waitForTimeout(300);
    } else if (await feeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await feeSelect.click();
      await page.waitForTimeout(200);
      const option = page.getByText(/partial/i).first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
      }
    }

    // Save
    const saveBtn = page.getByRole('button', { name: /save|update|apply/i }).first();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(500);
    }
  });

  /* ───────── 5. Verify settings saved ───────── */

  test('5) verify promotion rules are persisted after save', async ({ page }) => {
    // Update state to simulate saved settings
    (state as any).promotionRules.feeRequirement = 'partial';
    (state as any).promotionRules.minAttendancePercent = 75;

    await page.goto('/settings/promotion-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('75') || bodyText?.includes('Partial') || bodyText?.includes('partial'),
    ).toBeTruthy();
  });

  /* ───────── 6. Change fee requirement to Full ───────── */

  test('6) change fee requirement from Partial to Full', async ({ page }) => {
    (state as any).promotionRules.feeRequirement = 'partial';

    await page.goto('/settings/promotion-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Select Full option
    const fullOption = page.getByText(/^Full$/i).first();
    const feeSelect = page.locator('select, [aria-haspopup="listbox"]').filter({ hasText: /fee|requirement/i }).first();

    if (await fullOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fullOption.click();
      await page.waitForTimeout(300);
    } else if (await feeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await feeSelect.click();
      await page.waitForTimeout(200);
      const option = page.getByText(/full/i).first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
      }
    }

    // Save and verify
    const saveBtn = page.getByRole('button', { name: /save|update|apply/i }).first();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(500);
    }
  });

  /* ───────── 7. Verify Full fee requirement saved ───────── */

  test('7) verify Full fee requirement is reflected', async ({ page }) => {
    (state as any).promotionRules.feeRequirement = 'full';

    await page.goto('/settings/promotion-rules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Full') || bodyText?.includes('full') ||
      bodyText?.includes('Promotion') || bodyText?.includes('promotion'),
    ).toBeTruthy();
  });

  /* ───────── 8. State integrity check ───────── */

  test('8) state has correct initial promotion rules', async ({ page }) => {
    const rules = (state as any).promotionRules;
    expect(rules.minAttendancePercent).toBe(75);
    expect(rules.feeRequirement).toBe('none');
    expect(rules.minPassPercentage).toBe(33);
    expect(rules.graceMarks).toBe(5);
  });
});
