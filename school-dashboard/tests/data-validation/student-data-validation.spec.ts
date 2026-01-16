import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { StudentsPage } from '../pages/StudentsPage';
import { testData } from '../fixtures/users';

/**
 * DATA INTEGRITY: Student Management
 *
 * Tests all student form fields for:
 * 1. Database storage
 * 2. UI utilization
 * 3. Field mapping accuracy
 */
test.describe('Data Integrity: Student Management', () => {
  let loginPage: LoginPage;
  let studentsPage: StudentsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    studentsPage = new StudentsPage(page);

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
      process.env.TEST_ADMIN_PASSWORD || 'admin123'
    );
  });

  test('DATA-002: Student Admission - Complete Field Validation', async ({ page, request }) => {
    const timestamp = Date.now();
    const studentData = {
      firstName: `TestStudent${timestamp}`,
      lastName: 'Last',
      email: `teststudent${timestamp}@test.com`,
      phone: '9876543210',
      class: 'Class 10',
      section: 'A',
      dob: '2010-01-01',
      gender: 'Male',
      bloodGroup: 'B+',
      fatherName: 'Test Father',
      motherName: 'Test Mother',
      guardianPhone: '9876543211',
      address: '456 Test Address',
      admissionDate: new Date().toISOString().split('T')[0],
      rollNumber: `${timestamp}`
    };

    // STEP 1: Fill admission form
    await studentsPage.goto();
    await studentsPage.clickAddStudent();

    // Map and fill all form fields
    const formFields = page.locator('form input, form select, form textarea');
    const fieldCount = await formFields.count();

    const filledFields: Array<{
      fieldName: string;
      inputName: string;
      value: string;
      fieldType: string;
    }> = [];

    for (let i = 0; i < fieldCount; i++) {
      const field = formFields.nth(i);
      const inputName = await field.getAttribute('name') || await field.getAttribute('id') || `field_${i}`;
      const placeholder = await field.getAttribute('placeholder') || '';
      const fieldType = await field.getAttribute('type') || 'text';
      const tagName = await field.evaluate(el => el.tagName.toLowerCase());

      // Determine value to fill
      let valueToFill = '';

      if (inputName.toLowerCase().includes('firstname') || placeholder.toLowerCase().includes('first')) {
        valueToFill = studentData.firstName;
      } else if (inputName.toLowerCase().includes('lastname') || placeholder.toLowerCase().includes('last')) {
        valueToFill = studentData.lastName;
      } else if (inputName.toLowerCase().includes('email')) {
        valueToFill = studentData.email;
      } else if (inputName.toLowerCase().includes('phone') || inputName.toLowerCase().includes('mobile')) {
        valueToFill = inputName.toLowerCase().includes('guardian') ? studentData.guardianPhone : studentData.phone;
      } else if (inputName.toLowerCase().includes('class')) {
        valueToFill = studentData.class;
      } else if (inputName.toLowerCase().includes('section')) {
        valueToFill = studentData.section;
      } else if (inputName.toLowerCase().includes('dob') || inputName.toLowerCase().includes('date')) {
        valueToFill = studentData.dob;
      } else if (inputName.toLowerCase().includes('gender')) {
        valueToFill = studentData.gender;
      } else if (inputName.toLowerCase().includes('blood')) {
        valueToFill = studentData.bloodGroup;
      } else if (inputName.toLowerCase().includes('father') || inputName.toLowerCase().includes('dad')) {
        valueToFill = studentData.fatherName;
      } else if (inputName.toLowerCase().includes('mother') || inputName.toLowerCase().includes('mom')) {
        valueToFill = studentData.motherName;
      } else if (inputName.toLowerCase().includes('address')) {
        valueToFill = studentData.address;
      } else if (inputName.toLowerCase().includes('roll') || inputName.toLowerCase().includes('number')) {
        valueToFill = studentData.rollNumber;
      } else if (inputName.toLowerCase().includes('admission') && inputName.toLowerCase().includes('date')) {
        valueToFill = studentData.admissionDate;
      }

      // Fill the field
      if (valueToFill) {
        try {
          if (tagName === 'select') {
            await field.selectOption(valueToFill);
          } else {
            await field.fill(valueToFill);
          }

          filledFields.push({
            fieldName: inputName,
            inputName: placeholder || inputName,
            value: valueToFill,
            fieldType: fieldType
          });

          console.log(`✓ Filled: ${inputName} = "${valueToFill}"`);
        } catch (e) {
          console.log(`✗ Failed to fill: ${inputName}`);
        }
      } else {
        console.log(`⚠ No value mapped for: ${inputName}`);
      }
    }

    // Submit form
    await studentsPage.helpers.clickButton(/submit|save|admit/i);
    await page.waitForTimeout(3000);

    // STEP 2: Verify in database via API
    let dbStudent: any = null;
    try {
      const searchResponse = await request.get(`/api/students?email=${studentData.email}`);
      if (searchResponse.ok()) {
        const searchResult = await searchResponse.json();
        dbStudent = searchResult.data?.find((s: any) => s.email === studentData.email);
      }
    } catch (e) {
      console.log('API search failed, trying alternative methods...');
    }

    // If API search fails, try searching in UI and then get details
    if (!dbStudent) {
      await studentsPage.searchStudent(studentData.firstName);
      await page.waitForTimeout(1000);

      const table = studentsPage.studentsTable;
      const studentRow = table.locator('tr, [role="row"]').filter({ hasText: studentData.firstName }).first();

      const rowExists = await studentRow.count() > 0;
      expect(rowExists).toBeTruthy();

      // Click to view details
      await studentRow.locator('button, a').filter({ hasText: /view|profile/i }).first().click();
      await page.waitForTimeout(1000);

      // Extract student ID from URL
      const url = page.url();
      const studentIdMatch = url.match(/students\/([a-f0-9]{24})/);
      const studentId = studentIdMatch ? studentIdMatch[1] : null;

      if (studentId) {
        const detailResponse = await request.get(`/api/students/${studentId}`);
        if (detailResponse.ok()) {
          dbStudent = await detailResponse.json();
        }
      }
    }

    expect(dbStudent).toBeDefined();

    // STEP 3: Validate each field
    const validationReport: {
      totalFields: number;
      fieldsStoredInDb: number;
      fieldsMatched: number;
      fieldsNotStored: number;
      fieldsNotMatched: number;
      fieldDetails: Array<{
        inputName: string;
        fieldName: string;
        inputValue: string;
        dbValue: any;
        stored: boolean;
        matched: boolean;
        utilization: string[];
      }>;
      unusedFields: string[];
    } = {
      totalFields: filledFields.length,
      fieldsStoredInDb: 0,
      fieldsMatched: 0,
      fieldsNotStored: 0,
      fieldsNotMatched: 0,
      fieldDetails: [],
      unusedFields: []
    };

    for (const field of filledFields) {
      const dbFieldName = mapStudentFieldToDbField(field.fieldName);
      const dbValue = dbStudent.data || dbStudent ? (dbStudent.data || dbStudent)[dbFieldName] : undefined;

      const stored = dbValue !== undefined && dbValue !== null && dbValue !== '';
      const matched = stored && String(dbValue).toLowerCase() === String(field.value).toLowerCase();

      // Check utilization - where is this data used?
      const utilization: string[] = [];

      if (matched) {
        // Check if displayed in list view
        const displayedInList = await page.locator(`text=${field.value}`).count() > 0;
        if (displayedInList) {
          utilization.push('student-list');
        }

        // Check if displayed in profile
        const displayedInProfile = await page.locator('[class*="profile"]').getByText(field.value).count() > 0;
        if (displayedInProfile) {
          utilization.push('student-profile');
        }

        // Check if used in fee records
        try {
          const feeResponse = await request.get(`/api/fees?student=${dbStudent._id || dbStudent.data?._id}`);
          if (feeResponse.ok() && (await feeResponse.json()).data?.length > 0) {
            utilization.push('fee-records');
          }
        } catch (e) {
          // Fee endpoint might not exist or student has no fees
        }

        // Check if used in attendance
        try {
          const attendanceResponse = await request.get(`/api/attendance?student=${dbStudent._id || dbStudent.data?._id}`);
          if (attendanceResponse.ok()) {
            utilization.push('attendance-records');
          }
        } catch (e) {
          // Attendance endpoint might not exist
        }
      }

      if (stored) validationReport.fieldsStoredInDb++;
      if (matched) validationReport.fieldsMatched++;
      if (!stored) validationReport.fieldsNotStored++;
      if (stored && !matched) validationReport.fieldsNotMatched++;

      validationReport.fieldDetails.push({
        inputName: field.inputName,
        fieldName: field.fieldName,
        inputValue: field.value,
        dbValue: dbValue || 'NOT_FOUND',
        stored: stored,
        matched: matched,
        utilization: utilization
      });

      // If field has no utilization anywhere, mark as potentially unused
      if (matched && utilization.length === 0) {
        validationReport.unusedFields.push(field.fieldName);
      }

      console.log(`\nField: ${field.fieldName}`);
      console.log(`  Input: "${field.value}"`);
      console.log(`  DB: "${dbValue || 'NOT_FOUND'}"`);
      console.log(`  Stored: ${stored ? '✓' : '✗'}`);
      console.log(`  Matched: ${matched ? '✓' : '✗'}`);
      console.log(`  Utilization: ${utilization.length > 0 ? utilization.join(', ') : 'NONE (POTENTIALLY UNUSED)'}`);
    }

    // STEP 4: Generate comprehensive report
    const finalReport = {
      testName: 'DATA-002: Student Admission - Complete Field Validation',
      timestamp: new Date().toISOString(),
      studentEmail: studentData.email,
      summary: validationReport,
      recommendations: generateRecommendations(validationReport)
    };

    console.log('\n' + '='.repeat(80));
    console.log('DATA VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(JSON.stringify(finalReport, null, 2));
    console.log('='.repeat(80));

    // Assertions
    expect(validationReport.fieldsStoredInDb).toBeGreaterThan(0);
    expect(validationReport.fieldsStoredInDb / validationReport.totalFields).toBeGreaterThanOrEqual(0.5); // At least 50% should be stored

    // Warn about unused fields
    if (validationReport.unusedFields.length > 0) {
      console.warn(`\n⚠️ WARNING: ${validationReport.unusedFields.length} fields are stored but not used anywhere:`);
      validationReport.unusedFields.forEach(f => console.warn(`  - ${f}`));
    }

    // Save report
    await saveReport(page, finalReport);
  });
});

function mapStudentFieldToDbField(fieldName: string): string {
  const fieldMap: Record<string, string> = {
    'firstname': 'firstName',
    'lastname': 'lastName',
    'email': 'email',
    'phone': 'phone',
    'class': 'class',
    'section': 'section',
    'dob': 'dateOfBirth',
    'gender': 'gender',
    'bloodgroup': 'bloodGroup',
    'fathername': 'fatherName',
    'mothername': 'motherName',
    'guardianphone': 'guardianPhone',
    'address': 'address',
    'rollnumber': 'rollNumber',
    'admissiondate': 'admissionDate'
  };

  const normalized = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [key, value] of Object.entries(fieldMap)) {
    if (normalized.includes(key.replace(/[^a-z0-9]/g, ''))) {
      return value;
    }
  }

  return fieldName;
}

function generateRecommendations(report: any): string[] {
  const recommendations: string[] = [];

  if (report.fieldsNotStored > 0) {
    recommendations.push(`${report.fieldsNotStored} fields are NOT being saved to database. Review form submission logic.`);
  }

  if (report.fieldsNotMatched > 0) {
    recommendations.push(`${report.fieldsNotMatched} fields have mismatched values. Check field mapping and data transformation.`);
  }

  if (report.unusedFields.length > 0) {
    recommendations.push(`${report.unusedFields.length} fields are stored but never used. Consider removing them or implementing their usage.`);
  }

  const storageRate = (report.fieldsStoredInDb / report.totalFields) * 100;
  if (storageRate < 80) {
    recommendations.push(`Only ${storageRate.toFixed(1)}% of fields are being stored. Investigate missing fields.`);
  }

  return recommendations;
}

async function saveReport(page: any, report: any) {
  const filename = `data-validation-${Date.now()}.json`;

  // Save to file via Node.js (if running in Node environment)
  try {
    const fs = await import('fs');
    fs.writeFileSync(`test-results/${filename}`, JSON.stringify(report, null, 2));
    console.log(`\n✓ Report saved to: test-results/${filename}`);
  } catch (e) {
    // Fallback: download via browser
    await page.evaluate((data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-validation-report-${Date.now()}.json`;
      a.click();
    }, report);
  }
}
