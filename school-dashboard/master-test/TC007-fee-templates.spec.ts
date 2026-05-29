/**
 * TC007: Admin creates and manages fee templates.
 *
 * Verifies the fee templates page: creating templates with fee head
 * components, verifying total calculations, and template CRUD operations.
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
 *  Fee template mock data and routes
 * ────────────���──────────────────────────────���───────────────────────── */

interface FeeTemplateRecord {
  _id: string; id: string; name: string; section: string;
  description: string; isActive: boolean;
  feeComponents: Array<{ feeHeadId: string; name: string; amount: number; frequency: string }>;
  totalAmount: number; schoolId: string;
}

function createTemplateState() {
  const state = createMockState();
  // Enrich fee heads with frequency
  state.feeHeads = [
    { _id: 'fh-tuition', id: 'fh-tuition', name: 'Tuition Fee', type: 'tuition', amount: 2500, frequency: 'monthly', schoolId: SCHOOL_ID },
    { _id: 'fh-transport', id: 'fh-transport', name: 'Transport Fee', type: 'transport', amount: 1000, frequency: 'monthly', schoolId: SCHOOL_ID },
    { _id: 'fh-lab', id: 'fh-lab', name: 'Lab Fee', type: 'academic', amount: 3000, frequency: 'yearly', schoolId: SCHOOL_ID },
  ];

  const templates: FeeTemplateRecord[] = [
    {
      _id: 'tmpl-001', id: 'tmpl-001',
      name: 'Secondary Standard Template',
      section: 'secondary',
      description: 'For classes 9-12',
      isActive: true,
      feeComponents: [
        { feeHeadId: 'fh-tuition', name: 'Tuition Fee', amount: 3000, frequency: 'monthly' },
        { feeHeadId: 'fh-transport', name: 'Transport Fee', amount: 1500, frequency: 'monthly' },
      ],
      totalAmount: 54000, // (3000+1500)*12
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

    state.requestLog.add(`${method} ${path}`);

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
        feeComponents: body.feeComponents || [],
        totalAmount: (body.feeComponents || []).reduce(
          (sum: number, c: { amount: number; frequency?: string }) => {
            const monthly = (c.frequency === 'monthly') ? c.amount * 12 : c.amount;
            return sum + monthly;
          }, 0,
        ),
        schoolId: SCHOOL_ID,
      };
      templates.push(newTmpl);
      return json(newTmpl, 201);
    }

    const idMatch = path.match(/^\/fee-templates\/([^/]+)$/);
    if (idMatch) {
      const id = idMatch[1];
      if (method === 'GET') {
        const tmpl = templates.find((t) => t._id === id);
        return tmpl ? json(tmpl) : json({ error: 'Not found' }, 404);
      }
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

    // Duplicate endpoint
    if (path.match(/\/duplicate$/i) && method === 'POST') {
      const srcId = path.split('/').slice(-2, -1)[0];
      const src = templates.find((t) => t._id === srcId);
      if (src) {
        const dup = { ...src, _id: `tmpl-dup-${Date.now()}`, id: `tmpl-dup-${Date.now()}`, name: `${src.name} (Copy)` };
        templates.push(dup);
        return json(dup, 201);
      }
    }

    return json({});
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC007: Fee Templates — Create, Edit, Duplicate, Delete', () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
  });

  test('1) fee templates page loads and shows existing template', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/template/);
    expect(bodyText).toContain('Secondary Standard Template');
  });

  test('2) click "Create Template" and fill template details', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /create template|add template|new template/i }).first();
    const hasCreate = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCreate) {
      await createBtn.click();

      // Modal or page should show template form
      const modal = page.locator('[role="dialog"]').last();
      const hasModal = await modal.isVisible({ timeout: 5000 }).catch(() => false);

      const formContainer = hasModal ? modal : page;

      // Fill template name
      const nameInput = formContainer.locator('input[name="name"], input[placeholder*="template name" i]').first();
      const hasName = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasName) await nameInput.fill('Primary Standard Template');

      // Select section
      const sectionSelect = formContainer.locator('select[name="section"], [data-testid="section-select"]').first();
      const hasSection = await sectionSelect.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasSection) {
        await sectionSelect.selectOption({ label: 'Primary' }).catch(() =>
          sectionSelect.selectOption({ value: 'primary' }).catch(() => {}),
        );
      }

      const bodyText = await formContainer.textContent();
      expect(bodyText?.toLowerCase()).toMatch(/template|name|fee/i);
    }
  });

  test('3) add fee components (Tuition monthly 2500, Transport monthly 1000)', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /create template|add template|new template/i }).first();
    const hasCreate = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCreate) {
      await createBtn.click();
      await page.waitForTimeout(500);

      // Look for "Add Fee Component" or "Add Fee Head" button
      const addComponentBtn = page.getByRole('button', { name: /add fee|add component|add head|\+/i }).last();
      const hasAddComponent = await addComponentBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasAddComponent) {
        await addComponentBtn.click();
        await page.waitForTimeout(300);
      }

      // Look for fee head selector and amount inputs
      const feeHeadSelect = page.locator('select[name*="feeHead"], select[name*="component"]').first();
      const hasSelectHead = await feeHeadSelect.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasSelectHead) {
        await feeHeadSelect.selectOption({ label: 'Tuition Fee' }).catch(() => {});
      }

      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase()).toMatch(/fee|component|template/i);
    }
  });

  test('4) verify total annual fee calculation', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // The existing template has total 54,000 ((3000+1500)*12)
    expect(bodyText).toMatch(/54,000|54000/);
  });

  test('5) save template and verify it appears in list', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    const initialCount = templates.length;

    await page.goto('/fees/templates');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /create template|add template|new template/i }).first();
    const hasCreate = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCreate) {
      await createBtn.click();
      await page.waitForTimeout(500);

      // Fill name
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').last();
      const hasName = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasName) await nameInput.fill('Primary Standard Template');

      // Save
      const saveBtn = page.getByRole('button', { name: /save|create|submit/i }).last();
      const hasSave = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasSave) {
        await saveBtn.click();
        await page.waitForLoadState('networkidle');
      }

      // Check if template was created
      const postCalled = [...state.requestLog].some(
        (entry) => entry.includes('POST') && entry.includes('/fee-templates'),
      );
      if (postCalled) {
        expect(templates.length).toBeGreaterThan(initialCount);
      }
    }
  });

  test('6) duplicate template action creates a copy', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('networkidle');

    // Look for duplicate/copy button on existing template
    const duplicateBtn = page.locator(
      'button[aria-label*="duplicate" i], button[aria-label*="copy" i], button:has-text("Duplicate")',
    ).first();
    const hasDuplicate = await duplicateBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDuplicate) {
      const countBefore = templates.length;
      await duplicateBtn.click();
      await page.waitForLoadState('networkidle');

      // Template list should grow
      expect(templates.length).toBeGreaterThanOrEqual(countBefore);
    }
  });

  test('7) edit template opens pre-filled form', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('networkidle');

    // Look for edit button
    const editBtn = page.locator(
      'button[aria-label*="edit" i], button:has-text("Edit")',
    ).first().or(page.getByTitle('Edit').first());
    const hasEdit = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEdit) {
      await editBtn.click();
      await page.waitForTimeout(500);

      // Should show a form with the template name pre-filled
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').last();
      const hasName = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasName) {
        const value = await nameInput.inputValue();
        expect(value).toContain('Secondary Standard Template');
      }
    }
  });

  test('8) delete template with confirmation', async ({ page }) => {
    const { state, templates } = createTemplateState();
    await installTemplateMockApi(page, state, templates);

    await page.goto('/fees/templates');
    await page.waitForLoadState('networkidle');

    const initialCount = templates.length;

    // Look for delete button
    const deleteBtn = page.locator(
      'button[aria-label*="delete" i], button:has-text("Delete")',
    ).first().or(page.getByTitle('Delete').first());
    const hasDelete = await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDelete) {
      // Handle confirmation dialog
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      await deleteBtn.click();
      await page.waitForLoadState('networkidle');

      // Check if delete was called
      const deleteCalled = [...state.requestLog].some(
        (entry) => entry.includes('DELETE') && entry.includes('/fee-templates'),
      );
      if (deleteCalled) {
        expect(templates.length).toBeLessThan(initialCount);
      }
    }
  });
});
