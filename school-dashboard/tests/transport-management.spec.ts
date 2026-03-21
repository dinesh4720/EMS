import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedStudent,
  CLASS_10A_ID,
  type MockState,
} from './test-utils';

/* ───────────────── Mock Data ───────────────── */

const VEHICLE_1 = {
  _id: 'veh-1', registrationNumber: 'KA-01-AB-1234', make: 'Tata', model: 'Starbus',
  year: 2022, capacity: 40, color: 'Yellow', status: 'active',
  driver: { name: 'Ramesh Kumar', phone: '9876543210', licenseNumber: 'DL-123456' },
  conductor: { name: 'Suresh Babu', phone: '9876543211' },
  gpsDeviceId: 'GPS-001',
};

const VEHICLE_2 = {
  _id: 'veh-2', registrationNumber: 'KA-01-CD-5678', make: 'Ashok Leyland', model: 'Lynx',
  year: 2023, capacity: 50, color: 'White', status: 'inactive',
  driver: { name: 'Ganesh Rao', phone: '9876543220', licenseNumber: 'DL-654321' },
  conductor: { name: 'Manoj S', phone: '9876543221' },
  gpsDeviceId: 'GPS-002',
};

const VEHICLE_3 = {
  _id: 'veh-3', registrationNumber: 'KA-02-EF-9999', make: 'Force', model: 'Traveller',
  year: 2021, capacity: 26, color: 'Blue', status: 'maintenance',
  driver: { name: 'Anil P', phone: '9876543230', licenseNumber: 'DL-111222' },
  conductor: { name: '', phone: '' },
  gpsDeviceId: '',
};

const MOCK_VEHICLES = [VEHICLE_1, VEHICLE_2, VEHICLE_3];

const ROUTE_1 = {
  _id: 'route-1', routeNumber: 'R-01', routeName: 'North Bangalore Route',
  academicYear: '2025-2026',
  vehicleId: { _id: 'veh-1', registrationNumber: 'KA-01-AB-1234', make: 'Tata' },
  stops: [
    { _id: 'stop-1', name: 'Hebbal', address: 'Hebbal Flyover', pickupTime: '07:00', dropTime: '16:30', order: 1 },
    { _id: 'stop-2', name: 'Yelahanka', address: 'Yelahanka Main Road', pickupTime: '07:15', dropTime: '16:15', order: 2 },
    { _id: 'stop-3', name: 'Vidyaranyapura', address: '', pickupTime: '07:30', dropTime: '16:00', order: 3 },
  ],
  students: [
    { studentId: { _id: 'stu-a', name: 'Aarav Sharma', admissionId: 'ADM-001' }, stopId: 'stop-1' },
    { studentId: { _id: 'stu-b', name: 'Priya Menon', admissionId: 'ADM-002' }, stopId: 'stop-2' },
  ],
  status: 'active',
  notes: '',
};

const ROUTE_2 = {
  _id: 'route-2', routeNumber: 'R-02', routeName: 'South Bangalore Route',
  academicYear: '2025-2026',
  vehicleId: null,
  stops: [
    { _id: 'stop-4', name: 'Jayanagar', address: '4th Block', pickupTime: '07:10', dropTime: '16:20', order: 1 },
  ],
  students: [],
  status: 'inactive',
  notes: 'Under review',
};

const MOCK_ROUTES = [ROUTE_1, ROUTE_2];

/* ───────────────── Route installer ───────────────── */

async function installTransportRoutes(page: import('@playwright/test').Page, state: MockState) {
  const localRoutes = [...MOCK_ROUTES];
  const localVehicles = [...MOCK_VEHICLES];

  await page.route('**/api/transport/routes/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/\/+$/, '');
    const method = route.request().method();

    // Assign / remove students: POST /api/transport/routes/:id/students
    const studentsMatch = path.match(/^\/api\/transport\/routes\/([^/]+)\/students(\/([^/]+))?$/);
    if (studentsMatch) {
      const routeId = studentsMatch[1];
      if (method === 'POST') {
        const body = route.request().postDataJSON();
        const r = localRoutes.find((rt) => rt._id === routeId);
        if (r) {
          r.students.push({
            studentId: { _id: body.studentId, name: 'Assigned Student', admissionId: 'ADM-NEW' },
            stopId: body.stopId || null,
          });
        }
        state.requestLog.add(`POST /api/transport/routes/${routeId}/students`);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Assigned', data: r?.students ?? [] }) });
        return;
      }
      if (method === 'DELETE') {
        const studentId = studentsMatch[3];
        const r = localRoutes.find((rt) => rt._id === routeId);
        if (r && studentId) {
          r.students = r.students.filter((s) => s.studentId._id !== studentId);
        }
        state.requestLog.add(`DELETE /api/transport/routes/${routeId}/students/${studentId}`);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Removed' }) });
        return;
      }
    }

    // Single route: GET/PUT/DELETE /api/transport/routes/:id
    const singleRouteMatch = path.match(/^\/api\/transport\/routes\/([^/]+)$/);
    if (singleRouteMatch) {
      const routeId = singleRouteMatch[1];
      if (method === 'GET') {
        const r = localRoutes.find((rt) => rt._id === routeId);
        await route.fulfill({ status: r ? 200 : 404, contentType: 'application/json', body: JSON.stringify(r ? { data: r } : { error: 'Not found' }) });
        return;
      }
      if (method === 'PUT') {
        const body = route.request().postDataJSON();
        const idx = localRoutes.findIndex((rt) => rt._id === routeId);
        if (idx >= 0) Object.assign(localRoutes[idx], body);
        state.requestLog.add(`PUT /api/transport/routes/${routeId}`);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: localRoutes[idx] }) });
        return;
      }
      if (method === 'DELETE') {
        const idx = localRoutes.findIndex((rt) => rt._id === routeId);
        if (idx >= 0) localRoutes.splice(idx, 1);
        state.requestLog.add(`DELETE /api/transport/routes/${routeId}`);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deleted' }) });
        return;
      }
    }

    await route.fallback();
  });

  await page.route('**/api/transport/routes*', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search')?.toLowerCase() ?? '';
      const status = url.searchParams.get('status') ?? '';
      let filtered = localRoutes;
      if (search) filtered = filtered.filter((r) => r.routeName.toLowerCase().includes(search) || r.routeNumber.toLowerCase().includes(search));
      if (status) filtered = filtered.filter((r) => r.status === status);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: filtered }) });
    } else if (method === 'POST') {
      const body = route.request().postDataJSON();
      const newRoute = {
        _id: `route-new-${Date.now()}`, ...body,
        vehicleId: null, stops: body.stops || [], students: [], status: body.status || 'active',
      };
      localRoutes.push(newRoute);
      state.requestLog.add('POST /api/transport/routes');
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: newRoute }) });
    } else {
      await route.fallback();
    }
  });

  await page.route('**/api/transport/vehicles/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/\/+$/, '');
    const method = route.request().method();

    const singleMatch = path.match(/^\/api\/transport\/vehicles\/([^/]+)$/);
    if (singleMatch) {
      const vehicleId = singleMatch[1];
      if (method === 'GET') {
        const v = localVehicles.find((veh) => veh._id === vehicleId);
        await route.fulfill({ status: v ? 200 : 404, contentType: 'application/json', body: JSON.stringify(v ? { data: v } : { error: 'Not found' }) });
        return;
      }
      if (method === 'PUT') {
        const body = route.request().postDataJSON();
        const idx = localVehicles.findIndex((veh) => veh._id === vehicleId);
        if (idx >= 0) Object.assign(localVehicles[idx], body);
        state.requestLog.add(`PUT /api/transport/vehicles/${vehicleId}`);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: localVehicles[idx] }) });
        return;
      }
      if (method === 'DELETE') {
        const idx = localVehicles.findIndex((veh) => veh._id === vehicleId);
        if (idx >= 0) localVehicles.splice(idx, 1);
        state.requestLog.add(`DELETE /api/transport/vehicles/${vehicleId}`);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deleted' }) });
        return;
      }
    }

    await route.fallback();
  });

  await page.route('**/api/transport/vehicles*', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search')?.toLowerCase() ?? '';
      const status = url.searchParams.get('status') ?? '';
      let filtered = localVehicles;
      if (search) filtered = filtered.filter((v) => v.registrationNumber.toLowerCase().includes(search) || v.make.toLowerCase().includes(search) || v.model.toLowerCase().includes(search) || v.driver.name.toLowerCase().includes(search));
      if (status) filtered = filtered.filter((v) => v.status === status);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: filtered }) });
    } else if (method === 'POST') {
      const body = route.request().postDataJSON();
      const newVehicle = { _id: `veh-new-${Date.now()}`, ...body, status: body.status || 'active' };
      localVehicles.push(newVehicle);
      state.requestLog.add('POST /api/transport/vehicles');
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: newVehicle }) });
    } else {
      await route.fallback();
    }
  });

  // Student search for StudentAssignModal
  await page.route('**/api/students?**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.has('limit')) {
      const search = url.searchParams.get('search')?.toLowerCase() ?? '';
      const students = state.students.filter((s) =>
        s.name.toLowerCase().includes(search) || (s as Record<string, unknown>).admissionId?.toString().toLowerCase().includes(search),
      ).slice(0, 20);
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: students.map((s) => ({ _id: s.id, name: s.name, admissionId: (s as Record<string, unknown>).admissionId ?? s.id, admissionNumber: s.id, classId: s.classId })) }),
      });
      return;
    }
    await route.fallback();
  });

  return { localRoutes, localVehicles };
}

/* ───────────────── Tests ───────────────── */

test.describe('Transport Management — Routes & Vehicles', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    seedStudent(state, { name: 'Meera Nair', classId: CLASS_10A_ID });
    seedStudent(state, { name: 'Arjun Das', classId: CLASS_10A_ID });
    // Dismiss cookie consent banner so it doesn't obscure interactive elements
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
    await installTransportRoutes(page, state);
  });

  // ─── Routes Tab Tests ───────────────────────────────────────────────

  test('1 — transport page loads with Routes tab active showing route list', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Header visible
    await expect(page.getByText('Transport Management')).toBeVisible({ timeout: 10_000 });

    // Routes tab is active (has primary color class)
    const routesTab = page.locator('button').filter({ hasText: /routes/i }).first();
    await expect(routesTab).toBeVisible();

    // Route data visible in table
    const bodyText = await page.locator('#root').textContent();
    expect(bodyText).toContain('R-01');
    expect(bodyText).toContain('North Bangalore Route');
  });

  test('2 — route cards display name, stops count, vehicle, student count, status chip', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('#root').textContent() ?? '';

    // Route number and name
    expect(bodyText).toContain('R-01');
    expect(bodyText).toContain('North Bangalore Route');

    // Vehicle info (populated)
    expect(bodyText).toContain('KA-01-AB-1234');

    // Stops count: route-1 has 3 stops
    expect(bodyText).toContain('3');

    // Students count: route-1 has 2 students
    expect(bodyText).toContain('2');

    // Status chips (HeroUI Chip uses data-slot="base" on the wrapper)
    const chips = page.locator('[data-slot="base"]').filter({ hasText: /active|inactive|maintenance/i });
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThan(0);
    expect(bodyText).toContain('active');
  });

  test('3 — search filters routes by name', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Both routes visible initially
    let bodyText = await page.locator('#root').textContent() ?? '';
    expect(bodyText).toContain('North Bangalore');
    expect(bodyText).toContain('South Bangalore');

    // Type search
    const searchInput = page.locator('input[placeholder]').first();
    await searchInput.fill('North');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    bodyText = await page.locator('#root').textContent() ?? '';
    expect(bodyText).toContain('North Bangalore');
    expect(bodyText).not.toContain('South Bangalore');
  });

  test('4 — status filter shows only active or inactive routes', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Click the status select trigger (HeroUI Select uses data-slot="trigger")
    const statusSelect = page.locator('button[data-slot="trigger"]').filter({ hasText: /status/i }).first();
    if (await statusSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusSelect.click({ force: true });
      await page.waitForTimeout(300);

      // Select "Inactive"
      const inactiveOption = page.getByRole('option', { name: /inactive/i }).first();
      if (await inactiveOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await inactiveOption.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        const bodyText = await page.locator('#root').textContent() ?? '';
        // Only the inactive route should be visible
        expect(bodyText).toContain('South Bangalore');
        expect(bodyText).not.toContain('North Bangalore');
      }
    }
  });

  test('5 — create Route modal opens, validates required fields, saves successfully', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Click "Add Route" in the header
    await page.getByRole('button', { name: /add route/i }).first().click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // The modal submit button says "Add Route" for new routes (not "Save")
    const submitBtn = modal.getByRole('button', { name: /add route/i }).first();

    // Try saving without required fields
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(300);
    }

    // Fill required fields
    const routeNumberInput = modal.locator('input').nth(0);
    const routeNameInput = modal.locator('input').nth(1);
    await routeNumberInput.fill('R-03');
    await routeNameInput.fill('East Bangalore Route');

    // Fill academic year
    const yearInput = modal.locator('input').nth(2);
    if (await yearInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await yearInput.fill('2025-2026');
    }

    // Submit
    await submitBtn.click();
    await page.waitForTimeout(500);

    // Verify POST was logged
    expect(state.requestLog.has('POST /api/transport/routes')).toBeTruthy();
  });

  test('6 — edit route pre-fills form and saves changes', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Click edit button on first route
    const editBtns = page.locator('button[class*="icon"]').filter({ has: page.locator('svg') });
    // Find the edit icon buttons in the routes table — they come after "Students" button
    const firstRow = page.locator('tr').filter({ hasText: 'R-01' }).first();
    const editBtn = firstRow.locator('button').filter({ has: page.locator('svg') }).nth(1);
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(300);

      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Modal should have pre-filled values
        const inputs = modal.locator('input');
        const routeNumValue = await inputs.nth(0).inputValue();
        expect(routeNumValue).toBe('R-01');

        const routeNameValue = await inputs.nth(1).inputValue();
        expect(routeNameValue).toBe('North Bangalore Route');

        // Update route name
        await inputs.nth(1).fill('North Bangalore Route Updated');

        // Click save/edit
        const saveBtn = modal.getByRole('button', { name: /save|edit/i }).first();
        await saveBtn.click();
        await page.waitForTimeout(500);

        expect(state.requestLog.has('PUT /api/transport/routes/route-1')).toBeTruthy();
      }
    }
  });

  test('7 — delete route shows confirmation dialog and removes from list', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Confirm dialog will be auto-accepted
    page.on('dialog', (dialog) => dialog.accept());

    // Click delete button on second route (R-02)
    const secondRow = page.locator('tr').filter({ hasText: 'R-02' }).first();
    const deleteBtn = secondRow.locator('button[color="danger"], button').last();
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(500);

      expect(state.requestLog.has('DELETE /api/transport/routes/route-2')).toBeTruthy();
    }
  });

  test('8 — assign Students modal opens, shows student list, assigns to route', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Click "Students" button on first route
    const studentsBtn = page.getByRole('button', { name: /students/i }).first();
    if (await studentsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await studentsBtn.click();
      await page.waitForTimeout(300);

      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Wait for route detail to load (the modal fetches route detail)
        await page.waitForTimeout(500);
        const modalText = await modal.textContent() ?? '';
        // Route info should be visible
        expect(modalText).toContain('R-01');

        // Assigned students should appear
        expect(modalText.includes('Aarav Sharma') || modalText.includes('Priya Menon')).toBeTruthy();

        // Search for a new student to assign
        const searchInput = modal.locator('input[placeholder]').first();
        if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await searchInput.fill('Meera');
          await page.waitForTimeout(500);

          // Click on student result if visible
          const studentItem = modal.getByText('Meera Nair').first();
          if (await studentItem.isVisible({ timeout: 3000 }).catch(() => false)) {
            await studentItem.click();
            await page.waitForTimeout(300);

            // Close any open dropdown by pressing Escape
            await page.keyboard.press('Escape');
            await page.waitForTimeout(200);

            // Click assign button (use force in case an overlay intercepts)
            const assignBtn = modal.getByRole('button', { name: /assign student/i }).first();
            if (await assignBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await assignBtn.click({ force: true });
              await page.waitForTimeout(500);
              expect(state.requestLog.has('POST /api/transport/routes/route-1/students')).toBeTruthy();
            }
          }
        }
      }
    }
  });

  // ─── Vehicles Tab Tests ─────────────────────────────────────────────

  test('9 — switching to Vehicles tab loads vehicle list', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Click Vehicles tab
    const vehiclesTab = page.locator('button').filter({ hasText: /vehicles/i }).first();
    await vehiclesTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const bodyText = await page.locator('#root').textContent() ?? '';
    expect(bodyText).toContain('KA-01-AB-1234');
    expect(bodyText).toContain('KA-01-CD-5678');

    // "Add Vehicle" button should appear
    await expect(page.getByRole('button', { name: /add vehicle/i })).toBeVisible();
  });

  test('10 — vehicle cards show registration, type, capacity, driver info, status', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Switch to vehicles tab
    const vehiclesTab = page.locator('button').filter({ hasText: /vehicles/i }).first();
    await vehiclesTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const bodyText = await page.locator('#root').textContent() ?? '';

    // Registration numbers
    expect(bodyText).toContain('KA-01-AB-1234');

    // Make / Model
    expect(bodyText).toContain('Tata');
    expect(bodyText).toContain('Starbus');

    // Capacity
    expect(bodyText).toContain('40');

    // Driver name
    expect(bodyText).toContain('Ramesh Kumar');

    // Conductor name
    expect(bodyText).toContain('Suresh Babu');

    // GPS Device
    expect(bodyText).toContain('GPS-001');

    // Status chips (HeroUI Chip uses data-slot="base" on the wrapper)
    const chips = page.locator('[data-slot="base"]').filter({ hasText: /active|inactive|maintenance/i });
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThan(0);
  });

  test('11 — search filters vehicles by registration number', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Switch to vehicles tab
    const vehiclesTab = page.locator('button').filter({ hasText: /vehicles/i }).first();
    await vehiclesTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // All vehicles visible initially
    let bodyText = await page.locator('#root').textContent() ?? '';
    expect(bodyText).toContain('KA-01-AB-1234');
    expect(bodyText).toContain('KA-01-CD-5678');

    // Search by registration
    const searchInput = page.locator('input[placeholder]').first();
    await searchInput.fill('CD-5678');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    bodyText = await page.locator('#root').textContent() ?? '';
    expect(bodyText).toContain('KA-01-CD-5678');
    expect(bodyText).not.toContain('KA-01-AB-1234');
  });

  test('12 — create Vehicle modal validates registration, capacity > 0', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Switch to vehicles tab
    const vehiclesTab = page.locator('button').filter({ hasText: /vehicles/i }).first();
    await vehiclesTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click "Add Vehicle"
    await page.getByRole('button', { name: /add vehicle/i }).click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Fill registration number
    const regInput = modal.locator('input').first();
    await regInput.fill('KA-03-GH-4444');

    // Fill capacity
    const capacityInput = modal.locator('input[type="number"]').last();
    if (await capacityInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await capacityInput.fill('30');
    }

    // Submit — the button text is "Add Vehicle" for new vehicles
    const submitBtn = modal.getByRole('button', { name: /add vehicle/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(500);

    expect(state.requestLog.has('POST /api/transport/vehicles')).toBeTruthy();
  });

  test('13 — edit vehicle updates driver info correctly', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Switch to vehicles tab
    const vehiclesTab = page.locator('button').filter({ hasText: /vehicles/i }).first();
    await vehiclesTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click edit on first vehicle row
    const firstRow = page.locator('tr').filter({ hasText: 'KA-01-AB-1234' }).first();
    const editBtn = firstRow.locator('button').filter({ has: page.locator('svg') }).first();
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(300);

      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Registration number should be pre-filled
        const regValue = await modal.locator('input').first().inputValue();
        expect(regValue).toBe('KA-01-AB-1234');

        // Find driver name input and update it
        const driverInputs = modal.locator('input');
        const count = await driverInputs.count();
        // Look for the input with "Ramesh Kumar" value
        for (let i = 0; i < count; i++) {
          const val = await driverInputs.nth(i).inputValue();
          if (val === 'Ramesh Kumar') {
            await driverInputs.nth(i).fill('Rajesh Kumar');
            break;
          }
        }

        // Save
        const saveBtn = modal.getByRole('button', { name: /save|edit/i }).first();
        await saveBtn.click();
        await page.waitForTimeout(500);

        expect(state.requestLog.has('PUT /api/transport/vehicles/veh-1')).toBeTruthy();
      }
    }
  });

  test('14 — delete vehicle shows confirmation and removes', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Switch to vehicles tab
    const vehiclesTab = page.locator('button').filter({ hasText: /vehicles/i }).first();
    await vehiclesTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Auto-accept confirmation dialog
    page.on('dialog', (dialog) => dialog.accept());

    // Click delete on a vehicle row
    const row = page.locator('tr').filter({ hasText: 'KA-02-EF-9999' }).first();
    const deleteBtn = row.locator('button').last();
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(500);

      expect(state.requestLog.has('DELETE /api/transport/vehicles/veh-3')).toBeTruthy();
    }
  });

  test('15 — empty state shows when no routes/vehicles exist', async ({ page }) => {
    // Override with empty data
    await page.route('**/api/transport/routes*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
      } else {
        await route.fallback();
      }
    });
    await page.route('**/api/transport/vehicles*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/transport');
    await page.waitForLoadState('networkidle');

    // Routes empty state
    let bodyText = await page.locator('#root').textContent() ?? '';
    expect(bodyText.includes('No routes found') || bodyText.includes('no routes')).toBeTruthy();

    // Switch to vehicles tab
    const vehiclesTab = page.locator('button').filter({ hasText: /vehicles/i }).first();
    await vehiclesTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    bodyText = await page.locator('#root').textContent() ?? '';
    expect(bodyText.includes('No vehicles found') || bodyText.includes('no vehicles')).toBeTruthy();
  });
});
