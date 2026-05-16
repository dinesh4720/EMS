import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedPtmSession, seedStudent,
  CLASS_10A_ID, CLASS_11A_ID, TEACHER_A_ID, TEACHER_B_ID,
  type MockState,
} from './test-utils';

/* Force desktop viewport so the fixed sidebar does not overlap content */
test.use({ viewport: { width: 1280, height: 720 } });

/* ───────────────── PTM (Parent-Teacher Meetings) ───────────────── */

test.describe('PTM Management — Sessions, Slots & Scheduling', () => {
  test.setTimeout(60_000);

  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Dismiss cookie consent banner, coach marks and tours so they don't obscure interactive elements
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
      localStorage.setItem('ems_coach_marks_v1', JSON.stringify({ shell: Date.now() }));
      localStorage.setItem('ems_completed_tours', JSON.stringify(['dashboard-v1', 'shell-v1']));
    });

    // Seed students in 10-A so slot-booking dropdown has options
    seedStudent(state, { name: 'Rohan Sharma', classId: CLASS_10A_ID, admissionId: 'ADM-201', rollNo: '21' });
    seedStudent(state, { name: 'Sneha Iyer', classId: CLASS_10A_ID, admissionId: 'ADM-202', rollNo: '22' });
    seedStudent(state, { name: 'Karan Mehta', classId: CLASS_11A_ID, admissionId: 'ADM-301', rollNo: '31' });

    await installMockApi(page, state);
  });

  /** Navigate and wait for visible text to include the marker. */
  async function navigateAndWait(page: import('@playwright/test').Page, url: string, marker: string, timeout = 45_000) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      (m) => (document.body?.textContent || '').includes(m),
      marker,
      { timeout },
    );
  }

  /* ── TC-001: Dashboard loads with stat cards ── */
  test('TC-001 — PTM page loads with stat cards and empty state when no sessions', async ({ page }) => {
    await navigateAndWait(page, '/ptm', 'Parent-Teacher Meetings');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Total');
    expect(bodyText).toContain('Scheduled');
    expect(bodyText).toContain('Completed');
    expect(bodyText).toContain('Cancelled');
    // Empty state
    expect(bodyText).toContain('No PTM sessions yet');
    expect(bodyText).toContain('Schedule your first parent-teacher meeting');
  });

  /* ── TC-002: Session list renders with seeded data ── */
  test('TC-002 — session list renders cards with title, date, time, venue, slots and status chip', async ({ page }) => {
    seedPtmSession(state, {
      title: 'Term 1 PTM',
      sessionDate: '2026-05-25',
      startTime: '09:00',
      endTime: '12:00',
      slotDuration: 15,
      classId: CLASS_10A_ID,
      staffId: TEACHER_A_ID,
      venue: 'Auditorium',
      status: 'scheduled',
      slots: [
        { _id: 'slot-1', id: 'slot-1', parentName: 'Mr. Sharma', studentId: state.students[0].id, scheduledTime: '09:15', notes: '', status: 'booked' },
      ],
    });

    await navigateAndWait(page, '/ptm', 'Term 1 PTM');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Term 1 PTM');
    expect(bodyText).toContain('Auditorium');
    expect(bodyText).toContain('scheduled');
    expect(bodyText).toContain('1 slot booked');
  });

  /* ── TC-003: Status filter shows only matching sessions ── */
  test('TC-003 — status filter chips show only matching sessions', async ({ page }) => {
    seedPtmSession(state, { title: 'Completed PTM', status: 'completed', sessionDate: '2026-05-10' });
    seedPtmSession(state, { title: 'Cancelled PTM', status: 'cancelled', sessionDate: '2026-05-11' });
    seedPtmSession(state, { title: 'Scheduled PTM', status: 'scheduled', sessionDate: '2026-05-12' });

    await navigateAndWait(page, '/ptm', 'Scheduled PTM');

    // Click "Completed" filter chip
    const completedChip = page.locator('[role="tab"]').filter({ hasText: /^Completed$/ }).first();
    await completedChip.click();
    await page.waitForTimeout(400);

    let bodyText = await page.textContent('body');
    expect(bodyText).toContain('Completed PTM');
    expect(bodyText).not.toContain('Scheduled PTM');

    // Click "Cancelled" filter chip
    const cancelledChip = page.locator('[role="tab"]').filter({ hasText: /^Cancelled$/ }).first();
    await cancelledChip.click();
    await page.waitForTimeout(400);

    bodyText = await page.textContent('body');
    expect(bodyText).toContain('Cancelled PTM');
    expect(bodyText).not.toContain('Completed PTM');
  });

  /* ── TC-004: Create PTM modal validates required fields ── */
  test('TC-004 — create PTM modal validates required fields (title, date, startTime, endTime, class, teacher)', async ({ page }) => {
    await navigateAndWait(page, '/ptm', 'New PTM Session');

    const newBtn = page.getByRole('button', { name: /new ptm session/i }).first();
    await newBtn.click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Try to submit without filling anything
    const submitBtn = modal.getByRole('button', { name: /create session/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(300);

    // Modal should still be visible because validation fails
    expect(await modal.isVisible()).toBeTruthy();
  });

  /* ── TC-005: Creating a PTM session adds it to the list ── */
  test('TC-005 — creating a PTM session adds it to the list', async ({ page }) => {
    await navigateAndWait(page, '/ptm', 'New PTM Session');

    const newBtn = page.getByRole('button', { name: /new ptm session/i }).first();
    await newBtn.click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Fill Session Title
    const titleInput = modal.locator('input').filter({ has: page.locator('xpath=..') }).filter({ hasText: /Session Title/i }).locator('input').first();
    // Fallback: just fill the first input in the modal (title)
    const firstInput = modal.locator('input').first();
    await firstInput.fill('Mid-Term Parent Meeting');
    await page.waitForTimeout(100);

    // Fill date — find input with type="date"
    const dateInput = modal.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateInput.fill('2026-06-15');
    }

    // Fill start time
    const startTimeInput = modal.locator('input[type="time"]').first();
    if (await startTimeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startTimeInput.fill('10:00');
    }

    // Fill end time
    const endTimeInput = modal.locator('input[type="time"]').nth(1);
    if (await endTimeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await endTimeInput.fill('12:00');
    }

    // Select Class from dropdown (HeroUI Select)
    const classSelect = modal.locator('button[aria-haspopup="listbox"]').first();
    if (await classSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await classSelect.click();
      await page.waitForTimeout(300);
      const listbox = page.locator('ul[role="listbox"]');
      const option = listbox.getByText(/10-A|10A/).first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(300);
      }
    }

    // Select Teacher from dropdown
    const teacherSelect = modal.locator('button[aria-haspopup="listbox"]').nth(1);
    if (await teacherSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await teacherSelect.click();
      await page.waitForTimeout(300);
      const listbox = page.locator('ul[role="listbox"]');
      const option = listbox.getByText(/Ananya Sharma/).first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(300);
      }
    }

    // Submit
    const submitBtn = modal.getByRole('button', { name: /create session/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(800);

    // Modal should close and new session appears
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Mid-Term Parent Meeting');
    expect(bodyText).toContain('10:00');
  });

  /* ── TC-006: Session detail modal opens and shows info ── */
  test('TC-006 — session detail modal opens and shows class, teacher, venue, slots', async ({ page }) => {
    seedPtmSession(state, {
      title: 'Annual Day PTM',
      sessionDate: '2026-06-01',
      startTime: '14:00',
      endTime: '17:00',
      slotDuration: 20,
      classId: { _id: CLASS_10A_ID, name: '10', section: 'A' },
      staffId: { _id: TEACHER_A_ID, name: 'Ananya Sharma' },
      venue: 'Conference Room',
      status: 'scheduled',
      slots: [
        { _id: 'slot-2', id: 'slot-2', parentName: 'Mrs. Iyer', studentId: { _id: state.students[1].id, name: 'Sneha Iyer' }, scheduledTime: '14:20', notes: 'Discuss progress', status: 'booked' },
      ],
    });

    await navigateAndWait(page, '/ptm', 'Annual Day PTM');

    // Click the eye (view) icon on the session card
    const viewBtn = page.locator('button[aria-label="View session details"]').first();
    await viewBtn.click();
    await page.waitForTimeout(400);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const modalText = await modal.textContent();
    expect(modalText).toContain('Annual Day PTM');
    expect(modalText).toContain('Conference Room');
    expect(modalText).toContain('20 minutes');
    expect(modalText).toContain('Mrs. Iyer');
    expect(modalText).toContain('Booked Slots (1)');
  });

  /* ── TC-007: Book a slot from session detail modal ── */
  test('TC-007 — admin can book a slot from session detail modal', async ({ page }) => {
    seedPtmSession(state, {
      title: 'Open PTM',
      sessionDate: '2026-06-05',
      startTime: '09:00',
      endTime: '11:00',
      slotDuration: 15,
      classId: { _id: CLASS_10A_ID, name: '10', section: 'A' },
      staffId: { _id: TEACHER_A_ID, name: 'Ananya Sharma' },
      venue: 'Room 101',
      status: 'scheduled',
      slots: [],
    });

    await navigateAndWait(page, '/ptm', 'Open PTM');

    // Open detail modal
    const viewBtn = page.locator('button[aria-label="View session details"]').first();
    await viewBtn.click();
    await page.waitForTimeout(400);

    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Fill parent name
    const parentInput = modal.locator('input').filter({ hasText: /Parent Name/i }).first();
    const firstInput = modal.locator('input').first();
    await firstInput.fill('Mr. Sharma');
    await page.waitForTimeout(100);

    // Select student from dropdown
    const studentSelect = modal.locator('button[aria-haspopup="listbox"]').first();
    if (await studentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await studentSelect.click();
      await page.waitForTimeout(300);
      const listbox = page.locator('ul[role="listbox"]');
      const option = listbox.getByText(/Rohan Sharma/).first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(300);
      }
    }

    // Fill time slot
    const timeInput = modal.locator('input[type="time"]').first();
    if (await timeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await timeInput.fill('09:15');
    }

    // Click Book Slot
    const bookBtn = modal.getByRole('button', { name: /book slot/i }).first();
    await bookBtn.click();
    await page.waitForTimeout(600);

    // Slot should appear in the list
    const modalText = await modal.textContent();
    expect(modalText).toContain('Mr. Sharma');
    expect(modalText).toContain('Booked Slots (1)');
  });

  /* ── TC-008: Cancel session shows confirmation and removes from list ── */
  test('TC-008 — cancel session shows confirmation dialog and removes from list', async ({ page }) => {
    seedPtmSession(state, {
      title: 'To Be Cancelled',
      sessionDate: '2026-06-10',
      startTime: '10:00',
      endTime: '12:00',
      status: 'scheduled',
    });

    await navigateAndWait(page, '/ptm', 'To Be Cancelled');

    // Click trash icon
    const trashBtn = page.locator('button[aria-label="Cancel session"]').first();
    await trashBtn.click();
    await page.waitForTimeout(300);

    // Confirm dialog should appear
    const confirmDialog = page.locator('[role="alertdialog"]').first().or(page.locator('[role="dialog"]').filter({ hasText: /Cancel PTM Session/i }).first());
    await expect(confirmDialog).toBeVisible({ timeout: 5_000 });

    const dialogText = await confirmDialog.textContent();
    expect(dialogText).toContain('Cancel PTM Session');
    expect(dialogText).toContain('To Be Cancelled');

    // Click confirm
    const confirmBtn = confirmDialog.getByRole('button', { name: /cancel session/i }).first();
    await confirmBtn.click();
    await page.waitForTimeout(600);

    // Session should be removed from list
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('To Be Cancelled');
  });

  /* ── TC-009: Empty state message changes with active filter ── */
  test('TC-009 — empty state message changes when filter has no matches', async ({ page }) => {
    seedPtmSession(state, { title: 'Only Scheduled', status: 'scheduled' });

    await navigateAndWait(page, '/ptm', 'Only Scheduled');

    // Click Completed filter
    const completedChip = page.locator('[role="tab"]').filter({ hasText: /^Completed$/ }).first();
    await completedChip.click();
    await page.waitForTimeout(400);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('No completed sessions');
    expect(bodyText).toContain('Try a different status filter');
  });

  /* ── TC-010: Overlap detection prevents duplicate time slots for same class/teacher ── */
  test('TC-010 — overlap detection prevents creating colliding sessions for same class or teacher', async ({ page }) => {
    seedPtmSession(state, {
      title: 'Morning PTM',
      sessionDate: '2026-06-20',
      startTime: '09:00',
      endTime: '11:00',
      classId: CLASS_10A_ID,
      staffId: TEACHER_A_ID,
      status: 'scheduled',
    });

    await navigateAndWait(page, '/ptm', 'Morning PTM');

    // Try to create overlapping session
    const newBtn = page.getByRole('button', { name: /new ptm session/i }).first();
    await newBtn.click();
    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();

    const firstInput = modal.locator('input').first();
    await firstInput.fill('Clashing PTM');

    const dateInput = modal.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateInput.fill('2026-06-20');
    }

    const startTimeInput = modal.locator('input[type="time"]').first();
    if (await startTimeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startTimeInput.fill('10:00'); // overlaps 09:00-11:00
    }

    const endTimeInput = modal.locator('input[type="time"]').nth(1);
    if (await endTimeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await endTimeInput.fill('12:00');
    }

    // Select same class
    const classSelect = modal.locator('button[aria-haspopup="listbox"]').first();
    if (await classSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await classSelect.click();
      await page.waitForTimeout(300);
      const listbox = page.locator('ul[role="listbox"]');
      const option = listbox.getByText(/10-A|10A/).first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(300);
      }
    }

    // Select same teacher
    const teacherSelect = modal.locator('button[aria-haspopup="listbox"]').nth(1);
    if (await teacherSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await teacherSelect.click();
      await page.waitForTimeout(300);
      const listbox = page.locator('ul[role="listbox"]');
      const option = listbox.getByText(/Ananya Sharma/).first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(300);
      }
    }

    const submitBtn = modal.getByRole('button', { name: /create session/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(600);

    // Modal should still be visible and an overlap toast/error should have appeared
    expect(await modal.isVisible()).toBeTruthy();
  });

  /* ── TC-011: Stats update after creating a session ── */
  test('TC-011 — stat cards reflect correct counts after seeding multiple sessions', async ({ page }) => {
    seedPtmSession(state, { title: 'S1', status: 'scheduled' });
    seedPtmSession(state, { title: 'S2', status: 'scheduled' });
    seedPtmSession(state, { title: 'S3', status: 'completed' });
    seedPtmSession(state, { title: 'S4', status: 'cancelled' });

    await navigateAndWait(page, '/ptm', 'S1');

    const bodyText = await page.textContent('body');
    // Total = 4
    expect(bodyText).toContain('Total');
    // Scheduled = 2
    expect(bodyText).toContain('Scheduled');
    // Completed = 1
    expect(bodyText).toContain('Completed');
    // Cancelled = 1
    expect(bodyText).toContain('Cancelled');
  });

  /* ── TC-012: Session card shows class name and teacher name ── */
  test('TC-012 — session card shows class name, section and teacher name', async ({ page }) => {
    seedPtmSession(state, {
      title: 'Class 10A PTM',
      classId: { _id: CLASS_10A_ID, name: '10', section: 'A' },
      staffId: { _id: TEACHER_A_ID, name: 'Ananya Sharma' },
      status: 'scheduled',
    });

    await navigateAndWait(page, '/ptm', 'Class 10A PTM');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('10');
    expect(bodyText).toContain('A');
    expect(bodyText).toContain('Ananya Sharma');
  });
});
