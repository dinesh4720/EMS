# Staff Mobile App - Code Analysis Report

**Date:** 2026-02-02
**Analyzed Files:**
- Backend: `homework.js`, `teacherLeaves.js`, `mobile.js`
- Frontend: `index.tsx`, `attendance.tsx`, `homework.tsx`, `profile.tsx`, `timetable.tsx`, `api.ts`, `AuthContext.tsx`

---

## Summary Score: 6.5/10

| Category | Status | Score |
|----------|--------|-------|
| Component Size | ⚠️ Partial | 7/10 |
| Hook Dependencies | ✅ Pass | 9/10 |
| Props Interface | ⚠️ Partial | 7/10 |
| Error Handling | ⚠️ Partial | 6/10 |
| State Management | ⚠️ Partial | 6/10 |
| API Layer | ✅ Good | 8/10 |
| Security | ⚠️ Needs Work | 5/10 |
| Code Organization | ⚠️ Partial | 7/10 |

---

## Detailed Findings

### 1. Component Size Rule (Rule 1.1)

**Status:** ✅ **PASS** - All components under 300 lines

| File | Lines | Status |
|------|-------|--------|
| `app/(tabs)/index.tsx` (Dashboard) | ~220 | ✅ Pass |
| `app/(tabs)/attendance.tsx` | ~280 | ✅ Pass |
| `app/(tabs)/homework.tsx` | ~260 | ✅ Pass |
| `app/(tabs)/profile.tsx` | ~180 | ✅ Pass |
| `app/(tabs)/timetable.tsx` | ~120 | ✅ Pass |

---

### 2. Hook Dependencies Rule (Rule 2.1)

**Status:** ✅ **PASS** - Dependencies are properly declared

```typescript
// ✅ GOOD: dashboard/index.tsx - Complete dependencies
useEffect(() => {
  loadDashboard();
}, [user]); // user is included
```

**Issues Found:**
- ⚠️ `attendance.tsx` - The `loadDashboard` function is not in dependencies but defined inside component
- ⚠️ `profile.tsx` - The `loadLeaves` function is not in dependencies

**Recommended Fix:**
```typescript
// Wrap in useCallback
const loadDashboard = useCallback(async () => {
  // ...
}, [user?.id]);

useEffect(() => {
  loadDashboard();
}, [loadDashboard]);
```

---

### 3. Props Interface Rule (Rule 1.4)

**Status:** ⚠️ **PARTIAL** - Some components missing explicit props

| Component | Props Defined | Status |
|-----------|--------------|--------|
| `DashboardScreen` | N/A (no props) | ✅ Pass |
| `HomeworkScreen` | N/A (no props) | ✅ Pass |
| `ClassAttendance` | ✅ Explicit | ✅ Pass |
| `LeaveApplicationModal` | ✅ Explicit | ✅ Pass |
| `StudentRemarksModal` | ✅ Explicit | ✅ Pass |

**Missing:**
- `SelfAttendance` component has implicit props

---

### 4. Error Handling (Rule 4.2)

**Status:** ⚠️ **NEEDS IMPROVEMENT**

**Issues Found:**

#### Frontend - Missing User Feedback:
```typescript
// ❌ BAD: Only console.error
catch (error) {
  console.error('Error loading dashboard:', error);
  // No user feedback!
}
```

**Recommended Fix:**
```typescript
// ✅ GOOD: Show user-friendly error
catch (error) {
  console.error('Error loading dashboard:', error);
  Alert.alert('Error', 'Failed to load dashboard. Please try again.');
}
```

#### Backend - Generic Error Messages:
```javascript
// ⚠️ OKAY but could be better
catch (error) {
  res.status(500).json({ error: error.message });
}
```

**Recommended Fix:**
```javascript
// ✅ GOOD: Specific error codes
catch (error) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}
```

---

### 5. State Management (Rule 5.1)

**Status:** ⚠️ **NEEDS IMPROVEMENT**

**Issues:**

1. **Missing Server State Separation:**
   - Currently using `useState` for all data
   - No caching mechanism
   - No stale-time handling

2. **Recommended: Use React Query / TanStack Query**
```typescript
// ✅ GOOD: React Query pattern
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useDashboard(teacherId: string) {
  return useQuery({
    queryKey: ['dashboard', teacherId],
    queryFn: () => api.getDashboardData(teacherId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

### 6. API Layer Standards (Rule 8)

**Status:** ✅ **GOOD** - Centralized API client

**Pros:**
- ✅ Single `APIService` class
- ✅ Centralized token management
- ✅ Consistent error handling
- ✅ TypeScript interfaces for responses

**Issues:**
- ⚠️ Missing request/response interceptors
- ⚠️ No retry logic for failed requests
- ⚠️ No request timeout handling
- ⚠️ Using `fetch` instead of axios with interceptors

**Recommended Enhancement:**
```typescript
// ✅ GOOD: Add interceptors
class APIService {
  private async request(endpoint: string, options: RequestInit) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(endpoint, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(error.message || 'Request failed', response.status);
      }

      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }
}
```

---

### 7. Security Best Practices (Rule 11)

**Status:** ⚠️ **NEEDS IMPROVEMENT**

**Issues Found:**

#### 1. Token Storage (Rule 11.3)
```typescript
// ⚠️ ACCEPTABLE: Using AsyncStorage (better than localStorage)
await AsyncStorage.getItem('user_token');
```

**Better approach:** Use Expo SecureStore consistently (already installed):
```typescript
// ✅ GOOD: Use SecureStore for tokens
import * as SecureStore from 'expo-secure-store';

const token = await SecureStore.getItemAsync('user_token');
```

#### 2. Input Validation Missing (Rule 11.4)
```typescript
// ❌ BAD: No validation
async markTeacherAttendance(teacherId: string, data: { status: string; inTime?: string; outTime?: string }) {
  // No validation of data!
  const response = await fetch(...);
}
```

**Recommended Fix:**
```typescript
// ✅ GOOD: Validate inputs
const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'half-day'] as const;
type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

async markTeacherAttendance(teacherId: string, data: { status: AttendanceStatus; inTime?: string; outTime?: string }) {
  if (!ATTENDANCE_STATUSES.includes(data.status as any)) {
    throw new Error('Invalid attendance status');
  }
  // ...
}
```

#### 3. No XSS Prevention (Rule 11.1)
```typescript
// ⚠️ OK: React Native is less vulnerable to XSS than web
// But still need to sanitize if displaying rich text from users
```

#### 4. Backend - Missing Authentication on Some Routes
```javascript
// ❌ BAD: Public route without auth
router.get('/class/:classId', async (req, res) => { // No authenticate middleware!
```

**Fix:**
```javascript
// ✅ GOOD: Add authentication
router.get('/class/:classId', authenticate, async (req, res) => {
  // ...
});
```

---

### 8. Code Organization (Rule 10)

**Status:** ⚠️ **PARTIAL** - Structure needs improvement

**Current Structure:**
```
staff-app/
├── app/              # File-based routing ✅
├── components/       # Shared components ✅
├── context/          # Context providers ✅
└── services/         # API layer ✅
```

**Missing:** Feature-based structure (Rule 1.2)

**Recommended Structure:**
```
staff-app/
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api.ts
│   ├── homework/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api.ts
│   └── attendance/
│       ├── components/
│       ├── hooks/
│       └── api.ts
```

---

### 9. TypeScript Usage

**Status:** ⚠️ **PARTIAL** - Using `any` too much

**Issues:**
```typescript
// ❌ BAD: Using `any`
timetable: any[];
substitutions: any[];
gatePasses: any[];

// ✅ GOOD: Proper types
interface TimetablePeriod {
  periodIndex: number;
  classId: { name: string; section: string };
  subject: string;
  room: string;
}
timetable: TimetablePeriod[];
```

---

### 10. Import Order (Rule 10.1)

**Status:** ✅ **PASS** - Generally good

**Example from `api.ts`:**
```typescript
// ✅ GOOD: Proper order
// 1. Third-party libraries
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosResponse } from 'axios'; // ⚠️ Imported but not used

// 2. Local types/interfaces
interface DashboardData { ... }

// 3. Local exports
class APIService { ... }
```

---

## Critical Issues to Fix

### Priority 1 (High)

1. **Add User-Friendly Error Messages**
   - Replace all `console.error` with `Alert.alert`
   - Show loading indicators for all async operations

2. **Fix Missing Authentication**
   - Add `authenticate` middleware to public routes in backend
   - Verify all endpoints require proper auth

3. **Remove `any` Types**
   - Define proper TypeScript interfaces
   - Use strict type checking

### Priority 2 (Medium)

4. **Add Input Validation**
   - Validate all API inputs
   - Use Zod or similar for schema validation

5. **Fix Hook Dependencies**
   - Use `useCallback` for functions in useEffect
   - Add exhaustive dependencies

6. **Implement Request Timeouts**
   - Add AbortController to fetch requests
   - Handle network errors gracefully

### Priority 3 (Low)

7. **Add Server State Management**
   - Implement React Query for caching
   - Add optimistic updates

8. **Reorganize to Feature-Based Structure**
   - Group components by feature
   - Create feature-specific hooks

---

## File-Specific Issues

### `staff-app/services/api.ts`

| Issue | Line | Severity |
|-------|------|----------|
| Unused import `AxiosResponse` | 3 | Low |
| No request timeout | All | Medium |
| No retry logic | All | Low |
| Generic error messages | All | Low |

### `backend/routes/homework.js`

| Issue | Line | Severity |
|-------|------|----------|
| Missing `authenticate` on GET `/class/:classId` | 28 | **High** |
| Generic error messages | 23, 44, 63 | Medium |
| No input validation | 69 | Medium |

### `staff-app/app/(tabs)/index.tsx`

| Issue | Line | Severity |
|-------|------|----------|
| Missing error Alert | 48 | Medium |
| Missing user feedback on attendance | 73 | Medium |
| Using `any[]` for timetable | 29-33 | Low |

---

## Recommended Next Steps

1. **Create TypeScript types file:**
   ```typescript
   // staff-app/types/api.types.ts
   export interface TimetablePeriod {
     periodIndex: number;
     classId: ClassInfo;
     subject: string;
     room: string;
   }
   // ... other types
   ```

2. **Add error boundary component:**
   ```typescript
   // staff-app/components/ErrorBoundary.tsx
   ```

3. **Create validation schemas:**
   ```typescript
   // staff-app/utils/validation.ts
   import { z } from 'zod';
   export const attendanceSchema = z.object({
     status: z.enum(['present', 'absent', 'late']),
     inTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
   });
   ```

4. **Add API error handler:**
   ```typescript
   // staff-app/utils/errorHandler.ts
   export const handleApiError = (error: Error) => {
     if (error.message.includes('timeout')) {
       return 'Request timeout. Please check your connection.';
     }
     // ... other cases
   };
   ```

---

## Conclusion

The code is **functional and well-structured** but needs improvements in:
1. Error handling with user feedback
2. TypeScript strict typing
3. Input validation
4. Security (auth middleware on public routes)

**Overall Grade: 6.5/10** - Good foundation, needs refinement for production.

**Estimated time to fix all issues: 4-6 hours**
