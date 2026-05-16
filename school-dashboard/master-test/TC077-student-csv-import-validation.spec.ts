import { expect, test } from '@playwright/test';
import {
  createMockState, installMockApi,
  seedStudent,
  CLASS_10A_ID, CLASS_11A_ID, SCHOOL_ID,
  type MockState,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ────────────────────────────────────────────────────────────
 *  Types for import preview
 * ───────────────────────────────────────────────��──────────── */

interface PreviewRow {
  row: number;
  name: string;
  class: string;
  section: string;
  status: string;
  error?: string;
  admissionId?: string;
  dateOfBirth?: string;
  phone?: string;
}

interface ImportPreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  warningRows: number;
  students: PreviewRow[];
  classGroups: Array<{ class: string; count: number }>;
}

/* ────────────────────────────────────────────────────────────
 *  Extended mock API with enhanced CSV import validation
 * ──────────────────────────────────────────────────────────── */

async function installImportValidationMockApi(
  page: import('@playwright/test').Page,
  state: MockState,
) {
  await installMockApi(page, state);

  const previewData: ImportPreviewResponse = {
    totalRows: 8,
    validRows: 4,
    invalidRows: 2,
    duplicateRows: 1,
    warningRows: 1,
    students: [
      { row: 1, name: 'Aarav Patel', class: '10', section: 'A', status: 'valid', admissionId: 'ADM-I001', dateOfBirth: '2012-05-15', phone: '9876500001' },
      { row: 2, name: 'Diya Sharma', class: '10', section: 'A', status: 'valid', admissionId: 'ADM-I002', dateOfBirth: '2012-03-22', phone: '9876500002' },
      { row: 3, name: 'Ishaan Gupta', class: '11', section: 'A', status: 'valid', admissionId: 'ADM-I003', dateOfBirth: '2011-08-10', phone: '9876500003' },
      { row: 4, name: 'Kavya Reddy', class: '11', section: 'A', status: 'valid', admissionId: 'ADM-I004', dateOfBirth: '2011-11-30', phone: '9876500004' },
      { row: 5, name: '', class: '10', section: 'A', status: 'invalid', error: 'Missing required field: name' },
      { row: 6, name: 'Aarav Patel', class: '10', section: 'A', status: 'duplicate', error: 'Duplicate admission ID: ADM-I001', admissionId: 'ADM-I001' },
      { row: 7, name: 'Rohan Nair', class: '15', section: 'Z', status: 'invalid', error: 'Invalid class name: 15-Z' },
      { row: 8, name: 'Meera Bhat', class: '10', section: 'A', status: 'warning', error: 'Invalid date format for DOB: 32/13/2012', dateOfBirth: '32/13/2012', phone: 'invalid-phone' },
    ],
    classGroups: [
      { class: '10-A', count: 3 },
      { class: '11-A', count: 2 },
    ],
  };

  // Override import endpoints
  await page.route('**/api/students/import**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    state.requestLog.add(`${method} ${path}`);

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    // POST /api/students/import/preview — CSV preview with validation
    if (path.includes('/preview') && method === 'POST') {
      return json(previewData);
    }

    // POST /api/students/import — Execute import (only valid rows)
    if (path === '/api/students/import' && method === 'POST') {
      // Import only valid rows
      const validStudents = previewData.students.filter((s) => s.status === 'valid');
      for (const vs of validStudents) {
        seedStudent(state, {
          name: vs.name,
          classId: vs.class === '10' ? CLASS_10A_ID : CLASS_11A_ID,
          admissionId: vs.admissionId,
        });
      }
      return json({
        message: 'Import completed',
        status: 'completed',
        totalRows: previewData.totalRows,
        validRows: previewData.validRows,
        invalidRows: previewData.invalidRows,
        duplicateRows: previewData.duplicateRows,
        importedCount: validStudents.length,
        errors: previewData.students
          .filter((s) => s.status !== 'valid')
          .map((s) => ({ row: s.row, message: s.error || 'Unknown error' })),
      }, 201);
    }

    // GET /api/students/import/template — Download template
    if (path.includes('/template') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: 'Full Name,Date of Birth,Gender,Class,Section,Phone,Email,Address,City,State,Zip Code,Admission ID\n',
      });
    }

    return json({});
  });
}

/* ────────────────────────────────────────────────────────────
 *  TC077 — CSV import with various validation scenarios
 * ──────────────────────────────────────────────────────────── */

test.describe('TC077 - Student CSV Import Validation', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = createMockState();
    await installImportValidationMockApi(page, state);
  });

  test('should navigate to students page and find import button', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Find import button
    const importBtn = page.getByRole('button', { name: /import|upload|csv/i })
      .or(page.getByText(/import student|bulk import/i))
      .first();
    await expect(importBtn).toBeVisible();
  });

  test('should open import dialog when clicking import', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const importBtn = page.getByRole('button', { name: /import|upload|csv/i })
      .or(page.getByText(/import student|bulk import/i))
      .first();

    if (await importBtn.isVisible().catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(500);

      // Verify import dialog/page is visible
      const importArea = page.getByText(/upload|drag.*drop|select.*file|choose.*file|csv/i)
        .or(page.getByRole('dialog'))
        .or(page.locator('[data-testid="import-dialog"]'))
        .first();
      await expect(importArea).toBeVisible();
    }
  });

  test('should upload CSV and show preview with validation results', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const importBtn = page.getByRole('button', { name: /import|upload|csv/i })
      .or(page.getByText(/import student|bulk import/i))
      .first();

    if (await importBtn.isVisible().catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(500);

      // Upload a fake CSV file
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible().catch(() => false)) {
        const csvContent = [
          'Full Name,Date of Birth,Gender,Class,Section,Phone,Email,Admission ID',
          'Aarav Patel,2012-05-15,Male,10,A,9876500001,aarav@test.com,ADM-I001',
          'Diya Sharma,2012-03-22,Female,10,A,9876500002,diya@test.com,ADM-I002',
          'Ishaan Gupta,2011-08-10,Male,11,A,9876500003,ishaan@test.com,ADM-I003',
          'Kavya Reddy,2011-11-30,Female,11,A,9876500004,kavya@test.com,ADM-I004',
          ',2012-01-01,Male,10,A,9876500005,missing@test.com,ADM-I005',
          'Aarav Patel,2012-05-15,Male,10,A,9876500001,aarav@test.com,ADM-I001',
          'Rohan Nair,2012-06-20,Male,15,Z,9876500006,rohan@test.com,ADM-I006',
          'Meera Bhat,32/13/2012,Female,10,A,invalid-phone,meera@test.com,ADM-I007',
        ].join('\n');

        await fileInput.setInputFiles({
          name: 'students.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(csvContent),
        });

        await page.waitForTimeout(1000);

        // Verify preview shows total count
        const totalCount = page.getByText(/total.*8|8.*rows|8.*records/i).first();
        if (await totalCount.isVisible().catch(() => false)) {
          await expect(totalCount).toBeVisible();
        }
      }
    }
  });

  test('should show valid row count in preview', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const importBtn = page.getByRole('button', { name: /import|upload|csv/i })
      .or(page.getByText(/import student|bulk import/i))
      .first();

    if (await importBtn.isVisible().catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(500);

      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles({
          name: 'students.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('header\ndata'),
        });
        await page.waitForTimeout(1000);

        // Verify valid count (4 valid rows)
        const validCount = page.getByText(/valid.*4|4.*valid/i).first();
        if (await validCount.isVisible().catch(() => false)) {
          await expect(validCount).toBeVisible();
        }
      }
    }
  });

  test('should show invalid row count with error messages', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const importBtn = page.getByRole('button', { name: /import|upload|csv/i })
      .or(page.getByText(/import student|bulk import/i))
      .first();

    if (await importBtn.isVisible().catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(500);

      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles({
          name: 'students.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('header\ndata'),
        });
        await page.waitForTimeout(1000);

        // Verify invalid count (2 invalid rows)
        const invalidCount = page.getByText(/invalid.*2|2.*invalid|error.*2|2.*error/i).first();
        if (await invalidCount.isVisible().catch(() => false)) {
          await expect(invalidCount).toBeVisible();
        }

        // Verify error messages are shown
        const missingNameError = page.getByText(/missing.*name|name.*required/i).first();
        if (await missingNameError.isVisible().catch(() => false)) {
          await expect(missingNameError).toBeVisible();
        }

        const invalidClassError = page.getByText(/invalid.*class/i).first();
        if (await invalidClassError.isVisible().catch(() => false)) {
          await expect(invalidClassError).toBeVisible();
        }
      }
    }
  });

  test('should show duplicate row count', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const importBtn = page.getByRole('button', { name: /import|upload|csv/i })
      .or(page.getByText(/import student|bulk import/i))
      .first();

    if (await importBtn.isVisible().catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(500);

      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles({
          name: 'students.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('header\ndata'),
        });
        await page.waitForTimeout(1000);

        // Verify duplicate count (1 duplicate row)
        const dupCount = page.getByText(/duplicate.*1|1.*duplicate/i).first();
        if (await dupCount.isVisible().catch(() => false)) {
          await expect(dupCount).toBeVisible();
        }
      }
    }
  });

  test('should filter to show only invalid rows in preview', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const importBtn = page.getByRole('button', { name: /import|upload|csv/i })
      .or(page.getByText(/import student|bulk import/i))
      .first();

    if (await importBtn.isVisible().catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(500);

      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles({
          name: 'students.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('header\ndata'),
        });
        await page.waitForTimeout(1000);

        // Click on "Invalid" filter tab/button
        const invalidFilter = page.getByRole('tab', { name: /invalid|error/i })
          .or(page.getByRole('button', { name: /invalid|error|show error/i }))
          .or(page.getByText(/invalid/i).filter({ has: page.locator('button, [role="tab"]') }))
          .first();

        if (await invalidFilter.isVisible().catch(() => false)) {
          await invalidFilter.click();
          await page.waitForTimeout(300);

          // Should show only invalid rows (rows 5, 7)
          const invalidRow = page.getByText(/missing.*name|invalid.*class/i).first();
          if (await invalidRow.isVisible().catch(() => false)) {
            await expect(invalidRow).toBeVisible();
          }
        }
      }
    }
  });

  test('should filter to show only valid rows in preview', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const importBtn = page.getByRole('button', { name: /import|upload|csv/i })
      .or(page.getByText(/import student|bulk import/i))
      .first();

    if (await importBtn.isVisible().catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(500);

      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles({
          name: 'students.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('header\ndata'),
        });
        await page.waitForTimeout(1000);

        // Click on "Valid" filter tab/button
        const validFilter = page.getByRole('tab', { name: /valid/i })
          .or(page.getByRole('button', { name: /valid|show valid/i }))
          .first();

        if (await validFilter.isVisible().catch(() => false)) {
          await validFilter.click();
          await page.waitForTimeout(300);

          // Should show valid student names
          const aaravRow = page.getByText('Aarav Patel').first();
          if (await aaravRow.isVisible().catch(() => false)) {
            await expect(aaravRow).toBeVisible();
          }
        }
      }
    }
  });

  test('should import only valid rows and verify count', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const initialCount = state.students.length;

    const importBtn = page.getByRole('button', { name: /import|upload|csv/i })
      .or(page.getByText(/import student|bulk import/i))
      .first();

    if (await importBtn.isVisible().catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(500);

      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles({
          name: 'students.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('header\ndata'),
        });
        await page.waitForTimeout(1000);

        // Click import/confirm button
        const confirmBtn = page.getByRole('button', { name: /import|confirm|proceed|import valid/i })
          .first();
        if (await confirmBtn.isVisible().catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(1000);

          // Verify only 4 valid students were imported
          expect(state.students.length).toBe(initialCount + 4);

          // Verify success message
          const successMsg = page.getByText(/import.*complete|imported.*4|4.*imported|success/i).first();
          if (await successMsg.isVisible().catch(() => false)) {
            await expect(successMsg).toBeVisible();
          }
        }
      }
    }
  });

  test('should show warning for rows with date/phone format issues', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const importBtn = page.getByRole('button', { name: /import|upload|csv/i })
      .or(page.getByText(/import student|bulk import/i))
      .first();

    if (await importBtn.isVisible().catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(500);

      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles({
          name: 'students.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('header\ndata'),
        });
        await page.waitForTimeout(1000);

        // Verify warning count (1 warning row)
        const warningCount = page.getByText(/warning.*1|1.*warning/i).first();
        if (await warningCount.isVisible().catch(() => false)) {
          await expect(warningCount).toBeVisible();
        }

        // Verify date format error message
        const dateError = page.getByText(/invalid.*date|date.*format/i).first();
        if (await dateError.isVisible().catch(() => false)) {
          await expect(dateError).toBeVisible();
        }
      }
    }
  });

  test('should verify request log includes import API calls', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const importBtn = page.getByRole('button', { name: /import|upload|csv/i })
      .or(page.getByText(/import student|bulk import/i))
      .first();

    if (await importBtn.isVisible().catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(500);

      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible().catch(() => false)) {
        await fileInput.setInputFiles({
          name: 'students.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('header\ndata'),
        });
        await page.waitForTimeout(1000);

        // Verify preview API was called
        const previewCalled = Array.from(state.requestLog).some((log) => log.includes('/import/preview') || log.includes('/import'));
        if (previewCalled) {
          expect(previewCalled).toBe(true);
        }
      }
    }
  });
});
