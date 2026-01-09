# Complete Role-Based Permission System Implementation

## Overview
A comprehensive permission management system with role-based access control, permission requests, and admin approval workflow.

## Features Implemented

### 1. Backend Components

#### Models
- **UserPermission** (`backend/models/UserPermission.js`)
  - Stores user permissions per module
  - Supports role-based templates (admin, teacher, accountant, receptionist)
  - Custom permissions override
  
- **PermissionRequest** (`backend/models/PermissionRequest.js`)
  - Tracks permission requests from users
  - Status: pending, approved, rejected
  - Includes reason and review notes

#### Middleware
- **permissions.js** (`backend/middleware/permissions.js`)
  - `checkPermission(module, action)` - Validates user permissions
  - `requireAdmin()` - Ensures admin access
  - `getUserPermissions()` - Fetches permissions without blocking

#### Routes
- **permissions.js** (`backend/routes/permissions.js`)
  - `GET /api/permissions/user/:userId` - Get user permissions
  - `PUT /api/permissions/user/:userId` - Update permissions (admin only)
  - `POST /api/permissions/request` - Create permission request
  - `GET /api/permissions/requests` - Get all requests (admin only)
  - `GET /api/permissions/requests/count/pending` - Count pending requests
  - `PUT /api/permissions/requests/:requestId` - Approve/reject request
  - `GET /api/permissions/user/:userId/requests` - Get user's requests

### 2. Frontend Components

#### Context
- **PermissionContext** (`school-dashboard/src/context/PermissionContext.jsx`)
  - Manages user permissions state
  - Provides permission checking functions
  - Real-time updates via Socket.IO

#### Components
- **PermissionGuard** (`school-dashboard/src/components/PermissionGuard.jsx`)
  - Wraps routes/components to check permissions
  - Shows permission denied page if access not granted
  
- **PermissionDenied** (`school-dashboard/src/components/PermissionDenied.jsx`)
  - User-friendly access denied page
  - Allows users to request permission
  - Modal for submitting permission requests

#### Pages
- **PermissionRequests** (`school-dashboard/src/pages/settings/PermissionRequests.jsx`)
  - Admin dashboard for managing requests
  - Tabs for pending, approved, rejected requests
  - Approve/reject with notes
  - Real-time notifications

### 3. Permission Modules

All modules support granular permissions:
- **dashboard** - Dashboard access
- **staff** - Staff management
- **students** - Student management
- **classes** - Class management
- **attendance** - Attendance tracking
- **timetable** - Timetable management
- **fees** - Fee management
- **payroll** - Payroll management
- **messaging** - Communication/messaging
- **reports** - Reports and analytics
- **settings** - System settings
- **front-desk** - Front desk operations

### 4. Permission Actions

Each module supports:
- **view** - Read access
- **create** - Create new records
- **edit** - Modify existing records
- **delete** - Delete records

### 5. Role Templates

#### Admin
- Full access to all modules and actions

#### Teacher
- View: All modules except payroll, settings, front-desk
- Create/Edit: Students, attendance, messaging
- Limited access to sensitive data

#### Accountant
- Full access: Fees, payroll
- View: Most modules
- Create: Fees, payroll, messaging
- No access: Settings, front-desk

#### Receptionist
- Full access: Front-desk
- Create/Edit: Students
- View: Most modules
- No access: Payroll, settings

## Integration Steps

### Step 1: Update Backend Server

Add to `backend/server.js`:

```javascript
import permissionRoutes from './routes/permissions.js';
app.use('/api/permissions', permissionRoutes);

// Make io and Staff available to routes
app.locals.io = io;
app.locals.Staff = Staff;
```

### Step 2: Update Frontend App

Add to `school-dashboard/src/App.jsx`:

```javascript
import { PermissionProvider } from "./context/PermissionContext";

// Wrap app with PermissionProvider
<AuthProvider>
  <AppProvider>
    <PermissionProvider>
      <ChatNotificationProvider>
        {/* ... rest of app */}
      </ChatNotificationProvider>
    </PermissionProvider>
  </AppProvider>
</AuthProvider>
```

### Step 3: Add Permission Requests Route

Add to settings routes in `school-dashboard/src/pages/settings/index.jsx`:

```javascript
import PermissionRequests from './PermissionRequests';

// In routes
<Route path="permission-requests" element={<PermissionRequests />} />
```

### Step 4: Protect Routes with PermissionGuard

Example usage:

```javascript
import PermissionGuard from "../components/PermissionGuard";

// Wrap any component/route
<PermissionGuard module="staff" action="view">
  <StaffList />
</PermissionGuard>

// For create/edit/delete actions
<PermissionGuard module="staff" action="create">
  <Button>Add Staff</Button>
</PermissionGuard>
```

### Step 5: Use Permission Hooks

```javascript
import { usePermissions } from "../context/PermissionContext";

function MyComponent() {
  const { hasPermission, isAdmin, getModulePermissions } = usePermissions();

  // Check single permission
  if (hasPermission('staff', 'edit')) {
    // Show edit button
  }

  // Check if admin
  if (isAdmin()) {
    // Show admin features
  }

  // Get all permissions for a module
  const staffPerms = getModulePermissions('staff');
  // Returns: { view: true, create: false, edit: true, delete: false }
}
```

## Usage Examples

### 1. Protecting a Page

```javascript
// In StaffList.jsx
import PermissionGuard from "../../components/PermissionGuard";

export default function StaffList() {
  return (
    <PermissionGuard module="staff" action="view">
      <div>
        {/* Staff list content */}
      </div>
    </PermissionGuard>
  );
}
```

### 2. Conditional Rendering

```javascript
import { usePermissions } from "../../context/PermissionContext";

export default function StaffDashboard() {
  const { hasPermission } = usePermissions();

  return (
    <div>
      {hasPermission('staff', 'view') && <StaffList />}
      {hasPermission('staff', 'create') && (
        <Button>Add New Staff</Button>
      )}
      {hasPermission('staff', 'edit') && (
        <Button>Edit Staff</Button>
      )}
    </div>
  );
}
```

### 3. API Route Protection

```javascript
// In backend route
import { checkPermission } from '../middleware/permissions.js';

router.get('/staff', checkPermission('staff', 'view'), async (req, res) => {
  // Only accessible if user has staff view permission
});

router.post('/staff', checkPermission('staff', 'create'), async (req, res) => {
  // Only accessible if user has staff create permission
});
```

### 4. Admin-Only Features

```javascript
import { usePermissions } from "../../context/PermissionContext";

export default function Settings() {
  const { isAdmin } = usePermissions();

  if (!isAdmin()) {
    return <PermissionDenied module="settings" action="view" />;
  }

  return (
    <div>
      {/* Admin settings */}
    </div>
  );
}
```

## Real-Time Features

### Socket.IO Events

1. **permission_request_created** - Emitted when user requests permission
   - Notifies admins of new request
   
2. **permission_request_reviewed** - Emitted when admin approves/rejects
   - Notifies user of decision
   
3. **permission_updated** - Emitted when permissions are modified
   - Updates user's permission state

### Critical Alerts for Admin

Permission requests appear in:
1. **Dashboard** - Critical alerts section (to be implemented)
2. **Settings > Permission Requests** - Dedicated management page
3. **Real-time notifications** - Toast notifications via Socket.IO

## Testing the System

### 1. Create Test Users

```javascript
// Create users with different roles
const admin = { role: 'Admin' };
const teacher = { role: 'Teacher' };
const accountant = { role: 'Accountant' };
```

### 2. Test Permission Requests

1. Login as teacher
2. Try to access payroll module
3. See permission denied page
4. Click "Request Permission"
5. Submit request with reason

### 3. Test Admin Approval

1. Login as admin
2. Go to Settings > Permission Requests
3. See pending request
4. Review and approve/reject
5. User receives notification

### 4. Test Permission Enforcement

1. Try accessing modules without permission
2. Verify permission denied page shows
3. Verify buttons/features are hidden based on permissions

## Database Schema

### UserPermission Collection

```javascript
{
  userId: ObjectId,
  role: 'admin' | 'teacher' | 'accountant' | 'receptionist' | 'custom',
  permissions: [
    {
      module: 'staff',
      view: true,
      create: false,
      edit: true,
      delete: false
    }
  ],
  customPermissions: false,
  lastUpdated: Date,
  updatedBy: ObjectId
}
```

### PermissionRequest Collection

```javascript
{
  userId: ObjectId,
  userName: String,
  userEmail: String,
  module: 'staff',
  permissions: ['view', 'edit'],
  reason: String,
  status: 'pending' | 'approved' | 'rejected',
  requestedAt: Date,
  reviewedAt: Date,
  reviewedBy: ObjectId,
  reviewerName: String,
  reviewNotes: String
}
```

## Next Steps

1. **Update all module pages** to use PermissionGuard
2. **Add permission checks** to all buttons and actions
3. **Implement critical alerts** in dashboard for admins
4. **Add permission management** to user profile pages
5. **Create audit log** for permission changes
6. **Add bulk permission updates** for multiple users
7. **Implement permission templates** for quick assignment

## Security Considerations

1. **Backend validation** - Always check permissions on backend
2. **Frontend guards** - Use PermissionGuard for UX
3. **API protection** - Use middleware on all sensitive routes
4. **Role hierarchy** - Admin can override all permissions
5. **Audit trail** - Log all permission changes
6. **Session management** - Refresh permissions on login

## Troubleshooting

### Permissions not loading
- Check if PermissionProvider is wrapping the app
- Verify user ID is available in AuthContext
- Check backend API is running

### Permission denied incorrectly
- Verify user permissions in database
- Check module and action names match exactly
- Ensure permissions are fetched after login

### Requests not appearing
- Check Socket.IO connection
- Verify admin role is set correctly
- Check backend logs for errors

## Files Modified/Created

### Backend
- ✅ `backend/models/UserPermission.js` - NEW
- ✅ `backend/models/PermissionRequest.js` - NEW
- ✅ `backend/middleware/permissions.js` - NEW
- ✅ `backend/routes/permissions.js` - NEW
- ✅ `backend/server.js` - MODIFIED (added routes)

### Frontend
- ✅ `school-dashboard/src/context/PermissionContext.jsx` - NEW
- ✅ `school-dashboard/src/components/PermissionGuard.jsx` - NEW
- ✅ `school-dashboard/src/components/PermissionDenied.jsx` - NEW
- ✅ `school-dashboard/src/pages/settings/PermissionRequests.jsx` - NEW
- ⏳ `school-dashboard/src/App.jsx` - TO BE MODIFIED
- ⏳ `school-dashboard/src/pages/settings/index.jsx` - TO BE MODIFIED
- ⏳ All module pages - TO BE WRAPPED with PermissionGuard

## Status

✅ Backend implementation complete
✅ Frontend components complete
⏳ Integration pending
⏳ Module protection pending
⏳ Testing pending

---

**Implementation Date:** January 9, 2026
**Version:** 1.0.0
**Status:** Ready for Integration
