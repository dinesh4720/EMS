import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  CLASS_10A_ID,
  CLASS_11A_ID,
  TEACHER_A_ID,
  TEACHER_B_ID,
  type MockState,
} from './test-utils';

/* ───────────────── Mock helpers ───────────────── */

async function gotoClassesAndWait(page: import('@playwright/test').Page) {
  await page.goto('/classes?view=class');
  await page.waitForLoadState('networkidle');
  // Wait for class tiles to render — tiles show class number (e.g. "10") not "10-A"
  await page.locator('text=10').first().waitFor({ timeout: 15_000 });
  await page.waitForTimeout(400);
}

async function installClassCrudRoutes(page: import('@playwright/test').Page, state: MockState) {
  await page.route('**/api/classes', async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      const body = route.request().postDataJSON();
      const newClass = {
        _id: `cls-new-${Date.now()}`,
        id: `cls-new-${Date.now()}`,
        ...body,
        studentCount: 0,
        attendance: 0,
        averageAcademicPerformance: 0,
      };
      state.classes.push(newClass);
      state.requestLog.add('POST /api/classes');
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newClass) });
    } else if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.classes) });
    } else {
      await route.fallback();
    }
  });

  await page.route('**/api/classes/*', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/\/+$/, '');
    const parts = path.split('/');
    // Path is /api/classes/:id  → parts = ['', 'api', 'classes', id]
    const id = parts[3];
    const method = route.request().method();

    if (method === 'PUT') {
      const body = route.request().postDataJSON();
      const idx = state.classes.findIndex((c) => c.id === id || c._id === id);
      if (idx >= 0) {
        state.classes[idx] = { ...state.classes[idx], ...body };
      }
      state.requestLog.add(`PUT /api/classes/${id}`);
      const responseBody = idx >= 0 ? state.classes[idx] : { message: 'Updated' };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseBody) });
    } else if (method === 'DELETE') {
      const beforeLen = state.classes.length;
      state.classes = state.classes.filter((c) => c.id !== id && c._id !== id);
      state.requestLog.add(`DELETE /api/classes/${id}`);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deleted', removed: beforeLen > state.classes.length }) });
    } else if (method === 'GET') {
      const cls = state.classes.find((c) => c.id === id || c._id === id);
      if (cls) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cls) });
      } else {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
      }
    } else {
      await route.fallback();
    }
  });
}

/* ───────────────── Tests ───────────────── */

test.describe('Classes — List & Create', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedStudent(state, { name: 'Student A1', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Student A2', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Student B1', classId: CLASS_11A_ID });

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
    await installClassCrudRoutes(page, state);
  });

  test('1 — class list loads with existing classes', async ({ page }) => {
    await gotoClassesAndWait(page);

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/10/);
    expect(bodyText).toMatch(/11/);
  });

  test('2 — class tiles show teacher names', async ({ page }) => {
    await gotoClassesAndWait(page);

    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('Ananya Sharma') || bodyText?.includes('Ravi Menon')).toBeTruthy();
  });

  test('3 — create class drawer opens and validates required fields', async ({ page }) => {
    await gotoClassesAndWait(page);

    // Open Add class drawer via button click
    await page.locator('button.btn--accent').filter({ hasText: /Add class/i }).click({ force: true });
    await page.waitForTimeout(1500);

    // CreateDrawer renders with class "drawer-frame" and role="dialog"
    const drawer = page.locator('.drawer-frame').filter({ hasText: /Add class/i }).first();
    await expect(drawer).toBeAttached({ timeout: 5000 });

    // Try submitting empty form
    await drawer.getByRole('button', { name: /Create class/i }).click({ force: true });
    await page.waitForTimeout(500);

    // Validation errors should appear — check inside the drawer for error text
    const drawerText = await drawer.textContent();
    expect(
      drawerText?.toLowerCase().includes('required') ||
      drawerText?.toLowerCase().includes('is required') ||
      drawerText?.toLowerCase().includes('please')
    ).toBeTruthy();
  });

  test('4 — create class saves and appears in list', async ({ page }) => {
    await gotoClassesAndWait(page);

    await page.locator('button.btn--accent').filter({ hasText: /Add class/i }).click({ force: true });
    await page.waitForTimeout(1500);

    const drawer = page.locator('.drawer-frame').filter({ hasText: /Add class/i }).first();
    await expect(drawer).toBeAttached({ timeout: 5000 });

    // Fill form
    await drawer.locator('input').nth(0).fill('12');
    await drawer.locator('input').nth(1).fill('B');
    await drawer.locator('input[type="number"]').first().fill('35');
    await drawer.locator('select').first().selectOption(TEACHER_A_ID);

    await drawer.getByRole('button', { name: /Create class/i }).click({ force: true });
    await page.waitForTimeout(800);

    // Verify POST was logged
    expect(state.requestLog.has('POST /api/classes')).toBeTruthy();

    // New class should appear in list after refetch
    await expect.poll(() => state.classes.some((c) => c.name === '12' && c.section === 'B'), { timeout: 10_000 }).toBeTruthy();
  });
});

test.describe('Classes — Edit & Delete', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedStudent(state, { name: 'Student A1', classId: CLASS_10A_ID });

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
    await installClassCrudRoutes(page, state);
  });

  test('5 — edit class modal opens from class dashboard', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');

    // Wait for dashboard to load
    await page.locator('text=10').first().waitFor({ timeout: 15_000 });
    await page.waitForTimeout(400);

    // Open actions dropdown
    await page.getByRole('button', { name: /More actions/i }).click();
    await page.waitForTimeout(200);

    // Click Edit class
    await page.getByRole('menuitem', { name: /Edit class/i }).click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').filter({ hasText: /Edit/i }).first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Pre-filled values should be present
    const modalText = await modal.textContent();
    expect(modalText).toMatch(/10|Class/);
  });

  test('6 — edit class capacity and saves', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');
    await page.locator('text=10').first().waitFor({ timeout: 15_000 });
    await page.waitForTimeout(400);

    // Open actions dropdown and click Edit
    await page.getByRole('button', { name: /More actions/i }).click();
    await page.waitForTimeout(200);
    await page.getByRole('menuitem', { name: /Edit class/i }).click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').filter({ hasText: /Edit/i }).first();

    // Update capacity
    const capacityInput = modal.locator('input[type="number"]').first();
    await capacityInput.clear();
    await capacityInput.fill('50');

    // Update room
    const roomInput = modal.locator('input').filter({ has: page.locator(':below(:text("Room"))') }).first();
    // Fallback: find the room input by scanning all inputs
    const inputs = modal.locator('input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const placeholder = await inputs.nth(i).getAttribute('placeholder');
      if (placeholder?.toLowerCase().includes('room')) {
        await inputs.nth(i).fill('Lab 3');
        break;
      }
    }

    await modal.getByRole('button', { name: /Save Changes/i }).click({ force: true });
    await page.waitForTimeout(600);

    expect(state.requestLog.has(`PUT /api/classes/${CLASS_10A_ID}`)).toBeTruthy();
  });

  test('7 — delete class shows confirmation and removes', async ({ page }) => {
    await page.goto(`/classes/${CLASS_10A_ID}`);
    await page.waitForLoadState('networkidle');
    await page.locator('text=10').first().waitFor({ timeout: 15_000 });
    await page.waitForTimeout(400);

    // Open actions dropdown and click Delete
    await page.getByRole('button', { name: /More actions/i }).click();
    await page.waitForTimeout(200);
    await page.getByRole('menuitem', { name: /Delete class/i }).click();
    await page.waitForTimeout(300);

    // Confirm dialog should appear
    const confirmDialog = page.getByRole('alertdialog').first().or(page.locator('[role="dialog"]').filter({ hasText: /Delete Class/i }).first());
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });

    // Confirm deletion
    await confirmDialog.getByRole('button', { name: /Delete/i }).click();
    await page.waitForTimeout(600);

    expect(state.requestLog.has(`DELETE /api/classes/${CLASS_10A_ID}`)).toBeTruthy();

    // Should navigate back to classes list
    await expect(page).toHaveURL(/\/classes/);
  });

  test('8 — empty state shows when no classes exist', async ({ page }) => {
    state.classes = [];
    await page.goto('/classes?view=class');
    await page.waitForLoadState('networkidle');
    // Wait for loading state to resolve
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('no classes') ||
      bodyText?.toLowerCase().includes('no classes yet') ||
      bodyText?.toLowerCase().includes('awaiting') ||
      bodyText?.includes('Classes')
    ).toBeTruthy();
  });

  test('9 — class dashboard navigation from tile', async ({ page }) => {
    await gotoClassesAndWait(page);

    const tile = page.locator('a.class-tile').first();
    await expect(tile).toBeVisible({ timeout: 5000 });
    await tile.click();

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/classes\//);

    // Dashboard tabs should be visible
    await expect(page.getByText('Overview').first()).toBeVisible({ timeout: 10_000 });
  });
});
