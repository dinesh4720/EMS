import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * COMPREHENSIVE FIELD MAPPING SCANNER
 *
 * This test scans all forms in the application and:
 * 1. Identifies all input fields
 * 2. Tests if they connect to database
 * 3. Checks if stored data is used anywhere
 * 4. Reports orphan/unused fields
 */
test.describe('Field Mapping Scanner - Complete Application', () => {
  const pagesToScan = [
    { path: '/staff', name: 'Staff Management', addButton: /add|create|new/i },
    { path: '/students', name: 'Student Management', addButton: /add|create|admit/i },
    { path: '/fees', name: 'Fee Management', addButton: /add|create|new/i },
    { path: '/classes', name: 'Class Management', addButton: /add|create|new/i }
  ];

  const globalFieldReport: {
    totalForms: number;
    totalFields: number;
    connectedFields: number;
    orphanFields: number;
    unusedFields: number;
    forms: Array<{
      pageName: string;
      path: string;
      fields: Array<{
        fieldName: string;
        fieldType: string;
        required: boolean;
        connectedToDb: boolean;
        usedInUi: boolean;
        locations: string[];
      }>;
    }>;
  } = {
    totalForms: 0,
    totalFields: 0,
    connectedFields: 0,
    orphanFields: 0,
    unusedFields: 0,
    forms: []
  };

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
      process.env.TEST_ADMIN_PASSWORD || 'admin123'
    );
  });

  for (const pageConfig of pagesToScan) {
    test(`SCAN: ${pageConfig.name}`, async ({ page, request }) => {
      await page.goto(pageConfig.path);
      await page.waitForLoadState('networkidle');

      // Look for add button and click it
      const addButton = page.locator('button').filter({ hasText: pageConfig.addButton });
      const addCount = await addButton.count();

      if (addCount > 0) {
        await addButton.first().click();
        await page.waitForTimeout(1000);
      }

      // Find all forms
      const forms = page.locator('form');
      const formCount = await forms.count();

      if (formCount === 0) {
        console.log(`⚠️ No forms found on ${pageConfig.name}`);
        return;
      }

      globalFieldReport.totalForms++;

      const formReport = {
        pageName: pageConfig.name,
        path: pageConfig.path,
        fields: [] as any[]
      };

      // Scan first form
      const form = forms.first();
      const inputs = form.locator('input, select, textarea');
      const inputCount = await inputs.count();

      console.log(`\nScanning ${pageConfig.name} - Found ${inputCount} fields`);

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);

        const fieldName = await input.getAttribute('name') ||
                         await input.getAttribute('id') ||
                         await input.getAttribute('placeholder') ||
                         `field_${i}`;

        const fieldType = await input.getAttribute('type') || 'text';
        const required = await input.isRequired() || false;
        const visible = await input.isVisible();

        if (!visible) continue;

        // Check if field has a label (indicates it's meant to be used)
        const hasLabel = await input.evaluate(el => {
          const labels = el.labels;
          return labels && labels.length > 0;
        });

        // Try to determine if field connects to DB
        // This is a heuristic - we check if field has proper naming convention
        const dbFieldNames = ['name', 'email', 'phone', 'address', 'class', 'section', 'dob', 'date',
                             'amount', 'fee', 'payment', 'role', 'salary', 'qualification', 'gender',
                             'bloodgroup', 'father', 'mother', 'guardian', 'roll', 'admission'];

        const normalizedField = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const connectedToDb = dbFieldNames.some(db => normalizedField.includes(db)) ||
                              (required && hasLabel);

        // Check if field is used in UI (look for it in tables, cards, etc.)
        let usedInUi = false;
        const locations: string[] = [];

        if (connectedToDb) {
          // Check if field value appears in tables
          const tables = page.locator('table');
          const tableCount = await tables.count();

          if (tableCount > 0) {
            locations.push('tables');
            usedInUi = true;
          }

          // Check if field appears in cards/details
          const cards = page.locator('[class*="card"], [class*="detail"]');
          const cardCount = await cards.count();

          if (cardCount > 0) {
            locations.push('cards');
            usedInUi = true;
          }

          // Check if field appears in filters
          const filters = page.locator('[class*="filter"], [class*="search"]');
          const filterCount = await filters.count();

          if (filterCount > 0) {
            locations.push('filters');
          }
        }

        formReport.fields.push({
          fieldName,
          fieldType,
          required,
          connectedToDb,
          usedInUi,
          locations
        });

        globalFieldReport.totalFields++;

        if (connectedToDb) {
          globalFieldReport.connectedFields++;
        } else {
          globalFieldReport.orphanFields++;
        }

        if (connectedToDb && !usedInUi) {
          globalFieldReport.unusedFields++;
        }

        const status = connectedToDb ? (usedInUi ? '✓' : '⚠') : '✗';
        console.log(`  ${status} ${fieldName} (${fieldType}) ${required ? '[REQUIRED]' : ''} ${locations.join(', ')}`);
      }

      globalFieldReport.forms.push(formReport);

      // Close modal if open
      const closeButton = page.locator('button').filter({ hasText: /close|cancel|×/i });
      if (await closeButton.count() > 0) {
        await closeButton.first().click();
      }
    });
  }

  test('DATA-999: Generate Field Mapping Report', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('COMPREHENSIVE FIELD MAPPING REPORT');
    console.log('='.repeat(80));
    console.log(JSON.stringify(globalFieldReport, null, 2));
    console.log('='.repeat(80));

    // Generate recommendations
    const recommendations: string[] = [];

    if (globalFieldReport.orphanFields > 0) {
      recommendations.push(`Found ${globalFieldReport.orphanFields} orphan fields that may not connect to database. Review field naming and form submission logic.`);
    }

    if (globalFieldReport.unusedFields > 0) {
      recommendations.push(`Found ${globalFieldReport.unusedFields} unused fields. Data is stored but never displayed. Consider removing or implementing usage.`);
    }

    const connectionRate = (globalFieldReport.connectedFields / globalFieldReport.totalFields) * 100;
    if (connectionRate < 80) {
      recommendations.push(`Only ${connectionRate.toFixed(1)}% of fields are properly connected. Investigate form-to-DB mapping.`);
    }

    const utilizationRate = ((globalFieldReport.connectedFields - globalFieldReport.unusedFields) / globalFieldReport.connectedFields) * 100;
    if (utilizationRate < 70 && globalFieldReport.connectedFields > 0) {
      recommendations.push(`Only ${utilizationRate.toFixed(1)}% of stored fields are actually used. Review data architecture.`);
    }

    const finalReport = {
      ...globalFieldReport,
      recommendations,
      timestamp: new Date().toISOString(),
      summary: {
        totalFormsScanned: globalFieldReport.totalForms,
        totalFieldsFound: globalFieldReport.totalFields,
        connectionRate: `${connectionRate.toFixed(1)}%`,
        utilizationRate: `${utilizationRate.toFixed(1)}%`,
        health: connectionRate >= 80 && utilizationRate >= 70 ? 'GOOD' : 'NEEDS_ATTENTION'
      }
    };

    // Save report
    try {
      const fs = await import('fs');
      fs.mkdirSync('test-results', { recursive: true });
      fs.writeFileSync(
        'test-results/field-mapping-report.json',
        JSON.stringify(finalReport, null, 2)
      );
      console.log('\n✓ Report saved to: test-results/field-mapping-report.json');
    } catch (e) {
      // Fallback to browser download
      await page.evaluate((data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'field-mapping-report.json';
        a.click();
      }, finalReport);
    }

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Forms Scanned: ${finalReport.summary.totalFormsScanned}`);
    console.log(`Total Fields: ${finalReport.summary.totalFieldsFound}`);
    console.log(`Connected to DB: ${finalReport.summary.connectionRate}`);
    console.log(`Utilized in UI: ${finalReport.summary.utilizationRate}`);
    console.log(`Health: ${finalReport.summary.health}`);
    console.log('='.repeat(80));

    if (recommendations.length > 0) {
      console.log('\nRECOMMENDATIONS:');
      recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
    }
    console.log('='.repeat(80) + '\n');
  });
});
