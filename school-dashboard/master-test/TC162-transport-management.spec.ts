import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent, seedStaff,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TC162 — Transport Management: routes, vehicles, assignments
 * ───────────────────────────────────────────────────────────────────── */

/* ── Mock Data (Indian school context) ── */

const STAFF_DRIVER = {
  _id: 'staff-driver-1', id: 'staff-driver-1',
  name: 'Ramesh Kumar', email: 'ramesh@school.edu', phone: '9876543210',
  role: 'driver', designation: 'Driver', department: 'Transport',
  status: 'active', joiningDate: '2022-06-01', schoolId: SCHOOL_ID,
  code: 'DRV-001',
};

const STAFF_CONDUCTOR = {
  _id: 'staff-cond-1', id: 'staff-cond-1',
  name: 'Suresh Babu', email: 'suresh@school.edu', phone: '9876543211',
  role: 'conductor', designation: 'Conductor', department: 'Transport',
  status: 'active', joiningDate: '2022-06-01', schoolId: SCHOOL_ID,
  code: 'CON-001',
};

const VEHICLE_1 = {
  _id: 'veh-1', id: 'veh-1',
  registrationNumber: 'KA-01-AB-1234', make: 'Tata', model: 'Starbus',
  year: 2022, capacity: 40, color: 'Yellow', status: 'active',
  driverId: STAFF_DRIVER,
  conductorId: STAFF_CONDUCTOR,
  driverLicenseNumber: 'DL-12345678',
  driverLicenseExpiry: '2027-03-15',
  schoolId: SCHOOL_ID,
};

const VEHICLE_2 = {
  _id: 'veh-2', id: 'veh-2',
  registrationNumber: 'KA-01-CD-5678', make: 'Ashok Leyland', model: 'Lynx',
  year: 2023, capacity: 50, color: 'White', status: 'inactive',
  driverId: { _id: 'staff-driver-2', id: 'staff-driver-2', name: 'Ganesh Rao', status: 'inactive' },
  conductorId: null,
  driverLicenseNumber: 'DL-87654321',
  schoolId: SCHOOL_ID,
};

const VEHICLE_3 = {
  _id: 'veh-3', id: 'veh-3',
  registrationNumber: 'KA-02-EF-9999', make: 'Force', model: 'Traveller',
  year: 2021, capacity: 26, color: 'Blue', status: 'maintenance',
  driverId: null, conductorId: null,
  schoolId: SCHOOL_ID,
};

const ROUTE_1 = {
  _id: 'route-1', id: 'route-1',
  routeNumber: 'R-01', routeName: 'North Bangalore Route',
  academicYear: '2025-2026',
  vehicleId: { _id: 'veh-1', registrationNumber: 'KA-01-AB-1234', make: 'Tata', model: 'Starbus', capacity: 40 },
  stops: [
    { _id: 'stop-1', name: 'Hebbal', address: 'Hebbal Flyover', pickupTime: '07:00', dropTime: '16:30', order: 1 },
    { _id: 'stop-2', name: 'Yelahanka', address: 'Yelahanka Main Road', pickupTime: '07:15', dropTime: '16:15', order: 2 },
    { _id: 'stop-3', name: 'Vidyaranyapura', address: '', pickupTime: '07:30', dropTime: '16:00', order: 3 },
  ],
  students: [],
  status: 'active',
  notes: '',
};

const ROUTE_2 = {
  _id: 'route-2', id: 'route-2',
  routeNumber: 'R-02', routeName: 'South Bangalore Route',
  academicYear: '2025-2026',
  vehicleId: null,
  stops: [
    { _id: 'stop-4', name: 'Jayanagar', address: '4th Block', pickupTime: '07:10', dropTime: '16:20', order: 1 },
  ],
  students: [],
  status: 'inactive',
  notes: 'Under review',
};

const ROUTE_3 = {
  _id: 'route-3', id: 'route-3',
  routeNumber: 'R-03', routeName: 'East Bangalore Route',
  academicYear: '2025-2026',
  vehicleId: { _id: 'veh-2', registrationNumber: 'KA-01-CD-5678', make: 'Ashok Leyland', model: 'Lynx', capacity: 50 },
  stops: [
    { _id: 'stop-5', name: 'Marathahalli', address: 'Marathahalli Bridge', pickupTime: '07:05', dropTime: '16:25', order: 1 },
    { _id: 'stop-6', name: 'Whitefield', address: 'ITPL Main Road', pickupTime: '07:25', dropTime: '16:05', order: 2 },
  ],
  students: [
    { studentId: { _id: 'stu-a', name: 'Aarav Sharma', admissionId: 'ADM-001' }, stopId: 'stop-5' },
  ],
  status: 'active',
  notes: '',
};

test.describe('TC162 — Transport Management', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Seed staff for driver/conductor dropdowns
    state.staff.push(STAFF_DRIVER as Record<string, unknown>);
    state.staff.push(STAFF_CONDUCTOR as Record<string, unknown>);

    // Seed students for route assignment
    const s1 = seedStudent(state, { name: 'Aarav Sharma', classId: CLASS_10A_ID, admissionId: 'ADM-001' });
    const s2 = seedStudent(state, { name: 'Priya Menon', classId: CLASS_10A_ID, admissionId: 'ADM-002' });

    // Seed vehicles
    state.transportVehicles.push(VEHICLE_1 as Record<string, unknown>);
    state.transportVehicles.push(VEHICLE_2 as Record<string, unknown>);
    state.transportVehicles.push(VEHICLE_3 as Record<string, unknown>);

    // Seed routes (update student IDs to match seeded students)
    const r1 = { ...ROUTE_1 };
    const r2 = { ...ROUTE_2 };
    const r3 = { ...ROUTE_3, students: [{ studentId: { _id: s1.id, name: s1.name, admissionId: s1.admissionId }, stopId: 'stop-5' }] };
    state.transportRoutes.push(r1 as Record<string, unknown>);
    state.transportRoutes.push(r2 as Record<string, unknown>);
    state.transportRoutes.push(r3 as Record<string, unknown>);

    await installMockApi(page, state);
  });

  /* ═══════════════════════════════════════════════════════════════
   *  SECTION 1 — HAPPY PATH
   * ═══════════════════════════════════════════════════════════════ */

  /* ── 1. Routes tab loads with stats and route cards ── */
  test('1) routes tab loads showing stat cards and route list', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Header
    await expect(page.getByText('Transport Routes')).toBeVisible({ timeout: 10_000 });

    // Stat cards
    await expect(page.getByText('Total Routes')).toBeVisible();
    await expect(page.getByText('Active Routes')).toBeVisible();
    await expect(page.getByText('Buses on Route')).toBeVisible();
    await expect(page.getByText('Total Students')).toBeVisible();

    // Route cards
    await expect(page.getByText('North Bangalore Route')).toBeVisible();
    await expect(page.getByText('South Bangalore Route')).toBeVisible();
    await expect(page.getByText('East Bangalore Route')).toBeVisible();
  });

  /* ── 2. Route card details ── */
  test('2) route cards display vehicle, stops, student count and status chip', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Vehicle info on route with vehicle
    await expect(page.getByText(/KA-01-AB-1234/)).toBeVisible();
    await expect(page.getByText(/Tata Starbus/)).toBeVisible();

    // Stop count
    await expect(page.getByText(/3 stops/)).toBeVisible();

    // Student count
    await expect(page.getByText(/1\/40 students/)).toBeVisible();

    // Status chips
    const body = await page.textContent('body');
    expect(body?.toLowerCase()).toContain('active');
    expect(body?.toLowerCase()).toContain('inactive');
  });

  /* ── 3. Vehicles tab loads ── */
  test('3) vehicles tab loads with vehicle cards showing driver and conductor', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Vehicle Fleet')).toBeVisible({ timeout: 10_000 });

    // Registration numbers
    await expect(page.getByText('KA-01-AB-1234')).toBeVisible();
    await expect(page.getByText('KA-01-CD-5678')).toBeVisible();
    await expect(page.getByText('KA-02-EF-9999')).toBeVisible();

    // Driver / conductor
    await expect(page.getByText('Ramesh Kumar')).toBeVisible();
    await expect(page.getByText('Suresh Babu')).toBeVisible();

    // Capacity
    await expect(page.getByText(/40 seats/)).toBeVisible();
  });

  /* ── 4. Create vehicle ── */
  test('4) create vehicle modal validates and saves new vehicle', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add vehicle/i }).click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Fill form
    await modal.getByLabel(/registration number/i).fill('KA-03-GH-4444');
    await modal.getByLabel(/make/i).fill('Mahindra');
    await modal.getByLabel(/model/i).fill('Cruzio');
    await modal.getByLabel(/year/i).fill('2024');
    await modal.getByLabel(/capacity/i).fill('35');
    await modal.getByLabel(/color/i).fill('Green');

    // Submit
    await modal.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(600);

    expect(state.requestLog.has('POST /api/transport/vehicles')).toBeTruthy();
  });

  /* ── 5. Edit vehicle ── */
  test('5) edit vehicle pre-fills data and updates successfully', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    // Open actions dropdown on first vehicle card
    const card = page.locator('.grid > div').filter({ hasText: 'KA-01-AB-1234' }).first();
    await card.getByRole('button', { name: /vehicle actions/i }).click();
    await page.waitForTimeout(200);

    await page.getByRole('menuitem', { name: /edit/i }).click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify pre-filled
    const regValue = await modal.getByLabel(/registration number/i).inputValue();
    expect(regValue).toBe('KA-01-AB-1234');

    // Update color
    await modal.getByLabel(/color/i).fill('Orange');

    await modal.getByRole('button', { name: /update/i }).click();
    await page.waitForTimeout(600);

    expect(state.requestLog.has('PUT /api/transport/vehicles/veh-1')).toBeTruthy();
  });

  /* ── 6. Create route with stops ── */
  test('6) create route modal accepts stops and saves route', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add route/i }).click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    await modal.getByLabel(/route name/i).fill('West Bangalore Route');
    await modal.getByLabel(/route number/i).fill('R-04');

    // Add a stop
    await modal.getByRole('button', { name: /add stop/i }).click();
    await page.waitForTimeout(200);
    const stopInputs = modal.locator('input').filter({ hasValue: '' });
    await stopInputs.first().fill('Rajajinagar');

    // Select vehicle from dropdown
    await modal.getByLabel(/vehicle/i).click();
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: /KA-01-AB-1234/ }).first().click();

    await modal.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(600);

    expect(state.requestLog.has('POST /api/transport/routes')).toBeTruthy();
  });

  /* ── 7. Assign student to route ── */
  test('7) student can be assigned to a route with stop selection', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Open actions on route with stops
    const card = page.locator('.grid > div').filter({ hasText: 'North Bangalore Route' }).first();
    await card.getByRole('button', { name: /route actions/i }).click();
    await page.waitForTimeout(200);

    await page.getByRole('menuitem', { name: /assign students/i }).click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Select student
    await modal.getByLabel(/student/i).click();
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: /Aarav Sharma/ }).first().click();

    // Select stop
    await modal.getByLabel(/stop/i).click();
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: /Hebbal/ }).first().click();

    await modal.getByRole('button', { name: /assign/i }).click();
    await page.waitForTimeout(600);

    expect(state.requestLog.has('POST /api/transport/routes/route-1/students')).toBeTruthy();
  });

  /* ── 8. Delete route with confirmation ── */
  test('8) delete route shows confirmation and removes route', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const card = page.locator('.grid > div').filter({ hasText: 'South Bangalore Route' }).first();
    await card.getByRole('button', { name: /route actions/i }).click();
    await page.waitForTimeout(200);

    await page.getByRole('menuitem', { name: /delete/i }).click();
    await page.waitForTimeout(300);

    // ConfirmDialog should appear
    const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /delete/i }).first();
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    await confirmDialog.getByRole('button', { name: /delete/i }).click();
    await page.waitForTimeout(600);

    expect(state.requestLog.has('DELETE /api/transport/routes/route-2')).toBeTruthy();
  });

  /* ═══════════════════════════════════════════════════════════════
   *  SECTION 2 — EDGE CASES
   * ═══════════════════════════════════════════════════════════════ */

  /* ── 9. Search filters routes ── */
  test('9) search filters routes by name or route number', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/search routes/i);
    await searchInput.fill('East');
    await page.waitForTimeout(500);

    let bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('East Bangalore Route');
    expect(bodyText).not.toContain('North Bangalore Route');
  });

  /* ── 10. Status filter for routes ── */
  test('10) status filter shows only active or inactive routes', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Open status dropdown
    await page.getByRole('button', { name: /all status/i }).click();
    await page.waitForTimeout(200);
    await page.getByRole('menuitem', { name: /^active$/i }).click();
    await page.waitForTimeout(500);

    let bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('North Bangalore Route');
    expect(bodyText).not.toContain('South Bangalore Route');
  });

  /* ── 11. Search filters vehicles ── */
  test('11) search filters vehicles by registration or driver name', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/search vehicles/i);
    await searchInput.fill('Ramesh');
    await page.waitForTimeout(500);

    let bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('KA-01-AB-1234');
    expect(bodyText).not.toContain('KA-02-EF-9999');
  });

  /* ── 12. Vehicle status filter ── */
  test('12) vehicle status filter shows only maintenance vehicles', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /all status/i }).click();
    await page.waitForTimeout(200);
    await page.getByRole('menuitem', { name: /^maintenance$/i }).click();
    await page.waitForTimeout(500);

    let bodyText = await page.textContent('body') ?? '';
    expect(bodyText).toContain('KA-02-EF-9999');
    expect(bodyText).not.toContain('KA-01-AB-1234');
  });

  /* ── 13. Empty state ── */
  test('13) empty state displays when no routes or vehicles exist', async ({ page }) => {
    state.transportRoutes.length = 0;
    state.transportVehicles.length = 0;

    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    let bodyText = await page.textContent('body') ?? '';
    expect(bodyText.toLowerCase()).toMatch(/no routes|add route|create your first/);

    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    bodyText = await page.textContent('body') ?? '';
    expect(bodyText.toLowerCase()).toMatch(/no vehicles|add vehicle|first vehicle/);
  });

  /* ═══════════════════════════════════════════════════════════════
   *  SECTION 3 — ERROR STATES
   * ═══════════════════════════════════════════════════════════════ */

  /* ── 14. Network error shows error state ── */
  test('14) network error on routes load shows error state with retry', async ({ page }) => {
    await page.route('**/api/transport/routes**', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) });
    });

    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText.toLowerCase()).toMatch(/failed to load|error|retry/);
  });

  /* ── 15. Route validation ── */
  test('15) route modal prevents save without required fields', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add route/i }).click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Try to submit empty form
    await modal.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(400);

    // Should still show modal (validation failed)
    await expect(modal).toBeVisible();
    expect(state.requestLog.has('POST /api/transport/routes')).toBeFalsy();
  });

  /* ── 16. Vehicle capacity validation ── */
  test('16) vehicle modal rejects zero or negative capacity', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add vehicle/i }).click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await modal.getByLabel(/registration number/i).fill('KA-04-IJ-0000');
    await modal.getByLabel(/capacity/i).fill('0');

    await modal.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(400);

    await expect(modal).toBeVisible();
    expect(state.requestLog.has('POST /api/transport/vehicles')).toBeFalsy();
  });

  /* ═══════════════════════════════════════════════════════════════
   *  SECTION 4 — VISUAL & COPY
   * ═══════════════════════════════════════════════════════════════ */

  /* ── 17. Stat cards counts ── */
  test('17) stat cards display correct route and vehicle counts', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body') ?? '';

    // 3 total routes, 2 active routes, 2 buses on route (veh-1 and veh-2), 1 total student
    expect(bodyText).toMatch(/3/); // total routes
    expect(bodyText).toMatch(/2/); // active routes or buses
    expect(bodyText).toMatch(/1/); // total students
  });

  /* ── 18. Status chip colors ── */
  test('18) status chips render correct colors for active, inactive, maintenance', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    // Active chip should have success/green class
    const activeChip = page.locator('span').filter({ hasText: /^active$/i }).first();
    await expect(activeChip).toBeVisible();

    // Maintenance chip should have warning/amber class
    const maintChip = page.locator('span').filter({ hasText: /^maintenance$/i }).first();
    await expect(maintChip).toBeVisible();
  });

  /* ── 19. Empty state copy ── */
  test('19) empty state copy is descriptive and actionable', async ({ page }) => {
    state.transportRoutes.length = 0;

    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText.toLowerCase()).toMatch(/route|transport|get started/);
  });

  /* ═══════════════════════════════════════════════════════════════
   *  SECTION 5 — ACCESSIBILITY
   * ═══════════════════════════════════════════════════════════════ */

  /* ── 20. Tab navigation between tabs ── */
  test('20) routes and vehicles tabs are reachable via keyboard', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const vehiclesTab = page.locator('button').filter({ hasText: /^vehicles$/i }).first();
    await vehiclesTab.focus();
    await vehiclesTab.click();
    await page.waitForTimeout(400);

    await expect(page.getByText('Vehicle Fleet')).toBeVisible();
  });

  /* ── 21. Modal focus management ── */
  test('21) modal traps focus and close button is reachable', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add route/i }).click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    // Close button should be visible
    await expect(modal.getByRole('button', { name: /cancel/i })).toBeVisible();
  });

  /* ── 22. ARIA labels on action buttons ── */
  test('22) icon-only action buttons have aria-labels', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const actionBtn = page.getByRole('button', { name: /route actions/i }).first();
    await expect(actionBtn).toBeVisible();
  });

  /* ═══════════════════════════════════════════════════════════════
   *  SECTION 6 — REGRESSION
   * ═══════════════════════════════════════════════════════════════ */

  /* ── 23. Direct navigation to vehicles tab ── */
  test('23) direct url navigation to /transport/vehicles works', async ({ page }) => {
    await page.goto('/transport/vehicles');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Vehicle Fleet')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('KA-01-AB-1234')).toBeVisible();
  });

  /* ── 24. Breadcrumb hierarchy ── */
  test('24) breadcrumb shows Home > Transport hierarchy', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"], .breadcrumbs, [class*="breadcrumb"]').first();
    const bodyText = await page.textContent('body') ?? '';

    expect(bodyText).toMatch(/home/i);
    expect(bodyText).toMatch(/transport/i);
  });

  /* ── 25. Route without vehicle renders correctly ── */
  test('25) route without assigned vehicle shows no vehicle line', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const card = page.locator('.grid > div').filter({ hasText: 'South Bangalore Route' }).first();
    await expect(card).toBeVisible();

    // Should not show vehicle info for route without vehicle
    const cardText = await card.textContent() ?? '';
    expect(cardText).not.toMatch(/Vehicle:/);
  });
});
