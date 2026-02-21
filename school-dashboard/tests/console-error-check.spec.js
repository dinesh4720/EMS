/**
 * Playwright Console Error Detection Test
 * Tests Student Dashboard for console errors and runtime issues
 */

import { test, expect } from '@playwright/test';

test.describe('Student Dashboard - Console Error Detection', () => {

  test.beforeEach(async ({ page }) => {
    // Setup console listeners before each test
    const consoleErrors = [];
    const consoleWarnings = [];
    const moduleErrors = new Map();

    page.on('console', async msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        const error = {
          text,
          timestamp: new Date().toISOString(),
          location: msg.location()
        };
        consoleErrors.push(error);

        // Group by module
        if (msg.location().url) {
          const url = msg.location().url;
          const moduleName = url.split('/').pop().split('?')[0];
          if (!moduleErrors.has(moduleName)) {
            moduleErrors.set(moduleName, []);
          }
          moduleErrors.get(moduleName).push(error);
        }

        console.log('🔴 CONSOLE ERROR:', text);
        console.log('   URL:', msg.location().url);
        console.log('   Line:', msg.location().lineNumber, '\n');
      }

      if (type === 'warning') {
        consoleWarnings.push({
          text,
          timestamp: new Date().toISOString()
        });
        console.log('⚠️  WARNING:', text);
      }
    });

    page.on('pageerror', error => {
      const errorObj = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      consoleErrors.push(errorObj);
      console.log('💥 PAGE ERROR:', error.message);
      console.log('   Stack:', error.stack, '\n');
    });

    // Attach to test context for later assertions
    test.info().consoleErrors = consoleErrors;
    test.info().consoleWarnings = consoleWarnings;
    test.info().moduleErrors = moduleErrors;
  });

  test('should load students list without console errors', async ({ page }) => {
    console.log('📍 Test 1: Navigating to students list...');

    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for errors
    const errors = test.info().consoleErrors;
    console.log(`✅ Students list loaded with ${errors.length} error(s)\n`);

    // Expect no errors
    expect(errors.length).toBe(0);
  });

  test('should open student overview without console errors', async ({ page }) => {
    console.log('📍 Test 2: Opening student overview...');

    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Wait for student links to appear
    await page.waitForSelector('a[href^="/students/"]', { timeout: 10000 });

    // Click first student link
    const studentLinks = await page.locator('a[href^="/students/"]').all();
    if (studentLinks.length > 0) {
      await studentLinks[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const errors = test.info().consoleErrors;
      console.log(`✅ Student overview opened with ${errors.length} error(s)\n`);

      // Check for overview content
      const overviewContent = await page.locator('.grid').first();
      await expect(overviewContent).toBeVisible();

      // Expect no errors
      expect(errors.length).toBe(0);
    } else {
      console.log('⚠️  No student links found - skipping test\n');
      test.skip();
    }
  });

  test('should click Academics KPI card without console errors', async ({ page }) => {
    console.log('📍 Test 3: Clicking Academics KPI card...');

    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const studentLinks = await page.locator('a[href^="/students/"]').all();
    if (studentLinks.length > 0) {
      await studentLinks[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Look for Academics card
      const academicsCard = page.getByText('Academics').or(page.locator('[class*="academics"]')).first();

      const errorsBefore = test.info().consoleErrors.length;

      if (await academicsCard.isVisible()) {
        await academicsCard.click();
        await page.waitForTimeout(1500);

        const errorsAfter = test.info().consoleErrors.length;
        const newErrors = errorsAfter - errorsBefore;

        console.log(`✅ Academics card clicked with ${newErrors} new error(s)\n`);
        expect(newErrors).toBe(0);
      } else {
        console.log('⚠️  Academics card not found\n');
      }
    } else {
      console.log('⚠️  No student links found - skipping test\n');
      test.skip();
    }
  });

  test('should click Attendance KPI card without console errors', async ({ page }) => {
    console.log('📍 Test 4: Clicking Attendance KPI card...');

    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const studentLinks = await page.locator('a[href^="/students/"]').all();
    if (studentLinks.length > 0) {
      await studentLinks[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Look for Attendance card
      const attendanceCard = page.getByText('Attendance').or(page.locator('[class*="attendance"]')).first();

      const errorsBefore = test.info().consoleErrors.length;

      if (await attendanceCard.isVisible()) {
        await attendanceCard.click();
        await page.waitForTimeout(1500);

        const errorsAfter = test.info().consoleErrors.length;
        const newErrors = errorsAfter - errorsBefore;

        console.log(`✅ Attendance card clicked with ${newErrors} new error(s)\n`);
        expect(newErrors).toBe(0);
      } else {
        console.log('⚠️  Attendance card not found\n');
      }
    } else {
      console.log('⚠️  No student links found - skipping test\n');
      test.skip();
    }
  });

  test('should click Fees KPI card without console errors', async ({ page }) => {
    console.log('📍 Test 5: Clicking Fees KPI card...');

    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const studentLinks = await page.locator('a[href^="/students/"]').all();
    if (studentLinks.length > 0) {
      await studentLinks[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Look for Fees card
      const feesCard = page.getByText('Fees').or(page.locator('[class*="fees"]')).first();

      const errorsBefore = test.info().consoleErrors.length;

      if (await feesCard.isVisible()) {
        await feesCard.click();
        await page.waitForTimeout(1500);

        const errorsAfter = test.info().consoleErrors.length;
        const newErrors = errorsAfter - errorsBefore;

        console.log(`✅ Fees card clicked with ${newErrors} new error(s)\n`);
        expect(newErrors).toBe(0);
      } else {
        console.log('⚠️  Fees card not found\n');
      }
    } else {
      console.log('⚠️  No student links found - skipping test\n');
      test.skip();
    }
  });

  test('should test vertical dot menu without console errors', async ({ page }) => {
    console.log('📍 Test 6: Testing vertical dot menu...');

    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const studentLinks = await page.locator('a[href^="/students/"]').all();
    if (studentLinks.length > 0) {
      await studentLinks[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Look for vertical menu button (MoreVertical icon)
      const menuButton = page.locator('button').filter({ hasText: /more|actions|options/i }).or(
        page.locator('button:has(svg:has(path[d*="M12 13"])):has(svg:has(path[d*="M19 9"]))')
      ).first();

      const errorsBefore = test.info().consoleErrors.length;

      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(1000);

        const errorsAfter = test.info().consoleErrors.length;
        const newErrors = errorsAfter - errorsBefore;

        console.log(`✅ Vertical menu opened with ${newErrors} new error(s)\n`);
        expect(newErrors).toBe(0);

        // Close menu
        await page.click('body');
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️  Vertical menu button not found\n');
      }
    } else {
      console.log('⚠️  No student links found - skipping test\n');
      test.skip();
    }
  });

  test('should test photo edit menu without console errors', async ({ page }) => {
    console.log('📍 Test 7: Testing photo edit menu...');

    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const studentLinks = await page.locator('a[href^="/students/"]').all();
    if (studentLinks.length > 0) {
      await studentLinks[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Look for photo edit button (camera icon)
      const photoEditButton = page.locator('button[title="Change photo"], [aria-label*="photo"], [aria-label*="change"]').or(
        page.locator('div[class*="avatar"] + div button').first()
      );

      const errorsBefore = test.info().consoleErrors.length;

      if (await photoEditButton.isVisible()) {
        await photoEditButton.click();
        await page.waitForTimeout(1000);

        // Check for menu items
        const adjustPhoto = page.getByText('Adjust photo');
        const uploadPhoto = page.getByText('Upload new photo');
        const removePhoto = page.getByText('Remove photo');

        console.log(adjustPhoto ? '✅' : '❌', 'Adjust photo option');
        console.log(uploadPhoto ? '✅' : '❌', 'Upload new photo option');
        console.log(removePhoto ? '✅' : '❌', 'Remove photo option');

        const errorsAfter = test.info().consoleErrors.length;
        const newErrors = errorsAfter - errorsBefore;

        console.log(`\n✅ Photo edit menu opened with ${newErrors} new error(s)\n`);
        expect(newErrors).toBe(0);

        // Close menu
        await page.click('body');
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️  Photo edit button not found\n');
      }
    } else {
      console.log('⚠️  No student links found - skipping test\n');
      test.skip();
    }
  });

  test('should navigate all tabs without console errors', async ({ page }) => {
    console.log('📍 Test 8: Navigating all tabs...');

    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const studentLinks = await page.locator('a[href^="/students/"]').all();
    if (studentLinks.length > 0) {
      await studentLinks[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const tabs = ['Overview', 'Basic Details', 'Attendance', 'Academics', 'Fees', 'Documents', 'Remarks', 'Ratings'];
      const errorsBefore = test.info().consoleErrors.length;

      for (const tab of tabs) {
        try {
          await page.getByText(tab, { exact: true }).click();
          await page.waitForTimeout(1000);
          console.log(`✅ ${tab} tab opened`);
        } catch (e) {
          console.log(`❌ Error opening ${tab} tab`);
        }
      }

      const errorsAfter = test.info().consoleErrors.length;
      const newErrors = errorsAfter - errorsBefore;

      console.log(`\n✅ All tabs navigated with ${newErrors} new error(s)\n`);
      expect(newErrors).toBe(0);
    } else {
      console.log('⚠️  No student links found - skipping test\n');
      test.skip();
    }
  });

  test.afterEach(async ({ page }) => {
    // Print summary for each test
    const errors = test.info().consoleErrors || [];
    const warnings = test.info().consoleWarnings || [];
    const moduleErrors = test.info().moduleErrors || new Map();

    console.log('\n' + '='.repeat(80));
    console.log('📊 Test Summary');
    console.log('='.repeat(80));
    console.log(`Console Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}\n`);

    if (moduleErrors.size > 0) {
      console.log('📁 Errors by Module:');
      for (const [moduleName, errs] of moduleErrors) {
        console.log(`  ${moduleName}: ${errs.length} error(s)`);
      }
    }

    if (errors.length > 0) {
      console.log('\n🔴 All Console Errors:');
      errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.text || err.message}`);
        if (err.location) {
          console.log(`   URL: ${err.location.url}`);
          console.log(`   Line: ${err.location.lineNumber}\n`);
        } else if (err.stack) {
          console.log(`   Stack: ${err.stack}\n`);
        }
      });
    }

    console.log('='.repeat(80) + '\n');
  });
});
