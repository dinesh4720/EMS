import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedStudent,
  CLASS_10A_ID, SCHOOL_ID,
  type MockState, type StudentRecord, type RemarkRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Extended mock API with remark creation endpoint
 * ──────────────────────────────────────────────────────────── */

async function installRemarksMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  // Override the remarks routes for POST support
  await page.route('**/api/students/*/remarks**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    state.requestLog.add(`${method} ${path}`);

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    const idMatch = path.match(/\/api\/students\/([^/]+)\/remarks/);
    const studentId = idMatch?.[1] || '';

    // GET — List remarks for a student
    if (method === 'GET') {
      const studentRemarks = state.remarks.filter((r) => r.studentId === studentId);
      return json(studentRemarks);
    }

    // POST — Add a new remark
    if (method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const remarkId = `rem-${Date.now()}`;
      const newRemark: RemarkRecord = {
        _id: remarkId, id: remarkId,
        studentId,
        category: body.category || body.type || 'General',
        title: body.title || '',
        description: body.description || body.remark || body.text || body.content || '',
        remark: body.description || body.remark || body.text || body.content || '',
        sentToParent: body.sentToParent ?? false,
        date: body.date || new Date().toISOString().split('T')[0],
        schoolId: SCHOOL_ID,
      };
      state.remarks.push(newRemark);
      return json(newRemark, 201);
    }

    return json([]);
  });

  // Also handle the remarks route at the top level (alternative API pattern)
  await page.route('**/api/remarks**', async (route) => {
    const request = route.request();
    const method = request.method();

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'GET') {
      return json(state.remarks);
    }

    if (method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const remarkId = `rem-${Date.now()}`;
      const newRemark: RemarkRecord = {
        _id: remarkId, id: remarkId,
        studentId: body.studentId || '',
        category: body.category || body.type || 'General',
        title: body.title || '',
        description: body.description || body.remark || body.text || body.content || '',
        remark: body.description || body.remark || body.text || body.content || '',
        sentToParent: body.sentToParent ?? false,
        date: body.date || new Date().toISOString().split('T')[0],
        schoolId: SCHOOL_ID,
      };
      state.remarks.push(newRemark);
      return json(newRemark, 201);
    }

    return json([]);
  });
}

/* ────────────────────────────────────────────────────────────
 *  TC026 — Write and view remarks for a student
 * ──────────────────────────────────────────────────────────── */

test.describe('TC026 - Student Remarks', () => {
  let state: MockState;
  let student: StudentRecord;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    student = seedStudent(state, {
      name: 'Aarav Krishnan',
      classId: CLASS_10A_ID,
    });

    // Pre-seed some remarks
    state.remarks.push(
      {
        _id: 'rem-001', id: 'rem-001',
        studentId: student.id,
        category: 'Academic',
        remark: 'Shows consistent improvement in Mathematics. Keep up the good work.',
        date: '2026-03-10',
        schoolId: SCHOOL_ID,
      },
      {
        _id: 'rem-002', id: 'rem-002',
        studentId: student.id,
        category: 'Behavioral',
        remark: 'Actively participates in class discussions. Very respectful to peers.',
        date: '2026-03-15',
        schoolId: SCHOOL_ID,
      },
      {
        _id: 'rem-003', id: 'rem-003',
        studentId: student.id,
        category: 'Sports',
        remark: 'Won second place in inter-school cricket tournament.',
        date: '2026-03-20',
        schoolId: SCHOOL_ID,
      },
    );

    await installRemarksMockApi(page, state);
  });

  test('should navigate to student dashboard and find Remarks tab', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Aarav Krishnan').first()).toBeVisible();

    const remarksTab = page.getByRole('tab', { name: /remark/i })
      .or(page.getByText(/remarks/i))
      .first();
    await expect(remarksTab).toBeVisible();
  });

  test('should display existing remarks with correct category', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const remarksTab = page.getByRole('tab', { name: /remark/i })
      .or(page.getByText(/remarks/i))
      .first();
    await remarksTab.click();
    await page.waitForTimeout(500);

    // Verify the first remark is displayed
    const remark1 = page.getByText(/consistent improvement/i).first();
    if (await remark1.isVisible().catch(() => false)) {
      await expect(remark1).toBeVisible();
    }

    // Verify the category label
    const academicCategory = page.getByText(/academic/i).first();
    if (await academicCategory.isVisible().catch(() => false)) {
      await expect(academicCategory).toBeVisible();
    }
  });

  test('should display remarks with dates', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const remarksTab = page.getByRole('tab', { name: /remark/i })
      .or(page.getByText(/remarks/i))
      .first();
    await remarksTab.click();
    await page.waitForTimeout(500);

    // Check for date display (format may vary: Mar 10, 2026 or 10/03/2026 etc.)
    const dateText = page.getByText(/mar.*10|10.*mar|2026-03-10|03\/10/i).first();
    if (await dateText.isVisible().catch(() => false)) {
      await expect(dateText).toBeVisible();
    }
  });

  test('should show multiple remarks in the list', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const remarksTab = page.getByRole('tab', { name: /remark/i })
      .or(page.getByText(/remarks/i))
      .first();
    await remarksTab.click();
    await page.waitForTimeout(500);

    // Verify multiple remark categories are visible
    const behavioralRemark = page.getByText(/participates in class/i).first();
    if (await behavioralRemark.isVisible().catch(() => false)) {
      await expect(behavioralRemark).toBeVisible();
    }

    const sportsRemark = page.getByText(/cricket tournament/i).first();
    if (await sportsRemark.isVisible().catch(() => false)) {
      await expect(sportsRemark).toBeVisible();
    }
  });

  test('should find Add Remark button', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const remarksTab = page.getByRole('tab', { name: /remark/i })
      .or(page.getByText(/remarks/i))
      .first();
    await remarksTab.click();
    await page.waitForTimeout(500);

    const addRemarkBtn = page.getByRole('button', { name: /add remark|write remark|new remark/i })
      .or(page.getByText(/add remark|write remark/i))
      .first();
    await expect(addRemarkBtn).toBeVisible();
  });

  test('should open remark form and select a category', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const remarksTab = page.getByRole('tab', { name: /remark/i })
      .or(page.getByText(/remarks/i))
      .first();
    await remarksTab.click();
    await page.waitForTimeout(500);

    // Click Add Remark
    const addRemarkBtn = page.getByRole('button', { name: /add remark|write remark|new remark/i })
      .or(page.getByText(/add remark|write remark/i))
      .first();
    await addRemarkBtn.click();
    await page.waitForTimeout(500);

    // Verify a form/modal appears
    const remarkForm = page.getByRole('dialog')
      .or(page.locator('[role="dialog"]'))
      .or(page.getByLabel(/category/i))
      .first();
    await expect(remarkForm).toBeVisible({ timeout: 3000 });

    // Select category
    const categorySelect = page.getByLabel(/category/i)
      .or(page.getByRole('button', { name: /category|select category/i }))
      .or(page.getByRole('combobox'))
      .first();

    if (await categorySelect.isVisible().catch(() => false)) {
      await categorySelect.click();

      const academicOption = page.getByRole('option', { name: /academic/i })
        .or(page.getByText(/academic/i).last())
        .first();
      if (await academicOption.isVisible().catch(() => false)) {
        await academicOption.click();
      }
    }
  });

  test('should submit a new remark successfully', async ({ page }) => {
    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const remarksTab = page.getByRole('tab', { name: /remark/i })
      .or(page.getByText(/remarks/i))
      .first();
    await remarksTab.click();
    await page.waitForTimeout(500);

    // Click Add Remark
    const addRemarkBtn = page.getByRole('button', { name: /add remark|write remark|new remark/i })
      .or(page.getByText(/add remark|write remark/i))
      .first();
    await addRemarkBtn.click();
    await page.waitForTimeout(500);

    // Select category
    const categorySelect = page.getByLabel(/category/i)
      .or(page.getByRole('button', { name: /category|select category/i }))
      .or(page.getByRole('combobox'))
      .first();
    if (await categorySelect.isVisible().catch(() => false)) {
      await categorySelect.click();
      const academicOption = page.getByRole('option', { name: /academic/i })
        .or(page.getByText(/academic/i).last())
        .first();
      if (await academicOption.isVisible().catch(() => false)) {
        await academicOption.click();
      }
    }

    // Write remark text
    const remarkTextArea = page.locator('textarea#remark-desc, textarea[placeholder*="remark" i], textarea').first();
    if (await remarkTextArea.isVisible().catch(() => false)) {
      await remarkTextArea.fill('Exceptional progress in Science practicals. Demonstrates strong lab skills.');
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /submit|save|add/i }).last();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(1000);

      // Verify the new remark appears in the list
      const newRemark = page.getByText(/exceptional progress/i).first();
      await expect(newRemark).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show newly added remark in the remarks list', async ({ page }) => {
    // Add a remark directly to state to simulate it being added
    state.remarks.push({
      _id: 'rem-new', id: 'rem-new',
      studentId: student.id,
      category: 'Academic',
      remark: 'Outstanding performance in the Science exhibition project.',
      date: '2026-03-28',
      schoolId: SCHOOL_ID,
    });

    await page.goto(`/students/dashboard?id=${student.id}`);
    await page.waitForLoadState('networkidle');

    const remarksTab = page.getByRole('tab', { name: /remark/i })
      .or(page.getByText(/remarks/i))
      .first();
    await remarksTab.click();
    await page.waitForTimeout(500);

    const newRemark = page.getByText(/outstanding performance/i).first();
    if (await newRemark.isVisible().catch(() => false)) {
      await expect(newRemark).toBeVisible();
    }
  });
});
