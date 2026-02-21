# Staff App Profile - Web App Synchronization Specification

## Executive Summary

Enable staff profile editing capabilities in the React Native staff app with real-time synchronization to the web dashboard. The system leverages the existing Socket.IO infrastructure already present in the web app and extends it to the mobile platform.

---

## 1. Requirements Analysis

### Functional Requirements

1. **Profile Viewing**: Staff app must display complete profile information matching web app
2. **Profile Editing**: Staff can edit specific fields (phone, email, emergency contacts, address, blood group, marital status)
3. **Photo Management**: Upload/capture profile photo from mobile
4. **Real-Time Sync**: Changes in web app reflect immediately in staff app
5. **Real-Time Sync**: Changes in staff app reflect immediately in web app
6. **Validation**: Client-side validation matching web app rules
7. **Authentication**: JWT-based auth with secure token storage

### Non-Functional Requirements

1. **Performance**: Updates reflect within 2 seconds via Socket.IO
2. **Security**: Admin-only fields (salary, roles, department) cannot be edited from mobile
3. **UX**: Clear visual feedback for sync status and edit operations
4. **Reliability**: Handle network failures gracefully with retry logic
5. **Privacy**: All data transmitted over HTTPS

### Implicit Requirements

1. **Audit Logging**: Track all profile changes with timestamp, fields changed, source
2. **Conflict Resolution**: Handle simultaneous edits from web and mobile
3. **Offline Support**: Queue changes when offline, sync on reconnect
4. **Error Handling**: Clear error messages for validation failures and network issues

### Out of Scope

1. **Salary Management**: Cannot edit salary from mobile (admin-only)
2. **Role Changes**: Cannot modify roles or department from mobile
3. **Employment Status**: Cannot change employment status from mobile
4. **Other Staff Profiles**: Staff can only edit their own profile

---

## 2. Technical Architecture

### Tech Stack

**Staff App (Mobile):**
- React Native 0.74.5 (existing)
- Socket.IO Client 4.8.3 (upgrade)
- React Hook Form + Zod (NEW)
- Expo Image Picker & Camera (NEW)

**Shared Backend:**
- MongoDB (existing)
- REST API with Socket.IO (existing)

**Web App (Reference):**
- Socket.IO Client 4.8.3 (existing)
- React 18.3.1 (existing)

### Data Flow Architecture

```
Staff App (Mobile)          Backend Server            Web Dashboard
     │                            │                           │
     │ GET /staff/:id             │                           │
     │───────────────────────────>│                           │
     │ Profile Data               │                           │
     │<───────────────────────────│                           │
     │                            │                           │
     │ PUT /staff/:id/profile     │                           │
     │───────────────────────────>│                           │
     │ Update Database            │                           │
     │                            │───────────────────────────>│
     │ Socket: staff_updated      │                           │
     │<───────────────────────────│<───────────────────────────│
     │ Update UI                  │                           │
```

### API Interfaces

**New Backend Endpoint Required:**
```
PUT /api/staff/:id/profile

Request Body:
{
  phone: string                    // Required, 10 digits
  email?: string                   // Optional, validated format
  whatsappNumber?: string          // Optional, 10 digits
  bloodGroup?: "A+" | "A-" | ...   // Optional
  maritalStatus?: "Single" | ...   // Optional
  address?: string                 // Optional, max 200 chars
  emergencyContacts: Array<{       // Required, min 1
    name: string
    relationship: string
    phone: string
  }>
  picture?: string                 // Cloudinary URL
}
```

**Socket Events:**
- `staff_updated` - Broadcast when profile changes
- `authenticate` - Sent on socket connect

---

## 3. File Structure

### New Files - Staff App

```
staff-app/
├── src/
│   ├── services/
│   │   ├── socketService.ts          # NEW: Socket.IO client wrapper
│   │   └── validation.ts             # NEW: Zod schemas
│   ├── screens/
│   │   ├── EditProfileScreen.tsx     # NEW: Profile editing form
│   │   └── ProfilePhotoScreen.tsx    # NEW: Photo upload/capture
│   ├── components/
│   │   ├── ProfileFormField.tsx      # NEW: Reusable form input
│   │   ├── EmergencyContactItem.tsx  # NEW: Emergency contact editor
│   │   └── SyncIndicator.tsx         # NEW: Shows sync status
│   ├── hooks/
│   │   ├── useStaffProfile.ts        # NEW: Profile data hook
│   │   └── useSocketSync.ts          # NEW: Socket connection hook
│   └── types/
│       └── staff.ts                  # NEW: TypeScript interfaces
```

### Modified Files - Staff App

```
staff-app/
├── app/(tabs)/profile.tsx             # MODIFIED: Add edit functionality
├── package.json                       # MODIFIED: Add dependencies
└── app.json                          # MODIFIED: Camera permissions
```

### Backend

```
backend/
├── controllers/
│   └── staffController.js            # MODIFIED: Add profile update endpoint
├── middleware/
│   └── staffValidation.js            # NEW: Validate editable fields
└── socket/
    └── staffEvents.js                # MODIFIED: Emit profile update events
```

---

## 4. Security & Validation

### Editable Fields (Staff Self-Service)
- ✅ phone
- ✅ email
- ✅ whatsappNumber
- ✅ bloodGroup
- ✅ maritalStatus
- ✅ address
- ✅ emergencyContacts[]
- ✅ picture

### Admin-Only Fields (Blocked from Mobile)
- ❌ salary
- ❌ roles
- ❌ department
- ❌ employmentStatus
- ❌ staffNumber
- ❌ qualifications

### Validation Rules

| Field | Rule |
|-------|------|
| phone | Required, `/^\d{10}$/` |
| email | Optional, valid email format |
| whatsappNumber | Optional, `/^\d{10}$/` |
| bloodGroup | Optional: A+, A-, B+, B-, AB+, AB-, O+, O- |
| maritalStatus | Optional: Single, Married, Divorced, Widowed |
| address | Optional, max 200 chars |
| emergencyContacts | Array, min 1, max 5 items |

---

## 5. Real-Time Sync Strategy

1. **Socket Connection**: Staff app connects to Socket.IO server on auth
2. **Authentication**: Send JWT with socket handshake
3. **Event Listening**: Subscribe to `staff_updated` events
4. **Update Handling**: When event received, refresh profile data
5. **Conflict Resolution**: Last-write-wins with timestamp comparison
6. **Reconnection**: Auto-reconnect with exponential backoff

---

## 6. Implementation Phases

### Phase 1: Foundation
- Add Socket.IO client dependency
- Create socketService.ts wrapper
- Create TypeScript types
- Set up validation schemas with Zod

### Phase 2: Profile Read & Sync
- Implement profile data fetching
- Add socket listeners for `staff_updated`
- Test real-time updates from web to mobile
- Add sync status indicator

### Phase 3: Profile Edit
- Create EditProfileScreen with form
- Implement form validation with React Hook Form + Zod
- Add emergency contact CRUD
- Implement profile update API call

### Phase 4: Photo Upload
- Create ProfilePhotoScreen
- Add image picker
- Add camera capture
- Integrate with Cloudinary upload API

### Phase 5: Backend Support
- Create `PUT /api/staff/:id/profile` endpoint
- Add field authorization middleware
- Implement audit logging
- Add socket broadcast on update

### Phase 6: Testing & Polish
- End-to-end sync testing
- Security audit
- Performance testing
- Error handling validation

---

## 7. Dependencies to Add

```json
{
  "dependencies": {
    "socket.io-client": "^4.8.3",
    "react-hook-form": "^7.51.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "expo-image-picker": "~15.0.0",
    "expo-camera": "~15.0.0"
  }
}
```

Install command:
```bash
cd staff-app
npm install socket.io-client@4.8.3 react-hook-form zod @hookform/resolvers
npx expo install expo-image-picker expo-camera
```

---

## 8. Validation Rules (Matching Web App)

Based on `school-dashboard/src/pages/staffs/AddStaff.jsx:145-191`

All validation rules in staff app must match web app exactly to ensure data consistency.

---

## 9. Audit Logging

Required for all profile changes:
```typescript
{
  timestamp: Date
  staffId: string
  action: 'profile_update'
  fieldsChanged: string[]
  previousValues: Record<string, any>
  newValues: Record<string, any>
  source: 'mobile_app' | 'web_dashboard'
  ipAddress: string
}
```

---

## 10. Conflict Resolution Strategy

| Scenario | Resolution |
|----------|------------|
| Same field edited simultaneously | Last-write-wins (timestamp based) |
| Admin-only field edit attempt | Server rejects with 403 Forbidden |
| Offline edit | Queue changes, sync on reconnect |
| Stale data detected | Return 409 Conflict with latest data |

---

## 11. Open Questions

1. Should offline edits be queued? (Recommended: Yes)
2. Photo upload size limit? (Recommended: 2MB)
3. Profile versioning for conflict detection? (Recommended: Yes)
4. Push notifications for admin updates? (Recommended: Via Expo Notifications)

---

*Specification generated by Autopilot - Phase 0: Expansion*
