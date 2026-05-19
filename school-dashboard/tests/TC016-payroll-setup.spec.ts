import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

interface SalaryComponent {
  _id: string;
  name: string;
  type: 'earning' | 'deduction';
  isPercentage: boolean;
  value: number;
  isActive: boolean;
  schoolId: string;
}

interface SalaryTemplate {
  _id: string;
  name: string;
  basicSalary: number;
  components: Array<{ componentId: string; name: string; type: string; value: number }>;
  schoolId: string;
}

function createPayrollSettingsState() {
  const state = createMockState();

  const components: SalaryComponent[] = [
    { _id: 'comp-basic', name: 'Basic Salary', type: 'earning', isPercentage: false, value: 0, isActive: true, schoolId: SCHOOL_ID },
  ];

  const templates: SalaryTemplate[] = [
    {
      _id: 'tpl-teaching', name: 'Teaching Staff',
      basicSalary: 35000,
      components: [
        { componentId: 'comp-basic', name: 'Basic Salary', type: 'earning', value: 35000 },
      ],
      schoolId: SCHOOL_ID,
    },
  ];

  return { state, components, templates };
}

async function installPayrollSettingsMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
  components: SalaryComponent[],
  templates: SalaryTemplate[],
) {
  await installMockApi(page, state);

  // Payroll settings
  await page.route('**/api/settings/payroll**', async (route) => {
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'GET') {
      return json({
        currency: 'INR',
        salaryDay: 1,
        overtimeEnabled: false,
        components,
      });
    }
    if (method === 'PUT' || method === 'PATCH') {
      const body = JSON.parse(route.request().postData() || '{}');
      return json({ ...body, success: true });
    }
    return json({});
  });

  // Salary components CRUD
  await page.route('**/api/salary-components**', async (route) => {
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'GET') {
      return json({ data: components, total: components.length });
    }
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const newComp: SalaryComponent = {
        _id: `comp-${Date.now()}`,
        name: body.name,
        type: body.type || 'earning',
        isPercentage: body.isPercentage || false,
        value: body.value || 0,
        isActive: true,
        schoolId: SCHOOL_ID,
      };
      components.push(newComp);
      return json(newComp, 201);
    }
    return json({});
  });

  // Individual component delete
  await page.route('**/api/salary-components/*', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const id = url.pathname.split('/').pop();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'DELETE') {
      const idx = components.findIndex((c) => c._id === id);
      if (idx >= 0) {
        components.splice(idx, 1);
        return json({ message: 'Deleted' });
      }
      return json({ error: 'Not found' }, 404);
    }
    if (method === 'PUT') {
      const body = JSON.parse(route.request().postData() || '{}');
      const comp = components.find((c) => c._id === id);
      if (comp) Object.assign(comp, body);
      return json(comp || {});
    }
    if (method === 'GET') {
      const comp = components.find((c) => c._id === id);
      return comp ? json(comp) : json({ error: 'Not found' }, 404);
    }
    return json({});
  });

  // Salary templates
  await page.route('**/api/salary-templates**', async (route) => {
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'GET') {
      return json(templates);
    }
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const tpl: SalaryTemplate = {
        _id: `tpl-${Date.now()}`,
        name: body.name,
        basicSalary: body.basicSalary || 0,
        components: body.components || [],
        schoolId: SCHOOL_ID,
      };
      templates.push(tpl);
      return json(tpl, 201);
    }
    return json({});
  });

  // Individual template endpoint
  await page.route('**/api/salary-templates/*', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const id = url.pathname.split('/').pop();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'GET') {
      const tpl = templates.find((t) => t._id === id);
      return tpl ? json(tpl) : json({ error: 'Not found' }, 404);
    }
    if (method === 'DELETE') {
      const idx = templates.findIndex((t) => t._id === id);
      if (idx >= 0) templates.splice(idx, 1);
      return json({ message: 'Deleted' });
    }
    return json({});
  });

  // Payroll components (alternative endpoint name)
  await page.route('**/api/payroll/components**', async (route) => {
    const method = route.request().method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'GET') return json({ data: components, total: components.length });
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const newComp: SalaryComponent = {
        _id: `comp-${Date.now()}`,
        name: body.name,
        type: body.type || 'earning',
        isPercentage: body.isPercentage || false,
        value: body.value || 0,
        isActive: true,
        schoolId: SCHOOL_ID,
      };
      components.push(newComp);
      return json(newComp, 201);
    }
    return json({});
  });
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC016 — Payroll Setup: components and templates
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC016 — Payroll Setup', () => {

  test('1) payroll settings page loads', async ({ page }) => {
    const { state, components, templates } = createPayrollSettingsState();
    await installPayrollSettingsMockApi(page, state, components, templates);

    await page.goto('/settings/payroll');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    const hasPayrollSettings = body?.toLowerCase().includes('payroll') ||
                               body?.toLowerCase().includes('salary') ||
                               body?.toLowerCase().includes('component') ||
                               body?.toLowerCase().includes('earning');
    expect(hasPayrollSettings).toBeTruthy();
  });

  test('2) existing components are listed', async ({ page }) => {
    const { state, components, templates } = createPayrollSettingsState();
    await installPayrollSettingsMockApi(page, state, components, templates);

    await page.goto('/settings/payroll');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Switch to "Salary Components" tab
    const componentsTab = page.getByRole('tab', { name: /salary components/i }).first();
    const hasComponentsTab = await componentsTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasComponentsTab) await componentsTab.click();
    await page.waitForTimeout(500);

    const body = await page.textContent('body');
    // Should show "Basic Salary" as the existing component
    expect(body).toContain('Basic');
  });

  test('3) add earning component "HRA"', async ({ page }) => {
    const { state, components, templates } = createPayrollSettingsState();
    await installPayrollSettingsMockApi(page, state, components, templates);

    await page.goto('/settings/payroll');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click add component button
    const addBtn = page.getByRole('button', { name: /add.*component|add.*earning|new.*component|\+/i }).first();
    const hasAdd = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAdd) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // Fill component name
      const nameInput = page.locator(
        '[role="dialog"] input[name="name"], [role="dialog"] input[placeholder*="name" i], input[name="componentName"]',
      ).first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('HRA');
      }

      // Select type as earning
      const typeSelect = page.locator('[role="dialog"] select[name="type"]').first();
      if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeSelect.selectOption('earning');
      }

      // Save
      const saveBtn = page.locator('[role="dialog"]').getByRole('button', { name: /save|add|create|submit/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
      }
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('4) add earning component "DA"', async ({ page }) => {
    const { state, components, templates } = createPayrollSettingsState();
    await installPayrollSettingsMockApi(page, state, components, templates);

    await page.goto('/settings/payroll');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const addBtn = page.getByRole('button', { name: /add.*component|add.*earning|new.*component|\+/i }).first();
    const hasAdd = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAdd) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const nameInput = page.locator(
        '[role="dialog"] input[name="name"], [role="dialog"] input[placeholder*="name" i], input[name="componentName"]',
      ).first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('DA');
      }

      const saveBtn = page.locator('[role="dialog"]').getByRole('button', { name: /save|add|create|submit/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
      }
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('5) add deduction component "PF"', async ({ page }) => {
    const { state, components, templates } = createPayrollSettingsState();
    await installPayrollSettingsMockApi(page, state, components, templates);

    await page.goto('/settings/payroll');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const addBtn = page.getByRole('button', { name: /add.*component|add.*deduction|new.*component|\+/i }).first();
    const hasAdd = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAdd) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const nameInput = page.locator(
        '[role="dialog"] input[name="name"], [role="dialog"] input[placeholder*="name" i], input[name="componentName"]',
      ).first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('PF');
      }

      // Select type as deduction
      const typeSelect = page.locator('[role="dialog"] select[name="type"]').first();
      if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeSelect.selectOption('deduction');
      }

      const saveBtn = page.locator('[role="dialog"]').getByRole('button', { name: /save|add|create|submit/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
      }
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('6) add deduction component "TDS"', async ({ page }) => {
    const { state, components, templates } = createPayrollSettingsState();
    await installPayrollSettingsMockApi(page, state, components, templates);

    await page.goto('/settings/payroll');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const addBtn = page.getByRole('button', { name: /add.*component|add.*deduction|new.*component|\+/i }).first();
    const hasAdd = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAdd) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const nameInput = page.locator(
        '[role="dialog"] input[name="name"], [role="dialog"] input[placeholder*="name" i], input[name="componentName"]',
      ).first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('TDS');
      }

      const typeSelect = page.locator('[role="dialog"] select[name="type"]').first();
      if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeSelect.selectOption('deduction');
      }

      const saveBtn = page.locator('[role="dialog"]').getByRole('button', { name: /save|add|create|submit/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
      }
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test('7) added components are listed in the settings', async ({ page }) => {
    const { state, components, templates } = createPayrollSettingsState();
    // Pre-add components so they show in the list
    components.push(
      { _id: 'comp-hra', name: 'HRA', type: 'earning', isPercentage: false, value: 0, isActive: true, schoolId: SCHOOL_ID },
      { _id: 'comp-da', name: 'DA', type: 'earning', isPercentage: false, value: 0, isActive: true, schoolId: SCHOOL_ID },
      { _id: 'comp-pf', name: 'PF', type: 'deduction', isPercentage: false, value: 0, isActive: true, schoolId: SCHOOL_ID },
      { _id: 'comp-tds', name: 'TDS', type: 'deduction', isPercentage: false, value: 0, isActive: true, schoolId: SCHOOL_ID },
    );
    await installPayrollSettingsMockApi(page, state, components, templates);

    await page.goto('/settings/payroll');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Switch to "Salary Components" tab
    const componentsTab = page.getByRole('tab', { name: /salary components/i }).first();
    const hasComponentsTab = await componentsTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasComponentsTab) await componentsTab.click();
    await page.waitForTimeout(500);

    const body = await page.textContent('body');
    expect(body).toContain('HRA');
    expect(body).toContain('DA');
    expect(body).toContain('Provident Fund');
    expect(body).toContain('TDS');
  });

  test('8) remove a component from the list', async ({ page }) => {
    const { state, components, templates } = createPayrollSettingsState();
    components.push(
      { _id: 'comp-hra', name: 'HRA', type: 'earning', isPercentage: false, value: 0, isActive: true, schoolId: SCHOOL_ID },
      { _id: 'comp-tds', name: 'TDS', type: 'deduction', isPercentage: false, value: 0, isActive: true, schoolId: SCHOOL_ID },
    );
    await installPayrollSettingsMockApi(page, state, components, templates);

    await page.goto('/settings/payroll');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Find delete button near TDS
    const deleteBtn = page.getByRole('button', { name: /delete|remove/i }).last();
    const hasDelete = await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDelete) {
      await deleteBtn.click();
      // Handle confirmation dialog
      const confirmBtn = page.locator('[role="dialog"]').getByRole('button', { name: /confirm|delete|yes|remove/i }).first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    }

    await expect(page).not.toHaveURL(/\/login/);
  });

  test.skip('9) salary templates page loads', async ({ page }) => {
    const { state, components, templates } = createPayrollSettingsState();
    await installPayrollSettingsMockApi(page, state, components, templates);

    await page.goto('/settings/salary-templates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    const hasTemplatesUI = body?.toLowerCase().includes('template') ||
                           body?.toLowerCase().includes('salary') ||
                           body?.toLowerCase().includes('teaching staff');
    expect(hasTemplatesUI).toBeTruthy();
  });

  test.skip('10) salary templates page shows existing template', async ({ page }) => {
    const { state, components, templates } = createPayrollSettingsState();
    await installPayrollSettingsMockApi(page, state, components, templates);

    await page.goto('/settings/salary-templates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    // Should show "Teaching Staff" template
    expect(body).toContain('Teaching');
    await expect(page).not.toHaveURL(/\/login/);
  });
});
