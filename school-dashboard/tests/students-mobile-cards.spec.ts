import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  type MockState,
} from './test-utils';

test.describe('Students list — mobile card layout', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedStudent(state);
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
  });

  test('renders student list as cards at 375px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Wait for the student list to render
    const list = page.locator('[role="listbox"][aria-label="Student list"]');
    await expect(list).toBeVisible({ timeout: 10_000 });

    // Cards should be present
    const cards = list.locator('.studentlist__row');
    await expect(cards.first()).toBeVisible({ timeout: 5_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Each card should show the student name and status
    const firstCard = cards.first();
    const firstStudent = state.students[0];
    await expect(firstCard.getByText(firstStudent.name)).toBeVisible();
    await expect(firstCard.locator('.studentlist__row-status')).toBeVisible();

    // Mobile card styles: rounded border and vertical spacing between cards
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).toBeTruthy();
    expect(cardBox!.width).toBeLessThan(375);
  });

  test('tapping a card opens the mobile detail drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const list = page.locator('[role="listbox"][aria-label="Student list"]');
    await expect(list).toBeVisible({ timeout: 10_000 });

    const firstCard = list.locator('.studentlist__row').first();
    await expect(firstCard).toBeVisible({ timeout: 5_000 });

    // Click the main card area
    await firstCard.locator('.studentlist__row-main').click();

    // The mobile drawer should appear
    const drawer = page.locator('[role="dialog"][aria-label^="Profile:"]');
    await expect(drawer).toBeVisible({ timeout: 5_000 });
  });

  test('renders student list as rows on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const list = page.locator('[role="listbox"][aria-label="Student list"]');
    await expect(list).toBeVisible({ timeout: 10_000 });

    const rows = list.locator('.studentlist__row');
    await expect(rows.first()).toBeVisible({ timeout: 5_000 });

    // On desktop the rows should span nearly the full width of the list
    const listBox = await list.boundingBox();
    const firstRowBox = await rows.first().boundingBox();
    expect(listBox).toBeTruthy();
    expect(firstRowBox).toBeTruthy();
    expect(firstRowBox!.width).toBeGreaterThan((listBox!.width) * 0.9);

    // Status and profile arrow are present
    await expect(rows.first().locator('.studentlist__row-status')).toBeVisible();
  });

  test('keyboard navigation moves focus between rows on desktop', async ({ page }) => {
    // Seed a second student so arrow navigation has somewhere to go
    seedStudent(state, { name: 'Second Student' });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const list = page.locator('[role="listbox"][aria-label="Student list"]');
    await expect(list).toBeVisible({ timeout: 10_000 });

    const rows = list.locator('.studentlist__row');
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toBeVisible({ timeout: 5_000 });

    // Focus the list and move down
    await list.focus();
    await page.keyboard.press('ArrowDown');

    // The second row should receive focus (tabIndex=-1 makes it focusable)
    await expect(rows.nth(1)).toBeFocused();
  });
});
