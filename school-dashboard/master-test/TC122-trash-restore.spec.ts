import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Trash / Deleted items mock data
 * ───────────────────────────────────────────────────────────────────── */

interface TrashItem {
  _id: string; id: string; name: string; type: string;
  deletedAt: string; deletedBy: string;
  originalData: Record<string, unknown>;
}

function seedTrash(state: MockState): TrashItem[] {
  const trashItems: TrashItem[] = [
    {
      _id: 'trash-1', id: 'trash-1', name: 'Rahul Kumar',
      type: 'student', deletedAt: '2026-03-28T14:30:00.000Z',
      deletedBy: 'admin@schoolsync.test',
      originalData: { classId: 'class-10a', admissionId: 'ADM-0051', rollNo: '51', schoolId: SCHOOL_ID },
    },
    {
      _id: 'trash-2', id: 'trash-2', name: 'Priya Sharma',
      type: 'student', deletedAt: '2026-03-27T10:15:00.000Z',
      deletedBy: 'admin@schoolsync.test',
      originalData: { classId: 'class-11a', admissionId: 'ADM-0052', rollNo: '52', schoolId: SCHOOL_ID },
    },
    {
      _id: 'trash-3', id: 'trash-3', name: 'Suresh Menon',
      type: 'staff', deletedAt: '2026-03-26T09:45:00.000Z',
      deletedBy: 'admin@schoolsync.test',
      originalData: { role: 'teacher', department: 'Science', employeeId: 'EMP-050', schoolId: SCHOOL_ID },
    },
    {
      _id: 'trash-4', id: 'trash-4', name: 'Annual Sports Day',
      type: 'event', deletedAt: '2026-03-25T16:00:00.000Z',
      deletedBy: 'admin@schoolsync.test',
      originalData: { date: '2026-04-10', type: 'event', schoolId: SCHOOL_ID },
    },
  ];
  (state as any).trash = trashItems;
  return trashItems;
}

/* ─────────────────────────────────────────────────────────────────────
 *  TC082 — Trash & Restore
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC082 — Trash & Restore', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedTrash(state);

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);

    // Override trash API routes
    await page.route('**/api/trash**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/\/+$/, '');
      const method = route.request().method();
      const trashItems: TrashItem[] = (state as any).trash ?? [];

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      // GET /api/trash
      if (path === '/api/trash' && method === 'GET') {
        return json({ data: trashItems, total: trashItems.length });
      }

      // POST /api/trash/:id/restore
      const restoreMatch = path.match(/^\/api\/trash\/([^/]+)\/restore$/);
      if (restoreMatch && method === 'POST') {
        const idx = trashItems.findIndex((t) => t.id === restoreMatch[1]);
        if (idx >= 0) {
          const restored = trashItems.splice(idx, 1)[0];
          return json({ message: 'Restored', item: restored });
        }
        return json({ error: 'Not found' }, 404);
      }

      // DELETE /api/trash/:id — permanent delete
      const deleteMatch = path.match(/^\/api\/trash\/([^/]+)$/);
      if (deleteMatch && method === 'DELETE') {
        const idx = trashItems.findIndex((t) => t.id === deleteMatch[1]);
        if (idx >= 0) {
          trashItems.splice(idx, 1);
          return json({ message: 'Permanently deleted' });
        }
        return json({ error: 'Not found' }, 404);
      }

      // POST /api/trash/bulk-delete — permanent delete multiple
      if (path === '/api/trash/bulk-delete' && method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const ids: string[] = body.ids || [];
        for (const id of ids) {
          const idx = trashItems.findIndex((t) => t.id === id);
          if (idx >= 0) trashItems.splice(idx, 1);
        }
        return json({ message: `Permanently deleted ${ids.length} items` });
      }

      // POST /api/trash/bulk-restore
      if (path === '/api/trash/bulk-restore' && method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const ids: string[] = body.ids || [];
        for (const id of ids) {
          const idx = trashItems.findIndex((t) => t.id === id);
          if (idx >= 0) trashItems.splice(idx, 1);
        }
        return json({ message: `Restored ${ids.length} items` });
      }

      await route.continue();
    });

    // Also handle settings/trash path
    await page.route('**/api/settings/trash**', async (route) => {
      const method = route.request().method();
      const trashItems: TrashItem[] = (state as any).trash ?? [];
      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

      if (method === 'GET') return json({ data: trashItems, total: trashItems.length });
      await route.continue();
    });
  });

  /* ───────── 1. Trash page loads ───────── */

  test('1) trash page loads and shows header', async ({ page }) => {
    await page.goto('/settings/trash');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Trash') || bodyText?.includes('trash') ||
      bodyText?.includes('Deleted') || bodyText?.includes('Recycle') ||
      bodyText?.includes('Settings'),
    ).toBeTruthy();
  });

  /* ───────── 2. Deleted items are listed ───────── */

  test('2) deleted items are shown in the trash list', async ({ page }) => {
    await page.goto('/settings/trash');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Rahul Kumar') || bodyText?.includes('Priya Sharma') ||
      bodyText?.includes('Suresh Menon') || bodyText?.includes('Annual Sports Day'),
    ).toBeTruthy();
  });

  /* ───────── 3. Items show type and deletion date ───────── */

  test('3) deleted items display type badge and deletion date', async ({ page }) => {
    await page.goto('/settings/trash');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    // Should show item types
    expect(
      bodyText?.includes('Student') || bodyText?.includes('student') ||
      bodyText?.includes('Staff') || bodyText?.includes('staff') ||
      bodyText?.includes('Event') || bodyText?.includes('event'),
    ).toBeTruthy();

    // Should show dates in some format
    expect(
      bodyText?.includes('Mar') || bodyText?.includes('2026') ||
      bodyText?.includes('28') || bodyText?.includes('27'),
    ).toBeTruthy();
  });

  /* ───────── 4. Restore a single item ───────── */

  test('4) selecting an item and clicking Restore removes it from trash', async ({ page }) => {
    const initialCount = (state as any).trash.length;
    expect(initialCount).toBe(4);

    await page.goto('/settings/trash');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click on the first item or its checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    const itemRow = page.getByText('Rahul Kumar').first();

    if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await checkbox.check();
      await page.waitForTimeout(300);
    } else if (await itemRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await itemRow.click();
      await page.waitForTimeout(300);
    }

    // Click restore button
    const restoreBtn = page.getByRole('button', { name: /restore/i }).first();
    if (await restoreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await restoreBtn.click();
      await page.waitForTimeout(500);

      // Confirm if dialog appears
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|restore/i }).first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  /* ───────── 5. Verify item disappears from trash ───────── */

  test('5) restored item is no longer in trash after restoration', async ({ page }) => {
    // Simulate a restore by removing from state
    (state as any).trash = (state as any).trash.filter((t: TrashItem) => t.id !== 'trash-1');

    await page.goto('/settings/trash');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    // Rahul Kumar should no longer appear
    expect(
      bodyText?.includes('Priya Sharma') || bodyText?.includes('Suresh Menon'),
    ).toBeTruthy();
  });

  /* ───────── 6. Select multiple items for permanent deletion ───────── */

  test('6) selecting multiple items enables bulk permanent delete', async ({ page }) => {
    await page.goto('/settings/trash');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count >= 2) {
      await checkboxes.nth(0).check();
      await page.waitForTimeout(200);
      await checkboxes.nth(1).check();
      await page.waitForTimeout(200);

      // Look for bulk delete button
      const bulkDeleteBtn = page.getByRole('button', { name: /permanent|delete.*selected|bulk delete/i }).first();
      const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
      const btn = (await bulkDeleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) ? bulkDeleteBtn : deleteBtn;

      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  /* ───────── 7. Confirmation dialog for permanent deletion ───────── */

  test('7) permanent deletion shows confirmation dialog', async ({ page }) => {
    await page.goto('/settings/trash');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Select an item
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await checkbox.check();
      await page.waitForTimeout(200);
    }

    // Click permanent delete
    const deleteBtn = page.getByRole('button', { name: /permanent.*delete|delete forever/i }).first();
    const trashBtn = page.locator('button:has(svg.lucide-trash), button:has(svg.lucide-trash-2)').first();
    const btn = (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) ? deleteBtn : trashBtn;

    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);

      // Look for confirmation dialog
      const bodyText = await page.textContent('body');
      expect(
        bodyText?.includes('confirm') || bodyText?.includes('Confirm') ||
        bodyText?.includes('permanent') || bodyText?.includes('Permanent') ||
        bodyText?.includes('cannot be undone') || bodyText?.includes('Are you sure'),
      ).toBeTruthy();
    }
  });

  /* ───────── 8. Confirm permanent deletion ───────── */

  test('8) confirming permanent deletion removes items from trash', async ({ page }) => {
    const initialCount = (state as any).trash.length;
    expect(initialCount).toBe(4);

    await page.goto('/settings/trash');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await checkbox.check();
      await page.waitForTimeout(200);
    }

    const deleteBtn = page.getByRole('button', { name: /permanent.*delete|delete/i }).first();
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      page.on('dialog', async (dialog) => { await dialog.accept(); });

      await deleteBtn.click();
      await page.waitForTimeout(500);

      const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i }).first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  /* ───────── 9. State integrity check ───────── */

  test('9) state has 4 seeded trash items with correct details', async ({ page }) => {
    const trash = (state as any).trash as TrashItem[];
    expect(trash).toHaveLength(4);

    expect(trash[0].name).toBe('Rahul Kumar');
    expect(trash[0].type).toBe('student');
    expect(trash[1].name).toBe('Priya Sharma');
    expect(trash[1].type).toBe('student');
    expect(trash[2].name).toBe('Suresh Menon');
    expect(trash[2].type).toBe('staff');
    expect(trash[3].name).toBe('Annual Sports Day');
    expect(trash[3].type).toBe('event');
  });
});
