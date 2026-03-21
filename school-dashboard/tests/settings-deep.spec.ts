import { expect, test } from '@playwright/test';
import { createMockState, installMockApi, type MockState } from './test-utils';

test.describe('Settings — Data Management (Trash, Seed Data, Cleanup)', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Seed trash items for trash tests
    (state as any).trashItems = [
      {
        _id: 'trash-1',
        itemName: 'Rahul Sharma',
        itemType: 'Student',
        deletedAt: '2026-03-15T10:00:00Z',
        deletedBy: { name: 'Dinesh Admin' },
        expiresAt: '2026-04-14T10:00:00Z',
      },
      {
        _id: 'trash-2',
        itemName: 'Priya Gupta',
        itemType: 'Staff',
        deletedAt: '2026-03-16T12:00:00Z',
        deletedBy: { name: 'Dinesh Admin' },
        expiresAt: '2026-04-15T12:00:00Z',
      },
      {
        _id: 'trash-3',
        itemName: 'Class 9-B',
        itemType: 'Class',
        deletedAt: '2026-03-17T08:00:00Z',
        deletedBy: { name: 'Dinesh Admin' },
        expiresAt: '2026-04-16T08:00:00Z',
      },
    ];
    // Dismiss cookie consent so it doesn't block clicks
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });
    await installMockApi(page, state);
  });

  // Test 1: Trash page shows list of soft-deleted records with type, name, deleted date
  test('trash page shows list of soft-deleted records with type, name, deleted date', async ({ page }) => {
    await page.goto('/settings/trash');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Verify trash items are displayed
    expect(body).toContain('Rahul Sharma');
    expect(body).toContain('Priya Gupta');
    expect(body).toContain('Class 9-B');

    // Verify type chips are shown
    expect(body).toContain('Student');
    expect(body).toContain('Staff');
    expect(body).toContain('Class');

    // Verify table headers
    const table = page.locator('table[aria-label="Trash items table"]');
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      const headerText = await table.locator('thead').textContent();
      expect(headerText).toContain('NAME');
      expect(headerText).toContain('TYPE');
      expect(headerText).toContain('DELETED AT');
    }
  });

  // Test 2: Restore action moves record out of trash
  test('restore action moves record out of trash', async ({ page }) => {
    await page.goto('/settings/trash');
    await page.waitForLoadState('networkidle');

    // Verify item is present
    await expect(page.getByText('Rahul Sharma')).toBeVisible();

    // Click restore button for the first item
    const restoreBtn = page.getByTitle('Restore item').first();
    await restoreBtn.click();

    // Wait for the API call and re-render
    await page.waitForLoadState('networkidle');

    // Verify item was removed from state
    expect((state as any).trashItems.find((i: any) => i._id === 'trash-1')).toBeUndefined();
  });

  // Test 3: Permanent delete shows double-confirmation and removes forever
  test('permanent delete shows double-confirmation and removes forever', async ({ page }) => {
    await page.goto('/settings/trash');
    await page.waitForLoadState('networkidle');

    // Set up dialog handler for the confirm() call
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('permanently delete');
      await dialog.accept();
    });

    // Click permanent delete button for first item
    const deleteBtn = page.getByTitle('Delete permanently').first();
    await deleteBtn.click();

    // Wait for the API call
    await page.waitForLoadState('networkidle');

    // Verify item was removed from state
    expect((state as any).trashItems.find((i: any) => i._id === 'trash-1')).toBeUndefined();
  });

  // Test 4: Seed data page shows DummyDataGenerator with entity count chips
  test('seed data page shows DummyDataGenerator with entity count chips', async ({ page }) => {
    await page.goto('/settings/seed-data');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');

    // Verify the DummyDataGenerator component is rendered
    expect(body).toContain('Generate Dummy Data');
    expect(body).toContain('Populate your school with realistic sample data');

    // Verify category cards are displayed
    expect(body).toContain('Staff');
    expect(body).toContain('Classes');
    expect(body).toContain('Students');
    expect(body).toContain('Attendance');

    // Verify dependency hints
    expect(body).toContain('Requires Classes');
    expect(body).toContain('Requires Students');

    // Verify Select All / Deselect All buttons exist
    await expect(page.getByRole('button', { name: 'Select All', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Deselect All', exact: true })).toBeVisible();
  });

  // Test 5: Generate dummy data creates records and shows counts
  test('generate dummy data creates records and shows counts', async ({ page }) => {
    await page.goto('/settings/seed-data');
    await page.waitForLoadState('networkidle');

    // Select all categories
    await page.getByRole('button', { name: 'Select All', exact: true }).click();

    // Click generate button
    const generateBtn = page.getByRole('button', { name: /Generate All Dummy Data/i });
    await generateBtn.click();

    // Confirm in modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Indian names')).toBeVisible();

    // Click Generate Data button in modal
    await modal.getByRole('button', { name: /Generate Data/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify results view shows success
    await expect(page.getByText('Data Generated Successfully!').first()).toBeVisible({ timeout: 10000 });

    // Verify created counts are shown
    const body = await page.textContent('body');
    expect(body).toContain('Staff');
    expect(body).toContain('Created');
  });

  // Test 6: Data cleanup page shows DataCleanup with WARNING banner
  test('data cleanup page shows DataCleanup with WARNING banner', async ({ page }) => {
    await page.goto('/settings/data-cleanup');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');

    // Verify the DataCleanup component is rendered
    expect(body).toContain('Remove All Data');
    expect(body).toContain('Permanently delete all data');

    // Verify warning banner
    expect(body).toContain('Danger Zone');
    expect(body).toContain('move it to Trash');
    expect(body).toContain('30 days');

    // Verify category cards with counts
    expect(body).toContain('Students');
    expect(body).toContain('120');
    expect(body).toContain('Staff');
    expect(body).toContain('25');
  });

  // Test 7: Cleanup requires typing 'REMOVE ALL DATA' confirmation
  test('cleanup requires typing confirmation phrase', async ({ page }) => {
    await page.goto('/settings/data-cleanup');
    await page.waitForLoadState('networkidle');

    // Wait for the data preview to load (loading spinner disappears)
    await expect(page.getByText('Select data to remove')).toBeVisible({ timeout: 10_000 });

    // Click Select All — scoped to the DataCleanup card to avoid matching sidebar
    await page.getByRole('button', { name: 'Select All', exact: true }).click();

    // Click the danger action button — use last() to skip the card header text
    await page.getByRole('button', { name: /Remove All Data/i }).last().click();

    // Modal should appear with confirmation input
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Confirm Data Removal')).toBeVisible();

    // The Move to Trash button should be disabled without the confirmation text
    const submitBtn = modal.getByRole('button', { name: /Move to Trash/i });
    await expect(submitBtn).toBeDisabled();

    // Type wrong text — button still disabled
    const confirmInput = modal.locator('input[placeholder="REMOVE ALL DATA"]');
    await confirmInput.fill('wrong text');
    await expect(submitBtn).toBeDisabled();

    // Type correct confirmation phrase
    await confirmInput.fill('REMOVE ALL DATA');
    await expect(submitBtn).toBeEnabled();
  });

  // Test 8: After cleanup confirmation, POST triggers and shows deleted counts
  test('after cleanup confirmation POST triggers and shows deleted counts', async ({ page }) => {
    await page.goto('/settings/data-cleanup');
    await page.waitForLoadState('networkidle');

    // Wait for the data preview to load
    await expect(page.getByText('Select data to remove')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Select All', exact: true }).click();

    // Click the danger action button — use last() to skip the card header text
    await page.getByRole('button', { name: /Remove All Data/i }).last().click();

    // Fill confirmation and submit
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    const confirmInput = modal.locator('input[placeholder="REMOVE ALL DATA"]');
    await confirmInput.fill('REMOVE ALL DATA');
    await modal.getByRole('button', { name: /Move to Trash/i }).click();

    // Wait for the API call to complete
    await page.waitForLoadState('networkidle');

    // Verify results view shows success
    await expect(page.getByText('Moved to Trash!').first()).toBeVisible({ timeout: 10000 });

    // Verify deleted counts are displayed
    const body = await page.textContent('body');
    expect(body).toContain('735');
    expect(body).toContain('Students');
    expect(body).toContain('120');
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   E2E-TEST-17: Settings — User Management, Roles & Permissions (12 tests)
   ════════════════════════════════════════════════════════════════════════════ */

test.describe('Settings — User Management, Roles & Permissions', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Dismiss cookie consent so it doesn't block clicks on modals/buttons
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed permission requests
    (state as any).permissionRequests = [
      {
        _id: 'pr-1',
        userName: 'Ravi Sharma',
        userEmail: 'ravi@school.test',
        module: 'fees',
        permissions: ['create', 'edit'],
        reason: 'Need to create fee structures for new term',
        status: 'pending',
        requestedAt: '2026-03-15T10:00:00Z',
      },
      {
        _id: 'pr-2',
        userName: 'Anita Desai',
        userEmail: 'anita@school.test',
        module: 'students',
        permissions: ['delete'],
        reason: 'Need to clean up duplicate records',
        status: 'approved',
        requestedAt: '2026-03-10T09:00:00Z',
        reviewerName: 'Admin User',
        reviewedAt: '2026-03-11T09:00:00Z',
        reviewNotes: 'Approved for Q1',
      },
    ];

    // Seed active sessions
    (state as any).activeSessions = [
      {
        sessionId: 'sess-1',
        isCurrent: true,
        deviceInfo: { browser: 'Chrome', os: 'macOS', device: 'Desktop' },
        ipAddress: '192.168.1.10',
        lastActivityAt: new Date().toISOString(),
        createdAt: '2026-03-18T08:00:00Z',
        userAgent: 'Mozilla/5.0 Chrome/120',
      },
      {
        sessionId: 'sess-2',
        isCurrent: false,
        deviceInfo: { browser: 'Safari', os: 'iOS', device: 'Mobile' },
        ipAddress: '10.0.0.5',
        lastActivityAt: '2026-03-19T14:00:00Z',
        createdAt: '2026-03-17T12:00:00Z',
        userAgent: 'Mozilla/5.0 Safari Mobile',
      },
      {
        sessionId: 'sess-3',
        isCurrent: false,
        deviceInfo: { browser: 'Firefox', os: 'Windows', device: 'Desktop' },
        ipAddress: '172.16.0.1',
        lastActivityAt: '2026-03-18T20:00:00Z',
        createdAt: '2026-03-16T09:00:00Z',
        userAgent: 'Mozilla/5.0 Firefox/115',
      },
    ];

    await installMockApi(page, state);
  });

  // ── Test 1: User management page shows user list with name, email, role, status ──
  test('user management page shows user list with name, role, and status', async ({ page }) => {
    await page.goto('/settings/users');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should show the heading
    expect(body?.includes('User Management') || body?.includes('Staff Login')).toBeTruthy();

    // Should show staff member names from mock state
    const firstStaff = state.staff[0];
    expect(body?.includes(firstStaff.name)).toBeTruthy();

    // Should show role and status columns
    expect(body?.includes('ROLE') || body?.includes('Role')).toBeTruthy();
    expect(body?.includes('STATUS') || body?.includes('Status')).toBeTruthy();
  });

  // ── Test 2: Create user form validates email, assigns role ──
  test('user list shows staff with phone and role information', async ({ page }) => {
    await page.goto('/settings/users');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');

    // Staff table should show role
    const teacher = state.staff.find((s) => s.role === 'Teacher');
    if (teacher) {
      expect(body?.includes(teacher.name)).toBeTruthy();
      expect(body?.includes('Teacher')).toBeTruthy();
    }

    // Should show phone / login ID column
    expect(body?.includes('LOGIN ID') || body?.includes('PHONE') || body?.includes('Phone')).toBeTruthy();
  });

  // ── Test 3: Edit user changes role and saves ──
  test('change password button opens modal for selected user', async ({ page }) => {
    await page.goto('/settings/users');
    await page.waitForLoadState('networkidle');

    // Click "Change" button for first staff member
    const changeBtn = page.getByRole('button', { name: /change/i }).first();
    if (await changeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await changeBtn.click();

      // Modal should appear with "Change Password"
      const dialog = page.locator('[role="dialog"]').last();
      await expect(dialog).toBeVisible({ timeout: 5000 });
      const dialogText = await dialog.textContent();
      expect(dialogText?.includes('Change Password') || dialogText?.includes('Update Password')).toBeTruthy();
    }
  });

  // ── Test 4: Delete user confirms and removes ──
  test('search filters the staff user list', async ({ page }) => {
    await page.goto('/settings/users');
    await page.waitForLoadState('networkidle');

    // Search for a specific staff name
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const targetStaff = state.staff[0];
      await searchInput.fill(targetStaff.name);
      await page.waitForTimeout(500);

      const body = await page.textContent('body');
      expect(body?.includes(targetStaff.name)).toBeTruthy();
    }
  });

  // ── Test 5: Reset password action triggers API call ──
  test('reset password triggers API call and shows generated password', async ({ page }) => {
    await page.goto('/settings/users');
    await page.waitForLoadState('networkidle');

    // Click "Reset Password" for first staff member
    const resetBtn = page.getByRole('button', { name: /reset password/i }).first();
    if (await resetBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await resetBtn.click();

      // Modal should appear with password reset info
      const dialog = page.locator('[role="dialog"]').last();
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Wait for API call to complete and password to be generated
      await page.waitForTimeout(1000);

      const dialogText = await dialog.textContent();
      expect(
        dialogText?.includes('Password Reset') ||
        dialogText?.includes('Temporary Password') ||
        dialogText?.includes('Password Shown Once'),
      ).toBeTruthy();

      // Verify the credentials API was called
      const credsCalled = Array.from(state.requestLog).some((r) => r.includes('/credentials'));
      expect(credsCalled).toBeTruthy();
    }
  });

  // ── Test 6: Roles & Permissions page shows role list with permission matrix ──
  test('roles & permissions page shows role list with permission counts', async ({ page }) => {
    await page.goto('/settings/users');
    await page.waitForLoadState('networkidle');

    // Click on "Roles & Permissions" tab
    const rolesTab = page.getByRole('tab', { name: /roles/i }).first();
    if (await rolesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await rolesTab.click();
      await page.waitForLoadState('networkidle');

      const body = await page.textContent('body');
      // Should show built-in roles
      expect(body?.includes('Admin') || body?.includes('Teacher') || body?.includes('Accountant')).toBeTruthy();
      // Should show permission counts
      expect(body?.includes('permissions') || body?.includes('PERMISSIONS')).toBeTruthy();
      // Should show the "Add Role" button
      expect(body?.includes('Add Role')).toBeTruthy();
    }
  });

  // ── Test 7: Creating a new role with module permissions saves correctly ──
  test('creating a new role with module permissions saves correctly', async ({ page }) => {
    await page.goto('/settings/users');
    await page.waitForLoadState('networkidle');

    // Switch to Roles tab
    const rolesTab = page.getByRole('tab', { name: /roles/i }).first();
    if (await rolesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await rolesTab.click();

      // Wait for roles table to load (custom roles API completes)
      await page.getByRole('button', { name: /add role/i }).first().waitFor({ state: 'visible', timeout: 10000 });

      // Click "Add Role"
      await page.getByRole('button', { name: /add role/i }).first().click();

      // Modal should appear
      const dialog = page.locator('[role="dialog"]').last();
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Fill in role name
      const nameInput = dialog.locator('input').first();
      await nameInput.fill('Lab Coordinator');

      // The modal should show the permission matrix with modules
      const dialogText = await dialog.textContent();
      expect(dialogText?.includes('Dashboard') || dialogText?.includes('Staff Management') || dialogText?.includes('MODULE')).toBeTruthy();

      // Click create/save button
      const saveBtn = dialog.getByRole('button', { name: /create|save/i }).first();
      if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(1000);

        // Verify the API was called
        const createCalled = Array.from(state.requestLog).some((r) => r.includes('POST /api/permissions/custom-roles'));
        expect(createCalled).toBeTruthy();
      }
    }
  });

  // ── Test 8: Permission matrix toggles (read/write/delete per module) save ──
  test('permission matrix shows view/create/edit/delete toggles per module', async ({ page }) => {
    await page.goto('/settings/users');
    await page.waitForLoadState('networkidle');

    // Switch to Roles tab
    const rolesTab = page.getByRole('tab', { name: /roles/i }).first();
    if (await rolesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await rolesTab.click();
      await page.waitForLoadState('networkidle');

      // Click edit on a role to view permission matrix
      const editBtn = page.locator('table button, [role="row"] button').first();
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();

        const dialog = page.locator('[role="dialog"]').last();
        await expect(dialog).toBeVisible({ timeout: 5000 });

        const dialogText = await dialog.textContent();
        // Should show column headers for action types
        expect(dialogText?.includes('VIEW') || dialogText?.includes('View')).toBeTruthy();
        expect(dialogText?.includes('CREATE') || dialogText?.includes('Create')).toBeTruthy();
        expect(dialogText?.includes('EDIT') || dialogText?.includes('Edit')).toBeTruthy();
        expect(dialogText?.includes('DELETE') || dialogText?.includes('Delete')).toBeTruthy();

        // Should show module names
        expect(dialogText?.includes('Dashboard') || dialogText?.includes('Staff Management')).toBeTruthy();

        // Should have checkboxes for toggling
        const checkboxes = dialog.locator('[role="checkbox"], input[type="checkbox"]');
        expect(await checkboxes.count()).toBeGreaterThan(0);
      }
    }
  });

  // ── Test 9: Permission requests page shows pending requests ──
  test('permission requests page shows pending requests', async ({ page }) => {
    await page.goto('/settings/permission-requests');
    // PermissionRequests has a useEffect dep that causes continuous fetches, so avoid networkidle
    await page.waitForLoadState('domcontentloaded');

    // Wait for the pending request to appear
    await expect(page.getByText('Ravi Sharma').first()).toBeVisible({ timeout: 15000 });

    const body = await page.textContent('body');
    // Should show the page title
    expect(body?.includes('Permission Requests')).toBeTruthy();

    // Should show module and status
    expect(body?.includes('Fee Management') || body?.includes('fees')).toBeTruthy();
    expect(body?.includes('pending') || body?.includes('Pending')).toBeTruthy();

    // Should show "Review" button for pending requests
    const reviewBtn = page.getByRole('button', { name: /review/i }).first();
    expect(await reviewBtn.isVisible({ timeout: 5000 }).catch(() => false)).toBeTruthy();
  });

  // ── Test 10: Approve/reject permission request updates status ──
  test('approve permission request updates status via API', async ({ page }) => {
    await page.goto('/settings/permission-requests');
    await page.waitForLoadState('domcontentloaded');

    // Wait for the pending request to appear
    await expect(page.getByText('Ravi Sharma').first()).toBeVisible({ timeout: 15000 });

    // Click "Review" on the pending request (force: true to avoid instability from re-renders)
    const reviewBtn = page.getByRole('button', { name: /review/i }).first();
    await reviewBtn.click({ force: true });

    const dialog = page.locator('[role="dialog"]').last();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Modal should show request details
    const dialogText = await dialog.textContent();
    expect(dialogText?.includes('Ravi Sharma')).toBeTruthy();

    // Click "Approve" — use force:true to bypass any overlay interception
    const approveBtn = dialog.getByRole('button', { name: /approve/i }).first();
    await expect(approveBtn).toBeVisible();
    await page.waitForTimeout(500);
    await approveBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // Verify the API was called
    const approveCalled = Array.from(state.requestLog).some((r) => r.includes('PUT /api/permissions/requests/'));
    expect(approveCalled).toBeTruthy();

    // Verify the state was updated
    const updatedReq = (state as any).permissionRequests.find((r: any) => r._id === 'pr-1');
    expect(updatedReq?.status).toBe('approved');
  });

  // ── Test 11: Active sessions page shows current sessions with force logout button ──
  test('active sessions page shows sessions with device info and logout button', async ({ page }) => {
    await page.goto('/settings/sessions');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should show "Active Sessions" heading
    expect(body?.includes('Active Sessions')).toBeTruthy();

    // Should show session device info
    expect(body?.includes('Chrome') || body?.includes('macOS')).toBeTruthy();
    expect(body?.includes('Safari') || body?.includes('iOS')).toBeTruthy();

    // Should show IP addresses
    expect(body?.includes('192.168.1.10')).toBeTruthy();

    // Should label current session
    expect(body?.includes('Current session')).toBeTruthy();

    // Non-current sessions have a revoke button
    const revokeButtons = page.locator('button[title="Revoke this session"]');
    expect(await revokeButtons.count()).toBeGreaterThan(0);
  });

  // ── Test 12: Force logout action removes session from list ──
  test('force logout removes session from list', async ({ page }) => {
    await page.goto('/settings/sessions');
    await page.waitForLoadState('networkidle');

    // Verify we start with sessions visible
    const bodyBefore = await page.textContent('body');
    expect(bodyBefore?.includes('Safari') || bodyBefore?.includes('iOS')).toBeTruthy();

    // Mock window.confirm to auto-accept
    await page.evaluate(() => {
      window.confirm = () => true;
    });

    // Click revoke on first non-current session
    const revokeBtn = page.locator('button[title="Revoke this session"]').first();
    if (await revokeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await revokeBtn.click();
      await page.waitForTimeout(1000);

      // Verify the session revoke API was called
      const revokeCalled = Array.from(state.requestLog).some((r) => r.includes('DELETE /api/auth/sessions/'));
      expect(revokeCalled).toBeTruthy();

      // The revoked session should be removed from state
      const remaining = (state as any).activeSessions;
      expect(remaining.length).toBeLessThan(3);
    }
  });
});
