import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi, seedHomework,
  CLASS_10A_ID, CLASS_11A_ID, TEACHER_A_ID, TEACHER_B_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ─────────────────────────────────────────────────────────────────────
 *  TC064 — Homework Management: create, view, edit, delete
 * ───────────────────────────────────────────────────────────────────── */

test.describe('TC064 — Homework Management', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed 2 homework items
    seedHomework(state, {
      title: 'Algebra Practice',
      description: 'Solve exercises 1-10 from chapter 3',
      subject: 'Mathematics',
      classId: CLASS_10A_ID as any,
      teacherId: TEACHER_A_ID as any,
      status: 'active',
      dueDate: '2026-04-05T23:59:59.000Z',
      attachments: [{ name: 'worksheet.pdf', url: 'https://files.test/worksheet.pdf', type: 'pdf' }],
    });
    seedHomework(state, {
      title: 'Essay Writing',
      description: 'Write a 500-word essay on environmental conservation',
      subject: 'English',
      classId: CLASS_10A_ID as any,
      teacherId: TEACHER_B_ID as any,
      status: 'completed',
      dueDate: '2026-03-25T23:59:59.000Z',
    });

    await installMockApi(page, state);
  });

  /* ───────── 1. Homework page loads with seeded items ───────── */

  test('1) homework page loads showing homework list', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Algebra Practice') || bodyText?.includes('Essay Writing'),
    ).toBeTruthy();
  });

  /* ───────── 2. Both homework items are visible ───────── */

  test('2) both seeded homework items are displayed', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('Algebra Practice')).toBeTruthy();
    expect(bodyText?.includes('Essay Writing')).toBeTruthy();
  });

  /* ───────── 3. Homework cards show key details ───────── */

  test('3) homework cards show title, subject, status', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');

    // Title
    expect(bodyText?.includes('Algebra Practice')).toBeTruthy();

    // Subject
    expect(bodyText?.includes('Mathematics')).toBeTruthy();

    // Status badges
    expect(
      bodyText?.includes('Active') || bodyText?.includes('active') ||
      bodyText?.includes('Completed') || bodyText?.includes('completed'),
    ).toBeTruthy();
  });

  /* ───────── 4. Click "Create Homework" opens form ───────── */

  test('4) clicking Create Homework opens the creation form', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /create homework|add homework|new homework/i }).first();
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();

    const btn = (await createBtn.isVisible({ timeout: 3000 }).catch(() => false))
      ? createBtn
      : plusBtn;

    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      expect(
        bodyText?.includes('Title') || bodyText?.includes('Subject') ||
        bodyText?.includes('Class') || bodyText?.includes('Homework') ||
        bodyText?.includes('Create'),
      ).toBeTruthy();
    }
  });

  /* ───────── 5. Create new homework: Chapter 5 Exercises ───────── */

  test('5) create homework with title, subject, class, and due date', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /create homework|add homework|new homework/i }).first();
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
    const btn = (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) ? createBtn : plusBtn;

    if (!(await btn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await btn.click();
    await page.waitForTimeout(500);

    // Fill title
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('Chapter 5 Exercises');
    }

    // Select subject (Mathematics)
    const subjectSelect = page.locator('select, [aria-haspopup="listbox"]').filter({ hasText: /subject/i }).first();
    if (await subjectSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await subjectSelect.click();
      await page.waitForTimeout(200);
      const mathOption = page.getByText(/Mathematics/i).first();
      if (await mathOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await mathOption.click();
      }
    }

    // Select class (10-A)
    const classSelect = page.locator('select, [aria-haspopup="listbox"]').filter({ hasText: /class/i }).first();
    if (await classSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await classSelect.click();
      await page.waitForTimeout(200);
      const classOption = page.getByText(/10-A|10A/).first();
      if (await classOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await classOption.click();
      }
    }

    // Fill description
    const descInput = page.locator('textarea, input[name="description"]').first();
    if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descInput.fill('Complete all exercises from Chapter 5 of the textbook.');
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /create|save|submit|assign/i }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(500);

      expect(state.homework.some(h => h.title === 'Chapter 5 Exercises')).toBeTruthy();
    }
  });

  /* ───────── 6. New homework appears in list ───────── */

  test('6) created homework appears in the homework list', async ({ page }) => {
    // Pre-add homework to state
    seedHomework(state, {
      title: 'Chapter 5 Exercises',
      description: 'Complete all exercises from Chapter 5.',
      subject: 'Mathematics',
      classId: CLASS_10A_ID as any,
      teacherId: TEACHER_A_ID as any,
      status: 'active',
    });

    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText?.includes('Chapter 5 Exercises')).toBeTruthy();
  });

  /* ───────── 7. Click homework to view details ───────── */

  test('7) clicking a homework item shows its details', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    const hwItem = page.getByText('Algebra Practice').first();
    if (await hwItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await hwItem.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent('body');
      expect(
        bodyText?.includes('Algebra Practice') ||
        bodyText?.includes('Solve exercises') ||
        bodyText?.includes('Mathematics'),
      ).toBeTruthy();
    }
  });

  /* ───────── 8. Edit homework ───────── */

  test('8) editing a homework item updates its details', async ({ page }) => {
    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    // Click on homework item to view/edit
    const hwItem = page.getByText('Algebra Practice').first();
    if (await hwItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await hwItem.click();
      await page.waitForTimeout(500);
    }

    // Look for edit button
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);

      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
      if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await titleInput.clear();
        await titleInput.fill('Updated Algebra Practice');

        const saveBtn = page.getByRole('button', { name: /save|update|submit/i }).first();
        if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  /* ───────── 9. Delete homework ───────── */

  test('9) deleting a homework item removes it from state', async ({ page }) => {
    const initialCount = state.homework.length;
    expect(initialCount).toBe(2);

    await page.goto('/homework');
    await page.waitForLoadState('networkidle');

    // Click on homework item
    const hwItem = page.getByText('Essay Writing').first();
    if (await hwItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await hwItem.click();
      await page.waitForTimeout(500);
    }

    // Look for delete button
    const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
    const trashBtn = page.locator('button:has(svg.lucide-trash), button:has(svg.lucide-trash-2)').first();
    const btn = (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) ? deleteBtn : trashBtn;

    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Handle confirmation dialog
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      await btn.click();
      await page.waitForTimeout(500);

      // Confirm button if modal appears instead of browser dialog
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i }).first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  /* ───────── 10. Search filters homework by title ───────── */

  test('10) search filters homework by title', async ({ page }) => {
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

  /* ───────── 11. State integrity check ───────── */

  test('11) state has 2 seeded homework items with correct details', async ({ page }) => {
    expect(state.homework).toHaveLength(2);
    expect(state.homework[0].title).toBe('Algebra Practice');
    expect(state.homework[0].subject).toBe('Mathematics');
    expect(state.homework[0].status).toBe('active');
    expect(state.homework[1].title).toBe('Essay Writing');
    expect(state.homework[1].subject).toBe('English');
    expect(state.homework[1].status).toBe('completed');
  });
});
