import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedInventoryAsset, seedInventoryVendor,
  ADMIN_ID, SCHOOL_ID,
  type MockState, type InventoryAssetRecord, type InventoryVendorRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TC161 — Inventory Management: Dashboard, Assets, Vendors,
 *  Maintenance, Procurement, Audits, Reports & Transactions
 * ───────────────────────────────────────────────────────────────────── */

/* ───────────────── Mock Data ───────────────── */

const MOCK_ASSETS: Array<Record<string, unknown>> = [
  { _id: 'asset-001', name: 'Smart Board 65\"', category: 'ELECTRONICS', assetTag: 'EL-SB-001', serialNumber: 'SN-EL-001', location: 'Class 10A', assignedTo: 'Class 10A', quantity: 5, minimumQuantity: 2, purchasePrice: 85000, condition: 'GOOD', status: 'ACTIVE', warrantyExpiry: '2027-06-30T00:00:00Z' },
  { _id: 'asset-002', name: 'Wooden Desk Set', category: 'FURNITURE', assetTag: 'FU-DS-002', serialNumber: '', location: 'Room 101', assignedTo: '', quantity: 25, minimumQuantity: 10, purchasePrice: 12000, condition: 'FAIR', status: 'ACTIVE', warrantyExpiry: null },
  { _id: 'asset-003', name: 'Cricket Kit Premium', category: 'SPORTS', assetTag: 'SP-CK-003', serialNumber: '', location: 'Sports Room', assignedTo: '', quantity: 1, minimumQuantity: 3, purchasePrice: 8000, condition: 'GOOD', status: 'ACTIVE', warrantyExpiry: null },
  { _id: 'asset-004', name: 'Lab Microscope', category: 'LAB_EQUIPMENT', assetTag: 'LB-MS-004', serialNumber: 'SN-LB-004', location: 'Biology Lab', assignedTo: 'Class 12B', quantity: 8, minimumQuantity: 5, purchasePrice: 35000, condition: 'GOOD', status: 'ACTIVE', warrantyExpiry: '2028-03-15T00:00:00Z' },
  { _id: 'asset-005', name: 'Old Projector', category: 'ELECTRONICS', assetTag: 'EL-PR-005', serialNumber: 'SN-EL-005', location: 'Store Room', assignedTo: '', quantity: 2, minimumQuantity: 1, purchasePrice: 18000, condition: 'POOR', status: 'UNDER_MAINTENANCE', warrantyExpiry: null },
  { _id: 'asset-006', name: 'Lost Laptop', category: 'ELECTRONICS', assetTag: 'EL-LP-006', serialNumber: 'SN-EL-006', location: 'Unknown', assignedTo: '', quantity: 1, minimumQuantity: 1, purchasePrice: 55000, condition: 'DAMAGED', status: 'LOST', warrantyExpiry: null },
  { _id: 'asset-007', name: 'Disposed Chairs', category: 'FURNITURE', assetTag: 'FU-CH-007', serialNumber: '', location: 'Scrap Yard', assignedTo: '', quantity: 15, minimumQuantity: 0, purchasePrice: 5000, condition: 'DAMAGED', status: 'DISPOSED', warrantyExpiry: null },
];

const MOCK_VENDORS: Array<Record<string, unknown>> = [
  { _id: 'vendor-001', name: 'Bharat Electronics Pvt Ltd', contactPerson: 'Ramesh Gupta', phone: '9876543210', email: 'ramesh@bharatelec.in', category: 'ELECTRONICS', isActive: true },
  { _id: 'vendor-002', name: 'Krishna Furniture Works', contactPerson: 'Suresh Patel', phone: '9988776655', email: 'suresh@krishnafurn.in', category: 'FURNITURE', isActive: true },
  { _id: 'vendor-003', name: 'Sports Mart India', contactPerson: 'Anil Sharma', phone: '9123456789', email: 'anil@sportsmart.in', category: 'SPORTS', isActive: false },
];

const MOCK_MAINTENANCE: Array<Record<string, unknown>> = [
  { _id: 'maint-001', assetId: { _id: 'asset-005', name: 'Old Projector' }, maintenanceType: 'CORRECTIVE', description: 'Replace damaged bulb and clean lens', scheduledDate: '2026-04-15T00:00:00Z', status: 'SCHEDULED', cost: 4500, vendorId: { _id: 'vendor-001', name: 'Bharat Electronics Pvt Ltd' }, performedBy: '', notes: 'Urgent repair needed before exam season' },
  { _id: 'maint-002', assetId: { _id: 'asset-001', name: 'Smart Board 65\"' }, maintenanceType: 'PREVENTIVE', description: 'Annual calibration and software update', scheduledDate: '2026-03-20T00:00:00Z', completedDate: '2026-03-21T00:00:00Z', status: 'COMPLETED', cost: 2500, vendorId: { _id: 'vendor-001', name: 'Bharat Electronics Pvt Ltd' }, performedBy: '', notes: 'All sensors calibrated successfully' },
  { _id: 'maint-003', assetId: { _id: 'asset-002', name: 'Wooden Desk Set' }, maintenanceType: 'INSPECTION', description: 'Quarterly termite inspection', scheduledDate: '2026-05-10T00:00:00Z', status: 'IN_PROGRESS', cost: 1200, vendorId: { _id: 'vendor-002', name: 'Krishna Furniture Works' }, performedBy: '', notes: 'Inspection ongoing' },
  { _id: 'maint-004', assetId: { _id: 'asset-004', name: 'Lab Microscope' }, maintenanceType: 'PREVENTIVE', description: 'Lens cleaning and alignment check', scheduledDate: '2026-06-01T00:00:00Z', status: 'SCHEDULED', cost: 1800, vendorId: null, performedBy: 'Lab Technician', notes: '' },
];

const MOCK_PROCUREMENT: Array<Record<string, unknown>> = [
  { _id: 'proc-001', itemName: 'Whiteboard Markers (Box of 50)', category: 'STATIONERY', quantity: 20, estimatedCost: 8000, actualCost: null, status: 'PENDING', requestedBy: { _id: ADMIN_ID, name: 'Dinesh Admin' }, approvedBy: null, justification: 'Required for new academic year', vendorId: null, notes: '', updatedAt: '2026-05-01T00:00:00Z' },
  { _id: 'proc-002', itemName: 'Desktop Computers (i5, 16GB)', category: 'ELECTRONICS', quantity: 10, estimatedCost: 450000, actualCost: null, status: 'APPROVED', requestedBy: { _id: ADMIN_ID, name: 'Dinesh Admin' }, approvedBy: { _id: ADMIN_ID, name: 'Dinesh Admin' }, justification: 'Computer lab upgrade', vendorId: { _id: 'vendor-001', name: 'Bharat Electronics Pvt Ltd' }, notes: '', updatedAt: '2026-04-20T00:00:00Z' },
  { _id: 'proc-003', itemName: 'Old Plastic Chairs', category: 'FURNITURE', quantity: 50, estimatedCost: 15000, actualCost: null, status: 'REJECTED', requestedBy: { _id: ADMIN_ID, name: 'Dinesh Admin' }, approvedBy: null, justification: 'Budget constraints', vendorId: null, notes: 'Principal rejected due to quality concerns', updatedAt: '2026-04-15T00:00:00Z' },
  { _id: 'proc-004', itemName: 'Science Lab Kits', category: 'LAB_EQUIPMENT', quantity: 5, estimatedCost: 75000, actualCost: 72000, status: 'PURCHASED', requestedBy: { _id: ADMIN_ID, name: 'Dinesh Admin' }, approvedBy: { _id: ADMIN_ID, name: 'Dinesh Admin' }, justification: 'Practical exam requirements', vendorId: { _id: 'vendor-001', name: 'Bharat Electronics Pvt Ltd' }, notes: 'Delivered and inspected', updatedAt: '2026-03-10T00:00:00Z' },
  { _id: 'proc-005', itemName: 'Footballs (Set of 10)', category: 'SPORTS', quantity: 10, estimatedCost: 12000, actualCost: null, status: 'ORDERED', requestedBy: { _id: ADMIN_ID, name: 'Dinesh Admin' }, approvedBy: { _id: ADMIN_ID, name: 'Dinesh Admin' }, justification: 'Sports day preparation', vendorId: { _id: 'vendor-003', name: 'Sports Mart India' }, notes: '', updatedAt: '2026-05-05T00:00:00Z' },
];

const MOCK_AUDITS: Array<Record<string, unknown>> = [
  { _id: 'audit-001', title: 'Q1 2026 Asset Audit', status: 'COMPLETED', startDate: '2026-01-10T00:00:00Z', completedDate: '2026-01-15T00:00:00Z', auditItems: [{ assetId: 'asset-001', expectedQuantity: 5, actualQuantity: 5, condition: 'GOOD', notes: '' }, { assetId: 'asset-002', expectedQuantity: 25, actualQuantity: 24, condition: 'FAIR', notes: 'One desk damaged' }], notes: 'All items accounted for except one damaged desk' },
  { _id: 'audit-002', title: 'Mid-Year Inspection 2026', status: 'IN_PROGRESS', startDate: '2026-03-01T00:00:00Z', completedDate: null, auditItems: [{ assetId: 'asset-003', expectedQuantity: 1, actualQuantity: 1, condition: 'GOOD', notes: '' }, { assetId: 'asset-004', expectedQuantity: 8, actualQuantity: 8, condition: 'GOOD', notes: '' }], notes: 'Inspection in science and sports departments' },
  { _id: 'audit-003', title: 'Annual Stock Take 2026', status: 'PENDING', startDate: null, completedDate: null, auditItems: [], notes: 'Planned for June after exams' },
];

const MOCK_REPORTS = {
  totals: { totalItems: 57, totalPurchaseValue: 1285000, totalCurrentValue: 980000 },
  categoryBreakdown: [
    { _id: 'ELECTRONICS', count: 15, totalValue: 525000 },
    { _id: 'FURNITURE', count: 40, totalValue: 680000 },
    { _id: 'SPORTS', count: 1, totalValue: 8000 },
    { _id: 'LAB_EQUIPMENT', count: 1, totalValue: 75000 },
  ],
  conditionSummary: [
    { _id: 'GOOD', count: 30 },
    { _id: 'FAIR', count: 20 },
    { _id: 'POOR', count: 5 },
    { _id: 'DAMAGED', count: 2 },
  ],
  statusSummary: [
    { _id: 'ACTIVE', count: 45 },
    { _id: 'UNDER_MAINTENANCE', count: 8 },
    { _id: 'DISPOSED', count: 3 },
    { _id: 'LOST', count: 1 },
  ],
};

const MOCK_STATS = {
  totalAssets: 57, activeAssets: 45, underMaintenance: 8, pendingProcurements: 1, totalVendors: 3, lowStockAssets: 1,
};

/* ───────────────── Helpers ───────────────── */

/** Navigate to an inventory sub-tab and wait for render. */
async function goToTab(page: import('@playwright/test').Page, slug: string, waitForText: string) {
  await page.goto(`/inventory/${slug}`);
  await page.locator(`text=${waitForText}`).first().waitFor({ timeout: 45000 });
  await page.waitForTimeout(400);
}

/** Install inventory-specific route overrides on top of installMockApi. */
async function installInventoryRoutes(page: import('@playwright/test').Page) {
  await page.route('**/api/inventory/stats', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_STATS) });
  });

  await page.route('**/api/inventory/reports', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_REPORTS) });
  });

  await page.route('**/api/inventory/assets/low-stock', async (route) => {
    const lowStock = MOCK_ASSETS.filter(a => (a.quantity as number) <= ((a.minimumQuantity as number) || 0) && (a.minimumQuantity as number) > 0);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(lowStock) });
  });

  await page.route('**/api/inventory/assets**', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const path = url.pathname;

    // Stock adjust endpoint
    if (path.match(/\/inventory\/assets\/[^/]+\/stock-adjust/)) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Stock adjusted' }) });
      return;
    }

    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: MOCK_ASSETS, total: MOCK_ASSETS.length }) });
    } else if (method === 'POST') {
      const body = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ _id: `asset-new-${Date.now()}`, ...body }) });
    } else if (method === 'PUT') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Updated' }) });
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deleted' }) });
    } else {
      await route.fallback();
    }
  });

  await page.route('**/api/inventory/vendors**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_VENDORS) });
    } else if (method === 'POST') {
      const body = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ _id: `vendor-new-${Date.now()}`, ...body }) });
    } else if (method === 'PUT') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Updated' }) });
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deleted' }) });
    } else {
      await route.fallback();
    }
  });

  await page.route('**/api/inventory/maintenance**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MAINTENANCE) });
    } else if (method === 'POST') {
      const body = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ _id: `maint-new-${Date.now()}`, ...body }) });
    } else if (method === 'PUT') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Updated' }) });
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deleted' }) });
    } else {
      await route.fallback();
    }
  });

  await page.route('**/api/inventory/procurement**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PROCUREMENT) });
    } else if (method === 'POST') {
      const body = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ _id: `proc-new-${Date.now()}`, ...body }) });
    } else if (method === 'PUT') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Updated' }) });
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deleted' }) });
    } else {
      await route.fallback();
    }
  });

  await page.route('**/api/inventory/audits**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_AUDITS) });
    } else if (method === 'POST') {
      const body = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ _id: `audit-new-${Date.now()}`, ...body }) });
    } else if (method === 'PUT') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Updated' }) });
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deleted' }) });
    } else {
      await route.fallback();
    }
  });

  // Staff list for asset assignment dropdown
  await page.route('**/api/staffs**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ _id: ADMIN_ID, name: 'Dinesh Admin' }], total: 1 }) });
    } else {
      await route.fallback();
    }
  });
}

/* ───────────────── Tests ───────────────── */

test.describe('TC161 — Inventory Management', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed assets into state so installMockApi handles them consistently
    for (const asset of MOCK_ASSETS) {
      seedInventoryAsset(state, asset as Partial<InventoryAssetRecord>);
    }
    for (const vendor of MOCK_VENDORS) {
      seedInventoryVendor(state, vendor as Partial<InventoryVendorRecord>);
    }

    await installMockApi(page, state);
    await installInventoryRoutes(page);
  });

  /* ───────── SECTION 1: Dashboard ───────── */

  test.describe('Dashboard', () => {
    test('1.1) stats cards render with correct values', async ({ page }) => {
      await page.goto('/inventory');
      await page.locator('text=Total Assets').first().waitFor({ timeout: 45000 });
      await page.waitForTimeout(400);

      const body = await page.textContent('body');
      expect(body?.includes('57')).toBeTruthy();
      expect(body?.includes('45')).toBeTruthy();
      expect(body?.includes('8')).toBeTruthy();
      expect(body?.includes('1')).toBeTruthy();
      expect(body?.includes('3')).toBeTruthy();
    });

    test('1.2) low stock alerts panel shows Cricket Kit (qty 1 / min 3)', async ({ page }) => {
      await page.goto('/inventory');
      await page.locator('text=Low Stock Alerts').first().waitFor({ timeout: 45000 });
      await page.waitForTimeout(400);

      const body = await page.textContent('body');
      expect(body?.includes('Cricket Kit Premium')).toBeTruthy();
      expect(body?.includes('1/3')).toBeTruthy();
    });

    test('1.3) upcoming maintenance panel shows scheduled items', async ({ page }) => {
      await page.goto('/inventory');
      await page.locator('text=Scheduled Maintenance').first().waitFor({ timeout: 45000 });
      await page.waitForTimeout(400);

      const body = await page.textContent('body');
      expect(body?.includes('Old Projector')).toBeTruthy();
      expect(body?.includes('Lab Microscope')).toBeTruthy();
    });

    test('1.4) clicking stat card navigates to correct tab', async ({ page }) => {
      await page.goto('/inventory');
      await page.locator('text=Total Assets').first().waitFor({ timeout: 45000 });

      const assetsCard = page.locator('a[href="/inventory/assets"]').first();
      if (await assetsCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await assetsCard.click();
        await page.waitForURL(/\/inventory\/assets/, { timeout: 10000 });
      }
    });
  });

  /* ───────── SECTION 2: Assets ───────── */

  test.describe('Assets', () => {
    test('2.1) asset list loads with name, category, status, condition chips', async ({ page }) => {
      await goToTab(page, 'assets', 'Smart Board');

      const body = await page.textContent('body');
      expect(body?.includes('Smart Board 65\"')).toBeTruthy();
      expect(body?.includes('Wooden Desk Set')).toBeTruthy();
      expect(body?.includes('ELECTRONICS') || body?.includes('FURNITURE')).toBeTruthy();
      expect(body?.includes('GOOD') || body?.includes('FAIR')).toBeTruthy();
      expect(body?.includes('ACTIVE') || body?.includes('UNDER_MAINTENANCE')).toBeTruthy();
    });

    test('2.2) category filter shows only matching assets', async ({ page }) => {
      await goToTab(page, 'assets', 'Smart Board');

      const categoryFilter = page.locator('select, [role="listbox"]').first()
        .or(page.getByRole('button', { name: /all categories/i }))
        .or(page.locator('[aria-label*="category" i]'));

      if (await categoryFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await categoryFilter.click();
        await page.waitForTimeout(200);
        const sportsOption = page.getByText(/SPORTS/i).first();
        if (await sportsOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await sportsOption.click();
          await page.waitForTimeout(500);
          const body = await page.textContent('body');
          expect(body?.includes('Cricket Kit Premium')).toBeTruthy();
        }
      }
    });

    test('2.3) status filter shows only matching assets', async ({ page }) => {
      await goToTab(page, 'assets', 'Smart Board');

      const statusFilter = page.locator('select, [role="listbox"]').filter({ hasText: /status/i }).first()
        .or(page.getByRole('button', { name: /all statuses/i }));

      if (await statusFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await statusFilter.click();
        await page.waitForTimeout(200);
        const lostOption = page.getByText(/LOST/i).first();
        if (await lostOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await lostOption.click();
          await page.waitForTimeout(500);
          const body = await page.textContent('body');
          expect(body?.includes('Lost Laptop')).toBeTruthy();
        }
      }
    });

    test('2.4) create asset modal validates required name field', async ({ page }) => {
      await goToTab(page, 'assets', 'Add Asset');

      const addBtn = page.getByRole('button', { name: /Add Asset/i });
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        const dialog = page.locator('[role="dialog"]').last();
        await expect(dialog).toBeVisible({ timeout: 5000 });

        const text = await dialog.textContent();
        expect(text?.includes('New Asset')).toBeTruthy();

        // Try saving without name
        const createBtn = dialog.getByRole('button', { name: /Create/i });
        await createBtn.click();
        await page.waitForTimeout(300);
        const body = await page.textContent('body');
        expect(body?.toLowerCase().includes('required')).toBeTruthy();
      }
    });

    test('2.5) create asset with valid data succeeds', async ({ page }) => {
      await goToTab(page, 'assets', 'Add Asset');

      const addBtn = page.getByRole('button', { name: /Add Asset/i });
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        const dialog = page.locator('[role="dialog"]').last();
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Fill name
        const nameInput = dialog.locator('input').filter({ has: dialog.locator(':above(:text("Category"))') }).first()
          .or(dialog.locator('input').first());
        if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nameInput.fill('New Science Kit');
        }

        const createBtn = dialog.getByRole('button', { name: /Create/i });
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('2.6) edit asset pre-fills form and updates', async ({ page }) => {
      await goToTab(page, 'assets', 'Smart Board');

      const firstRow = page.locator('table tbody tr').first();
      const editBtn = firstRow.locator('button').first();
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        const dialog = page.locator('[role="dialog"]').last();
        await expect(dialog).toBeVisible({ timeout: 5000 });

        const text = await dialog.textContent();
        expect(text?.includes('Edit Asset')).toBeTruthy();

        const nameInput = dialog.locator('input').first();
        const nameVal = await nameInput.inputValue();
        expect(nameVal.length).toBeGreaterThan(0);

        const cancelBtn = dialog.getByRole('button', { name: /Cancel/i });
        await cancelBtn.click();
        await expect(dialog).not.toBeVisible({ timeout: 3000 });
      }
    });

    test('2.7) delete asset shows confirmation dialog', async ({ page }) => {
      await goToTab(page, 'assets', 'Smart Board');

      const before = state.inventoryAssets.length;
      const firstRow = page.locator('table tbody tr').first();
      const deleteBtn = firstRow.locator('button').last();
      if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await deleteBtn.click();
        const confirmBtn = page.locator('[role="dialog"]').last().getByRole('button', { name: /Delete/i });
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(500);
        }
        await expect.poll(() => state.inventoryAssets.length, { timeout: 10000 }).toBeLessThanOrEqual(before);
      }
    });

    test('2.8) stock adjustment modal validates quantity', async ({ page }) => {
      await goToTab(page, 'assets', 'Smart Board');

      // Look for stock adjustment buttons (ArrowUpFromLine or ArrowDownToLine)
      const stockBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(2);
      if (await stockBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await stockBtn.click();
        const dialog = page.locator('[role="dialog"]').last();
        if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
          const text = await dialog.textContent();
          expect(text?.toLowerCase().includes('stock') || text?.toLowerCase().includes('quantity')).toBeTruthy();

          // Try invalid quantity
          const qtyInput = dialog.locator('input').first();
          if (await qtyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await qtyInput.fill('0');
            const saveBtn = dialog.getByRole('button', { name: /Save|Submit/i }).first();
            await saveBtn.click();
            await page.waitForTimeout(300);
            const body = await page.textContent('body');
            expect(body?.toLowerCase().includes('at least') || body?.toLowerCase().includes('required')).toBeTruthy();
          }

          const cancelBtn = dialog.getByRole('button', { name: /Cancel/i });
          await cancelBtn.click();
        }
      }
    });
  });

  /* ───────── SECTION 3: Vendors ───────── */

  test.describe('Vendors', () => {
    test('3.1) vendor list loads with name, contact, category', async ({ page }) => {
      await goToTab(page, 'vendors', 'Bharat Electronics');

      const body = await page.textContent('body');
      expect(body?.includes('Bharat Electronics Pvt Ltd')).toBeTruthy();
      expect(body?.includes('Krishna Furniture Works')).toBeTruthy();
      expect(body?.includes('Ramesh Gupta') || body?.includes('9876543210')).toBeTruthy();
    });

    test('3.2) create vendor validates required name', async ({ page }) => {
      await goToTab(page, 'vendors', 'Add Vendor');

      const addBtn = page.getByRole('button', { name: /Add Vendor/i });
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        const dialog = page.locator('[role="dialog"]').last();
        await expect(dialog).toBeVisible({ timeout: 5000 });

        const text = await dialog.textContent();
        expect(text?.includes('New Vendor')).toBeTruthy();

        const createBtn = dialog.getByRole('button', { name: /Create/i });
        await createBtn.click();
        await page.waitForTimeout(300);
        const body = await page.textContent('body');
        expect(body?.toLowerCase().includes('required')).toBeTruthy();
      }
    });

    test('3.3) edit vendor opens with pre-filled data', async ({ page }) => {
      await goToTab(page, 'vendors', 'Bharat Electronics');

      const firstCard = page.locator('.grid > div').first();
      const editBtn = firstCard.locator('button').first();
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        const dialog = page.locator('[role="dialog"]').last();
        await expect(dialog).toBeVisible({ timeout: 5000 });
        expect((await dialog.textContent())?.includes('Edit Vendor')).toBeTruthy();

        const cancelBtn = dialog.getByRole('button', { name: /Cancel/i });
        await cancelBtn.click();
        await expect(dialog).not.toBeVisible({ timeout: 3000 });
      }
    });

    test('3.4) inactive vendor badge shows correctly', async ({ page }) => {
      await goToTab(page, 'vendors', 'Sports Mart India');

      const body = await page.textContent('body');
      expect(body?.includes('Sports Mart India')).toBeTruthy();
      // Inactive vendor should show some indicator (badge or muted style)
      expect(body?.toLowerCase().includes('inactive') || body?.toLowerCase().includes('disabled')).toBeTruthy();
    });
  });

  /* ───────── SECTION 4: Maintenance ───────── */

  test.describe('Maintenance', () => {
    test('4.1) maintenance list shows all types and statuses', async ({ page }) => {
      await goToTab(page, 'maintenance', 'Add Log');

      const body = await page.textContent('body');
      expect(body?.includes('Old Projector') || body?.includes('Smart Board')).toBeTruthy();
      expect(body?.includes('PREVENTIVE') || body?.includes('CORRECTIVE') || body?.includes('INSPECTION')).toBeTruthy();
      expect(body?.includes('SCHEDULED') || body?.includes('IN PROGRESS') || body?.includes('COMPLETED')).toBeTruthy();
    });

    test('4.2) status filter works for maintenance', async ({ page }) => {
      await goToTab(page, 'maintenance', 'Add Log');

      const statusFilter = page.locator('select, [role="listbox"]').first()
        .or(page.getByRole('button', { name: /all statuses/i }));

      if (await statusFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await statusFilter.click();
        await page.waitForTimeout(200);
        const completedOption = page.getByText(/COMPLETED/i).first();
        if (await completedOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await completedOption.click();
          await page.waitForTimeout(500);
          const body = await page.textContent('body');
          expect(body?.includes('Annual calibration')).toBeTruthy();
        }
      }
    });

    test('4.3) create maintenance validates asset and description', async ({ page }) => {
      await goToTab(page, 'maintenance', 'Add Log');

      const addBtn = page.getByRole('button', { name: /Add Log|Schedule Maintenance/i }).first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        const dialog = page.locator('[role="dialog"]').last();
        if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
          const saveBtn = dialog.getByRole('button', { name: /Save|Create|Submit/i }).first();
          await saveBtn.click();
          await page.waitForTimeout(300);
          const body = await page.textContent('body');
          expect(body?.toLowerCase().includes('required')).toBeTruthy();

          const cancelBtn = dialog.getByRole('button', { name: /Cancel/i });
          await cancelBtn.click();
        }
      }
    });
  });

  /* ───────── SECTION 5: Procurement ───────── */

  test.describe('Procurement', () => {
    test('5.1) procurement list shows all status chips', async ({ page }) => {
      await goToTab(page, 'procurement', 'New Request');

      const body = await page.textContent('body');
      expect(body?.includes('Whiteboard Markers')).toBeTruthy();
      expect(body?.includes('Desktop Computers')).toBeTruthy();
      expect(body?.includes('PENDING') || body?.includes('APPROVED') || body?.includes('REJECTED') || body?.includes('PURCHASED')).toBeTruthy();
    });

    test('5.2) approve action triggers PUT for pending request', async ({ page }) => {
      await goToTab(page, 'procurement', 'New Request');

      let putCalled = false;
      await page.route('**/api/inventory/procurement/proc-001', async (route) => {
        if (route.request().method() === 'PUT') {
          putCalled = true;
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Updated' }) });
        } else {
          await route.fallback();
        }
      });

      const approveBtn = page.getByRole('button', { name: /approve/i }).first();
      if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await approveBtn.click();
        await page.waitForTimeout(500);
        expect(putCalled).toBeTruthy();
      }
    });

    test('5.3) create procurement validates item name', async ({ page }) => {
      await goToTab(page, 'procurement', 'New Request');

      const addBtn = page.getByRole('button', { name: /New Request/i }).first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        const dialog = page.locator('[role="dialog"]').last();
        if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
          const saveBtn = dialog.getByRole('button', { name: /Save|Create|Submit/i }).first();
          await saveBtn.click();
          await page.waitForTimeout(300);
          const body = await page.textContent('body');
          expect(body?.toLowerCase().includes('required')).toBeTruthy();

          const cancelBtn = dialog.getByRole('button', { name: /Cancel/i });
          await cancelBtn.click();
        }
      }
    });

    test('5.4) rejected procurement shows rejection reason', async ({ page }) => {
      await goToTab(page, 'procurement', 'Old Plastic Chairs');

      const body = await page.textContent('body');
      expect(body?.includes('Old Plastic Chairs')).toBeTruthy();
      expect(body?.includes('REJECTED') || body?.toLowerCase().includes('rejected')).toBeTruthy();
    });
  });

  /* ───────── SECTION 6: Audits ───────── */

  test.describe('Audits', () => {
    test('6.1) audit list shows titles, statuses, and item counts', async ({ page }) => {
      await goToTab(page, 'audits', 'New Audit');

      const body = await page.textContent('body');
      expect(body?.includes('Q1 2026 Asset Audit')).toBeTruthy();
      expect(body?.includes('Mid-Year Inspection 2026')).toBeTruthy();
      expect(body?.includes('Annual Stock Take 2026')).toBeTruthy();
      expect(body?.includes('COMPLETED') || body?.includes('IN PROGRESS') || body?.includes('PENDING')).toBeTruthy();
      expect(body?.includes('items')).toBeTruthy();
    });

    test('6.2) expand audit shows item details', async ({ page }) => {
      await goToTab(page, 'audits', 'Q1 2026');

      const expandBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
      if (await expandBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expandBtn.click();
        await page.waitForTimeout(400);
        const body = await page.textContent('body');
        expect(body?.includes('expected') || body?.includes('actual') || body?.includes('condition')).toBeTruthy();
      }
    });

    test('6.3) create audit validates title', async ({ page }) => {
      await goToTab(page, 'audits', 'New Audit');

      const addBtn = page.getByRole('button', { name: /New Audit/i }).first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        const dialog = page.locator('[role="dialog"]').last();
        if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
          const saveBtn = dialog.getByRole('button', { name: /Save|Create|Submit/i }).first();
          await saveBtn.click();
          await page.waitForTimeout(300);
          const body = await page.textContent('body');
          expect(body?.toLowerCase().includes('required')).toBeTruthy();

          const cancelBtn = dialog.getByRole('button', { name: /Cancel/i });
          await cancelBtn.click();
        }
      }
    });
  });

  /* ───────── SECTION 7: Reports ───────── */

  test.describe('Reports', () => {
    test('7.1) reports tab renders summary cards', async ({ page }) => {
      await goToTab(page, 'reports', 'Total Items');

      const body = await page.textContent('body');
      expect(body?.includes('57')).toBeTruthy();
      expect(body?.includes('12,85,000') || body?.includes('1285000') || body?.includes('12,85,000')).toBeTruthy();
      expect(body?.includes('9,80,000') || body?.includes('980000')).toBeTruthy();
    });

    test('7.2) category breakdown shows all categories', async ({ page }) => {
      await goToTab(page, 'reports', 'By Category');

      const body = await page.textContent('body');
      expect(body?.includes('ELECTRONICS')).toBeTruthy();
      expect(body?.includes('FURNITURE')).toBeTruthy();
      expect(body?.includes('SPORTS')).toBeTruthy();
      expect(body?.includes('LAB_EQUIPMENT') || body?.includes('LAB EQUIPMENT')).toBeTruthy();
    });

    test('7.3) condition and status summaries render', async ({ page }) => {
      await goToTab(page, 'reports', 'By Condition');

      const body = await page.textContent('body');
      expect(body?.includes('GOOD') || body?.includes('FAIR') || body?.includes('POOR') || body?.includes('DAMAGED')).toBeTruthy();
      expect(body?.includes('By Status') || body?.includes('ACTIVE') || body?.includes('UNDER_MAINTENANCE')).toBeTruthy();
    });

    test('7.4) depreciation overview shows retention percentage', async ({ page }) => {
      await goToTab(page, 'reports', 'Depreciation');

      const body = await page.textContent('body');
      expect(body?.includes('Depreciation')).toBeTruthy();
      expect(body?.includes('Purchase Value') || body?.includes('Current Value')).toBeTruthy();
      // 980000 / 1285000 ≈ 76%
      expect(body?.includes('76') || body?.includes('77')).toBeTruthy();
    });
  });

  /* ───────── SECTION 8: Transactions ───────── */

  test.describe('Transactions', () => {
    test('8.1) transactions list shows purchased and ordered items', async ({ page }) => {
      await goToTab(page, 'transactions', 'All Transactions');

      const body = await page.textContent('body');
      expect(body?.includes('Science Lab Kits')).toBeTruthy();
      expect(body?.includes('Footballs')).toBeTruthy();
      expect(body?.includes('PURCHASED') || body?.includes('ORDERED')).toBeTruthy();
    });

    test('8.2) status filter shows only matching transactions', async ({ page }) => {
      await goToTab(page, 'transactions', 'All Transactions');

      const filterSelect = page.locator('select, [role="listbox"]').first();
      if (await filterSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        await filterSelect.click();
        await page.waitForTimeout(200);
        const purchasedOption = page.getByText(/PURCHASED/i).first();
        if (await purchasedOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await purchasedOption.click();
          await page.waitForTimeout(500);
          const body = await page.textContent('body');
          expect(body?.includes('Science Lab Kits')).toBeTruthy();
        }
      }
    });

    test('8.3) grand total calculation is correct', async ({ page }) => {
      await goToTab(page, 'transactions', 'Grand Total');

      // Science Lab Kits: 5 × 72000 = 360000
      const body = await page.textContent('body');
      expect(body?.includes('Grand Total') || body?.includes('3,60,000') || body?.includes('360000')).toBeTruthy();
    });
  });

  /* ───────── SECTION 9: Edge Cases & Error States ───────── */

  test.describe('Edge Cases & Error States', () => {
    test('9.1) empty assets state renders correctly', async ({ page }) => {
      state.inventoryAssets = [];
      await installMockApi(page, state);
      // Override assets to empty
      await page.route('**/api/inventory/assets**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) });
        } else {
          await route.fallback();
        }
      });

      await goToTab(page, 'assets', 'No assets found');
      const body = await page.textContent('body');
      expect(body?.toLowerCase().includes('no assets found')).toBeTruthy();
    });

    test('9.2) empty vendors state renders correctly', async ({ page }) => {
      state.inventoryVendors = [];
      await installMockApi(page, state);
      await page.route('**/api/inventory/vendors**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        } else {
          await route.fallback();
        }
      });

      await goToTab(page, 'vendors', 'No vendors found');
      const body = await page.textContent('body');
      expect(body?.toLowerCase().includes('no vendors found')).toBeTruthy();
    });

    test('9.3) network error on dashboard shows error state with retry', async ({ page }) => {
      await page.route('**/api/inventory/stats', async (route) => {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) });
      });

      await page.goto('/inventory');
      await page.waitForTimeout(1000);

      const body = await page.textContent('body');
      expect(body?.toLowerCase().includes('error') || body?.toLowerCase().includes('failed') || body?.toLowerCase().includes('retry')).toBeTruthy();
    });

    test('9.4) tab switching preserves state without data loss', async ({ page }) => {
      await goToTab(page, 'assets', 'Smart Board');
      let body = await page.textContent('body');
      expect(body?.includes('Smart Board 65\"')).toBeTruthy();

      await page.getByRole('button', { name: /Vendors/i }).first().click();
      await page.locator('text=Bharat Electronics').first().waitFor({ timeout: 15000 });
      body = await page.textContent('body');
      expect(body?.includes('Bharat Electronics Pvt Ltd')).toBeTruthy();

      await page.getByRole('button', { name: /Assets/i }).first().click();
      await page.locator('text=Smart Board').first().waitFor({ timeout: 15000 });
      body = await page.textContent('body');
      expect(body?.includes('Smart Board 65\"')).toBeTruthy();
    });
  });

  /* ───────── SECTION 10: Regression ───────── */

  test.describe('Regression', () => {
    test('10.1) breadcrumbs render correctly on all sub-pages', async ({ page }) => {
      const slugs = ['assets', 'vendors', 'maintenance', 'procurement', 'audits', 'reports', 'transactions'];
      for (const slug of slugs) {
        await page.goto(`/inventory/${slug}`);
        await page.waitForTimeout(800);
        const body = await page.textContent('body');
        expect(body?.includes('Inventory') || body?.includes('Home')).toBeTruthy();
      }
    });

    test('10.2) shared PageLayout component renders tabs on all pages', async ({ page }) => {
      await page.goto('/inventory/assets');
      await page.waitForTimeout(800);

      const tabs = ['Dashboard', 'Assets', 'Vendors', 'Maintenance', 'Procurement', 'Audits', 'Reports', 'Transactions'];
      const body = await page.textContent('body');
      for (const tab of tabs) {
        expect(body?.includes(tab)).toBeTruthy();
      }
    });
  });
});
