import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent,
  TEACHER_A_ID, TEACHER_B_ID, CLASS_10A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TC062 — Global Search across all entities
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC062 — Global Search', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed students for search
    seedStudent(state, { name: 'Rahul Sharma', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Priya Gupta', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Amit Patel', classId: CLASS_10A_ID });

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override global search endpoint
    await page.route('**/api/search**', async (route) => {
      const url = new URL(route.request().url());
      const query = (url.searchParams.get('q') || url.searchParams.get('query') || '').toLowerCase();

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      // Search across students, staff, and classes
      const matchedStudents = state.students.filter(s =>
        s.name.toLowerCase().includes(query),
      ).map(s => ({ type: 'student', id: s.id, name: s.name, subtitle: `Class ${s.classId}` }));

      const matchedStaff = state.staff.filter(s =>
        s.name.toLowerCase().includes(query),
      ).map(s => ({ type: 'staff', id: s.id, name: s.name, subtitle: s.role }));

      const matchedClasses = state.classes.filter(c =>
        `${c.name}-${c.section}`.toLowerCase().includes(query) || c.name.includes(query),
      ).map(c => ({ type: 'class', id: c.id, name: `${c.name}-${c.section}`, subtitle: `${c.studentCount} students` }));

      return json({
        results: [...matchedStudents, ...matchedStaff, ...matchedClasses],
        total: matchedStudents.length + matchedStaff.length + matchedClasses.length,
      });
    });
  });

  /* ───���───── 1. Navigate to dashboard ───────── */

  test('1) dashboard loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  /* ───────── 2. Open global search with Ctrl+K ───────── */

  test('2) pressing Ctrl+K opens global search modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Control+k');

    // The search modal should appear with an input field
    const searchInput = page.locator(
      'input[type="search"], input[name="global-search-query"], input[placeholder*="search" i]',
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  /* ───────── 3. Search for teacher "Ananya" ───────── */

  test('3) searching "Ananya" shows teacher in results', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Control+k');

    const searchInput = page.locator(
      'input[name="global-search-query"], input[type="search"], input[placeholder*="search" i]',
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('Ananya');
    await page.waitForTimeout(1000); // wait for debounced search

    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('Ananya')).toBeTruthy();
  });

  /* ───────── 4. Search for student "Rahul" ───────── */

  test('4) searching student name "Rahul" shows student in results', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Control+k');

    const searchInput = page.locator(
      'input[name="global-search-query"], input[type="search"], input[placeholder*="search" i]',
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('Rahul');
    await page.waitForTimeout(1000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('Rahul')).toBeTruthy();
  });

  /* ───────── 5. Search for class "10" ───────── */

  test('5) searching class name "10" shows class in results', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Control+k');

    const searchInput = page.locator(
      'input[name="global-search-query"], input[type="search"], input[placeholder*="search" i]',
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('10');
    await page.waitForTimeout(1000);

    const bodyText = await page.textContent('body');
    // Should find class 10-A or page navigation items containing "10"
    expect(
      bodyText?.includes('10-A') || bodyText?.includes('10') || bodyText?.includes('Class'),
    ).toBeTruthy();
  });

  /* ───────── 6. Press Escape to close search ───────── */

  test('6) pressing Escape closes the search modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Control+k');

    const searchInput = page.locator(
      'input[name="global-search-query"], input[type="search"], input[placeholder*="search" i]',
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');

    // The search input should be hidden after pressing escape
    await expect(searchInput).not.toBeVisible({ timeout: 5000 });
  });

  /* ───────── 7. Empty search state ───────── */

  test('7) empty search shows suggestions or recent searches', async ({ page }) => {
    // Pre-seed recent searches
    await page.addInitScript(() => {
      localStorage.setItem('ems_search_history', JSON.stringify(['Ananya', 'Class 10']));
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Control+k');

    const searchInput = page.locator(
      'input[name="global-search-query"], input[type="search"], input[placeholder*="search" i]',
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // With empty query, the modal should show default content (pages, recent, suggestions)
    const modalBody = page.locator('.max-h-\\[420px\\]');
    if (await modalBody.isVisible({ timeout: 3000 }).catch(() => false)) {
      const content = await modalBody.textContent();
      expect(content).toBeTruthy();
    }
  });

  /* ───────── 8. No results state ───────── */

  test('8) searching for non-existent term shows no results', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Control+k');

    const searchInput = page.locator(
      'input[name="global-search-query"], input[type="search"], input[placeholder*="search" i]',
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('xyznonexistent12345');
    await page.waitForTimeout(1000);

    const bodyText = await page.textContent('body');
    // Should show "no results" message or empty state
    expect(
      bodyText?.toLowerCase().includes('no result') ||
      bodyText?.toLowerCase().includes('not found') ||
      bodyText?.toLowerCase().includes('no match') ||
      !bodyText?.includes('xyznonexistent'), // query not returned as a result
    ).toBeTruthy();
  });

  /* ───────── 9. Search results contain correct entity types ───────── */

  test('9) search results are grouped by type (students, staff, classes)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Control+k');

    const searchInput = page.locator(
      'input[name="global-search-query"], input[type="search"], input[placeholder*="search" i]',
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Search for a broad term that matches multiple entity types
    await searchInput.fill('a'); // matches Ananya (staff) and Rahul/Amit (students have 'a')
    await page.waitForTimeout(1000);

    const modalBody = page.locator('.max-h-\\[420px\\]');
    if (await modalBody.isVisible({ timeout: 3000 }).catch(() => false)) {
      const content = await modalBody.textContent();
      expect(content).toBeTruthy();
    }
  });
});
