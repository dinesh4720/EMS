# Task 17: API Service Layer Updates - Implementation Summary

## Overview
Updated the frontend API service layer to support the timetable management system with enhanced error handling for conflict detection and validation errors.

## Changes Made

### 1. Enhanced Error Handling in `school-dashboard/src/services/api.js`

#### Conflict Error Handling (409 Status)
- Added specific handling for HTTP 409 (Conflict) responses
- Creates structured `ConflictError` objects with:
  - `type`: 'ConflictError'
  - `message`: Error message
  - `details`: Detailed conflict information
  - `status`: 409

```javascript
if (response.status === 409) {
  const conflictError = new Error(error.message || error.error || 'Conflict detected');
  conflictError.type = 'ConflictError';
  conflictError.details = error.details || error;
  conflictError.status = 409;
  throw conflictError;
}
```

### 2. Updated API Methods

#### classesApi
- ✅ `getSettings(id)` - Already implemented
- ✅ `updateTag(id, tag)` - Enhanced with validation error handling
- ✅ `updateSubjects(id, subjects)` - Enhanced with validation error handling

Both methods now catch and re-throw validation errors (400 status) with structured error objects.

#### teacherAssignmentsApi
- ✅ `getAll(teacherId)` - Already implemented
- ✅ `create(data)` - Enhanced with validation error handling
- ✅ `update(id, data)` - Enhanced with validation error handling
- ✅ `delete(id, teacherId)` - Already implemented
- ✅ `getAvailableTeachers(params)` - Already implemented

#### teacherTimetableApi
- ✅ `get(teacherId, academicYear)` - Already implemented
- ✅ `create(teacherId, data)` - Already implemented
- ✅ `updateSlot(teacherId, data)` - Enhanced with conflict error handling
- ✅ `getConflicts(teacherId, academicYear)` - Already implemented
- ✅ `switchClass(teacherId, data)` - Enhanced with conflict error handling

#### timetableApi
- ✅ `getByClass(classId, academicYear)` - Already implemented
- ✅ `createOrUpdate(data)` - Already implemented
- ✅ `updateSlot(classId, data)` - Enhanced with conflict error handling
- ✅ `updatePeriods(classId, data)` - Already implemented
- ✅ `delete(classId, academicYear)` - Already implemented

### 3. Updated Default Export
Added `teacherAssignmentsApi` and `teacherTimetableApi` to the default export object for consistency.

### 4. Updated AppContext (`school-dashboard/src/context/AppContext.jsx`)
- Added `teacherTimetableApi` to imports
- Added `teacherTimetableApi` to the context value object
- Now both `teacherAssignmentsApi` and `teacherTimetableApi` are available via `useApp()` hook

### 5. Enhanced Component Error Handling

#### Timetable.jsx
Updated error handling to check for `err.type === 'ConflictError'` instead of string matching:
```javascript
if (err.type === 'ConflictError') {
  setConflicts([{
    type: 'conflict_error',
    message: err.message,
    details: err.details
  }]);
}
```

#### TeacherTimetableEditor.jsx
Enhanced error handling to distinguish between different error types:
```javascript
if (err.type === 'ConflictError') {
  alert('Conflict Error: ' + err.message + ...);
} else if (err.type === 'ValidationError') {
  alert('Validation Error: ' + err.message);
} else {
  alert('Failed to update slot: ' + err.message);
}
```

## Error Types Supported

### ConflictError (409)
- Thrown when teacher double-booking is detected
- Thrown when unqualified teacher assignment is attempted
- Contains detailed conflict information in `details` property

### ValidationError (400)
- Thrown when input validation fails
- Thrown when required fields are missing
- Contains validation details in `details` property

### Rate Limit Error (429)
- Already implemented
- Thrown when too many requests are made

### Unauthorized Error (401)
- Already implemented
- Automatically clears session storage

## API Method Signatures

### Class Settings
```javascript
classesApi.getSettings(classId)
classesApi.updateTag(classId, tag)
classesApi.updateSubjects(classId, subjects)
```

### Teacher Assignments
```javascript
teacherAssignmentsApi.getAll(teacherId)
teacherAssignmentsApi.create({ teacherId, subject, classes })
teacherAssignmentsApi.update(id, data)
teacherAssignmentsApi.delete(id, teacherId)
teacherAssignmentsApi.getAvailableTeachers({ classId, subject, day, period })
```

### Teacher Timetable
```javascript
teacherTimetableApi.get(teacherId, academicYear)
teacherTimetableApi.create(teacherId, data)
teacherTimetableApi.updateSlot(teacherId, { day, periodIndex, classId, subject, room })
teacherTimetableApi.getConflicts(teacherId, academicYear)
teacherTimetableApi.switchClass(teacherId, { day, periodIndex, oldClassId, newClassId })
```

### Class Timetable
```javascript
timetableApi.getByClass(classId, academicYear)
timetableApi.createOrUpdate(data)
timetableApi.updateSlot(classId, { day, periodIndex, subject, teacherId, room })
timetableApi.updatePeriods(classId, periods)
timetableApi.delete(classId, academicYear)
```

## Testing Recommendations

1. Test conflict error handling by attempting to assign a teacher to multiple classes at the same time
2. Test validation error handling by submitting invalid data (empty fields, wrong types)
3. Test that error details are properly displayed in the UI
4. Verify that all API methods are accessible via the `useApp()` hook
5. Test error recovery and retry mechanisms

## Files Modified

1. `school-dashboard/src/services/api.js` - Enhanced error handling and API methods
2. `school-dashboard/src/context/AppContext.jsx` - Added teacherTimetableApi to context
3. `school-dashboard/src/pages/classes/Timetable.jsx` - Updated error handling
4. `school-dashboard/src/pages/staffs/TeacherTimetableEditor.jsx` - Updated error handling

## Verification

All files pass diagnostics with no syntax errors or type issues.

## Next Steps

- Task 18: Implement error handling and user feedback (toast notifications, error dialogs)
- Task 19: Add permission checks and authorization
- Task 20: Checkpoint - Ensure all tests pass
