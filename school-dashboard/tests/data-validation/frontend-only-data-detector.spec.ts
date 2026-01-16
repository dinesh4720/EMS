import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * FRONTEND-ONLY DATA DETECTOR
 *
 * This test identifies data that exists ONLY in the frontend with NO database connection:
 *
 * 4th Validation Point - Frontend-Only Data:
 * - Form fields that don't submit to backend
 * - Data stored in localStorage/sessionStorage only
 * - UI-only state management
 * - Temporary/calculated fields
 * - Mock/test data in frontend
 */
test.describe('Frontend-Only Data Detection', () => {
  const pagesToScan = [
    { path: '/staff/add', name: 'Add Staff', formSelector: 'form' },
    { path: '/students/add', name: 'Add Student', formSelector: 'form' },
    { path: '/fees/collect', name: 'Collect Fee', formSelector: 'form' },
    { path: '/classes/add', name: 'Add Class', formSelector: 'form' },
    { path: '/attendance/mark', name: 'Mark Attendance', formSelector: 'form' }
  ];

  const frontendOnlyDataReport: {
    totalFormsScanned: number;
    totalFieldsScanned: number;
    frontendOnlyFields: number;
    backendConnectedFields: number;
    localStorageData: Array<{
      key: string;
      value: string;
      usedIn: string[];
    }>;
    sessionStorageData: Array<{
      key: string;
      value: string;
      usedIn: string[];
    }>;
    forms: Array<{
      pageName: string;
      path: string;
      fields: Array<{
        fieldName: string;
        fieldType: string;
        value: string;
        backendConnection: 'CONNECTED' | 'FRONTEND_ONLY' | 'UNKNOWN';
        storageLocation: 'DATABASE' | 'LOCAL_STORAGE' | 'SESSION_STORAGE' | 'NONE' | 'STATE_ONLY';
        evidence: string[];
      }>;
    }>;
  } = {
    totalFormsScanned: 0,
    totalFieldsScanned: 0,
    frontendOnlyFields: 0,
    backendConnectedFields: 0,
    localStorageData: [],
    sessionStorageData: [],
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
    test(`DETECT-001: Scan ${pageConfig.name} for Frontend-Only Data`, async ({ page }) => {
      // Navigate to page
      await page.goto(pageConfig.path);
      await page.waitForLoadState('networkidle');

      // Clear all storage before testing
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Find form
      const form = page.locator(pageConfig.formSelector);
      const formExists = await form.count() > 0;

      if (!formExists) {
        console.log(`⚠️ No form found on ${pageConfig.name}`);
        return;
      }

      frontendOnlyDataReport.totalFormsScanned++;

      const formReport = {
        pageName: pageConfig.name,
        path: pageConfig.path,
        fields: [] as any[]
      };

      // Get all input fields
      const inputs = form.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
      const inputCount = await inputs.count();

      console.log(`\n🔍 Scanning ${pageConfig.name} - Found ${inputCount} visible fields`);

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const fieldName = await input.getAttribute('name') ||
                         await input.getAttribute('id') ||
                         await input.getAttribute('placeholder') ||
                         `field_${i}`;

        const fieldType = await input.getAttribute('type') || 'text';
        const fieldId = await input.getAttribute('id') || '';

        // Fill field with unique test data
        const testValue = `FRONTEND_TEST_${fieldName}_${Date.now()}`;

        try {
          // Determine how to fill based on field type
          const tagName = await input.evaluate(el => el.tagName.toLowerCase());

          if (tagName === 'select') {
            const options = await input.locator('option').count();
            if (options > 0) {
              await input.selectOption({ index: 0 });
            }
          } else if (fieldType === 'checkbox' || fieldType === 'radio') {
            await input.check();
          } else if (fieldType === 'date') {
            await input.fill('2024-01-15');
          } else {
            await input.fill(testValue);
          }

          frontendOnlyDataReport.totalFieldsScanned++;

          // Monitor network requests to detect backend connection
          const apiRequests: string[] = [];
          let backendApiCalled = false;

          page.on('request', request => {
            const url = request.url();
            if (url.includes('/api/') && (request.method() === 'POST' || request.method() === 'PUT' || request.method() === 'PATCH')) {
              apiRequests.push(url);
              backendApiCalled = true;
            }
          });

          // Check for localStorage/sessionStorage writes
          const storageWrites: Array<{ type: string; key: string; value: string }> = [];

          await page.evaluate((fieldName) => {
            // Hook into localStorage
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = function(key, value) {
              window.__storageWrites = window.__storageWrites || [];
              window.__storageWrites.push({ type: 'localStorage', key, value });
              return originalSetItem.apply(this, [key, value]);
            };

            // Hook into sessionStorage
            const originalSetSession = sessionStorage.setItem;
            sessionStorage.setItem = function(key, value) {
              window.__storageWrites = window.__storageWrites || [];
              window.__storageWrites.push({ type: 'sessionStorage', key, value });
              return originalSetSession.apply(this, [key, value]);
            };

            window.__storageWrites = [];
          }, fieldName);

          // Submit form or trigger change
          await input.dispatchEvent('change');
          await page.waitForTimeout(500);

          // Check for React state updates
          const reactFiberExists = await input.evaluate(el => {
            return !!(el as any)._reactOwner || (el as any)._reactInternalFiber;
          });

          // Check if field value is accessible in DOM (state-only data)
          const inDOM = await input.inputValue();

          // Determine backend connection
          const evidence: string[] = [];

          // Check if value was sent to backend
          let backendConnected = false;
          if (backendApiCalled) {
            backendConnected = true;
            evidence.push(`API Request detected: ${apiRequests.join(', ')}`);
          }

          // Check storage
          const storageData = await page.evaluate(() => {
            const localKeys = Object.keys(localStorage);
            const sessionKeys = Object.keys(sessionStorage);
            return {
              localStorage: localKeys.map(k => ({ key: k, value: localStorage.getItem(k) })),
              sessionStorage: sessionKeys.map(k => ({ key: k, value: sessionStorage.getItem(k) }))
            };
          });

          let storageLocation: 'DATABASE' | 'LOCAL_STORAGE' | 'SESSION_STORAGE' | 'NONE' | 'STATE_ONLY' = 'NONE';

          // Check if stored in localStorage
          const localMatch = storageData.localStorage.find(s =>
            s.value && s.value.includes(testValue) && s.value.includes(fieldName)
          );
          if (localMatch) {
            storageLocation = 'LOCAL_STORAGE';
            evidence.push(`Stored in localStorage: ${localMatch.key}`);
            frontendOnlyDataReport.localStorageData.push({
              key: localMatch.key,
              value: localMatch.value || '',
              usedIn: [pageConfig.name]
            });
          }

          // Check if stored in sessionStorage
          const sessionMatch = storageData.sessionStorage.find(s =>
            s.value && s.value.includes(testValue) && s.value.includes(fieldName)
          );
          if (sessionMatch) {
            storageLocation = 'SESSION_STORAGE';
            evidence.push(`Stored in sessionStorage: ${sessionMatch.key}`);
            frontendOnlyDataReport.sessionStorageData.push({
              key: sessionMatch.key,
              value: sessionMatch.value || '',
              usedIn: [pageConfig.name]
            });
          }

          // Check if only in React state (no storage, no API)
          if (!backendConnected && storageLocation === 'NONE') {
            if (reactFiberExists || inDOM) {
              storageLocation = 'STATE_ONLY';
              evidence.push('Value exists in DOM/React state only');
            }
          }

          // Determine final classification
          let backendConnection: 'CONNECTED' | 'FRONTEND_ONLY' | 'UNKNOWN' = 'UNKNOWN';

          if (backendConnected) {
            backendConnection = 'CONNECTED';
            frontendOnlyDataReport.backendConnectedFields++;
          } else if (storageLocation === 'LOCAL_STORAGE' || storageLocation === 'SESSION_STORAGE' || storageLocation === 'STATE_ONLY') {
            backendConnection = 'FRONTEND_ONLY';
            frontendOnlyDataReport.frontendOnlyFields++;
          }

          formReport.fields.push({
            fieldName,
            fieldType,
            value: testValue,
            backendConnection,
            storageLocation,
            evidence
          });

          const status = backendConnection === 'CONNECTED' ? '✓ DB' :
                        backendConnection === 'FRONTEND_ONLY' ? '⚠ FE' : '?';

          console.log(`  ${status} ${fieldName} (${fieldType}) → ${storageLocation}`);
          if (evidence.length > 0) {
            evidence.forEach(e => console.log(`      ${e}`));
          }

        } catch (e) {
          console.log(`  ✗ Error testing ${fieldName}: ${(e as Error).message}`);
        }
      }

      frontendOnlyDataReport.forms.push(formReport);
    });
  }

  test('DETECT-999: Frontend-Only Data Comprehensive Report', async ({ page }) => {
    // Scan for hardcoded data in frontend
    console.log('\n🔍 Scanning for hardcoded frontend data...');

    const hardcodedData = await page.evaluate(() => {
      const findings: Array<{ location: string; type: string; data: string }> = [];

      // Check for data attributes
      document.querySelectorAll('[data-*]').forEach(el => {
        const attrs = el.attributes;
        for (let i = 0; i < attrs.length; i++) {
          const attr = attrs[i];
          if (attr.name.startsWith('data-') && attr.value) {
            findings.push({
              location: el.tagName,
              type: 'data-attribute',
              data: `${attr.name}=${attr.value}`
            });
          }
        }
      });

      return findings;
    });

    // Check for Redux/Context state
    const frontendState = await page.evaluate(() => {
      const stateInfo: any = {};

      // Check for Redux
      const reduxState = (window as any).__REDUX_DEVTOOLS_EXTENSION__?.__getStore?.()?.getState();
      if (reduxState) {
        stateInfo.redux = Object.keys(reduxState);
      }

      // Check for React Context
      const reactRoot = document.querySelector('#root, #__next, [data-reactroot]');
      if (reactRoot) {
        stateInfo.reactContext = 'Detected';
      }

      return stateInfo;
    });

    // Generate comprehensive report
    const finalReport = {
      scanType: 'FRONTEND-ONLY DATA DETECTION',
      timestamp: new Date().toISOString(),
      summary: {
        totalFormsScanned: frontendOnlyDataReport.totalFormsScanned,
        totalFieldsScanned: frontendOnlyDataReport.totalFieldsScanned,
        backendConnectedFields: frontendOnlyDataReport.backendConnectedFields,
        frontendOnlyFields: frontendOnlyDataReport.frontendOnlyFields,
        frontendOnlyRate: frontendOnlyDataReport.totalFieldsScanned > 0
          ? ((frontendOnlyDataReport.frontendOnlyFields / frontendOnlyDataReport.totalFieldsScanned) * 100).toFixed(1) + '%'
          : '0%',
        localStorageEntries: frontendOnlyDataReport.localStorageData.length,
        sessionStorageEntries: frontendOnlyDataReport.sessionStorageData.length
      },
      frontendOnlyFields: frontendOnlyDataReport.forms.flatMap(f =>
        f.fields.filter(field => field.backendConnection === 'FRONTEND_ONLY')
      ),
      localStorageData: frontendOnlyDataReport.localStorageData,
      sessionStorageData: frontendOnlyDataReport.sessionStorageData,
      hardcodedData,
      frontendState,
      recommendations: generateFrontendDataRecommendations(frontendOnlyDataReport)
    };

    console.log('\n' + '='.repeat(80));
    console.log('🔍 FRONTEND-ONLY DATA DETECTION REPORT');
    console.log('='.repeat(80));
    console.log(JSON.stringify(finalReport, null, 2));
    console.log('='.repeat(80));

    // Print summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Total Forms Scanned: ${finalReport.summary.totalFormsScanned}`);
    console.log(`   Total Fields Scanned: ${finalReport.summary.totalFieldsScanned}`);
    console.log(`   ✓ Backend Connected: ${finalReport.summary.backendConnectedFields}`);
    console.log(`   ⚠️  Frontend Only: ${finalReport.summary.frontendOnlyFields} (${finalReport.summary.frontendOnlyRate})`);
    console.log(`   💾 localStorage: ${finalReport.summary.localStorageEntries} entries`);
    console.log(`   💾 sessionStorage: ${finalReport.summary.sessionStorageEntries} entries`);

    if (finalReport.summary.frontendOnlyFields > 0) {
      console.log('\n⚠️  FRONTEND-ONLY FIELDS DETECTED:');
      finalReport.frontendOnlyFields.forEach((field, idx) => {
        console.log(`   ${idx + 1}. ${field.fieldName} (${field.fieldType})`);
        console.log(`      Storage: ${field.storageLocation}`);
        field.evidence.forEach(e => console.log(`      - ${e}`));
      });
    }

    if (finalReport.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      finalReport.recommendations.forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec}`);
      });
    }

    console.log('='.repeat(80) + '\n');

    // Save report
    try {
      const fs = await import('fs');
      fs.mkdirSync('test-results', { recursive: true });
      fs.writeFileSync(
        'test-results/frontend-only-data-report.json',
        JSON.stringify(finalReport, null, 2)
      );
      console.log('✓ Report saved to: test-results/frontend-only-data-report.json\n');
    } catch (e) {
      // Fallback
      await page.evaluate((data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'frontend-only-data-report.json';
        a.click();
      }, finalReport);
    }

    // Assertions
    expect(finalReport.summary.totalFieldsScanned).toBeGreaterThan(0);
    console.log(`\n✅ Frontend-only data detection complete!`);
  });
});

function generateFrontendDataRecommendations(report: any): string[] {
  const recommendations: string[] = [];

  if (report.frontendOnlyFields > 0) {
    recommendations.push(
      `${report.frontendOnlyFields} fields are frontend-only (no DB connection). ` +
      `Review if this is intentional or if backend connection is missing.`
    );
  }

  if (report.localStorageData.length > 5) {
    recommendations.push(
      `High localStorage usage (${report.localStorageData.length} entries). ` +
      `Consider if this data should be in database for persistence across devices.`
    );
  }

  if (report.sessionStorageData.length > 5) {
    recommendations.push(
      `High sessionStorage usage (${report.sessionStorageData.length} entries). ` +
      `Note: This data is lost when tab closes. Ensure this is intentional.`
    );
  }

  const frontendRate = (report.frontendOnlyFields / report.totalFieldsScanned) * 100;
  if (frontendRate > 30) {
    recommendations.push(
      `${frontendRate.toFixed(1)}% of fields are frontend-only. ` +
      `This may indicate incomplete backend implementation.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('No major issues detected. Frontend data usage appears normal.');
  }

  return recommendations;
}
