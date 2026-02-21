# Parent Mobile App - Implementation Plan (REVISED)

**Project:** React Native mobile app for parents to view children's school data and message teachers
**Platform:** iOS + Android via Expo
**Generated:** 2025-02-02
**Revised:** 2025-02-02 (Addressed Critic concerns)
**Based on Specification:** `.omc/autopilot/spec.md`

---

## Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup) **NEW**
2. [Context](#context)
3. [Work Objectives](#work-objectives)
4. [Must Have / Must NOT Have](#must-have--must-not-have)
5. [Critical Path Analysis](#critical-path-analysis)
6. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
7. [Testing Approach](#testing-approach) **NEW**
8. [Risk Mitigation](#risk-mitigation)
9. [Success Criteria](#success-criteria)

---

## Prerequisites & Setup

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable | Purpose | Example Value | How to Obtain |
|----------|---------|---------------|---------------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001/api` (dev) or `https://api.example.com/api` (prod) | Your backend server URL |
| `EXPO_PUBLIC_SOCKET_URL` | Socket.IO server URL | `http://localhost:3001` (dev) or `https://api.example.com` (prod) | Same as API URL but **WITHOUT `/api` suffix** |
| `EXPO_PUBLIC_FCM_PROJECT_ID` | Firebase Cloud Messaging project ID | `your-project-id` | From Firebase Console → Project Settings → General |
| `EXPO_PUBLIC_APP_ENV` | Environment identifier | `development` or `production` | Set based on build environment |

**Important Notes:**
- `SOCKET_URL` is derived from `API_URL` by removing the `/api` suffix
- For development, use `http://localhost:3001/api` for API and `http://localhost:3001` for Socket
- For production, use HTTPS URLs with your domain

### Firebase Setup Checklist

**Before starting Phase 2, complete these steps:**

1. **Create Firebase Project**
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Click "Add project" and follow setup wizard
   - Enable Google Analytics (optional but recommended)

2. **Enable Authentication**
   - Navigate to Authentication → Sign-in method
   - Enable "Phone" provider
   - Add test phone numbers for development (avoids SMS quotas)
   - Note: Format with `+` prefix, e.g., `+15551234567`

3. **Enable Cloud Messaging**
   - Navigate to Project Settings → Cloud Messaging
   - Note your Server Key and Sender ID
   - This is required for push notifications

4. **Add Android App**
   - Project Settings → General → Your apps → Add Android app
   - Package name: `com.yourschool.parentapp` (example)
   - Download `google-services.json`
   - Place in `android/app/` directory

5. **Add iOS App**
   - Project Settings → General → Your apps → Add iOS app
   - Bundle ID: `com.yourschool.parentapp` (example)
   - Download `GoogleService-Info.plist`
   - Place in `ios/` directory

6. **Configure Test Numbers (Development)**
   - Authentication → Sign-in method → Phone → Phone numbers for testing
   - Add test phone numbers (e.g., `+15550000001`)
   - Set test code (e.g., `123456`)
   - This bypasses actual SMS during development

---

## Context

### Original Request

Create a React Native mobile application for parents that:
- Allows viewing children's school data (attendance, results, fees, timetable)
- Enables bidirectional messaging with teachers/staff
- Uses Firebase Phone Auth for authentication
- Receives push notifications via FCM
- Works offline with caching

### Existing Infrastructure (Codebase Analysis)

**Backend APIs (Already Implemented):**
- `/api/parent/auth/*` - Firebase Phone Auth + JWT flow (`parentAuth.js`)
- `/api/parent/children` - Children list with details (`parentData.js`)
- `/api/parent/students/:id/*` - Student details, attendance, fees, results (`parentData.js`)
- `/api/parent/messages/*` - Conversations, send/receive messages (`parentMessaging.js`)
- `/api/parent/fcm-token` - FCM token registration (`parentData.js`)
- `/api/parent/announcements` - School announcements (`parentData.js`)

**Socket.IO Infrastructure:**
- Existing socket service in `school-dashboard/src/services/socketService.js`
- Supports: `new_message`, `message_notification`, `user_typing`, `message_read`
- Auto-reconnection with room rejoining

**Authentication Flow:**
- Firebase Phone Auth OTP verification
- JWT access tokens (15min expiry) + refresh tokens (30 days)
- Parent-children relationship validation
- Token refresh endpoint ready

**Data Models:**
```javascript
Parent: {
  phone, firebaseUid, name, email, avatar,
  children: [{ studentId, relationship, isPrimary }],
  fcmTokens: [{ token, deviceInfo, createdAt }],
  preferences: { language, notifications }
}
```

### Technical Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | Expo ~52.0, React Native 0.76.1 | Fastest dev cycle, OTA updates |
| Navigation | React Navigation 7.0 | **Chosen over expo-router** - More mature, better for tab-based apps |
| State | Zustand 5.0 | Lightweight, TypeScript-first |
| HTTP | Axios 1.7 | Interceptors, retry logic |
| WebSocket | socket.io-client 4.8 | Matches backend |
| Storage | MMKV 1.2 | Encrypted, cross-platform |
| UI | React Native Paper 5.12 | Material Design, accessible |
| Forms | react-hook-form 7.53 | Performance, validation |
| Firebase | @react-native-firebase/* | Phone Auth + FCM |
| Date | date-fns 4.1 | Lightweight, tree-shakeable |

---

## Work Objectives

### Core Objective

Build a production-ready React Native mobile app that enables parents to:
1. Authenticate securely using phone number + OTP
2. View all their children's school data (read-only)
3. Message teachers and staff in real-time
4. Receive push notifications for important updates
5. Function offline with queued operations

### Deliverables

1. **parent-app/** - Complete React Native Expo project
2. **API Integration Layer** - Reusable API client with auth
3. **Authentication Flow** - Firebase Phone Auth + JWT handling
4. **Dashboard Screens** - Home, children list, child profiles
5. **Detail Screens** - Attendance, results, fees, timetable
6. **Messaging Module** - Conversations, chat UI, Socket.IO integration
7. **Push Notifications** - FCM setup, handling, deep linking
8. **Offline Support** - Caching, queued messages, sync indicators

### Definition of Done

- [ ] All 7 phases completed
- [ ] Authentication flow works end-to-end (Firebase + JWT)
- [ ] Can view all children data from backend
- [ ] Can send/receive messages in real-time
- [ ] Push notifications received and actionable
- [ ] Works offline (cached data, queued messages)
- [ ] TypeScript with no `any` types
- [ ] Builds for iOS (TestFlight) and Android (APK)
- [ ] Core user flows tested on physical devices

---

## Must Have / Must NOT Have

### Must Have (Guardrails)

| Feature | Description |
|---------|-------------|
| Firebase Phone Auth | OTP-based login, no passwords |
| JWT Token Management | Auto-refresh before expiry |
| API Response Wrapper | **All API responses use `{success, data, error}` structure** |
| View-Only Children Data | No editing capabilities |
| Socket.IO Messaging | Real-time send/receive, **Socket URL = API URL without /api** |
| FCM Push Notifications | **6 types**: message, announcement, reminder, attendance_alert, fee_due, result_published |
| MMKV Secure Storage | Encrypted token storage |
| Offline Caching | View last-known data when offline, **message queue max 50 items** |
| TypeScript | Strict mode, no `any`, **ApiResponse<T> wrapper for all API calls** |
| Deep Linking | Open chat from notification |
| React Navigation 7.0 | **NOT expo-router** - use React Navigation for tab-based navigation |

### Must NOT Have (Out of Scope)

| Feature | Reason |
|---------|--------|
| Fee Payments | View-only access required |
| Voice/Video Calls | Complexity, requires Phase 2 |
| Group Chats | Direct parent-teacher only |
| File Uploads | Phase 2 feature |
| Multi-language | English only initially |
| Custom Branding | Single white-label app |
| Biometric Auth | Phase 2 enhancement |
| Dark Mode | Phase 2 enhancement |

---

## Critical Path Analysis

### Critical Path (Sequential Dependencies)

```
Phase 1: Foundation
       |
       v
Phase 2: Authentication
       |
       +----> Phase 3: Dashboard & Children
       |              |
       |              v
       |         Phase 4: Messaging
       |              |
       +----> Phase 5: Push Notifications
                      |
                      v
                 Phase 6: Polish & Testing
                      |
                      v
                 Phase 7: Deployment
```

### Parallel Tracks

| Track | Tasks | Can Run Parallel With |
|-------|-------|----------------------|
| **UI Components** | Buttons, Cards, Avatars | Phase 1 Foundation |
| **Type Definitions** | All TypeScript types | Phase 1 Foundation |
| **Store Modules** | authStore, childrenStore, chatStore | Phase 1 Foundation |
| **Screens (Auth)** | Login, OTP | Phase 2 Authentication |
| **Screens (Dashboard)** | Home, Children List | Phase 3 Dashboard |
| **Detail Screens** | Attendance, Results, Fees | Phase 3 Dashboard (parallel) |
| **Messaging UI** | Conversations, Chat | Phase 4 Messaging |
| **Notification Service** | FCM setup | Phase 5 Push Notifications |

### Integration Points

| Point | Components | Risk |
|-------|------------|------|
| **Auth to API** | authStore + api client | Token race conditions |
| **Socket to Chat** | socketService + chatStore | Reconnection handling |
| **FCM to Navigation** | notificationService + navigators | Deep link failures |
| **Offline to Sync** | cache layer + API queue | Stale data conflicts |

---

## Phase-by-Phase Implementation

## Phase 1: Foundation

**Objective:** Set up project structure, core infrastructure, and base components.

**Estimated Time:** 2-3 days
**Complexity:** MEDIUM

### 1.1 Project Initialization

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Initialize Expo | `package.json`, `app.json` | `npx create-expo-app@latest parent-app --template blank-typescript` | None |
| Configure EAS | `eas.json` | Build configuration for iOS/Android | package.json |
| Environment Config | `.env`, `src/config/env.ts` | API URL, Firebase config, Socket URL | None |
| TypeScript Config | `tsconfig.json` | Strict mode, path aliases | None |
| Babel Config | `babel.config.js` | Module resolver, plugins | None |

**Acceptance Criteria:**
- `npx expo start` runs without errors
- TypeScript compilation succeeds
- Environment variables accessible via `process.env.EXPO_PUBLIC_*`

### 1.2 Folder Structure & Core Files

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Create directories | `src/{api,hooks,store,screens,components,navigation,services,storage,utils,types,config}` | As per spec structure | None |
| Entry point | `App.tsx` | Root component with providers | Directories |
| Safe Area Provider | `src/components/common/SafeArea.tsx` | Wrapper for iOS notches | None |
| Loading Screen | `src/components/common/LoadingScreen.tsx` | Spinner with full-screen overlay | None |
| Error Boundary | `src/components/common/ErrorBoundary.tsx` | Catch and display errors | None |

**Acceptance Criteria:**
- All folders created
- App renders LoadingScreen without errors

### 1.3 Type Definitions

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Auth Types | `src/types/auth.ts` | Parent, AuthState, LoginRequest, TokenResponse | None |
| Parent Types | `src/types/parent.ts` | Child, ChildRelationship, ParentProfile | auth.ts |
| Student Types | `src/types/student.ts` | Student, Attendance, Fee, Result, Timetable | parent.ts |
| Message Types | `src/types/message.ts` | Message, Conversation, SendMessageData | None |
| API Types | `src/types/api.ts` | ApiResponse, ApiError, Pagination | None |
| Navigation Types | `src/types/navigation.ts` | RootStackParamList, AuthStackParamList, AppStackParamList | None |

**Acceptance Criteria:**
- All types exported
- No `any` types used
- Types match backend response structures

### 1.4 API Client Layer

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Axios Instance | `src/api/client.ts` | Base client, interceptors, timeout, retry | types/api.ts |
| Token Manager | `src/storage/secureStorage.ts` | MMKV wrapper, token CRUD | None |
| Storage Keys | `src/storage/storageKeys.ts` | Key constants (ACCESS_TOKEN, REFRESH_TOKEN, etc.) | None |
| Auth API | `src/api/auth.ts` | sendOtp, verifyOtp, refreshToken, logout | client.ts, secureStorage.ts |
| Parent API | `src/api/parent.ts` | profile, children, student details, FCM token | client.ts |
| Messaging API | `src/api/messaging.ts` | conversations, messages, send, markRead | client.ts |

**Acceptance Criteria:**
- API client configured with baseURL from env
- Request interceptor adds Authorization header
- Response interceptor handles 401 with token refresh
- All endpoints typed with TypeScript

**Parallel Opportunities:**
- All API files can be created simultaneously
- secureStorage.ts can be built in parallel with client.ts

### 1.5 State Management (Zustand)

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Auth Store | `src/store/authStore.ts` | user, tokens, loading, login/logout actions | types/auth.ts, api/auth.ts |
| Children Store | `src/store/childrenStore.ts` | children list, selected child, fetch actions | types/parent.ts, api/parent.ts |
| Chat Store | `src/store/chatStore.ts` | conversations, messages, typing indicators | types/message.ts, api/messaging.ts |
| Notification Store | `src/store/notificationStore.ts` | notifications list, unread count, permissions | None |
| Store Index | `src/store/index.ts` | Export all stores | All store files |

**Acceptance Criteria:**
- All stores persist to MMKV
- Auth store initializes from storage on app load
- Stores are TypeScript-typed

**Parallel Opportunities:**
- All store files can be built simultaneously after types are done

### 1.6 Navigation Setup

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Navigation Ref | `src/navigation/navigationRef.ts` | Global navigator reference | None |
| Auth Navigator | `src/navigation/AuthNavigator.tsx` | Login -> OTP flow | types/navigation.ts |
| App Navigator | `src/navigation/AppNavigator.tsx` | Tab navigator (Home, Messages, Profile) | types/navigation.ts |
| Root Navigator | `src/navigation/RootNavigator.tsx` | Auth vs App switch, auth state listener | AuthNavigator, AppNavigator, authStore |

**Acceptance Criteria:**
- Unauthenticated users see Login screen
- Authenticated users see App tabs
- Screen navigation type-safe

### 1.7 Base UI Components

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Button | `src/components/common/Button.tsx` | Primary, secondary, ghost variants | None |
| Card | `src/components/common/Card.tsx` | Elevation, padding, children | None |
| Avatar | `src/components/common/Avatar.tsx` | Image fallback, size variants | None |
| Input | `src/components/common/Input.tsx` | Text input with error, label | None |
| StatusBar | `src/components/common/StatusBar.tsx` | Styled status bar (light/dark) | None |
| Empty State | `src/components/common/EmptyState.tsx` | Illustration + message + action | None |
| Loading Overlay | `src/components/common/LoadingOverlay.tsx` | Full-screen loading | LoadingScreen |

**Acceptance Criteria:**
- All components TypeScript-typed
- Components accept React Native Paper theming
- Storybook or demo screen for each component

**Parallel Opportunities:**
- All UI components can be built simultaneously

---

## Phase 2: Authentication

**Objective:** Implement Firebase Phone Auth + JWT flow with secure token storage.

**Estimated Time:** 3-4 days
**Complexity:** HIGH

### 2.1 Firebase Configuration

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Firebase Setup | `firebase.json`, `GoogleService-Info.plist`, `google-services.json` | Firebase project config | None |
| Firebase App | `src/services/firebaseService.ts` | Initialize Firebase, Phone Auth | @react-native-firebase/app, auth |
| Auth Context | `src/contexts/AuthContext.tsx` | Provider wrapping app, auth state | authStore, firebaseService |

**Acceptance Criteria:**
- Firebase initialized on app start
- Phone Auth provider configured
- Context provides auth state to all children

**Risk:** Firebase configuration errors can block all auth. Use test phone numbers in Firebase Console.

### 2.2 Login Screen

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Login Screen | `src/screens/auth/LoginScreen.tsx` | Phone input, country code picker, "Send OTP" | Button, Input, authApi.sendOtp |
| Phone Validation | `src/utils/validation.ts` | validatePhone (E.164 format) | None |
| Phone Input Hook | `src/hooks/usePhoneInput.ts` | Country code, formatting | validation.ts |

**Acceptance Criteria:**
- Phone number validated before API call
- Loading state during sendOtp
- Error messages displayed inline
- On success, navigate to OTP screen

### 2.3 OTP Screen

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| OTP Screen | `src/screens/auth/OTPScreen.tsx` | 6-digit input, countdown timer, verify button | Button, authApi.verifyOtp |
| OTP Input | `src/components/common/OTPInput.tsx` | 6 boxes with auto-advance | None |
| Countdown Timer | `src/hooks/useCountdown.ts` | 60-second resend timer | None |
| Firebase Verification | `src/hooks/useFirebaseAuth.ts` | signInWithPhoneNumber, get ID token | @react-native-firebase/auth |

**Acceptance Criteria:**
- OTP auto-filled from SMS (iOS)
- Auto-advance between input boxes
- Resend OTP after countdown
- Firebase token exchanged for JWT
- On success, save tokens and navigate to App

**Risk:** SMS auto-fill doesn't work on all Android devices. Provide manual fallback.

### 2.4 Token Management

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Token Refresh | `src/services/tokenRefreshService.ts` | Axios interceptor, 401 handling, retry | api/client.ts, authApi.refreshToken |
| Token Storage | `src/storage/secureStorage.ts` (update) | Save/load/clear tokens with MMKV encryption | None |
| Refresh Hook | `src/hooks/useTokenRefresh.ts` | Auto-refresh before expiry | tokenRefreshService |

**Acceptance Criteria:**
- Access token saved to MMKV after login
- Refresh token used before access expiry (14min)
- 401 responses trigger refresh flow
- Refresh failures clear tokens and redirect to login

**Critical Path:** This must work before any authenticated API calls.

### 2.5 Logout Flow

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Logout Action | `src/store/authStore.ts` (logout) | Clear tokens, reset state, call API | authApi.logout |
| Logout Hook | `src/hooks/useLogout.ts` | Cleanup (Socket, FCM), navigate to login | authStore, socketService |
| Confirmation Dialog | `src/components/common/LogoutDialog.tsx` | "Are you sure?" dialog | None |

**Acceptance Criteria:**
- Logout API called to invalidate server tokens
- Local storage cleared
- Socket disconnected
- FCM token unregistered
- Redirected to Login screen

---

## Phase 3: Dashboard & Children

**Objective:** Build home screen, children list, and detail screens (attendance, results, fees, timetable).

**Estimated Time:** 4-5 days
**Complexity:** MEDIUM

### 3.1 Home Screen

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Home Screen | `src/screens/home/HomeScreen.tsx` | Welcome banner, children cards, quick actions | childrenStore |
| Welcome Banner | `src/components/common/WelcomeBanner.tsx` | Greeting with parent name | None |
| Child Card | `src/components/child/ChildCard.tsx` | Avatar, name, class, "View Details" | Avatar, Card |
| Quick Actions | `src/components/common/QuickActions.tsx` | Messages, Announcements, Notifications buttons | None |

**Acceptance Criteria:**
- Displays parent's name from auth store
- Shows all children as cards
- Tap child card -> ChildProfileScreen
- Quick actions navigate to respective screens

### 3.2 Children List Screen

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Children List | `src/screens/children/ChildrenListScreen.tsx` | All children with search, filter | childrenStore |
| Search Bar | `src/components/common/SearchBar.tsx` | Search by name, admission ID | None |
| Child List Item | `src/components/child/ChildListItem.tsx` | Compact row view | ChildCard |
| Pull to Refresh | `src/hooks/usePullToRefresh.ts` | Refresh children list | childrenStore |

**Acceptance Criteria:**
- List all children with photos
- Search filters in real-time
- Pull-to-refresh fetches latest data
- Empty state if no children
- Loading state on initial fetch

### 3.3 Child Profile Screen

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Child Profile | `src/screens/children/ChildProfileScreen.tsx` | Header photo, info, stats, action grid | parentApi.getStudent |
| Profile Header | `src/components/child/ProfileHeader.tsx` | Photo, name, class, roll no | Avatar |
| Stats Cards | `src/components/child/StatsCards.tsx` | Attendance %, fee status, recent results | None |
| Action Grid | `src/components/child/ActionGrid.tsx` | Attendance, Fees, Results, Timetable buttons | None |

**Acceptance Criteria:**
- Shows child's photo, name, class, roll number
- Displays attendance percentage, fee status
- Action buttons navigate to detail screens
- Loading state while fetching data

### 3.4 Attendance Screen

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Attendance Screen | `src/screens/children/AttendanceScreen.tsx` | Calendar view, monthly stats, list | parentApi.getStudentAttendance |
| Attendance Calendar | `src/components/child/AttendanceCalendar.tsx` | Month view with color-coded days | None |
| Attendance List | `src/components/child/AttendanceList.tsx` | Daily attendance with status | None |
| Stats Summary | `src/components/child/AttendanceStats.tsx` | Present, absent, late, percentage | None |

**Acceptance Criteria:**
- Calendar shows present (green), absent (red), late (yellow)
- Stats summary at top (present %, total days)
- List shows recent attendance entries
- Filter by date range
- Pull-to-refresh

**Parallel Opportunities:** All attendance components can be built simultaneously.

### 3.5 Results Screen

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Results Screen | `src/screens/children/ResultsScreen.tsx` | Exam list, exam detail view | parentApi.getStudentResults |
| Exam Card | `src/components/child/ExamCard.tsx` | Exam name, date, total marks | None |
| Results List | `src/components/child/ResultsList.tsx` | Subject-wise marks, grade | None |
| Performance Chart | `src/components/child/PerformanceChart.tsx` | Bar chart of marks over time | react-native-chart-kit or similar |

**Acceptance Criteria:**
- List all exams for student
- Tap exam -> show subject-wise results
- Show grades, marks obtained, total marks
- Filter by academic year
- Empty state if no results

**Parallel Opportunities:** All result components can be built simultaneously.

### 3.6 Fees Screen

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Fees Screen | `src/screens/children/FeesScreen.tsx` | Fee summary, payment history, due dates | parentApi.getStudentFees |
| Fee Summary | `src/components/child/FeeSummary.tsx` | Total due, paid, pending | None |
| Fee Structure | `src/components/child/FeeStructure.tsx` | Breakdown by fee head | None |
| Payment History | `src/components/child/PaymentHistory.tsx` | List of recent payments | None |
| Due Date Badge | `src/components/child/DueDateBadge.tsx` | Overdue (red), due soon (yellow) | None |

**Acceptance Criteria:**
- Show total fee, paid amount, pending
- Display fee structure by head
- List payment history with dates
- Highlight overdue and upcoming due dates
- View-only (no payment option)

**Parallel Opportunities:** All fee components can be built simultaneously.

### 3.7 Timetable Screen

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Timetable Screen | `src/screens/children/TimetableScreen.tsx` | Weekly timetable grid | parentApi.getTimetable |
| Timetable Grid | `src/components/child/TimetableGrid.tsx` | Period x Day matrix | None |
| Period Cell | `src/components/child/PeriodCell.tsx` | Subject, room, teacher | None |
| Day Selector | `src/components/child/DaySelector.tsx` | Horizontal day picker | None |

**Acceptance Criteria:**
- Grid shows all periods for all days
- Today highlighted
- Tap period -> show subject details
- Empty state if no timetable

---

## Phase 4: Messaging

**Objective:** Build real-time messaging with Socket.IO integration.

**Estimated Time:** 5-6 days
**Complexity:** HIGH

### 4.1 Socket.IO Service

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Socket Service | `src/services/socketService.ts` | Port from web version, adapt for RN | socket.io-client, authStore |
| Connection Manager | `src/hooks/useSocket.ts` | Auto-connect on auth, disconnect on logout | socketService, authStore |
| Socket Context | `src/contexts/SocketContext.tsx` | Provide socket instance to app | socketService |

**Acceptance Criteria:**
- Socket connects when user authenticated
- Auth token sent in connection params
- Auto-reconnect on disconnect
- Rejoin conversation rooms on reconnect
- Disconnect on logout

**Risk:** Socket reconnection can drain battery. Implement exponential backoff.

### 4.2 Conversations Screen

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Conversations Screen | `src/screens/messages/ConversationsScreen.tsx` | List of all conversations | chatStore, messagingApi.getConversations |
| Conversation Item | `src/components/chat/ConversationItem.tsx` | Avatar, name, last message, unread badge | Avatar |
| New Chat Button | `src/components/chat/NewChatButton.tsx` | FAB to start new chat | None |
| Search Conversations | `src/components/chat/SearchConversations.tsx` | Filter by name | None |

**Acceptance Criteria:**
- List all conversations sorted by last message
- Show online indicator for other participant
- Unread count badge
- Tap -> open ChatScreen
- Pull-to-refresh
- Empty state with "Start a conversation" CTA

### 4.3 Chat Screen

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Chat Screen | `src/screens/messages/ChatScreen.tsx` | Message list, input, header | chatStore, socketService |
| Message List | `src/components/chat/MessageList.tsx` | FlatList with inverted data | None |
| Message Bubble | `src/components/chat/MessageBubble.tsx` | Sent/received styles, timestamps, status | None |
| Chat Input | `src/components/chat/ChatInput.tsx` | Text input, send button, attachment icon | None |
| Chat Header | `src/components/chat/ChatHeader.tsx` | Name, avatar, online status, back button | Avatar |

**Acceptance Criteria:**
- Messages shown in chronological order
- Sent messages aligned right (blue)
- Received messages aligned left (gray)
- Show timestamps and read receipts
- Auto-scroll to bottom on new message
- Keyboard avoids input field

### 4.4 Real-time Message Handling

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Send Message | `src/hooks/useSendMessage.ts` | API call + Socket emit, optimistic UI | messagingApi.sendMessage, socketService |
| Receive Message | Socket event handler | Listen for `new_message`, update store | socketService, chatStore |
| Typing Indicator | `src/hooks/useTyping.ts` | Emit/subscribe to typing events | socketService |
| Mark as Read | `src/hooks/useMarkAsRead.ts` | API call + Socket emit | messagingApi.markAsRead, socketService |

**Acceptance Criteria:**
- Messages sent appear immediately (optimistic)
- Received messages appear in real-time
- Typing indicator shown when other user typing
- Read receipts update (blue checks)
- Failed messages show retry option

### 4.5 Message Features (Phase 1 - Basic)

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Reply Support | `src/components/chat/ReplyPreview.tsx` | Show quoted message, cancel reply | MessageBubble |
| Message Status | `src/components/chat/MessageStatus.tsx` | Sent, delivered, read icons | None |
| Unread Badge | Update ConversationItem | Red badge with count | chatStore |

**Acceptance Criteria:**
- Swipe left to reply
- Reply shows quoted message preview
- Message status icons (single tick, double tick, blue)
- Unread count on conversation item

---

## Phase 5: Push Notifications

**Objective:** Implement FCM for push notifications with deep linking.

**Estimated Time:** 2-3 days
**Complexity:** MEDIUM

### 5.1 FCM Setup

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| FCM Config | `firebase.json` (update) | Add FCM project ID | Firebase project |
| Notifications Service | `src/services/notificationService.ts` | Permission request, token registration, handlers | expo-notifications |
| FCM Hook | `src/hooks/usePushNotifications.ts` | Initialize FCM, register token | notificationService |

**Acceptance Criteria:**
- Permission requested on first launch
- FCM token obtained and registered with backend
- Token refreshes handled automatically
- Notification listener configured

### 5.2 Notification Handlers

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Foreground Handler | `src/services/notificationService.ts` | Show in-app notification when app open | expo-notifications |
| Background Handler | `src/services/notificationService.ts` | System notification when app closed | expo-notifications |
| Tap Handler | `src/services/notificationService.ts` | Navigate to relevant screen | navigationRef |

**Acceptance Criteria:**
- Foreground: In-app banner shown
- Background: System notification shown
- Tapping notification opens relevant screen
- Deep link parameters parsed correctly

### 5.3 Notification Types

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Message Notification | Handler | `{type: 'message', conversationId}` | -> ChatScreen |
| Announcement Notification | Handler | `{type: 'announcement', announcementId}` | -> Announcement modal |
| Reminder Notification | Handler | `{type: 'reminder', reminderId}` | -> Reminder detail |
| Attendance Notification | Handler | `{type: 'attendance', studentId}` | -> Attendance screen |

**Acceptance Criteria:**
- Each notification type has specific handler
- Deep link navigation works for all types
- Notification data persisted for offline viewing

### 5.4 Notifications Screen

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Notifications Screen | `src/screens/notifications/NotificationsScreen.tsx` | List of all notifications | notificationStore |
| Notification Item | `src/components/notification/NotificationItem.tsx` | Icon, title, message, time, read status | None |
| Mark All Read | Action button | Clear all unread | notificationStore |
| Notification Detail | Tap handler | Navigate based on type | notificationService |

**Acceptance Criteria:**
- List all notifications sorted by time
- Unread notifications highlighted
- Swipe to delete
- Tap to view detail
- Pull-to-refresh

---

## Phase 6: Profile & Settings

**Objective:** Build profile and settings screens with complete feature definitions.

**Estimated Time:** 2-3 days
**Complexity:** LOW

### 6.1 Profile Screen

**Features:**
- Display parent name, phone number, email
- View children list (read-only)
- Avatar display with upload (Phase 2)
- Link to edit profile (Phase 2)
- Link to Settings

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Profile Screen | `src/screens/profile/ProfileScreen.tsx` | Parent info, children list | authStore, parentApi.getProfile |
| Profile Header | `src/components/profile/ProfileHeader.tsx` | Avatar, name, phone, email | Avatar |
| Children List | `src/components/profile/ProfileChildrenList.tsx` | Read-only list of linked children | ChildListItem |
| Edit Profile Button | Link to edit (placeholder) | "Edit Profile" button | None |

**Acceptance Criteria:**
- Shows parent's name, phone, email from auth store
- Displays all linked children
- Avatar shown (or placeholder if none)
- Navigate to Settings screen
- Edit Profile button shows "Coming soon" toast (Phase 2)

### 6.2 Settings Screen

**Features:**
- Push notification toggle (on/off)
- Language selection (English only initially, placeholder for future)
- About section (app version, school name)
- Logout button
- Privacy policy link
- Terms of service link

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Settings Screen | `src/screens/profile/SettingsScreen.tsx` | Toggle, list items, logout | notificationStore, authStore |
| Notification Toggle | `src/components/profile/NotificationToggle.tsx` | Enable/disable push notifications | notificationStore |
| Language Selector | `src/components/profile/LanguageSelector.tsx` | Dropdown (English only, disabled) | None |
| About Section | `src/components/profile/AboutSection.tsx` | App version, school name | None |
| Logout Button | `src/components/profile/LogoutButton.tsx` | Logout with confirmation | useLogout |

**Acceptance Criteria:**
- Push notification toggle works (saves preference)
- Language selector shows "English (only option)" and is disabled
- About section shows app version
- Logout button triggers confirmation dialog
- Privacy policy link opens browser
- Terms of service link opens browser

---

## Phase 7: Polish & Testing

**Objective:** Add offline support, loading states, error handling, and tests.

**Estimated Time:** 3-4 days
**Complexity:** MEDIUM

### 7.1 Offline Support

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Network Monitor | `src/hooks/useNetworkStatus.ts` | NetInfo listener | @react-native-community/netinfo |
| Offline Banner | `src/components/common/OfflineBanner.tsx` | "You're offline" warning | useNetworkStatus |
| Data Cache | `src/storage/cacheStorage.ts` | MMKV-based cache for API responses | None |
| Cache Strategy | `src/api/client.ts` (update) | Cache-first, network-second for GET | cacheStorage |
| **Message Queue Implementation** | `src/store/chatStore.ts` (update), `src/services/messageQueueService.ts` | **Offline message queue with detailed implementation** | socketService |

**Message Queue Implementation Details:**

```typescript
// Queued message structure
interface QueuedMessage {
  id: string;           // UUID
  conversationId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: number;    // For ordering
  retryCount: number;   // Max 3 retries
}

// Queue properties
- Storage: MMKV under key 'offline_message_queue'
- Max queue size: 50 messages (FIFO when full)
- Send order: By timestamp ascending
- Conflict resolution: Server timestamp wins
- Failed messages: Show retry option in UI
```

**Acceptance Criteria:**
- Offline banner shown when no connection
- Cached data displayed when offline
- "Last updated at X" timestamp
- Messages queued when offline (max 50)
- Queued messages sent when reconnected (timestamp order)
- Failed messages show retry UI
- After 3 failed retries, message marked as failed

### 7.2 Loading States

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Screen Skeletons | `src/components/skeletons/*` | Shimmer effects for each screen type | None |
| Button Loading | Button.tsx (update) | Show spinner when loading prop true | None |
| Inline Loading | InlineLoading.tsx | Small spinner for inline actions | None |
| Full Screen Loading | LoadingOverlay.tsx | Used during initial data load | None |

**Acceptance Criteria:**
- Skeleton screens shown on first load
- Buttons show loading state during actions
- No janky transitions between loading and data

### 7.3 Error Handling

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| API Error Handler | `src/utils/errorHandler.ts` | Parse API errors, return user-friendly messages | None |
| Error Display | ErrorDisplay.tsx | Illustrated error, retry button | None |
| Error Toast | `src/hooks/useErrorToast.ts` | Toast notification for errors | react-native-toast-speaking or similar |
| Error Boundary | ErrorBoundary.tsx (update) | Catch React errors, show fallback | None |

**Acceptance Criteria:**
- API errors shown as user-friendly messages
- Network errors offer retry
- Validation errors shown inline
- Unexpected errors reported (logging)

### 7.4 Pull-to-Refresh

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Refresh Hook | `src/hooks/usePullToRefresh.ts` | Generic pull-to-refresh logic | None |
| Apply to Screens | All list screens | Add RefreshControl | usePullToRefresh |

**Acceptance Criteria:**
- All list screens support pull-to-refresh
- Spinner shows during refresh
- Data updates after refresh
- Error toast if refresh fails

### 7.5 Testing (Basic)

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Unit Tests | `src/**/__tests__/*.test.ts` | Utility functions, hooks | jest |
| Component Tests | `src/**/__tests__/*.test.tsx` | UI components | @testing-library/react-native |
| E2E Tests | `e2e/*.spec.ts` | Critical user flows | detox |

**Acceptance Criteria:**
- Core utilities have unit tests
- Critical components have tests
- Auth flow E2E test passes
- Message flow E2E test passes

---

## Phase 8: Deployment

**Objective:** Build for iOS (TestFlight) and Android (APK) and prepare for app store submission.

**Estimated Time:** 2-3 days
**Complexity:** MEDIUM

### 8.1 EAS Configuration

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| EAS Build Config | `eas.json` | Build profiles for iOS/Android | None |
| App Icons | `assets/icons/*` | Generate all icon sizes | eas-cli |
| Splash Screen | `assets/splash.png` | Configure splash screen | eas-cli |
| Build Scripts | `package.json` scripts | eas build commands | None |

**Acceptance Criteria:**
- `eas build --platform ios` succeeds
- `eas build --platform android` succeeds
- Icons and splash screen display correctly

### 8.2 iOS Build

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Apple Developer | Apple Developer account | App ID, provisioning profile | None |
| TestFlight Build | EAS build | Submit to TestFlight | eas.json |
| TestFlight Testing | Internal testers | Install on test devices | TestFlight |

**Acceptance Criteria:**
- Build appears in TestFlight
- App installs on test devices
- Push notifications work on iOS
- Deep linking works on iOS

### 8.3 Android Build

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Keystore | `*.jks` | Android signing key | None |
| APK Build | EAS build | Generate APK for testing | eas.json |
| Play Store Config | `eas.json` (update) | Production build config | None |

**Acceptance Criteria:**
- APK installs on test devices
- Push notifications work on Android
- Deep linking works on Android
- App follows Android design guidelines

### 8.4 App Store Submission Prep

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| App Store Listing | Metadata | Name, description, keywords, screenshots | None |
| Privacy Policy | `PRIVACY_POLICY.md` | Required for App Store | None |
| App Store Screenshots | `assets/screenshots/*` | Required sizes (iPhone Pro Max, etc.) | None |
| Review Info | Metadata | Review notes, demo account | None |

**Acceptance Criteria:**
- All metadata prepared
- Screenshots for all device sizes
- Privacy policy published
- Demo account ready for review

### 8.5 Play Store Submission Prep

| Task | File(s) | Details | Dependencies |
|------|---------|---------|--------------|
| Play Store Listing | Google Play Console | Title, short/long description, screenshots | None |
| Content Rating | Questionnaire | Fill out content rating questionnaire | None |
- Store Listing | Graphics | High-res icon, feature graphic, screenshots | None |
- Privacy Policy | URL | Link to privacy policy | None |

**Acceptance Criteria:**
- All listing information complete
- Content rating obtained
- Graphics uploaded
- Privacy policy linked

---

## Testing Approach

### E2E Test Flows

**Critical user flows to test:**

1. **Authentication Flow**
   - Enter phone number → Send OTP
   - Receive OTP (or use test code)
   - Verify OTP → Navigate to Home
   - Logout → Return to Login

2. **Child Dashboard Flow**
   - Login → Home screen
   - View children list
   - Tap child → View profile
   - Navigate to Attendance → Verify data
   - Navigate to Results → Verify data
   - Navigate to Fees → Verify data
   - Navigate to Timetable → Verify data

3. **Messaging Flow**
   - Open Messages tab
   - View conversations list
   - Tap conversation → Open chat
   - Send message → Verify sent
   - Receive message from dashboard → Verify received
   - Test typing indicators
   - Test read receipts

4. **Push Notification Flow**
   - App in background
   - Receive push notification
   - Tap notification → Open correct screen
   - Verify deep linking for each notification type:
     - `message` → ChatScreen
     - `announcement` → Announcement modal
     - `reminder` → Reminder detail
     - `attendance_alert` → Attendance screen
     - `fee_due` → Fees screen
     - `result_published` → Results screen

5. **Offline Flow**
   - Load data while online
   - Enable airplane mode
   - Verify cached data displayed
   - Send message → Verify queued
   - Disable airplane mode → Verify message sent

### Unit Test Coverage

| Module | Target Coverage | Focus Areas |
|--------|----------------|-------------|
| API Client | 80% | Interceptors, error handling, token refresh |
| Auth Store | 70% | Login, logout, token management |
| Chat Store | 70% | Message queue, conversation management |
| Children Store | 70% | Fetch, cache, selection logic |
| Utilities | 90% | Validation, formatters, date helpers |
| Hooks | 60% | useTokenRefresh, useNetworkStatus |
| Components | 50% | Critical components (Button, Input, MessageBubble) |

### Socket.IO Testing

- Mock socket for unit tests
- Test connection events (connect, disconnect, reconnect)
- Test message emit/receive
- Test room joining/leaving
- Test typing indicators

### Test Tools

- **Unit Tests**: Jest + React Native Testing Library
- **E2E Tests**: Detox
- **API Mocking**: MSW (Mock Service Worker)

---

## Risk Mitigation

### Risk 1: Firebase Setup Complexity

**Impact:** HIGH - Can block all authentication
**Probability:** MEDIUM

**Mitigation Strategies:**
1. Use Firebase Test Phone Numbers during development
2. Create detailed Firebase setup checklist
3. Have fallback to development OTP bypass
4. Document Firebase Console configuration steps

### Risk 2: Socket.IO Reconnection Handling

**Impact:** MEDIUM - Messaging fails on poor connections
**Probability:** HIGH

**Mitigation Strategies:**
1. Implement exponential backoff for reconnection
2. Queue messages when offline
3. Show connection status indicator
4. Test on flaky networks (network throttling)
5. Fallback to polling for critical updates

### Risk 3: Push Notification Delivery

**Impact:** MEDIUM - Users miss important messages
**Probability:** MEDIUM

**Mitigation Strategies:**
1. Handle both FCM and APNs (iOS)
2. Request permissions at optimal time (after onboarding)
3. Show in-app notifications if foreground
4. Implement notification persistence
5. Test on both iOS and Android extensively

### Risk 4: Token Refresh Edge Cases

**Impact:** HIGH - Users logged out unexpectedly
**Probability:** MEDIUM

**Mitigation Strategies:**
1. Refresh token 1 minute before expiry
2. Handle concurrent refresh requests (locking)
3. Clear tokens and redirect to login on refresh failure
4. Add retry logic for failed refresh
5. Test with expired tokens

### Risk 5: Offline Sync Conflicts

**Impact:** LOW - Data inconsistency
**Probability:** LOW

**Mitigation Strategies:**
1. Use timestamp-based conflict resolution
2. Show "syncing" indicator during sync
3. Queue actions (not just data) for replay
4. Discard stale cached data after 24 hours
5. Test offline scenarios extensively

### Risk 6: Navigation Deep Link Failures

**Impact:** MEDIUM - Notifications don't open correct screen
**Probability:** MEDIUM

**Mitigation Strategies:**
1. Use React Navigation deep linking
2. Test all notification type deep links
3. Add error fallback to Home screen
4. Log deep link failures for debugging
5. Document deep link URL structure

### Risk 7: Type Mismatches with Backend

**Impact:** MEDIUM - Runtime errors, crashes
**Probability:** MEDIUM

**Mitigation Strategies:**
1. Use zod or io-ts for runtime validation
2. Share types between frontend and backend if possible
3. Add API response validation
4. Test with real backend data early
5. Keep types in sync with backend changes

---

## Success Criteria

### Functional Requirements

| # | Criteria | Verification |
|---|----------|--------------|
| FR1 | Parent can login with phone + OTP | Test login flow on iOS and Android |
| FR2 | Parent can view all their children | Verify children list matches backend |
| FR3 | Parent can view child's attendance | Compare with dashboard data |
| FR4 | Parent can view child's results | Compare with dashboard data |
| FR5 | Parent can view child's fees | Verify fee structure and payments |
| FR6 | Parent can view child's timetable | Verify period/day grid |
| FR7 | Parent can send message to teacher | Test message appears in dashboard |
| FR8 | Parent receives message in real-time | Test from dashboard to app |
| FR9 | Parent receives push notification | Test FCM delivery on both platforms |
| FR10 | App works offline with cached data | Test in airplane mode |

### Non-Functional Requirements

| # | Criteria | Target | Measurement |
|---|----------|--------|-------------|
| NFR1 | App Load Time | < 3 seconds | Cold start time |
| NFR2 | API Response (cached) | < 1 second | Cache hit response |
| NFR3 | Push Delivery Rate | > 95% | FCM delivery reports |
| NFR4 | Crash Rate | < 1% | Crashlytics data |
| NFR5 | App Size | < 50 MB | APK/IPA size |

### Platform Requirements

| # | Criteria | Verification |
|---|----------|--------------|
| PR1 | Builds for iOS | EAS build succeeds |
| PR2 | Builds for Android | EAS build succeeds |
| PR3 | Runs on iOS 14+ | Test on minimum iOS version |
| PR4 | Runs on Android 8+ | Test on minimum Android version |
| PR5 | Passes App Store Review | Submission accepted |
| PR6 | Passes Play Store Review | Publication accepted |

---

## Commit Strategy

### Phase-Based Commits

Each phase should result in a logical set of commits:

```
phase-1-foundation
  - setup: Project initialization
  - feat: Type definitions
  - feat: API client layer
  - feat: State management
  - feat: Navigation setup
  - feat: Base UI components

phase-2-authentication
  - feat: Firebase configuration
  - feat: Login screen
  - feat: OTP screen
  - feat: Token management
  - feat: Logout flow

phase-3-dashboard
  - feat: Home screen
  - feat: Children list screen
  - feat: Child profile screen
  - feat: Attendance screen
  - feat: Results screen
  - feat: Fees screen
  - feat: Timetable screen

phase-4-messaging
  - feat: Socket.IO service
  - feat: Conversations screen
  - feat: Chat screen
  - feat: Real-time message handling

phase-5-notifications
  - feat: FCM setup
  - feat: Notification handlers
  - feat: Notifications screen

phase-6-polish
  - feat: Offline support
  - feat: Loading states
  - feat: Error handling
  - feat: Pull-to-refresh
  - test: Add basic tests

phase-7-deployment
  - chore: EAS configuration
  - build: iOS build
  - build: Android build
  - docs: App store prep
```

### Commit Message Format

Follow Conventional Commits:

```
feat: add child profile screen
fix: resolve token refresh race condition
refactor: extract socket service to hook
test: add auth flow E2E test
chore: update dependencies
docs: add API integration guide
```

---

## Next Steps

1. **Review Plan** - Validate plan captures all requirements
2. **Confirm Phase Order** - Agree on sequential vs parallel execution
3. **Set Up Development Environment** - Install Expo CLI, configure Firebase
4. **Begin Phase 1** - Initialize project and create base structure
5. **Daily Progress Tracking** - Update task completion status

---

## Appendix: File Structure Quick Reference

```
parent-app/
├── App.tsx                          # Entry point
├── app.json                         # Expo config
├── package.json
├── tsconfig.json
├── .env                             # Environment variables
├── eas.json                         # Build config
│
├── src/
│   ├── api/                         # API integration
│   │   ├── client.ts                # Axios instance
│   │   ├── auth.ts                  # Auth endpoints
│   │   ├── parent.ts                # Parent/children endpoints
│   │   └── messaging.ts             # Messaging endpoints
│   │
│   ├── config/
│   │   ├── env.ts                   # Environment config
│   │   └── constants.ts             # App constants
│   │
│   ├── hooks/
│   │   ├── useAuth.ts               # Authentication
│   │   ├── useChildren.ts           # Children data
│   │   ├── useMessages.ts           # Messaging
│   │   ├── useSocket.ts             # Socket.IO
│   │   ├── usePushNotifications.ts  # FCM
│   │   ├── useTokenRefresh.ts       # Token refresh
│   │   ├── useNetworkStatus.ts      # Online/offline
│   │   ├── usePullToRefresh.ts      # Refresh logic
│   │   └── useLogout.ts             # Logout cleanup
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx        # Auth vs App switch
│   │   ├── AuthNavigator.tsx        # Login -> OTP
│   │   ├── AppNavigator.tsx         # Tab navigator
│   │   └── navigationRef.ts         # Global ref
│   │
│   ├── store/
│   │   ├── authStore.ts             # Auth state
│   │   ├── childrenStore.ts         # Children state
│   │   ├── chatStore.ts             # Chat state
│   │   ├── notificationStore.ts     # Notification state
│   │   └── index.ts                 # Export all
│   │
│   ├── storage/
│   │   ├── secureStorage.ts         # MMKV wrapper
│   │   ├── cacheStorage.ts          # Cache layer
│   │   └── storageKeys.ts           # Key constants
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── OTPScreen.tsx
│   │   │
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   │
│   │   ├── children/
│   │   │   ├── ChildrenListScreen.tsx
│   │   │   ├── ChildProfileScreen.tsx
│   │   │   ├── AttendanceScreen.tsx
│   │   │   ├── ResultsScreen.tsx
│   │   │   ├── FeesScreen.tsx
│   │   │   └── TimetableScreen.tsx
│   │   │
│   │   ├── messages/
│   │   │   ├── ConversationsScreen.tsx
│   │   │   └── ChatScreen.tsx
│   │   │
│   │   ├── notifications/
│   │   │   └── NotificationsScreen.tsx
│   │   │
│   │   └── profile/
│   │       ├── ProfileScreen.tsx
│   │       └── SettingsScreen.tsx
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingOverlay.tsx
│   │   │   ├── OfflineBanner.tsx
│   │   │   ├── ErrorDisplay.tsx
│   │   │   └── LogoutDialog.tsx
│   │   │
│   │   ├── child/
│   │   │   ├── ChildCard.tsx
│   │   │   ├── ChildListItem.tsx
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── StatsCards.tsx
│   │   │   ├── ActionGrid.tsx
│   │   │   ├── AttendanceCalendar.tsx
│   │   │   ├── AttendanceList.tsx
│   │   │   ├── AttendanceStats.tsx
│   │   │   ├── ExamCard.tsx
│   │   │   ├── ResultsList.tsx
│   │   │   ├── FeeSummary.tsx
│   │   │   ├── FeeStructure.tsx
│   │   │   ├── PaymentHistory.tsx
│   │   │   └── TimetableGrid.tsx
│   │   │
│   │   └── chat/
│   │       ├── ConversationItem.tsx
│   │       ├── MessageList.tsx
│   │       ├── MessageBubble.tsx
│   │       ├── ChatInput.tsx
│   │       ├── ChatHeader.tsx
│   │       └── ReplyPreview.tsx
│   │
│   ├── contexts/
│   │   ├── SocketContext.tsx
│   │   └── AuthContext.tsx
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── parent.ts
│   │   ├── student.ts
│   │   ├── message.ts
│   │   ├── api.ts
│   │   └── navigation.ts
│   │
│   ├── utils/
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   ├── formatters.ts
│   │   └── errorHandler.ts
│   │
│   └── services/
│       ├── socketService.ts         # Socket.IO client
│       ├── notificationService.ts   # Notification handler
│       ├── firebaseService.ts       # Firebase setup
│       └── tokenRefreshService.ts   # Token refresh logic
│
├── android/                         # Generated by Expo
└── ios/                             # Generated by Expo
```

---

**End of Implementation Plan (REVISED)**

Total Estimated Files: ~95 files
Total Estimated Complexity: 8 phases (was 7), 35-40 days of development
**Revisions Applied:** 10 critical concerns addressed
**Status:** Ready for implementation (after prerequisites completed)
**Next Action:** Complete Firebase setup + environment configuration, then begin Phase 1

---

## Revision Summary

This plan has been revised to address 10 critical concerns identified during review:

1. ✅ **Prerequisites & Setup Section Added** - All 4 environment variables documented
2. ✅ **Firebase Setup Checklist** - 6-step setup guide with test phone numbers
3. ✅ **Socket.IO URL Clarified** - = API URL without `/api` suffix
4. ✅ **Navigation Conflict Resolved** - Chose React Navigation 7.0 (not expo-router)
5. ✅ **Profile/Settings Defined** - 5 + 6 features specified
6. ✅ **Message Queue Implementation** - Detailed specs (max 50, timestamp ordering, retry logic)
7. ✅ **API Response Wrapper** - ApiResponse<T> structure for all endpoints
8. ✅ **Timetable Endpoint Verified** - `/api/parent/timetable/:studentId`
9. ✅ **Testing Approach Added** - E2E flows, unit test coverage, test tools
10. ✅ **Notification Types Mapped** - 6 types with deep link actions
