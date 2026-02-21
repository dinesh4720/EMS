# School Dashboard - Timetable Management System Audit & Enhancement

## Overview
Audit the existing timetable management system in the school dashboard and implement missing features/fixes to ensure it properly handles class scheduling, staff assignments, and real-time attendance tracking with substitution alerts.

## Approach
1. Review existing timetable implementation in school-dashboard, staff-app, and parent-app
2. Compare current functionality against the requirements below
3. Identify gaps, bugs, and missing features
4. Implement necessary changes to meet all requirements
5. Ensure cross-app synchronization works correctly

## Required Functionality (Audit Against These)

### 1. Data Structure & Relationships

#### Class-Subject-Teacher Assignment
- Each staff member can be assigned to multiple subjects across different classes
- Support for multiple sections per grade (e.g., 1A, 1B, 2A, 2B)
- Maintain relationships between:
  - Staff → Subjects → Classes
  - Classes → Time Slots → Subjects → Teachers

#### Constraint: One Class Teacher Per Class
- Each class must have exactly one designated class teacher
- Validation to prevent multiple class teachers for the same class
- Clear indication of class teacher role in the system

#### Constraint: No Simultaneous Assignments
- A staff member cannot be assigned to teach two different classes at the same time
- Real-time conflict detection during timetable creation/editing
- Visual indicators for scheduling conflicts

### 2. Staff Visibility & Access Control

#### Teacher Dashboard Access
- Each teacher should be able to view their complete timetable
- Display all classes they are assigned to teach
- Show time slots, subjects, and class sections
- Filter view by day/week

#### Class-Specific Timetable View
- Teachers can view the full timetable for classes they teach
- Access to see which other teachers are teaching the same class
- Visibility into the complete schedule for coordination purposes

### 3. Attendance Integration & Substitution System

#### Absence Detection
- Monitor staff attendance marking in the staff-app
- Real-time detection when a staff member marks themselves absent for the day
- Trigger alerts immediately upon absence confirmation

#### Substitution Alert System
- When a teacher marks absent, generate alerts on the main dashboard
- Alert should display:
  - Absent teacher's name and role
  - Affected classes and time slots
  - Subject(s) that need coverage
  - Suggested available teachers (those without classes during that period)
- Alert priority based on:
  - Time until the class starts
  - Number of periods affected
  - Class importance (e.g., exam classes)

#### Substitution Assignment
- Admin/Principal can assign substitute teachers from the dashboard
- Quick-assign feature showing only available staff for that time slot
- Temporary assignment that doesn't permanently modify the timetable
- Notification sent to substitute teacher via staff-app

### 4. Timetable Configuration System

#### Flexible Period Configuration
- Configurable number of working periods per day
- Configurable number of free periods per staff member
- Settings should be adjustable per:
  - School-wide defaults
  - Individual staff members (if needed)
  - Different days of the week (if needed)

#### Example Configuration
- Total periods: 4 working + 3 free = 7 periods per day
- Time slots: 8-9, 9-10, 10-11, 11-12
- Free periods distributed throughout the day
- Break times and lunch periods configurable

#### Configuration Interface
- Admin panel for setting period structure
- Visual timeline editor for defining time slots
- Bulk apply settings or customize per staff/class
- Validation to ensure minimum teaching requirements are met

### 5. Parent App Integration

#### Timetable Visibility
- Parents should see their child's complete class timetable
- Display includes:
  - Subject names
  - Teacher names
  - Time slots
  - Room numbers (if applicable)
- Real-time updates when substitutions occur
- Notifications for teacher changes or schedule modifications

#### Synchronization
- Timetable changes in school-dashboard should reflect immediately in parent-app
- Substitution information should be visible to parents
- Historical view of schedule changes

## Technical Implementation Requirements

### Step 1: Audit Existing Code
Before making changes, review:
- `school-dashboard/src/` - Look for timetable-related components, pages, and services
- `staff-app/src/` - Check for timetable views and attendance marking
- `parent-app/src/` - Verify timetable display for parents
- `backend/` - Review timetable APIs, models, and controllers
- Database collections/tables - Check existing schema

### Step 2: Compare Database Schema
Check if existing schema matches requirements:
```
Collections/Tables needed:
- timetables
  - classId
  - dayOfWeek
  - timeSlot
  - subjectId
  - teacherId
  - isSubstitution (boolean)
  - originalTeacherId (if substitution)
  
- staffAssignments
  - staffId
  - classId
  - subjectId
  - isClassTeacher (boolean)
  
- timetableConfig
  - schoolId
  - totalPeriods
  - workingPeriods
  - freePeriods
  - timeSlots []
  
- substitutions
  - date
  - absentTeacherId
  - substituteTeacherId
  - classId
  - timeSlot
  - status (pending/assigned/completed)
```

### Step 3: Verify API Endpoints
Check if these endpoints exist and work correctly:
```
POST /api/timetable/create - Create/update timetable
GET /api/timetable/class/:classId - Get class timetable
GET /api/timetable/teacher/:teacherId - Get teacher's schedule
POST /api/timetable/assign-staff - Assign teacher to class/subject
GET /api/timetable/conflicts - Check for scheduling conflicts
POST /api/timetable/config - Update period configuration
GET /api/timetable/config - Get period configuration

POST /api/substitution/alert - Create substitution alert
GET /api/substitution/available-teachers - Get available teachers for time slot
POST /api/substitution/assign - Assign substitute teacher
GET /api/substitution/pending - Get pending substitutions

GET /api/staff/assignments/:staffId - Get staff assignments
POST /api/staff/validate-assignment - Validate before assignment
```

**Action**: Test each endpoint, note which are missing or broken

### Step 4: Verify Validation Rules
Check if these validations are implemented:
- [ ] Before assigning a teacher to a time slot, check for conflicts
- [ ] Validate that only one class teacher exists per class
- [ ] Ensure configured period limits are respected
- [ ] Verify teacher availability before substitution assignment
- [ ] Prevent deletion of timetable entries with active substitutions

**Action**: Test each validation, implement missing ones

### Step 5: Verify Real-time Features
Check if these are working:
- [ ] WebSocket/Firebase listeners for attendance status changes
- [ ] Live updates to dashboard when absences are marked
- [ ] Real-time conflict detection during timetable editing
- [ ] Instant notifications to substitute teachers

**Action**: Test real-time sync, fix broken listeners

### Step 6: Audit UI Components

#### Admin Dashboard (school-dashboard)
Check if these exist and work:
- [ ] Timetable grid view (classes × time slots)
- [ ] Drag-and-drop interface for assigning teachers
- [ ] Conflict indicator overlays
- [ ] Substitution alert panel
- [ ] Configuration settings panel

**Action**: Note missing/broken components, implement/fix them

#### Teacher View (staff-app)
Check if these exist and work:
- [ ] Personal timetable calendar
- [ ] Class-wise timetable view
- [ ] Upcoming classes widget
- [ ] Substitution assignments notification

**Action**: Note missing/broken components, implement/fix them

#### Parent View (parent-app)
Check if these exist and work:
- [ ] Child's class timetable
- [ ] Teacher contact information
- [ ] Schedule change notifications
- [ ] Historical timetable view

**Action**: Note missing/broken components, implement/fix them

## User Stories

### As an Admin
- I want to create and manage timetables for all classes
- I want to assign teachers to subjects and classes without conflicts
- I want to be alerted when a teacher is absent and needs a substitute
- I want to quickly find and assign available teachers for substitution
- I want to configure the school's period structure

### As a Teacher
- I want to view my complete teaching schedule
- I want to see which classes I'm teaching and when
- I want to view the full timetable of classes I teach
- I want to be notified when I'm assigned as a substitute
- I want to see my free periods

### As a Parent
- I want to see my child's class timetable
- I want to know who is teaching each subject
- I want to be notified if there's a teacher change or substitution
- I want to access the timetable from the parent app

## Implementation Workflow

### Phase 1: Discovery (30 minutes)
1. Explore existing timetable code in all three apps
2. Test current functionality manually
3. Document what works and what doesn't
4. Create a gap analysis document

### Phase 2: Backend Fixes (2-3 hours)
1. Fix/implement missing API endpoints
2. Add missing validation rules
3. Ensure database schema is correct
4. Test all endpoints with Postman/scripts

### Phase 3: School Dashboard Updates (2-3 hours)
1. Fix/implement timetable creation UI
2. Add conflict detection indicators
3. Implement substitution alert system
4. Add configuration panel
5. Test admin workflows

### Phase 4: Staff App Updates (1-2 hours)
1. Ensure teacher can view their timetable
2. Ensure teacher can view class timetables
3. Add substitution notifications
4. Test teacher workflows

### Phase 5: Parent App Updates (1 hour)
1. Verify timetable display works
2. Add/fix change notifications
3. Test parent workflows

### Phase 6: Integration Testing (1 hour)
1. Test end-to-end workflows
2. Verify cross-app synchronization
3. Test real-time features
4. Fix any issues found

## Success Criteria
- [ ] Zero scheduling conflicts allowed in the system
- [ ] Substitution alerts appear within 1 minute of absence marking
- [ ] All three apps show synchronized timetable data
- [ ] Configuration changes apply correctly across all timetables
- [ ] Teachers can view their schedules without errors
- [ ] Teachers can view timetables of classes they teach
- [ ] Parents see updated timetables in real-time
- [ ] All 8 requirements from the concept image are met

## Testing Requirements

### Manual Testing Checklist
- [ ] Create a timetable for a class with multiple teachers
- [ ] Try to assign same teacher to two classes at same time (should fail)
- [ ] Try to assign two class teachers to same class (should fail)
- [ ] Mark a teacher absent in staff-app
- [ ] Verify alert appears in school-dashboard
- [ ] Assign a substitute teacher
- [ ] Verify substitute receives notification
- [ ] Check if parent-app shows updated timetable
- [ ] Test period configuration changes
- [ ] Verify teacher can see their full schedule
- [ ] Verify teacher can see timetables of classes they teach

### Automated Testing (if time permits)
- Unit tests for conflict detection logic
- Integration tests for attendance-substitution workflow
- E2E tests for timetable creation and editing
- Cross-app synchronization tests

## Future Enhancements (Optional)
- AI-powered substitution suggestions based on teacher expertise
- Automatic timetable generation with constraint satisfaction
- Analytics on teacher workload distribution
- Student-specific timetable view (for higher grades with electives)
- Room allocation and conflict management
- Recurring substitution patterns (e.g., maternity leave coverage)
