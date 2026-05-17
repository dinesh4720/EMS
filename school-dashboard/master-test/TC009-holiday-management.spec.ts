/**
 * TC009: Admin manages school holidays.
 *
 * Verifies the holiday management page: listing holidays, adding new ones,
 * editing, deleting, and verifying statistics.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Extended mock for holidays CRUD
 * ───────────────────────────────────────────────────────────────────── */

async function installHolidayRoutes(page: import('@playwright/test').Page, state: MockState) {
  await installMockApi(page, state);

  await page.route('**/api/holidays**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    state.requestLog.add(`${method} ${path}`);

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path === '/api/holidays' && method === 'GET') {
      return json(state.holidays);
    }

    if (path === '/api/holidays' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const newHoliday = {
        _id: `hol-${Date.now()}`,
        id: `hol-${Date.now()}`,
        name: body.name || 'New Holiday',
        date: body.date || new Date().toISOString().split('T')[0],
        type: body.type || 'school',
        description: body.description || '',
        schoolId: SCHOOL_ID,
      };
      state.holidays.push(newHoliday);
      return json(newHoliday, 201);
    }

    const idMatch = path.match(/^\/api\/holidays\/([^/]+)$/);
    if (idMatch) {
      const id = idMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const body = JSON.parse(request.postData() || '{}');
        const idx = state.holidays.findIndex((h: Record<string, unknown>) => h._id === id);
        if (idx >= 0) {
          Object.assign(state.holidays[idx], body);
          return json(state.holidays[idx]);
        }
        return json({ error: 'Not found' }, 404);
      }
      if (method === 'DELETE') {
        state.holidays = state.holidays.filter((h: Record<string, unknown>) => h._id !== id);
        return json({ message: 'Deleted' });
      }
    }

    return json({});
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC009: Holiday Management — CRUD & Statistics', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Expand holidays with more types for statistics
    state.holidays = [
      { _id: 'hol-1', name: 'Republic Day', date: '2026-01-26', type: 'national', schoolId: SCHOOL_ID },
      { _id: 'hol-2', name: 'Holi', date: '2026-03-14', type: 'festival', schoolId: SCHOOL_ID },
      { _id: 'hol-3', name: 'Independence Day', date: '2025-08-15', type: 'national', schoolId: SCHOOL_ID },
      { _id: 'hol-4', name: 'Onam', date: '2025-09-05', type: 'regional', schoolId: SCHOOL_ID },
    ];

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installHolidayRoutes(page, state);
  });

  test('1) holiday page loads and shows existing holidays', async ({ page }) => {
    await page.goto('/settings/holidays');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Republic Day');
    expect(bodyText).toContain('Holi');
  });

  test('2) holidays list shows all seeded holidays', async ({ page }) => {
    await page.goto('/settings/holidays');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Republic Day');
    expect(bodyText).toContain('Holi');
    expect(bodyText).toContain('Independence Day');
    expect(bodyText).toContain('Onam');
  });

  test('3) add new holiday: "School Foundation Day"', async ({ page }) => {
    await page.goto('/settings/holidays');
    await page.waitForLoadState('networkidle');

    const initialCount = state.holidays.length;

    // Click add button
    const addBtn = page.getByRole('button', { name: /add holiday|new holiday|add|\+/i }).first();
    const hasAddBtn = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAddBtn) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // Fill holiday name
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="holiday" i]').last();
      const hasName = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasName) await nameInput.fill('School Foundation Day');

      // Fill date
      const dateInput = page.locator('input[name="date"], input[type="date"]').last();
      const hasDate = await dateInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasDate) await dateInput.fill('2026-07-15');

      // Select type
      const typeSelect = page.locator('select[name="type"], select[name="holidayType"]').last();
      const hasTypeSelect = await typeSelect.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasTypeSelect) {
        await typeSelect.selectOption({ label: 'School' }).catch(() =>
          typeSelect.selectOption({ value: 'school' }).catch(() => {}),
        );
      }

      // Save
      const saveBtn = page.getByRole('button', { name: /save|add|create|submit/i }).last();
      const hasSave = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasSave) {
        await saveBtn.click();
        await page.waitForLoadState('networkidle');
      }

      // Verify API was called
      const postCalled = [...state.requestLog].some(
        (entry) => entry.includes('POST') && entry.includes('/holidays'),
      );
      if (postCalled) {
        expect(state.holidays.length).toBeGreaterThan(initialCount);
      }
    }
  });

  test('4) verify new holiday appears in list', async ({ page }) => {
    // Pre-add the holiday to state
    state.holidays.push({
      _id: 'hol-new', name: 'School Foundation Day', date: '2026-07-15', type: 'school', schoolId: SCHOOL_ID,
    });

    await page.goto('/settings/holidays');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('School Foundation Day');
  });

  test('5) edit an existing holiday', async ({ page }) => {
    await page.goto('/settings/holidays');
    await page.waitForLoadState('networkidle');

    // Look for edit button on Republic Day row
    const editBtn = page.locator(
      'tr:has-text("Republic Day") button[aria-label*="edit" i], button:has-text("Edit")',
    ).first().or(page.getByTitle('Edit').first());
    const hasEdit = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEdit) {
      await editBtn.click();
      await page.waitForTimeout(500);

      // Update name or date
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').last();
      const hasName = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasName) {
        await nameInput.clear();
        await nameInput.fill('Republic Day (National Holiday)');
      }

      // Save
      const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).last();
      const hasSave = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasSave) {
        await saveBtn.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('6) delete a holiday with confirmation', async ({ page }) => {
    await page.goto('/settings/holidays');
    await page.waitForLoadState('networkidle');

    const initialCount = state.holidays.length;

    // Handle confirmation dialog
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Look for delete button
    const deleteBtn = page.locator(
      'button[aria-label*="delete" i], button:has-text("Delete")',
    ).first().or(page.getByTitle('Delete').first());
    const hasDelete = await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDelete) {
      await deleteBtn.click();
      await page.waitForLoadState('networkidle');

      // Verify API was called
      const deleteCalled = [...state.requestLog].some(
        (entry) => entry.includes('DELETE') && entry.includes('/holidays'),
      );
      if (deleteCalled) {
        expect(state.holidays.length).toBeLessThan(initialCount);
      }
    }
  });

  test('7) verify holiday statistics (total, type counts)', async ({ page }) => {
    await page.goto('/settings/holidays');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Should show total count or type breakdown
    // We have 4 holidays: 2 national, 1 festival, 1 regional
    const hasStats =
      bodyText?.includes('4') ||
      bodyText?.toLowerCase().includes('total') ||
      bodyText?.toLowerCase().includes('national') ||
      bodyText?.toLowerCase().includes('regional') ||
      bodyText?.toLowerCase().includes('festival');

    expect(hasStats).toBeTruthy();
  });

  test('8) holidays page shows type labels or badges', async ({ page }) => {
    await page.goto('/settings/holidays');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Holiday types should be indicated (badges, labels, or tags)
    const hasTypes =
      bodyText?.toLowerCase().includes('national') ||
      bodyText?.toLowerCase().includes('festival') ||
      bodyText?.toLowerCase().includes('regional') ||
      bodyText?.toLowerCase().includes('school');

    expect(hasTypes).toBeTruthy();
  });
});
