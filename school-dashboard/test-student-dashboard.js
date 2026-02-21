/**
 * Puppeteer Console Error Detection Script
 * Tests Student Dashboard for console errors and runtime issues
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const STUDENT_ID = process.env.STUDENT_ID || '1';

// Console error tracking
const consoleErrors = [];
const consoleWarnings = [];
const moduleErrors = new Map();

class ConsoleError {
  constructor(text, type, url, line, column) {
    this.text = text;
    this.type = type;
    this.url = url;
    this.line = line;
    this.column = column;
    this.timestamp = new Date().toISOString();
  }

  isRelevantToFile(filePath) {
    if (!this.url || !filePath) return true;
    return this.url.includes(filePath) || this.url.includes('student');
  }

  format() {
    return `[${this.type}] ${this.text}
    URL: ${this.url || 'unknown'}
    Line: ${this.line || 'unknown'}, Column: ${this.column || 'unknown'}
    Time: ${this.timestamp}`;
  }
}

async function setupConsoleListeners(page) {
  // Listen for all console messages
  page.on('console', async (msg) => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      const errorArgs = msg.args();
      let errorText = text;
      let url = '';
      let line = '';
      let column = '';

      // Try to extract stack trace
      for (const arg of errorArgs) {
        try {
          const argHandle = await arg.jsonValue();
          if (typeof argHandle === 'object' && argHandle !== null) {
            if (argHandle.stack) {
              const stackMatch = argHandle.stack.match(/at .*?\((.*?):(\d+):(\d+)\)/);
              if (stackMatch) {
                [, url, line, column] = stackMatch;
              }
            }
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      const error = new ConsoleError(errorText, type, url, line, column);
      consoleErrors.push(error);

      // Group by module
      if (url) {
        const moduleName = url.split('/').pop().replace(/\?.*$/, '');
        if (!moduleErrors.has(moduleName)) {
          moduleErrors.set(moduleName, []);
        }
        moduleErrors.get(moduleName).push(error);
      }

      console.log('🔴 CONSOLE ERROR:', error.format());
    }

    if (type === 'warning') {
      consoleWarnings.push({
        text,
        timestamp: new Date().toISOString()
      });
      console.log('⚠️  WARNING:', text);
    }
  });

  // Listen for page errors
  page.on('pageerror', (error) => {
    const errorObj = new ConsoleError(
      error.message,
      'pageerror',
      error.stack?.split('\n')[1]?.trim() || '',
      error.stack?.match(/:(\d+):(\d+)/)?.[1] || '',
      error.stack?.match(/:(\d+):(\d+)/)?.[2] || ''
    );
    consoleErrors.push(errorObj);
    console.log('💥 PAGE ERROR:', errorObj.format());
  });

  // Listen for request failures
  page.on('requestfailed', (request) => {
    const failure = request.failure();
    if (failure && failure.errorText !== 'net::ERR_ABORTED') {
      const errorObj = new ConsoleError(
        `Request failed: ${request.url()} - ${failure.errorText}`,
        'requestfailed',
        request.url(),
        '',
        ''
      );
      consoleErrors.push(errorObj);
      console.log('🌐 REQUEST FAILED:', errorObj.format());
    }
  });
}

async function waitForNetworkIdle(page, timeout = 2000) {
  await page.waitForFunction(
    () => {
      const timing = window.performance.timing;
      return timing.loadEventEnd > 0 && timing.domComplete > 0;
    },
    { timeout }
  ).catch(() => {});
}

async function testStudentDashboard() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = (await browser.pages())[0];
  await setupConsoleListeners(page);

  console.log('🚀 Starting Student Dashboard Test...\n');

  try {
    // Test 1: Navigate to students list
    console.log('📍 Test 1: Navigating to students list...');
    await page.goto(`${BASE_URL}/students`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    await waitForNetworkIdle(page);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Students list loaded\n');

    // Test 2: Click on a student to open overview
    console.log('📍 Test 2: Opening student overview...');
    try {
      await page.waitForSelector('a[href^="/students/"]', { timeout: 5000 });
      const studentLink = await page.$('a[href^="/students/"]');
      if (studentLink) {
        await studentLink.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
        await waitForNetworkIdle(page);
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Student overview opened\n');

        // Test 3: Check for StudentOverview component errors
        console.log('📍 Test 3: Checking StudentOverview component...');
        const hasOverviewContent = await page.$('.grid') !== null;
        console.log(hasOverviewContent ? '✅ Overview content loaded' : '⚠️  Overview content might be missing');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 4: Click on Academics KPI card
        console.log('📍 Test 4: Clicking Academics KPI card...');
        try {
          const academicsCard = await page.$('text=Academics');
          if (academicsCard) {
            await academicsCard.click();
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('✅ Academics card clicked\n');
          } else {
            console.log('⚠️  Academics card not found\n');
          }
        } catch (e) {
          console.log('❌ Error clicking Academics card:', e.message, '\n');
        }

        // Go back to overview
        await page.goBack();
        await waitForNetworkIdle(page);

        // Test 5: Click on Attendance KPI card
        console.log('📍 Test 5: Clicking Attendance KPI card...');
        try {
          const attendanceCard = await.page.$('text=Attendance');
          if (attendanceCard) {
            await attendanceCard.click();
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('✅ Attendance card clicked\n');
          } else {
            console.log('⚠️  Attendance card not found\n');
          }
        } catch (e) {
          console.log('❌ Error clicking Attendance card:', e.message, '\n');
        }

        // Go back to overview
        await page.goBack();
        await waitForNetworkIdle(page);

        // Test 6: Click on Fees KPI card
        console.log('📍 Test 6: Clicking Fees KPI card...');
        try {
          const feesCard = await page.$('text=Fees');
          if (feesCard) {
            await feesCard.click();
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('✅ Fees card clicked\n');
          } else {
            console.log('⚠️  Fees card not found\n');
          }
        } catch (e) {
          console.log('❌ Error clicking Fees card:', e.message, '\n');
        }

        // Go back to overview
        await page.goBack();
        await waitForNetworkIdle(page);

        // Test 7: Test vertical dot menu
        console.log('📍 Test 7: Testing vertical dot menu...');
        try {
          const menuButton = await page.$('button[aria-label="More options"], button:has(svg)'), button');
          if (menuButton) {
            await menuButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Vertical menu opened\n');

            // Close menu by clicking outside
            await page.click('body');
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            console.log('⚠️  Vertical menu button not found\n');
          }
        } catch (e) {
          console.log('❌ Error with vertical menu:', e.message, '\n');
        }

        // Test 8: Test photo edit options
        console.log('📍 Test 8: Testing photo edit options...');
        try {
          const photoEditButton = await page.$('button[title="Change photo"]');
          if (photoEditButton) {
            await photoEditButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Photo edit menu opened\n');

            // Check for menu items
            const adjustPhoto = await page.$('text=Adjust photo');
            const uploadPhoto = await page.$('text=Upload new photo');
            const removePhoto = await page.$('text=Remove photo');

            console.log(adjustPhoto ? '✅' : '❌', 'Adjust photo option');
            console.log(uploadPhoto ? '✅' : '❌', 'Upload new photo option');
            console.log(removePhoto ? '✅' : '❌', 'Remove photo option\n');

            // Close menu
            await page.click('body');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (e) {
          console.log('❌ Error testing photo edit:', e.message, '\n');
        }

        // Test 9: Test Call Parent button
        console.log('📍 Test 9: Testing Call Parent button...');
        try {
          const callParentButton = await page.$('button:has-text("Call Parent")');
          if (callParentButton) {
            const isEnabled = await page.evaluate(btn => !btn.disabled, callParentButton);
            console.log(isEnabled ? '✅ Call Parent button enabled' : '⚠️  Call Parent button disabled (no phone number)\n');
          } else {
            console.log('⚠️  Call Parent button not found\n');
          }
        } catch (e) {
          console.log('❌ Error checking Call Parent button:', e.message, '\n');
        }

        // Test 10: Navigate to different tabs
        console.log('📍 Test 10: Testing tab navigation...');
        const tabs = ['Basic Details', 'Attendance', 'Academics', 'Fees', 'Documents', 'Remarks', 'Ratings'];
        for (const tab of tabs) {
          try {
            await page.click(`text=${tab}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(`✅ ${tab} tab opened`);
          } catch (e) {
            console.log(`❌ Error opening ${tab} tab:`, e.message);
          }
        }
        console.log('');

      } else {
        console.log('⚠️  No student link found on students list\n');
      }
    } catch (e) {
      console.log('❌ Error opening student overview:', e.message, '\n');
    }

  } catch (error) {
    console.error('❌ Fatal error during test:', error);
  }

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  console.log(`Total Console Errors: ${consoleErrors.length}`);
  console.log(`Total Warnings: ${consoleWarnings.length}\n`);

  if (moduleErrors.size > 0) {
    console.log('📁 Errors by Module:\n');
    for (const [moduleName, errors] of moduleErrors) {
      console.log(`  ${moduleName}: ${errors.length} error(s)`);
      errors.forEach(err => {
        console.log(`    - ${err.text}`);
      });
    }
    console.log('');
  }

  if (consoleErrors.length > 0) {
    console.log('🔴 All Console Errors:\n');
    consoleErrors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.format()}\n`);
    });
  } else {
    console.log('✅ No console errors detected!\n');
  }

  if (consoleWarnings.length > 0) {
    console.log('⚠️  Warnings (first 10):\n');
    consoleWarnings.slice(0, 10).forEach((warning, index) => {
      console.log(`${index + 1}. [WARNING] ${warning.text}\n`);
    });
  }

  console.log('='.repeat(80));

  // Keep browser open for inspection
  console.log('\n💡 Browser window staying open for manual inspection...');
  console.log('Press Ctrl+C to close\n');

  // Wait for user to close
  await new Promise(() => {});

} catch (error) {
  console.error('❌ Test script error:', error);
} finally {
  await browser.close();
}

// Run the test
testStudentDashboard().catch(console.error);
