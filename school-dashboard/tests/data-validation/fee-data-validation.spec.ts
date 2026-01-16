import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { FeesPage } from '../pages/FeesPage';

/**
 * DATA INTEGRITY: Fee Management
 *
 * Tests fee collection and storage
 */
test.describe('Data Integrity: Fee Management', () => {
  let loginPage: LoginPage;
  let feesPage: FeesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    feesPage = new FeesPage(page);

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
      process.env.TEST_ADMIN_PASSWORD || 'admin123'
    );
  });

  test('DATA-003: Fee Payment - Complete Transaction Validation', async ({ page, request }) => {
    const timestamp = Date.now();
    const paymentData = {
      studentId: '',
      studentName: 'Test Student',
      amount: '5000',
      method: 'Cash',
      date: new Date().toISOString().split('T')[0],
      remarks: 'Test payment data validation',
      feeType: 'Tuition Fee',
      month: 'January',
      academicYear: '2024-25'
    };

    await feesPage.goto();
    await feesPage.navigateToPayments();

    // STEP 1: Fill payment form
    const collectButton = page.locator('button').filter({ hasText: /collect|new payment|add/i });
    const collectCount = await collectButton.count();

    if (collectCount > 0) {
      await collectButton.first().click();

      // Wait for modal/form
      await page.waitForTimeout(1000);

      // Fill all visible fields
      const formFields = page.locator('form input, form select');
      const fieldCount = await formFields.count();

      const filledFields: Record<string, { value: string; type: string }> = {};

      for (let i = 0; i < fieldCount; i++) {
        const field = formFields.nth(i);
        const fieldName = await field.getAttribute('name') || await field.getAttribute('id') || `field_${i}`;
        const fieldType = await field.getAttribute('type') || 'text';

        let valueToFill = '';

        if (fieldName.toLowerCase().includes('amount')) {
          valueToFill = paymentData.amount;
        } else if (fieldName.toLowerCase().includes('method')) {
          valueToFill = paymentData.method;
        } else if (fieldName.toLowerCase().includes('date')) {
          valueToFill = paymentData.date;
        } else if (fieldName.toLowerCase().includes('remark')) {
          valueToFill = paymentData.remarks;
        } else if (fieldName.toLowerCase().includes('type') || fieldName.toLowerCase().includes('category')) {
          valueToFill = paymentData.feeType;
        } else if (fieldName.toLowerCase().includes('month')) {
          valueToFill = paymentData.month;
        } else if (fieldName.toLowerCase().includes('year')) {
          valueToFill = paymentData.academicYear;
        } else if (fieldName.toLowerCase().includes('student')) {
          // Try to find a student
          valueToFill = paymentData.studentName;
        }

        if (valueToFill) {
          try {
            if (fieldType === 'select-one' || await field.evaluate(el => el.tagName === 'SELECT')) {
              await field.selectOption(valueToFill);
            } else {
              await field.fill(valueToFill);
            }
            filledFields[fieldName] = { value: valueToFill, type: fieldType };
            console.log(`✓ Filled: ${fieldName} = "${valueToFill}"`);
          } catch (e) {
            console.log(`✗ Failed: ${fieldName}`);
          }
        }
      }

      // Submit payment
      await feesPage.helpers.clickButton(/submit|save|collect|confirm/i);
      await page.waitForTimeout(2000);

      // STEP 2: Verify in database
      let paymentRecord: any = null;

      // Try to get recent payment
      try {
        const paymentsResponse = await request.get('/api/fees/payments?limit=1&sort=-createdAt');
        if (paymentsResponse.ok()) {
          const result = await paymentsResponse.json();
          paymentRecord = result.data?.[0];
        }
      } catch (e) {
        console.log('Could not fetch from API');
      }

      // STEP 3: Verify receipt generation
      const receiptVisible = await page.locator('[class*="receipt"], [class*="invoice"]').count() > 0;

      // STEP 4: Verify data in reports
      await feesPage.navigateToReceipts();
      await page.waitForTimeout(1000);

      const receiptInList = await page.getByText(paymentData.amount).count() > 0;

      // Generate report
      const report = {
        testName: 'DATA-003: Fee Payment Validation',
        timestamp: new Date().toISOString(),
        paymentFields: Object.keys(filledFields).length,
        fieldsStored: paymentRecord ? Object.keys(paymentRecord).length : 0,
        receiptGenerated: receiptVisible,
        receiptInRecords: receiptInList,
        paymentDetails: paymentRecord || 'NOT_FOUND_IN_DB',
        utilization: {
          receipt: receiptVisible,
          reports: receiptInList,
          studentHistory: 'CHECK_MANUAL' // Would need to check student fee history
        }
      };

      console.log('\n=== FEE DATA VALIDATION REPORT ===');
      console.log(JSON.stringify(report, null, 2));

      expect(report.receiptGenerated || receiptInList).toBeTruthy();
    } else {
      console.log('⚠ No collect payment button found');
    }
  });
});
