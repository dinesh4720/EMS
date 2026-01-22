# Timetable Management System - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Class Settings](#class-settings)
4. [Teacher Assignments](#teacher-assignments)
5. [Creating Class Timetables](#creating-class-timetables)
6. [Managing Teacher Timetables](#managing-teacher-timetables)
7. [Handling Conflicts](#handling-conflicts)
8. [Validation and Completeness](#validation-and-completeness)
9. [Troubleshooting](#troubleshooting)

## Introduction

The Timetable Management System enables you to create and manage school schedules from both class and teacher perspectives. The system automatically synchronizes changes between class and teacher timetables and prevents scheduling conflicts.

### Key Features
- **Bidirectional Timetable Management**: Create timetables from class or teacher view
- **Automatic Synchronization**: Changes in one view automatically update the other
- **Conflict Detection**: Prevents double-booking of teachers
- **Smart Teacher Filtering**: Shows only qualified and available teachers
- **Validation Tools**: Identify incomplete schedules and gaps

## Getting Started

### Prerequisites
- Admin or appropriate role permissions
- Classes and staff members already created in the system
- Subjects defined for each class

### Initial Setup Workflow
1. Configure class settings (tags and subjects)
2. Assign subjects and classes to teachers
3. Create class timetables OR teacher timetables
4. Validate completeness
5. Make adjustments as needed

## Class Settings

### Accessing Class Settings
1. Navigate to **Classes** module
2. Select a class from the list
3. Click on the **Settings** tab

### Configuring Class Tag
A class tag is a free-text label for organizational purposes (e.g., "Science Stream", "Morning Batch").

**Steps:**
1. In the Class Settings panel, locate the "Class Tag" field
2. Enter your desired tag
3. Click **Save**

The tag will appear in the class header and can be used for filtering.

### Assigning Subjects to Class
Define which subjects are taught in this class.

**Steps:**
1. In the Class Settings panel, locate the "Assigned Subjects" section
2. Select subjects from the dropdown (multiple selection allowed)
3. Click **Save**

**Note:** Only subjects assigned to a class will be available when creating that class's timetable.

## Teacher Assignments

### Accessing Teacher Assignments
1. Navigate to **Staff** module
2. Select a teacher from the list
3. Click on the **Assignments** tab

### Creating Subject-Class Assignments
Define which subjects a teacher can teach in which classes.

**Steps:**
1. In the Staff Assignment panel, click **Add Assignment**
2. Select a **Subject** from the dropdown
3. Select one or more **Classes** where the teacher can teach this subject
4. Click **Save**

**Example:**
- Teacher: John Smith
- Subject: Mathematics
- Classes: Class 10A, Class 10B, Class 10C

This means John Smith is qualified to teach Mathematics in any of these three classes.

### Removing Assignments
1. Locate the assignment in the list
2. Click the **Remove** button (trash icon)
3. Confirm the deletion

**Warning:** Removing an assignment will prevent the teacher from being assigned to that subject-class combination in timetables.

## Creating Class Timetables

### Accessing Class Timetable Editor
1. Navigate to **Classes** module
2. Select a class from the list
3. Click on the **Timetable** tab

### Adding a Period
1. Click on an empty time slot in the timetable grid
2. The slot editor dialog will open

### Assigning Subject and Teacher
**Steps:**
1. Select a **Subject** from the dropdown
   - Only subjects assigned to this class will appear
2. Select a **Teacher** from the dropdown
   - Only teachers qualified for this subject in this class will appear
   - Teachers already assigned to another class in this time slot will be filtered out
3. (Optional) Enter a **Room** number
4. Click **Save**

### What Happens When You Save
- The class timetable is updated
- The teacher's timetable is automatically updated with this class assignment
- The system checks for conflicts before saving

### Editing an Existing Period
1. Click on a filled time slot
2. Modify the subject, teacher, or room
3. Click **Save**

The system will:
- Update both class and teacher timetables
- Remove the previous teacher from their timetable (if changed)
- Add the new teacher to their timetable

### Deleting a Period
1. Click on a filled time slot
2. Click **Delete** or clear all fields
3. Confirm the deletion

The system will remove the entry from both class and teacher timetables.

## Managing Teacher Timetables

### Accessing Teacher Timetable Editor
1. Navigate to **Staff** module
2. Select a teacher from the list
3. Click on the **Timetable** tab

### Viewing Teacher Schedule
The teacher timetable shows:
- All classes assigned to the teacher
- Subjects being taught
- Room assignments
- Free periods (empty slots)

### Assigning a Class to a Time Slot
**Steps:**
1. Click on an empty time slot
2. Select a **Class** from the dropdown
   - Only classes where the teacher has subject assignments will appear
3. Select the **Subject** to teach
4. (Optional) Enter a **Room** number
5. Click **Save**

### Switching Classes
You can change which class a teacher teaches in a specific time slot.

**Steps:**
1. Click on a filled time slot
2. Select a different **Class** from the dropdown
3. The subject will update based on what the teacher can teach in the new class
4. Click **Save**

**What Happens:**
- Teacher is removed from the previous class's timetable for this slot
- Teacher is added to the new class's timetable for this slot
- Both class timetables are updated automatically

### Validation
The system validates that:
- The teacher is qualified to teach the subject in the selected class
- No scheduling conflicts exist
- The teacher has a valid assignment for the subject-class combination

## Handling Conflicts

### What is a Conflict?
A conflict occurs when a teacher is assigned to multiple classes in the same time slot (double-booking).

### Conflict Detection
The system automatically detects conflicts when you:
- Assign a teacher to a time slot
- Switch classes in a teacher's timetable
- Make any timetable modification

### Conflict Indicators
When a conflict is detected:
- A **red warning icon** appears on the affected time slot
- A **conflict dialog** displays with details:
  - Teacher name
  - Conflicting classes
  - Day and period
  - Suggested resolutions

### Resolving Conflicts

**Option 1: Choose a Different Teacher**
1. Click on the conflicting slot
2. Select a different teacher from the available list
3. Save the change

**Option 2: Remove One Assignment**
1. Open the conflict dialog
2. Click **Remove from [Class Name]** to remove the teacher from one of the conflicting classes
3. The conflict will be resolved

**Option 3: Reschedule**
1. Move one of the conflicting classes to a different time slot
2. The conflict will be automatically resolved

### Viewing All Conflicts
1. Navigate to **Classes** > **Timetable Validation**
2. The validation dashboard shows all active conflicts
3. Click on a conflict to navigate to the affected timetable

## Validation and Completeness

### Accessing Validation Dashboard
1. Navigate to **Classes** module
2. Click on **Timetable Validation** in the sidebar

### Understanding Validation Reports

**Class Timetable Completeness:**
- Shows percentage of filled time slots for each class
- Highlights classes with empty slots
- Lists specific periods that need assignment

**Teacher Schedule Completeness:**
- Shows how many periods each teacher is assigned
- Identifies teachers with too few or too many periods
- Highlights scheduling gaps

**Active Conflicts:**
- Lists all unresolved scheduling conflicts
- Shows affected teachers and classes
- Provides quick navigation to resolve conflicts

### Validation Metrics
- **Complete**: All time slots are filled
- **Incomplete**: Some time slots are empty
- **Conflicts**: Scheduling conflicts exist
- **Optimal**: Balanced teacher workload

### Taking Action
1. Click on any incomplete class or teacher
2. You'll be navigated to their timetable editor
3. Fill in the missing slots
4. Return to validation dashboard to verify

## Troubleshooting

### Teacher Not Appearing in Available List

**Possible Causes:**
1. Teacher doesn't have an assignment for this subject-class combination
2. Teacher is already assigned to another class in this time slot
3. Teacher is not marked as active in the system

**Solution:**
1. Go to Staff > [Teacher Name] > Assignments
2. Verify the teacher has the correct subject-class assignment
3. Check if the teacher is assigned elsewhere in this time slot
4. Ensure the teacher's status is "Active"

### Changes Not Syncing

**Possible Causes:**
1. Network connectivity issue
2. Concurrent modification by another user
3. Browser cache issue

**Solution:**
1. Refresh the page
2. Check your internet connection
3. Clear browser cache and reload
4. Contact system administrator if issue persists

### Cannot Save Timetable

**Possible Causes:**
1. Validation error (conflict detected)
2. Missing required fields
3. Permission issue

**Solution:**
1. Check for conflict warnings and resolve them
2. Ensure all required fields are filled
3. Verify you have permission to edit timetables
4. Check browser console for error messages

### Timetable Shows Outdated Data

**Solution:**
1. Click the **Refresh** button in the timetable view
2. If issue persists, log out and log back in
3. Clear browser cache

### Conflict Not Detected

**If you notice a double-booking that wasn't caught:**
1. Refresh the page to ensure you have the latest data
2. Report the issue to the system administrator
3. Manually resolve the conflict by reassigning one of the slots

### Performance Issues

**If the timetable loads slowly:**
1. Close unnecessary browser tabs
2. Clear browser cache
3. Use a modern browser (Chrome, Firefox, Edge)
4. Contact administrator if issue affects multiple users

## Best Practices

### Planning Your Timetable
1. **Start with class settings**: Configure all class tags and subjects first
2. **Set up teacher assignments**: Ensure all teachers have their subject-class assignments
3. **Create a template**: Start with one class as a template, then replicate
4. **Validate frequently**: Check for conflicts and completeness regularly
5. **Communicate changes**: Inform teachers of schedule changes promptly

### Efficient Workflow
1. **Use teacher view for individual adjustments**: When making changes for a specific teacher
2. **Use class view for bulk scheduling**: When creating schedules for multiple classes
3. **Resolve conflicts immediately**: Don't let conflicts accumulate
4. **Save frequently**: Save your work after each major change

### Avoiding Common Mistakes
- ❌ Don't forget to assign subjects to classes before creating timetables
- ❌ Don't skip teacher assignments setup
- ❌ Don't ignore conflict warnings
- ❌ Don't make changes without checking validation
- ✅ Do validate completeness before finalizing
- ✅ Do communicate schedule changes to affected teachers
- ✅ Do keep teacher assignments up to date

## Support

For additional help:
- Contact your system administrator
- Refer to the Admin Guide for advanced configuration
- Check the API documentation for integration details

---

**Version:** 1.0  
**Last Updated:** January 2025
