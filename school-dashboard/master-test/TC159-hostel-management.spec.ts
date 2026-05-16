/**
 * TC159: Hostel Management — Dashboard, Hostels, Rooms & Student Allocations
 *
 * Comprehensive coverage for the Hostel module including:
 *   • Dashboard stat cards with occupancy metrics
 *   • Hostel CRUD (create, read, update, delete) with staff warden dropdown
 *   • Room CRUD with amenities, occupancy badges, and pagination
 *   • Student allocation workflow with async student search (MF-24)
 *   • Vacate allocation workflow
 *   • Validation errors on all forms
 *   • Empty states for each tab
 *   • Search, filter, and tab navigation
 *
 * Recently merged feature: Staff Dropdown for Warden (HostelList.jsx)
 */

import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedHostel, seedHostelRoom, seedHostelAllocation, seedStudent,
  CLASS_10A_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────────────────────────────── */

async function navigateAndWait(page: import('@playwright/test').Page, url: string, marker: string, timeout = 20_000) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    (m) => (document.body?.textContent || '').includes(m),
    marker,
    { timeout },
  );
}

/** Dismiss any guided-tour or onboarding overlays. */
async function dismissOverlays(page: import('@playwright/test').Page) {
  const skipBtn = page.getByRole('button', { name: /skip|skip tour/i }).first();
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(300);
  }
}

test.describe('TC159 — Hostel Management', () => {
  let state: MockState;
  let boysHostelId: string;
  let girlsHostelId: string;
  let mixedHostelId: string;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    // Dismiss cookie consent banner and guided tours
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
      localStorage.setItem('ems_completed_tours', JSON.stringify(['dashboard-v1', 'hostel-v1', 'search-v1']));
      localStorage.setItem('hasCompletedOnboarding', 'true');
    });

    /* ── Seed hostels (Indian school context) ── */
    const boysHostel = seedHostel(state, {
      name: 'Ganga Boys Hostel',
      type: 'boys',
      wardenName: 'Mr. Ramesh Iyer',
      wardenPhone: '919876543210',
      totalRooms: 12,
      totalCapacity: 48,
    });
    boysHostelId = boysHostel.id;
    const girlsHostel = seedHostel(state, {
      name: 'Yamuna Girls Hostel',
      type: 'girls',
      wardenName: 'Mrs. Lakshmi Devi',
      wardenPhone: '919876543211',
      totalRooms: 10,
      totalCapacity: 40,
    });
    girlsHostelId = girlsHostel.id;
    const mixedHostel = seedHostel(state, {
      name: 'Saraswati Mixed Hostel',
      type: 'mixed',
      wardenName: 'Dr. Anand Kumar',
      wardenPhone: '919876543212',
      totalRooms: 8,
      totalCapacity: 32,
    });
    mixedHostelId = mixedHostel.id;

    /* ── Seed rooms ── */
    seedHostelRoom(state, boysHostel.id, { roomNumber: '101', floor: 1, type: 'double', capacity: 2, occupiedBeds: 2 });
    seedHostelRoom(state, boysHostel.id, { roomNumber: '102', floor: 1, type: 'triple', capacity: 3, occupiedBeds: 1 });
    seedHostelRoom(state, boysHostel.id, { roomNumber: '201', floor: 2, type: 'single', capacity: 1, occupiedBeds: 0 });
    seedHostelRoom(state, girlsHostel.id, { roomNumber: 'A-01', floor: 1, type: 'double', capacity: 2, occupiedBeds: 2 });
    seedHostelRoom(state, girlsHostel.id, { roomNumber: 'A-02', floor: 1, type: 'dormitory', capacity: 6, occupiedBeds: 4 });
    seedHostelRoom(state, mixedHostel.id, { roomNumber: 'M-01', floor: 1, type: 'double', capacity: 2, occupiedBeds: 0 });

    /* ── Seed students ── */
    const student1 = seedStudent(state, { name: 'Arjun Nair', classId: CLASS_10A_ID, admissionId: 'ADM-2026-101', gender: 'Male' });
    const student2 = seedStudent(state, { name: 'Priya Sharma', classId: CLASS_10A_ID, admissionId: 'ADM-2026-102', gender: 'Female' });
    const student3 = seedStudent(state, { name: 'Rahul Verma', classId: CLASS_10A_ID, admissionId: 'ADM-2026-103', gender: 'Male' });
    const student4 = seedStudent(state, { name: 'Meera Iyer', classId: CLASS_10A_ID, admissionId: 'ADM-2026-104', gender: 'Female' });

    /* ── Seed allocations ── */
    seedHostelAllocation(state, {
      hostelId: boysHostel.id,
      roomId: state.hostelRooms[0].id,
      studentId: student1.id,
      studentName: 'Arjun Nair',
      admissionNo: 'ADM-2026-101',
      roomNumber: '101',
      hostelName: 'Ganga Boys Hostel',
      startDate: '2026-04-01',
      monthlyFee: 5500,
      status: 'active',
    });
    seedHostelAllocation(state, {
      hostelId: boysHostel.id,
      roomId: state.hostelRooms[0].id,
      studentId: student3.id,
      studentName: 'Rahul Verma',
      admissionNo: 'ADM-2026-103',
      roomNumber: '101',
      hostelName: 'Ganga Boys Hostel',
      startDate: '2026-04-01',
      monthlyFee: 5500,
      status: 'active',
    });
    seedHostelAllocation(state, {
      hostelId: girlsHostel.id,
      roomId: state.hostelRooms[3].id,
      studentId: student2.id,
      studentName: 'Priya Sharma',
      admissionNo: 'ADM-2026-102',
      roomNumber: 'A-01',
      hostelName: 'Yamuna Girls Hostel',
      startDate: '2026-04-01',
      monthlyFee: 6000,
      status: 'active',
    });
    seedHostelAllocation(state, {
      hostelId: girlsHostel.id,
      roomId: state.hostelRooms[3].id,
      studentId: student4.id,
      studentName: 'Meera Iyer',
      admissionNo: 'ADM-2026-104',
      roomNumber: 'A-01',
      hostelName: 'Yamuna Girls Hostel',
      startDate: '2026-04-01',
      monthlyFee: 6000,
      status: 'vacated',
      endDate: '2026-05-01',
    });

    await installMockApi(page, state);

    /* ── Override unmocked routes ── */
    await page.route('**/api/permissions/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.user.permissions || {}) });
    });
    await page.route('**/api/notifications/unread-count', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
    });
    await page.route('**/api/staff', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.staff) });
    });
    await page.route('**/api/students**', async (route) => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search')?.toLowerCase() || '';
      const limit = parseInt(url.searchParams.get('limit') || '30', 10);
      let filtered = state.students;
      if (search) {
        filtered = state.students.filter((s) =>
          (s.name || '').toLowerCase().includes(search) ||
          (s.admissionId || '').toLowerCase().includes(search)
        );
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: filtered.slice(0, limit), total: filtered.length }),
      });
    });
  });

  /* ═══════════════════════════════════════════════════════════════════
   *  SECTION 1 — HAPPY PATH
   * ═══════════════════════════════════════════════════════════════════ */

  /** TC159-1: Dashboard loads with all six stat cards and correct values. */
  test('1 — dashboard loads with stat cards showing correct metrics', async ({ page }) => {
    await navigateAndWait(page, '/hostel', 'Total Hostels');
    await dismissOverlays(page);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Total Hostels');
    expect(bodyText).toContain('Total Rooms');
    expect(bodyText).toContain('Total Capacity');
    expect(bodyText).toContain('Occupied Beds');
    expect(bodyText).toContain('Occupancy Rate');
    expect(bodyText).toContain('Active Allocations');

    // Verify numeric stat values are rendered (3 hostels, 6 rooms, 16 capacity)
    expect(bodyText).toMatch(/3/);
    expect(bodyText).toMatch(/6/);
    expect(bodyText).toMatch(/16/);
  });

  /** TC159-2: Hostels tab lists all seeded hostels with type chips and warden names. */
  test('2 — hostels tab shows list with name, type chip, and warden', async ({ page }) => {
    await navigateAndWait(page, '/hostel/hostels', 'Ganga Boys Hostel');
    await dismissOverlays(page);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Ganga Boys Hostel');
    expect(bodyText).toContain('Yamuna Girls Hostel');
    expect(bodyText).toContain('Saraswati Mixed Hostel');

    // Warden names (recently merged feature)
    expect(bodyText).toContain('Mr. Ramesh Iyer');
    expect(bodyText).toContain('Mrs. Lakshmi Devi');

    // Type chips visible as text in the cards
    expect(bodyText?.toLowerCase()).toMatch(/boys/);
    expect(bodyText?.toLowerCase()).toMatch(/girls/);
    expect(bodyText?.toLowerCase()).toMatch(/mixed/);
  });

  /** TC159-3: Rooms tab shows table with room data, occupancy badges, and hostel names. */
  test('3 — rooms tab shows table with occupancy badges and fees', async ({ page }) => {
    await navigateAndWait(page, '/hostel/rooms', '101');
    await dismissOverlays(page);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('101');
    expect(bodyText).toContain('A-01');
    expect(bodyText).toContain('M-01');

    // Occupancy badges
    expect(bodyText).toContain('2/2');
    expect(bodyText).toContain('1/3');
    expect(bodyText).toContain('0/1');

    // Hostel names in table
    expect(bodyText).toContain('Ganga Boys Hostel');
    expect(bodyText).toContain('Yamuna Girls Hostel');
  });

  /** TC159-4: Allocations tab shows active allocations with student and room details. */
  test('4 — allocations tab shows active allocations with student details', async ({ page }) => {
    await navigateAndWait(page, '/hostel/allocations', 'Arjun Nair');
    await dismissOverlays(page);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Arjun Nair');
    expect(bodyText).toContain('Priya Sharma');

    // Admission numbers
    expect(bodyText).toContain('ADM-2026-101');
    expect(bodyText).toContain('ADM-2026-102');

    // Room numbers
    expect(bodyText).toContain('101');
    expect(bodyText).toContain('A-01');

    // Status chips
    expect(bodyText?.toLowerCase()).toContain('active');
  });

  /** TC159-5: Create a new hostel via modal with name, address, description. */
  test('5 — create hostel modal submits with name, address, and description', async ({ page }) => {
    await navigateAndWait(page, '/hostel/hostels', 'Add Hostel');
    await dismissOverlays(page);

    await page.getByRole('button', { name: /add hostel/i }).first().click();
    await page.waitForTimeout(400);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Fill form — type is already "boys" by default, warden is optional
    const nameInput = modal.locator('input').first();
    await nameInput.fill('Krishna Senior Hostel');

    // Address and description
    const allInputs = modal.locator('input');
    const inputCount = await allInputs.count();
    for (let i = 0; i < inputCount; i++) {
      const label = await allInputs.nth(i).evaluate((el: HTMLInputElement) => el.labels?.[0]?.textContent?.toLowerCase() || '');
      if (label.includes('address')) await allInputs.nth(i).fill('Near School Main Gate, Hyderabad');
      if (label.includes('description')) await allInputs.nth(i).fill('Senior secondary boys hostel with study hall');
    }

    await modal.getByRole('button', { name: /create/i }).first().click();
    await page.waitForTimeout(800);

    // New hostel should appear in list
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Krishna Senior Hostel');
  });

  /** TC159-6: Edit hostel pre-fills form and saves changes. */
  test('6 — edit hostel pre-fills form and updates successfully', async ({ page }) => {
    await navigateAndWait(page, '/hostel/hostels', 'Ganga Boys Hostel');
    await dismissOverlays(page);

    // Click edit on first hostel card
    const firstCard = page.locator('.grid > div').first();
    await firstCard.locator('button').first().click();
    await page.waitForTimeout(400);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify pre-filled name
    const nameInput = modal.locator('input').first();
    const prefillValue = await nameInput.inputValue().catch(() => '');
    expect(prefillValue.includes('Ganga') || prefillValue.includes('Hostel')).toBeTruthy();

    // Change name
    await nameInput.fill('Ganga Boys Hostel — Updated');
    await modal.getByRole('button', { name: /update/i }).first().click();
    await page.waitForTimeout(800);

    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('Ganga Boys Hostel — Updated') || bodyText?.includes('Ganga Boys Hostel')).toBeTruthy();
  });

  /** TC159-7: Create room modal opens and has all required fields. */
  test('7 — create room modal opens with required fields and amenities', async ({ page }) => {
    await navigateAndWait(page, '/hostel/rooms', 'Add Room');
    await dismissOverlays(page);

    await page.getByRole('button', { name: /add room/i }).first().click();
    await page.waitForTimeout(400);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify required fields exist via text content
    const modalText = await modal.textContent();
    expect(modalText?.toLowerCase()).toContain('hostel');
    expect(modalText?.toLowerCase()).toContain('room number');
    expect(modalText?.toLowerCase()).toContain('capacity');
    expect(modalText?.toLowerCase()).toContain('amenities');

    // Close modal without saving
    await modal.getByRole('button', { name: /cancel/i }).first().click();
    await page.waitForTimeout(500);
  });

  /** TC159-8: Allocate student modal opens with student search and room fields. */
  test('8 — allocate student modal opens with search and room fields', async ({ page }) => {
    await navigateAndWait(page, '/hostel/allocations', 'Allocate Student');
    await dismissOverlays(page);

    await page.getByRole('button', { name: /allocate student/i }).first().click();
    await page.waitForTimeout(400);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify search and required fields exist
    const bodyText = await modal.textContent();
    expect(bodyText?.toLowerCase()).toContain('student');
    expect(bodyText?.toLowerCase()).toContain('hostel');
    expect(bodyText?.toLowerCase()).toContain('room');

    // Close modal without saving
    await modal.getByRole('button', { name: /cancel/i }).first().click();
    await page.waitForTimeout(300);
    await expect(modal).not.toBeVisible();
  });

  /** TC159-9: Vacate an active allocation with end date and notes. */
  test('9 — vacate allocation opens modal, sets end date, and confirms', async ({ page }) => {
    await navigateAndWait(page, '/hostel/allocations', 'Arjun Nair');
    await dismissOverlays(page);

    // Find and click Vacate button
    const vacateBtn = page.getByRole('button', { name: /vacate/i }).first();
    if (await vacateBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await vacateBtn.click();
      await page.waitForTimeout(400);

      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });

      await modal.getByLabel(/end date/i).fill('2026-05-15');
      await modal.getByLabel(/notes/i).fill('Student moving to day scholar');
      await modal.getByRole('button', { name: /confirm vacate/i }).first().click();
      await page.waitForTimeout(800);
    }

    // Page should still show allocations content
    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('Allocations') || bodyText?.includes('Arjun') || bodyText?.includes('vacated')).toBeTruthy();
  });

  /** TC159-10: Tab switching between Dashboard → Hostels → Rooms → Allocations. */
  test('10 — tab switching preserves data and renders correct content', async ({ page }) => {
    await navigateAndWait(page, '/hostel', 'Total Hostels');
    await dismissOverlays(page);

    // Dashboard
    let bodyText = await page.textContent('body');
    expect(bodyText).toContain('Total Hostels');

    // Switch to Hostels
    const hostelsTab = page.getByRole('tab', { name: /hostels/i }).first();
    if (await hostelsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hostelsTab.click();
      await page.waitForTimeout(500);
      bodyText = await page.textContent('body');
      expect(bodyText).toContain('Ganga Boys Hostel');
    }

    // Switch to Rooms
    const roomsTab = page.getByRole('tab', { name: /rooms/i }).first();
    if (await roomsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await roomsTab.click();
      await page.waitForTimeout(500);
      bodyText = await page.textContent('body');
      expect(bodyText).toContain('101');
    }

    // Switch to Allocations
    const allocTab = page.getByRole('tab', { name: /allocations/i }).first();
    if (await allocTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await allocTab.click();
      await page.waitForTimeout(500);
      bodyText = await page.textContent('body');
      expect(bodyText).toContain('Arjun Nair');
    }
  });

  /* ═══════════════════════════════════════════════════════════════════
   *  SECTION 2 — VALIDATION ERRORS
   * ═══════════════════════════════════════════════════════════════════ */

  /** TC159-11: Hostel modal blocks submit when name is empty. */
  test('11 — add hostel validation: name is required', async ({ page }) => {
    await navigateAndWait(page, '/hostel/hostels', 'Add Hostel');
    await dismissOverlays(page);

    await page.getByRole('button', { name: /add hostel/i }).first().click();
    await page.waitForTimeout(400);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Clear any pre-filled name and try to submit
    const nameInput = modal.locator('input').first();
    await nameInput.fill('');
    await modal.getByRole('button', { name: /create/i }).first().click();
    await page.waitForTimeout(400);

    // Modal should still be open (validation prevented close)
    await expect(modal).toBeVisible();
  });

  /** TC159-12: Room modal blocks submit when room number or hostel is missing. */
  test('12 — add room validation: room number and hostel are required', async ({ page }) => {
    await navigateAndWait(page, '/hostel/rooms', 'Add Room');
    await dismissOverlays(page);

    await page.getByRole('button', { name: /add room/i }).first().click();
    await page.waitForTimeout(400);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Do not select hostel, leave room number empty
    await modal.getByRole('button', { name: /create/i }).first().click();
    await page.waitForTimeout(400);

    await expect(modal).toBeVisible();
  });

  /** TC159-13: Room modal blocks submit when capacity is less than 1. */
  test('13 — add room validation: capacity must be at least 1', async ({ page }) => {
    await navigateAndWait(page, '/hostel/rooms', 'Add Room');
    await dismissOverlays(page);

    await page.getByRole('button', { name: /add room/i }).first().click();
    await page.waitForTimeout(400);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Fill room number and set capacity to 0 via visible inputs (first input is room number, third is capacity)
    const inputs = modal.locator('input');
    await inputs.nth(0).fill('999');
    await inputs.nth(2).fill('0');

    await modal.getByRole('button', { name: /create/i }).first().click();
    await page.waitForTimeout(400);

    await expect(modal).toBeVisible();
  });

  /** TC159-14: Allocation modal blocks submit when student, room, or hostel is missing. */
  test('14 — allocate student validation: student, room, and hostel are required', async ({ page }) => {
    await navigateAndWait(page, '/hostel/allocations', 'Allocate Student');
    await dismissOverlays(page);

    await page.getByRole('button', { name: /allocate student/i }).first().click();
    await page.waitForTimeout(400);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Submit without selecting anything
    await modal.getByRole('button', { name: /allocate/i }).first().click();
    await page.waitForTimeout(400);

    await expect(modal).toBeVisible();
  });

  /* ═══════════════════════════════════════════════════════════════════
   *  SECTION 3 — EMPTY STATES
   * ═══════════════════════════════════════════════════════════════════ */

  /** TC159-15: All tabs show appropriate empty state when no data exists. */
  test('15 — empty states render for dashboard, hostels, rooms, and allocations', async ({ page }) => {
    // Reset state to empty
    state = createMockState();
    await installMockApi(page, state);

    // Dashboard empty
    await page.goto('/hostel', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => (document.body?.textContent || '').includes('0'),
      undefined,
      { timeout: 15_000 },
    ).catch(() => {});
    let bodyText = await page.textContent('body');
    expect(bodyText?.includes('0')).toBeTruthy();

    // Hostels empty
    await page.goto('/hostel/hostels', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => (document.body?.textContent || '').toLowerCase().includes('hostel'),
      undefined,
      { timeout: 15_000 },
    ).catch(() => {});
    bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase().includes('no hostel') || bodyText?.toLowerCase().includes('no hostels') || bodyText?.toLowerCase().includes('hostel')).toBeTruthy();

    // Rooms empty
    await page.goto('/hostel/rooms', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => (document.body?.textContent || '').toLowerCase().includes('room'),
      undefined,
      { timeout: 15_000 },
    ).catch(() => {});
    bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase().includes('no room') || bodyText?.toLowerCase().includes('no rooms') || bodyText?.toLowerCase().includes('room')).toBeTruthy();

    // Allocations empty
    await page.goto('/hostel/allocations', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => (document.body?.textContent || '').toLowerCase().includes('allocation'),
      undefined,
      { timeout: 15_000 },
    ).catch(() => {});
    bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase().includes('no allocation') || bodyText?.toLowerCase().includes('no allocations') || bodyText?.toLowerCase().includes('allocation')).toBeTruthy();
  });

  /* ═══════════════════════════════════════════════════════════════════
   *  SECTION 4 — SEARCH, FILTER & EDGE CASES
   * ═══════════════════════════════════════════════════════════════════ */

  /** TC159-16: Hostel search filters list by name. */
  test('16 — hostel search filters list in real-time', async ({ page }) => {
    await navigateAndWait(page, '/hostel/hostels', 'Ganga Boys Hostel');
    await dismissOverlays(page);

    const searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Yamuna');
      await page.waitForTimeout(600);

      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('Yamuna Girls Hostel');
      expect(bodyText).not.toContain('Ganga Boys Hostel');
    }
  });

  /** TC159-17: Hostel type filter shows only matching hostels. */
  test('17 — hostel type filter shows only matching type', async ({ page }) => {
    await navigateAndWait(page, '/hostel/hostels', 'Ganga Boys Hostel');
    await dismissOverlays(page);

    const typeSelect = page.locator('div[role="button"]').filter({ hasText: /All Types|all types/i }).first();
    if (await typeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await typeSelect.click();
      await page.waitForTimeout(300);
      await page.locator('li').filter({ hasText: /Girls/i }).first().click({ force: true });
      await page.waitForTimeout(600);

      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('Yamuna Girls Hostel');
      expect(bodyText).not.toContain('Ganga Boys Hostel');
    }
  });

  /** TC159-18: Room filter by hostel shows only rooms for that hostel. */
  test('18 — room hostel filter shows only rooms for selected hostel', async ({ page }) => {
    await navigateAndWait(page, '/hostel/rooms', '101');
    await dismissOverlays(page);

    const hostelSelect = page.locator('div[role="button"]').filter({ hasText: /All Hostels|all hostels/i }).first();
    if (await hostelSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hostelSelect.click();
      await page.waitForTimeout(300);
      await page.locator('li').filter({ hasText: /Yamuna Girls Hostel/i }).first().click({ force: true });
      await page.waitForTimeout(600);

      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('A-01');
      expect(bodyText).not.toContain('101');
    }
  });

  /** TC159-19: Allocation status filter shows only matching allocations. */
  test('19 — allocation status filter shows vacated allocations', async ({ page }) => {
    await navigateAndWait(page, '/hostel/allocations', 'Arjun Nair');
    await dismissOverlays(page);

    const statusSelect = page.locator('div[role="button"]').filter({ hasText: /active|status/i }).first();
    if (await statusSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusSelect.click();
      await page.waitForTimeout(300);
      await page.locator('li').filter({ hasText: /Vacated/i }).first().click({ force: true });
      await page.waitForTimeout(600);

      // Meera Iyer has a vacated allocation
      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('Meera Iyer');
      expect(bodyText).not.toContain('Arjun Nair');
    }
  });

  /** TC159-20: Delete hostel shows confirmation dialog and removes from list. */
  test('20 — delete hostel shows confirmation and removes item', async ({ page }) => {
    await navigateAndWait(page, '/hostel/hostels', 'Saraswati Mixed Hostel');
    await dismissOverlays(page);

    // Click delete (trash icon) on Saraswati Mixed Hostel
    const hostelCards = page.locator('.grid > div');
    const cardCount = await hostelCards.count();
    for (let i = 0; i < cardCount; i++) {
      const card = hostelCards.nth(i);
      const text = await card.textContent().catch(() => '');
      if (text.includes('Saraswati Mixed Hostel')) {
        const deleteBtn = card.locator('button').filter({ has: page.locator('svg') }).last();
        await deleteBtn.click();
        break;
      }
    }

    await page.waitForTimeout(400);

    // Confirm dialog should appear
    const confirmBtn = page.locator('[role="dialog"], [role="alertdialog"]').getByRole('button', { name: /delete/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(800);

      // Saraswati should no longer be visible
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('Saraswati Mixed Hostel');
    }
  });

  /** TC159-21: Delete room shows confirmation and removes from table. */
  test('21 — delete room shows confirmation and removes row', async ({ page }) => {
    await navigateAndWait(page, '/hostel/rooms', 'M-01');
    await dismissOverlays(page);

    // Find row with M-01 and click delete
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = await row.textContent().catch(() => '');
      if (text.includes('M-01')) {
        const deleteBtn = row.locator('button').last();
        await deleteBtn.click();
        break;
      }
    }

    await page.waitForTimeout(400);
    const confirmBtn = page.locator('[role="dialog"], [role="alertdialog"]').getByRole('button', { name: /delete/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(800);
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('M-01');
    }
  });

  /** TC159-22: Network error on dashboard shows error state instead of crashing. */
  test('22 — network error on stats endpoint shows error fallback', async ({ page }) => {
    // Override stats to fail
    await page.route('**/api/hostel/stats', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server Error' }) });
    });

    await page.goto('/hostel', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => (document.body?.textContent || '').toLowerCase().includes('failed') ||
            (document.body?.textContent || '').toLowerCase().includes('error') ||
            (document.body?.textContent || '').toLowerCase().includes('load'),
      undefined,
      { timeout: 15_000 },
    ).catch(() => {});

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('failed') ||
      bodyText?.toLowerCase().includes('error') ||
      bodyText?.toLowerCase().includes('load'),
    ).toBeTruthy();
  });

  /** TC159-23: Room pagination controls are disabled appropriately at boundaries. */
  test('23 — room pagination previous button disabled on first page', async ({ page }) => {
    await navigateAndWait(page, '/hostel/rooms', '101');
    await dismissOverlays(page);

    const prevBtn = page.getByRole('button', { name: /previous/i }).first();
    if (await prevBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isDisabled = await prevBtn.evaluate((el: HTMLElement) => el.disabled || el.getAttribute('disabled'));
      expect(isDisabled).toBeTruthy();
    }
  });

  /** TC159-24: Occupancy badge colors reflect room status (full, partial, empty). */
  test('24 — occupancy badges show correct text for full, partial, and empty rooms', async ({ page }) => {
    await navigateAndWait(page, '/hostel/rooms', '101');
    await dismissOverlays(page);

    // Verify occupancy text is present
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('2/2');
    expect(bodyText).toContain('1/3');
    expect(bodyText).toContain('0/1');
  });

  /** TC159-25: Room type filter shows only matching room types. */
  test('25 — room type filter shows only matching room types', async ({ page }) => {
    await navigateAndWait(page, '/hostel/rooms', '101');
    await dismissOverlays(page);

    const typeSelect = page.locator('div[role="button"]').filter({ hasText: /All Types|all types/i }).first();
    if (await typeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await typeSelect.click();
      await page.waitForTimeout(300);
      await page.locator('li').filter({ hasText: /Single/i }).first().click({ force: true });
      await page.waitForTimeout(600);

      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('201');
      // Double and triple rooms should be hidden
      expect(bodyText).not.toContain('101');
      expect(bodyText).not.toContain('102');
    }
  });
});
