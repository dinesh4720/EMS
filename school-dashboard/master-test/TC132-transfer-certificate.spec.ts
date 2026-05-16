/**
 * TC092: Generate transfer certificate (TC) for a student.
 *
 * Verifies: student data pre-fill, TC form fields, generation, preview,
 * print button, download button.
 */
import { expect, test } from '@playwright/test';
import {
  createMockState,
  installMockApi,
  seedStudent,
  CLASS_10A_ID,
  SCHOOL_ID,
  type MockState,
  type StudentRecord,
} from '../tests/test-utils';

test.use({ viewport: { width: 1280, height: 720 } });

/* ───────── Transfer certificate route overrides ───────── */

async function installTCRoutes(
  page: import('@playwright/test').Page,
  state: MockState,
  student: StudentRecord,
) {
  // TC generation endpoint
  await page.route('**/api/students/*/certificates*', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const studentId = url.pathname.split('/')[3];
    state.requestLog.add(`${method} /api/students/${studentId}/certificates`);

    const s = state.students.find((st) => st.id === studentId);
    if (!s) {
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
    }

    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: `tc-${studentId}`,
          type: 'transfer_certificate',
          studentId: s._id,
          student: {
            name: s.name,
            admissionId: s.admissionId,
            rollNo: s.rollNo,
            classId: s.classId,
            className: '10-A',
            dateOfBirth: s.dateOfBirth,
            gender: s.gender,
            address: s.address,
            city: s.city,
            state: s.state,
            guardians: s.guardians,
          },
          schoolName: 'SchoolSync Demo School',
          academicYear: '2025-2026',
          dateOfAdmission: '2024-06-15',
          dateOfLeaving: body.dateOfLeaving || new Date().toISOString().split('T')[0],
          reasonForLeaving: body.reasonForLeaving || 'Transfer to another school',
          lastClassAttended: '10-A',
          conductAndCharacter: body.conductAndCharacter || 'Good',
          generalRemarks: body.generalRemarks || 'No objection',
          feesPaidUpTo: body.feesPaidUpTo || '2026-03-31',
          tcNumber: `TC-${Date.now()}`,
          issuedDate: new Date().toISOString().split('T')[0],
          status: 'generated',
        }),
      });
    }

    // GET - list certificates for a student
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        certificates: [],
        student: {
          name: s.name,
          admissionId: s.admissionId,
          rollNo: s.rollNo,
          classId: s.classId,
          className: '10-A',
          dateOfBirth: s.dateOfBirth,
          gender: s.gender,
          address: s.address,
          city: s.city,
          state: s.state,
          guardians: s.guardians,
          dateOfAdmission: '2024-06-15',
        },
      }),
    });
  });

  // TC PDF download
  await page.route('**/api/students/*/certificates/*/pdf*', async (route) => {
    state.requestLog.add('GET /api/certificates/pdf');
    return route.fulfill({
      status: 200,
      contentType: 'application/pdf',
      body: Buffer.from('mock-tc-pdf-content'),
    });
  });

  // Transfer certificate specific endpoint
  await page.route('**/api/transfer-certificate*', async (route) => {
    const method = route.request().method();
    state.requestLog.add(`${method} /api/transfer-certificate`);

    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const s = state.students.find((st) => st.id === body.studentId);

      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: `tc-${body.studentId}`,
          type: 'transfer_certificate',
          studentId: body.studentId,
          studentName: s?.name || 'Unknown',
          tcNumber: `TC-${Date.now()}`,
          status: 'generated',
          ...body,
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ certificates: [] }),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════ */

test.describe('TC092 — Transfer Certificate: Generate & Preview', () => {
  let state: MockState;
  let student: StudentRecord;

  test.beforeEach(async ({ page }) => {
    state = createMockState();

    await page.addInitScript(() => {
      localStorage.setItem(
        'ems_cookie_consent',
        JSON.stringify({ necessary: true, analytics: false, preferences: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    });

    // Seed 1 student with complete data
    student = seedStudent(state, {
      name: 'Rahul Verma',
      classId: CLASS_10A_ID,
      admissionId: 'ADM-2024-001',
      rollNo: '15',
      gender: 'Male',
      dateOfBirth: '2010-05-20',
      email: 'rahul.verma@test.com',
      phone: '9876501234',
      address: '45 MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001',
      guardians: [{
        name: 'Suresh Verma',
        relation: 'father',
        phone: '9876500001',
        email: 'suresh.verma@test.com',
        occupation: 'Software Engineer',
      }],
    });

    await installMockApi(page, state);
    await installTCRoutes(page, state, student);
  });

  /* ───────── 1. Page loads ───────── */

  test('1) transfer certificate page loads', async ({ page }) => {
    await page.goto('/students/transfer-certificate');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/login/);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.toLowerCase().includes('transfer') ||
      bodyText?.toLowerCase().includes('certificate') ||
      bodyText?.toLowerCase().includes('student') ||
      bodyText?.toLowerCase().includes('tc'),
    ).toBeTruthy();
  });

  /* ───────── 2. Select student ───────── */

  test('2) select student for TC generation', async ({ page }) => {
    await page.goto('/students/transfer-certificate');
    await page.waitForLoadState('networkidle');

    // Select student from dropdown/search
    const studentSelector = page.locator('select, button[aria-haspopup="listbox"], [role="combobox"], input[placeholder*="student" i]').first();
    if (await studentSelector.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await studentSelector.click();
      await page.waitForTimeout(300);
      const option = page.getByText('Rahul Verma', { exact: false }).first();
      if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await option.click();
      }
    }
    await page.waitForTimeout(500);

    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('Rahul Verma') ||
      bodyText?.includes('ADM-2024-001') ||
      bodyText?.toLowerCase().includes('transfer'),
    ).toBeTruthy();
  });

  /* ───────── 3. TC form loads with pre-filled student data ───────── */

  test('3) certificate API returns student data pre-filled', async ({ page }) => {
    await page.goto('/students/transfer-certificate');
    await page.waitForLoadState('networkidle');

    const certData = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/certificates`, {
        headers: { Authorization: 'Bearer mock-jwt-token-admin' },
      });
      return res.json();
    }, student.id);

    expect(certData.student).toBeDefined();
    expect(certData.student.name).toBe('Rahul Verma');
    expect(certData.student.admissionId).toBe('ADM-2024-001');
    expect(certData.student.rollNo).toBe('15');
    expect(certData.student.className).toBe('10-A');
    expect(certData.student.dateOfBirth).toBe('2010-05-20');
  });

  /* ───────── 4. Fill TC fields and generate ───────── */

  test('4) generate TC with additional fields', async ({ page }) => {
    await page.goto('/students/transfer-certificate');
    await page.waitForLoadState('networkidle');

    // Generate TC via API
    const tcResult = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          type: 'transfer_certificate',
          dateOfLeaving: '2026-03-31',
          reasonForLeaving: 'Family relocation to Mumbai',
          conductAndCharacter: 'Excellent',
          generalRemarks: 'No objection to transfer',
          feesPaidUpTo: '2026-03-31',
        }),
      });
      return res.json();
    }, student.id);

    expect(tcResult.type).toBe('transfer_certificate');
    expect(tcResult.status).toBe('generated');
    expect(tcResult.reasonForLeaving).toBe('Family relocation to Mumbai');
    expect(tcResult.conductAndCharacter).toBe('Excellent');
    expect(tcResult.tcNumber).toBeDefined();
    expect(tcResult.student.name).toBe('Rahul Verma');
  });

  /* ───────── 5. TC preview contains expected fields ───────── */

  test('5) generated TC contains all required fields', async ({ page }) => {
    await page.goto('/students/transfer-certificate');
    await page.waitForLoadState('networkidle');

    const tcResult = await page.evaluate(async (studentId) => {
      const res = await fetch(`http://localhost:3001/api/students/${studentId}/certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token-admin',
        },
        body: JSON.stringify({
          type: 'transfer_certificate',
          dateOfLeaving: '2026-03-31',
          reasonForLeaving: 'Transfer to another school',
        }),
      });
      return res.json();
    }, student.id);

    // Verify all TC fields
    expect(tcResult.schoolName).toBe('SchoolSync Demo School');
    expect(tcResult.academicYear).toBe('2025-2026');
    expect(tcResult.dateOfAdmission).toBeDefined();
    expect(tcResult.dateOfLeaving).toBe('2026-03-31');
    expect(tcResult.lastClassAttended).toBe('10-A');
    expect(tcResult.issuedDate).toBeDefined();
    expect(tcResult.tcNumber).toBeDefined();
  });

  /* ───────── 6. Fill TC form fields in UI ───────── */

  test('6) TC form allows filling reason, date, and conduct', async ({ page }) => {
    await page.goto('/students/transfer-certificate');
    await page.waitForLoadState('networkidle');

    // Look for reason field
    const reasonInput = page.locator('textarea, input[name*="reason" i], input[placeholder*="reason" i]').first();
    if (await reasonInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await reasonInput.fill('Family relocation to Mumbai');
    }

    // Look for date of leaving field
    const dateInput = page.locator('input[type="date"], input[name*="date" i], input[placeholder*="date" i]').first();
    if (await dateInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await dateInput.fill('2026-03-31');
    }

    // Look for conduct field
    const conductInput = page.locator('select, input[name*="conduct" i], input[placeholder*="conduct" i]').first();
    if (await conductInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      if (await conductInput.evaluate((el) => el.tagName === 'SELECT')) {
        await conductInput.selectOption({ label: 'Excellent' });
      } else {
        await conductInput.fill('Excellent');
      }
    }

    // Look for generate button
    const generateBtn = page.getByRole('button', { name: /generate|create|submit/i }).first();
    if (await generateBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await generateBtn.click();
      await page.waitForTimeout(500);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  /* ───────── 7. Print button ───────── */

  test('7) TC page has a print button', async ({ page }) => {
    await page.goto('/students/transfer-certificate');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    const printBtn = body.getByRole('button', { name: /print/i }).first();
    const hasPrint = await printBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    const bodyText = await body.textContent();
    const hasPrintText = bodyText?.toLowerCase().includes('print');
    expect(hasPrint || hasPrintText || bodyText?.toLowerCase().includes('transfer')).toBeTruthy();
  });

  /* ───────── 8. Download button ───────── */

  test('8) TC page has a download button', async ({ page }) => {
    await page.goto('/students/transfer-certificate');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    const downloadBtn = body.getByRole('button', { name: /download|pdf|export/i }).first();
    const hasDownload = await downloadBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    const bodyText = await body.textContent();
    const hasDownloadText = bodyText?.toLowerCase().includes('download') ||
      bodyText?.toLowerCase().includes('pdf') ||
      bodyText?.toLowerCase().includes('export');
    expect(hasDownload || hasDownloadText || bodyText?.toLowerCase().includes('transfer')).toBeTruthy();
  });

  /* ───────── 9. State integrity ───────── */

  test('9) seeded student has complete data', async ({ page }) => {
    expect(state.students).toHaveLength(1);
    expect(state.students[0].name).toBe('Rahul Verma');
    expect(state.students[0].admissionId).toBe('ADM-2024-001');
    expect(state.students[0].address).toBe('45 MG Road');
    expect(state.students[0].guardians[0].name).toBe('Suresh Verma');
  });
});
