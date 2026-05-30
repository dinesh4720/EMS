import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, SCHOOL_ID,
  type MockState,
} from './test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Expenses mock data
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
  academicYear?: string;
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

function createExpenseState() {
  const state = createMockState();
  const expenses: ExpenseRecord[] = [
    {
      _id: 'exp-001', id: 'exp-001',
      title: 'Electricity Bill — May',
      amount: 8500,
      category: 'utilities',
      paymentMode: 'bank_transfer',
      expenseDate: '2026-05-15',
      description: 'Monthly electricity payment',
      vendor: 'State Power Board',
      status: 'approved',
      approvedBy: 'Dr. Krishnamurthy',
      schoolId: SCHOOL_ID,
      createdAt: '2026-05-15T10:00:00Z',
      updatedAt: '2026-05-15T10:00:00Z',
    },
    {
      _id: 'exp-002', id: 'exp-002',
      title: 'Classroom Repairs',
      amount: 12000,
      category: 'maintenance',
      paymentMode: 'cash',
      expenseDate: '2026-05-10',
      description: 'Fixing broken desks and fans',
      vendor: 'Local Carpentry',
      status: 'pending',
      schoolId: SCHOOL_ID,
      createdAt: '2026-05-10T09:30:00Z',
      updatedAt: '2026-05-10T09:30:00Z',
    },
    {
      _id: 'exp-003', id: 'exp-003',
      title: 'Science Lab Supplies',
      amount: 5400,
      category: 'supplies',
      paymentMode: 'upi',
      expenseDate: '2026-05-12',
      description: 'Chemicals and glassware',
      vendor: 'LabMart India',
      status: 'approved',
      approvedBy: 'Priya Menon',
      schoolId: SCHOOL_ID,
      createdAt: '2026-05-12T11:00:00Z',
      updatedAt: '2026-05-12T11:00:00Z',
    },
    {
      _id: 'exp-004', id: 'exp-004',
      title: 'Staff Salary — May',
      amount: 150000,
      category: 'salaries',
      paymentMode: 'bank_transfer',
      expenseDate: '2026-05-01',
      description: 'Monthly staff payroll',
      status: 'approved',
      approvedBy: 'Dr. Krishnamurthy',
      schoolId: SCHOOL_ID,
      createdAt: '2026-05-01T08:00:00Z',
      updatedAt: '2026-05-01T08:00:00Z',
    },
    {
      _id: 'exp-005', id: 'exp-005',
      title: 'Annual Day Decorations',
      amount: 25000,
      category: 'events',
      paymentMode: 'cheque',
      expenseDate: '2026-05-20',
      description: 'Stage and hall decorations',
      vendor: 'Event Decorators',
      status: 'rejected',
      schoolId: SCHOOL_ID,
      createdAt: '2026-05-20T14:00:00Z',
      updatedAt: '2026-05-20T14:00:00Z',
    },
  ];

  const summary: ExpenseSummaryItem[] = [
    { _id: 'utilities', total: 8500, count: 1 },
    { _id: 'maintenance', total: 12000, count: 1 },
    { _id: 'supplies', total: 5400, count: 1 },
    { _id: 'salaries', total: 150000, count: 1 },
    { _id: 'events', total: 25000, count: 1 },
  ];

  return { state, expenses, summary };
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

    if (path === '/expenses/summary' && method === 'GET') {
      return json({ summary, totalAmount: summary.reduce((s, c) => s + c.total, 0) });
    }

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
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('Expenses Management (E2E-TEST-Expenses)', () => {
  test('1) expenses page loads and shows existing expenses', async ({ page }) => {
    const { state, expenses, summary } = createExpenseState();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');

    await expect(page.getByText('Electricity Bill — May').first()).toBeVisible({ timeout: 15_000 });
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/Expenses/);
    expect(bodyText).toMatch(/Electricity Bill/);
    expect(bodyText).toMatch(/Classroom Repairs/);
  });

  test('2) summary cards show category breakdown', async ({ page }) => {
    const { state, expenses, summary } = createExpenseState();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');

    await expect(page.getByText('Total Expenses').first()).toBeVisible({ timeout: 15_000 });
    const bodyText = await page.textContent('body');
    // Total should include all category totals
    expect(bodyText).toMatch(/Total Expenses/);
    expect(bodyText).toMatch(/Top Category/);
    expect(bodyText).toMatch(/Total Entries/);
  });

  test('3) create expense button opens the add sheet', async ({ page }) => {
    const { state, expenses, summary } = createExpenseState();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');

    const addBtn = page.getByRole('button', { name: /add expense/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
    await addBtn.click();

    const sheet = page.locator('[role="dialog"]').last();
    await expect(sheet).toBeVisible({ timeout: 5000 });
    await expect(sheet.getByRole('heading', { name: 'Add expense' })).toBeVisible();
  });

  test('4) create a new expense and see it in the list', async ({ page }) => {
    const { state, expenses, summary } = createExpenseState();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');

    await page.getByRole('button', { name: /add expense/i }).first().click();
    const sheet = page.locator('[role="dialog"]').last();
    await expect(sheet).toBeVisible({ timeout: 5000 });

    await sheet.locator('input[type="text"]').first().fill('New Test Expense');
    await sheet.locator('input[type="number"]').first().fill('5000');
    await sheet.locator('select').first().selectOption('transport');
    await sheet.getByRole('button', { name: /add expense/i }).click();

    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('New Test Expense').first()).toBeVisible({ timeout: 10_000 });
  });

  test('5) edit an existing expense', async ({ page }) => {
    const { state, expenses, summary } = createExpenseState();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May').first()).toBeVisible({ timeout: 15_000 });

    const editBtn = page.locator('button[aria-label*="Edit" i]').first();
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();

    const sheet = page.locator('[role="dialog"]').last();
    await expect(sheet).toBeVisible({ timeout: 5000 });
    await expect(sheet.getByText('Edit expense')).toBeVisible();

    const titleInput = sheet.locator('input[type="text"]').first();
    await titleInput.fill('Updated Electricity Bill');
    await sheet.getByRole('button', { name: /update expense/i }).click();

    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Updated Electricity Bill').first()).toBeVisible({ timeout: 10_000 });
  });

  test('6) delete an expense with confirmation', async ({ page }) => {
    const { state, expenses, summary } = createExpenseState();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May').first()).toBeVisible({ timeout: 15_000 });

    const initialCount = expenses.length;
    const deleteBtn = page.locator('button[aria-label*="Delete" i]').first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();

    const confirmDialog = page.locator('[role="alertdialog"]');
    await expect(confirmDialog.getByRole('button', { name: /delete/i })).toBeVisible({ timeout: 3000 });
    await confirmDialog.getByRole('button', { name: /delete/i }).click();

    await page.waitForResponse('**/api/expenses**');
    expect(expenses.filter((e) => !e.isDeleted).length).toBe(initialCount - 1);
  });

  test('7) filter by status works', async ({ page }) => {
    const { state, expenses, summary } = createExpenseState();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('tab', { name: /approved/i }).click();
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May').first()).toBeVisible({ timeout: 10_000 });

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/Electricity Bill|Science Lab Supplies|Staff Salary/);
    expect(bodyText).not.toMatch(/Annual Day Decorations/);
  });

  test('8) filter by category works', async ({ page }) => {
    const { state, expenses, summary } = createExpenseState();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May').first()).toBeVisible({ timeout: 15_000 });

    await page.locator('select[aria-label="Filter by category"]').selectOption('utilities');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May').first()).toBeVisible({ timeout: 10_000 });

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/Electricity Bill/);
    expect(bodyText).not.toMatch(/Classroom Repairs/);
  });

  test('9) search filters expenses by title', async ({ page }) => {
    const { state, expenses, summary } = createExpenseState();
    await installExpensesMockApi(page, state, expenses, summary);

    await page.goto('/expenses');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Electricity Bill — May').first()).toBeVisible({ timeout: 15_000 });

    const searchInput = page.locator('input[aria-label="Search expenses"]').first();
    await searchInput.fill('Science');
    await page.waitForResponse('**/api/expenses**');
    await expect(page.getByText('Science Lab Supplies').first()).toBeVisible({ timeout: 10_000 });

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/Science Lab Supplies/);
    expect(bodyText).not.toMatch(/Electricity Bill/);
  });

  test('10) empty state shown when no expenses exist', async ({ page }) => {
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
    const body = await page.textContent('body');
    expect(body?.toLowerCase()).toMatch(/expenses/);
  });
});
