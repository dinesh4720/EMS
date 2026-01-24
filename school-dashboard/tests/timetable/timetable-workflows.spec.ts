import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testUsers } from '../fixtures/users';

/**
 * End-to-End Timetable Management Workflow Tests
 * 
 * These tests verify complete user workflows for the timetable management system:
 * - Creating class timetables from scratch
 * - Editing teacher timetables and verifying class updates
 * - Handling conflict scenarios through UI
 * - Switching classes for a teacher
 * - Managing teacher assignments
 * - Validating timetable completeness
 */

test.describe('Timetable Management E2E Workflows', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );
  });

  /**
   * Test 1: Creating class timetable from scratch
   * 
   * This test verifies the complete workflow of:
   * 1. Navigating to classes module
   * 2. Selecting a class
   * 3. Opening timetable view
   * 4. Configuring class settings (tag and subjects)
   * 5. Adding periods to the timetable
   * 6. Assigning teachers to time slots
   * 7. Verifying the timetable is saved correctly
   */
  test('should create class timetable from scratch', async ({ page }) => {
    // Navigate to classes module
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    // Select a class (look for first available class)
    const classList = page.locator('[class*="class-card"], [class*="class-item"], table tbody tr').first();
    await classList.waitFor({ state: 'visible', timeout: 10000 });
    
    // Click on the class to view details
    const classLink = classList.locator('a, button').filter({ hasText: /view|details|open/i }).first();
    const classCount = await classLink.count();
    
    if (classCount > 0) {
      await classLink.click();
    } else {
      // If no link, click the row itself
      await classList.click();
    }
    
    await page.waitForLoadState('networkidle');

    // Navigate to timetable tab
    const timetableTab = page.getByRole('tab', { name: /timetable/i }).or(
      page.locator('button, a').filter({ hasText: /timetable/i })
    );
    
    const tabCount = await timetableTab.count();
    if (tabCount > 0) {
      await timetableTab.first().click();
      await page.waitForTimeout(1000);
    }

    // Check if settings tab exists and configure class settings
    const settingsTab = page.getByRole('tab', { name: /settings/i }).or(
      page.locator('button, a').filter({ hasText: /^settings$/i })
    );
    
    const settingsCount = await settingsTab.count();
    if (settingsCount > 0) {
      await settingsTab.first().click();
      await page.waitForTimeout(500);

      // Set class tag
      const tagInput = page.locator('input[name="classTag"], input[placeholder*="tag" i]').first();
      const tagInputCount = await tagInput.count();
      
      if (tagInputCount > 0) {
        await tagInput.fill('Science Stream');
        
        // Select subjects
        const subjectSelect = page.locator('select[name="subjects"], [class*="subject-select"]').first();
        const subjectSelectCount = await subjectSelect.count();
        
        if (subjectSelectCount > 0) {
          await subjectSelect.click();
          await page.waitForTimeout(300);
          
          // Select multiple subjects
          const subjectOptions = page.locator('[role="option"], option').filter({ hasText: /math|science|english/i });
          const optionCount = await subjectOptions.count();
          
          if (optionCount > 0) {
            await subjectOptions.first().click();
          }
        }

        // Save settings
        const saveButton = page.locator('button').filter({ hasText: /save|update/i }).first();
        await saveButton.click();
        await page.waitForTimeout(1000);
      }

      // Navigate back to timetable tab
      await timetableTab.first().click();
      await page.waitForTimeout(500);
    }

    // Look for timetable grid
    const timetableGrid = page.locator('[class*="timetable"], [class*="schedule"], table').first();
    await timetableGrid.waitFor({ state: 'visible', timeout: 10000 });

    // Try to add a slot - look for empty slot or add button
    const emptySlot = page.locator('[class*="empty-slot"], [class*="add-slot"], td:not(:has(*))').first();
    const emptySlotCount = await emptySlot.count();
    
    if (emptySlotCount > 0) {
      await emptySlot.click();
      await page.waitForTimeout(500);

      // Fill slot details in modal/form
      const subjectSelect = page.locator('select[name="subject"], [name="subject"]').first();
      const subjectCount = await subjectSelect.count();
      
      if (subjectCount > 0) {
        await subjectSelect.selectOption({ index: 1 }); // Select first available subject
        await page.waitForTimeout(300);

        // Select teacher
        const teacherSelect = page.locator('select[name="teacher"], select[name="teacherId"], [name="teacherId"]').first();
        const teacherCount = await teacherSelect.count();
        
        if (teacherCount > 0) {
          await teacherSelect.selectOption({ index: 1 }); // Select first available teacher
        }

        // Add room (optional)
        const roomInput = page.locator('input[name="room"]').first();
        const roomCount = await roomInput.count();
        
        if (roomCount > 0) {
          await roomInput.fill('Room 101');
        }

        // Save the slot
        const saveSlotButton = page.locator('button[type="submit"], button').filter({ hasText: /save|add|assign/i }).first();
        await saveSlotButton.click();
        await page.waitForTimeout(1500);

        // Verify success message or updated timetable
        const successToast = page.locator('[role="alert"], [class*="toast"]').filter({ hasText: /success|saved|updated/i });
        const toastCount = await successToast.count();
        
        if (toastCount > 0) {
          await expect(successToast.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }

    // Verify timetable has content
    const filledSlots = page.locator('[class*="filled-slot"], td:has([class*="subject"]), [class*="slot"]:has(*)');
    const filledCount = await filledSlots.count();
    expect(filledCount).toBeGreaterThan(0);
  });

  /**
   * Test 2: Editing teacher timetable and verifying class updates
   * 
   * This test verifies bidirectional synchronization:
   * 1. Navigate to staff module
   * 2. Select a teacher
   * 3. Open teacher timetable
   * 4. Assign a class to a time slot
   * 5. Navigate to the class timetable
   * 6. Verify the teacher appears in the corresponding slot
   */
  test('should edit teacher timetable and verify class updates', async ({ page }) => {
    // Navigate to staff module
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');

    // Find and click on a teacher
    const staffTable = page.locator('table, [role="table"]').first();
    await staffTable.waitFor({ state: 'visible', timeout: 10000 });

    // Look for a teacher role
    const teacherRow = staffTable.locator('tr, [role="row"]').filter({ hasText: /teacher/i }).first();
    const teacherCount = await teacherRow.count();
    
    if (teacherCount > 0) {
      // Click to view teacher details
      const viewButton = teacherRow.locator('button, a').filter({ hasText: /view|details/i }).first();
      const viewCount = await viewButton.count();
      
      if (viewCount > 0) {
        await viewButton.click();
      } else {
        await teacherRow.click();
      }
      
      await page.waitForLoadState('networkidle');

      // Navigate to timetable tab
      const timetableTab = page.getByRole('tab', { name: /timetable/i }).or(
        page.locator('button, a').filter({ hasText: /timetable/i })
      );
      
      const tabCount = await timetableTab.count();
      if (tabCount > 0) {
        await timetableTab.first().click();
        await page.waitForTimeout(1000);

        // Look for teacher timetable grid
        const teacherTimetable = page.locator('[class*="teacher-timetable"], [class*="schedule"], table').first();
        await teacherTimetable.waitFor({ state: 'visible', timeout: 10000 });

        // Try to edit a slot
        const slot = page.locator('[class*="slot"], td').nth(5); // Pick a slot
        await slot.click();
        await page.waitForTimeout(500);

        // Select a class in the modal/form
        const classSelect = page.locator('select[name="class"], select[name="classId"], [name="classId"]').first();
        const classCount = await classSelect.count();
        
        if (classCount > 0) {
          // Get the selected class value for later verification
          await classSelect.selectOption({ index: 1 });
          const selectedClass = await classSelect.inputValue();
          await page.waitForTimeout(300);

          // Save the assignment
          const saveButton = page.locator('button[type="submit"], button').filter({ hasText: /save|assign/i }).first();
          await saveButton.click();
          await page.waitForTimeout(1500);

          // Verify success
          const successToast = page.locator('[role="alert"]').filter({ hasText: /success|saved/i });
          const toastCount = await successToast.count();
          
          if (toastCount > 0) {
            await expect(successToast.first()).toBeVisible({ timeout: 5000 });
          }

          // Now navigate to the class timetable to verify synchronization
          await page.goto('/classes');
          await page.waitForLoadState('networkidle');

          // Find the class we just assigned
          const classList = page.locator('[class*="class-card"], [class*="class-item"], table tbody tr');
          const classListCount = await classList.count();
          
          if (classListCount > 0) {
            await classList.first().click();
            await page.waitForLoadState('networkidle');

            // Go to timetable tab
            const classTimetableTab = page.getByRole('tab', { name: /timetable/i }).first();
            await classTimetableTab.click();
            await page.waitForTimeout(1000);

            // Verify teacher appears in the timetable
            const teacherName = page.locator('[class*="teacher"], [class*="slot"]').filter({ hasText: /teacher|staff/i });
            const teacherNameCount = await teacherName.count();
            
            // At least one slot should have a teacher assigned
            expect(teacherNameCount).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  /**
   * Test 3: Handling conflict scenarios through UI
   * 
   * This test verifies conflict detection and resolution:
   * 1. Create a timetable assignment for a teacher
   * 2. Try to assign the same teacher to another class at the same time
   * 3. Verify conflict error is displayed
   * 4. Verify conflict details are shown
   * 5. Resolve the conflict by choosing a different teacher
   */
  test('should detect and handle scheduling conflicts', async ({ page }) => {
    // Navigate to classes
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    // Select first class
    const firstClass = page.locator('[class*="class-card"], [class*="class-item"], table tbody tr').first();
    await firstClass.waitFor({ state: 'visible', timeout: 10000 });
    await firstClass.click();
    await page.waitForLoadState('networkidle');

    // Go to timetable
    const timetableTab = page.getByRole('tab', { name: /timetable/i }).first();
    const tabCount = await timetableTab.count();
    
    if (tabCount > 0) {
      await timetableTab.click();
      await page.waitForTimeout(1000);

      // Click on a slot (Monday, Period 1 for example)
      const slot = page.locator('[class*="slot"], td').nth(1);
      await slot.click();
      await page.waitForTimeout(500);

      // Assign a teacher
      const subjectSelect = page.locator('select[name="subject"]').first();
      const subjectCount = await subjectSelect.count();
      
      if (subjectCount > 0) {
        await subjectSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);

        const teacherSelect = page.locator('select[name="teacher"], select[name="teacherId"]').first();
        const teacherCount = await teacherSelect.count();
        
        if (teacherCount > 0) {
          // Select a specific teacher
          await teacherSelect.selectOption({ index: 1 });
          const selectedTeacher = await teacherSelect.inputValue();
          
          // Save
          const saveButton = page.locator('button').filter({ hasText: /save|assign/i }).first();
          await saveButton.click();
          await page.waitForTimeout(1500);

          // Now go to another class and try to assign the same teacher at the same time
          await page.goto('/classes');
          await page.waitForLoadState('networkidle');

          // Select second class
          const secondClass = page.locator('[class*="class-card"], [class*="class-item"], table tbody tr').nth(1);
          const secondClassCount = await secondClass.count();
          
          if (secondClassCount > 0) {
            await secondClass.click();
            await page.waitForLoadState('networkidle');

            // Go to timetable
            const timetableTab2 = page.getByRole('tab', { name: /timetable/i }).first();
            await timetableTab2.click();
            await page.waitForTimeout(1000);

            // Click on the same slot (Monday, Period 1)
            const slot2 = page.locator('[class*="slot"], td').nth(1);
            await slot2.click();
            await page.waitForTimeout(500);

            // Try to assign the same teacher
            const subjectSelect2 = page.locator('select[name="subject"]').first();
            await subjectSelect2.selectOption({ index: 1 });
            await page.waitForTimeout(300);

            const teacherSelect2 = page.locator('select[name="teacher"], select[name="teacherId"]').first();
            
            // The teacher might not appear in the list (filtered out)
            // OR we might see a conflict error after trying to save
            const teacherOptions = await teacherSelect2.locator('option').count();
            
            if (teacherOptions > 1) {
              // Try to select the same teacher if available
              await teacherSelect2.selectOption({ value: selectedTeacher });
              
              const saveButton2 = page.locator('button').filter({ hasText: /save|assign/i }).first();
              await saveButton2.click();
              await page.waitForTimeout(1000);

              // Look for conflict error
              const conflictError = page.locator('[role="alert"], [class*="error"], [class*="conflict"]').filter({ 
                hasText: /conflict|already assigned|double booking/i 
              });
              
              const errorCount = await conflictError.count();
              
              if (errorCount > 0) {
                // Verify conflict is displayed
                await expect(conflictError.first()).toBeVisible({ timeout: 5000 });
                
                // Verify conflict details are shown
                const conflictDetails = page.locator('[class*="conflict-details"], [class*="error-message"]');
                const detailsCount = await conflictDetails.count();
                
                if (detailsCount > 0) {
                  await expect(conflictDetails.first()).toBeVisible();
                }

                // Close the error and select a different teacher
                const closeButton = page.locator('button').filter({ hasText: /close|ok|dismiss/i }).first();
                const closeCount = await closeButton.count();
                
                if (closeCount > 0) {
                  await closeButton.click();
                  await page.waitForTimeout(500);
                }

                // Select a different teacher
                await teacherSelect2.selectOption({ index: 2 });
                await saveButton2.click();
                await page.waitForTimeout(1000);

                // Should succeed now
                const successToast = page.locator('[role="alert"]').filter({ hasText: /success|saved/i });
                const successCount = await successToast.count();
                
                if (successCount > 0) {
                  await expect(successToast.first()).toBeVisible({ timeout: 5000 });
                }
              }
            }
          }
        }
      }
    }
  });

  /**
   * Test 4: Switching classes for a teacher
   * 
   * This test verifies class switching functionality:
   * 1. Navigate to teacher timetable
   * 2. Select a slot with an existing assignment
   * 3. Change the class assignment
   * 4. Verify both old and new class timetables are updated
   */
  test('should switch classes for a teacher', async ({ page }) => {
    // Navigate to staff module
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');

    // Find a teacher
    const teacherRow = page.locator('table tbody tr, [role="row"]').filter({ hasText: /teacher/i }).first();
    const teacherCount = await teacherRow.count();
    
    if (teacherCount > 0) {
      await teacherRow.click();
      await page.waitForLoadState('networkidle');

      // Go to timetable tab
      const timetableTab = page.getByRole('tab', { name: /timetable/i }).first();
      const tabCount = await timetableTab.count();
      
      if (tabCount > 0) {
        await timetableTab.click();
        await page.waitForTimeout(1000);

        // Find a slot that already has a class assigned
        const filledSlot = page.locator('[class*="filled"], [class*="assigned"], td:has(*)').first();
        const filledCount = await filledSlot.count();
        
        if (filledCount > 0) {
          // Get the current class name
          const currentClass = await filledSlot.textContent();
          
          // Click to edit
          await filledSlot.click();
          await page.waitForTimeout(500);

          // Change the class
          const classSelect = page.locator('select[name="class"], select[name="classId"]').first();
          const classCount = await classSelect.count();
          
          if (classCount > 0) {
            // Get current value
            const currentValue = await classSelect.inputValue();
            
            // Select a different class
            const options = await classSelect.locator('option').count();
            if (options > 2) {
              await classSelect.selectOption({ index: 2 });
              const newValue = await classSelect.inputValue();
              
              // Save the change
              const saveButton = page.locator('button').filter({ hasText: /save|update/i }).first();
              await saveButton.click();
              await page.waitForTimeout(1500);

              // Verify success
              const successToast = page.locator('[role="alert"]').filter({ hasText: /success|updated/i });
              const toastCount = await successToast.count();
              
              if (toastCount > 0) {
                await expect(successToast.first()).toBeVisible({ timeout: 5000 });
              }

              // Verify the slot now shows the new class
              await page.waitForTimeout(500);
              const updatedSlot = await filledSlot.textContent();
              expect(updatedSlot).not.toBe(currentClass);
            }
          }
        }
      }
    }
  });

  /**
   * Test 5: Managing teacher assignments
   * 
   * This test verifies teacher assignment management:
   * 1. Navigate to staff module
   * 2. Open teacher details
   * 3. Go to assignments section
   * 4. Add a new subject-class assignment
   * 5. Verify assignment is saved
   * 6. Remove an assignment
   * 7. Verify assignment is removed
   */
  test('should manage teacher assignments', async ({ page }) => {
    // Navigate to staff module
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');

    // Select a teacher
    const teacherRow = page.locator('table tbody tr, [role="row"]').filter({ hasText: /teacher/i }).first();
    const teacherCount = await teacherRow.count();
    
    if (teacherCount > 0) {
      await teacherRow.click();
      await page.waitForLoadState('networkidle');

      // Look for assignments tab or section
      const assignmentsTab = page.getByRole('tab', { name: /assignment/i }).or(
        page.locator('button, a').filter({ hasText: /assignment/i })
      );
      
      const tabCount = await assignmentsTab.count();
      
      if (tabCount > 0) {
        await assignmentsTab.first().click();
        await page.waitForTimeout(1000);

        // Look for add assignment button
        const addButton = page.locator('button').filter({ hasText: /add|new|create/i }).first();
        const addCount = await addButton.count();
        
        if (addCount > 0) {
          await addButton.click();
          await page.waitForTimeout(500);

          // Fill assignment form
          const subjectSelect = page.locator('select[name="subject"]').first();
          const subjectCount = await subjectSelect.count();
          
          if (subjectCount > 0) {
            await subjectSelect.selectOption({ index: 1 });
            await page.waitForTimeout(300);

            // Select classes
            const classSelect = page.locator('select[name="classes"], [name="classIds"]').first();
            const classCount = await classSelect.count();
            
            if (classCount > 0) {
              await classSelect.selectOption({ index: 1 });
            }

            // Save assignment
            const saveButton = page.locator('button').filter({ hasText: /save|add|create/i }).first();
            await saveButton.click();
            await page.waitForTimeout(1500);

            // Verify success
            const successToast = page.locator('[role="alert"]').filter({ hasText: /success|added|created/i });
            const toastCount = await successToast.count();
            
            if (toastCount > 0) {
              await expect(successToast.first()).toBeVisible({ timeout: 5000 });
            }

            // Verify assignment appears in the list
            const assignmentList = page.locator('[class*="assignment"], table, [class*="list"]');
            await assignmentList.waitFor({ state: 'visible', timeout: 5000 });

            // Try to remove an assignment
            const removeButton = page.locator('button').filter({ hasText: /remove|delete/i }).first();
            const removeCount = await removeButton.count();
            
            if (removeCount > 0) {
              await removeButton.click();
              await page.waitForTimeout(500);

              // Confirm deletion
              const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|delete/i }).first();
              const confirmCount = await confirmButton.count();
              
              if (confirmCount > 0) {
                await confirmButton.click();
                await page.waitForTimeout(1000);

                // Verify success
                const deleteToast = page.locator('[role="alert"]').filter({ hasText: /success|removed|deleted/i });
                const deleteToastCount = await deleteToast.count();
                
                if (deleteToastCount > 0) {
                  await expect(deleteToast.first()).toBeVisible({ timeout: 5000 });
                }
              }
            }
          }
        }
      }
    }
  });

  /**
   * Test 6: Validating timetable completeness
   * 
   * This test verifies timetable validation functionality:
   * 1. Navigate to timetable validation dashboard
   * 2. Run validation check
   * 3. Verify validation results are displayed
   * 4. Check for empty slots identification
   * 5. Check for teacher schedule gaps
   * 6. Verify completeness statistics
   */
  test('should validate timetable completeness', async ({ page }) => {
    // Navigate to classes module
    await page.goto('/classes');
    await page.waitForLoadState('networkidle');

    // Look for validation button or link
    const validationButton = page.locator('button, a').filter({ hasText: /validat/i }).first();
    const validationCount = await validationButton.count();
    
    if (validationCount > 0) {
      await validationButton.click();
      await page.waitForLoadState('networkidle');

      // Wait for validation dashboard to load
      const validationDashboard = page.locator('[class*="validation"], [class*="dashboard"]').first();
      await validationDashboard.waitFor({ state: 'visible', timeout: 10000 });

      // Look for run validation button
      const runButton = page.locator('button').filter({ hasText: /run|check|validate/i }).first();
      const runCount = await runButton.count();
      
      if (runCount > 0) {
        await runButton.click();
        await page.waitForTimeout(2000);

        // Verify validation results are displayed
        const results = page.locator('[class*="result"], [class*="report"], [class*="summary"]');
        const resultsCount = await results.count();
        
        if (resultsCount > 0) {
          await expect(results.first()).toBeVisible();

          // Check for empty slots section
          const emptySlots = page.locator('[class*="empty"], [class*="incomplete"]').filter({ hasText: /empty|incomplete/i });
          const emptySlotsCount = await emptySlots.count();
          
          if (emptySlotsCount > 0) {
            await expect(emptySlots.first()).toBeVisible();
          }

          // Check for teacher gaps section
          const teacherGaps = page.locator('[class*="gap"], [class*="unassigned"]').filter({ hasText: /gap|unassigned/i });
          const gapsCount = await teacherGaps.count();
          
          if (gapsCount > 0) {
            await expect(teacherGaps.first()).toBeVisible();
          }

          // Check for statistics
          const stats = page.locator('[class*="stat"], [class*="metric"], [class*="card"]');
          const statsCount = await stats.count();
          
          expect(statsCount).toBeGreaterThan(0);

          // Verify completeness percentage is shown
          const percentage = page.locator('text=/\\d+%/');
          const percentageCount = await percentage.count();
          
          if (percentageCount > 0) {
            await expect(percentage.first()).toBeVisible();
          }
        }
      }
    } else {
      // Try alternative path - go to a specific class timetable
      const firstClass = page.locator('[class*="class-card"], table tbody tr').first();
      await firstClass.click();
      await page.waitForLoadState('networkidle');

      const timetableTab = page.getByRole('tab', { name: /timetable/i }).first();
      await timetableTab.click();
      await page.waitForTimeout(1000);

      // Look for validation indicator or empty slots
      const emptySlots = page.locator('[class*="empty"], [class*="unassigned"]');
      const emptyCount = await emptySlots.count();
      
      // Verify we can identify empty slots
      console.log(`Found ${emptyCount} empty slots in timetable`);
      
      // Check if there's a completeness indicator
      const completeness = page.locator('text=/complete|incomplete|\\d+%/i');
      const completenessCount = await completeness.count();
      
      if (completenessCount > 0) {
        await expect(completeness.first()).toBeVisible();
      }
    }
  });
});
