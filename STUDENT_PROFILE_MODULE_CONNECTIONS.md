# Student Profile - Module Connections Map

## Overview

The Student Profile is a **central hub** that connects to almost every module in the school management system. Here's a complete breakdown of all connections.

---

## 1. STUDENTS MODULE (Primary Source)

### Connection Type: **Direct / Primary**

### Data Used:
- ✅ Student ID
- ✅ Full Name
- ✅ Admission ID
- ✅ Academic Year
- ✅ Roll Number
- ✅ Class ID (reference)
- ✅ Personal Information (DOB, gender, blood group, etc.)
- ✅ Contact Information (phone, email, address)
- ✅ Parent/Guardian Information
- ✅ Previous School Details
- ✅ Status (active/inactive)
- ✅ Photo
- ⚠️ Documents (partial)

### API Endpoints:
- `GET /api/students/:id` - Fetch student details
- `PUT /api/students/:id` - Update student information

### Display Locations:
- **Left Sidebar**: Photo, name, admission ID, contact
- **About Tab**: All personal and contact information
- **Overview Tab**: Name, class, basic info

### Status: ✅ **WORKING**

---

## 2. CLASSES MODULE

### Connection Type: **Direct Reference**

### Data Used:
- ✅ Class Name (e.g., "Class 9")
- ✅ Section (e.g., "A")
- ✅ Class Teacher ID
- ✅ Subjects List
- ✅ Academic Year

### API Endpoints:
- `GET /api/classes/:id` - Get class details
- Student data includes `classId` reference

### Display Locations:
- **Left Sidebar**: Class badge (e.g., "9-A")
- **Overview Tab**: "Student of Class 9-A"
- **About Tab**: Class information
- **Academics Tab**: Current class status

### How It Connects:
```
Student.classId → Class._id
Class.classTeacherId → Staff._id
```

### Status: ✅ **WORKING**

---

## 3. STAFF MODULE

### Connection Type: **Indirect via Classes**

### Data Used:
- ✅ Class Teacher Name
- ✅ Class Teacher Contact
- ⚠️ Subject Teachers (not displayed)
- ❌ Teacher Remarks (not implemented)

### API Endpoints:
- `GET /api/staff/:id` - Get staff details
- Class data includes `classTeacherId`

### Display Locations:
- **Overview Tab**: Could show class teacher
- **Academics Tab**: Should show subject teachers
- **Remarks Section**: Teacher who added remark

### How It Connects:
```
Student.classId → Class.classTeacherId → Staff._id
```

### Status: ⚠️ **PARTIAL** (class teacher not prominently displayed)

---

## 4. ATTENDANCE MODULE

### Connection Type: **Direct via Student ID**

### Data Used:
- ✅ Daily Attendance Records
- ✅ Attendance Status (present/absent/late)
- ✅ Date
- ⚠️ Attendance Percentage (calculated, not from API)

### API Endpoints:
- `GET /api/attendance/:classId/:date` - Get attendance for a date
- ❌ `GET /api/students/:id/attendance-summary` - **MISSING**

### Display Locations:
- **Overview Tab**: Monthly attendance card (86%)
- **Overview Tab**: Activity heatmap
- **Academics Tab**: Should show detailed attendance

### How It Connects:
```
Attendance.studentId → Student._id
Attendance.classId → Class._id
```

### Status: ⚠️ **PARTIAL** (UI shows mock data, needs real API)

---

## 5. FEES MODULE

### Connection Type: **Direct via Student ID**

### Data Used:
- ✅ Fee Payment History
- ✅ Payment Amount
- ✅ Payment Date
- ✅ Payment Status
- ✅ Fee Status (paid/pending/overdue)
- ❌ Fee Structure (not displayed)
- ❌ Installment Schedule (not displayed)

### API Endpoints:
- `GET /api/fees/payments?studentId=:id` - Get payment history
- `POST /api/fees/payments` - Record new payment
- `GET /api/fees/structure/:classId` - Get fee structure (EXISTS but not used)
- `GET /api/fees/students/:studentId/summary` - Get fee summary (EXISTS but not used)

### Display Locations:
- **Overview Tab**: Fee payment status card
- **Fees Tab**: Payment history table, record payment

### How It Connects:
```
FeePayment.studentId → Student._id
FeeStructure.classId → Class._id → Student.classId
```

### Status: ⚠️ **NOT LOADING PROPERLY** (API exists but data not fetching)

---

## 6. ACADEMICS/EXAMS MODULE

### Connection Type: **Direct via Student ID**

### Data Used:
- ❌ Exam Results
- ❌ Subject-wise Marks
- ❌ Grades
- ❌ Rank
- ❌ Progress Reports
- ❌ Teacher Comments

### API Endpoints:
- ❌ `GET /api/students/:id/academic-records` - **MISSING**
- ❌ `GET /api/exams/:examId/results?studentId=:id` - **MISSING**

### Display Locations:
- **Academics Tab**: Should show all exam data (CURRENTLY EMPTY)
- **Overview Tab**: Could show recent performance

### How It Connects:
```
AcademicRecord.studentId → Student._id
AcademicRecord.examId → Exam._id
```

### Status: ❌ **NOT IMPLEMENTED**

---

## 7. DOCUMENTS MODULE

### Connection Type: **Direct via Student ID**

### Data Used:
- ⚠️ Document List (in schema but not used)
- ❌ Document Upload
- ❌ Document Download
- ❌ Document Type/Category

### API Endpoints:
- ❌ `GET /api/students/:id/documents` - **MISSING**
- ❌ `POST /api/students/:id/documents` - **MISSING**
- ❌ `DELETE /api/documents/:id` - **MISSING**

### Display Locations:
- **Documents Tab**: Should show all documents (CURRENTLY EMPTY)
- **About Tab**: Could show document count

### How It Connects:
```
Student.documents[] → Array of document objects
Document.studentId → Student._id
```

### Status: ❌ **NOT IMPLEMENTED** (schema exists but no functionality)

---

## 8. MESSAGING/COMMUNICATION MODULE

### Connection Type: **Indirect via Parent Contact**

### Data Used:
- ❌ Parent App Status (active/inactive)
- ❌ Last Login Date
- ❌ Push Notification Status
- ❌ Communication Logs
- ❌ Announcements Sent

### API Endpoints:
- ❌ `GET /api/students/:id/parent-app-status` - **MISSING**
- ❌ `GET /api/communication/logs?studentId=:id` - **MISSING**

### Display Locations:
- **Overview Tab**: Should show parent app status card (MISSING)
- Could show recent communications

### How It Connects:
```
ParentAppStatus.studentId → Student._id
ParentAppStatus.parentPhone → Student.parentPhone
CommunicationLog.recipientId → Student.parentPhone
```

### Status: ❌ **NOT IMPLEMENTED**

---

## 9. FRONT DESK MODULE

### Connection Type: **Indirect via Student ID**

### Data Used:
- ⚠️ Admission Records
- ❌ Visitor Logs (if parent visited)
- ❌ Gate Pass History
- ❌ Appointment History

### API Endpoints:
- `GET /api/admissions?studentId=:id` - Could show admission details
- `GET /api/visitors?studentId=:id` - Could show parent visits
- `GET /api/gate-passes?studentId=:id` - Could show gate passes

### Display Locations:
- **About Tab**: Could show admission date
- **Overview Tab**: Could show recent visits

### How It Connects:
```
Admission.studentId → Student._id
Visitor.studentId → Student._id (if visiting for student)
GatePass.studentId → Student._id
```

### Status: ⚠️ **NOT CONNECTED** (modules exist separately)

---

## 10. SETTINGS MODULE

### Connection Type: **Indirect via Configuration**

### Data Used:
- ✅ Academic Year Settings
- ✅ Fee Heads Configuration
- ✅ Class/Section Settings
- ⚠️ Attendance Rules
- ⚠️ Fee Rules

### API Endpoints:
- `GET /api/settings/academic-year` - Current academic year
- `GET /api/settings/fee-heads` - Fee structure configuration
- `GET /api/settings/classes` - Class configuration

### Display Locations:
- **About Tab**: Academic year
- **Fees Tab**: Fee structure based on settings
- **Academics Tab**: Grading system from settings

### How It Connects:
```
Student.academicYear → Settings.currentAcademicYear
FeeStructure.feeHeads → Settings.feeHeads
```

### Status: ⚠️ **PARTIAL** (settings exist but not fully integrated)

---

## 11. REMARKS/NOTES MODULE

### Connection Type: **Direct via Student ID**

### Data Used:
- ❌ Teacher Remarks
- ❌ Behavioral Notes
- ❌ Medical Alerts
- ❌ Special Instructions
- ❌ Remark Date & Author

### API Endpoints:
- ❌ `GET /api/students/:id/remarks` - **MISSING**
- ❌ `POST /api/students/:id/remarks` - **MISSING**
- ❌ `PUT /api/remarks/:id` - **MISSING**
- ❌ `DELETE /api/remarks/:id` - **MISSING**

### Display Locations:
- **Overview Tab**: Should show recent remarks (MISSING)
- Could have dedicated remarks section

### How It Connects:
```
StudentRemark.studentId → Student._id
StudentRemark.addedBy → Staff._id
```

### Status: ❌ **NOT IMPLEMENTED**

---

## 12. ACHIEVEMENTS/AWARDS MODULE

### Connection Type: **Direct via Student ID**

### Data Used:
- ⚠️ Projects (hardcoded in UI)
- ⚠️ Achievements (hardcoded in UI)
- ❌ Awards Database
- ❌ Competition Results
- ❌ Certificates

### API Endpoints:
- ❌ `GET /api/students/:id/achievements` - **MISSING**
- ❌ `POST /api/students/:id/achievements` - **MISSING**

### Display Locations:
- **Overview Tab**: Projects section (currently hardcoded)
- **Academics Tab**: Could show academic awards

### How It Connects:
```
Achievement.studentId → Student._id
Achievement.awardedBy → Staff._id
```

### Status: ⚠️ **HARDCODED** (UI exists but no real data)

---

## Connection Summary Table

| Module | Connection Type | Status | Priority |
|--------|----------------|--------|----------|
| Students | Direct | ✅ Working | - |
| Classes | Direct Reference | ✅ Working | - |
| Staff | Indirect | ⚠️ Partial | Medium |
| Attendance | Direct | ⚠️ Partial | High |
| Fees | Direct | ⚠️ Not Loading | **High** |
| Academics | Direct | ❌ Missing | **High** |
| Documents | Direct | ❌ Missing | **High** |
| Messaging | Indirect | ❌ Missing | **High** |
| Front Desk | Indirect | ⚠️ Not Connected | Low |
| Settings | Indirect | ⚠️ Partial | Medium |
| Remarks | Direct | ❌ Missing | **High** |
| Achievements | Direct | ⚠️ Hardcoded | Low |

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT PROFILE                           │
│                  (Central Hub Component)                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   STUDENTS   │    │   CLASSES    │    │    STAFF     │
│   ✅ Working │    │   ✅ Working │    │  ⚠️ Partial  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  ATTENDANCE  │    │     FEES     │    │  ACADEMICS   │
│  ⚠️ Partial  │    │ ⚠️ Not Load  │    │  ❌ Missing  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  DOCUMENTS   │    │  MESSAGING   │    │   REMARKS    │
│  ❌ Missing  │    │  ❌ Missing  │    │  ❌ Missing  │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## Integration Checklist

### ✅ Fully Integrated
- [x] Students Module
- [x] Classes Module

### ⚠️ Partially Integrated
- [ ] Staff Module (class teacher not prominent)
- [ ] Attendance Module (mock data, needs real API)
- [ ] Fees Module (API exists but not loading)
- [ ] Settings Module (not fully utilized)

### ❌ Not Integrated
- [ ] Academics/Exams Module
- [ ] Documents Module
- [ ] Messaging/Communication Module
- [ ] Remarks/Notes Module
- [ ] Achievements Module
- [ ] Front Desk Module (could be connected)

---

## Recommended Integration Order

1. **Fix Fees Module** (API exists, just needs proper fetching)
2. **Add Remarks Module** (high value, relatively simple)
3. **Add Documents Module** (critical for student records)
4. **Add Parent App Status** (from Messaging module)
5. **Implement Academics Module** (complex but essential)
6. **Connect Front Desk** (nice to have)
7. **Add Achievements** (enhancement)
