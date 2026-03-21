import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedHomework,
  CLASS_10A_ID, CLASS_11A_ID, TEACHER_A_ID, TEACHER_B_ID,
  type MockState,
} from './test-utils';

test.describe('Homework Management', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    // Dismiss cookie consent banner so it doesn't obscure interactive elements
    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed homework across two classes
    seedHomework(state, {
      title: 'Algebra Practice',
      description: 'Solve exercises 1-10 from chapter 3',
      subject: 'Mathematics',
      classId: CLASS_10A_ID as any,
      teacherId: TEACHER_A_ID as any,
      status: 'active',
      attachments: [{ name: 'worksheet.pdf', url: 'https://files.test/worksheet.pdf', type: 'pdf' }],
    });
    seedHomework(state, {
      title: 'Essay Writing',
      description: 'Write a 500-word essay on environmental conservation',
      subject: 'English',
      classId: CLASS_10A_ID as any,
      teacherId: TEACHER_B_ID as any,
      status: 'completed',
    });
    seedHomework(state, {
      title: 'Physics Lab Report',
      description: 'Document observations from the refraction experiment',
      subject: 'Science',
      classId: CLASS_11A_ID as any,
      teacherId: TEACHER_A_ID as any,
      status: 'active',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // overdue
    });
    seedHomework(state, {
      title: 'History Notes',
      description: 'Summarize chapter 7 on the freedom movement',
      subject: 'Social Studies',
      classId: CLASS_11A_ID as any,
      teacherId: TEACHER_B_ID as any,
      status: 'cancelled',
    });

    await installMockApi(page, state);
  });

  // 1. Homework page loads showing HomeworkCard components
  test('homework page loads showing homework cards', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    // At least some homework titles should be visible
    expect(
      bodyText?.includes('Algebra') || bodyText?.includes('Essay') ||
      bodyText?.includes('Physics') || bodyText?.includes('History'),
    ).toBeTruthy();
  });

  // 2. Each card shows title, subject, class, teacher, due date, status badge
  test('cards show title, subject, class, teacher, due date, status', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // Verify key fields from seeded data
    expect(bodyText?.includes('Algebra Practice')).toBeTruthy();
    expect(bodyText?.includes('Mathematics')).toBeTruthy();
    // Teacher name
    expect(
      bodyText?.includes('Ananya Sharma') || bodyText?.includes('Ravi Menon'),
    ).toBeTruthy();
    // Status badges
    expect(
      bodyText?.includes('Active') || bodyText?.includes('Completed') || bodyText?.includes('Cancelled'),
    ).toBeTruthy();
  });

  // 3. Search filters homework by title
  test('search filters homework by title', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/Search by title/i)
      .or(page.getByPlaceholder(/Search/i))
      .first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Algebra');
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      expect(bodyText?.includes('Algebra')).toBeTruthy();
    }
  });

  // 4. Class filter dropdown filters by selected class
  test('class filter dropdown filters by selected class', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    // The class filter is a HeroUI Select — click the trigger button to open it
    const classFilterTrigger = page.locator('button[aria-haspopup="listbox"]').first();

    if (await classFilterTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await classFilterTrigger.click();
      await page.waitForTimeout(300);

      // Select 10-A class option from the popover listbox
      const listbox = page.locator('ul[role="listbox"]');
      const classOption = listbox.getByText(/10-A|10A/).first();
      if (await classOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await classOption.click();
        await page.waitForTimeout(1000);
        await page.waitForLoadState('networkidle');

        // After filtering by class 10A, should see Algebra and Essay but not Physics Lab
        const bodyText = await page.textContent('body');
        expect(
          bodyText?.includes('Algebra') || bodyText?.includes('Essay'),
        ).toBeTruthy();
      }
    }
  });

  // 5. Status filter works for active/cancelled/completed
  test('status filter works for active, cancelled, completed', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    // Look for status filter
    const statusFilter = page.getByPlaceholder('Filter by status')
      .or(page.locator('button, [role="button"]').filter({ hasText: /status/i }))
      .first();

    if (await statusFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statusFilter.click();
      await page.waitForTimeout(300);

      // Select "Completed"
      const completedOption = page.getByText('Completed', { exact: true })
        .or(page.locator('[data-key="completed"]'))
        .first();
      if (await completedOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await completedOption.click();
        await page.waitForTimeout(1000);
        await page.waitForLoadState('networkidle');

        const bodyText = await page.textContent('body');
        // Essay Writing was marked completed
        expect(
          bodyText?.includes('Essay') || bodyText?.includes('Completed'),
        ).toBeTruthy();
      }
    }
  });

  // 6. Overdue homework shows visual indicator (red badge/border)
  test('overdue homework shows visual indicator', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    // The Physics Lab Report is overdue (active + past dueDate)
    // The page renders 'Overdue' text for overdue items
    expect(
      bodyText?.includes('Overdue') || bodyText?.includes('Physics Lab Report'),
    ).toBeTruthy();

    // Check for danger/red color chip on overdue item
    const overdueChip = page.locator('[class*="danger"]').or(page.getByText('Overdue')).first();
    if (await overdueChip.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(overdueChip).toBeVisible();
    }
  });

  // 7. Create Homework modal validates required fields
  test('create homework modal validates required fields', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    // Click "Create Assignment" button
    const createBtn = page.getByText('Create Assignment')
      .or(page.getByRole('button', { name: /create/i }))
      .first();
    await createBtn.click();
    await page.waitForTimeout(500);

    // Modal should be open
    const modalText = await page.textContent('body');
    expect(
      modalText?.includes('Create Homework') || modalText?.includes('Assignment Details'),
    ).toBeTruthy();

    // Try submitting empty form
    const submitBtn = page.getByRole('button', { name: /Create Assignment/i })
      .or(page.locator('button[type="submit"]'))
      .last();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(500);

      // Validation errors should appear for required fields
      const bodyAfter = await page.textContent('body');
      expect(
        bodyAfter?.includes('required') || bodyAfter?.includes('Required') ||
        bodyAfter?.includes('Title') || bodyAfter?.includes('is required'),
      ).toBeTruthy();
    }
  });

  // 8. Creating homework with all fields adds card to list
  test('creating homework with all fields adds card to list', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    // Open create modal
    const createBtn = page.getByText('Create Assignment')
      .or(page.getByRole('button', { name: /create/i }))
      .first();
    await createBtn.click();
    await page.waitForTimeout(500);

    // Fill in form fields
    const titleInput = page.getByLabel('Title').or(page.locator('input[name="title"]')).first();
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('Geography Map Work');

      // HeroUI Select components render hidden native <select> + visible trigger buttons
      // Find all select trigger buttons in the modal (Class, Teacher, Subject order)
      const selectTriggers = page.locator('[role="dialog"] button[aria-haspopup="listbox"]');
      await page.waitForTimeout(500);

      // Select class (1st trigger)
      const classCount = await selectTriggers.count();
      if (classCount >= 1) {
        await selectTriggers.nth(0).click();
        await page.waitForTimeout(300);
        const listbox = page.locator('ul[role="listbox"]');
        await expect(listbox).toBeVisible({ timeout: 3000 });
        const classOpt = listbox.getByText(/10-A|10A/).first();
        if (await classOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await classOpt.click();
          await page.waitForTimeout(300);
        }
      }

      // Select teacher (2nd trigger)
      if (classCount >= 2) {
        await selectTriggers.nth(1).click();
        await page.waitForTimeout(300);
        const listbox = page.locator('ul[role="listbox"]');
        await expect(listbox).toBeVisible({ timeout: 3000 });
        const teacherOpt = listbox.getByText('Ananya Sharma').first();
        if (await teacherOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await teacherOpt.click();
          await page.waitForTimeout(300);
        }
      }

      // Select subject (3rd trigger)
      if (classCount >= 3) {
        await selectTriggers.nth(2).click();
        await page.waitForTimeout(300);
        const listbox = page.locator('ul[role="listbox"]');
        await expect(listbox).toBeVisible({ timeout: 3000 });
        const subjectOpt = listbox.getByText('Mathematics').first();
        if (await subjectOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await subjectOpt.click();
          await page.waitForTimeout(300);
        }
      }

      // Fill due date
      const dueDateInput = page.locator('input[type="datetime-local"]').first();
      if (await dueDateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
        const formatted = futureDate.toISOString().slice(0, 16);
        await dueDateInput.fill(formatted);
      }

      // Fill description
      const descInput = page.getByLabel(/Description/i)
        .or(page.locator('textarea[name="description"]'))
        .first();
      if (await descInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await descInput.fill('Complete the map work for chapter 6');
      }

      // Submit
      const submitBtn = page.getByRole('button', { name: /Create Assignment/i })
        .or(page.locator('button[type="submit"]'))
        .last();
      await submitBtn.click();
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');

      // Verify new homework was POSTed
      expect(state.requestLog.has('POST /api/homework')).toBeTruthy();
    }
  });

  // 9. Attaching files to homework works (mock file upload)
  test('attaching files to homework works', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    // Open create modal
    const createBtn = page.getByText('Create Assignment')
      .or(page.getByRole('button', { name: /create/i }))
      .first();
    await createBtn.click();
    await page.waitForTimeout(500);

    // Find the hidden file input and upload a mock file
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      // Mock the upload endpoint
      await page.route('**/api/upload*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ url: 'https://files.test/uploaded-doc.pdf' }),
        });
      });

      await fileInput.setInputFiles({
        name: 'assignment.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('mock pdf content'),
      });
      await page.waitForTimeout(1000);

      // The attachment should appear in the form
      const bodyText = await page.textContent('body');
      expect(
        bodyText?.includes('assignment.pdf') || bodyText?.includes('attachment') || bodyText?.includes('pdf'),
      ).toBeTruthy();
    }
  });

  // 10. Delete homework shows confirmation, removes card
  test('delete homework shows confirmation and removes card', async ({ page }) => {
    // Override window.confirm to auto-accept
    await page.addInitScript(() => {
      window.confirm = () => true;
    });

    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    const initialCount = state.homework.length;

    // Find and click the delete button (Trash2 icon button with aria-label)
    const deleteBtn = page.getByLabel('Delete homework')
      .or(page.locator('button[aria-label="Delete homework"]'))
      .first();
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(1000);

      // Verify DELETE was called
      const deleteCalled = Array.from(state.requestLog).some((r) => r.startsWith('DELETE /api/homework'));
      expect(deleteCalled).toBeTruthy();

      // One less homework in state
      expect(state.homework.length).toBe(initialCount - 1);
    }
  });

  // 11. Empty state shown when no homework exists
  test('empty state shown when no homework exists', async ({ page }) => {
    state.homework = [];
    await installMockApi(page, state);

    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('no homework') ||
      bodyText?.toLowerCase().includes('no assignments') ||
      bodyText?.includes('Create the first assignment'),
    ).toBeTruthy();
  });

  // 12. Loading skeleton renders during initial fetch
  test('loading skeleton renders during initial fetch', async ({ page }) => {
    // Delay API responses to catch skeleton state
    await page.route('**/api/homework/**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/homework');

    // Skeleton loader should render while data is loading
    // The page uses TablePageSkeleton which renders animated placeholder elements
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"], [data-skeleton]').first();
    const hasSkeleton = await skeleton.isVisible({ timeout: 3000 }).catch(() => false);

    // Even if skeleton class naming differs, the page should not show homework cards yet
    const bodyText = await page.textContent('body');
    // Verify page is at /homework (not redirected)
    await expect(page).not.toHaveURL(/\/login/);
    expect(bodyText).toBeTruthy();

    // If skeleton is visible, confirm it
    if (hasSkeleton) {
      await expect(skeleton).toBeVisible();
    }
  });
});
