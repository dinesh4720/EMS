# Timetable Management System Audit Report

## Executive Summary

The timetable management system has a solid foundation with core functionality implemented across all three apps. However, several critical features for real-time attendance integration, substitution alerts, and cross-app synchronization are incomplete or missing.

---

## Gap Analysis

### 1. ✅ IMPLEMENTED - Core Timetable Management

| Feature | Status | Location |
|---------|--------|----------|
| Class timetable CRUD | ✅ Complete | `backend/routes/timetable.js` |
| Teacher timetable sync | ✅ Complete | `backend/routes/teacherTimetable.js` |
| Conflict detection | ✅ Complete | `backend/services/conflictDetectionService.js` |
| Teacher assignments | ✅ Complete | `backend/routes/teacherAssignments.js` |
| Timetable UI (Admin) | ✅ Complete | `school-dashboard/src/pages/classes/Timetable.jsx` |
| Conflict indicator | ✅ Complete | `school-dashboard/src/components/ConflictIndicator.jsx` |
| Wizard modal | ✅ Complete | `school-dashboard/src/pages/classes/components/TimetableWizardModal.jsx` |

### 2. ⚠️ PARTIAL - Substitution System

| Feature | Status | Notes |
|---------|--------|-------|
| Substitution CRUD | ✅ Complete | `backend/routes/substitutions.js` |
| Substitution UI | ✅ Complete | `school-dashboard/src/pages/classes/Substitution.jsx` |
| **Absence detection trigger** | ❌ Missing | No integration with staff attendance |
| **Auto-suggest substitutes** | ❌ Missing | No endpoint to suggest available teachers |
| **Real-time alerts** | ❌ Missing | No WebSocket/push notifications |
| **Staff app notifications** | ❌ Missing | Substitute teachers not notified |

### 3. ❌ MISSING - Real-time Integration

| Feature | Status | Priority |
|---------|--------|----------|
| Staff attendance → Substitution trigger | ❌ Missing | HIGH |
| Dashboard substitution alerts | ❌ Missing | HIGH |
| Real-time timetable sync | ❌ Missing | MEDIUM |
| Push notifications to substitutes | ❌ Missing | MEDIUM |
| Parent app timetable updates | ❌ Missing | MEDIUM |

### 4. ❌ MISSING - Staff App Features

| Feature | Status | Notes |
|---------|--------|-------|
| Teacher timetable view | ⚠️ Partial | Only `TimetableCard.jsx` exists |
| Full week timetable | ❌ Missing | Need full schedule view |
| Class timetable access | ❌ Missing | Teachers can't view class timetables |
| Substitution notifications | ❌ Missing | No real-time alerts |

### 5. ❌ MISSING - Parent App Features

| Feature | Status | Notes |
|---------|--------|-------|
| Timetable display | ⚠️ Partial | Only `ScheduleCard.js` with mock data |
| Real-time updates | ❌ Missing | No sync with school-dashboard |
| Teacher substitution view | ❌ Missing | Parents don't see substitutes |
| Notifications | ❌ Missing | No schedule change alerts |

### 6. ⚠️ PARTIAL - Configuration System

| Feature | Status | Notes |
|---------|--------|-------|
| Period management | ✅ Complete | In timetable settings |
| Period configuration | ⚠️ Partial | Per-timetable only |
| School-wide config | ❌ Missing | Need global settings |
| Staff free periods | ❌ Missing | Not tracked |

---

## Critical Missing Features

### 1. Absence Detection → Substitution Alert Pipeline

**Current State:**
- Staff attendance is marked in staff-app
- Substitution can be created manually in school-dashboard
- No automatic trigger when teacher marks absent

**Required:**
```javascript
// When staff marks absent in staff-app:
1. Check if teacher has classes today
2. For each class period, create a substitution alert
3. Notify admin dashboard
4. Send push notification to substitute teacher candidates
```

### 2. Substitution Alert Panel (School Dashboard)

**Required:**
- Real-time alert component on main dashboard
- Shows pending substitutions needing assignment
- Priority based on time until class
- Quick-assign feature with available teachers

### 3. Available Teachers for Substitution

**Current API:** `/api/teacher-assignments/available-teachers`
- Returns qualified teachers for a subject/class
- Filters out teachers with conflicts

**Missing:**
- Endpoint specifically for substitution suggestions
- Should consider:
  - Teachers on free period during that slot
  - Teachers qualified for the subject
  - Workload balance
  - Proximity to classroom

### 4. Staff App Timetable Enhancements

**Required:**
- Full week view of teacher's schedule
- View timetables of classes they teach
- Receive substitution assignment notifications
- Mark availability for substitutions

### 5. Parent App Timetable Sync

**Required:**
- Fetch real timetable from API
- Show teacher names per period
- Update when substitutions occur
- Push notifications for changes

---

## Database Schema Analysis

### Existing Schemas (✅ Adequate)

```javascript
// Timetable Schema - Complete
{
  classId, academicYear, periods[],
  schedule: { Monday: [], Tuesday: [], ... }
}

// TeacherTimetable Schema - Complete
{
  teacherId, academicYear,
  schedule: { Monday: [], ... }
}

// Substitution Schema - Complete
{
  date, classId, period,
  absentTeacherId, substituteTeacherId,
  reason, type, status
}

// Staff Schema - Has teacherAssignments
{
  teacherAssignments: [{
    subject, classes[]
  }]
}
```

### Missing Schemas

```javascript
// TimetableConfig Schema (School-wide settings)
{
  schoolId,
  totalPeriodsPerDay,
  workingPeriods,
  breakPeriods,
  defaultTimeSlots: [{ name, startTime, endTime }]
}

// StaffAvailability Schema (For substitutions)
{
  staffId,
  date,
  availablePeriods: [0, 1, 2, ...], // Indices of free periods
  status: 'available' | 'unavailable' | 'partial'
}
```

---

## API Endpoints Analysis

### Existing Endpoints (✅)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/timetable/:classId` | GET | Get class timetable |
| `/api/timetable` | POST | Create timetable |
| `/api/timetable/:classId/slot` | PUT | Update slot |
| `/api/timetable/:classId/batch` | POST | Batch update |
| `/api/teacher-timetable/:teacherId` | GET | Get teacher timetable |
| `/api/teacher-timetable/:teacherId/slot` | PUT | Update teacher slot |
| `/api/teacher-timetable/:teacherId/conflicts` | GET | Get conflicts |
| `/api/teacher-assignments/available-teachers` | GET | Available teachers |
| `/api/substitutions` | GET/POST | Substitution CRUD |

### Missing Endpoints (❌)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/substitutions/auto-suggest` | GET | Suggest substitutes for absent teacher |
| `/api/substitutions/alerts` | GET | Get pending substitution alerts |
| `/api/substitutions/:id/notify` | POST | Notify substitute teacher |
| `/api/timetable/config` | GET/PUT | School-wide timetable config |
| `/api/staff-availability/:date` | GET | Staff availability for date |
| `/api/parent/timetable/:childId` | GET | Child's timetable for parent |

---

## Implementation Priority

### Phase 1: Core Substitution Flow (HIGH PRIORITY)
1. Add absence detection trigger in staff attendance
2. Create substitution alert endpoint
3. Add substitution alert panel to dashboard
4. Implement auto-suggest substitutes endpoint

### Phase 2: Real-time Notifications (MEDIUM PRIORITY)
1. WebSocket integration for live updates
2. Push notifications to substitute teachers
3. Real-time dashboard updates

### Phase 3: Staff App Enhancement (MEDIUM PRIORITY)
1. Full timetable view screen
2. Class timetable viewing
3. Substitution notifications in-app

### Phase 4: Parent App Integration (MEDIUM PRIORITY)
1. Real timetable data fetch
2. Teacher/substitute display
3. Schedule change notifications

### Phase 5: Configuration System (LOW PRIORITY)
1. School-wide timetable config
2. Staff free period tracking
3. Advanced scheduling rules

---

## Recommended Implementation Order

1. **Substitution Alert System**
   - Create `/api/substitutions/alerts` endpoint
   - Add `SubstitutionAlertPanel` component to dashboard
   - Wire up staff attendance to trigger alerts

2. **Auto-Suggest Substitutes**
   - Enhance `/api/teacher-assignments/available-teachers`
   - Add free period detection
   - Add workload balancing

3. **Staff App Notifications**
   - Add push notification handler
   - Create substitution notification UI
   - Accept/reject substitution assignments

4. **Parent App Timetable**
   - Connect to real API
   - Add substitution display
   - Implement notifications

---

## Files to Create/Modify

### Backend (Create)
- `backend/routes/substitutionAlerts.js`
- `backend/services/substitutionService.js`
- `backend/services/notificationService.js`

### Backend (Modify)
- `backend/routes/staffAttendance.js` - Add absence trigger
- `backend/database.js` - Add TimetableConfig schema

### School Dashboard (Create)
- `src/components/SubstitutionAlertPanel.jsx`
- `src/components/SubstitutionNotification.jsx`
- `src/pages/settings/TimetableConfigSettings.jsx`

### School Dashboard (Modify)
- `src/pages/Dashboard.jsx` - Add alert panel
- `src/services/api.js` - Add new endpoints

### Staff App (Create)
- `src/screens/TimetableScreen.jsx`
- `src/screens/ClassTimetableScreen.jsx`
- `src/components/SubstitutionNotification.jsx`

### Staff App (Modify)
- `src/services/api.js` - Add timetable endpoints
- `src/screens/HomeScreen.jsx` - Add timetable quick view

### Parent App (Modify)
- `src/components/ScheduleCard.js` - Connect to API
- `src/services/api.js` - Add timetable endpoints

---

## Conclusion

The timetable system has good foundations but lacks the critical integration between staff attendance and substitution alerts. The highest priority should be implementing the absence detection trigger and substitution alert panel, followed by real-time notifications and cross-app synchronization.
