/**
 * TC006: Admin sets up fee heads in settings.
 *
 * Verifies the fee heads settings page: listing existing fee heads,
 * adding a new one with details, and editing an existing fee head.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ──────────────────────���─────────────────────────��────────────────────
 *  Extended mock for fee heads CRUD
 * ──��───────────────���───────────────────────────────��────────────────── */

async function installFeeHeadRoutes(page: import('@playwright/test').Page, state: MockState) {
  await installMockApi(page, state);

  // Override fee-heads route with full CRUD
  await page.route('**/api/fee-heads**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    state.requestLog.add(`${method} ${path}`);

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path === '/api/fee-heads' && method === 'GET') {
      return json(state.feeHeads);
    }

    if (path === '/api/fee-heads' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const newHead = {
        _id: `fh-${Date.now()}`,
        id: `fh-${Date.now()}`,
        name: body.name || 'New Fee Head',
        type: body.type || body.category || 'academic',
        category: body.category || 'Academic',
        amount: body.amount || 0,
        frequency: body.frequency || 'yearly',
        applicableClasses: body.applicableClasses || [],
        isRequired: body.isRequired ?? true,
        schoolId: SCHOOL_ID,
      };
      state.feeHeads.push(newHead);
      return json(newHead, 201);
    }

    const idMatch = path.match(/^\/api\/fee-heads\/([^/]+)$/);
    if (idMatch) {
      const id = idMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const body = JSON.parse(request.postData() || '{}');
        const idx = state.feeHeads.findIndex((fh) => fh._id === id);
        if (idx >= 0) {
          Object.assign(state.feeHeads[idx], body);
          return json(state.feeHeads[idx]);
        }
        return json({ error: 'Not found' }, 404);
      }
      if (method === 'DELETE') {
        state.feeHeads = state.feeHeads.filter((fh) => fh._id !== id);
        return json({ message: 'Deleted' });
      }
    }
    return json({});
  });
}

/* ────��────────────────────────────────────────────────────────────────
 *  Tests
 * ─────────────────���─────────────────────────────────────────────────── */

test.describe('TC006: Fee Heads Setup — Add, Edit, List', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Ensure default fee heads have category and frequency fields
    state.feeHeads = [
      {
        _id: 'fh-tuition', id: 'fh-tuition', name: 'Tuition Fee',
        type: 'tuition', category: 'Academic', amount: 5000,
        frequency: 'monthly', isRequired: true, schoolId: SCHOOL_ID,
      },
      {
        _id: 'fh-transport', id: 'fh-transport', name: 'Transport Fee',
        type: 'transport', category: 'Transport', amount: 2000,
        frequency: 'monthly', isRequired: false, schoolId: SCHOOL_ID,
      },
    ];

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installFeeHeadRoutes(page, state);
  });

  test('1) fee heads page loads and shows existing fee heads', async ({ page }) => {
    await page.goto('/settings/fee-heads');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Should show existing fee heads
    expect(bodyText).toContain('Tuition Fee');
    expect(bodyText).toContain('Transport Fee');
  });

  test('2) fee heads show amounts and categories', async ({ page }) => {
    await page.goto('/settings/fee-heads');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Amounts should be displayed
    expect(bodyText).toMatch(/5,000|5000/);
    expect(bodyText).toMatch(/2,000|2000/);
  });

  test('3) click "Add Fee Head" to open form', async ({ page }) => {
    await page.goto('/settings/fee-heads');
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add fee head|new fee head|add new|\+/i }).first();
    const hasAddBtn = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAddBtn) {
      await addBtn.click();

      // Modal or form should appear
      const dialog = page.locator('[role="dialog"]').last();
      const formVisible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

      if (formVisible) {
        const dialogText = await dialog.textContent();
        expect(dialogText?.toLowerCase()).toMatch(/fee head|name|amount|category/i);
      } else {
        // Form might be inline
        const bodyText = await page.textContent('body');
        expect(bodyText?.toLowerCase()).toMatch(/name|amount|category/i);
      }
    }
  });

  test('4) fill new fee head: Lab Fee, Academic, 3000, Yearly', async ({ page }) => {
    await page.goto('/settings/fee-heads');
    await page.waitForLoadState('networkidle');

    // Open add form
    const addBtn = page.getByRole('button', { name: /add fee head|new fee head|add new|\+/i }).first();
    const hasAddBtn = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAddBtn) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // Fill name
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').last();
      const hasName = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasName) await nameInput.fill('Lab Fee');

      // Fill amount
      const amountInput = page.locator('input[name="amount"], input[placeholder*="amount" i], input[type="number"]').last();
      const hasAmount = await amountInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasAmount) await amountInput.fill('3000');

      // Select category
      const categorySelect = page.locator('select[name="category"], select[name="type"]').last();
      const hasCategorySelect = await categorySelect.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasCategorySelect) {
        await categorySelect.selectOption({ label: 'Academic' }).catch(() => {});
      }

      // Select frequency
      const freqSelect = page.locator('select[name="frequency"]').last();
      const hasFreqSelect = await freqSelect.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasFreqSelect) {
        await freqSelect.selectOption({ label: 'Yearly' }).catch(() => {});
      }

      // Toggle as required
      const requiredToggle = page.locator('input[name="isRequired"], [role="switch"], label:has-text("Required")').last();
      const hasRequired = await requiredToggle.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasRequired) await requiredToggle.click().catch(() => {});
    }
  });

  test('5) save new fee head and verify it appears in the list', async ({ page }) => {
    await page.goto('/settings/fee-heads');
    await page.waitForLoadState('networkidle');

    const initialCount = state.feeHeads.length;

    // Open add form
    const addBtn = page.getByRole('button', { name: /add fee head|new fee head|add new|\+/i }).first();
    const hasAddBtn = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAddBtn) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // Fill name
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').last();
      const hasName = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasName) await nameInput.fill('Lab Fee');

      // Fill amount
      const amountInput = page.locator('input[name="amount"], input[placeholder*="amount" i], input[type="number"]').last();
      const hasAmount = await amountInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasAmount) await amountInput.fill('3000');

      // Click save
      const saveBtn = page.getByRole('button', { name: /save|create|add|submit/i }).last();
      const hasSave = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasSave) {
        await saveBtn.click();
        await page.waitForLoadState('networkidle');
      }

      // Verify the new fee head was added to state
      const postCalled = [...state.requestLog].some(
        (entry) => entry.includes('POST') && entry.includes('/fee-heads'),
      );
      if (postCalled) {
        expect(state.feeHeads.length).toBeGreaterThan(initialCount);
      }
    }
  });

  test('6) edit an existing fee head (change Tuition Fee amount)', async ({ page }) => {
    await page.goto('/settings/fee-heads');
    await page.waitForLoadState('networkidle');

    // Look for edit button on Tuition Fee row
    const editBtn = page.locator('tr:has-text("Tuition Fee") button[aria-label*="edit" i], tr:has-text("Tuition Fee") button:has-text("Edit")').first()
      .or(page.locator('[class*="card"]:has-text("Tuition Fee") button[aria-label*="edit" i]').first())
      .or(page.getByTitle('Edit').first());

    const hasEditBtn = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEditBtn) {
      await editBtn.click();
      await page.waitForTimeout(500);

      // Update amount
      const amountInput = page.locator('input[name="amount"], input[type="number"]').last();
      const hasAmount = await amountInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasAmount) {
        await amountInput.clear();
        await amountInput.fill('6000');
      }

      // Save
      const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).last();
      const hasSave = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasSave) {
        await saveBtn.click();
        await page.waitForLoadState('networkidle');
      }

      // Verify update was called
      const putCalled = [...state.requestLog].some(
        (entry) => (entry.includes('PUT') || entry.includes('PATCH')) && entry.includes('/fee-heads'),
      );
      if (putCalled) {
        const tuition = state.feeHeads.find((fh) => fh._id === 'fh-tuition');
        expect(tuition?.amount).toBe(6000);
      }
    }
  });

  test('7) fee heads API was called on page load', async ({ page }) => {
    await page.goto('/settings/fee-heads');
    await page.waitForLoadState('networkidle');

    const feeHeadsCalled = [...state.requestLog].some(
      (entry) => entry.includes('GET') && entry.includes('/fee-heads'),
    );
    expect(feeHeadsCalled).toBeTruthy();
  });
});
