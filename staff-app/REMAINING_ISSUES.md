# Staff App — Remaining Issues

> Issues identified during audit that were **not yet implemented**.
> Implemented fixes (ErrorBoundary, NetInfo, 401 auto-logout, marks validation, chat delete, email validation, password policy, rate limiting, sanitization) are excluded.

---

## 🔴 High Priority

### 1. Token Stored in Cleartext (AsyncStorage)
**File:** `src/services/api.js`, `src/context/AuthContext.js`
**Issue:** JWT token is stored in `AsyncStorage`, which is unencrypted and readable on rooted/jailbroken devices.
**Fix:** Migrate to `expo-secure-store` (already installed) for token storage.
```js
// Replace AsyncStorage.setItem(AUTH_TOKEN_KEY, token)
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('staff_token', token);
```

---

### 2. `GET /staff/public` — Information Disclosure
**File:** `EMS-backend/routes/staff.js:193`
**Issue:** Returns all active staff names, roles, and departments with no authentication. Any unauthenticated user can enumerate all staff.
**Fix:** Scope to the current school (requires school identifier in query param or subdomain), or limit fields returned (name only, no role/department).

---

### 3. No Pagination on API Responses
**Files:** `src/services/api.js` — all list endpoints
**Issue:** `getStaffClasses`, `fetchExams`, `getAttendanceHistory`, `getStaffPayslips` fetch entire collections. Will degrade with large datasets.
**Fix:** Add `?page=1&limit=20` params to all list API calls and implement infinite-scroll / "load more" in `FlatList` screens.

---

### 4. Socket.io Connected but Real-Time Updates Not Wired
**Files:** `src/services/socketService.js`, `src/context/ChatContext.js`
**Issue:** `socketService` is fully implemented but is never connected outside of chat. Attendance changes, exam publishes, and notifications are not pushed in real time.
**Fix:** Connect socket on login (in `AuthContext`), and subscribe to events:
- `exam_published` → refresh `ExamContext`
- `attendance_updated` → refresh `ClassContext`
- `notification` → update `NotificationsScreen`

---

### 5. NotificationsScreen — No API Integration
**File:** `src/screens/NotificationsScreen.jsx`
**Issue:** The screen renders but never fetches notifications from the backend. `unreadCount` in the tab badge is driven by chat only, not by general notifications.
**Fix:** Connect to a notifications endpoint (e.g. `/notifications?userId=...`), display results, and mark as read on open.

---

### 6. No Manual Sync UI for Offline Queue
**Files:** `src/context/ClassContext.js`, `src/screens/classes/AttendanceScreen.jsx`
**Issue:** The offline banner shows "N records pending sync" but there is no button to manually trigger a sync. Users don't know how old the cached data is.
**Fix:** Add a "Sync Now" button in the offline banner. Show the oldest `queuedAt` timestamp so the user knows how stale the data is.

---

## 🟠 Medium Priority

### 7. Console Logs Expose Sensitive Data
**Files:** `src/services/api.js`, `src/context/AuthContext.js`, multiple screens
**Issue:** `console.log('API Response data:', data)` and `console.log('Login response:', userData)` print tokens and user credentials to the debug console.
**Fix:** Either remove all production `console.log` calls or gate them behind `if (__DEV__)`. Consider a proper logging library (e.g. `react-native-logs`).

---

### 8. Leave Application — Leave Types Mismatch
**Files:** `src/screens/LeaveRequestsScreen.jsx:9-14`, `EMS-backend/routes/staffAttendance.js`
**Issue:** Frontend `LEAVE_TYPES` array has `['sick', 'casual', 'earned', 'unpaid']` but the mobile leave endpoint accepts `leaveType` without validating against a fixed enum. If values diverge, records are silently saved with invalid types.
**Fix:** Export a shared `LEAVE_TYPES` constant from the backend (or document the accepted values) and validate `leaveType` in the `/mobile/leave/apply` route.

---

### 9. FlatList Missing `getItemLayout` / Windowing Config
**Files:** `src/screens/HomeScreen.jsx`, `src/screens/exams/ResultsEntryScreen.jsx`, `src/screens/classes/ClassStudentsScreen.jsx`
**Issue:** Large lists (100+ students/results) have no `getItemLayout`, `initialNumToRender`, or `maxToRenderPerBatch` props set. This causes jank on low-end Android devices.
**Fix:**
```jsx
<FlatList
  initialNumToRender={15}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  // getItemLayout if row height is fixed
/>
```

---

### 10. No Timetable Conflict Detection
**File:** `EMS-backend/routes/` (timetable/class creation)
**Issue:** There is no check to prevent scheduling a staff member in two different classes at the same time slot. Overlapping timetable entries can be saved silently.
**Fix:** Before creating/updating a timetable entry, query for existing entries for the same `staffId`, `day`, and overlapping `timeSlot`.

---

### 11. `parseInt()` in ExamContext `saveResults` — Data Coercion
**File:** `src/context/ExamContext.js:saveResults`
**Issue:** `saveResults` maps `marksObtained` directly from `resultEntries`, but if a user clears the input the value is `''` (empty string). This gets sent to the API as `0` without warning.
**Fix:** Normalise before sending:
```js
marksObtained: resultEntries[student.id]?.marksObtained === ''
  ? 0
  : Number(resultEntries[student.id]?.marksObtained ?? 0),
```

---

### 12. `photo` / `picture` Field Duplication in Staff Model
**File:** `EMS-backend/` — Staff model + `formatStaffResponse`
**Issue:** The Staff model has both a `photo` and a `picture` field. `formatStaffResponse` copies the value to both. This doubles storage and causes confusion about which field is authoritative.
**Fix:** Standardise on one field (e.g. `photo`), add a Mongoose alias or virtual for backwards compatibility, and remove the duplication from `formatStaffResponse`.

---

### 13. Attendance Cache Shows No Age / Staleness
**Files:** `src/context/ClassContext.js`, `src/services/attendanceStorage.js`
**Issue:** When the app falls back to cached class data, the UI says "Using cached data" but doesn't tell the user how old it is (`cachedAt` is stored but never surfaced).
**Fix:** Show the `cachedAt` timestamp in the banner, e.g. "Using cached data from 3 hours ago".

---

## 🟡 Low Priority / Technical Debt

### 14. No API Versioning
**File:** `EMS-backend/` — all routes registered at `/api/...`
**Issue:** Any breaking API change will immediately break all connected clients (web dashboard + staff app). There is no versioning strategy.
**Fix:** Prefix all routes with `/api/v1/...` and update the `API_URL` in the frontend config accordingly.

---

### 15. No Test Coverage
**Scope:** Entire `staff-app` and most `EMS-backend` routes
**Issue:** Zero unit, integration, or e2e tests found. Regressions from future changes cannot be caught automatically.
**Recommended starting points:**
- Unit test `ExamContext.saveResults` and `ClassContext.syncOfflineAttendance`
- Integration test the auth flow (`POST /auth/login → GET /staff/me`)
- Component test `ResultsEntryScreen` marks validation logic

---

### 16. `StaffAttendance` Model Handles Too Many Concerns
**File:** `EMS-backend/models/StaffAttendance.js`
**Issue:** A single model handles admin-side attendance marking, mobile check-in/check-out, and leave applications. The `leaveApplication` embedded object makes queries and indexes complex and error-prone.
**Fix (long-term):** Separate into:
- `StaffAttendance` — daily present/absent/late records
- `StaffLeave` — leave applications with approval workflow

---

### 17. Attendance Export (CSV / PDF) Missing
**Issue:** There is no way for a staff member to export their own attendance history or for an admin to export class attendance. This is a commonly requested feature.
**Fix:** Add an export button to `AttendanceHistoryScreen` that calls a backend route returning CSV, or generates a PDF client-side using `expo-print`.

---

### 18. Exam / Class Reminders Missing
**Issue:** No push notification or in-app reminder is sent before an upcoming exam or class. `examsApi.getUpcoming` exists on the API but is never called.
**Fix:** Call `getUpcoming` on app foreground resume and schedule a local notification via `expo-notifications` for exams within the next 24 hours.

---

### 19. No Notification Preferences / Do-Not-Disturb
**Issue:** Users cannot control which notifications they receive or set quiet hours. All socket events trigger immediately.
**Fix:** Add a "Notification Settings" section in `ProfileScreen` to toggle categories (chat, exams, attendance, leaves).

---

### 20. Conversation Search in Chat Missing
**File:** `src/screens/ChatScreen.jsx`
**Issue:** The search bar filters the conversation list by name but there is no way to search inside message history for a keyword.
**Fix:** Add a "Search in conversation" option in `ChatDetailScreen` that queries `/messages/conversations/:id/messages?search=...`.

---

## Summary

| Priority | Count |
|----------|-------|
| 🔴 High  | 6     |
| 🟠 Medium | 7     |
| 🟡 Low / Tech Debt | 7 |
| **Total** | **20** |
