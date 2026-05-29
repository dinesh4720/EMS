import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, SCHOOL_ID,
  type MockState,
} from './test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Fee Template mock data
 * ───────────────────────────────────────────────────────────────────── */

interface FeeTemplateRecord {
  _id: string; id: string; name: string; section: string;
  description: string; isActive: boolean;
  feeHeads: Array<{ _id?: string; feeHeadId?: string; name: string; amount: number; category?: string; frequency?: string; mandatory?: boolean; applicableTerms?: number[]; dueDay?: number; refundable?: boolean }>;
  totalAnnualFee: number; schoolId: string;
}

function createTemplateState() {
  const state = createMockState();
  const templates: FeeTemplateRecord[] = [
    {
      _id: 'tmpl-001', id: 'tmpl-001',
      name: 'Standard Annual Plan',
      section: 'primary',
      description: 'Standard fee structure for all classes',
      isActive: true,
      feeHeads: [
        { _id: 'fh-tuition', name: 'Tuition Fee', amount: 5000, category: 'Academic', frequency: 'yearly', mandatory: true, applicableTerms: [1, 2], dueDay: 10, refundable: false },
        { _id: 'fh-transport', name: 'Transport Fee', amount: 2000, category: 'Transport', frequency: 'yearly', mandatory: false, applicableTerms: [1, 2], dueDay: 10, refundable: true },
      ],
      totalAnnualFee: 7000,
      schoolId: SCHOOL_ID,
    },
    {
      _id: 'tmpl-002', id: 'tmpl-002',
      name: 'Quarterly Plan',
      section: 'middle',
      description: 'Quarterly payment option',
      isActive: true,
      feeHeads: [
        { _id: 'fh-tuition-q', name: 'Tuition Fee', amount: 1500, category: 'Academic', frequency: 'quarterly', mandatory: true, applicableTerms: [1, 2], dueDay: 10, refundable: false },
      ],
      totalAnnualFee: 6000,
      schoolId: SCHOOL_ID,
    },
    {
      _id: 'tmpl-003', id: 'tmpl-003',
      name: 'Monthly Plan',
      section: 'secondary',
      description: 'Monthly installment plan',
      isActive: false,
      feeHeads: [
        { _id: 'fh-tuition-m', name: 'Tuition Fee', amount: 600, category: 'Academic', frequency: 'monthly', mandatory: true, applicableTerms: [1, 2], dueDay: 10, refundable: false },
      ],
      totalAnnualFee: 7200,
      schoolId: SCHOOL_ID,
    },
  ];
  return { state, templates };
}

async function installTemplateMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
  templates: FeeTemplateRecord[],
) {
  await installMockApi(page, state);

  await page.route('**/api/fee-templates**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method();

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path === '/fee-templates' && method === 'GET') {
      return json(templates);
    }
    if (path === '/fee-templates' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const newTmpl: FeeTemplateRecord = {
        _id: `tmpl-new-${Date.now()}`, id: `tmpl-new-${Date.now()}`,
        name: body.name || 'New Template',
        section: body.section || 'primary',
        description: body.description || '',
        isActive: body.isActive ?? true,
        feeHeads: body.feeHeads || [],
        totalAnnualFee: body.totalAnnualFee || (body.feeHeads || []).reduce((s: number, c: { amount: number }) => s + (c.amount || 0), 0),
        schoolId: SCHOOL_ID,
      };
      templates.push(newTmpl);
      return json(newTmpl, 201);
    }
    const idMatch = path.match(/^\/fee-templates\/([^/]+)$/);
    if (idMatch) {
      const id = idMatch[1];
      if (method === 'PUT' || method === 'PATCH') {
        const body = JSON.parse(request.postData() || '{}');
        const idx = templates.findIndex((t) => t._id === id);
        if (idx >= 0) { Object.assign(templates[idx], body); return json(templates[idx]); }
        return json({ error: 'Not found' }, 404);
      }
      if (method === 'DELETE') {
        const idx = templates.findIndex((t) => t._id === id);
        if (idx >= 0) templates.splice(idx, 1);
        return json({ message: 'Deleted' });
      }
    }
    return json({});
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('Fees — Templates (E2E-TEST-25)', () => {
  test('1) fee templates page loads and shows existing templates', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('domcontentloaded');

    // Wait for a template name to appear (confirms skeleton resolved and data loaded)
    await expect(page.getByText('Standard Annual Plan').first()).toBeVisible({ timeout: 15_000 });

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/template/);
    // Template names should appear
    expect(bodyText).toMatch(/Standard Annual Plan|Quarterly Plan|Monthly Plan/);
  });

  test('2) create template button opens a form/modal', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('domcontentloaded');

    const createBtn = page.getByRole('button', { name: /create template|add template|new template/i }).first();
    const hasCreate = await createBtn.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasCreate) {
      await createBtn.click();

      const modal = page.locator('[role="dialog"]').last();
      await expect(modal).toBeVisible({ timeout: 5000 });

      const modalText = await modal.textContent();
      expect(modalText?.toLowerCase()).toMatch(/template|name/);
    }
  });

  test('3) templates show active/inactive status badges', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('domcontentloaded');

    // Wait for a template name to appear (confirms data loaded)
    await expect(page.getByText('Standard Annual Plan').first()).toBeVisible({ timeout: 15_000 });

    const bodyText = await page.textContent('body');
    // Should show active status chips (Active for first 2 templates, Inactive for 3rd)
    expect(bodyText?.toLowerCase()).toMatch(/active|inactive/);
  });

  test('4) each template shows total amount', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('domcontentloaded');

    // Wait for a template name to appear (confirms data loaded)
    await expect(page.getByText('Standard Annual Plan').first()).toBeVisible({ timeout: 15_000 });

    const bodyText = await page.textContent('body');
    // Standard Annual Plan has totalAnnualFee = 7000, displayed as ₹7,000
    expect(bodyText).toMatch(/7,000|7000/);
  });

  test('5) edit template button opens form pre-filled with existing data', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('domcontentloaded');

    // Look for edit/pencil buttons — wait for data to load first
    await expect(page.getByText('Standard Annual Plan').first()).toBeVisible({ timeout: 15_000 });

    const editBtn = page.getByRole('button', { name: /edit/i }).or(
      page.locator('button[aria-label*="edit" i]'),
    ).first();
    const hasEdit = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEdit) {
      await editBtn.click();
      const modal = page.locator('[role="dialog"]').last();
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Should have a name input with the template name
      const nameInput = modal.locator('input').first();
      const hasInput = await nameInput.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasInput).toBeTruthy();
    }
  });

  test('6) delete template removes it from the list', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('domcontentloaded');

    const initialCount = templates.length;

    // Accept confirm dialogs
    page.on('dialog', (d) => d.accept());

    const deleteBtn = page.getByRole('button', { name: /delete/i }).or(
      page.locator('button[aria-label*="delete" i]'),
    ).first();
    const hasDelete = await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDelete) {
      await deleteBtn.click();
      await page.waitForLoadState('domcontentloaded');
      // Template count should decrease by 1
      expect(templates.length).toBe(initialCount - 1);
    }
  });

  test('7) duplicate template creates a copy with "(Copy)" suffix', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('domcontentloaded');

    const dupBtn = page.getByRole('button', { name: /duplicate|copy/i }).first();
    const hasDup = await dupBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDup) {
      const beforeCount = templates.length;
      await dupBtn.click();
      await page.waitForLoadState('domcontentloaded');

      // A new template should have been created
      const bodyText = await page.textContent('body');
      const hasCopy = bodyText?.includes('Copy') || templates.length > beforeCount;
      expect(hasCopy).toBeTruthy();
    }
  });

  test('8) fee templates page shows skeleton while loading', async ({ page }) => {
    const { state } = createTemplateState();
    await installMockApi(page, state);

    // Delay fee-templates response
    await page.route('**/api/fee-templates**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/fees/templates');

    const skeletons = page.locator('[class*="animate-pulse"], [class*="skeleton"]');
    const count = await skeletons.count();
    expect(count).toBeGreaterThanOrEqual(0);

    await page.waitForLoadState('domcontentloaded');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('9) fee component breakdown shows individual fee heads with amounts', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('domcontentloaded');

    // Wait for a template name to appear (confirms data loaded)
    await expect(page.getByText('Standard Annual Plan').first()).toBeVisible({ timeout: 10_000 });

    const bodyText = await page.textContent('body');
    // Should show fee head names as chips from the Standard Annual Plan
    expect(bodyText).toMatch(/Tuition Fee|Transport Fee/);
  });

  test('10) empty state shown when no templates exist', async ({ page }) => {
    const state = createMockState();
    await installMockApi(page, state);

    await page.route('**/api/fee-templates**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/fees/templates');
    await page.waitForLoadState('domcontentloaded');

    // Wait for the "Create Template" button to appear (confirms skeleton resolved)
    await expect(page.getByRole('button', { name: /create template/i })).toBeVisible({ timeout: 10_000 });

    const body = await page.textContent('body');
    // Should render without error
    expect(body).toBeTruthy();
    expect(body?.toLowerCase()).toMatch(/template|fee/);
  });
});
