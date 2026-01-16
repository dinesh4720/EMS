import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { StaffPage } from '../pages/StaffPage';
import { StudentsPage } from '../pages/StudentsPage';
import { FeesPage } from '../pages/FeesPage';
import { testData } from '../fixtures/users';

/**
 * DATA INTEGRITY & FIELD MAPPING TESTS
 *
 * These tests verify:
 * 1. Input → DB Storage: Data from forms is saved to database
 * 2. DB → Utilization: Saved data is displayed/used in the application
 * 3. Unused Fields: Orphan fields that don't connect to DB or aren't used
 *
 * Prerequisites:
 * - Backend API must be accessible
 * - Database connection must be available
 * - Test user with admin privileges
 */

test.describe('Data Integrity: Staff Management', () => {
  let loginPage: LoginPage;
  let staffPage: StaffPage;
  let apiContext: any;

  test.beforeEach(async ({ page, request }) => {
    loginPage = new LoginPage(page);
    staffPage = new StaffPage(page);
    apiContext = request;

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
      process.env.TEST_ADMIN_PASSWORD || 'admin123'
    );
  });

  test('DATA-001: Staff Creation - Full Field Mapping', async ({ page }) => {
    const timestamp = Date.now();
    const staffData = {
      name: `Test Staff ${timestamp}`,
      email: `teststaff${timestamp}@test.com`,
      phone: '1234567890',
      role: 'Teacher',
      qualification: 'M.Sc Mathematics',
      experience: '5',
      address: '123 Test Street',
      joiningDate: '2024-01-01',
      salary: '50000',
      bloodGroup: 'O+',
      emergencyContact: '9876543210'
    };

    // STEP 1: Submit form with all fields
    await staffPage.goto();
    await staffPage.clickAddStaff();

    // Fill all visible fields
    const formFields = page.locator('input, select, textarea');
    const fieldCount = await formFields.count();

    const filledFields: Record<string, string> = {};

    for (let i = 0; i < fieldCount; i++) {
      const field = formFields.nth(i);
      const fieldName = await field.getAttribute('name') ||
                       await field.getAttribute('id') ||
                       await field.getAttribute('placeholder') ||
                       `field_${i}`;

      const fieldType = await field.getAttribute('type');

      // Try to fill the field
      try {
        if (fieldType === 'email') {
          await field.fill(staffData.email);
          filledFields[fieldName] = staffData.email;
        } else if (fieldType === 'tel') {
          await field.fill(staffData.phone);
          filledFields[fieldName] = staffData.phone;
        } else if (fieldName.toLowerCase().includes('name')) {
          await field.fill(staffData.name);
          filledFields[fieldName] = staffData.name;
        } else if (fieldName.toLowerCase().includes('role')) {
          await field.selectOption(staffData.role);
          filledFields[fieldName] = staffData.role;
        } else if (fieldName.toLowerCase().includes('qualification')) {
          await field.fill(staffData.qualification);
          filledFields[fieldName] = staffData.qualification;
        } else if (fieldName.toLowerCase().includes('experience')) {
          await field.fill(staffData.experience);
          filledFields[fieldName] = staffData.experience;
        } else if (fieldName.toLowerCase().includes('address')) {
          await field.fill(staffData.address);
          filledFields[fieldName] = staffData.address;
        } else if (fieldName.toLowerCase().includes('salary')) {
          await field.fill(staffData.salary);
          filledFields[fieldName] = staffData.salary;
        } else if (fieldName.toLowerCase().includes('date')) {
          await field.fill(staffData.joiningDate);
          filledFields[fieldName] = staffData.joiningDate;
        } else if (fieldName.toLowerCase().includes('blood')) {
          await field.selectOption(staffData.bloodGroup);
          filledFields[fieldName] = staffData.bloodGroup;
        }
      } catch (e) {
        // Field might be readonly or disabled
        console.log(`Skipped field: ${fieldName}`);
      }
    }

    // Submit the form
    await staffPage.helpers.clickButton(/submit|save|create/i);
    await page.waitForTimeout(2000);

    // STEP 2: Verify data was saved to database via API
    const response = await apiContext.get(`/api/staff?email=${staffData.email}`);
    expect(response.ok()).toBeTruthy();

    const dbData = await response.json();
    expect(dbData.data).toBeDefined();
    expect(dbData.data.length).toBeGreaterThan(0);

    const savedStaff = dbData.data.find((s: any) => s.email === staffData.email);
    expect(savedStaff).toBeDefined();

    // STEP 3: Verify each field in DB
    const validationResults: {
      field: string;
      inputValue: string;
      dbValue: string;
      stored: boolean;
      match: boolean;
    }[] = [];

    for (const [fieldName, inputValue] of Object.entries(filledFields)) {
      const dbField = mapFieldNameToDbField(fieldName);
      const dbValue = savedStaff[dbField];

      const stored = dbValue !== undefined && dbValue !== null;
      const match = stored && String(dbValue).toLowerCase() === String(inputValue).toLowerCase();

      validationResults.push({
        field: fieldName,
        inputValue: inputValue,
        dbValue: dbValue || 'NOT FOUND',
        stored: stored,
        match: match
      });

      console.log(`Field: ${fieldName} | Input: "${inputValue}" | DB: "${dbValue}" | Stored: ${stored} | Match: ${match}`);
    }

    // STEP 4: Verify data is displayed in UI (utilization check)
    await staffPage.searchStaff(staffData.name);
    await page.waitForTimeout(1000);

    const table = staffPage.staffTable;
    const staffRow = table.locator('tr, [role="row"]').filter({ hasText: staffData.name });
    const rowExists = await staffRow.count() > 0;

    // STEP 5: Generate report
    const report = {
      testName: 'DATA-001: Staff Creation - Full Field Mapping',
      timestamp: new Date().toISOString(),
      totalFields: validationResults.length,
      fieldsStored: validationResults.filter(r => r.stored).length,
      fieldsMatched: validationResults.filter(r => r.match).length,
      fieldsNotStored: validationResults.filter(r => !r.stored).length,
      fieldsNotMatched: validationResults.filter(r => r.stored && !r.match).length,
      displayedInUI: rowExists,
      fieldDetails: validationResults
    };

    console.log('\n=== DATA VALIDATION REPORT ===');
    console.log(JSON.stringify(report, null, 2));

    // Assertions
    expect(report.fieldsStored).toBeGreaterThan(0);
    expect(report.fieldsMatched).toBeGreaterThanOrEqual(report.fieldsStored * 0.8); // At least 80% should match
    expect(report.displayedInUI).toBeTruthy();

    // Save report to file
    await page.evaluate((data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-validation-report-${Date.now()}.json`;
      a.click();
    }, report);
  });
});

// Helper function to map frontend field names to database field names
function mapFieldNameToDbField(fieldName: string): string {
  const fieldMap: Record<string, string> = {
    'name': 'name',
    'email': 'email',
    'phone': 'phone',
    'role': 'role',
    'qualification': 'qualification',
    'experience': 'experience',
    'address': 'address',
    'salary': 'salary',
    'joiningDate': 'joiningDate',
    'bloodGroup': 'bloodGroup',
    'emergencyContact': 'emergencyContact'
  };

  // Normalize field name
  const normalized = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [key, value] of Object.entries(fieldMap)) {
    if (normalized.includes(key.toLowerCase())) {
      return value;
    }
  }

  return fieldName;
}
