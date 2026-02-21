# Class Teacher Assignment UI - Testing Guide

## How to Test the New UI

### 1. Access the Page
Navigate to: **Classes → Class Teachers** tab in the school dashboard

### 2. Initial View
You should see:
- **Left Column**: "Assigned Teachers" - Teachers who are currently class teachers
- **Right Column**: 
  - "Available Teachers" - Teachers without class assignments
  - "Unassigned Classes" - Classes that need teachers

### 3. Test Scenarios

#### Scenario 1: Assign Available Teacher to Unassigned Class
**Steps:**
1. Look at the "Unassigned Classes" section (bottom right)
2. Click the "Assign" button on any unassigned class
3. A modal opens showing all available teachers
4. Click on any teacher card
5. Confirm the assignment
6. ✅ Teacher should move from "Available" to "Assigned" section
7. ✅ Class should disappear from "Unassigned" section

**Expected Result:**
- Toast notification: "Teacher Name assigned to Class X-Y"
- UI updates immediately
- Teacher now shows in assigned section with the class

#### Scenario 2: Swap Two Assigned Teachers
**Steps:**
1. Look at the "Assigned Teachers" section (left)
2. Find a teacher with an assigned class
3. Click the refresh icon (🔄) next to their class
4. Modal opens with swap options
5. Under "Swap with another assigned teacher", click on another teacher
6. Confirm the swap
7. ✅ Both teachers should exchange their classes

**Expected Result:**
- Toast notification: "Swapped: Teacher1 ↔ Teacher2"
- Both teachers remain in assigned section
- Their classes are exchanged

#### Scenario 3: Replace Assigned Teacher with Available Teacher
**Steps:**
1. Look at the "Assigned Teachers" section
2. Click the refresh icon (🔄) next to any assigned class
3. Modal opens with swap options
4. Under "Replace with available teacher", click on an available teacher
5. Confirm the replacement
6. ✅ Old teacher moves to "Available" section
7. ✅ New teacher moves to "Assigned" section with the class

**Expected Result:**
- Toast notification: "New Teacher replaced Old Teacher for Class X-Y"
- Old teacher becomes available
- New teacher takes over the class

#### Scenario 4: Unassign a Teacher
**Steps:**
1. Look at the "Assigned Teachers" section
2. Find any assigned class
3. Click the × (cross) icon next to the class
4. ✅ Teacher moves to "Available" section
5. ✅ Class moves to "Unassigned Classes" section

**Expected Result:**
- Toast notification: "Class X-Y unassigned"
- Teacher becomes available
- Class needs a new teacher

#### Scenario 5: Search Functionality
**Steps:**
1. Type a teacher name in the search box at the top
2. ✅ Both assigned and available sections filter
3. Type a class name (e.g., "10-A")
4. ✅ Only teachers assigned to that class show
5. Clear search
6. ✅ All teachers and classes visible again

**Expected Result:**
- Real-time filtering as you type
- Both columns update simultaneously
- Clear button (×) appears when searching

#### Scenario 6: Permission Check
**Steps:**
1. Login as a user without "classes edit" permission
2. Navigate to Class Teachers page
3. ✅ All "Assign", refresh, and × buttons should be disabled
4. ✅ Clicking them shows: "You do not have permission to edit class assignments"

**Expected Result:**
- Read-only view for users without permissions
- Clear error message when attempting actions

### 4. Edge Cases to Test

#### No Available Teachers
- Assign all teachers to classes
- Try to assign to an unassigned class
- Should show: "No available teachers" message

#### No Unassigned Classes
- Assign teachers to all classes
- Unassigned section should show: "All classes assigned!" with success icon

#### Teacher with Multiple Classes
- If a teacher is assigned to multiple classes (shouldn't happen, but test)
- Should show all classes under that teacher
- Each class should have its own refresh and × buttons

#### Network Errors
- Disconnect network
- Try to assign a teacher
- Should show error toast
- UI should not update (maintains consistency)

### 5. Visual Checks

#### Colors & Badges
- ✅ Assigned section has green/success theme
- ✅ Available section has gray/default theme
- ✅ Unassigned section has yellow/warning theme
- ✅ Badges show correct status (Assigned, Available, X Classes)

#### Responsive Design
- Test on desktop (1920px)
- Test on tablet (768px)
- Test on mobile (375px)
- ✅ Two columns stack on mobile
- ✅ Search bar adapts to screen size
- ✅ Cards remain readable on all sizes

#### Loading States
- During assignment operations
- ✅ Buttons show loading spinner
- ✅ Modal buttons disabled during processing
- ✅ "Processing..." text appears

### 6. Data Consistency Checks

After each operation, verify:
1. **Database**: Check backend logs for successful updates
2. **UI State**: Assigned/Available counts update correctly
3. **Class Cards**: Show correct teacher names and photos
4. **Teacher Cards**: Show correct class assignments
5. **No Duplicates**: No teacher appears in both sections
6. **No Orphans**: Every class has either a teacher or is in unassigned

### 7. Performance Checks

- **Initial Load**: Should load within 2 seconds
- **Search**: Should filter instantly (< 100ms)
- **Assignment**: Should complete within 1 second
- **Swap**: Should complete within 2 seconds
- **No Memory Leaks**: Check browser dev tools after multiple operations

### 8. Accessibility Checks

- ✅ All buttons have proper aria-labels
- ✅ Keyboard navigation works (Tab, Enter, Escape)
- ✅ Screen reader announces changes
- ✅ Focus indicators visible
- ✅ Color contrast meets WCAG AA standards

## Common Issues & Solutions

### Issue: Teacher not moving to assigned section
**Solution**: Check if refetch() is being called after assignment

### Issue: Modal not closing after assignment
**Solution**: Verify executeAssignment() sets isProcessing to false

### Issue: Search not working
**Solution**: Check if searchQuery state is updating correctly

### Issue: Swap not working
**Solution**: Verify both API calls complete successfully

### Issue: Permission errors
**Solution**: Check user has 'classes' 'edit' permission in database

## Success Criteria

✅ All 6 test scenarios pass
✅ All edge cases handled gracefully
✅ Visual design matches mockup
✅ Responsive on all screen sizes
✅ No console errors
✅ Performance within acceptable limits
✅ Accessibility requirements met
✅ Data consistency maintained

## Browser Compatibility

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## Reporting Issues

If you find any issues, report with:
1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots/video if possible
5. Console errors (if any)
6. Network tab errors (if any)
