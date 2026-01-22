# Class Module - Implementation Task Sheet

## Overview
This document outlines all tasks required to implement the comprehensive Class Management System for the EMS application.

**Current Status**: Basic class management (CRUD, basic attendance, timetable, substitution) exists. Major enhancements needed across all areas.

---

## 1. CLASSES LIST PAGE

### Existing Features
- ✅ Basic classes list with pagination
- ✅ Search by class name
- ✅ Sort by name, teacher, strength
- ✅ Filter by class teacher
- ✅ Lazy loading for large datasets

### Required Enhancements

#### 1.1 Page Structure Refactoring
**Priority**: High
**Description**: Remove separate Attendance and Timetable tabs from main classes page. Integrate these into individual Class Dashboard.

**Tasks**:
- [ ] Remove Attendance and Timetable tabs from ClassesPage component
- [ ] Keep only "All Classes" and "Substitution" as main navigation tabs
- [ ] Update routing to redirect `/classes/attendance` to appropriate class dashboard
- [ ] Move existing attendance/timetable views into ClassOverview page

---

#### 1.2 All Classes Table Enhancements

##### 1.2.1 Unassigned Class Teacher
**Priority**: Medium
**Status**: ❌ Not Implemented
**Tasks**:
- [ ] Replace "Unassigned" text with "Assign Class Teacher" button
- [ ] Link button to open teacher assignment modal
- [ ] Add permission check for who can assign class teachers
- [ ] Show toast notification on successful assignment

##### 1.2.2 Academic Performance Column
**Priority**: High
**Status**: ❌ Not Implemented
**Tasks**:
- [ ] Add "Academic Performance" column to classes table
- [ ] Calculate class average from all student marks/grades
- [ ] Display as percentage or grade (e.g., "78%", "B+")
- [ ] Add color coding (Green: >80%, Yellow: 60-80%, Red: <60%)
- [ ] Backend: Create aggregation endpoint `/api/classes/:id/academic-performance`

##### 1.2.3 Row Click Navigation
**Priority**: Medium
**Status**: ❌ Not Implemented
**Tasks**:
- [ ] Make entire table row clickable
- [ ] Navigate to Class Dashboard on row click
- [ ] Prevent navigation when clicking action buttons
- [ ] Add hover effect to indicate interactivity
- [ ] Add visual cursor pointer on hover

##### 1.2.4 Multi-Keyword Search
**Priority**: High
**Status**: ❌ Not Implemented
**Tasks**:
- [ ] Expand search to work with multiple keywords
- [ ] Search in: Class name, Section, Class Teacher name
- [ ] Examples: "10 A", "John Smith", "Class 10 Science"
- [ ] Backend: Update search API to support multi-field filtering
- [ ] Add debouncing for search input

##### 1.2.5 Edit Columns Feature
**Priority**: Medium
**Status**: ❌ Not Implemented
**Tasks**:
- [ ] Add "Edit Columns" button to table header
- [ ] Create column visibility modal/panel
- [ ] Allow users to show/hide columns
- [ ] Allow reordering columns via drag-and-drop
- [ ] Save user preferences to localStorage
- [ ] Add reset to default option

##### 1.2.6 Number of Subjects Column
**Priority**: Low
**Status**: ❌ Not Implemented
**Tasks**:
- [ ] Add "Subjects" column displaying count
- [ ] Count from subjects array in class data
- [ ] Show "0" if no subjects assigned
- [ ] Make clickable to view subject details

##### 1.2.7 Attendance Display Decision
**Priority**: Medium
**Status**: ❌ Decision Needed
**Tasks**:
- [ ] Decide: Show today's attendance OR average attendance?
- [ ] If today: Show percentage with date indicator
- [ ] If average: Calculate from term/academic year data
- [ ] Add tooltip showing details on hover
- [ ] Backend: Create attendance aggregation endpoint

---

#### 1.3 Class Actions

##### 1.3.1 Promote Class
**Priority**: High
**Status**: ❌ Not Implemented
**Description**: Bulk promote all students to next grade/section
**Tasks**:
- [ ] Add "Promote Class" action button
- [ ] Create promotion modal:
  - [ ] Target academic year selection
  - [ ] Target grade/section selection
  - [ ] Student preview list
  - [ ] Confirm/Cancel workflow
- [ ] Backend: POST `/api/classes/:id/promote`
- [ ] Handle students not promoted (failed, fee dues, etc.)
- [ ] Create promotion log/activity entry
- [ ] Send notifications to parents/students
- [ ] Permission check: Only admin/principal can promote

##### 1.3.2 Adjust Class Strength Limit
**Priority**: Medium
**Status**: ⚠️ Partially Implemented (in settings)
**Tasks**:
- [ ] Add "Adjust Strength Limit" quick action
- [ ] Create modal to:
  - [ ] View current strength vs capacity
  - [ ] Increase/decrease limit with reason
  - [ ] Approval workflow if exceeding policy limit
- [ ] Log all changes with audit trail
- [ ] Backend: PUT `/api/classes/:id/strength-limit`

##### 1.3.3 Download Report
**Priority**: Medium
**Status**: ❌ Not Implemented
**Tasks**:
- [ ] Add "Download Report" action button
- [ ] Create report options:
  - [ ] Format: PDF or Excel
  - [ ] Include: Academic performance, Attendance, Fees, Subjects
  - [ ] Date range selection
- [ ] Backend: GET `/api/classes/:id/report`
- [ ] Generate comprehensive class report
- [ ] Include charts/graphs for visual data
- [ ] Add school branding/header

##### 1.3.4 Send Announcement
**Priority**: High
**Status**: ❌ Not Implemented
**Tasks**:
- [ ] Add "Send Announcement" action button
- [ ] Create announcement composer:
  - [ ] Title and description
  - [ ] Target audience: Students, Parents, or Both
  - [ ] Priority: Normal, Urgent, Critical
  - [ ] Attachment support (PDF, images)
  - [ ] Schedule for later option
- [ ] Backend: POST `/api/announcements/class/:classId`
- [ ] Send via: App notification, Email, SMS (based on preferences)
- [ ] Track delivery and read status
- [ ] View announcement history for class

---

## 2. CLASS DASHBOARD

### 2.1 Top Card Redesign
**Priority**: High
**Status**: ❌ Needs Complete Redesign

**Required Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Grade: 10    Section: A    Strength: 35/40            │
│  Class Teacher: John Smith [📨 Message]                │
└─────────────────────────────────────────────────────────┘
```

**Tasks**:
- [ ] Redesign top card with above layout
- [ ] Add message button next to class teacher
- [ ] Show student strength as "current/capacity"
- [ ] Add color indicator for strength:
  - Green: <80% full
  - Yellow: 80-95% full
  - Red: >95% full
- [ ] Quick actions: Edit Class, View Timetable, View All Students
- [ ] Add academic year indicator

---

### 2.2 Overview Section

#### 2.2.1 Today's Status
**Priority**: High
**Status**: ❌ Not Implemented

**Required Widgets**:
1. **Class Attendance** - Today's percentage with count (Present/Absent)
2. **Current Class** - Show current period, subject, teacher
3. **Upcoming Class** - Next period with time, subject, teacher

**Tasks**:
- [ ] Create "Today's Status" grid layout (3 cards)
- [ ] Fetch real-time current period data
- [ ] Calculate today's attendance percentage
- [ ] Show upcoming class based on timetable
- [ ] Add live time indicator
- [ ] Backend: GET `/api/classes/:id/today-status`
- [ ] Refresh data every minute

---

#### 2.2.2 Average Attendance Analytics
**Priority**: High
**Status**: ❌ Not Implemented

**Required Widgets**:
1. **Most Attentive Students** - Top 5 students with highest attendance
2. **Less Attentive Students** - Bottom 5 students needing attention

**Tasks**:
- [ ] Create attendance analytics widget
- [ ] Calculate average attendance per student
- [ ] Display top 5 with photos and percentage
- [ ] Display bottom 5 with red indicator
- [ ] Click to view detailed attendance report
- [ ] Backend: GET `/api/classes/:id/attendance-analytics`
- [ ] Add date range filter (This month, This term, This year)

---

#### 2.2.3 Academic Performance Analytics
**Priority**: High
**Status**: ❌ Not Implemented

**Required Widgets**:
1. **Top Contributors** - Top 5 performing students
2. **Need Improvements** - Bottom 5 students requiring support

**Tasks**:
- [ ] Create academic performance widget
- [ ] Calculate weighted average from exams/assignments
- [ ] Display top 5 with photos and overall grade
- [ ] Display bottom 5 with amber indicator
- [ ] Click to view detailed performance report
- [ ] Subject-wise breakdown option
- [ ] Backend: GET `/api/classes/:id/academic-analytics`
- [ ] Add term/semester filter

---

#### 2.2.4 Fees Overview
**Priority**: High
**Status**: ⚠️ Partially Implemented

**Required Widgets**:
1. **Pending Fees** - Total amount pending for class
2. **Paid Students** - Count of students who paid
3. **Unpaid Students** - Count of students with dues

**Tasks**:
- [ ] Create fees overview cards (3 metrics)
- [ ] Calculate total pending fees amount
- [ ] Count paid vs unpaid students
- [ ] Show payment status bar
- [ ] Color coding: Green (fully paid), Yellow (partial), Red (unpaid)
- [ ] Click to view detailed fees section
- [ ] Backend: GET `/api/classes/:id/fees-overview`

---

#### 2.2.5 Class Rating
**Priority**: Medium
**Status**: ❌ Not Implemented

**Description**: Auto-calculated score (1-5 stars) based on class performance

**Formula**:
- Attendance: 30% weight
- Academic Performance: 40% weight
- Remarks/Behavior: 20% weight
- Fee Compliance: 10% weight

**Tasks**:
- [ ] Create rating calculation logic
- [ ] Display star rating (⭐⭐⭐⭐☆ 4.2)
- [ ] Add rating breakdown tooltip
- [ ] Show monthly rating trend
- [ ] Backend: GET `/api/classes/:id/rating`
- [ ] Recalculate daily/weekly
- [ ] Add rating history chart

---

### 2.3 Students Section
**Priority**: High
**Status**: ⚠️ Basic Implementation Exists

**Existing**: Students list with basic info

**Required Enhancements**:

#### 2.3.1 Attendance Marking in Table
**Tasks**:
- [ ] Add attendance column with toggle (Present/Absent/Late)
- [ ] Allow bulk marking for all students
- [ ] Save with single API call
- [ ] Show today's date in header
- [ ] Navigate to mark past dates
- [ ] Backend: POST `/api/classes/:id/attendance/bulk`

#### 2.3.2 Send Fee Reminders
**Tasks**:
- [ ] Add "Send Reminders" button
- [ ] Filter students with pending fees
- [ ] Bulk select students
- [ ] Send via SMS/Email/App notification
- [ ] Template customization
- [ ] Backend: POST `/api/fees/send-reminders`

#### 2.3.3 Add Remark
**Tasks**:
- [ ] Add "Add Remark" action per student
- [ ] Create remark modal:
  - [ ] Remark type: Positive, Negative, Neutral
  - [ ] Category: Discipline, Academic, Attendance, Other
  - [ ] Description field
  - [ ] Date picker
- [ ] Show remark count badge on student row
- [ ] Backend: POST `/api/students/:id/remarks`

#### 2.3.4 Add New Student / Switch from Section
**Tasks**:
- [ ] Add "Add Student" button
  - [ ] Create new student form
  - [ ] Assign roll number automatically
  - [ ] Add to class immediately
- [ ] Add "Transfer from Section" option
  - [ ] Show list of students from other sections
  - [ ] Select and transfer with reason
  - [ ] Update both sections' counts
- [ ] Backend: POST `/api/classes/:id/students`, PUT `/api/students/:id/transfer`

---

### 2.4 Attendance Section
**Priority**: High
**Status**: ⚠️ Basic Implementation Exists

**Required Enhancements**:

#### 2.4.1 Average Attendance Display
**Tasks**:
- [ ] Show class average attendance (not just today's)
- [ ] Display with trend line (improving/declining)
- [ ] Weekly, Monthly, Term-wise views
- [ ] Compare with school average
- [ ] Backend: GET `/api/classes/:id/attendance-average`

#### 2.4.2 Chronic Absenteeism Tracker
**Tasks**:
- [ ] Identify chronic absentees (threshold: <60% attendance)
- [ ] Create dedicated widget listing these students
- [ ] Add "Send Reminder" action per student
- [ ] Add "Send to Parents" bulk action
- [ ] Track reminder history
- [ ] Alert when attendance drops below 70%
- [ ] Backend: GET `/api/classes/:id/chronic-absentees`

---

### 2.5 Subjects & Teachers Section
**Priority**: High
**Status**: ❌ Needs Complete Implementation

**Required Features**:

#### 2.5.1 Subjects Overview
**Tasks**:
- [ ] Create subjects grid/list showing:
  - [ ] Subject Name
  - [ ] Ongoing Chapter
  - [ ] Completion Progress Bar (% complete)
  - [ ] Upcoming Chapter
  - [ ] Assigned Teacher
- [ ] Color-coded progress (Green >70%, Yellow 40-70%, Red <40%)
- [ ] Click subject to view details
- [ ] Backend: GET `/api/classes/:id/subjects`

#### 2.5.2 Subject Teachers List
**Tasks**:
- [ ] Display all subject teachers for the class
- [ ] Show teacher name, subject, photo
- [ ] Add message icon next to each teacher
- [ ] Show teacher's contact (if allowed)
- [ ] Quick actions: View Profile, Send Message

#### 2.5.3 Add Subject Feature
**Tasks**:
- [ ] Create "Add Subject" modal:
  - [ ] Subject Name (dropdown from master list)
  - [ ] Assign Teacher (searchable dropdown)
  - [ ] Target Students: All or Specific
  - [ ] If specific: Multi-select students
- [ ] Backend: POST `/api/classes/:id/subjects`
- [ ] Update all selected students' subject list
- [ ] Send notification to assigned teacher
- [ ] Create activity log entry

---

### 2.6 Timetable Section
**Priority**: High
**Status**: ✅ Exists (needs enhancements)

**Required Enhancements**:

#### 2.6.1 Day Selection Dropdown
**Tasks**:
- [ ] Add day dropdown (Monday-Saturday)
- [ ] Default to today's day
- [ ] Refresh timetable on day change
- [ ] Highlight today in dropdown

#### 2.6.2 Editable Timetable Blocks
**Tasks**:
- [ ] Make each period block clickable
- [ ] On click: Open edit modal:
  - [ ] Change Subject
  - [ ] Change Teacher
  - [ ] Change Room
  - [ ] Save/Cancel
- [ ] Permission check: Only admin can edit
- [ ] Backend: PUT `/api/classes/:id/timetable/:periodId`

#### 2.6.3 Substitution Required Indicator
**Tasks**:
- [ ] Show "🔴 Substitution Required" badge when teacher is absent
- [ ] Cross-reference with teacher attendance/leave
- [ ] Link to substitution page
- [ ] Show period count needing substitution
- [ ] Backend: GET `/api/classes/:id/substitution-status`

---

### 2.7 Fees Section
**Priority**: High
**Status**: ⚠️ Partially Implemented

**Required Features**:

#### 2.7.1 Fees Management
**Tasks**:
- [ ] Create comprehensive fees section:
  - [ ] Student list with fee status
  - [ ] Columns: Student, Total Fees, Paid, Pending, Due Date, Status
  - [ ] Color-coded status badges
- [ ] Filter by: Paid, Unpaid, Partial
- [ ] Search by student name
- [ ] Backend: GET `/api/classes/:id/fees`

#### 2.7.2 Send Reminders
**Tasks**:
- [ ] Add "Send Reminders" bulk action
- [ ] Filter unpaid students
- [ ] Select reminder template
- [ ] Send via SMS/Email/Notification
- [ ] Track sent reminders
- [ ] Backend: POST `/api/fees/send-reminder`

#### 2.7.3 Collect Payment
**Tasks**:
- [ ] Add "Record Payment" action
- [ ] Payment modal:
  - [ ] Student name auto-filled
  - [ ] Amount field
  - [ ] Payment mode: Cash, Card, UPI, Bank Transfer, Cheque
  - [ ] Transaction ID/Reference
  - [ ] Date picker
  - [ ] Receipt generation
- [ ] Backend: POST `/api/fees/payments`

#### 2.7.4 Apply Concession
**Tasks**:
- [ ] Add "Apply Concession" button
- [ ] Concession modal:
  - [ ] Select from predefined concession types:
    - [ ] Sibling Discount
    - [ ] Merit Scholarship
    - [ ] Financial Aid
    - [ ] Staff Ward
    - [ ] Sports Quota
    - [ ] Other (custom)
  - [ ] Enter discount amount or percentage
  - [ ] Reason/Justification
  - [ ] Attach supporting documents
  - [ ] "Send for Approval" workflow
- [ ] Approval workflow:
  - [ ] Routes to: Principal/Admin
  - [ ] Approver can: Approve, Reject, Request Info
  - [ ] Notification on approval status
- [ ] Backend: POST `/api/fees/concessions`, PUT `/api/fees/concessions/:id/approve`

---

### 2.8 Activity Log
**Priority**: Medium
**Status**: ❌ Not Implemented

**Description**: Track every activity related to the class

**Tasks**:
- [ ] Create activity log table with:
  - [ ] Timestamp (date + time)
  - [ ] Activity type (color-coded)
  - [ ] Description
  - [ ] Performed by (user name)
  - [ ] Details (expandable)
- [ ] Activity types to log:
  - [ ] Student added/removed
  - [ ] Attendance marked
  - [ ] Remarks added
  - [ ] Fees paid/pending
  - [ ] Timetable changed
  - [ ] Subject assigned
  - [ ] Teacher changed
  - [ ] Announcements sent
  - [ ] Promotions
  - [ ] Concessions applied
- [ ] Filters: Date range, Activity type, User
- [ ] Export log (CSV/PDF)
- [ ] Auto-refresh for real-time updates
- [ ] Backend: GET `/api/classes/:id/activity-log`
- [ ] Create log entries for all class actions

---

## 3. SUBSTITUTION PAGE

### Existing Features
- ✅ Basic substitution list
- ✅ Assign teacher functionality

### Required Enhancements

#### 3.1 Search
**Priority**: Medium
**Status**: ❌ Needs Improvement

**Tasks**:
- [ ] Implement multi-keyword search:
  - [ ] Search by: Class name, Teacher name, Subject, Period
  - [ ] Example: "10 A Math", "John Smith Period 1"
- [ ] Add debouncing for search
- [ ] Backend: Update search API

---

#### 3.2 Filters
**Priority**: High
**Status**: ❌ Not Implemented

**Tasks**:
- [ ] Add Status filter:
  - [ ] Assigned
  - [ ] Not Assigned
  - [ ] All
- [ ] Add filter chips for quick selection
- [ ] Combine with search (AND logic)

---

#### 3.3 Date Selection
**Priority**: High
**Status**: ❌ Not Implemented

**Tasks**:
- [ ] Add date picker (default: today)
- [ ] Show substitutions for selected date
- [ ] Quick select: Today, Tomorrow, This Week
- [ ] Navigate prev/next day
- [ ] Backend: GET `/api/substitutions?date=YYYY-MM-DD`

---

#### 3.4 Substitution List Redesign
**Priority**: High
**Status**: ❌ Needs Redesign

**Required Columns**:
1. Class Details (Grade + Section)
2. Period or Subject
3. Teacher Absent (Name + Reason)
4. Status (Badge: Assigned/Not Assigned)
5. Actions (Assign/Change/Cancel)

**Tasks**:
- [ ] Redesign table with above columns
- [ ] Show teacher absence reason if available
- [ ] Color-coded status badges
- [ ] Show substitution period count if multiple periods

---

#### 3.5 Action Buttons

##### 3.5.1 Assign Teacher (If Not Assigned)
**Tasks**:
- [ ] Show "Assign Teacher" button for unassigned substitutions
- [ ] On click: Open teacher selection modal:
  - [ ] Searchable teacher dropdown
  - [ ] Filter by: Subject, Available (free that period)
  - [ ] Show teacher's current schedule
  - [ ] Confirm assignment
- [ ] Notify assigned teacher
- [ ] Backend: POST `/api/substitutions/:id/assign`

##### 3.5.2 Change Teacher (If Assigned)
**Tasks**:
- [ ] Show "Change Teacher" button for assigned substitutions
- [ ] On click: Open teacher change modal:
  - [ ] Show currently assigned teacher
  - [ ] Select new teacher (searchable)
  - [ ] Reason for change (optional)
  - [ ] Notify both old and new teachers
- [ ] Backend: PUT `/api/substitutions/:id/reassign`

##### 3.5.3 Cancel Substitution
**Tasks**:
- [ ] Add "Cancel" button for substitutions
- [ ] Confirmation modal:
  - [ ] Show substitution details
  - [ ] Reason for cancellation
  - [ ] Confirm/Cancel
- [ ] Mark as cancelled (don't delete, keep history)
- [ ] Notify assigned teacher (if any)
- [ ] Backend: DELETE `/api/substitutions/:id` (soft delete)

---

#### 3.6 Create Substitution Feature
**Priority**: Medium
**Status**: ❓ Needs Discussion

**Question**: Is manual substitution creation required?
- **Yes**: For planned absences, events
- **No**: Only handle unplanned/automatic substitutions

**If Yes, tasks**:
- [ ] Add "Create Substitution" button
- [ ] Create substitution form:
  - [ ] Select Class (dropdown)
  - [ ] Select Date (date picker)
  - [ ] If class has only 1 period: Show "Assign Teacher" directly
  - [ ] If class has multiple periods:
    - [ ] Show period checklist
    - [ ] Select multiple periods
    - [ ] Assign teacher for each period separately
  - [ ] Teacher Absent (who's being substituted)
  - [ ] Reason for absence
- [ ] Backend: POST `/api/substitutions`

---

## 4. BACKEND API REQUIREMENTS

### 4.1 New Endpoints Required

#### Academic Performance
```
GET  /api/classes/:id/academic-performance
POST /api/classes/:id/academic-performance/recalculate
```
- Calculate class average from student marks
- Return subject-wise breakdown
- Term/semester filtering

#### Activity Log
```
GET  /api/classes/:id/activity-log
POST /api/classes/:id/activity-log
```
- Fetch paginated activity log
- Create log entry
- Filter by date, type, user

#### Promotion
```
POST /api/classes/:id/promote
GET  /api/classes/:id/promotion-eligibility
```
- Promote all students to next grade
- Check eligibility (fees, attendance, exams)
- Return list of promoted/not promoted students

#### Fees Concession
```
POST   /api/fees/concessions
PUT    /api/fees/concessions/:id/approve
PUT    /api/fees/concessions/:id/reject
GET    /api/classes/:id/fees/concessions
```
- Create concession request
- Approval workflow
- Fetch concessions by class

#### Chapter Tracking
```
GET    /api/classes/:id/subjects/chapters
POST   /api/classes/:id/subjects/:subjectId/chapters
PUT    /api/chapters/:id/progress
```
- Track chapter completion
- Update progress percentage
- Get upcoming chapters

#### Announcements
```
POST /api/announcements/class/:classId
GET  /api/announcements/class/:classId
```
- Send class-specific announcements
- Fetch announcement history
- Track delivery status

#### Rating
```
GET  /api/classes/:id/rating
POST /api/classes/:id/rating/recalculate
```
- Calculate class rating
- Get rating history
- Recalculate on demand

#### Attendance Analytics
```
GET  /api/classes/:id/attendance-analytics
GET  /api/classes/:id/attendance-average
GET  /api/classes/:id/chronic-absentees
```
- Get average attendance statistics
- Identify chronic absentees
- Student-wise attendance breakdown

#### Substitution
```
GET  /api/substitutions?date=YYYY-MM-DD&status=assigned
POST /api/substitutions
POST /api/substitutions/:id/assign
PUT  /api/substitutions/:id/reassign
DELETE /api/substitutions/:id
```
- Filter by date and status
- Create/assign/reassign substitutions

#### Today's Status
```
GET  /api/classes/:id/today-status
```
- Get current period
- Get upcoming period
- Get today's attendance
- Real-time data

---

### 4.2 Database Schema Updates Required

#### New Collections

**activity_logs**
```javascript
{
  classId: ObjectId,
  activityType: String, // student_added, attendance_marked, etc.
  description: String,
  performedBy: ObjectId, // userId
  details: Object, // flexible details based on type
  timestamp: Date
}
```

**concessions**
```javascript
{
  studentId: ObjectId,
  classId: ObjectId,
  concessionType: String, // sibling, merit, financial_aid, etc.
  discountAmount: Number,
  discountPercentage: Number,
  reason: String,
  status: String, // pending, approved, rejected
  requestedBy: ObjectId, // userId
  approvedBy: ObjectId, // userId
  approvalDate: Date,
  rejectionReason: String,
  documents: [String], // file URLs
  academicYear: String
}
```

**chapter_progress**
```javascript
{
  classId: ObjectId,
  subjectId: ObjectId,
  teacherId: ObjectId,
  chapterName: String,
  chapterNumber: Number,
  status: String, // not_started, in_progress, completed
  progressPercentage: Number,
  startDate: Date,
  completedDate: Date,
  upcomingChapters: [String]
}
```

**class_ratings**
```javascript
{
  classId: ObjectId,
  rating: Number, // 1-5
  attendanceScore: Number, // 0-100
  academicScore: Number, // 0-100
  behaviorScore: Number, // 0-100
  feeScore: Number, // 0-100
  calculatedDate: Date,
  academicYear: String
}
```

**announcements**
```javascript
{
  classId: ObjectId,
  title: String,
  description: String,
  targetAudience: String, // students, parents, both
  priority: String, // normal, urgent, critical
  attachments: [String], // file URLs
  scheduledFor: Date,
  sentAt: Date,
  sentBy: ObjectId, // userId
  deliveryStatus: {
    sent: Number,
    delivered: Number,
    read: Number
  }
}
```

#### Schema Updates

**classes** collection - Add fields:
```javascript
{
  // ... existing fields
  strengthLimit: {
    current: Number,
    default: Number,
    adjustments: [{
      newLimit: Number,
      reason: String,
      approvedBy: ObjectId,
      date: Date
    }]
  },
  averageAttendance: Number,
  averageAcademicPerformance: Number,
  rating: Number,
  chapterProgress: [ObjectId] // refs to chapter_progress
}
```

**students** collection - Add fields:
```javascript
{
  // ... existing fields
  attendanceStats: {
    average: Number,
    chronicAbsentee: Boolean
  },
  academicStats: {
    average: Number,
    rank: Number
  },
  remarks: [ObjectId], // refs to remarks collection
  concessions: [ObjectId] // refs to concessions
}
```

---

## 5. UI/UX CONSIDERATIONS

### 5.1 Design System
- Use consistent color scheme across all sections
- Implement loading states for async operations
- Add empty states when no data exists
- Use proper spacing and typography hierarchy
- Ensure mobile responsiveness

### 5.2 Performance
- Implement virtual scrolling for large student lists
- Add caching for frequently accessed data
- Use pagination for long tables
- Lazy load images
- Optimize API calls with batching

### 5.3 Accessibility
- Add ARIA labels for screen readers
- Ensure keyboard navigation works
- Use proper color contrast ratios
- Add alt text for images
- Support screen reader announcements

### 5.4 User Experience
- Add confirmation modals for destructive actions
- Show toast notifications for actions
- Provide undo functionality where possible
- Save form data on navigate away
- Show helpful error messages

---

## 6. PERMISSIONS & ACCESS CONTROL

### Roles and Capabilities

**Admin**
- All actions across all features
- Approve concessions
- Promote classes
- Adjust strength limits

**Principal**
- View all classes
- Approve concessions
- Send announcements
- View reports
- Cannot promote classes (admin only)

**Class Teacher**
- View own class dashboard
- Mark attendance
- Add remarks
- View student details
- Send fee reminders
- Cannot edit fees, promote students

**Subject Teacher**
- View classes where they teach
- View attendance
- Add remarks (academic only)
- Cannot promote, edit fees

**Accountant**
- View all classes
- Manage fees
- Apply concessions (pending approval)
- View fee reports

**Parents/Students**
- View own class dashboard (read-only)
- View attendance, academic performance
- View timetable
- Cannot edit anything

---

## 7. TESTING REQUIREMENTS

### 7.1 Unit Tests
- [ ] All API endpoints
- [ ] Rating calculation logic
- [ ] Attendance aggregation
- [ ] Fee calculations
- [ ] Concession approval workflow

### 7.2 Integration Tests
- [ ] Class promotion flow
- [ ] Fee payment → update dashboard
- [ ] Attendance marking → update analytics
- [ ] Substitution assignment → notifications

### 7.3 E2E Tests
- [ ] Complete class dashboard workflow
- [ ] Create class → add students → mark attendance → view reports
- [ ] Concession request → approval → notification
- [ ] Substitution creation → teacher assignment → notification

---

## 8. IMPLEMENTATION PRIORITY

### Phase 1: Critical (Must Have)
1. Class Dashboard - Top card redesign
2. Today's Status section
3. Academic Performance column in All Classes table
4. Multi-keyword search in All Classes
5. Class Rating calculation
6. Academic Performance analytics
7. Fees overview section
8. Activity Log

### Phase 2: High Priority
1. Promote Class action
2. Send Announcement action
3. Average Attendance analytics
4. Chronic Absenteeism tracker
5. Subjects & Teachers section
6. Attendance marking in students table
7. Fees Management section
8. Concession workflow

### Phase 3: Medium Priority
1. Download Report action
2. Edit Columns feature
3. Adjust Strength Limit action
4. Send Fee Reminders
5. Add Remark feature
6. Timetable enhancements (day dropdown, editable blocks)
7. Substitution page enhancements (search, filters, date selection)

### Phase 4: Nice to Have
1. Chapter tracking
2. Progress bars for subjects
3. Advanced activity log filtering
4. Customizable dashboard widgets
5. Export activity log

---

## 9. SUCCESS METRICS

- [ ] All basic CRUD operations working
- [ ] Real-time data updates via Socket.IO
- [ ] Average page load time < 2 seconds
- [ ] 100% API endpoint test coverage
- [ ] Zero critical bugs in production
- [ ] Positive user feedback on usability
- [ ] Mobile-responsive design validated

---

## 10. OPEN QUESTIONS

1. **Attendance Display**: Should All Classes table show today's attendance or average attendance?
   - **Recommendation**: Show average attendance with tooltip showing today's

2. **Substitution Creation**: Is manual substitution creation required?
   - **Recommendation**: Yes, for planned absences and better management

3. **Class Rating Formula**: Confirm weightage for rating calculation
   - **Current**: Attendance 30%, Academic 40%, Remarks 20%, Fees 10%
   - **Feedback needed**

4. **Concession Approval**: Who should approve concessions?
   - **Current**: Principal/Admin
   - **Feedback needed**

5. **Strength Limit**: Should there be a maximum cap for class strength?
   - **Recommendation**: Yes, with flexible override workflow

---

## DOCUMENT VERSION

- **Version**: 1.0
- **Last Updated**: 2025-01-22
- **Status**: Ready for Implementation

---

**NOTES**:
- This task sheet covers all features mentioned in requirements
- Backend and frontend tasks are separated
- Priority levels assigned for phased implementation
- Estimated complexity: High (4-6 weeks for full implementation with testing)
- Dependencies: Some features require other modules (Fees, Students, Staff)
