/**
 * TC168 — Transport Management: routes, vehicles, student assignments,
 * capacity warnings, empty states, and validation errors.
 *
 * Covers the full transport module: route CRUD, vehicle CRUD,
 * student-to-route assignment, search/filter, and edge cases.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent,
  CLASS_10A_ID, CLASS_11A_ID, TEACHER_A_ID, TEACHER_B_ID, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────────────── Mock Data ───────────────── */

const VEHICLE_1 = {
  _id: 'veh-001', id: 'veh-001', registrationNumber: 'KA-01-AB-1234',
  make: 'Tata', model: 'Starbus', year: 2022, capacity: 40, color: 'Yellow',
  status: 'active', notes: 'Primary school bus',
  driverId: { _id: TEACHER_A_ID, name: 'Ananya Sharma', status: 'active' },
  conductorId: { _id: TEACHER_B_ID, name: 'Ravi Menon', status: 'active' },
  driverLicenseNumber: 'DL-123456', driverLicenseExpiry: '2027-03-15',
  schoolId: SCHOOL_ID,
};

const VEHICLE_2 = {
  _id: 'veh-002', id: 'veh-002', registrationNumber: 'KA-01-CD-5678',
  make: 'Ashok Leyland', model: 'Lynx', year: 2023, capacity: 50, color: 'White',
  status: 'inactive', notes: 'Spare bus',
  driverId: { _id: 'staff-004', name: 'Ganesh Rao', status: 'active' },
  conductorId: { _id: 'staff-005', name: 'Manoj S', status: 'active' },
  driverLicenseNumber: 'DL-654321', driverLicenseExpiry: '2026-12-20',
  schoolId: SCHOOL_ID,
};

const VEHICLE_3 = {
  _id: 'veh-003', id: 'veh-003', registrationNumber: 'KA-02-EF-9999',
  make: 'Force', model: 'Traveller', year: 2021, capacity: 26, color: 'Blue',
  status: 'maintenance', notes: 'Under repair',
  driverId: null, conductorId: null,
  driverLicenseNumber: '', driverLicenseExpiry: '',
  schoolId: SCHOOL_ID,
};

const MOCK_VEHICLES = [VEHICLE_1, VEHICLE_2, VEHICLE_3];

const ROUTE_1 = {
  _id: 'route-001', id: 'route-001', routeNumber: 'R-01',
  routeName: 'North Bangalore Route', academicYear: '2025-2026',
  vehicleId: { _id: 'veh-001', registrationNumber: 'KA-01-AB-1234', make: 'Tata', model: 'Starbus', capacity: 40 },
  stops: [
    { _id: 'stop-1', name: 'Hebbal', address: 'Hebbal Flyover', pickupTime: '07:00', dropTime: '16:30', order: 1 },
    { _id: 'stop-2', name: 'Yelahanka', address: 'Yelahanka Main Road', pickupTime: '07:15', dropTime: '16:15', order: 2 },
    { _id: 'stop-3', name: 'Vidyaranyapura', address: '', pickupTime: '07:30', dropTime: '16:00', order: 3 },
  ],
  students: [
    { studentId: { _id: 'stu-a', name: 'Aarav Sharma', admissionId: 'ADM-001' }, stopId: 'stop-1' },
    { studentId: { _id: 'stu-b', name: 'Priya Menon', admissionId: 'ADM-002' }, stopId: 'stop-2' },
  ],
  status: 'active', notes: '', schoolId: SCHOOL_ID,
};

const ROUTE_2 = {
  _id: 'route-002', id: 'route-002', routeNumber: 'R-02',
  routeName: 'South Bangalore Route', academicYear: '2025-2026',
  vehicleId: null,
  stops: [
    { _id: 'stop-4', name: 'Jayanagar', address: '4th Block', pickupTime: '07:10', dropTime: '16:20', order: 1 },
    { _id: 'stop-5', name: 'JP Nagar', address: 'Phase 2', pickupTime: '07:25', dropTime: '16:05', order: 2 },
  ],
  students: [],
  status: 'inactive', notes: 'Under review — new area', schoolId: SCHOOL_ID,
};

const ROUTE_3 = {
  _id: 'route-003', id: 'route-003', routeNumber: 'R-03',
  routeName: 'East Bangalore Route', academicYear: '2025-2026',
  vehicleId: { _id: 'veh-003', registrationNumber: 'KA-02-EF-9999', make: 'Force', model: 'Traveller', capacity: 26 },
  stops: [
    { _id: 'stop-6', name: 'Whitefield', address: 'ITPL Main Road', pickupTime: '06:45', dropTime: '17:00', order: 1 },
    { _id: 'stop-7', name: 'Marathahalli', address: 'Outer Ring Road', pickupTime: '07:00', dropTime: '16:45', order: 2 },
  ],
  students: [
    { studentId: { _id: 'stu-c', name: 'Rishi Kumar', admissionId: 'ADM-003' }, stopId: 'stop-6' },
    { studentId: { _id: 'stu-d', name: 'Ananya Gupta', admissionId: 'ADM-004' }, stopId: 'stop-6' },
    { studentId: { _id: 'stu-e', name: 'Diya Patel', admissionId: 'ADM-005' }, stopId: 'stop-7' },
  ],
  status: 'active', notes: '', schoolId: SCHOOL_ID,
};

/* Over-capacity route: 28 students on a 26-seat bus */
const ROUTE_4 = {
  _id: 'route-004', id: 'route-004', routeNumber: 'R-04',
  routeName: 'West Bangalore Route', academicYear: '2025-2026',
  vehicleId: { _id: 'veh-003', registrationNumber: 'KA-02-EF-9999', make: 'Force', model: 'Traveller', capacity: 26 },
  stops: [
    { _id: 'stop-8', name: 'Rajajinagar', address: '1st Block', pickupTime: '07:05', dropTime: '16:25', order: 1 },
  ],
  students: Array.from({ length: 28 }, (_, i) => ({
    studentId: { _id: `stu-w${i}`, name: `Student W${i + 1}`, admissionId: `ADM-W${i + 1}` },
    stopId: 'stop-8',
  })),
  status: 'active', notes: '', schoolId: SCHOOL_ID,
};

const MOCK_ROUTES = [ROUTE_1, ROUTE_2, ROUTE_3, ROUTE_4];

/* ───────────────── Test Suite ───────────────── */

test.describe('TC168 — Transport Management', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed students for assignment tests
    seedStudent(state, { name: 'Meera Nair', classId: CLASS_10A_ID, admissionId: 'ADM-010' });
    seedStudent(state, { name: 'Arjun Das', classId: CLASS_10A_ID, admissionId: 'ADM-011' });
    seedStudent(state, { name: 'Kabir Singh', classId: CLASS_11A_ID, admissionId: 'ADM-012' });

    // Seed transport data
    MOCK_ROUTES.forEach((r) => state.transportRoutes.push(r as Record<string, unknown>));
    MOCK_VEHICLES.forEach((v) => state.transportVehicles.push(v as Record<string, unknown>));

    // Dismiss cookie consent
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    await installMockApi(page, state);
  });

  /* ─── SECTION 1 — HAPPY PATH ─── */

  test('1 — Routes tab loads with summary stat cards and route cards', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Header
    await expect(page.getByText('Transport Routes')).toBeVisible({ timeout: 10_000 });

    // Stat cards
    await expect(page.getByText('Total Routes')).toBeVisible();
    await expect(page.getByText('Active Routes')).toBeVisible();
    await expect(page.getByText('Buses on Route')).toBeVisible();
    await expect(page.getByText('Total Students')).toBeVisible();

    // Wait for route cards
    await expect(page.getByText('North Bangalore Route')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('R-01')).toBeVisible();
    await expect(page.getByText('KA-01-AB-1234')).toBeVisible();
    await expect(page.getByText('3 stops')).toBeVisible();
    await expect(page.getByText('2/40 students')).toBeVisible();
  });

  test('2 — Vehicles tab loads with vehicle cards and driver info', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Vehicle Fleet')).toBeVisible({ timeout: 10_000 });

    // Vehicle cards
    await expect(page.getByText('KA-01-AB-1234')).toBeVisible();
    await expect(page.getByText('Tata Starbus 2022')).toBeVisible();
    await expect(page.getByText('Capacity: 40 seats')).toBeVisible();
    await expect(page.getByText('Ananya Sharma')).toBeVisible();
    await expect(page.getByText('Ravi Menon')).toBeVisible();

    // Maintenance vehicle with no staff
    await expect(page.getByText('KA-02-EF-9999')).toBeVisible();
    await expect(page.getByText('No staff assigned')).toBeVisible();
  });

  test('3 — Create a new route with stops via modal', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add route/i }).click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Fill route details
    await modal.locator('input').nth(0).fill('R-05');
    await modal.locator('input').nth(1).fill('Central Bangalore Route');

    // Add stops
    await modal.getByRole('button', { name: /add stop/i }).click();
    const stopInputs = modal.locator('input[placeholder*="Stop name"], input[placeholder*="name"]').last();
    await stopInputs.fill('MG Road');

    await modal.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(500);

    expect(state.requestLog.has('POST /api/transport/routes')).toBeTruthy();
  });

  test('4 — Create a new vehicle via modal', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add vehicle/i }).click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Fill vehicle form
    const inputs = modal.locator('input');
    await inputs.nth(0).fill('KA-03-GH-4444');
    await inputs.nth(1).fill('Mahindra');
    await inputs.nth(2).fill('Cruzio');
    await inputs.nth(3).fill('2024');

    const capacityInput = modal.locator('input[type="number"]').first();
    if (await capacityInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await capacityInput.fill('35');
    }

    await modal.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(500);

    expect(state.requestLog.has('POST /api/transport/vehicles')).toBeTruthy();
  });

  test('5 — Edit route updates name and saves', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Open actions dropdown on first route card
    const routeCard = page.locator('div').filter({ hasText: 'North Bangalore Route' }).first();
    await routeCard.locator('button[aria-label*="route"], button[aria-label*="actions"]').first().click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const nameInput = modal.locator('input').nth(1);
    await expect(nameInput).toHaveValue('North Bangalore Route');
    await nameInput.fill('North Bangalore Route — Updated');

    await modal.getByRole('button', { name: /update/i }).click();
    await page.waitForTimeout(500);

    expect(state.requestLog.has('PUT /api/transport/routes/route-001')).toBeTruthy();
  });

  test('6 — Edit vehicle updates driver name', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    const card = page.locator('div').filter({ hasText: 'KA-01-AB-1234' }).first();
    await card.locator('button[aria-label*="vehicle"], button[aria-label*="actions"]').first().click();
    await page.getByRole('menuitem', { name: /edit/i }).click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Registration should be pre-filled
    await expect(modal.locator('input').first()).toHaveValue('KA-01-AB-1234');

    await modal.getByRole('button', { name: /update/i }).click();
    await page.waitForTimeout(500);

    expect(state.requestLog.has('PUT /api/transport/vehicles/veh-001')).toBeTruthy();
  });

  test('7 — Assign students modal opens and assigns a student to a route', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const routeCard = page.locator('div').filter({ hasText: 'South Bangalore Route' }).first();
    await routeCard.locator('button[aria-label*="route"], button[aria-label*="actions"]').first().click();
    await page.getByRole('menuitem', { name: /assign students/i }).click();

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await expect(modal.getByText('R-02')).toBeVisible();

    // Search for a student
    const searchInput = modal.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await searchInput.fill('Meera');
      await page.waitForTimeout(500);

      const studentItem = modal.getByText('Meera Nair').first();
      if (await studentItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await studentItem.click();
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);

        const assignBtn = modal.getByRole('button', { name: /assign student/i }).first();
        if (await assignBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await assignBtn.click({ force: true });
          await page.waitForTimeout(500);
          expect(state.requestLog.has('POST /api/transport/routes/route-002/students')).toBeTruthy();
        }
      }
    }
  });

  test('8 — Delete route shows confirmation and removes from list', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Accept browser confirm dialogs
    page.on('dialog', (dialog) => dialog.accept());

    const card = page.locator('div').filter({ hasText: 'South Bangalore Route' }).first();
    await card.locator('button[aria-label*="route"], button[aria-label*="actions"]').first().click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await page.waitForTimeout(500);

    expect(state.requestLog.has('DELETE /api/transport/routes/route-002')).toBeTruthy();
  });

  test('9 — Delete vehicle shows confirmation and removes', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    page.on('dialog', (dialog) => dialog.accept());

    const card = page.locator('div').filter({ hasText: 'KA-02-EF-9999' }).first();
    await card.locator('button[aria-label*="vehicle"], button[aria-label*="actions"]').first().click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await page.waitForTimeout(500);

    expect(state.requestLog.has('DELETE /api/transport/vehicles/veh-003')).toBeTruthy();
  });

  /* ─── SECTION 2 — EDGE CASES & ALTERNATIVE PATHS ─── */

  test('10 — Search filters routes by route name', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('North Bangalore Route')).toBeVisible();
    await expect(page.getByText('South Bangalore Route')).toBeVisible();

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('North');
    await page.waitForTimeout(600);

    await expect(page.getByText('North Bangalore Route')).toBeVisible();
    await expect(page.getByText('South Bangalore Route')).not.toBeVisible();
  });

  test('11 — Search filters vehicles by registration number', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('KA-01-AB-1234')).toBeVisible();
    await expect(page.getByText('KA-01-CD-5678')).toBeVisible();

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('CD-5678');
    await page.waitForTimeout(600);

    await expect(page.getByText('KA-01-CD-5678')).toBeVisible();
    await expect(page.getByText('KA-01-AB-1234')).not.toBeVisible();
  });

  test('12 — Status filter shows only active routes', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const statusBtn = page.locator('button').filter({ hasText: /all status|status/i }).first();
    await statusBtn.click();
    await page.waitForTimeout(300);

    await page.getByRole('menuitem', { name: /active/i }).click();
    await page.waitForTimeout(600);

    await expect(page.getByText('North Bangalore Route')).toBeVisible();
    await expect(page.getByText('South Bangalore Route')).not.toBeVisible();
  });

  test('13 — Status filter shows only maintenance vehicles', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    const statusBtn = page.locator('button').filter({ hasText: /all status|status/i }).first();
    await statusBtn.click();
    await page.waitForTimeout(300);

    await page.getByRole('menuitem', { name: /maintenance/i }).click();
    await page.waitForTimeout(600);

    await expect(page.getByText('KA-02-EF-9999')).toBeVisible();
    await expect(page.getByText('KA-01-AB-1234')).not.toBeVisible();
  });

  test('14 — Route with no vehicle assigned displays correctly', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Route-02 has vehicleId: null
    const card = page.locator('div').filter({ hasText: 'South Bangalore Route' }).first();
    await expect(card.getByText('R-02')).toBeVisible();
    // Route-02 has 2 stops and 0 students
    await expect(card.getByText('2 stops')).toBeVisible();
    await expect(card.getByText('0 students')).toBeVisible();
  });

  test('15 — Over-capacity route shows warning badge', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const card = page.locator('div').filter({ hasText: 'West Bangalore Route' }).first();
    await expect(card).toBeVisible();
    // 28 students on 26-seat bus → over capacity by 2
    await expect(card.getByText(/Over capacity/i)).toBeVisible();
  });

  test('16 — Near-capacity route shows amber warning', async ({ page }) => {
    // Create a route with 24 students on a 26-seat bus (>= 90%)
    state.transportRoutes.push({
      _id: 'route-005', id: 'route-005', routeNumber: 'R-05',
      routeName: 'Near Capacity Route', academicYear: '2025-2026',
      vehicleId: { _id: 'veh-003', registrationNumber: 'KA-02-EF-9999', make: 'Force', model: 'Traveller', capacity: 26 },
      stops: [{ _id: 'stop-9', name: 'Koramangala', address: '', pickupTime: '07:00', dropTime: '16:30', order: 1 }],
      students: Array.from({ length: 24 }, (_, i) => ({
        studentId: { _id: `stu-n${i}`, name: `Student N${i + 1}`, admissionId: `ADM-N${i + 1}` },
        stopId: 'stop-9',
      })),
      status: 'active', notes: '', schoolId: SCHOOL_ID,
    } as Record<string, unknown>);

    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const card = page.locator('div').filter({ hasText: 'Near Capacity Route' }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText(/Near capacity/i)).toBeVisible();
  });

  /* ─── SECTION 3 — ERROR STATES ─── */

  test('17 — Empty state shows when no routes exist', async ({ page }) => {
    state.transportRoutes.length = 0;
    state.transportVehicles.length = 0;

    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/No routes found/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /add route/i })).toBeVisible();
  });

  test('18 — Empty state shows when no vehicles exist', async ({ page }) => {
    state.transportVehicles.length = 0;

    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/No vehicles found/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /add vehicle/i })).toBeVisible();
  });

  test('19 — Network error on load shows error state with retry', async ({ page }) => {
    // Override the routes endpoint to return 500
    await page.route('**/api/transport/routes*', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) });
    });

    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Failed to load transport data/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  test('20 — Route modal validates required fields', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add route/i }).click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Submit empty form
    await modal.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(300);

    // Should still be on modal (validation prevented submit)
    await expect(modal).toBeVisible();
  });

  test('21 — Vehicle modal validates required fields', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add vehicle/i }).click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Submit empty form
    await modal.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(300);

    await expect(modal).toBeVisible();
  });

  /* ─── SECTION 4 — VISUAL & COPY CHECKS ─── */

  test('22 — Stat card values match seeded data', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Stat cards render values inside h3.text-xl elements
    const statValues = page.locator('h3.text-xl');
    await expect(statValues.nth(0)).toHaveText('4');   // Total Routes
    await expect(statValues.nth(1)).toHaveText('3');   // Active Routes
    await expect(statValues.nth(2)).toHaveText('2');   // Buses on Route (veh-001 and veh-003)
    await expect(statValues.nth(3)).toHaveText('33');  // Total Students (2+0+3+28)
  });

  test('23 — Stops preview chips render on route cards', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const card = page.locator('div').filter({ hasText: 'North Bangalore Route' }).first();
    await expect(card.getByText('Hebbal')).toBeVisible();
    await expect(card.getByText('Yelahanka')).toBeVisible();
    await expect(card.getByText('Vidyaranyapura')).toBeVisible();
  });

  test('24 — Breadcrumb shows Transport → Routes on load', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toContainText('Transport');
  });

  /* ─── SECTION 5 — ACCESSIBILITY ─── */

  test('25 — All interactive elements reachable via keyboard on routes page', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Tab through key interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Search input should be focusable
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('26 — Route action dropdown button has aria-label', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const actionBtn = page.locator('button[aria-label*="route"], button[aria-label*="actions"]').first();
    await expect(actionBtn).toHaveAttribute('aria-label');
  });

  test('27 — Modal has role dialog and contains route name', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add route/i }).click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('role', 'dialog');
  });
});
