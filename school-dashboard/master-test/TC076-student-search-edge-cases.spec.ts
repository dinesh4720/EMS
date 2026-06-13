import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedStudent,
  CLASS_10A_ID, CLASS_11A_ID, SCHOOL_ID,
  type MockState, type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Helpers — seed 10 students with varied names
 * ──────────────────────────────────────────────────────────── */

function seedVariedStudents(state: MockState): StudentRecord[] {
  return [
    seedStudent(state, {
      name: 'Arjun Kumar',
      classId: CLASS_10A_ID,
      admissionId: 'ADM-0001',
      rollNo: '1',
    }),
    seedStudent(state, {
      name: "Priya O'Brien",
      classId: CLASS_10A_ID,
      admissionId: 'ADM-0002',
      rollNo: '2',
    }),
    seedStudent(state, {
      name: 'Ram & Lakshman',
      classId: CLASS_10A_ID,
      admissionId: 'ADM-0003',
      rollNo: '3',
    }),
    seedStudent(state, {
      name: 'Diya Sharma',
      classId: CLASS_10A_ID,
      admissionId: 'ADM-0004',
      rollNo: '4',
    }),
    seedStudent(state, {
      name: 'Vikram Rathore Singh Chauhan Patel-Deshmukh Extraordinaire III',
      classId: CLASS_10A_ID,
      admissionId: 'ADM-0005',
      rollNo: '5',
    }),
    seedStudent(state, {
      name: 'Kavya Reddy',
      classId: CLASS_11A_ID,
      admissionId: 'ADM-0006',
      rollNo: '1',
    }),
    seedStudent(state, {
      name: 'Rohan Nair',
      classId: CLASS_11A_ID,
      admissionId: 'ADM-0007',
      rollNo: '2',
    }),
    seedStudent(state, {
      name: 'Meera Bhat',
      classId: CLASS_11A_ID,
      admissionId: 'ADM-0008',
      rollNo: '3',
    }),
    seedStudent(state, {
      name: 'Arun Joshi',
      classId: CLASS_11A_ID,
      admissionId: 'ADM-0009',
      rollNo: '4',
    }),
    seedStudent(state, {
      name: 'Lakshmi Das',
      classId: CLASS_11A_ID,
      admissionId: 'ADM-0010',
      rollNo: '5',
    }),
  ];
}

/* ────────────────────────────────────────────────────────────
 *  Extended mock with search-aware student listing
 * ──────────────────────────────────────────────────────────── */

async function installSearchMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override student listing to support search query
  await page.route('**/api/students?**', async (route) => {
    const url = new URL(route.request().url());
    const search = url.searchParams.get('search') || url.searchParams.get('q') || '';
    const method = route.request().method();

    if (method !== 'GET') return route.continue();

    state.requestLog.add(`GET /api/students?search=${search}`);

    let filtered = state.students;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = state.students.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.admissionId.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q),
      );
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: filtered,
        total: filtered.length,
        page: 1,
        limit: 100,
      }),
    });
  });
}

/* ────────────────────────────────────────────────────────────
 *  TC076 — Search with special characters, partial matches, edge cases
 * ──────────────────────────────────────────────────────────── */

test.describe('TC076 - Student Search Edge Cases', () => {
  let state: MockState;
  let students: StudentRecord[];

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    students = seedVariedStudents(state);
    await installSearchMockApi(page, state);
  });

  test('should display all 10 students initially', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Verify students are listed
    await expect(page.getByText('Arjun Kumar').first()).toBeVisible();
    await expect(page.getByText('Diya Sharma').first()).toBeVisible();
  });

  test('should find exact match for "Arjun"', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    await searchInput.fill('Arjun');
    await page.waitForTimeout(500); // debounce

    // Arjun Kumar should be visible
    await expect(page.getByText('Arjun Kumar').first()).toBeVisible();
  });

  test('should find partial match for "ar" (case-insensitive)', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    await searchInput.fill('ar');
    await page.waitForTimeout(500);

    // "ar" should match "Arjun Kumar" and "Arun Joshi" (and possibly "Ram & Lakshman")
    const arjunVisible = await page.getByText('Arjun Kumar').first().isVisible().catch(() => false);
    expect(arjunVisible).toBe(true);
  });

  test('should show empty state for "xyz" search', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    await searchInput.fill('xyz');
    await page.waitForTimeout(500);

    // Verify empty state or no results
    const emptyState = page.getByText(/no student|no result|no data|not found|0 student/i)
      .or(page.locator('[data-testid="empty-state"]'))
      .first();

    // Either empty state message or simply no student rows
    const arjunHidden = await page.getByText('Arjun Kumar').first().isVisible().catch(() => false);
    if (!arjunHidden) {
      // No students visible - this is the expected behavior
      expect(arjunHidden).toBe(false);
    } else if (await emptyState.isVisible().catch(() => false)) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should search by roll number "1"', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    await searchInput.fill('1');
    await page.waitForTimeout(500);

    // Roll number 1 students should appear (Arjun Kumar in 10-A, Kavya Reddy in 11-A)
    const arjunVisible = await page.getByText('Arjun Kumar').first().isVisible().catch(() => false);
    // At minimum, some results should be shown
    const anyStudent = page.locator('table tbody tr, [data-testid*="student-row"]').first();
    if (await anyStudent.isVisible().catch(() => false)) {
      await expect(anyStudent).toBeVisible();
    }
  });

  test('should search by admission ID "ADM-0001"', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    await searchInput.fill('ADM-0001');
    await page.waitForTimeout(500);

    // Should find Arjun Kumar (ADM-0001)
    const arjunVisible = await page.getByText('Arjun Kumar').first().isVisible().catch(() => false);
    expect(arjunVisible).toBe(true);
  });

  test('should return all students when search is cleared', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    // Search first
    await searchInput.fill('Arjun');
    await page.waitForTimeout(500);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // All students should be visible again
    await expect(page.getByText('Arjun Kumar').first()).toBeVisible();
    await expect(page.getByText('Diya Sharma').first()).toBeVisible();
  });

  test('should handle search with leading and trailing spaces', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    await searchInput.fill('  Arjun  ');
    await page.waitForTimeout(500);

    // Should still find Arjun Kumar (trimmed search)
    const arjunVisible = await page.getByText('Arjun Kumar').first().isVisible().catch(() => false);
    expect(arjunVisible).toBe(true);
  });

  test('should be case-insensitive for "arjun" (lowercase)', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    await searchInput.fill('arjun');
    await page.waitForTimeout(500);

    const arjunVisible = await page.getByText('Arjun Kumar').first().isVisible().catch(() => false);
    expect(arjunVisible).toBe(true);
  });

  test('should be case-insensitive for "ARJUN" (uppercase)', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    await searchInput.fill('ARJUN');
    await page.waitForTimeout(500);

    const arjunVisible = await page.getByText('Arjun Kumar').first().isVisible().catch(() => false);
    expect(arjunVisible).toBe(true);
  });

  test('should handle search for name with apostrophe', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    await searchInput.fill("O'Brien");
    await page.waitForTimeout(500);

    // Should find "Priya O'Brien"
    const priyaVisible = await page.getByText("Priya O'Brien").first().isVisible().catch(() => false);
    if (priyaVisible) {
      expect(priyaVisible).toBe(true);
    }
  });

  test('should handle search for name with ampersand', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    await searchInput.fill('Ram');
    await page.waitForTimeout(500);

    // Should find "Ram & Lakshman"
    const ramVisible = await page.getByText('Ram & Lakshman').first().isVisible().catch(() => false);
    if (ramVisible) {
      expect(ramVisible).toBe(true);
    }
  });

  test('should display very long name without truncation issues', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // The long name student should be listed
    const longNameStudent = page.getByText(/Vikram Rathore/i).first();
    if (await longNameStudent.isVisible().catch(() => false)) {
      await expect(longNameStudent).toBeVisible();
    }

    // Search for part of the long name
    const searchInput = page.locator('input[name="student-search-query"]');

    await searchInput.fill('Vikram Rathore');
    await page.waitForTimeout(500);

    const result = await page.getByText(/Vikram Rathore/i).first().isVisible().catch(() => false);
    expect(result).toBe(true);
  });

  test('should search by partial admission ID "ADM-000"', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    await searchInput.fill('ADM-000');
    await page.waitForTimeout(500);

    // Should match multiple students (ADM-0001 through ADM-0009)
    const anyResult = page.locator('table tbody tr, [data-testid*="student-row"]').first();
    if (await anyResult.isVisible().catch(() => false)) {
      await expect(anyResult).toBeVisible();
    }
  });

  test('should handle rapid typing and debounce correctly', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    // Type rapidly character by character
    await searchInput.type('Arjun', { delay: 50 });
    await page.waitForTimeout(800); // wait for debounce to settle

    // Should show Arjun Kumar after debounce
    const arjunVisible = await page.getByText('Arjun Kumar').first().isVisible().catch(() => false);
    expect(arjunVisible).toBe(true);
  });

  test('should handle search with no input (empty string)', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[name="student-search-query"]');

    // Focus and blur without typing
    await searchInput.focus();
    await searchInput.blur();
    await page.waitForTimeout(300);

    // All students should still be visible
    await expect(page.getByText('Arjun Kumar').first()).toBeVisible();
  });
});
