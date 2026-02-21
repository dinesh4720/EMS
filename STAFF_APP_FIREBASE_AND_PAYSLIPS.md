# Staff Mobile App - Firebase & Payslips Implementation

**Date:** 2026-02-02
**Version:** 2.0.0

---

## New Features Implemented

### 1. Firebase Push Notifications ✅

#### Backend Implementation

**New Files Created:**
- `backend/models/PushToken.js` - MongoDB model for storing FCM tokens
- `backend/services/pushNotificationService.js` - Service for sending push notifications
- `backend/routes/pushNotifications.js` - API endpoints for token management

**API Endpoints:**
```
POST   /api/push-notifications/register-token   - Register FCM token
DELETE /api/push-notifications/unregister-token - Unregister token
GET    /api/push-notifications/my-tokens          - Get user's tokens
POST   /api/push-notifications/test             - Send test notification
```

**Push Notification Triggers:**
- ✅ Homework created → Notification to teacher
- ✅ Leave approved/rejected → Notification to teacher
- ✅ Substitutions assigned → Already handled in existing routes
- ✅ Announcements → Can be sent to all staff

#### Frontend Implementation

**New Files Created:**
- `staff-app/services/notificationApi.js` - API client for push notifications
- `staff-app/hooks/useNotifications.ts` - Custom hook for notification management

**Features:**
- Automatic token registration on app launch
- Permission request handling
- Foreground notification handling
- Notification tap handling with navigation support
- Platform-specific configurations (iOS/Android)

**Configuration:**
- `staff-app/app.json` - Updated with expo-notifications plugin
- `staff-app/package.json` - Added expo-notifications dependency

---

### 2. Payslip Viewing & Downloading ✅

#### Backend Implementation

**New File Created:**
- `backend/routes/payslips.js` - Payslip API endpoints

**API Endpoints:**
```
GET /api/payslips/staff/:staffId           - Get all payslips (paginated)
GET /api/payslips/:id                        - Get single payslip
GET /api/payslips/:id/download              - Download payslip as PDF
GET /api/payslips/staff/:staffId/summary    - Get yearly summary
```

**Features:**
- Filter by year/month
- Pagination support
- PDF generation with PDFKit
- Yearly earnings summary
- Payment status tracking

#### Frontend Implementation

**New File Created:**
- `staff-app/app/(tabs)/payslips.tsx` - Payslip viewing screen

**Features:**
- Earnings summary card (total for the year)
- Payslips list with salary breakdown
- PDF download (platform-specific: web blob, mobile file share)
- Pull-to-refresh
- Payment status badges (paid/pending)
- Loading states and error handling

**Dependencies Added:**
- `expo-file-system` - File system operations
- `expo-sharing` - Share functionality for downloads

---

## Integration with School Dashboard

### End-to-End Workflows

#### 1. Homework Creation → Push Notification
```
School Dashboard (Teacher creates homework)
    ↓
Backend: POST /api/homework
    ↓
Firebase: Send push notification to teacher's mobile
    ↓
Staff App: Teacher receives notification
    ↓
Tap notification → Navigate to Homework screen
```

#### 2. Leave Approval → Push Notification
```
School Dashboard (Admin approves leave)
    ↓
Backend: PUT /api/teacher-leaves/:id/status
    ↓
Firebase: Send push notification to teacher
    ↓
Staff App: Teacher receives notification
    ↓
Tap notification → Navigate to Profile/Leaves
```

#### 3. Payslip Generation → Mobile Viewing
```
School Dashboard (Payroll processed)
    ↓
Backend: Payslip created in database
    ↓
Staff App: Teacher opens Payslips tab
    ↓
API: GET /api/payslips/staff/:id
    ↓
Staff App: Display payslip details
    ↓
Teacher taps "Download PDF"
    ↓
API: GET /api/payslips/:id/download
    ↓
Staff App: Save/Share PDF
```

---

## API Service Updates

**New Methods in `staff-app/services/api.ts`:**
```typescript
getPayslips(teacherId, year?, limit, skip)      - Fetch payslips
getPayslip(payslipId)                            - Fetch single payslip
getPayslipSummary(teacherId)                     - Get yearly summary
downloadPayslip(payslipId)                       - Download PDF
```

---

## Database Schema

### PushToken Collection
```javascript
{
  user: ObjectId (ref: Staff),
  token: String (unique),
  platform: String (enum: ios, android, web),
  appVersion: String,
  osVersion: String,
  deviceId: String,
  isActive: Boolean,
  lastUsedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Setup Instructions

### Backend (Already Configured)
1. Firebase Admin SDK is installed (`firebase-admin@13.6.0`)
2. Service account key should be at `backend/config/firebase-service-account.json`
3. Routes are automatically mounted in `server.js`

### Mobile App

1. **Install dependencies:**
```bash
cd staff-app
npm install
```

2. **Configure Firebase Project ID:**
   - Update `staff-app/app.json` > extra > eas > projectId
   - Or set environment variable

3. **Run the app:**
```bash
npm start
```

4. **Grant Permissions:**
   - App will automatically request notification permissions on first launch
   - Allow notifications to receive push notifications

---

## Testing

### Push Notifications

**Test from Backend:**
```bash
curl -X POST http://localhost:3001/api/push-notifications/test \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Test notification"}'
```

**Test Triggers:**
1. Create homework via dashboard → Check mobile app
2. Approve leave via dashboard → Check mobile app
3. Send announcement → Check mobile app

### Payslips

**Test API:**
```bash
# Get payslips
curl http://localhost:3001/api/payslips/staff/<staffId>

# Download payslip
curl http://localhost:3001/api/payslips/<payslipId>/download \
  -H "Authorization: Bearer <token>" \
  --output payslip.pdf
```

**Test in App:**
1. Open Staff App
2. Navigate to "Payslips" tab
3. View earnings summary
4. Tap "Download PDF" on any payslip
5. Verify PDF downloads/shares correctly

---

## Notification Types

| Type | Title | Body | Data Payload |
|------|-------|------|--------------|
| **homework** | "Homework Created" | "{subject} assignment due {date}" | `{homeworkId, classId, subject, dueDate}` |
| **leave** | "Leave Approved/Rejected" | "{message}" | `{leaveId, status}` |
| **substitution** | "Class Substitution" | "Period {period}: {details}" | `{classId, period, date}` |
| **announcement** | "{title}" | "{message}" | `{announcementId, priority}` |

---

## Troubleshooting

### Push Notifications Not Working

1. **Check Firebase Configuration:**
   - Verify service account key exists
   - Check project ID is correct
   - Ensure Firebase project is active

2. **Check Token Registration:**
   - Call `/api/push-notifications/my-tokens` to verify token is registered
   - Check console for registration errors

3. **Check Permissions:**
   - Ensure user granted notification permissions
   - On Android: Check notification channel is created
   - On iOS: Check APNs certificates

### Payslip Download Not Working

1. **Check PDF Generation:**
   - Verify `pdfkit` is installed: `npm list pdfkit`
   - Check backend logs for PDF generation errors

2. **Check File Permissions:**
   - On mobile: Ensure app has storage permissions
   - Check `expo-file-system` is properly configured

3. **Network Issues:**
   - Verify API endpoint is accessible
   - Check authentication token is valid

---

## File Changes Summary

### Backend Files
- ✅ `backend/models/PushToken.js` (created)
- ✅ `backend/services/pushNotificationService.js` (created)
- ✅ `backend/routes/pushNotifications.js` (created)
- ✅ `backend/routes/payslips.js` (created)
- ✅ `backend/routes/homework.js` (updated - added push notifications)
- ✅ `backend/routes/teacherLeaves.js` (updated - added push notifications)
- ✅ `backend/server.js` (updated - mounted new routes)

### Mobile Files
- ✅ `staff-app/services/notificationApi.js` (created)
- ✅ `staff-app/hooks/useNotifications.ts` (created)
- ✅ `staff-app/app/(tabs)/payslips.tsx` (created)
- ✅ `staff-app/app/(tabs)/_layout.tsx` (updated - added payslips tab)
- ✅ `staff-app/app/_layout.tsx` (updated - init notifications)
- ✅ `staff-app/services/api.ts` (updated - added payslips methods)
- ✅ `staff-app/package.json` (updated - added dependencies)
- ✅ `staff-app/app.json` (updated - notifications plugin)

---

## Next Steps

1. **Production Setup:**
   - Upload `google-services.json` for Android
   - Upload `GoogleService-Info.plist` for iOS
   - Configure production Firebase project

2. **Testing:**
   - Test push notifications on real devices
   - Test PDF download on both iOS and Android
   - Load test with multiple users

3. **Enhancements:**
   - Add notification preferences screen
   - Add notification categories (mute specific types)
   - Add payslip filtering by date range
   - Add offline payslip caching

---

## Support

For issues or questions:
1. Check Firebase Console for push notification delivery status
2. Check backend logs for errors: `backend/server.js`
3. Check mobile app logs via Expo CLI

**Implementation Complete!** 🎉
