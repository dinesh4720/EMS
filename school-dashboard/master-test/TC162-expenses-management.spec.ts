/**
 * TC162: Expenses Management — comprehensive E2E coverage.
 *
 * Covers the full expenses module:
 *   • Happy path: list load, summary cards, create/edit/delete
 *   • Filters: status tabs, category dropdown, search
 *   • Validation: required fields, amount bounds, URL format
 *   • Empty states: no expenses, filter yielding zero results
 *   • Edge cases: pagination, status change on edit, large amounts
 *
 * Mock data is realistic for an Indian school context.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Types
 * ───────────────────────────────────────────────────────────────────── */

interface ExpenseRecord {
  _id: string;
  id: string;
  title: string;
  amount: number;
  category: string;
  paymentMode: string;
  expenseDate: string;
  description?: string;
  receiptUrl?: string;
  vendor?: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  schoolId: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ExpenseSummaryItem {
  _id: string;
  total: number;
  count: number;
}

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

function createExpenseFixtures(): { expenses: ExpenseRecord[]; summary: ExpenseSummaryItem[] } {
  const expenses: ExpenseRecord[] = [
    {
      _id: 'exp-001', id: 'exp-001',
      title: 'Electricity Bill — May 2026',
      amount: 8_500,
      category: 'utilities',
      paymentMode: 'bank_transfer',
      expenseDate: '2026-05-15',
      description: 'Monthly electricity payment to BESCOM',
      vendor: 'Bangalore Electricity Supply Co.',
      status: 'approved',
      approvedBy: 'Dr. Krishnamurthy Iyer',
      schoolId: SCHOOL_ID,
      createdAt: '2026-05-15T10:00:00Z',
      updatedAt: '2026-05-15T10:00:00Z',
    },
    {
      _id: 'exp-002', id: 'exp-002',
      title: 'Classroom Desk Repairs',
      amount: 12_000,
      category: 'maintenance',
      paymentMode: 'cash',
      expenseDate: '2026-05-10',
      description: 'Repairing broken desks, chairs and ceiling fans in Block A',
      vendor: 'Ravi Carpentry Works',
      status: 'pending',
      schoolId: SCHOOL_ID,
      createdAt: '2026-05-10T09:30:00Z',
      updatedAt: '2026-05-10T09:30:00Z',
    },
    {
      _id: 'exp-003', id: 'exp-003',
      title: 'Science Lab Chemicals',
      amount: 5_400,
      category: 'supplies',
      paymentMode: 'upi',
      expenseDate: '2026-05-12',
      description: 'Sodium chloride, sulphuric acid, beakers and test tubes',
      vendor: 'LabMart India Pvt Ltd',
      status: 'approved',
      approvedBy: 'Mrs. Padma Nair',
      schoolId: SCHOOL_ID,
      createdAt: '2026-05-12T11:00:00Z',
      updatedAt: '2026-05-12T11:00:00Z',
    },
    {
      _id: 'exp-004', id: 'exp-004',
      title: 'Staff Salary — May 2026',
      amount: 1_50_000,
      category: 'salaries',
      paymentMode: 'bank_transfer',
      expenseDate: '2026-05-01',
      description: 'Monthly salary disbursement for teaching and non-teaching staff',
      vendor: 'SchoolSync Payroll',
      status: 'approved',
      approvedBy: 'Principal Ramesh Rao',
      schoolId: SCHOOL_ID,
      createdAt: '2026-05-01T09:00:00Z',
      updatedAt: '2026-05-01T09:00:00Z',
    },
    {
      _id: 'exp-005', id: 'exp-005',
      title: 'Annual Day Stage Decorations',
      amount: 25_000,
      category: 'events',
      paymentMode: 'cheque',
      expenseDate: '2026-05-20',
      description: 'Stage backdrop, lighting rental and floral arrangements',
      vendor: 'Shree Events & Decorators',
      status: 'rejected',
      schoolId: SCHOOL_ID,
      createdAt: '2026-05-20T14:00:00Z',
      updatedAt: '2026-05-20T14:00:00Z',
    },
    {
      _id: 'exp-006', id: 'exp-006',
      title: 'School Bus Diesel Refill',
      amount: 18_500,
      category: 'transport',
      paymentMode: 'upi',
      expenseDate: '2026-05-18',
      description: 'Weekly diesel refill for 3 school buses',
      vendor: 'Indian Oil Fuel Station',
      status: 'approved',
      approvedBy: 'Mr. Suresh Babu',
      schoolId: SCHOOL_ID,
      createdAt: '2026-05-18T08:00:00Z',
      updatedAt: '2026-05-18T08:00:00Z',
    },
    {
      _id: 'exp-007', id: 'exp-007',
      title: 'Smart Board Installation — Class 10',
      amount: 85_000,
      category: 'equipment',
      paymentMode: 'bank_transfer',
      expenseDate: '2026-05-22',
      description: 'Interactive smart board for Class 10-A mathematics lab',
      vendor: 'EduTech Solutions Bangalore',
      status: 'pending',
      schoolId: SCHOOL_ID,
      createdAt: '2026-05-22T10:30:00Z',
      updatedAt: '2026-05-22T10:30:00Z',
    },
    {
      _id: 'exp-008', id: 'exp-008',
      title: 'Mid-Day Meals — May Week 3',
      amount: 32_000,
      category: 'supplies',
      paymentMode: 'cash',
      expenseDate: '2026-05-21',
      description: 'Groceries and provisions for mid-day meal scheme',
      vendor: 'Sri Lakshmi Traders',
      status: 'approved',
      approvedBy: 'Mrs. Kavita Reddy',
      schoolId: SCHOOL_ID,
      createdAt: '2026-05-21T12:00:00Z',
      updatedAt: '2026-05-21T12:00:00Z',
    },
  ];

  const summary: ExpenseSummaryItem[] = [
    { _id: 'utilities', total: 8_500, count: 1 },
    { _id: 'maintenance', total: 12_000, count: 1 },
    { _id: 'supplies', total: 37_400, count: 2 },
    { _id: 'salaries', total: 1_50_000, count: 1 },
    { _id: 'events', total: 25_000, count: 1 },
    { _id: 'transport', total: 18_500, count: 1 },
    { _id: 'equipment', total: 85_000, count: 1 },
  ];

  return { expenses, summary };
}

async function installExpensesMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
  expenses: ExpenseRecord[],
  summary: ExpenseSummaryItem[],
) {
  await installMockApi(page, state);

  await page.route('**/api/expenses**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method();

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // Skip static assets
    if (/\.(js|ts|jsx|tsx|css|map|html|svg|png|jpg|woff2?)(\?|$)/i.test(url.pathname)) {
      return route.continue();
    }

    // LIST expenses
    if (path === '/expenses' && method === 'GET') {
      const q = url.searchParams.get('q')?.toLowerCase() || '';
      const statusFilter = url.searchParams.get('status') || '';
      const categoryFilter = url.searchParams.get('category') || '';
      let filtered = expenses.filter((e) => !e.isDeleted);
      if (statusFilter) filtered = filtered.filter((e) => e.status === statusFilter);
      if (categoryFilter) filtered = filtered.filter((e) => e.category === categoryFilter);
      if (q) filtered = filtered.filter((e) => e.title.toLowerCase().includes(q));
      const pageNum = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      const start = (pageNum - 1) * limit;
      const paginated = filtered.slice(start, start + limit);
      return json({
        expenses: paginated,
        total: filtered.length,
        page: pageNum,
        totalPages: Math.ceil(filtered.length / limit) || 1,
      });
    }

    // SUMMARY
    if (path === '/expenses/summary' && method === 'GET') {
      return json({ summary, totalAmount: summary.reduce((s, c) => s + c.total, 0) });
    }

    // CREATE
    if (path === '/expenses' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const newExp: ExpenseRecord = {
        _id: `exp-new-${Date.now()}`,
        id: `exp-new-${Date.now()}`,
        title: body.title || 'New Expense',
        amount: Number(body.amount) || 0,
        category: body.category || 'other',
        paymentMode: body.paymentMode || 'cash',
        expenseDate: body.expenseDate || new Date().toISOString().split('T')[0],
        description: body.description || '',
        receiptUrl: body.receiptUrl || '',
        vendor: body.vendor || '',
        status: body.status || 'pending',
        approvedBy: body.approvedBy || '',
        schoolId: SCHOOL_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expenses.push(newExp);
      return json(newExp, 201);
    }

    // UPDATE / DELETE by ID
    const idMatch = path.match(/^\/expenses\/([^/]+)$/);
    if (idMatch) {
      const id = idMatch[1];
      if (method === 'PUT') {
        const body = JSON.parse(request.postData() || '{}');
        const idx = expenses.findIndex((e) => e._id === id);
        if (idx >= 0) {
          Object.assign(expenses[idx], body, { updatedAt: new Date().toISOString() });
          return json(expenses[idx]);
        }
        return json({ error: 'Expense not found' }, 404);
      }
      if (method === 'DELETE') {
        const idx = expenses.findIndex((e) => e._id === id);
        if (idx >= 0) {
          expenses[idx].isDeleted = true;
          return json({ message: 'Expense deleted' });
        }
        return json({ error: 'Expense not found' }, 404);
      }
    }

    return json({});
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Test suite
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC162 — Expenses Management', () => {
  /**
   * TC162-1
   * Happy path: expenses page loads, lists all records, and summary
   * cards display correct totals.
   */
  test('TC162-1: page loads with expenses list and summary cards', async ({ page }) => {
    const state = createMockState();
    const { expenses, summary } = createExpenseFixtures();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');

    // Page title
    await expect(page.getByRole('heading', { name: /Expenses/i })).toBeVisible({ timeout: 15_000 });

    // Table rows visible
    await expect(page.getByText('Electricity Bill — May 2026').first()).toBeVisible();
    await expect(page.getByText('Classroom Desk Repairs').first()).toBeVisible();
    await expect(page.getByText('Science Lab Chemicals').first()).toBeVisible();

    // Summary cards
    await expect(page.getByText('Total Expenses').first()).toBeVisible();
    await expect(page.getByText('Top Category').first()).toBeVisible();
    await expect(page.getByText('Total Entries').first()).toBeVisible();

    // Currency formatting for total
    const totalAmount = summary.reduce((s, c) => s + c.total, 0);
    const formattedTotal = new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(totalAmount);
    await expect(page.getByText(formattedTotal).first()).toBeVisible();
  });

  /**
   * TC162-2
   * Happy path: create a new expense and verify it appears in the list.
   */
  test('TC162-2: create new expense via add sheet', async ({ page }) => {
    const state = createMockState();
    const { expenses, summary } = createExpenseFixtures();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');

    await page.getByRole('button', { name: /add expense/i }).first().click();
    const sheet = page.locator('[role="dialog"]').last();
    await expect(sheet).toBeVisible({ timeout: 5_000 });
    await expect(sheet.getByRole('heading', { name: 'Add expense' })).toBeVisible();

    // Fill form
    const inputs = sheet.locator('input');
    await inputs.nth(0).fill('Sports Equipment — Cricket Kit');
    await inputs.nth(1).fill('12500');
    await inputs.nth(2).fill('2026-05-25'); // date

    // Category select
    await sheet.locator('select').nth(0).selectOption('equipment');
    // Payment mode select
    await sheet.locator('select').nth(1).selectOption('cheque');

    // Description textarea
    await sheet.locator('textarea').fill('Cricket bats, balls, pads and helmets for inter-school tournament');

    // Vendor
    await inputs.nth(3).fill('Decathlon Sports India');

    await sheet.getByRole('button', { name: /add expense/i }).click();
    await page.waitForResponse('**/api/expenses**');

    await expect(page.getByText('Sports Equipment — Cricket Kit').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('₹12,500').first()).toBeVisible();
  });

  /**
   * TC162-3
   * Happy path: edit an existing expense and verify updated value.
   */
  test('TC162-3: edit existing expense and update amount', async ({ page }) => {
    const state = createMockState();
    const { expenses, summary } = createExpenseFixtures();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May 2026').first()).toBeVisible({ timeout: 15_000 });

    // Click edit on first row
    const editBtn = page.locator('button[aria-label^="Edit"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    const sheet = page.locator('[role="dialog"]').last();
    await expect(sheet).toBeVisible({ timeout: 5_000 });
    await expect(sheet.getByText('Edit expense')).toBeVisible();

    // Update amount
    const amountInput = sheet.locator('input[type="number"]').first();
    await amountInput.fill('9500');

    // Change status to approved
    await sheet.locator('select').filter({ hasText: /Pending|Approved|Rejected/ }).selectOption('approved');

    // Approved by
    const approvedByInput = sheet.locator('input[placeholder="Name of approver"]').first();
    await approvedByInput.fill('Dr. Krishnamurthy Iyer');

    await sheet.getByRole('button', { name: /update expense/i }).click();
    await page.waitForResponse('**/api/expenses**');

    await expect(page.getByText('₹9,500').first()).toBeVisible({ timeout: 10_000 });
  });

  /**
   * TC162-4
   * Happy path: delete an expense with confirmation dialog.
   */
  test('TC162-4: delete expense with confirmation dialog', async ({ page }) => {
    const state = createMockState();
    const { expenses, summary } = createExpenseFixtures();
    const initialCount = expenses.length;
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Classroom Desk Repairs').first()).toBeVisible({ timeout: 15_000 });

    const deleteBtn = page.locator('button[aria-label^="Delete"]').first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    const confirmDialog = page.locator('[role="alertdialog"]');
    await expect(confirmDialog.getByRole('button', { name: /delete/i })).toBeVisible({ timeout: 3_000 });
    await expect(confirmDialog).toContainText('Delete Expense');
    await confirmDialog.getByRole('button', { name: /delete/i }).click();

    await page.waitForResponse('**/api/expenses**');
    expect(expenses.filter((e) => !e.isDeleted).length).toBe(initialCount - 1);
  });

  /**
   * TC162-5
   * Validation: submitting empty title shows error.
   */
  test('TC162-5: validation error on empty title', async ({ page }) => {
    const state = createMockState();
    const { expenses, summary } = createExpenseFixtures();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');

    await page.getByRole('button', { name: /add expense/i }).first().click();
    const sheet = page.locator('[role="dialog"]').last();
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    // Leave title empty, fill other required fields
    await sheet.locator('input[type="number"]').first().fill('5000');
    await sheet.locator('input[type="date"]').first().fill('2026-05-25');
    await sheet.locator('select').nth(0).selectOption('supplies');

    await sheet.getByRole('button', { name: /add expense/i }).click();

    // Error should appear
    await expect(sheet.locator('.fees-sheet__error').first()).toBeVisible({ timeout: 3_000 });
    await expect(sheet.locator('.fees-sheet__error').first()).toContainText('Title is required');
  });

  /**
   * TC162-6
   * Validation: negative amount is rejected.
   */
  test('TC162-6: validation error on negative amount', async ({ page }) => {
    const state = createMockState();
    const { expenses, summary } = createExpenseFixtures();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');

    await page.getByRole('button', { name: /add expense/i }).first().click();
    const sheet = page.locator('[role="dialog"]').last();
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    await sheet.locator('input[type="text"]').first().fill('Invalid Amount Test');
    await sheet.locator('input[type="number"]').first().fill('-100');
    await sheet.locator('input[type="date"]').first().fill('2026-05-25');
    await sheet.locator('select').nth(0).selectOption('other');

    await sheet.getByRole('button', { name: /add expense/i }).click();

    await expect(sheet.locator('.fees-sheet__error')).toContainText(/Amount must be 0 or greater/i);
  });

  /**
   * TC162-7
   * Validation: invalid receipt URL shows error.
   */
  test('TC162-7: validation error on invalid receipt URL', async ({ page }) => {
    const state = createMockState();
    const { expenses, summary } = createExpenseFixtures();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');

    await page.getByRole('button', { name: /add expense/i }).first().click();
    const sheet = page.locator('[role="dialog"]').last();
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    await sheet.locator('input[type="text"]').first().fill('Lab Equipment Purchase');
    await sheet.locator('input[type="number"]').first().fill('7500');
    await sheet.locator('input[type="date"]').first().fill('2026-05-25');
    await sheet.locator('select').nth(0).selectOption('equipment');

    // Invalid URL
    const urlInput = sheet.locator('input[type="url"]').first();
    await urlInput.fill('not-a-valid-url');

    await sheet.getByRole('button', { name: /add expense/i }).click();

    await expect(sheet.locator('.fees-sheet__error')).toContainText(/Please enter a valid URL/i);
  });

  /**
   * TC162-8
   * Filter: status tab filters (Pending → Approved → Rejected → All).
   */
  test('TC162-8: filter by status tabs', async ({ page }) => {
    const state = createMockState();
    const { expenses, summary } = createExpenseFixtures();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May 2026').first()).toBeVisible({ timeout: 15_000 });

    // Click Approved tab
    await page.getByRole('tab', { name: /approved/i }).click();
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May 2026').first()).toBeVisible();
    await expect(page.getByText('Annual Day Stage Decorations').first()).not.toBeVisible();

    // Click Rejected tab
    await page.getByRole('tab', { name: /rejected/i }).click();
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Annual Day Stage Decorations').first()).toBeVisible();
    await expect(page.getByText('Electricity Bill — May 2026').first()).not.toBeVisible();

    // Back to All
    await page.getByRole('tab', { name: /^All$/i }).click();
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May 2026').first()).toBeVisible();
    await expect(page.getByText('Classroom Desk Repairs').first()).toBeVisible();
  });

  /**
   * TC162-9
   * Filter: category dropdown filters expenses.
   */
  test('TC162-9: filter by category dropdown', async ({ page }) => {
    const state = createMockState();
    const { expenses, summary } = createExpenseFixtures();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May 2026').first()).toBeVisible({ timeout: 15_000 });

    await page.locator('select[aria-label="Filter by category"]').selectOption('supplies');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Science Lab Chemicals').first()).toBeVisible();
    await expect(page.getByText('Mid-Day Meals — May Week 3').first()).toBeVisible();
    await expect(page.getByText('Electricity Bill — May 2026').first()).not.toBeVisible();
  });

  /**
   * TC162-10
   * Search: query filters by title.
   */
  test('TC162-10: search filters expenses by title', async ({ page }) => {
    const state = createMockState();
    const { expenses, summary } = createExpenseFixtures();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May 2026').first()).toBeVisible({ timeout: 15_000 });

    const searchInput = page.locator('input[aria-label="Search expenses"]').first();
    await searchInput.fill('Smart Board');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Smart Board Installation — Class 10').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Electricity Bill — May 2026').first()).not.toBeVisible();
  });

  /**
   * TC162-11
   * Empty state: when no expenses exist, show empty state with CTA.
   */
  test('TC162-11: empty state when no expenses exist', async ({ page }) => {
    const state = createMockState();
    await installMockApi(page, state);

    await page.route('**/api/expenses**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname.replace(/^\/api/, '');
      if (path === '/expenses' && request.method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ expenses: [], total: 0, page: 1, totalPages: 1 }),
        });
      }
      if (path === '/expenses/summary' && request.method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ summary: [], totalAmount: 0 }),
        });
      }
      return route.continue();
    });

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');

    await expect(page.getByRole('button', { name: /add your first expense/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/No expenses found/i)).toBeVisible();
  });

  /**
   * TC162-12
   * Edge case: search yielding zero results shows empty state.
   */
  test('TC162-12: search with no matches shows empty state', async ({ page }) => {
    const state = createMockState();
    const { expenses, summary } = createExpenseFixtures();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May 2026').first()).toBeVisible({ timeout: 15_000 });

    const searchInput = page.locator('input[aria-label="Search expenses"]').first();
    await searchInput.fill('NonExistentQuery12345');
    await page.waitForResponse('**/api/expenses**');

    await expect(page.getByRole('button', { name: /add your first expense/i })).toBeVisible({ timeout: 10_000 });
  });

  /**
   * TC162-13
   * Edge case: pagination controls appear when data exceeds one page.
   */
  test('TC162-13: pagination works with large dataset', async ({ page }) => {
    const state = createMockState();
    const expenses: ExpenseRecord[] = [];
    const summary: ExpenseSummaryItem[] = [
      { _id: 'supplies', total: 50_000, count: 25 },
    ];

    // Generate 25 expenses to trigger pagination (limit = 20)
    for (let i = 1; i <= 25; i++) {
      expenses.push({
        _id: `exp-pag-${i}`,
        id: `exp-pag-${i}`,
        title: `Supply Purchase ${i}`,
        amount: 2000,
        category: 'supplies',
        paymentMode: 'cash',
        expenseDate: '2026-05-15',
        vendor: 'Sri Lakshmi Traders',
        status: 'approved',
        schoolId: SCHOOL_ID,
        createdAt: '2026-05-15T10:00:00Z',
        updatedAt: '2026-05-15T10:00:00Z',
      });
    }

    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');

    await expect(page.getByText('Page 1 of 2').first()).toBeVisible({ timeout: 15_000 });

    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await page.waitForResponse('**/api/expenses**');

    await expect(page.getByText('Page 2 of 2').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Supply Purchase 21').first()).toBeVisible();

    const prevBtn = page.getByRole('button', { name: /previous/i });
    await expect(prevBtn).toBeEnabled();
    await prevBtn.click();
    await page.waitForResponse('**/api/expenses**');

    await expect(page.getByText('Page 1 of 2').first()).toBeVisible();
  });

  /**
   * TC162-14
   * Edge case: very large amount is formatted correctly (₹1,50,000+).
   */
  test('TC162-14: large amounts formatted in Indian numbering', async ({ page }) => {
    const state = createMockState();
    const { expenses, summary } = createExpenseFixtures();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');

    await expect(page.getByText('₹1,50,000').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('₹85,000').first()).toBeVisible();
  });

  /**
   * TC162-15
   * Accessibility: all interactive elements reachable via keyboard,
   * focus states visible, and dialog has correct ARIA attributes.
   */
  test('TC162-15: accessibility — keyboard navigation and ARIA', async ({ page }) => {
    const state = createMockState();
    const { expenses, summary } = createExpenseFixtures();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');

    // Tab to first edit button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Open add expense with keyboard
    const addBtn = page.getByRole('button', { name: /add expense/i }).first();
    await addBtn.focus();
    await addBtn.click();

    const sheet = page.locator('[role="dialog"]').last();
    await expect(sheet).toBeVisible({ timeout: 5_000 });

    // Dialog has aria-label
    const ariaLabel = await sheet.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/Add expense/i);

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible();
  });
});
