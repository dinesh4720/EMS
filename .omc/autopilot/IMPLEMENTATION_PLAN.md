# Staff Mobile App - Detailed Implementation Plan

**Project:** EMS Staff Mobile App (iOS & Android)
**Location:** `C:\Users\bdk47\Desktop\Projects\kiro bp\EMS\staff-app`
**Backend:** `C:\Users\bdk47\Desktop\Projects\kiro bp\EMS\backend`
**Web Dashboard:** `C:\Users\bdk47\Desktop\Projects\kiro bp\EMS\school-dashboard`
**Date:** 2026-02-02

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Backend API Requirements](#backend-api-requirements)
4. [Work Breakdown Structure](#work-breakdown-structure)
5. [Parallel Execution Strategy](#parallel-execution-strategy)
6. [Risk Areas](#risk-areas)
7. [Success Criteria](#success-criteria)

---

## Project Overview

Create a React Native mobile application for school staff members (teachers, admins) to perform essential tasks on mobile devices. The app will integrate with the existing Node.js/Express backend and MongoDB database.

### Scope Summary

| Feature | Description | Priority |
|---------|-------------|----------|
| Authentication | JWT-based login with biometric support | P0 (Critical) |
| Dashboard | Personalized teacher dashboard with schedule | P0 (Critical) |
| Timetable | View weekly/daily schedule | P0 (Critical) |
| Attendance | Self and class attendance marking | P0 (Critical) |
| Messaging | Real-time chat with parents/staff | P1 (High) |
| Leave Management | Apply and track leave requests | P1 (High) |
| Homework | Create and grade homework (class teacher) | P1 (High) |
| Marks & Remarks | Enter marks and add remarks | P1 (High) |
| Substitution Alerts | View and accept substitutions | P2 (Medium) |
| Gate Pass & Appointments | Approve gate passes, view appointments | P2 (Medium) |
| Settings | Profile, notifications, theme | P2 (Medium) |

---

## Tech Stack

### Mobile Framework
- **React Native 0.75+** with Expo (optional)
- **TypeScript** for type safety

### State Management
- **Zustand** - Lightweight (compared to Redux)
- **Zustand Persist** - State persistence

### Navigation
- **React Navigation v6** - Stack, Tab, Drawer navigators

### UI Components
- **React Native Paper** - Material Design 3 components
- **React Native Vector Icons** - Icon library

### Networking & Storage
- **Axios** - HTTP client
- **Socket.IO Client React Native** - Real-time updates
- **React Native Keychain** - Secure token storage
- **React Native MMKV** - High-performance cache
- **AsyncStorage** - Simple key-value storage

### Utilities
- **date-fns** - Date handling
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **React Native Biometrics** - Biometric auth
- **React Native Fast Image** - Image caching
- **Victory Native** - Charts (optional)
- **React Native Image Picker** - Camera/photos
- **React Native Reanimated** - Animations

---

## Backend API Requirements

### Critical Backend Implementation Details

#### 1. Teacher Dashboard Endpoint Specification

**File:** `backend/routes/teacherDashboard.js`

**Endpoint:** `GET /api/teacher/:teacherId/dashboard`

**Implementation Details:**

```javascript
router.get('/:teacherId/dashboard', authenticate, async (req, res) => {
  const { teacherId } = req.params;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

  try {
    // 1. Get teacher details
    const teacher = await Staff.findById(teacherId);

    // 2. Get today's schedule from teacher timetable
    const timetable = await TeacherTimetable.findOne({ teacherId });
    const todaySchedule = timetable?.schedule[dayOfWeek] || [];

    // 3. Get current period
    const now = new Date();
    const currentPeriod = todaySchedule.find(period => {
      const startTime = new Period(period.startTime);
      const endTime = new Period(period.endTime);
      return now >= startTime && now <= endTime;
    });

    // 4. Get substitutions for today
    const substitutions = await Substitution.find({
      substituteTeacherId: teacherId,
      date: { $gte: todayStr, $lte: todayStr }
    });

    // 5. Get announcements (last 7 days)
    const announcements = await Announcement.find({
      targetAudience: { $in: ['all', 'staff'] },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 }).limit(10);

    // 6. Get pending gate passes count
    const pendingGatePasses = await GatePass.countDocuments({
      status: 'pending',
      date: { $gte: todayStr }
    });

    // 7. Get appointments for today
    const appointments = await Appointment.find({
      date: todayStr
    });

    // 8. If class teacher, get class overview
    let classOverview = null;
    if (teacher.classTeacherOf) {
      const classData = await Class.findById(teacher.classTeacherOf);
      const students = await Student.find({ classId: teacher.classTeacherOf, isDeleted: false });

      // Get today's attendance
      const attendance = await Attendance.find({
        classId: teacher.classTeacherOf,
        date: todayStr
      });

      const presentToday = attendance.filter(a => a.status === 'present').length;
      const absentToday = students.length - presentToday;

      // Get low attendance students (< 75%)
      const lowAttendanceStudents = students.filter(student => {
        const studentAttendance = attendance.filter(a =>
          a.studentId.toString() === student._id.toString()
        );
        const attendedDays = studentAttendance.filter(a => a.status === 'present').length;
        const percentage = (attendedDays / studentAttendance.length) * 100;
        return percentage < 75;
      }).length;

      // Get fee pending count
      const feePendingCount = students.filter(s =>
        s.feeDetails && s.feeDetails.balanceAmount > 0
      ).length;

      classOverview = {
        classId: classData._id,
        className: `${classData.name} ${classData.section || ''}`,
        totalStudents: students.length,
        presentToday,
        absentToday,
        lowAttendanceCount: lowAttendanceStudents,
        feePendingCount
      };
    }

    res.json({
      todaySchedule: todaySchedule.map(p => ({
        period: p.periodIndex,
        subject: p.subject,
        class: p.classId,
        room: p.room,
        time: `${p.startTime} - ${p.endTime}`
      })),
      currentPeriod,
      announcements,
      substitutions,
      pendingGatePasses,
      pendingAppointments: appointments.length,
      classOverview
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 2. Staff Schema Modification Details

**File:** `backend/database.js`

**Location:** Add after line 165 (end of current staffSchema)

**Exact Changes:**

```javascript
// Add to staffSchema (after existing fields, before closing })
// Add around line 160-165

staffSchema.add({
  // Leave balance tracking
  leaveBalance: {
    sick: { type: Number, default: 10 },
    casual: { type: Number, default: 10 },
    earned: { type: Number, default: 15 },
    medical: { type: Number, default: 5 },
    other: { type: Number, default: 2 }
  },

  // FCM tokens for push notifications
  fcmTokens: [{
    token: { type: String, required: true },
    platform: { type: String, enum: ['ios', 'android'], required: true },
    createdAt: { type: Date, default: Date.now }
  }],

  // App preferences
  appSettings: {
    enableNotifications: { type: Boolean, default: true },
    enableSubstitutionAlerts: { type: Boolean, default: true },
    enableGatePassAlerts: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false }
  }
});
```

**Migration Script:**

```javascript
// Run this script once to update existing staff records
const updateStaffSchema = async () => {
  const staff = await Staff.find({});
  for (const s of staff) {
    if (!s.leaveBalance) {
      s.leaveBalance = {
        sick: 10,
        casual: 10,
        earned: 15,
        medical: 5,
        other: 2
      };
      s.appSettings = {
        enableNotifications: true,
        enableSubstitutionAlerts: true,
        enableGatePassAlerts: true,
        darkMode: false
      };
      await s.save();
    }
  }
  console.log('Staff schema updated');
};
```

#### 3. FCM/Push Notification Setup

**Prerequisites (Before Phase 11):**

1. **Firebase Project Setup:**
   - Create Firebase project at https://console.firebase.google.com
   - Add iOS app with bundle ID (e.g., `com.ems.staff`)
   - Add Android app with package name (e.g., `com.ems.staff`)
   - Download `GoogleService-Info.plist` for iOS
   - Download `google-services.json` for Android

2. **Environment Variables:**

```bash
# Add to backend/.env
FCM_SERVER_KEY=your_fcm_server_key_here
FCM_PROJECT_ID=your_project_id
```

3. **FCM Server Implementation:**

**File:** `backend/services/fcmService.js` (NEW)

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../config/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const fcmService = {
  // Send notification to specific device
  async sendToDevice(token, notification) {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      token
    };

    try {
      await admin.messaging().send(message);
    } catch (error) {
      console.error('FCM send error:', error);
    }
  },

  // Send to multiple devices
  async sendToMultiple(tokens, notification) {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      tokens
    };

    try {
      await admin.messaging().sendMulticast(message);
    } catch (error) {
      console.error('FCM multicast error:', error);
    }
  },

  // Send to topic
  async sendToTopic(topic, notification) {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      topic
    };

    try {
      await admin.messaging().send(message);
    } catch (error) {
      console.error('FCM topic error:', error);
    }
  }
};

module.exports = fcmService;
```

#### 4. Offline Caching Strategy

**File:** `staff-app/src/services/cache/cacheStrategy.ts` (NEW)

**Cache Policy:**

```typescript
interface CachePolicy {
  ttl: number; // Time to live in milliseconds
  staleWhileRevalidate: boolean; // Show stale data while fetching fresh
  persistOnDisk: boolean; // Use MMKV for persistent storage
}

export const CACHE_POLICIES: Record<string, CachePolicy> = {
  // Timetable - cache for 24 hours
  timetable: {
    ttl: 24 * 60 * 60 * 1000,
    staleWhileRevalidate: true,
    persistOnDisk: true
  },

  // Dashboard data - cache for 5 minutes
  dashboard: {
    ttl: 5 * 60 * 1000,
    staleWhileRevalidate: true,
    persistOnDisk: false
  },

  // Student list - cache for 1 hour
  students: {
    ttl: 60 * 60 * 1000,
    staleWhileRevalidate: true,
    persistOnDisk: true
  },

  // Messages - no caching
  messages: {
    ttl: 0,
    staleWhileRevalidate: false,
    persistOnDisk: false
  },

  // Announcements - cache for 1 hour
  announcements: {
    ttl: 60 * 60 * 1000,
    staleWhileRevalidate: false,
    persistOnDisk: true
  }
};

// Conflict resolution strategy
export const CONFLICT_RESOLUTION = {
  // Server wins for most data
  DEFAULT: 'SERVER_WINS',

  // Client wins for user-generated data (e.g., message drafts)
  USER_GENERATED: 'CLIENT_WINS',

  // Timestamp-based resolution
  TIMESTAMP: 'LATEST_WINS',

  // Manual merge required
  MANUAL: 'MANUAL_MERGE'
};
```

**Sync Strategy:**

1. **Online Mode:**
   - All requests go to API
   - Response updates cache
   - Socket.IO pushes updates

2. **Offline Mode:**
   - Serve from cache if available
   - Queue mutations (POST/PUT/DELETE)
   - Show "Offline" banner

3. **Back Online:**
   - Sync queued requests in order
   - Invalidate stale cache
   - Fetch fresh data

#### 5. Self-Attendance API Design

**File:** `backend/routes/staffAttendance.js` (MODIFY)

**New Endpoint:** `POST /api/staff-attendance/self`

**Implementation:**

```javascript
router.post('/self', authenticate, async (req, res) => {
  const { status, geolocation } = req.body; // status: 'present' | 'absent'
  const staffId = req.user._id; // From JWT token
  const today = new Date().toISOString().split('T')[0];

  try {
    // Check if already marked today
    const existing = await StaffAttendance.findOne({
      staffId,
      date: today
    });

    if (existing) {
      return res.status(400).json({
        error: 'Attendance already marked for today',
        existing
      });
    }

    // Create attendance record
    const attendance = new StaffAttendance({
      staffId,
      date: today,
      status,
      markedBy: staffId, // Self-marked
      geolocation, // Optional: { latitude, longitude }
      checkInTime: new Date(),
      checkInMethod: 'mobile_app'
    });

    await attendance.save();

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### Existing APIs (Will Use)

The backend already has these APIs that the mobile app will consume:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Staff login |
| `/api/staff` | GET | Get all staff |
| `/api/staff/:id` | GET | Get staff by ID |
| `/api/teacher-timetable/:teacherId` | GET | Get teacher timetable |
| `/api/attendance` | POST | Mark attendance |
| `/api/attendance/bulk` | POST | Bulk attendance |
| `/api/attendance/:classId/:date` | GET | Get class attendance |
| `/api/messages/conversations` | GET | Get conversations |
| `/api/substitutions/teacher/:id` | GET | Get substitutions |
| `/api/gate-passes` | GET | Get gate passes |
| `/api/students` | GET | Get students by class |
| `/api/classes/:id/students` | GET | Get class students |
| `/api/exams` | GET/POST | Exam management |
| `/api/results/bulk` | POST | Bulk marks entry |
| `/api/remarks` | GET/POST | Remarks |

### New APIs Required (Must Create)

#### 1. Leave Management API

**File:** `backend/routes/leave.js`

```javascript
GET    /api/leave/staff/:staffId              - Get leave balance and history
POST   /api/leave/request                     - Submit leave request
PUT    /api/leave/:id/cancel                  - Cancel pending request
GET    /api/leave/approvals/pending           - Get pending approvals (admin)
PUT    /api/leave/:id/approve                 - Approve leave (admin)
PUT    /api/leave/:id/reject                  - Reject leave (admin)
```

**Model:** `backend/models/Leave.js`

```javascript
{
  staffId: ObjectId (ref: Staff),
  leaveType: String (Sick/Casual/Earned/Medical/Other),
  startDate: Date,
  endDate: Date,
  days: Number,
  reason: String,
  status: String (pending/approved/rejected/cancelled),
  attachments: [{ url, name }],
  appliedOn: Date,
  approverId: ObjectId (ref: Staff),
  approvedOn: Date,
  rejectionReason: String,
  requiresSubstitute: Boolean,
  substitutionNotes: String
}
```

#### 2. Homework API

**File:** `backend/routes/homework.js`

```javascript
GET    /api/homework/teacher/:teacherId       - Get homework list
POST   /api/homework                          - Create homework
PUT    /api/homework/:id                      - Update homework
DELETE /api/homework/:id                      - Delete homework
GET    /api/homework/:id/submissions          - Get submissions
PUT    /api/homework/:id/submissions/:subId   - Grade submission
```

**Model:** `backend/models/Homework.js`

```javascript
{
  teacherId: ObjectId (ref: Staff),
  classId: ObjectId (ref: Class),
  subject: String,
  title: String,
  description: String,
  dueDate: Date,
  attachments: [{ url, name, type }],
  submissions: [{
    studentId: ObjectId (ref: Student),
    submittedAt: Date,
    fileUrl: String,
    marks: Number,
    remarks: String
  }],
  status: String (active/completed/cancelled),
  academicYear: String
}
```

#### 3. Teacher Dashboard API

**File:** `backend/routes/teacherDashboard.js`

```javascript
GET    /api/teacher/:teacherId/dashboard      - Get personalized dashboard
```

**Response:**
```javascript
{
  todaySchedule: [...],
  currentPeriod: {...},
  announcements: [...],
  substitutions: [...],
  pendingGatePasses: count,
  pendingAppointments: count,
  classOverview: {  // If class teacher
    totalStudents,
    presentToday,
    absentToday,
    lowAttendanceCount,
    feePendingCount
  }
}
```

#### 4. Staff Schema Updates

**Add to `backend/database.js` Staff schema:**

```javascript
// Add to staffSchema
leaveBalance: {
  sick: { type: Number, default: 10 },
  casual: { type: Number, default: 10 },
  earned: { type: Number, default: 15 },
  medical: { type: Number, default: 5 },
  other: { type: Number, default: 2 }
},
fcmTokens: [{
  token: String,
  platform: String, // 'ios' or 'android'
  createdAt: { type: Date, default: Date.now }
}]
```

---

## Work Breakdown Structure

### Phase 1: Backend API Extensions (Foundation)

**Can Run In Parallel With:** Phase 2 (App Setup)

**Dependencies:** None (can start immediately)

**Deliverable:** New backend endpoints for Leave, Homework, and Teacher Dashboard

| Task ID | Task | File(s) | Depends On | Agent |
|---------|------|---------|------------|-------|
| B1 | Create Leave model | `backend/models/Leave.js` | None | executor |
| B2 | Create Homework model | `backend/models/Homework.js` | None | executor |
| B3 | Create Leave routes | `backend/routes/leave.js` | B1 | executor |
| B4 | Create Homework routes | `backend/routes/homework.js` | B2 | executor |
| B5 | Create Teacher Dashboard routes | `backend/routes/teacherDashboard.js` | None | executor |
| B6 | Update Staff schema | `backend/database.js` | None | executor |
| B7 | Mount routes in server.js | `backend/server.js` | B3, B4, B5 | executor |
| B8 | Test new APIs with Postman | - | B7 | qa-tester |

**Parallel Execution:**
- B1 and B2 can run in parallel
- B3 and B4 can run in parallel after B1/B2
- B5 and B6 can run in parallel with B3/B4
- B7 must wait for B3, B4, B5
- B8 must wait for B7

---

### Phase 2: Mobile App Foundation (Setup)

**Can Run In Parallel With:** Phase 1 (Backend Extensions)

**Dependencies:** None

**Deliverable:** Working React Native app with navigation and API client

| Task ID | Task | File(s) | Depends On | Agent |
|---------|------|---------|------------|-------|
| M1 | Initialize React Native project | `staff-app/` | None | executor-low |
| M2 | Configure TypeScript | `staff-app/tsconfig.json` | M1 | executor-low |
| M3 | Configure React Navigation | `staff-app/src/navigation/` | M2 | executor |
| M4 | Create API client with Axios | `staff-app/src/services/api/client.ts` | M2 | executor |
| M5 | Set up Zustand stores | `staff-app/src/stores/` | M2 | executor |
| M6 | Implement secure storage (Keychain) | `staff-app/src/services/storage/secureStorage.ts` | M2 | executor |
| M7 | Set up theme and design system | `staff-app/src/theme/` | M2 | designer |
| M8 | Create common UI components | `staff-app/src/components/common/` | M7 | designer |
| M9 | Configure environment variables | `staff-app/.env`, `staff-app/app.config.js` | M1 | executor-low |
| M10 | Create Screen wrapper component | `staff-app/src/components/layout/Screen.tsx` | M7 | designer |

**Parallel Execution:**
- M1 (blocking for rest)
- M2-M4 can run in parallel after M1
- M5, M6, M7, M9 can run in parallel after M2
- M8, M10 can run in parallel after M7

---

### Phase 3: Authentication Flow

**Dependencies:** M2, M4, M5, M6

**Deliverable:** Working login with biometric support

| Task ID | Task | File(s) | Depends On | Agent |
|---------|------|---------|------------|-------|
| A1 | Create LoginScreen UI | `staff-app/src/features/auth/screens/LoginScreen.tsx` | M8 | designer |
| A2 | Implement authService | `staff-app/src/features/auth/services/authService.ts` | M4 | executor |
| A3 | Build authStore with Zustand | `staff-app/src/stores/authStore.ts` | M5, M6 | executor |
| A4 | Add biometric auth | `staff-app/src/features/auth/services/biometricService.ts` | A3 | executor |
| A5 | Create loading states | `staff-app/src/components/common/Loading.tsx` | M8 | designer |
| A6 | Create error states | `staff-app/src/components/common/ErrorState.tsx` | M8 | designer |
| A7 | Implement auto-login | `staff-app/src/features/auth/hooks/useAuth.ts` | A3 | executor |
| A8 | Create logout functionality | `staff-app/src/features/auth/hooks/useAuth.ts` | A3 | executor |
| A9 | Build AuthNavigator | `staff-app/src/navigation/AuthNavigator.tsx` | A1 | executor |
| A10 | Test auth flow end-to-end | - | A9 | qa-tester |

**Parallel Execution:**
- A1 can run parallel with A2-A4
- A5, A6 can run in parallel after M8
- A7, A8 can run in parallel after A3
- A9 waits for A1, A3
- A10 waits for A9

---

### Phase 4: Dashboard & Navigation

**Dependencies:** M3, A10, B8 (for teacher dashboard API)

**Deliverable:** Personalized teacher dashboard

| Task ID | Task | File(s) | Depends On | Agent |
|---------|------|---------|------------|-------|
| D1 | Create AppNavigator (Tab) | `staff-app/src/navigation/AppNavigator.tsx` | M3 | executor |
| D2 | Create DashboardScreen layout | `staff-app/src/features/dashboard/screens/DashboardScreen.tsx` | D1 | designer |
| D3 | Build useDashboard hook | `staff-app/src/features/dashboard/hooks/useDashboard.ts` | B8 | executor |
| D4 | Create StatCard component | `staff-app/src/features/dashboard/components/StatCard.tsx` | M8 | designer |
| D5 | Create TodayScheduleCard | `staff-app/src/features/dashboard/components/TodayScheduleCard.tsx` | D4 | designer |
| D6 | Create CurrentPeriodCard | `staff-app/src/features/dashboard/components/CurrentPeriodCard.tsx` | D4 | designer |
| D7 | Create ClassOverviewCard (class teacher) | `staff-app/src/features/dashboard/components/ClassOverviewCard.tsx` | D4 | designer |
| D8 | Add pull-to-refresh | `staff-app/src/features/dashboard/screens/DashboardScreen.tsx` | D2 | executor |
| D9 | Create EmptyState for dashboard | `staff-app/src/features/dashboard/components/DashboardEmptyState.tsx` | M8 | designer |
| D10 | Test dashboard with real data | - | D8 | qa-tester |

**Parallel Execution:**
- D1 can run parallel with D2-D4
- D4 must come before D5, D6, D7
- D5, D6, D7 can run in parallel after D4
- D8 waits for D2
- D9 can run in parallel with others

---

### Phase 5: Timetable Module

**Dependencies:** M3, A10

**Deliverable:** Full timetable view with offline support

| Task ID | Task | File(s) | Depends On | Agent |
|---------|------|---------|------------|-------|
| T1 | Create TimetableScreen | `staff-app/src/features/timetable/screens/TimetableScreen.tsx` | M3 | designer |
| T2 | Build useTimetable hook | `staff-app/src/features/timetable/hooks/useTimetable.ts` | M4 | executor |
| T3 | Create WeekView component | `staff-app/src/features/timetable/components/WeekView.tsx` | T1 | designer |
| T4 | Create PeriodCard component | `staff-app/src/features/timetable/components/PeriodCard.tsx` | M8 | designer |
| T5 | Implement offline caching | `staff-app/src/services/cache/timetableCache.ts` | M6 | executor |
| T6 | Create TodayScheduleScreen | `staff-app/src/features/timetable/screens/TodayScheduleScreen.tsx` | T1 | designer |
| T7 | Add current period highlight | `staff-app/src/features/timetable/components/PeriodCard.tsx` | T4 | executor |
| T8 | Test offline behavior | - | T5 | qa-tester |

**Parallel Execution:**
- T1, T2 can run in parallel
- T3, T4 can run in parallel after T1
- T5 can run in parallel with T3, T4
- T6 can run in parallel with T3, T4
- T7 waits for T4
- T8 waits for T5

---

### Phase 6: Attendance Module

**Dependencies:** M3, A10

**Deliverable:** Self and class attendance marking

| Task ID | Task | File(s) | Depends On | Agent |
|---------|------|---------|------------|-------|
| AT1 | Create AttendanceHomeScreen | `staff-app/src/features/attendance/screens/AttendanceHomeScreen.tsx` | M3 | designer |
| AT2 | Create SelfAttendanceScreen | `staff-app/src/features/attendance/screens/SelfAttendanceScreen.tsx` | M8 | designer |
| AT3 | Build useAttendance hook | `staff-app/src/features/attendance/hooks/useAttendance.ts` | M4 | executor |
| AT4 | Create ClassAttendanceScreen | `staff-app/src/features/attendance/screens/ClassAttendanceScreen.tsx` | AT1 | designer |
| AT5 | Build StudentAttendanceGrid | `staff-app/src/features/attendance/components/StudentAttendanceGrid.tsx` | M8 | designer |
| AT6 | Create bulk attendance API | `staff-app/src/features/attendance/services/attendanceService.ts` | M4 | executor |
| AT7 | Add attendance statistics | `staff-app/src/features/attendance/components/AttendanceStats.tsx` | M8 | designer |
| AT8 | Create attendance calendar view | `staff-app/src/features/attendance/components/AttendanceCalendar.tsx` | M8 | designer |
| AT9 | Test attendance marking for 50 students | - | AT6 | qa-tester |

**Parallel Execution:**
- AT1, AT2, AT3 can run in parallel
- AT4 waits for AT1
- AT5, AT7 can run in parallel after M8
- AT6 can run in parallel with AT5
- AT8 can run in parallel with AT5
- AT9 waits for AT6

---

### Phase 7: Messaging Module

**Dependencies:** M3, A10

**Deliverable:** Real-time chat functionality

| Task ID | Task | File(s) | Depends On | Agent |
|---------|------|---------|------------|-------|
| C1 | Create ConversationsListScreen | `staff-app/src/features/messaging/screens/ConversationsListScreen.tsx` | M3 | designer |
| C2 | Create ChatScreen | `staff-app/src/features/messaging/screens/ChatScreen.tsx` | M8 | designer |
| C3 | Build Socket.IO service | `staff-app/src/services/socket/socketService.ts` | M4 | executor |
| C4 | Create chatStore with Zustand | `staff-app/src/stores/chatStore.ts` | M5 | executor |
| C5 | Implement message sending | `staff-app/src/features/messaging/services/chatService.ts` | C3 | executor |
| C6 | Create MessageBubble component | `staff-app/src/features/messaging/components/MessageBubble.tsx` | M8 | designer |
| C7 | Add typing indicators | `staff-app/src/features/messaging/components/TypingIndicator.tsx` | C6 | designer |
| C8 | Support attachments | `staff-app/src/features/messaging/components/AttachmentPreview.tsx` | C6 | designer |
| C9 | Implement read receipts | `staff-app/src/features/messaging/hooks/useReadReceipts.ts` | C3 | executor |
| C10 | Test real-time messaging | - | C9 | qa-tester |

**Parallel Execution:**
- C1, C2 can run in parallel after M3
- C3, C4 can run in parallel after M4, M5
- C5 waits for C3
- C6, C7, C8 can run in parallel after C2
- C9 can run in parallel after C3
- C10 waits for C9

---

### Phase 8: Leave Management Module

**Dependencies:** M3, A10, B1, B3, B7

**Deliverable:** Complete leave application system

| Task ID | Task | File(s) | Depends On | Agent |
|---------|------|---------|------------|-------|
| L1 | Create LeaveHomeScreen | `staff-app/src/features/leave/screens/LeaveHomeScreen.tsx` | M3 | designer |
| L2 | Build leave balance cards | `staff-app/src/features/leave/components/LeaveBalanceCard.tsx` | M8 | designer |
| L3 | Create ApplyLeaveScreen | `staff-app/src/features/leave/screens/ApplyLeaveScreen.tsx` | L1 | designer |
| L4 | Implement date range picker | `staff-app/src/features/leave/components/DateRangePicker.tsx` | L3 | designer |
| L5 | Create leave type selector | `staff-app/src/features/leave/components/LeaveTypeSelector.tsx` | L3 | designer |
| L6 | Add file upload for documents | `staff-app/src/features/leave/components/DocumentUploader.tsx` | L3 | executor |
| L7 | Create LeaveHistoryScreen | `staff-app/src/features/leave/screens/LeaveHistoryScreen.tsx` | L1 | designer |
| L8 | Build leave status tracker | `staff-app/src/features/leave/components/LeaveStatusTracker.tsx` | L2 | designer |
| L9 | Implement cancel functionality | `staff-app/src/features/leave/hooks/useLeaveActions.ts` | B3 | executor |
| L10 | Test leave application flow | - | L9 | qa-tester |

**Parallel Execution:**
- L1, L2 can run in parallel
- L3 waits for L1
- L4, L5 can run in parallel after L3
- L6 can run in parallel with L4, L5
- L7 can run in parallel with L3-L5
- L8 can run in parallel after L2
- L9 waits for B3
- L10 waits for L9

---

### Phase 9: Homework Module (Class Teacher)

**Dependencies:** M3, A10, B2, B4, B7

**Deliverable:** Homework creation and management

| Task ID | Task | File(s) | Depends On | Agent |
|---------|------|---------|------------|-------|
| H1 | Create HomeworkListScreen | `staff-app/src/features/homework/screens/HomeworkListScreen.tsx` | M3 | designer |
| H2 | Create CreateHomeworkScreen | `staff-app/src/features/homework/screens/CreateHomeworkScreen.tsx` | H1 | designer |
| H3 | Build subject picker | `staff-app/src/features/homework/components/SubjectPicker.tsx` | H2 | designer |
| H4 | Add file attachments | `staff-app/src/features/homework/components/HomeworkAttachments.tsx` | H2 | executor |
| H5 | Create HomeworkDetailScreen | `staff-app/src/features/homework/screens/HomeworkDetailScreen.tsx` | H1 | designer |
| H6 | Build submissions list | `staff-app/src/features/homework/components/SubmissionsList.tsx` | M8 | designer |
| H7 | Create grading interface | `staff-app/src/features/homework/components/GradingInterface.tsx` | H6 | designer |
| H8 | Implement homework API service | `staff-app/src/features/homework/services/homeworkService.ts` | B4 | executor |
| H9 | Test homework creation and grading | - | H8 | qa-tester |

**Parallel Execution:**
- H1 can run parallel with H2-H4
- H3, H4 can run in parallel after H2
- H5 can run in parallel with H3, H4
- H6 can run in parallel after M8
- H7 waits for H6
- H8 waits for B4
- H9 waits for H8

---

### Phase 10: Marks & Remarks Module

**Dependencies:** M3, A10

**Deliverable:** Test creation and marks entry

| Task ID | Task | File(s) | Depends On | Agent |
|---------|------|---------|------------|-------|
| MR1 | Create ExamListScreen | `staff-app/src/features/marks/screens/ExamListScreen.tsx` | M3 | designer |
| MR2 | Create CreateExamScreen | `staff-app/src/features/marks/screens/CreateExamScreen.tsx` | MR1 | designer |
| MR3 | Create EnterMarksScreen | `staff-app/src/features/marks/screens/EnterMarksScreen.tsx` | MR2 | designer |
| MR4 | Build marks grid component | `staff-app/src/features/marks/components/MarksGrid.tsx` | M8 | designer |
| MR5 | Add marks validation | `staff-app/src/features/marks/utils/marksValidation.ts` | MR4 | executor |
| MR6 | Create MarksPreviewScreen | `staff-app/src/features/marks/screens/MarksPreviewScreen.tsx` | MR4 | designer |
| MR7 | Implement publish results | `staff-app/src/features/marks/services/marksService.ts` | M4 | executor |
| MR8 | Create RemarksListScreen | `staff-app/src/features/remarks/screens/RemarksListScreen.tsx` | M3 | designer |
| MR9 | Create AddRemarkScreen | `staff-app/src/features/remarks/screens/AddRemarkScreen.tsx` | MR8 | designer |
| MR10 | Test marks entry flow | - | MR7 | qa-tester |

**Parallel Execution:**
- MR1 can run in parallel with MR8
- MR2, MR8 can run in parallel
- MR3 waits for MR2
- MR4 waits for M8
- MR5 can run in parallel after MR4
- MR6 waits for MR4
- MR7 waits for M4
- MR9 waits for MR8
- MR10 waits for MR7

---

### Phase 11: Substitution & Alerts Module

**Dependencies:** M3, A10

**Deliverable:** Alert notifications and handling

| Task ID | Task | File(s) | Depends On | Agent |
|---------|------|---------|------------|-------|
| S1 | Create SubstitutionsScreen | `staff-app/src/features/substitution/screens/SubstitutionsScreen.tsx` | M3 | designer |
| S2 | Create SubstitutionCard | `staff-app/src/features/substitution/components/SubstitutionCard.tsx` | M8 | designer |
| S3 | Implement accept/decline | `staff-app/src/features/substitution/hooks/useSubstitutionActions.ts` | M4 | executor |
| S4 | Create GatePassListScreen | `staff-app/src/features/gatepass/screens/GatePassListScreen.tsx` | M3 | designer |
| S5 | Build gate pass approval | `staff-app/src/features/gatepass/hooks/useGatePassActions.ts` | M4 | executor |
| S6 | Create AppointmentListScreen | `staff-app/src/features/appointments/screens/AppointmentListScreen.tsx` | M3 | designer |
| S7 | Setup FCM push notifications | `staff-app/src/services/notifications/pushNotification.ts` | M4 | executor |
| S8 | Handle notification tap | `staff-app/src/services/notifications/notificationHandler.ts` | S7 | executor |
| S9 | Test notification flow | - | S8 | qa-tester |

**Parallel Execution:**
- S1, S4, S6 can run in parallel
- S2 can run in parallel after M8
- S3, S5 can run in parallel after M4
- S7 can run in parallel with S1-S6
- S8 waits for S7
- S9 waits for S8

---

### Phase 12: Settings Module

**Dependencies:** M3, A10

**Deliverable:** Settings and profile management

| Task ID | Task | File(s) | Depends On | Agent |
|---------|------|---------|------------|-------|
| ST1 | Create SettingsScreen | `staff-app/src/features/settings/screens/SettingsScreen.tsx` | M3 | designer |
| ST2 | Create ProfileEditScreen | `staff-app/src/features/settings/screens/ProfileEditScreen.tsx` | ST1 | designer |
| ST3 | Create NotificationSettingsScreen | `staff-app/src/features/settings/screens/NotificationSettingsScreen.tsx` | ST1 | designer |
| ST4 | Implement theme toggle | `staff-app/src/features/settings/hooks/useTheme.ts` | M7 | executor |
| ST5 | Add notification preferences | `staff-app/src/features/settings/hooks/useNotificationPrefs.ts` | ST3 | executor |
| ST6 | Create AboutScreen | `staff-app/src/features/settings/screens/AboutScreen.tsx` | ST1 | designer |
| ST7 | Add logout confirmation | `staff-app/src/features/settings/components/LogoutConfirmation.tsx` | M8 | designer |
| ST8 | Test settings flow | - | ST7 | qa-tester |

**Parallel Execution:**
- ST1 can run parallel with ST2-ST4
- ST2, ST3, ST6 can run in parallel after ST1
- ST4 waits for M7
- ST5 can run in parallel after ST3
- ST7 can run in parallel after M8
- ST8 waits for ST7

---

### Phase 13: Polish & Testing

**Dependencies:** All previous phases

**Deliverable:** Production-ready app

| Task ID | Task | File(s) | Depends On | Agent |
|---------|------|---------|------------|-------|
| P1 | Add loading states to all screens | All screens | All phases | designer |
| P2 | Implement error boundaries | `staff-app/src/components/common/ErrorBoundary.tsx` | M2 | executor |
| P3 | Add empty states | All screens | P1 | designer |
| P4 | Optimize images with Fast Image | All images | M2 | executor |
| P5 | Test on iOS simulator | - | P4 | qa-tester |
| P6 | Test on Android emulator | - | P4 | qa-tester |
| P7 | Fix reported bugs | Various | P5, P6 | executor |
| P8 | Performance profiling | - | P7 | architect |
| P9 | Security review | - | P8 | security-reviewer |
| P10 | Write documentation | `staff-app/README.md` | P9 | writer |

---

## Parallel Execution Strategy

### Wave 1: Foundation (Can Run Simultaneously)

| Agent | Task(s) | Duration |
|-------|---------|----------|
| executor-low | M1, M2, M9 | 30 min |
| executor | B1, B2, B6 | 45 min |
| designer | M7 | 30 min |

### Wave 2: Core Infrastructure (After Wave 1)

| Agent | Task(s) | Duration |
|-------|---------|----------|
| executor | M3, M4 | 30 min |
| executor | M5, M6 | 30 min |
| executor | B3, B4, B5 | 45 min |
| designer | M8, M10 | 30 min |

### Wave 3: Authentication (After Wave 2)

| Agent | Task(s) | Duration |
|-------|---------|----------|
| designer | A1, A5, A6 | 45 min |
| executor | A2, A4 | 30 min |
| executor | A3, A7, A8 | 30 min |
| executor | B7 | 15 min |
| qa-tester | B8 | 30 min |

### Wave 4: Dashboard & Navigation (After Wave 3)

| Agent | Task(s) | Duration |
|-------|---------|----------|
| designer | D1, D2 | 30 min |
| executor | D3 | 30 min |
| designer | D4, D5, D6, D7 | 45 min |
| executor | D8 | 15 min |
| qa-tester | D10 | 30 min |

### Wave 5: Feature Modules (Parallel Across Agents)

| Agent | Task(s) | Duration |
|-------|---------|----------|
| designer | T1, T3, T6 | 45 min |
| executor | T2, T5, T7 | 30 min |
| designer | AT1, AT2, AT4, AT5 | 45 min |
| executor | AT3, AT6 | 30 min |
| designer | C1, C2, C6, C7 | 45 min |
| executor | C3, C5, C9 | 30 min |
| designer | L1, L2, L3, L7 | 45 min |
| executor | L9 | 15 min |
| designer | H1, H2, H5 | 45 min |
| executor | H8 | 30 min |
| designer | MR1, MR2, MR8, MR9 | 45 min |
| executor | MR7 | 30 min |
| designer | S1, S4, S6 | 30 min |
| executor | S3, S5 | 30 min |
| designer | ST1, ST2, ST3, ST6 | 30 min |
| executor | ST4 | 15 min |

---

## Risk Areas

### Risk 1: React Native Environment Setup
**Severity:** Medium
**Impact:** Can delay start of development

**Mitigation:**
- Use Expo for simplified setup (optional)
- Provide detailed setup instructions
- Use React Native 0.75+ with stable CLI

### Risk 2: Backend API Changes
**Severity:** Low
**Impact:** New APIs need to be created

**Mitigation:**
- Backend APIs are well-defined
- Can use existing patterns from routes
- Test with Postman before mobile integration

### Risk 3: Socket.IO Integration
**Severity:** Medium
**Impact:** Real-time features may have issues

**Mitigation:**
- Reuse existing socket handler patterns from web dashboard
- Test socket connection thoroughly
- Implement fallback polling if socket fails

### Risk 4: Biometric Authentication
**Severity:** Low
**Impact:** Nice-to-have feature

**Mitigation:**
- Make biometric auth optional
- Fall back to password/PIN
- Test on both iOS and Android

### Risk 5: Push Notifications (FCM)
**Severity:** Medium
**Impact:** Critical for real-time alerts

**Mitigation:**
- Implement in-app notifications as fallback
- Test FCM on both platforms
- Use react-native-push-notification library

### Risk 6: Performance with Large Class Lists
**Severity:** Medium
**Impact:** App may lag with 50+ students

**Mitigation:**
- Use FlatList with virtualization
- Implement pagination
- Cache student data locally

### Risk 7: Offline Support
**Severity:** Medium
**Impact:** Features may not work without internet

**Mitigation:**
- Implement proper error handling
- Cache essential data (timetable, student list)
- Show clear offline indicators

---

## File-by-File Creation Plan

### Root Level Files

| File | Purpose | Created By |
|------|---------|------------|
| `staff-app/package.json` | Dependencies and scripts | executor-low |
| `staff-app/tsconfig.json` | TypeScript config | executor-low |
| `staff-app/app.json` | Expo/React Native config | executor-low |
| `staff-app/.env` | Environment variables | executor-low |
| `staff-app/babel.config.js` | Babel config | executor-low |
| `staff-app/README.md` | Documentation | writer |

### Source Structure

```
staff-app/src/
├── App.tsx                          # Root component (executor-low)
├── theme/
│   ├── colors.ts                    # Color palette (designer)
│   ├── typography.ts                # Typography definitions (designer)
│   └── index.ts                     # Theme export (designer)
├── navigation/
│   ├── RootNavigator.tsx            # Main navigator (executor)
│   ├── AuthNavigator.tsx            # Auth flow (executor)
│   └── AppNavigator.tsx             # Tab/Drawer navigator (executor)
├── components/
│   ├── common/
│   │   ├── Button.tsx               # Reusable button (designer)
│   │   ├── Card.tsx                 # Reusable card (designer)
│   │   ├── Input.tsx                # Reusable input (designer)
│   │   ├── Avatar.tsx               # User avatar (designer)
│   │   ├── Loading.tsx              # Loading spinner (designer)
│   │   ├── ErrorState.tsx           # Error display (designer)
│   │   └── EmptyState.tsx           # Empty state (designer)
│   └── layout/
│       ├── Screen.tsx               # Screen wrapper (designer)
│       └── SafeArea.tsx             # Safe area wrapper (designer)
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   │   └── LoginScreen.tsx      # Login form (designer)
│   │   ├── services/
│   │   │   ├── authService.ts       # Auth API calls (executor)
│   │   │   └── biometricService.ts  # Biometric auth (executor)
│   │   └── hooks/
│   │       └── useAuth.ts           # Auth state hook (executor)
│   ├── dashboard/
│   │   ├── screens/
│   │   │   └── DashboardScreen.tsx  # Main dashboard (designer)
│   │   ├── components/
│   │   │   ├── StatCard.tsx         # Stat display (designer)
│   │   │   ├── TodayScheduleCard.tsx (designer)
│   │   │   ├── CurrentPeriodCard.tsx (designer)
│   │   │   └── ClassOverviewCard.tsx (designer)
│   │   └── hooks/
│   │       └── useDashboard.ts      # Dashboard data (executor)
│   ├── timetable/
│   │   ├── screens/
│   │   │   ├── TimetableScreen.tsx  # Weekly view (designer)
│   │   │   └── TodayScheduleScreen.tsx (designer)
│   │   ├── components/
│   │   │   ├── WeekView.tsx         # Week calendar (designer)
│   │   │   └── PeriodCard.tsx       # Period display (designer)
│   │   └── hooks/
│   │       └── useTimetable.ts      # Timetable data (executor)
│   ├── attendance/
│   │   ├── screens/
│   │   │   ├── AttendanceHomeScreen.tsx (designer)
│   │   │   ├── SelfAttendanceScreen.tsx (designer)
│   │   │   └── ClassAttendanceScreen.tsx (designer)
│   │   ├── components/
│   │   │   ├── StudentAttendanceGrid.tsx (designer)
│   │   │   ├── AttendanceStats.tsx  (designer)
│   │   │   └── AttendanceCalendar.tsx (designer)
│   │   └── services/
│   │       └── attendanceService.ts # Attendance API (executor)
│   ├── messaging/
│   │   ├── screens/
│   │   │   ├── ConversationsListScreen.tsx (designer)
│   │   │   └── ChatScreen.tsx       # Chat interface (designer)
│   │   ├── components/
│   │   │   ├── MessageBubble.tsx    # Message display (designer)
│   │   │   ├── TypingIndicator.tsx  # Typing status (designer)
│   │   │   └── AttachmentPreview.tsx (designer)
│   │   └── services/
│   │       └── chatService.ts       # Chat API (executor)
│   ├── leave/
│   │   ├── screens/
│   │   │   ├── LeaveHomeScreen.tsx  # Leave home (designer)
│   │   │   ├── ApplyLeaveScreen.tsx # Apply form (designer)
│   │   │   └── LeaveHistoryScreen.tsx (designer)
│   │   ├── components/
│   │   │   ├── LeaveBalanceCard.tsx (designer)
│   │   │   ├── DateRangePicker.tsx  (designer)
│   │   │   ├── LeaveTypeSelector.tsx (designer)
│   │   │   ├── DocumentUploader.tsx (executor)
│   │   │   └── LeaveStatusTracker.tsx (designer)
│   │   └── hooks/
│   │       └── useLeaveActions.ts    # Leave API (executor)
│   ├── homework/
│   │   ├── screens/
│   │   │   ├── HomeworkListScreen.tsx (designer)
│   │   │   ├── CreateHomeworkScreen.tsx (designer)
│   │   │   └── HomeworkDetailScreen.tsx (designer)
│   │   ├── components/
│   │   │   ├── SubjectPicker.tsx    (designer)
│   │   │   ├── HomeworkAttachments.tsx (executor)
│   │   │   ├── SubmissionsList.tsx  (designer)
│   │   │   └── GradingInterface.tsx (designer)
│   │   └── services/
│   │       └── homeworkService.ts    # Homework API (executor)
│   ├── marks/
│   │   ├── screens/
│   │   │   ├── ExamListScreen.tsx   (designer)
│   │   │   ├── CreateExamScreen.tsx (designer)
│   │   │   ├── EnterMarksScreen.tsx (designer)
│   │   │   └── MarksPreviewScreen.tsx (designer)
│   │   ├── components/
│   │   │   └── MarksGrid.tsx        (designer)
│   │   ├── utils/
│   │   │   └── marksValidation.ts   (executor)
│   │   └── services/
│   │       └── marksService.ts      # Marks API (executor)
│   ├── remarks/
│   │   ├── screens/
│   │   │   ├── RemarksListScreen.tsx (designer)
│   │   │   └── AddRemarkScreen.tsx  (designer)
│   │   └── services/
│   │       └── remarkService.ts     # Remarks API (executor)
│   ├── substitution/
│   │   ├── screens/
│   │   │   └── SubstitutionsScreen.tsx (designer)
│   │   ├── components/
│   │   │   └── SubstitutionCard.tsx (designer)
│   │   └── hooks/
│   │       └── useSubstitutionActions.ts (executor)
│   ├── gatepass/
│   │   ├── screens/
│   │   │   └── GatePassListScreen.tsx (designer)
│   │   └── hooks/
│   │       └── useGatePassActions.ts (executor)
│   ├── appointments/
│   │   └── screens/
│   │       └── AppointmentListScreen.tsx (designer)
│   └── settings/
│       ├── screens/
│       │   ├── SettingsScreen.tsx   (designer)
│       │   ├── ProfileEditScreen.tsx (designer)
│       │   ├── NotificationSettingsScreen.tsx (designer)
│       │   └── AboutScreen.tsx      (designer)
│       ├── components/
│       │   └── LogoutConfirmation.tsx (designer)
│       └── hooks/
│           ├── useTheme.ts          (executor)
│           └── useNotificationPrefs.ts (executor)
├── stores/
│   ├── authStore.ts                 # Auth state (executor)
│   ├── appStore.ts                  # App state (executor)
│   └── chatStore.ts                 # Chat state (executor)
├── services/
│   ├── api/
│   │   └── client.ts                # Axios client (executor)
│   ├── storage/
│   │   ├── secureStorage.ts         # Keychain (executor)
│   │   └── cacheStorage.ts          # MMKV (executor)
│   ├── socket/
│   │   └── socketService.ts         # Socket.IO (executor)
│   ├── cache/
│   │   └── timetableCache.ts        # Timetable cache (executor)
│   └── notifications/
│       ├── pushNotification.ts      # FCM (executor)
│       └── notificationHandler.ts   # Notification tap (executor)
├── types/
│   ├── api.ts                       # API types (executor)
│   ├── models.ts                    # Data models (executor)
│   └── navigation.ts                # Nav types (executor)
├── utils/
│   ├── validation.ts                # Zod schemas (executor)
│   ├── date.ts                      # Date helpers (executor)
│   └── constants.ts                 # Constants (executor)
└── config/
    └── env.ts                       # Env config (executor)
```

### Backend New Files

| File | Purpose | Created By |
|------|---------|------------|
| `backend/models/Leave.js` | Leave schema | executor |
| `backend/models/Homework.js` | Homework schema | executor |
| `backend/routes/leave.js` | Leave endpoints | executor |
| `backend/routes/homework.js` | Homework endpoints | executor |
| `backend/routes/teacherDashboard.js` | Dashboard endpoint | executor |

---

## Success Criteria

The project is complete when ALL of the following are met:

### Backend (Must Complete)
- [ ] Leave model and routes created and tested
- [ ] Homework model and routes created and tested
- [ ] Teacher Dashboard endpoint working
- [ ] Staff schema updated with leaveBalance and fcmTokens
- [ ] All new routes mounted in server.js
- [ ] API tested with Postman/Thunder Client

### Authentication (Must Complete)
- [ ] Teachers can login with email/phone + password
- [ ] JWT token stored securely
- [ ] Auto-login on app restart
- [ ] Logout functionality working
- [ ] Biometric authentication (optional)

### Core Features (Must Complete)
- [ ] Dashboard displays today's schedule
- [ ] Current period shown
- [ ] Timetable viewable (weekly and daily)
- [ ] Self attendance markable
- [ ] Class attendance markable (for class teachers)
- [ ] Conversations list displays
- [ ] Chat messages sendable and receivable

### Secondary Features (Should Complete)
- [ ] Leave applications submittable
- [ ] Leave balance viewable
- [ ] Leave history viewable
- [ ] Homework creatable
- [ ] Homework submissions viewable
- [ ] Marks enterable
- [ ] Remarks addable
- [ ] Substitutions viewable
- [ ] Gate passes approvable
- [ ] Appointments viewable

### Polish (Nice to Have)
- [ ] All screens have loading states
- [ ] Error boundaries implemented
- [ ] Empty states for all lists
- [ ] Dark mode toggle
- [ ] Notification preferences configurable
- [ ] Push notifications working
- [ ] Offline support for timetable
- [ ] App tested on iOS simulator
- [ ] App tested on Android emulator

### Quality Gates
- [ ] No TypeScript errors
- [ ] ESLint passing (if configured)
- [ ] All critical user flows tested manually
- [ ] Security review passed
- [ ] Performance acceptable (60fps animations, fast loads)

---

## Execution Command

To begin implementation, run:

```bash
/oh-my-claudecode:start-work staff-app
```

This will load this plan and execute tasks in optimal parallel order using multiple specialized agents.

---

**END OF IMPLEMENTATION PLAN**
