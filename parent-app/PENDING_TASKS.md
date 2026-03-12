# Parent App — Pending Tasks

Tracked remaining issues from the full audit. All items below were identified but not yet implemented.

---

## High Priority

### 1. Theme Consolidation
- **Issue:** Two competing theme files exist — `src/styles/theme.js` and `src/theme/index.js`
- **Fix:** Pick one as the source of truth, migrate all imports, delete the other
- **Files:** `src/styles/theme.js`, `src/theme/index.js`, all files importing either

### 2. Add `updateProfile` API Method
- **Issue:** `EditProfileScreen` calls `api.put('/api/parent/profile', ...)` directly with a hardcoded path
- **Fix:** Add a `updateProfile(data)` method to `ApiService` in `src/services/api.js` and add the endpoint to `CONFIG.API_ENDPOINTS`
- **Files:** `src/services/api.js`, `src/config/index.js`, `src/screens/EditProfileScreen.jsx`

### 3. Refresh Token Migration Cleanup
- **Issue:** `getRefreshToken()` falls back to AsyncStorage for migration, but old AsyncStorage entries are never deleted after a successful SecureStore read
- **Fix:** After reading from AsyncStorage as fallback, delete the AsyncStorage key so the migration completes
- **Files:** `src/services/api.js`

### 4. AuthContext — Sync User After Profile Edit
- **Issue:** After `EditProfileScreen` saves changes, the in-memory `user` state in `AuthContext` and AsyncStorage are stale until next login
- **Fix:** After a successful `PUT /api/parent/profile`, re-fetch the profile (`api.getProfile()`) and update `user` state + AsyncStorage in `AuthContext`. Expose an `updateUser()` method from `AuthContext`.
- **Files:** `src/context/AuthContext.js`, `src/screens/EditProfileScreen.jsx`

### 5. ChatContext — `loadMoreMessages` Pagination UI
- **Issue:** `loadMoreMessages` and `messagesLoading` are exposed in context but no UI in `ChatDetailScreen` triggers loading older messages
- **Fix:** Add an `onEndReached` / scroll-to-top handler in `ChatDetailScreen` to call `loadMoreMessages()`; show a loading indicator at top while fetching
- **Files:** `src/screens/ChatDetailScreen.jsx`

---

## Medium Priority

### 6. Add `errors` to Fees, Results, Remarks, and Timetable Screens
- **Issue:** `StudentContext` now exposes `errors.attendance` and `errors.exams`, but `fetchFees`, `fetchResults`, `fetchRemarks`, and `fetchTimetable` still swallow errors silently
- **Fix:** Add `setErrors` calls in each remaining fetch function; surface `errors.fees`, `errors.results`, `errors.remarks` in their respective screens (`FeesScreen`, `ExamsScreen` results tab, `RemarksScreen`, `TimetableScreen`)
- **Files:** `src/context/StudentContext.js`, `src/screens/FeesScreen.jsx`, `src/screens/ExamsScreen.jsx`, `src/screens/RemarksScreen.jsx`, `src/screens/TimetableScreen.jsx`

### 7. Announcements — Add to Tab or Home Navigation Entry Point
- **Issue:** `AnnouncementsScreen` is registered in the navigator but there's no visible entry point (no tab, no home card link)
- **Fix:** Either add an Announcements tab to `TabNavigator`, or add an "Announcements" card/button to `HomeScreen` that navigates to it
- **Files:** `src/navigation/TabNavigator.jsx` or `src/screens/HomeScreen.jsx`

### 8. Home Screen — Announcement Badge / Preview
- **Issue:** Home screen has no indication of new/unread announcements
- **Fix:** Fetch announcements count on home screen mount; show a badge or a preview card with the latest announcement
- **Files:** `src/screens/HomeScreen.jsx`

### 9. Standardize JSX File Extensions
- **Issue:** Several component files use `.js` extension despite containing JSX (e.g. `AuthContext.js`, `StudentContext.js`, `ChatContext.js`)
- **Fix:** Rename to `.jsx` for consistency, or keep `.js` but ensure the project eslint/babel config handles JSX in `.js` files consistently. Low risk — Metro bundler handles both.
- **Files:** `src/context/*.js`

### 10. Unused Component Files
- **Issue:** The following files exist in `src/components/` but are not exported from `src/components/index.js` and are unused:
  - `AcademicOverview.jsx`
  - `AttendanceCard.jsx`
  - `GradeCard.jsx`
  - `Header.jsx`
  - `BottomSheet.jsx`
  - `StudentDetailSheet.jsx`
  - `StudentCard.jsx`
  - `ScheduleCard.jsx`
- **Fix:** Either export and integrate them where appropriate, or delete them to reduce dead code
- **Files:** `src/components/`

---

## Low Priority

### 11. `NotificationSettingsScreen` — Push Notification Integration
- **Issue:** Toggling notification settings only persists to AsyncStorage locally; no backend sync and no actual push notification registration/deregistration
- **Fix:** On toggle, call a backend endpoint (e.g. `PATCH /api/parent/notifications/settings`) to sync preferences; integrate with Expo's `expo-notifications` for actual push permission management
- **Files:** `src/screens/NotificationSettingsScreen.jsx`, `src/services/api.js`

### 12. `PaymentScreen` — Razorpay / Payment Gateway Integration
- **Issue:** Payment flow creates an order but the actual checkout UI (Razorpay RN SDK or WebView) is not integrated
- **Fix:** Install `react-native-razorpay` (or use a WebView for the checkout), open checkout on order creation success, then call verify on payment success
- **Files:** `src/screens/PaymentScreen.jsx`

### 13. Offline / Network State Handling
- **Issue:** No global network state detection; API failures surface as generic error messages
- **Fix:** Use `@react-native-community/netinfo` to detect offline state and show a banner; disable fetch retries when offline
- **Files:** `App.js` or a new `src/components/NetworkBanner.jsx`

### 14. Token Expiry — Silent Refresh Edge Case
- **Issue:** If both the access token AND refresh token are expired, the app silently fails with network errors instead of redirecting to login
- **Fix:** In `ApiService.refreshAccessToken()`, when the refresh itself returns 401/403, call `AuthContext.logout()` programmatically
- **Files:** `src/services/api.js`, `src/context/AuthContext.js`

### 15. `ExamDetailScreen` — Subject List Missing When `subjects` Array Absent
- **Issue:** If `exam.subjects` is undefined or empty, the "Subject Schedule" section renders nothing with no feedback
- **Fix:** Add an empty state message ("No subject schedule available") when `exam.subjects` is empty
- **Files:** `src/screens/ExamDetailScreen.jsx`

---

## Completed (Reference)

| Task | File(s) |
|------|---------|
| Fix `DELETE` method REST compliance | `api.js` |
| SecureStore for refresh token | `api.js`, `AuthContext.js` |
| SocketService `reset()` on logout | `socketService.js`, `AuthContext.js` |
| Fix stale closure in ChatContext socket handlers | `ChatContext.js` |
| Auto-fetch conversations on mount | `ChatContext.js` |
| Message pagination (`loadMoreMessages`) | `ChatContext.js` |
| Optimistic message send (pending/failed states) | `ChatContext.js` |
| Auto-fetch student data on mount | `StudentContext.js` |
| Fetch guard (prevent duplicate concurrent calls) | `StudentContext.js` |
| Login form validation + Forgot Password handler | `LoginScreen.jsx` |
| `getGradeColor` deduplicated to shared helper | `ResultDetailScreen.jsx` |
| Exam subject null-checks | `ExamDetailScreen.jsx` |
| Android BackHandler in ChatDetail | `ChatDetailScreen.jsx` |
| Auto-scroll only on new messages (not pagination) | `ChatDetailScreen.jsx` |
| ProfileScreen navigation wired up | `ProfileScreen.jsx` |
| Custom amount clamping in PaymentScreen | `PaymentScreen.jsx` |
| `RemarksScreen` created | `RemarksScreen.jsx` |
| `AnnouncementsScreen` created | `AnnouncementsScreen.jsx` |
| `NotificationSettingsScreen` created | `NotificationSettingsScreen.jsx` |
| `EditProfileScreen` created | `EditProfileScreen.jsx` |
| All new screens registered in navigator | `AppNavigator.jsx` |
| `errors` state in StudentContext for attendance + exams | `StudentContext.js` |
| Error state UI in AttendanceScreen | `AttendanceScreen.jsx` |
| Error state UI in ExamsScreen | `ExamsScreen.jsx` |
