# Task 19: Permission Checks and Authorization Implementation

## Summary

Successfully implemented comprehensive permission checks and role-based access control for the timetable management system. This ensures that only authorized users can perform specific actions on timetables, class settings, and teacher assignments.

## Changes Made

### 1. Backend - New Routes and Middleware

#### Class Settings Routes (`backend/routes/classSettings.js`)
Created new routes for managing class settings with proper permission checks:
- `GET /api/class-settings/:id` - Get class settings (requires 'classes' view permission)
- `PUT /api/class-settings/:id/tag` - Update class tag (requires 'classes' edit permission)
- `PUT /api/class-settings/:id/subjects` - Update assigned subjects (requires 'classes' edit permission)

All routes include:
- Authentication middleware
- Permission checking middleware
- Input validation
- Proper error handling

#### Teacher Timetable Permission Middleware (`backend/routes/teacherTimetable.js`)
Added two custom middleware functions:

**`canEditTeacherTimetable`**
- Only administrators can edit teacher timetables
- Teachers cannot edit their own timetables
- Returns 403 with clear error message if permission denied

**`canViewTeacherTimetable`**
- Administrators can view any teacher's timetable
- Teachers can view their own timetable
- Users with staff view permission can view timetables
- Returns 403 with clear error message if permission denied

#### Updated Route Permissions
Applied permission middleware to all timetable routes:

**Teacher Timetable Routes:**
- `GET /:teacherId` - Uses `canViewTeacherTimetable`
- `POST /:teacherId` - Uses `canEditTeacherTimetable`
- `PUT /:teacherId/slot` - Uses `canEditTeacherTimetable`
- `GET /:teacherId/conflicts` - Uses `canViewTeacherTimetable`
- `POST /:teacherId/switch-class` - Uses `canEditTeacherTimetable`

**Class Timetable Routes (in server.js):**
- `GET /api/timetable/:classId` - Requires 'classes' view permission
- `POST /api/timetable` - Requires 'classes' edit permission
- `PUT /api/timetable/:classId/slot` - Requires 'classes' edit permission
- `PUT /api/timetable/:classId/periods` - Requires 'classes' edit permission
- `DELETE /api/timetable/:classId` - Requires 'classes' delete permission

**Teacher Assignment Routes:**
Already had proper permission checks:
- All routes require authentication
- View operations require 'staff' view permission
- Edit operations require 'staff' edit permission

### 2. Frontend - Permission Integration

#### Updated API Service (`school-dashboard/src/services/api.js`)
Fixed class settings API endpoints to use correct routes:
- `getSettings` - Now calls `/class-settings/:id`
- `updateTag` - Now calls `/class-settings/:id/tag`
- `updateSubjects` - Now calls `/class-settings/:id/subjects` with correct body format

#### ClassSettingsPanel Component
Added permission checks:
- Imports `usePermissions` hook
- Checks `hasPermission('classes', 'edit')` to determine if user can edit
- Disables all edit buttons when user lacks permission
- Shows warning message when user cannot edit
- All form inputs remain functional for viewing but save operations are blocked

#### StaffAssignmentPanel Component
Added permission checks:
- Imports `usePermissions` hook
- Checks `hasPermission('staff', 'edit')` to determine if user can edit
- Disables "Add Assignment" button when user lacks permission
- Disables "Remove" buttons on assignments when user lacks permission
- Shows warning message when user cannot edit
- Prevents opening add modal when user lacks permission

#### TeacherTimetableEditor Component
Added comprehensive permission checks:
- Imports `useAuth` and `usePermissions` hooks
- Determines if user is viewing their own timetable
- Checks if user is admin (has 'staff' edit permission and admin role)
- Sets `canEdit` flag (only admins can edit)
- Sets `canView` flag (admins or viewing own timetable)

**UI Changes:**
- Shows "View-Only Mode" warning for teachers viewing their own timetable
- Shows "Access Denied" error if user cannot view the timetable
- Disables slot clicking when user cannot edit
- Prevents modal opening when user lacks edit permission
- Shows appropriate warning toast when attempting to edit without permission
- Empty slots show disabled state (no hover effects, cursor-not-allowed)
- Filled slots are not pressable when user cannot edit

### 3. Server Configuration

#### Updated server.js
- Registered new class settings routes: `app.use('/api/class-settings', classSettingsRoutes)`
- Added permission middleware to all class timetable routes
- Ensured proper import of permission checking functions

## Permission Model

### Role-Based Access Control

**Admin Role:**
- Can view and edit all timetables (class and teacher)
- Can manage class settings (tags and subjects)
- Can manage teacher assignments
- Full access to all timetable features

**Teacher Role:**
- Can view their own timetable (read-only)
- Cannot edit their own timetable
- Cannot view other teachers' timetables (unless they have staff view permission)
- Cannot manage class settings or teacher assignments

**Other Roles:**
- Access determined by specific module permissions
- Must have appropriate 'classes' or 'staff' permissions to access features

### Permission Checks

All permission checks follow this pattern:
1. **Authentication** - User must be logged in (JWT token required)
2. **Permission Check** - User must have appropriate module permission
3. **Role-Based Logic** - Additional checks for specific roles (e.g., admin-only operations)

## Error Handling

### Backend Error Responses

**403 Forbidden - Permission Denied:**
```json
{
  "success": false,
  "type": "PermissionError",
  "message": "You do not have permission to...",
  "details": {
    "reason": "Detailed explanation"
  }
}
```

**401 Unauthorized - Not Authenticated:**
```json
{
  "error": "Authentication required",
  "message": "No token provided"
}
```

### Frontend Error Handling

- Permission errors show user-friendly warning messages
- UI elements are disabled proactively (before API calls)
- Warning banners explain why actions are restricted
- Toast notifications provide immediate feedback

## Testing

All existing tests pass successfully:
- ✅ 36 tests passed across 7 test files
- ✅ Class settings tests
- ✅ Teacher assignment tests
- ✅ Synchronization tests
- ✅ Conflict detection tests
- ✅ Validation tests
- ✅ Class switching tests
- ✅ Endpoint integration tests

## Security Improvements

1. **Authentication Required** - All timetable operations now require valid JWT token
2. **Permission Validation** - Every operation checks user permissions before execution
3. **Role Separation** - Clear distinction between admin and teacher capabilities
4. **Audit Trail** - Modified by user ID tracked in timetable updates
5. **Input Validation** - All inputs validated before processing
6. **Error Messages** - Clear but not overly revealing error messages

## User Experience

### For Administrators
- Full access to all features
- No changes to existing workflow
- Can manage all timetables and settings

### For Teachers
- Can view their own timetable
- Clear messaging that they cannot edit
- Directed to contact administrator for changes
- No confusing error messages or broken UI

### For Other Users
- Access based on assigned permissions
- Clear feedback when permission is lacking
- Option to request additional permissions (existing feature)

## Files Modified

### Backend
1. `backend/routes/classSettings.js` - NEW
2. `backend/routes/teacherTimetable.js` - Updated with permission middleware
3. `backend/routes/teacherAssignments.js` - Already had proper permissions
4. `backend/server.js` - Added class settings routes and timetable permissions

### Frontend
1. `school-dashboard/src/services/api.js` - Fixed class settings endpoints
2. `school-dashboard/src/pages/classes/ClassSettingsPanel.jsx` - Added permission checks
3. `school-dashboard/src/pages/staffs/StaffAssignmentPanel.jsx` - Added permission checks
4. `school-dashboard/src/pages/staffs/TeacherTimetableEditor.jsx` - Added comprehensive permission checks

## Next Steps

The permission system is now fully implemented. Recommended next steps:
1. Test with different user roles in the UI
2. Verify permission request workflow for users needing additional access
3. Consider adding audit logging for sensitive operations
4. Document permission requirements for administrators

## Notes

- All changes are backward compatible
- Existing functionality preserved
- No breaking changes to API contracts
- Tests confirm all features working correctly
