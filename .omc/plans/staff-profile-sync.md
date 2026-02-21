# Staff App Profile - Web App Synchronization Implementation Plan

## Context

### Original Request
Create a detailed implementation plan for enabling staff profile editing capabilities in the React Native staff app with real-time synchronization to the web dashboard.

### Interview Summary
No user interview was conducted as this was a direct planning request based on the existing specification in `.omc/autopilot/spec.md`.

### Research Findings
- **Staff App Structure**: Uses Expo Router, TypeScript, Socket.IO client already implemented
- **Existing Services**: `api.ts` for REST calls, `socketService.ts` for Socket.IO connection
- **Existing Auth**: `AuthContext.tsx` with SecureStore for tokens
- **Backend**: Express + Socket.IO server, mobile routes in `routes/mobile.js`
- **Web Dashboard**: Uses Socket.IO client for real-time updates, validation patterns in `AddStaff.jsx`

---

## Work Objectives

### Core Objective
Implement bidirectional profile synchronization between the staff mobile app and web dashboard, allowing staff to edit their own profiles with real-time updates reflected across both platforms.

### Deliverables
1. Mobile profile edit screen with form validation
2. Profile photo upload/capture functionality
3. Socket.IO real-time sync integration
4. Backend API endpoint for profile updates
5. Audit logging for profile changes
6. Sync status indicator component

### Definition of Done
- [ ] Staff can edit phone, email, address, blood group, marital status, emergency contacts
- [ ] Photo upload works from camera and gallery
- [ ] Changes from mobile appear on web within 2 seconds
- [ ] Changes from web appear on mobile within 2 seconds
- [ ] Admin-only fields (salary, roles) cannot be modified from mobile
- [ ] All validations match web app rules
- [ ] Audit trail tracks all profile changes
- [ ] No TypeScript errors
- [ ] All tests pass

**Note**: Offline queue functionality is deferred to future iteration (not in scope for initial implementation)

---

## Must Have / Must NOT Have

### Must Have
| Feature | Priority | Notes |
|---------|----------|-------|
| Profile data fetching (GET) | P0 | Must work on app load |
| Profile update API (PUT) | P0 | With field validation |
| Socket.IO sync listeners | P0 | For real-time updates |
| Form validation (Zod) | P0 | Match web app rules |
| Emergency contacts CRUD | P0 | Min 1, max 5 |
| Photo upload to Cloudinary | P1 | Via existing backend |
| Sync status indicator | P1 | Visual feedback |
| File structure verification | P0 | Confirm paths before implementation |

**Deferred to Future Iteration**: Offline queue (not in scope for v1)

### Must NOT Have
| Feature | Reason |
|---------|--------|
| Salary editing | Admin-only field |
| Role/department editing | Admin-only field |
| Editing other staff profiles | Self-service only |
| Employment status changes | Admin-only field |
| Staff number editing | System field |

---

## Task Flow and Dependencies

```
Phase 0: Pre-Implementation Verification         [0.5 days]
  |
  v
Phase 1: Foundation (Backend)                    [1-2 days]
  |
  v
Phase 2: Foundation (Mobile - Types/Services)   [1 day]
  |
  v
Phase 3: Profile Read & Sync                    [1 day]
  |
  v
Phase 4: Profile Edit Form                       [2 days]
  |
  v
Phase 5: Photo Upload                            [1 day]
  |
  v
Phase 6: Testing & Polish                        [1-2 days]
```

---

## Detailed TODOs

### Phase 0: Pre-Implementation Verification

#### Task 0.1: Verify File Structure
**Purpose**: Ensure all file paths in the plan are correct

**Actions**:
1. Verify `backend/routes/mobile.js` exists
2. Check if `backend/middleware/` directory exists, create if needed
3. Verify `backend/models/` directory exists
4. Check if `backend/socket/` or `backend/utils/` exists for socket handlers
5. Verify `staff-app/services/` exists and note exact structure
6. Check if `staff-app/types/` exists (create if not)
7. Verify `staff-app/hooks/` exists (create if not)
8. Check `staff-app/components/` structure

**Acceptance**:
- [ ] All directories confirmed or created
- [ ] Updated plan with any corrected paths
- [ ] Document any deviations from assumed structure

---

### Phase 1: Backend Foundation

#### Task 1.1: Create Staff Profile Update Endpoint
**File**: `backend/routes/mobile.js`

**Dependencies**: None (can start immediately)

**Implementation Steps**:
1. Add new route handler for `PUT /api/mobile/staff/:staffId/profile`
2. Import validation middleware
3. Extract editable fields from request body
4. Validate that staffId matches authenticated user (self-service only)
5. Update Staff document with only allowed fields
6. Emit socket event `staff_updated`
7. Create audit log entry
8. Return updated profile

**Key Functions**:
```javascript
// Add to routes/mobile.js
router.put('/staff/:staffId/profile', authenticate, async (req, res) => {
  // 1. Verify staffId matches authenticated user
  // 2. Extract allowed fields: phone, email, whatsappNumber, bloodGroup,
  //    maritalStatus, address, emergencyContacts, picture
  // 3. Validate each field
  // 4. Update document
  // 5. Emit socket event
  // 6. Log audit trail
});
```

**Acceptance Criteria**:
- [ ] Returns 403 if trying to edit another staff's profile
- [ ] Returns 400 if admin-only fields are included in request
- [ ] Returns 400 if validation fails
- [ ] Emits `staff_updated` event on success
- [ ] Creates audit log entry

---

#### Task 1.2: Create Field Validation Middleware
**File**: `backend/middleware/staffValidation.js` (NEW)
**Note**: Create `backend/middleware/` directory if it doesn't exist

**Dependencies**: None

**Implementation Steps**:
1. Create Zod-like validation schemas (or use existing `validation.js`)
2. Define allowed fields for self-service updates
3. Define validation rules matching web app
4. Export validation function

**Validation Rules** (from `school-dashboard/src/pages/staffs/AddStaff.jsx:145-191`):
```javascript
const profileUpdateSchema = {
  phone: { required: true, pattern: /^\d{10}$/ },
  email: { required: false, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  whatsappNumber: { required: false, pattern: /^\d{10}$/ },
  bloodGroup: { required: false, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  maritalStatus: { required: false, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
  address: { required: false, maxLength: 200 },
  emergencyContacts: {
    required: true,
    minItems: 1,
    maxItems: 5,
    itemSchema: {
      name: { required: true },
      relationship: { required: true },
      phone: { required: true, pattern: /^\d{10}$/ }
    }
  }
};
```

**Acceptance Criteria**:
- [ ] All validation rules match web app
- [ ] Returns detailed error messages
- [ ] Sanitizes input to prevent injection

---

#### Task 1.3: Add Socket Event for Staff Profile Updates
**File**: `backend/socket/chatHandler.js` or NEW `backend/socket/staffHandler.js`

**Dependencies**: Socket.IO server already initialized

**Implementation Steps**:
1. Create staff event handler module
2. Add handler for `staff_updated` event
3. Add `staff_updated` to `socketEmitter.js`
4. Register handler in `server.js`

**Socket Event Structure**:
```javascript
io.emit('staff_updated', {
  staffId: staff._id.toString(),
  fieldsChanged: ['phone', 'email'],
  timestamp: new Date().toISOString(),
  source: 'mobile_app' // or 'web_dashboard'
});
```

**Acceptance Criteria**:
- [ ] Event is broadcast to all connected clients
- [ ] Event includes staffId for filtering
- [ ] Event includes changed fields list
- [ ] Web dashboard can receive and process event

---

#### Task 1.4: Create Audit Log Model and Storage
**File**: `backend/models/StaffProfileAudit.js` (NEW)

**Dependencies**: MongoDB connection

**Implementation Steps**:
1. Create Mongoose schema for audit logs
2. Add indexes for efficient querying
3. Create helper function to log changes
4. Export model and helper

**Schema**:
```javascript
{
  timestamp: { type: Date, default: Date.now, required: true },
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  action: { type: String, enum: ['profile_update', 'photo_update'], required: true },
  fieldsChanged: [String],
  previousValues: Schema.Types.Mixed,
  newValues: Schema.Types.Mixed,
  source: { type: String, enum: ['mobile_app', 'web_dashboard'], required: true },
  ipAddress: String,
  userAgent: String
}
```

**Acceptance Criteria**:
- [ ] All profile changes are logged
- [ ] Logs can be queried by staffId and date range
- [ ] Logs store both old and new values

---

### Phase 2: Mobile Foundation

#### Task 2.1: Add New Dependencies
**File**: `staff-app/package.json`

**Dependencies**: None

**Commands**:
```bash
cd staff-app
npm install socket.io-client@4.8.3 react-hook-form zod @hookform/resolvers
npx expo install expo-image-picker expo-camera
```

**Changes to package.json**:
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

**Acceptance Criteria**:
- [ ] All packages install without errors
- [ ] TypeScript definitions are available
- [ ] No peer dependency warnings

---

#### Task 2.2: Create TypeScript Types for Staff Profile
**File**: `staff-app/types/staff.types.ts` (NEW)

**Dependencies**: None

**Implementation**:
```typescript
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface StaffProfile {
  id: string;
  name: string;
  code: string;
  role: string;
  email?: string;
  phone: string;
  whatsappNumber?: string;
  bloodGroup?: BloodGroup;
  maritalStatus?: MaritalStatus;
  address?: string;
  emergencyContacts: EmergencyContact[];
  picture?: string;
  updatedAt?: string;
}

export interface ProfileUpdateRequest {
  phone: string;
  email?: string;
  whatsappNumber?: string;
  bloodGroup?: BloodGroup;
  maritalStatus?: MaritalStatus;
  address?: string;
  emergencyContacts: EmergencyContact[];
  picture?: string;
}

export interface SyncStatus {
  connected: boolean;
  syncing: boolean;
  lastSync?: Date;
  error?: string;
}
```

**Acceptance Criteria**:
- [ ] All types match backend schema
- [ ] No TypeScript `any` types
- [ ] Exported types can be imported across app

---

#### Task 2.3: Create Zod Validation Schemas
**File**: `staff-app/services/validation.ts` (NEW)

**Dependencies**: `staff-app/types/staff.types.ts`

**Implementation**:
```typescript
import { z } from 'zod';
import type { BloodGroup, MaritalStatus } from '../types/staff.types';

export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits')
});

export const profileUpdateSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  whatsappNumber: z.string().regex(/^\d{10}$/, 'WhatsApp number must be 10 digits').optional().or(z.literal('')),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed']).optional(),
  address: z.string().max(200, 'Address must be under 200 characters').optional().or(z.literal('')),
  emergencyContacts: z.array(emergencyContactSchema)
    .min(1, 'At least one emergency contact is required')
    .max(5, 'Maximum 5 emergency contacts allowed'),
  picture: z.string().url().optional()
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
```

**Acceptance Criteria**:
- [ ] All validation rules match web app
- [ ] Error messages are user-friendly
- [ ] Schema can be used with React Hook Form

---

#### Task 2.4: Extend API Service with Profile Methods
**File**: `staff-app/services/api.ts` (MODIFY)

**Dependencies**: `staff-app/types/staff.types.ts`

**Add These Methods**:
```typescript
async getStaffProfile(staffId: string): Promise<StaffProfile> {
  const response = await this.fetchWithTimeout(
    `${API_URL}/mobile/staff/${staffId}/profile`,
    { headers: await this.getHeaders() }
  );
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
}

async updateStaffProfile(staffId: string, data: ProfileUpdateRequest): Promise<StaffProfile> {
  const response = await this.fetchWithTimeout(
    `${API_URL}/mobile/staff/${staffId}/profile`,
    {
      method: 'PUT',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update profile');
  }
  return response.json();
}

async uploadProfilePhoto(staffId: string, uri: string): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('photo', {
    uri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  } as any);

  const response = await this.fetchWithTimeout(
    `${API_URL}/mobile/staff/${staffId}/photo`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${await this.getToken()}`,
      },
      body: formData as any,
    }
  );
  if (!response.ok) throw new Error('Failed to upload photo');
  return response.json();
}
```

**Acceptance Criteria**:
- [ ] getStaffProfile returns full profile data
- [ ] updateStaffProfile sends only allowed fields
- [ ] uploadProfilePhoto handles multipart/form-data

---

#### Task 2.5: Add Staff Profile GET Endpoint to Backend
**File**: `backend/routes/mobile.js` (MODIFY)

**Dependencies**: None

**Add Route**:
```javascript
// Get staff profile for editing (self-service)
router.get('/staff/:staffId/profile', async (req, res) => {
  try {
    const { staffId } = req.params;

    const staff = await Staff.findById(staffId)
      .select('name code email phone whatsappNumber bloodGroup maritalStatus address emergencyContacts picture role updatedAt')
      .lean();

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    res.json({
      id: staff._id,
      name: staff.name,
      code: staff.code,
      role: staff.role,
      email: staff.email,
      phone: staff.phone,
      whatsappNumber: staff.whatsappNumber,
      bloodGroup: staff.bloodGroup,
      maritalStatus: staff.maritalStatus,
      address: staff.address,
      emergencyContacts: staff.emergencyContacts || [],
      picture: staff.picture,
      updatedAt: staff.updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Acceptance Criteria**:
- [ ] Returns only editable fields
- [ ] Does not return sensitive fields (salary, etc.)
- [ ] Returns 404 if staff not found

---

### Phase 3: Profile Read & Sync

#### Task 3.1: Add Staff Events to Socket Service
**File**: `staff-app/services/socketService.ts` (MODIFY)

**Dependencies**: Existing socketService.ts

**Changes**:
1. Add `'staff_updated'` to `SocketEvent` type union
2. Add handler for staff_updated events
3. Add method to subscribe to staff updates

```typescript
// Add to SocketEvent type:
type SocketEvent =
  // ... existing events
  | 'staff_updated'  // NEW

// Add method to SocketService class:
onStaffUpdated(callback: (data: {
  staffId: string;
  fieldsChanged: string[];
  timestamp: string;
  source: 'mobile_app' | 'web_dashboard';
}) => void): void {
  this.on('staff_updated', callback);
}
```

**Acceptance Criteria**:
- [ ] staff_updated event type is defined
- [ ] Callback receives event data
- [ ] Event is logged when received

---

#### Task 3.2: Create useStaffProfile Hook
**File**: `staff-app/hooks/useStaffProfile.ts` (NEW)

**Dependencies**: `staff-app/services/api.ts`, `staff-app/services/socketService.ts`

**Implementation**:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socketService from '../services/socketService';
import type { StaffProfile, SyncStatus } from '../types/staff.types';

export function useStaffProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: false,
    syncing: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setSyncStatus(prev => ({ ...prev, syncing: true }));
      const data = await api.getStaffProfile(user.id);
      setProfile(data);
      setSyncStatus({
        connected: socketService.isConnected(),
        syncing: false,
        lastSync: new Date(),
      });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setSyncStatus(prev => ({ ...prev, syncing: false, error: err.message }));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Listen for socket updates
  useEffect(() => {
    const handleStaffUpdate = (data: any) => {
      console.log('Profile updated via socket:', data);
      // Only refresh if it's our profile or a general update
      if (!user?.id || data.staffId === user.id || !data.staffId) {
        fetchProfile();
      }
    };

    socketService.onStaffUpdated(handleStaffUpdate);

    return () => {
      socketService.off('staff_updated', handleStaffUpdate);
    };
  }, [fetchProfile, user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update sync status based on socket connection
  useEffect(() => {
    const updateConnectionStatus = () => {
      setSyncStatus(prev => ({
        ...prev,
        connected: socketService.isConnected(),
      }));
    };

    updateConnectionStatus();
    socketService.on('authenticated', updateConnectionStatus);
    socketService.on('disconnected', updateConnectionStatus);

    return () => {
      socketService.off('authenticated', updateConnectionStatus);
      socketService.off('disconnected', updateConnectionStatus);
    };
  }, []);

  return {
    profile,
    syncStatus,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}
```

**Acceptance Criteria**:
- [ ] Fetches profile on mount
- [ ] Refreshes when socket event received
- [ ] Returns sync status
- [ ] Handles errors gracefully

---

#### Task 3.3: Create Sync Indicator Component
**File**: `staff-app/components/SyncIndicator.tsx` (NEW)

**Dependencies**: None

**Implementation**:
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SyncStatus } from '../types/staff.types';

interface Props {
  status: SyncStatus;
}

export function SyncIndicator({ status }: Props) {
  if (status.syncing) {
    return (
      <View style={styles.container}>
        <Ionicons name="sync" size={14} color="#FF9500" />
        <Text style={[styles.text, styles.syncing]}>Syncing...</Text>
      </View>
    );
  }

  if (status.error) {
    return (
      <View style={styles.container}>
        <Ionicons name="cloud-offline" size={14} color="#FF3B30" />
        <Text style={[styles.text, styles.error]}>Sync failed</Text>
      </View>
    );
  }

  if (!status.connected) {
    return (
      <View style={styles.container}>
        <Ionicons name="cloud-offline" size={14} color="#8E8E93" />
        <Text style={[styles.text, styles.offline]}>Offline</Text>
      </View>
    );
  }

  if (status.lastSync) {
    const timeAgo = Math.floor((Date.now() - status.lastSync.getTime()) / 1000 / 60);
    return (
      <View style={styles.container}>
        <Ionicons name="checkmark-circle" size={14} color="#34C759" />
        <Text style={[styles.text, styles.synced]}>
          Synced {timeAgo < 1 ? 'just now' : `${timeAgo}m ago`}
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontSize: 12,
  },
  syncing: {
    color: '#FF9500',
  },
  error: {
    color: '#FF3B30',
  },
  offline: {
    color: '#8E8E93',
  },
  synced: {
    color: '#34C759',
  },
});
```

**Acceptance Criteria**:
- [ ] Shows syncing state
- [ ] Shows error state
- [ ] Shows offline state
- [ ] Shows last sync time

---

### Phase 4: Profile Edit Form

#### Task 4.1: Create Profile Form Field Component
**File**: `staff-app/components/ProfileFormField.tsx` (NEW)

**Dependencies**: React Hook Form

**Implementation**:
```typescript
import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

interface Props<T extends FieldValues> extends TextInputProps {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  error?: string;
  required?: boolean;
}

export function ProfileFormField<T extends FieldValues>({
  control,
  name,
  label,
  error,
  required = false,
  ...inputProps
}: Props<T>) {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, error && styles.inputError]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholderTextColor="#8E8E93"
            {...inputProps}
          />
        )}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222222',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#222222',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
});
```

**Acceptance Criteria**:
- [ ] Works with React Hook Form
- [ ] Shows label and error
- [ ] Handles all TextInput props
- [ ] Type-safe with generic

---

#### Task 4.2: Create Emergency Contact Item Component
**File**: `staff-app/components/EmergencyContactItem.tsx` (NEW)

**Dependencies**: React Hook Form

**Implementation**:
```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFieldArray, Control, FieldValues, Path } from 'react-hook-form';
import { ProfileFormField } from './ProfileFormField';
import type { EmergencyContact } from '../types/staff.types';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  onRemove?: (index: number) => void;
  canRemove?: boolean;
}

export function EmergencyContactItem<T extends FieldValues>({
  control,
  name,
  onRemove,
  canRemove = true,
}: Props<T>) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Contact</Text>
        {canRemove && onRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
      <ProfileFormField
        control={control}
        name={`${name}.name` as Path<T>}
        label="Contact Name"
        placeholder="Full name"
      />
      <ProfileFormField
        control={control}
        name={`${name}.relationship` as Path<T>}
        label="Relationship"
        placeholder="e.g., Spouse, Parent"
      />
      <ProfileFormField
        control={control}
        name={`${name}.phone` as Path<T>}
        label="Phone Number"
        placeholder="10-digit number"
        keyboardType="phone-pad"
        maxLength={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  removeButton: {
    padding: 4,
  },
});
```

**Acceptance Criteria**:
- [ ] Shows all three fields (name, relationship, phone)
- [ ] Can be removed if allowed
- [ ] Validates each field independently

---

#### Task 4.3: Create Edit Profile Screen
**File**: `staff-app/app/edit-profile.tsx` (NEW)

**Dependencies**: ProfileFormField, EmergencyContactItem, validation

**Implementation**:
```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useStaffProfile } from '../hooks/useStaffProfile';
import { ProfileFormField } from '../components/ProfileFormField';
import { EmergencyContactItem } from '../components/EmergencyContactItem';
import { SyncIndicator } from '../components/SyncIndicator';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileUpdateSchema } from '../services/validation';
import type { ProfileUpdateFormData, EmergencyContact } from '../services/validation';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'] as const;

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, syncStatus, refetch } = useStaffProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);
  const [showMaritalStatusPicker, setShowMaritalStatusPicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      phone: '',
      email: '',
      whatsappNumber: '',
      bloodGroup: undefined,
      maritalStatus: undefined,
      address: '',
      emergencyContacts: [{ name: '', relationship: '', phone: '' }],
    },
  });

  // Reset form when profile data loads
  React.useEffect(() => {
    if (profile) {
      reset({
        phone: profile.phone || '',
        email: profile.email || '',
        whatsappNumber: profile.whatsappNumber || '',
        bloodGroup: profile.bloodGroup,
        maritalStatus: profile.maritalStatus,
        address: profile.address || '',
        emergencyContacts: profile.emergencyContacts?.length > 0
          ? profile.emergencyContacts
          : [{ name: '', relationship: '', phone: '' }],
      });
    }
  }, [profile, reset]);

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control,
    name: 'emergencyContacts',
  });

  const onSubmit = async (data: ProfileUpdateFormData) => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      await api.updateStaffProfile(user.id, data);
      await refetch();
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile && !syncStatus.error) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E31C5F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#222222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.syncContainer}>
          <SyncIndicator status={syncStatus} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <ProfileFormField
            control={control}
            name="phone"
            label="Phone Number"
            placeholder="10-digit number"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phone?.message}
            required
          />
          <ProfileFormField
            control={control}
            name="email"
            label="Email"
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
          />
          <ProfileFormField
            control={control}
            name="whatsappNumber"
            label="WhatsApp Number"
            placeholder="10-digit number"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.whatsappNumber?.message}
          />
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Text style={styles.label}>Blood Group</Text>
          <View style={styles.pickerContainer}>
            {BLOOD_GROUPS.map((group) => {
              const isSelected = control._formValues?.bloodGroup === group;
              return (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.pickerOption,
                    isSelected && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setValue('bloodGroup', group)}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    isSelected && styles.pickerOptionTextSelected,
                  ]}>
                    {group}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Marital Status</Text>
          <View style={styles.pickerContainer}>
            {MARITAL_STATUSES.map((status) => {
              const isSelected = control._formValues?.maritalStatus === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.pickerOption,
                    isSelected && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setValue('maritalStatus', status)}
                >
                <Text style={[
                  styles.pickerOptionText,
                  isSelected && styles.pickerOptionTextSelected,
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ProfileFormField
            control={control}
            name="address"
            label="Address"
            placeholder="Your address"
            multiline
            numberOfLines={3}
            error={errors.address?.message}
          />
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <Text style={styles.sectionHint}>(at least 1 required)</Text>
          </View>
          {contactFields.map((field, index) => (
            <EmergencyContactItem
              key={field.id}
              control={control}
              name={`emergencyContacts.${index}` as any}
              onRemove={() => contactFields.length > 1 && removeContact(index)}
              canRemove={contactFields.length > 1}
            />
          ))}
          {contactFields.length < 5 && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => appendContact({ name: '', relationship: '', phone: '' })}
            >
              <Ionicons name="add-circle" size={20} color="#E31C5F" />
              <Text style={styles.addButtonText}>Add Emergency Contact</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Error Display */}
        {errors.emergencyContacts && (
          <Text style={styles.errorText}>{errors.emergencyContacts.message}</Text>
        )}

        <View style={styles.footer} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={[styles.saveButton, (!isDirty || isSaving) && styles.saveButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    textAlign: 'center',
  },
  syncContainer: {
    position: 'absolute',
    right: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
  },
  sectionHint: {
    fontSize: 14,
    color: '#717171',
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222222',
    marginBottom: 8,
    marginTop: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  pickerOptionSelected: {
    backgroundColor: '#E31C5F',
    borderColor: '#E31C5F',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#222222',
  },
  pickerOptionTextSelected: {
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFF0F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E31C5F',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E31C5F',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  footer: {
    height: 100,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
  },
  saveButton: {
    backgroundColor: '#E31C5F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#DDDDDD',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

**Acceptance Criteria**:
- [ ] All form fields render correctly
- [ ] Validation errors show inline
- [ ] Save button is disabled when no changes
- [ ] Save shows loading indicator
- [ ] Shows alert on success/error
- [ ] Navigates back on successful save

---

### Phase 5: Photo Upload

#### Task 5.1: Create Profile Photo Screen
**File**: `staff-app/app/profile-photo.tsx` (NEW)

**Dependencies**: expo-image-picker, expo-camera

**Implementation Steps**:
1. Create screen with image preview
2. Add "Choose from Gallery" button
3. Add "Take Photo" button
4. Handle permissions
5. Upload to backend
6. Update profile on success

**Key Code**:
```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { useStaffProfile } from '../hooks/useStaffProfile';

export default function ProfilePhotoScreen() {
  const router = useRouter();
  const { profile, refetch } = useStaffProfile();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async (source: 'library' | 'camera') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadPhoto = async () => {
    if (!selectedImage || !profile?.id) return;

    try {
      setIsUploading(true);
      await api.uploadProfilePhoto(profile.id, selectedImage);
      await refetch();
      Alert.alert('Success', 'Profile photo updated');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Image preview */}
      <View style={styles.imageContainer}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.image} />
        ) : profile?.picture ? (
          <Image source={{ uri: profile.picture }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="person" size={80} color="#DDDDDD" />
          </View>
        )}
      </View>

      {/* Buttons */}
      <TouchableOpacity style={styles.button} onPress={() => pickImage('library')}>
        <Ionicons name="images" size={24} color="#E31C5F" />
        <Text style={styles.buttonText}>Choose from Gallery</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => pickImage('camera')}>
        <Ionicons name="camera" size={24} color="#E31C5F" />
        <Text style={styles.buttonText}>Take Photo</Text>
      </TouchableOpacity>

      {/* Upload button */}
      {selectedImage && (
        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={uploadPhoto}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>Upload Photo</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
```

**Acceptance Criteria**:
- [ ] Can choose photo from gallery
- [ ] Can take photo with camera
- [ ] Image preview shows selected photo
- [ ] Upload shows progress indicator
- [ ] Permissions handled correctly
- [ ] 2MB file size limit enforced

---

#### Task 5.2: Add Photo Upload Endpoint to Backend
**File**: `backend/routes/mobile.js` (MODIFY)

**Implementation**:
```javascript
// Upload profile photo
router.post('/staff/:staffId/photo',
  authenticate,
  upload.single('photo'),
  async (req, res) => {
    try {
      const { staffId } = req.params;

      // Verify self-service (can only upload own photo)
      if (req.user?.id !== staffId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }

      let photoUrl = req.body.picture; // Base64 fallback

      if (req.file) {
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'staff-photos',
              public_id: `staff-${staffId}`,
              overwrite: true,
              transformation: [
                { width: 300, height: 300, crop: 'fill' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });
        photoUrl = result.secure_url;
      }

      // Update staff document
      const staff = await Staff.findByIdAndUpdate(
        staffId,
        { picture: photoUrl },
        { new: true }
      );

      // Emit socket event
      const io = req.app.get('io');
      io.emit('staff_updated', {
        staffId,
        fieldsChanged: ['picture'],
        timestamp: new Date().toISOString(),
        source: 'mobile_app'
      });

      res.json({ url: photoUrl });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

**Acceptance Criteria**:
- [ ] Accepts multipart/form-data
- [ ] Uploads to Cloudinary
- [ ] Emits staff_updated event
- [ ] Returns new photo URL

---

#### Task 5.3: Add Camera Permissions to app.json
**File**: `staff-app/app.json` (MODIFY)

**Add to** `expo` config:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera for profile photos.",
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos for profile pictures."
        }
      ]
    ]
  }
}
```

**Acceptance Criteria**:
- [ ] iOS camera permission added
- [ ] iOS photos permission added
- [ ] Android permissions configured

---

### Phase 6: Testing & Polish

#### Task 6.1: Update Profile Screen to Add Edit Button
**File**: `staff-app/app/(tabs)/profile.tsx` (MODIFY)

**Changes**:
1. Add edit button in header or quick actions
2. Add photo button with icon
3. Navigate to edit screens
4. Show sync indicator

**Add to Quick Actions**:
```typescript
<ActionRow
  icon="create-outline"
  label="Edit Profile"
  onPress={() => router.push('/edit-profile')}
/>
<ActionRow
  icon="camera-outline"
  label="Change Photo"
  onPress={() => router.push('/profile-photo')}
/>
```

**Acceptance Criteria**:
- [ ] Edit button navigates to edit screen
- [ ] Photo button navigates to photo screen
- [ ] Sync indicator visible

---

#### Task 6.2: Test Real-Time Sync Flow
**Manual Testing Checklist**:

1. **Web to Mobile Sync**:
   - [ ] Change profile on web dashboard
   - [ ] Verify change appears on mobile within 2 seconds
   - [ ] Check sync indicator updates

2. **Mobile to Web Sync**:
   - [ ] Change profile on mobile
   - [ ] Verify change appears on web dashboard within 2 seconds
   - [ ] Check socket event is emitted

3. **Simultaneous Edit Conflict**:
   - [ ] Edit same field on both devices
   - [ ] Verify last-write-wins behavior
   - [ ] Check audit log records both changes

4. **Network Failure**:
   - [ ] Turn off network
   - [ ] Make profile change
   - [ ] Verify appropriate error message
   - [ ] Turn on network
   - [ ] Verify reconnection works

---

#### Task 6.3: Security Validation
**Security Tests**:

1. **Field Authorization**:
   - [ ] Attempt to modify `salary` from mobile (should fail)
   - [ ] Attempt to modify `roles` from mobile (should fail)
   - [ ] Attempt to modify `department` from mobile (should fail)

2. **Cross-User Access**:
   - [ ] Try to edit another staff's profile (should fail)
   - [ ] Verify staffId validation

3. **Input Validation**:
   - [ ] Test XSS payloads in text fields
   - [ ] Test SQL injection patterns
   - [ ] Test overly long inputs

4. **Authentication**:
   - [ ] Test with expired token
   - [ ] Test with invalid token
   - [ ] Test without token

---

## File-by-File Summary

### New Files to Create

| File | Purpose | Key Components |
|------|---------|----------------|
| `backend/middleware/staffValidation.js` | Field validation middleware | Validation schemas, sanitize function |
| `backend/models/StaffProfileAudit.js` | Audit log model | Mongoose schema, indexes |
| `backend/socket/staffHandler.js` | Staff socket events | staff_updated handler |
| `staff-app/types/staff.types.ts` | TypeScript types | StaffProfile, ProfileUpdateRequest, SyncStatus (may be merged into existing api.types.ts) |
| `staff-app/services/validation.ts` | Zod schemas | profileUpdateSchema, emergencyContactSchema |
| `staff-app/hooks/useStaffProfile.ts` | Profile data hook | useStaffProfile, fetchProfile, socket listener |
| `staff-app/components/SyncIndicator.tsx` | Sync status UI | SyncIndicator component |
| `staff-app/components/ProfileFormField.tsx` | Form input component | ProfileFormField with RHF |
| `staff-app/components/EmergencyContactItem.tsx` | Contact editor | EmergencyContactItem component |
| `staff-app/app/edit-profile.tsx` | Edit profile screen | Full edit form with all fields |
| `staff-app/app/profile-photo.tsx` | Photo upload screen | Gallery/camera picker, upload |

### Files to Modify

| File | Changes | Dependencies |
|--------|---------|--------------|
| `backend/routes/mobile.js` | Add GET/PUT profile endpoints, photo upload | Staff model, socket emitter |
| `backend/utils/socketEmitter.js` | Add emitStaffUpdate helper | Socket.IO instance |
| `staff-app/package.json` | Add new dependencies | NPM packages |
| `staff-app/app.json` | Add camera/photo permissions | Expo plugins |
| `staff-app/services/api.ts` | Add profile methods | Existing API service |
| `staff-app/services/socketService.ts` | Add staff_updated event | Existing socket service |
| `staff-app/app/(tabs)/profile.tsx` | Add edit buttons | Navigation |

---

## Validation Points

### After Phase 1 (Backend Foundation)
- [ ] GET endpoint returns profile data
- [ ] PUT endpoint accepts valid data
- [ ] PUT endpoint rejects invalid data
- [ ] PUT endpoint rejects admin-only fields
- [ ] Socket event is emitted on update
- [ ] Audit log entries are created

### After Phase 2 (Mobile Foundation)
- [ ] All TypeScript compiles without errors
- [ ] Zod schemas match backend validation
- [ ] API methods can be called successfully
- [ ] Types are exported correctly

### After Phase 3 (Profile Read & Sync)
- [ ] Profile loads on app open
- [ ] Socket events are received
- [ ] Profile updates when event received
- [ ] Sync indicator shows correct status

### After Phase 4 (Profile Edit Form)
- [ ] Form renders with all fields
- [ ] Validation works for all fields
- [ ] Form submission succeeds
- [ ] Form submission fails appropriately
- [ ] Emergency contacts can be added/removed

### After Phase 5 (Photo Upload)
- [ ] Gallery picker opens
- [ ] Camera opens
- [ ] Selected image displays
- [ ] Upload succeeds
- [ ] Upload fails appropriately

### After Phase 6 (Testing & Polish)
- [ ] All manual tests pass
- [ ] All security tests pass
- [ ] Real-time sync works bidirectionally
- [ ] No console errors
- [ ] App passes TypeScript strict check

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Profile sync latency | < 2 seconds from update to reflection |
| Data consistency | 100% match between mobile and web |
| Validation accuracy | 100% match with web app rules |
| Security compliance | 0 unauthorized field edits |
| Error handling | Clear user messages for all failures |
| Offline resilience | Graceful degradation, no data loss |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Socket connection drops | Auto-reconnect with exponential backoff |
| Simultaneous edits | Last-write-wins with audit trail |
| Photo upload failures | Retry logic with fallback to base64 |
| Validation mismatch | Shared validation constants doc |
| Offline data loss | Queue operations for later sync |

---

## Open Questions for User

1. **Offline queue priority**: Should offline edits be queued and synced automatically, or should user manually retry?
2. **Profile photo compression**: What quality level for uploaded photos? (Recommended: 80% quality, 300x300px)
3. **Conflict resolution behavior**: Should simultaneous edits prompt user or auto-merge with last-write-wins?
4. **Audit log retention**: How long should audit logs be kept? (Recommended: 1 year)

---

*Generated by Prometheus - Strategic Planning Consultant*
*Date: 2026-02-07*
*Reference: .omc/autopilot/spec.md*
