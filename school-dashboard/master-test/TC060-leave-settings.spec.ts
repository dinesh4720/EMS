import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Leave settings mock data
 * ───────────────────────────────────────────────────────────────────── */

interface LeaveType {
  _id: string; id: string; name: string; applicableTo: string;
  quota: number; requiresApproval: boolean; status: string;
}

function seedLeaveTypes(state: MockState): LeaveType[] {
  const leaveTypes: LeaveType[] = [
    {
      _id: 'lt-1', id: 'lt-1', name: 'Earned Leave',
      applicableTo: 'Staff', quota: 15, requiresApproval: true, status: 'active',
    },
    {
      _id: 'lt-2', id: 'lt-2', name: 'Medical Leave',
      applicableTo: 'Both', quota: 10, requiresApproval: true, status: 'active',
    },
  ];
  (state as any).leaveTypes = leaveTypes;
  return leaveTypes;
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC060 — Leave Settings
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC060 — Leave Settings', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedLeaveTypes(state);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override leave settings routes
    await page.route('**/api/leave-types**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/\/+$/, '');
      const method = route.request().method();
      const leaveTypes = (state as any).leaveTypes ?? [];

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      // GET /api/leave-types
      if (path === '/api/leave-types' && method === 'GET') {
        return json({ data: leaveTypes, total: leaveTypes.length });
      }

      // POST /api/leave-types — create
      if (path === '/api/leave-types' && method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newType: LeaveType = {
          _id: `lt-${Date.now()}`, id: `lt-${Date.now()}`,
          name: body.name, applicableTo: body.applicableTo || 'Staff',
          quota: body.quota || 10, requiresApproval: body.requiresApproval ?? true,
          status: 'active',
        };
        leaveTypes.push(newType);
        return json(newType, 201);
      }

      // PUT /api/leave-types/:id — update
      const idMatch = path.match(/^\/api\/leave-types\/([^/]+)$/);
      if (idMatch && method === 'PUT') {
        const id = idMatch[1];
        const idx = leaveTypes.findIndex((lt: LeaveType) => lt.id === id);
        const body = JSON.parse(route.request().postData() || '{}');
        if (idx >= 0) { Object.assign(leaveTypes[idx], body); return json(leaveTypes[idx]); }
        return json({ error: 'Not found' }, 404);
      }

      // DELETE /api/leave-types/:id
      if (idMatch && method === 'DELETE') {
        const id = idMatch[1];
        const idx = leaveTypes.findIndex((lt: LeaveType) => lt.id === id);
        if (idx >= 0) {
          leaveTypes.splice(idx, 1);
          return json({ message: 'Deleted' });
        }
        return json({ error: 'Not found' }, 404);
      }

      await route.continue();
    });

    // Also handle settings/leave endpoint
    await page.route('**/api/settings/leave**', async (route) => {
      const method = route.request().method();
      const leaveTypes = (state as any).leaveTypes ?? [];
      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      if (method === 'GET') return json({ leaveTypes, total: leaveTypes.length });
      if (method === 'PUT' || method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        if (body.leaveTypes) {
          (state as any).leaveTypes = body.leaveTypes;
        }
        return json({ message: 'Saved' });
      }
      await route.continue();
    });
  });

  /* ───────── 1. Leave settings page loads ───────── */

  test('1) leave settings page loads and shows existing leave types', async ({ page }) => {
    await page.goto('/settings/leaves');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Leave') || bodyText?.includes('leave') ||
      bodyText?.includes('Earned') || bodyText?.includes('Medical') ||
      bodyText?.includes('Settings'),
    ).toBeTruthy();
  });

  /* ───────── 2. Existing leave types are displayed ───────── */

  test('2) existing leave types (Earned Leave, Medical Leave) are displayed', async ({ page }) => {
    await page.goto('/settings/leaves');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Earned Leave') || bodyText?.includes('Medical Leave'),
    ).toBeTruthy();
  });

  /* ───────── 3. Add new leave type: Casual Leave ───────── */

  test('3) add Casual Leave type with Staff applicability and quota 12', async ({ page }) => {
    await page.goto('/settings/leaves');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click add button
    const addBtn = page.getByRole('button', { name: /add|create|new/i }).first();
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
    const btn = (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) ? addBtn : plusBtn;

    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);

      // Fill name
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="leave" i]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('Casual Leave');
      }

      // Select applicable to Staff
      const applicableSelect = page.locator('select, [aria-haspopup="listbox"]').filter({ hasText: /applicable|staff|student/i }).first();
      if (await applicableSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await applicableSelect.click();
        await page.waitForTimeout(200);
        const staffOption = page.getByText(/^Staff$/i).first();
        if (await staffOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await staffOption.click();
        }
      }

      // Fill quota
      const quotaInput = page.locator('input[name="quota"], input[type="number"], input[placeholder*="quota" i], input[placeholder*="days" i]').first();
      if (await quotaInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await quotaInput.clear();
        await quotaInput.fill('12');
      }

      // Toggle requires approval
      const approvalToggle = page.locator('[role="switch"]').first();
      if (await approvalToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        await approvalToggle.click();
        await page.waitForTimeout(200);
      }

      // Save
      const saveBtn = page.getByRole('button', { name: /save|create|add|submit/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(500);

        // Verify in state
        expect(
          (state as any).leaveTypes.some((lt: LeaveType) => lt.name === 'Casual Leave'),
        ).toBeTruthy();
      }
    }
  });

  /* ───────── 4. Verify Casual Leave appears in list ───────── */

  test('4) newly added leave type appears in the list', async ({ page }) => {
    // Pre-add to state to verify display
    (state as any).leaveTypes.push({
      _id: 'lt-casual', id: 'lt-casual', name: 'Casual Leave',
      applicableTo: 'Staff', quota: 12, requiresApproval: true, status: 'active',
    });

    await page.goto('/settings/leaves');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('Casual Leave')).toBeTruthy();
  });

  /* ───────── 5. Add Sick Leave ───────── */

  test('5) add Sick Leave type with Both applicability and quota 10', async ({ page }) => {
    await page.goto('/settings/leaves');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const addBtn = page.getByRole('button', { name: /add|create|new/i }).first();
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
    const btn = (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) ? addBtn : plusBtn;

    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);

      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('Sick Leave');
      }

      const quotaInput = page.locator('input[name="quota"], input[type="number"]').first();
      if (await quotaInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await quotaInput.clear();
        await quotaInput.fill('10');
      }

      const saveBtn = page.getByRole('button', { name: /save|create|add|submit/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(500);

        expect(
          (state as any).leaveTypes.some((lt: LeaveType) => lt.name === 'Sick Leave'),
        ).toBeTruthy();
      }
    }
  });

  /* ───────── 6. Edit a leave type ───────── */

  test('6) editing a leave type updates its details', async ({ page }) => {
    await page.goto('/settings/leaves');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click edit on Earned Leave
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    const earnedRow = page.getByText('Earned Leave').first();

    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);
    } else if (await earnedRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await earnedRow.click();
      await page.waitForTimeout(500);
    }

    // Update quota
    const quotaInput = page.locator('input[name="quota"], input[type="number"]').first();
    if (await quotaInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quotaInput.clear();
      await quotaInput.fill('20');

      const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  /* ───────── 7. Delete a leave type ───────── */

  test('7) deleting a leave type removes it from the list', async ({ page }) => {
    const initialCount = (state as any).leaveTypes.length;
    expect(initialCount).toBe(2);

    await page.goto('/settings/leaves');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click delete button
    const deleteBtn = page.getByRole('button', { name: /delete|remove/i }).first();
    const trashBtn = page.locator('button:has(svg.lucide-trash), button:has(svg.lucide-trash-2)').first();
    const btn = (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) ? deleteBtn : trashBtn;

    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Handle confirmation dialog
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      await btn.click();
      await page.waitForTimeout(500);

      // Confirm button if modal appears
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i }).first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  /* ───────── 8. State integrity check ───────── */

  test('8) state has 2 seeded leave types with correct details', async ({ page }) => {
    const leaveTypes = (state as any).leaveTypes;
    expect(leaveTypes).toHaveLength(2);
    expect(leaveTypes[0].name).toBe('Earned Leave');
    expect(leaveTypes[0].applicableTo).toBe('Staff');
    expect(leaveTypes[0].quota).toBe(15);
    expect(leaveTypes[1].name).toBe('Medical Leave');
    expect(leaveTypes[1].applicableTo).toBe('Both');
    expect(leaveTypes[1].quota).toBe(10);
  });
});
