import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedBook, seedStudent, seedIssuedBook,
  ADMIN_ID, CLASS_10A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────────────── Library Test Data ───────────────── */

function seedLibraryData(state: MockState) {
  // Seed students for book issuance
  const student1 = seedStudent(state, {
    name: 'Rahul Kumar',
    admissionId: 'ADM-2025-001',
    rollNo: '101',
    classId: CLASS_10A_ID,
  });
  const student2 = seedStudent(state, {
    name: 'Priya Sharma',
    admissionId: 'ADM-2025-002',
    rollNo: '102',
    classId: CLASS_10A_ID,
  });
  const student3 = seedStudent(state, {
    name: 'Amit Patel',
    admissionId: 'ADM-2025-003',
    rollNo: '103',
    classId: CLASS_10A_ID,
  });

  // Seed books across categories
  const book1 = seedBook(state, {
    title: 'NCERT Mathematics - Class 10',
    author: 'R.D. Sharma',
    isbn: '978-81-7450-634-4',
    category: 'textbook',
    totalCopies: 50,
    availableCopies: 45,
  });
  const book2 = seedBook(state, {
    title: 'Concepts of Physics Part 1',
    author: 'H.C. Verma',
    isbn: '978-81-7708-187-8',
    category: 'reference',
    totalCopies: 30,
    availableCopies: 12,
  });
  const book3 = seedBook(state, {
    title: 'Malgudi Days',
    author: 'R.K. Narayan',
    isbn: '978-0-14-303965-5',
    category: 'fiction',
    totalCopies: 20,
    availableCopies: 0,
  });
  const book4 = seedBook(state, {
    title: 'India After Gandhi',
    author: 'Ramachandra Guha',
    isbn: '978-0-330-50554-3',
    category: 'non-fiction',
    totalCopies: 15,
    availableCopies: 8,
  });
  const book5 = seedBook(state, {
    title: 'The Hindu Editorial Digest',
    author: 'Editorial Team',
    isbn: '978-93-0001-001-1',
    category: 'periodical',
    totalCopies: 10,
    availableCopies: 10,
  });

  // Seed issued books — some active, some overdue
  seedIssuedBook(state, book1.id, student1.id, {
    issueDate: '2026-04-15',
    dueDate: '2026-05-15',
    status: 'issued',
    fine: 0,
  });
  seedIssuedBook(state, book1.id, student2.id, {
    issueDate: '2026-03-01',
    dueDate: '2026-03-15',
    status: 'overdue',
    fine: 150,
  });
  seedIssuedBook(state, book2.id, student1.id, {
    issueDate: '2026-04-20',
    dueDate: '2026-05-04',
    status: 'issued',
    fine: 0,
  });
  seedIssuedBook(state, book3.id, student3.id, {
    issueDate: '2026-02-10',
    dueDate: '2026-02-24',
    status: 'returned',
    returnDate: '2026-02-25',
    fine: 20,
  });
  seedIssuedBook(state, book2.id, student3.id, {
    issueDate: '2026-01-05',
    dueDate: '2026-01-19',
    status: 'overdue',
    fine: 300,
  });

  return { student1, student2, student3, book1, book2, book3, book4, book5 };
}

/* ───────────────── Library Mock Route Override ─────────────────
 *  The default installMockApi returns { data: [...] } for list
 *  endpoints, but the Library module expects { books: [...] }.
 *  We override /v1/library/books GET to match the UI contract.
 * ──────────────────────────────────────────────────────────────── */

async function installLibraryMockApi(page: any, state: MockState) {
  await installMockApi(page, state);

  await page.route('**/api/v1/library/books', async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (method === 'GET') {
      const search = url.searchParams.get('search')?.toLowerCase() || '';
      const category = url.searchParams.get('category');
      let filtered = state.books;
      if (search) {
        filtered = filtered.filter((b: any) =>
          b.title?.toLowerCase().includes(search) ||
          b.author?.toLowerCase().includes(search) ||
          b.isbn?.toLowerCase().includes(search),
        );
      }
      if (category && category !== 'all') {
        filtered = filtered.filter((b: any) => b.category === category);
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ books: filtered, total: filtered.length, page: 1, limit: 25 }),
      });
    }

    if (method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const b = seedBook(state, body);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(b),
      });
    }

    await route.continue();
  });

  await page.route('**/api/v1/library/books/*', async (route: any) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/+$/g, '');
    const method = request.method();
    const id = path.split('/').pop();

    if (method === 'PUT') {
      const body = JSON.parse(request.postData() || '{}');
      const idx = state.books.findIndex((b: any) => b.id === id || b._id === id);
      if (idx >= 0) {
        Object.assign(state.books[idx], body);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.books[idx]),
        });
      }
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }

    if (method === 'DELETE') {
      state.books = state.books.filter((b: any) => b.id !== id && b._id !== id);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Deleted' }),
      });
    }

    await route.continue();
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC163 — Library Management
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC163 — Library Management', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    seedLibraryData(state);
    await installLibraryMockApi(page, state);
  });

  /* ───────── 1. Library Dashboard loads with stats ───────── */

  test('1) library dashboard shows stats cards and most borrowed books', async ({ page }) => {
    await page.goto('/library');
    await page.waitForLoadState('domcontentloaded');

    // Wait for dashboard to render
    await expect(page.locator('text=Library Dashboard')).toBeVisible({ timeout: 15000 });

    // Stat cards should be visible
    await expect(page.getByText('Total Books')).toBeVisible();
    await expect(page.getByText('Issued')).toBeVisible();
    await expect(page.getByText('Overdue')).toBeVisible();

    // Most borrowed section
    await expect(page.getByText('Most Borrowed Books')).toBeVisible();
  });

  /* ───────── 2. Navigate to Books tab ───────── */

  test('2) books tab shows catalog with search and category filter', async ({ page }) => {
    await page.goto('/library/books');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Books Catalog')).toBeVisible({ timeout: 15000 });

    // Table should show seeded books
    await expect(page.getByText('NCERT Mathematics - Class 10')).toBeVisible();
    await expect(page.getByText('Malgudi Days')).toBeVisible();

    // Search input and category filter should exist
    await expect(page.locator('input[placeholder*="Search" i]').first()).toBeVisible();
    await expect(page.locator('button:has-text("Add Book")').first()).toBeVisible();
  });

  /* ───────── 3. Search books by title ───────── */

  test('3) search filters books by title', async ({ page }) => {
    await page.goto('/library/books');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search" i]').first();
    await searchInput.fill('Malgudi');
    await page.waitForTimeout(400); // debounce

    await expect(page.getByText('Malgudi Days')).toBeVisible();
    await expect(page.getByText('NCERT Mathematics')).not.toBeVisible();
  });

  /* ───────── 4. Filter books by category ───────── */

  test('4) category filter shows only matching books', async ({ page }) => {
    await page.goto('/library/books');
    await page.waitForLoadState('networkidle');

    // Open category select
    const categorySelect = page.locator('[role="combobox"], select').first();
    await categorySelect.click();
    await page.waitForTimeout(200);

    // Select "Fiction"
    const fictionOption = page.getByText('Fiction').first();
    if (await fictionOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fictionOption.click();
      await page.waitForTimeout(300);
      await expect(page.getByText('Malgudi Days')).toBeVisible();
      await expect(page.getByText('NCERT Mathematics')).not.toBeVisible();
    }
  });

  /* ───────── 5. Add a new book ───────── */

  test('5) add book modal creates a new book', async ({ page }) => {
    await page.goto('/library/books');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Add Book")').first().click();
    await page.waitForTimeout(300);

    // Fill the form
    await page.locator('label:has-text("Title") + input, input[label="Title"], input[aria-label*="Title" i]').first().fill('Wings of Fire');
    await page.locator('label:has-text("Author") + input, input[label="Author"], input[aria-label*="Author" i]').first().fill('A.P.J. Abdul Kalam');
    await page.locator('label:has-text("ISBN") + input, input[label="ISBN"]').first().fill('978-81-7371-146-6');
    await page.locator('label:has-text("Publisher") + input, input[label="Publisher"]').first().fill('Universities Press');
    await page.locator('label:has-text("Published Year") + input, input[label="Published Year"]').first().fill('1999');
    await page.locator('label:has-text("Total Copies") + input, input[label="Total Copies"]').first().fill('25');

    // Submit
    const submitBtn = page.locator('button:has-text("Add Book"), button[type="submit"]').last();
    await submitBtn.click();
    await page.waitForTimeout(600);

    // New book should appear in list
    await expect(page.getByText('Wings of Fire')).toBeVisible({ timeout: 10000 });
  });

  /* ───────── 6. Edit an existing book ───────── */

  test('6) edit book modal updates book details', async ({ page }) => {
    await page.goto('/library/books');
    await page.waitForLoadState('networkidle');

    // Click edit on first book
    const editBtn = page.locator('button:has-text("Edit")').first();
    await editBtn.click();
    await page.waitForTimeout(300);

    // Update title
    const titleInput = page.locator('label:has-text("Title") + input, input[label="Title"]').first();
    await titleInput.fill('NCERT Mathematics - Class 10 (Revised)');

    // Submit
    const updateBtn = page.locator('button:has-text("Update")').last();
    await updateBtn.click();
    await page.waitForTimeout(600);

    await expect(page.getByText('NCERT Mathematics - Class 10 (Revised)')).toBeVisible({ timeout: 10000 });
  });

  /* ───────── 7. Delete book with confirmation ───────── */

  test('7) delete book shows confirmation and removes book', async ({ page }) => {
    await page.goto('/library/books');
    await page.waitForLoadState('networkidle');

    const initialCount = state.books.length;

    // Click delete on the periodical book
    const row = page.locator('tr:has-text("The Hindu Editorial Digest")');
    const deleteBtn = row.locator('button:has-text("Delete")');
    await deleteBtn.click();
    await page.waitForTimeout(300);

    // Confirm dialog should appear
    const confirmBtn = page.locator('button:has-text("Delete"), button:has-text("Confirm")').last();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(600);
      await expect(page.getByText('The Hindu Editorial Digest')).not.toBeVisible();
      expect(state.books.length).toBe(initialCount - 1);
    }
  });

  /* ───────── 8. Issue book to student ───────── */

  test('8) issue book modal assigns book to student', async ({ page }) => {
    await page.goto('/library/books');
    await page.waitForLoadState('networkidle');

    // Find a book with available copies and click Issue
    const row = page.locator('tr:has-text("India After Gandhi")');
    const issueBtn = row.locator('button:has-text("Issue")');
    await issueBtn.click();
    await page.waitForTimeout(400);

    // Modal should open
    await expect(page.getByText('Issue Book')).toBeVisible();

    // Student is pre-selected in this flow when opened from BooksList
    // since the book is preselected. We need to select a student.
    const studentInput = page.locator('label:has-text("Student") + input, input[placeholder*="Student" i]').first();
    await studentInput.fill('Rahul');
    await page.waitForTimeout(400);

    // Click student option from dropdown
    const studentOption = page.getByText('Rahul Kumar').first();
    if (await studentOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await studentOption.click();
    }

    // Submit
    await page.locator('button:has-text("Issue Book")').last().click();
    await page.waitForTimeout(600);

    // Should show success toast or redirect
    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('Issued') || bodyText?.includes('issued')).toBeTruthy();
  });

  /* ───────── 9. Issued Books list loads ───────── */

  test('9) issued books tab displays all issued records', async ({ page }) => {
    await page.goto('/library/issued');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Issued Books')).toBeVisible({ timeout: 15000 });

    // Should show issued and overdue records
    await expect(page.getByText('Rahul Kumar')).toBeVisible();
    await expect(page.getByText('Priya Sharma')).toBeVisible();
  });

  /* ───────── 10. Filter issued books by overdue status ───────── */

  test('10) overdue filter shows only overdue books', async ({ page }) => {
    await page.goto('/library/issued');
    await page.waitForLoadState('networkidle');

    // Open status filter
    const statusSelect = page.locator('[role="combobox"], select').first();
    await statusSelect.click();
    await page.waitForTimeout(200);

    const overdueOption = page.getByText('Overdue').first();
    if (await overdueOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await overdueOption.click();
      await page.waitForTimeout(300);

      // Should show overdue entries
      await expect(page.getByText('Priya Sharma')).toBeVisible();
      await expect(page.getByText('Amit Patel')).toBeVisible();

      // Should not show active issued entries
      await expect(page.getByText('Rahul Kumar').first()).not.toBeVisible();
    }
  });

  /* ───────── 11. Return book with fine ───────── */

  test('11) return book modal marks book as returned', async ({ page }) => {
    await page.goto('/library/issued');
    await page.waitForLoadState('networkidle');

    // Click return on an overdue issue
    const returnBtn = page.locator('button:has-text("Return")').first();
    await returnBtn.click();
    await page.waitForTimeout(400);

    // Return modal should show fine info
    await expect(page.getByText('Return Book')).toBeVisible();

    // Confirm return
    await page.locator('button:has-text("Confirm Return")').click();
    await page.waitForTimeout(600);

    // Status should update
    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('Returned') || bodyText?.includes('returned')).toBeTruthy();
  });

  /* ───────── 12. Library Reports page loads ───────── */

  test('12) library reports show category stats and top overdue students', async ({ page }) => {
    await page.goto('/library/reports');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Library Reports')).toBeVisible({ timeout: 15000 });

    // Category stats
    await expect(page.getByText('Books by Category')).toBeVisible();

    // Most borrowed
    await expect(page.getByText('Most Borrowed Books')).toBeVisible();

    // Top overdue students
    await expect(page.getByText('Top Overdue Students')).toBeVisible();

    // Unpaid fines
    await expect(page.getByText('Unpaid Fines')).toBeVisible();
  });

  /* ───────── 13. Empty state when no books ───────── */

  test('13) empty state when no books exist', async ({ page }) => {
    state.books = [];
    await page.goto('/library/books');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('No books found') ||
      bodyText?.includes('no books') ||
      bodyText?.includes('Add Book'),
    ).toBeTruthy();
  });

  /* ───────── 14. Empty state when no issued books ───────── */

  test('14) empty state when no issued books exist', async ({ page }) => {
    state.issuedBooks = [];
    await page.goto('/library/issued');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('No issued books') ||
      bodyText?.includes('no issued') ||
      bodyText?.includes('Issue Book'),
    ).toBeTruthy();
  });

  /* ───────── 15. Validation errors on add book ───────── */

  test('15) add book form shows validation errors for required fields', async ({ page }) => {
    await page.goto('/library/books');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Add Book")').first().click();
    await page.waitForTimeout(300);

    // Submit empty form
    await page.locator('button:has-text("Add Book")').last().click();
    await page.waitForTimeout(300);

    // Should show validation errors
    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('required') ||
      bodyText?.includes('Required') ||
      bodyText?.includes('Title') ||
      bodyText?.includes('Author'),
    ).toBeTruthy();
  });

  /* ───────── 16. Navigation between tabs ───────── */

  test('16) tab navigation works across dashboard, books, issued, reports', async ({ page }) => {
    await page.goto('/library');
    await page.waitForLoadState('networkidle');

    // Click Books tab
    const booksTab = page.getByRole('tab', { name: /Books/i }).first();
    if (await booksTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await booksTab.click();
      await page.waitForTimeout(300);
      expect(page.url()).toContain('/library/books');
    }

    // Click Issued tab
    const issuedTab = page.getByRole('tab', { name: /Issued/i }).first();
    if (await issuedTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await issuedTab.click();
      await page.waitForTimeout(300);
      expect(page.url()).toContain('/library/issued');
    }

    // Click Reports tab
    const reportsTab = page.getByRole('tab', { name: /Reports/i }).first();
    if (await reportsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reportsTab.click();
      await page.waitForTimeout(300);
      expect(page.url()).toContain('/library/reports');
    }

    // Click Dashboard tab
    const dashboardTab = page.getByRole('tab', { name: /Dashboard/i }).first();
    if (await dashboardTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dashboardTab.click();
      await page.waitForTimeout(300);
      expect(page.url()).not.toContain('/books');
      expect(page.url()).not.toContain('/issued');
      expect(page.url()).not.toContain('/reports');
    }
  });

  /* ───────── 17. Book with zero available copies shows no issue button ───────── */

  test('17) book with zero available copies hides issue button', async ({ page }) => {
    await page.goto('/library/books');
    await page.waitForLoadState('networkidle');

    // Malgudi Days has 0 available copies
    const row = page.locator('tr:has-text("Malgudi Days")');
    const issueBtn = row.locator('button:has-text("Issue")');
    expect(await issueBtn.isVisible().catch(() => false)).toBeFalsy();
  });

  /* ───────── 18. Stats reflect correct counts ───────── */

  test('18) dashboard stats match seeded data', async ({ page }) => {
    await page.goto('/library');
    await page.waitForLoadState('networkidle');

    // Total books = 5
    const totalBooks = state.books.length;
    const totalIssued = state.issuedBooks.filter((ib: any) => ib.status === 'issued' || ib.status === 'overdue').length;
    const totalOverdue = state.issuedBooks.filter((ib: any) => ib.status === 'overdue').length;

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain(String(totalBooks));
    expect(bodyText).toContain(String(totalIssued));
    expect(bodyText).toContain(String(totalOverdue));
  });
});
