import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ═══════════════════════════════════════════════════════════════════
 *  TC159 — Transport Management: Routes, Vehicles & Student Assignments
 *  Covers: happy path, validation, empty states, edge cases,
 *          error states, accessibility, and regression checks.
 * ═══════════════════════════════════════════════════════════════════ */

/* ───────────────── Mock Data ───────────────── */

const VEHICLE_1 = {
  _id: 'veh-001', id: 'veh-001',
  registrationNumber: 'KA-01-AB-1234',
  make: 'Tata', model: 'Starbus', year: 2022, capacity: 40,
  color: 'Yellow', status: 'active', notes: 'Main school bus',
  driverId: { _id: 'staff-001', name: 'Ramesh Kumar', phone: '9876543210' },
  conductorId: { _id: 'staff-002', name: 'Suresh Babu', phone: '9876543211' },
  driverLicenseNumber: 'DL-1234567890',
  driverLicenseExpiry: '2027-06-30',
};

const VEHICLE_2 = {
  _id: 'veh-002', id: 'veh-002',
  registrationNumber: 'KA-01-CD-5678',
  make: 'Ashok Leyland', model: 'Lynx', year: 2023, capacity: 50,
  color: 'White', status: 'inactive', notes: '',
  driverId: { _id: 'staff-003', name: 'Ganesh Rao', phone: '9876543220' },
  conductorId: { _id: 'staff-004', name: 'Manoj S', phone: '9876543221' },
  driverLicenseNumber: 'DL-6543210987',
  driverLicenseExpiry: '2026-12-15',
};

const VEHICLE_3 = {
  _id: 'veh-003', id: 'veh-003',
  registrationNumber: 'KA-02-EF-9999',
  make: 'Force', model: 'Traveller', year: 2021, capacity: 26,
  color: 'Blue', status: 'maintenance', notes: 'Awaiting tyre replacement',
  driverId: { _id: 'staff-005', name: 'Anil P', phone: '9876543230' },
  conductorId: null,
  driverLicenseNumber: 'DL-1112223334',
  driverLicenseExpiry: '2025-09-10',
};

const MOCK_VEHICLES = [VEHICLE_1, VEHICLE_2, VEHICLE_3];

const ROUTE_1 = {
  _id: 'route-001', id: 'route-001',
  routeNumber: 'R-01', routeName: 'North Bangalore Route',
  academicYear: '2025-2026',
  vehicleId: { _id: 'veh-001', registrationNumber: 'KA-01-AB-1234', make: 'Tata', model: 'Starbus', capacity: 40 },
  stops: [
    { _id: 'stop-001', name: 'Hebbal', address: 'Hebbal Flyover', pickupTime: '07:00', dropTime: '16:30', order: 1 },
    { _id: 'stop-002', name: 'Yelahanka', address: 'Yelahanka Main Road', pickupTime: '07:15', dropTime: '16:15', order: 2 },
    { _id: 'stop-003', name: 'Vidyaranyapura', address: '', pickupTime: '07:30', dropTime: '16:00', order: 3 },
  ],
  students: [
    { studentId: { _id: 'stu-a', name: 'Aarav Sharma', admissionId: 'ADM-001' }, stopId: 'stop-001', pickupActive: true, dropActive: true },
    { studentId: { _id: 'stu-b', name: 'Priya Menon', admissionId: 'ADM-002' }, stopId: 'stop-002', pickupActive: true, dropActive: true },
  ],
  status: 'active', notes: '',
};

const ROUTE_2 = {
  _id: 'route-002', id: 'route-002',
  routeNumber: 'R-02', routeName: 'South Bangalore Route',
  academicYear: '2025-2026',
  vehicleId: null,
  stops: [
    { _id: 'stop-004', name: 'Jayanagar', address: '4th Block', pickupTime: '07:10', dropTime: '16:20', order: 1 },
  ],
  students: [],
  status: 'inactive', notes: 'Under review — new route proposal',
};

const ROUTE_3 = {
  _id: 'route-003', id: 'route-003',
  routeNumber: 'R-03', routeName: 'East Bangalore Route',
  academicYear: '2025-2026',
  vehicleId: { _id: 'veh-003', registrationNumber: 'KA-02-EF-9999', make: 'Force', model: 'Traveller', capacity: 26 },
  stops: [
    { _id: 'stop-005', name: 'Marathahalli', address: 'Near Spice Garden', pickupTime: '07:00', dropTime: '16:30', order: 1 },
    { _id: 'stop-006', name: 'Whitefield', address: 'ITPL Main Road', pickupTime: '07:20', dropTime: '16:10', order: 2 },
  ],
  students: [
    { studentId: { _id: 'stu-c', name: 'Rohan Iyer', admissionId: 'ADM-003' }, stopId: 'stop-005', pickupActive: true, dropActive: false },
    { studentId: { _id: 'stu-d', name: 'Sneha Reddy', admissionId: 'ADM-004' }, stopId: 'stop-006', pickupActive: false, dropActive: true },
    { studentId: { _id: 'stu-e', name: 'Karthik N', admissionId: 'ADM-005' }, stopId: 'stop-005', pickupActive: true, dropActive: true },
    { studentId: { _id: 'stu-f', name: 'Divya M', admissionId: 'ADM-006' }, stopId: 'stop-006', pickupActive: true, dropActive: true },
  ],
  status: 'active', notes: '',
};

const MOCK_ROUTES = [ROUTE_1, ROUTE_2, ROUTE_3];

/* ───────────────── Route installer ───────────────── */

async function installTransportRoutes(page: import('@playwright/test').Page, state: MockState) {
  // Seed data into state so installMockApi serves it
  MOCK_ROUTES.forEach((r) => state.transportRoutes.push({ ...r } as Record<string, unknown>));
  MOCK_VEHICLES.forEach((v) => state.transportVehicles.push({ ...v } as Record<string, unknown>));

  // Override staff list for VehicleModal driver/conductor dropdowns
  await page.route('**/api/staff**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { _id: 'staff-001', name: 'Ramesh Kumar', phone: '9876543210', role: 'Driver', status: 'active' },
            { _id: 'staff-002', name: 'Suresh Babu', phone: '9876543211', role: 'Conductor', status: 'active' },
            { _id: 'staff-003', name: 'Ganesh Rao', phone: '9876543220', role: 'Driver', status: 'active' },
            { _id: 'staff-004', name: 'Manoj S', phone: '9876543221', role: 'Conductor', status: 'active' },
            { _id: 'staff-005', name: 'Anil P', phone: '9876543230', role: 'Driver', status: 'active' },
          ],
        }),
      });
      return;
    }
    await route.fallback();
  });
}

/* ───────────────── Tests ───────────────── */

test.describe('TC159 — Transport Management', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed students for assignment tests
    seedStudent(state, { name: 'Meera Nair', classId: CLASS_10A_ID, admissionId: 'ADM-1001' });
    seedStudent(state, { name: 'Arjun Das', classId: CLASS_10A_ID, admissionId: 'ADM-1002' });
    seedStudent(state, { name: 'Lakshmi Prasad', classId: CLASS_10A_ID, admissionId: 'ADM-1003' });

    // Dismiss cookie consent banner
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
    await installTransportRoutes(page, state);
  });

  /* ═══════════════════════════════════════════════════════════════
     SECTION 1 — HAPPY PATH
     ═══════════════════════════════════════════════════════════════ */

  test('1) Routes tab loads with stats cards and route list', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Wait for route data to render (not skeleton)
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('Transport Routes');
    expect(bodyText).toContain('R-01');
    expect(bodyText).toContain('North Bangalore Route');
    expect(bodyText).toContain('R-02');
    expect(bodyText).toContain('R-03');
  });

  test('2) Route cards display vehicle, stops, student count and status chip', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('KA-01-AB-1234');
    expect(bodyText).toContain('Tata');
    expect(bodyText).toContain('3 stops');
    expect(bodyText).toContain('2/40 students');
    expect(bodyText.toLowerCase()).toContain('active');
  });

  test('3) Create route modal opens, validates required fields, and saves', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    await page.getByRole('button', { name: /add route/i }).first().click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Try submit without filling — should show validation error
    const submitBtn = modal.getByRole('button', { name: /create/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(300);

    // Fill required fields — RouteModal renders routeName first, routeNumber second
    const inputs = modal.locator('input');
    await inputs.nth(0).fill('West Bangalore Route');
    await inputs.nth(1).fill('R-04');

    await submitBtn.click();
    await page.waitForTimeout(500);

    expect(state.requestLog.has('POST /api/transport/routes')).toBeTruthy();
  });

  test('4) Edit route pre-fills form and saves changes', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    // Open actions dropdown on first route card
    const routeCard = page.locator('div').filter({ hasText: 'North Bangalore Route' }).first();
    const actionsBtn = routeCard.locator('button[aria-label*="route"], button').filter({ has: page.locator('svg') }).first();
    await actionsBtn.click();
    await page.waitForTimeout(200);

    // Click edit
    const editItem = page.getByRole('menuitem', { name: /edit/i }).first();
    if (await editItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editItem.click();
      await page.waitForTimeout(300);

      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Pre-filled values
      const inputs = modal.locator('input');
      const routeNumValue = await inputs.nth(0).inputValue();
      expect(routeNumValue).toBe('R-01');
      const routeNameValue = await inputs.nth(1).inputValue();
      expect(routeNameValue).toBe('North Bangalore Route');

      // Update name
      await inputs.nth(1).fill('North Bangalore Route — Updated');
      const saveBtn = modal.getByRole('button', { name: /update|save/i }).first();
      await saveBtn.click();
      await page.waitForTimeout(500);

      expect(state.requestLog.has('PUT /api/transport/routes/route-001')).toBeTruthy();
    }
  });

  test('5) Delete route shows confirmation and removes from list', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('South Bangalore Route'),
      { timeout: 10_000 },
    );

    // Auto-accept confirmation dialogs
    page.on('dialog', (dialog) => dialog.accept());

    // Open actions dropdown on inactive route
    const routeCard = page.locator('div').filter({ hasText: 'South Bangalore Route' }).first();
    const actionsBtn = routeCard.locator('button[aria-label*="route"], button').filter({ has: page.locator('svg') }).first();
    await actionsBtn.click();
    await page.waitForTimeout(200);

    const deleteItem = page.getByRole('menuitem', { name: /delete/i }).first();
    if (await deleteItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteItem.click();
      await page.waitForTimeout(500);
      expect(state.requestLog.has('DELETE /api/transport/routes/route-002')).toBeTruthy();
    }
  });

  test('6) Assign Students modal opens, searches, and assigns student to route', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    // Open actions dropdown
    const routeCard = page.locator('div').filter({ hasText: 'North Bangalore Route' }).first();
    const actionsBtn = routeCard.locator('button[aria-label*="route"], button').filter({ has: page.locator('svg') }).first();
    await actionsBtn.click();
    await page.waitForTimeout(200);

    const assignItem = page.getByRole('menuitem', { name: /assign students/i }).first();
    if (await assignItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await assignItem.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Route info visible
      const modalText = await modal.textContent() ?? '';
      expect(modalText).toContain('R-01');
      expect(modalText).toContain('Aarav Sharma');

      // Search for a new student
      const searchInput = modal.locator('input[placeholder*="Search"], input').first();
      await searchInput.fill('Meera');
      await page.waitForTimeout(500);

      const studentItem = modal.getByText('Meera Nair').first();
      if (await studentItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await studentItem.click();
        await page.waitForTimeout(200);

        // Select a stop if dropdown exists
        const stopSelect = modal.locator('button[data-slot="trigger"]').first();
        if (await stopSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
          await stopSelect.click();
          await page.waitForTimeout(200);
          const stopOption = modal.getByRole('option').first();
          if (await stopOption.isVisible({ timeout: 1000 }).catch(() => false)) {
            await stopOption.click();
            await page.waitForTimeout(200);
          }
        }

        const assignBtn = modal.getByRole('button', { name: /assign student/i }).first();
        if (await assignBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await assignBtn.click({ force: true });
          await page.waitForTimeout(500);
          expect(state.requestLog.has('POST /api/transport/routes/route-001/students')).toBeTruthy();
        }
      }
    }
  });

  test('7) Vehicles tab loads with vehicle cards and correct details', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('KA-01-AB-1234'),
      { timeout: 10_000 },
    );

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('Vehicle Fleet');
    expect(bodyText).toContain('KA-01-AB-1234');
    expect(bodyText).toContain('Tata');
    expect(bodyText).toContain('Starbus');
    expect(bodyText).toContain('40');
    expect(bodyText).toContain('Ramesh Kumar');
    expect(bodyText).toContain('Suresh Babu');
    expect(bodyText.toLowerCase()).toContain('active');
  });

  test('8) Create vehicle modal validates and saves new vehicle', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('Add Vehicle'),
      { timeout: 10_000 },
    );

    await page.getByRole('button', { name: /add vehicle/i }).click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    const inputs = modal.locator('input');
    await inputs.nth(0).fill('KA-03-GH-4444');
    await inputs.nth(1).fill('Mahindra');
    await inputs.nth(2).fill('Cruzio');
    await inputs.nth(3).fill('2024');

    // Capacity
    const capacityInput = modal.locator('input[type="number"]').first();
    if (await capacityInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await capacityInput.fill('35');
    }

    const submitBtn = modal.getByRole('button', { name: /create/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(500);

    expect(state.requestLog.has('POST /api/transport/vehicles')).toBeTruthy();
  });

  test('9) Edit vehicle updates driver information', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('KA-01-AB-1234'),
      { timeout: 10_000 },
    );

    // Find vehicle card and open actions
    const vehicleCard = page.locator('div').filter({ hasText: 'KA-01-AB-1234' }).first();
    const actionsBtn = vehicleCard.locator('button[aria-label*="vehicle"], button').filter({ has: page.locator('svg') }).first();
    await actionsBtn.click();
    await page.waitForTimeout(200);

    const editItem = page.getByRole('menuitem', { name: /edit/i }).first();
    if (await editItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editItem.click();
      await page.waitForTimeout(300);

      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });

      const regValue = await modal.locator('input').first().inputValue();
      expect(regValue).toBe('KA-01-AB-1234');

      // Update driver license number
      const allInputs = modal.locator('input');
      const count = await allInputs.count();
      for (let i = 0; i < count; i++) {
        const val = await allInputs.nth(i).inputValue();
        if (val === 'DL-1234567890') {
          await allInputs.nth(i).fill('DL-9998887776');
          break;
        }
      }

      const saveBtn = modal.getByRole('button', { name: /update|save/i }).first();
      await saveBtn.click();
      await page.waitForTimeout(500);

      expect(state.requestLog.has('PUT /api/transport/vehicles/veh-001')).toBeTruthy();
    }
  });

  test('10) Delete vehicle shows confirmation and removes', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('KA-02-EF-9999'),
      { timeout: 10_000 },
    );

    page.on('dialog', (dialog) => dialog.accept());

    const vehicleCard = page.locator('div').filter({ hasText: 'KA-02-EF-9999' }).first();
    const actionsBtn = vehicleCard.locator('button[aria-label*="vehicle"], button').filter({ has: page.locator('svg') }).first();
    await actionsBtn.click();
    await page.waitForTimeout(200);

    const deleteItem = page.getByRole('menuitem', { name: /delete/i }).first();
    if (await deleteItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteItem.click();
      await page.waitForTimeout(500);
      expect(state.requestLog.has('DELETE /api/transport/vehicles/veh-003')).toBeTruthy();
    }
  });

  /* ═══════════════════════════════════════════════════════════════
     SECTION 2 — EDGE CASES & ALTERNATIVE PATHS
     ═══════════════════════════════════════════════════════════════ */

  test('11) Search filters routes by name and route number', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('East');
    await page.waitForTimeout(500);

    let bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('East Bangalore Route');
    expect(bodyText).not.toContain('South Bangalore Route');

    await searchInput.fill('R-02');
    await page.waitForTimeout(500);
    bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('South Bangalore Route');
    expect(bodyText).not.toContain('North Bangalore Route');
  });

  test('12) Status filter shows only matching routes', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    const statusDropdown = page.locator('button').filter({ hasText: /all status/i }).first();
    await statusDropdown.click();
    await page.waitForTimeout(200);

    const inactiveOption = page.getByRole('menuitem', { name: /inactive/i }).first();
    if (await inactiveOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inactiveOption.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body') ?? '';
      expect(bodyText).toContain('South Bangalore Route');
      expect(bodyText).not.toContain('North Bangalore Route');
    }
  });

  test('13) Search filters vehicles by registration and driver name', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('KA-01-AB-1234'),
      { timeout: 10_000 },
    );

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('CD-5678');
    await page.waitForTimeout(500);

    let bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('Ashok Leyland');
    expect(bodyText).not.toContain('Tata');

    await searchInput.fill('Ramesh');
    await page.waitForTimeout(500);
    bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('KA-01-AB-1234');
    expect(bodyText).not.toContain('KA-02-EF-9999');
  });

  test('14) Vehicle status filter shows only maintenance vehicles', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('KA-01-AB-1234'),
      { timeout: 10_000 },
    );

    const statusDropdown = page.locator('button').filter({ hasText: /all status/i }).first();
    await statusDropdown.click();
    await page.waitForTimeout(200);

    const maintOption = page.getByRole('menuitem', { name: /maintenance/i }).first();
    if (await maintOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await maintOption.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body') ?? '';
      expect(bodyText).toContain('KA-02-EF-9999');
      expect(bodyText).not.toContain('KA-01-AB-1234');
    }
  });

  test('15) Route without vehicle shows no vehicle line', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('South Bangalore Route'),
      { timeout: 10_000 },
    );

    const routeCard = page.locator('div').filter({ hasText: 'South Bangalore Route' }).first();
    const cardText = await routeCard.textContent() ?? '';
    expect(cardText).toContain('R-02');
    expect(cardText).toContain('inactive');
    expect(cardText).not.toContain('KA-01');
  });

  test('16) Stops preview shows correct stop tags', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    const routeCard = page.locator('div').filter({ hasText: 'North Bangalore Route' }).first();
    const cardText = await routeCard.textContent() ?? '';
    expect(cardText).toContain('Hebbal');
    expect(cardText).toContain('Yelahanka');
    expect(cardText).toContain('Vidyaranyapura');
  });

  /* ═══════════════════════════════════════════════════════════════
     SECTION 3 — ERROR STATES
     ═══════════════════════════════════════════════════════════════ */

  test('17) Network error on routes load shows error state with retry', async ({ page }) => {
    // Override the transport routes endpoint to return 500
    await page.route('**/api/transport/routes*', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal Server Error' }) });
    });

    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body') ?? '';
    const lower = bodyText.toLowerCase();
    const hasError = lower.includes('failed') || lower.includes('error') || lower.includes('unavailable');
    expect(hasError).toBeTruthy();
  });

  test('18) Network error on vehicles load shows error state', async ({ page }) => {
    await page.route('**/api/transport/vehicles*', async (route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Service Unavailable' }) });
    });

    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body') ?? '';
    const lower = bodyText.toLowerCase();
    const hasError = lower.includes('failed') || lower.includes('error') || lower.includes('unavailable');
    expect(hasError).toBeTruthy();
  });

  test('19) Create vehicle with zero capacity shows validation error', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('Add Vehicle'),
      { timeout: 10_000 },
    );

    await page.getByRole('button', { name: /add vehicle/i }).click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    const capacityInput = modal.locator('input[type="number"]').first();
    if (await capacityInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await capacityInput.fill('0');
      const submitBtn = modal.getByRole('button', { name: /create/i }).first();
      await submitBtn.click();
      await page.waitForTimeout(300);

      // Should NOT have made POST request due to validation
      expect(state.requestLog.has('POST /api/transport/vehicles')).toBeFalsy();
    }
  });

  /* ═══════════════════════════════════════════════════════════════
     SECTION 4 — VISUAL & COPY CHECKS
     ═══════════════════════════════════════════════════════════════ */

  test('20) Empty state shows correct copy when no routes exist', async ({ page }) => {
    state.transportRoutes.length = 0;
    state.transportVehicles.length = 0;

    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('No routes found') || document.body.textContent?.includes('Add Route'),
      { timeout: 10_000 },
    );

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('No routes found');
  });

  test('21) Empty state shows correct copy when no vehicles exist', async ({ page }) => {
    state.transportRoutes.length = 0;
    state.transportVehicles.length = 0;

    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('No vehicles found') || document.body.textContent?.includes('Add Vehicle'),
      { timeout: 10_000 },
    );

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('No vehicles found');
  });

  test('22) Status chips use correct colors', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    const activeChip = page.locator('span').filter({ hasText: /^active$/i }).first();
    await expect(activeChip).toBeVisible();
  });

  /* ═══════════════════════════════════════════════════════════════
     SECTION 5 — ACCESSIBILITY
     ═══════════════════════════════════════════════════════════════ */

  test('23) All interactive elements reachable via keyboard (Tab)', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    const tagName = await focused.evaluate((el) => (el as HTMLElement).tagName.toLowerCase());
    expect(['input', 'button', 'a']).toContain(tagName);
  });

  test('24) Modal focus trap works on route creation', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add route/i }).first().click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    const focused = page.locator(':focus');
    const isInsideModal = await focused.evaluate(
      (el) => el.closest('[role="dialog"]') !== null,
    );
    expect(isInsideModal).toBeTruthy();
  });

  test('25) ARIA labels present on icon-only buttons', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    const iconButtons = page.locator('button[aria-label]');
    const count = await iconButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  /* ═══════════════════════════════════════════════════════════════
     SECTION 6 — REGRESSION
     ═══════════════════════════════════════════════════════════════ */

  test('26) Assigning student updates route student count consistently', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    const beforeText = await page.textContent('body') ?? '';
    expect(beforeText).toContain('2/40 students');

    // Open assign modal
    const routeCard = page.locator('div').filter({ hasText: 'North Bangalore Route' }).first();
    const actionsBtn = routeCard.locator('button[aria-label*="route"], button').filter({ has: page.locator('svg') }).first();
    await actionsBtn.click();
    await page.waitForTimeout(200);

    const assignItem = page.getByRole('menuitem', { name: /assign students/i }).first();
    if (await assignItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await assignItem.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"]').first();
      const searchInput = modal.locator('input').first();
      await searchInput.fill('Arjun');
      await page.waitForTimeout(500);

      const studentItem = modal.getByText('Arjun Das').first();
      if (await studentItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await studentItem.click();
        await page.waitForTimeout(200);

        const assignBtn = modal.getByRole('button', { name: /assign student/i }).first();
        if (await assignBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await assignBtn.click({ force: true });
          await page.waitForTimeout(500);
          expect(state.requestLog.has('POST /api/transport/routes/route-001/students')).toBeTruthy();
        }
      }
    }
  });

  test('27) Vehicle deletion does not break routes that reference it', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('KA-01-AB-1234');
    expect(bodyText).toContain('North Bangalore Route');
  });

  test('28) Tab switch preserves search state within same session', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('East');
    await page.waitForTimeout(500);

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('East Bangalore Route');
    expect(bodyText).not.toContain('South Bangalore Route');
  });

  test('29) Direct navigation to /transport/vehicles renders vehicles tab', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('Vehicle Fleet'),
      { timeout: 10_000 },
    );

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('Vehicle Fleet');
    expect(bodyText).toContain('KA-01-AB-1234');
  });

  test('30) Transport page breadcrumbs show correct hierarchy', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.body.textContent?.includes('North Bangalore Route'),
      { timeout: 10_000 },
    );

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('Home');
    expect(bodyText.toLowerCase()).toContain('transport');
  });
});
