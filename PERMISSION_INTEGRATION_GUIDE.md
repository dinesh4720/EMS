# Permission System Integration Guide

## Quick Start - Protecting Your Modules

This guide shows you how to add permission checks to all modules in your application.

## Step 1: Wrap Page Components

### Example: Staff Management

```javascript
// school-dashboard/src/pages/staffs/StaffList.jsx
import PermissionGuard from "../../components/PermissionGuard";

export default function StaffList() {
  return (
    <PermissionGuard module="staff" action="view">
      {/* Your existing component code */}
      <div>
        {/* Staff list content */}
      </div>
    </PermissionGuard>
  );
}
```

### Example: Student Management

```javascript
// school-dashboard/src/pages/students/StudentsList.jsx
import PermissionGuard from "../../components/PermissionGuard";

export default function StudentsList() {
  return (
    <PermissionGuard module="students" action="view">
      {/* Your existing component code */}
    </PermissionGuard>
  );
}
```

## Step 2: Protect Action Buttons

### Example: Add/Edit/Delete Buttons

```javascript
import { usePermissions } from "../../context/PermissionContext";

export default function StaffDashboard() {
  const { hasPermission } = usePermissions();

  return (
    <div>
      {/* Only show if user has create permission */}
      {hasPermission('staff', 'create') && (
        <Button onPress={handleAddStaff}>
          Add New Staff
        </Button>
      )}

      {/* Only show if user has edit permission */}
      {hasPermission('staff', 'edit') && (
        <Button onPress={handleEditStaff}>
          Edit Staff
        </Button>
      )}

      {/* Only show if user has delete permission */}
      {hasPermission('staff', 'delete') && (
        <Button onPress={handleDeleteStaff}>
          Delete Staff
        </Button>
      )}
    </div>
  );
}
```

## Step 3: Protect Table Actions

```javascript
import { usePermissions } from "../../context/PermissionContext";

export default function StaffTable() {
  const { hasPermission } = usePermissions();

  return (
    <Table>
      <TableBody>
        {staff.map((member) => (
          <TableRow key={member.id}>
            <TableCell>{member.name}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                {hasPermission('staff', 'view') && (
                  <Button size="sm" onPress={() => viewStaff(member.id)}>
                    View
                  </Button>
                )}
                {hasPermission('staff', 'edit') && (
                  <Button size="sm" onPress={() => editStaff(member.id)}>
                    Edit
                  </Button>
                )}
                {hasPermission('staff', 'delete') && (
                  <Button size="sm" color="danger" onPress={() => deleteStaff(member.id)}>
                    Delete
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Step 4: Protect Sidebar Navigation

```javascript
// school-dashboard/src/components/Sidebar.jsx
import { usePermissions } from "../context/PermissionContext";

export default function Sidebar() {
  const { hasAnyPermission } = usePermissions();

  const menuItems = [
    { 
      label: "Dashboard", 
      path: "/", 
      icon: Home,
      show: hasAnyPermission('dashboard')
    },
    { 
      label: "Staff", 
      path: "/staffs", 
      icon: Users,
      show: hasAnyPermission('staff')
    },
    { 
      label: "Students", 
      path: "/students", 
      icon: GraduationCap,
      show: hasAnyPermission('students')
    },
    { 
      label: "Fees", 
      path: "/fees", 
      icon: DollarSign,
      show: hasAnyPermission('fees')
    },
    { 
      label: "Payroll", 
      path: "/staffs/payroll", 
      icon: Wallet,
      show: hasAnyPermission('payroll')
    },
    { 
      label: "Messaging", 
      path: "/messaging", 
      icon: MessageSquare,
      show: hasAnyPermission('messaging')
    },
    { 
      label: "Settings", 
      path: "/settings", 
      icon: Settings,
      show: hasAnyPermission('settings')
    },
  ];

  return (
    <nav>
      {menuItems.filter(item => item.show).map((item) => (
        <NavLink key={item.path} to={item.path}>
          <item.icon />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

## Step 5: Module-Specific Examples

### Messaging Module

```javascript
// school-dashboard/src/pages/messaging/Chat.jsx
import PermissionGuard from "../../components/PermissionGuard";
import { usePermissions } from "../../context/PermissionContext";

export default function Chat() {
  const { hasPermission } = usePermissions();

  return (
    <PermissionGuard module="messaging" action="view">
      <div>
        {/* Chat interface */}
        
        {/* Only show send button if user has create permission */}
        {hasPermission('messaging', 'create') && (
          <Button onPress={sendMessage}>
            Send Message
          </Button>
        )}

        {/* Only show delete button if user has delete permission */}
        {hasPermission('messaging', 'delete') && (
          <Button onPress={deleteMessage}>
            Delete
          </Button>
        )}
      </div>
    </PermissionGuard>
  );
}
```

### Fee Management Module

```javascript
// school-dashboard/src/pages/fees/Payments.jsx
import PermissionGuard from "../../components/PermissionGuard";
import { usePermissions } from "../../context/PermissionContext";

export default function Payments() {
  const { hasPermission } = usePermissions();

  return (
    <PermissionGuard module="fees" action="view">
      <div>
        {/* Payment list */}
        
        {/* Only show collect payment button if user has create permission */}
        {hasPermission('fees', 'create') && (
          <Button onPress={collectPayment}>
            Collect Payment
          </Button>
        )}

        {/* Only show refund button if user has delete permission */}
        {hasPermission('fees', 'delete') && (
          <Button onPress={processRefund}>
            Process Refund
          </Button>
        )}
      </div>
    </PermissionGuard>
  );
}
```

### Payroll Module

```javascript
// school-dashboard/src/pages/staffs/StaffPayroll.jsx
import PermissionGuard from "../../components/PermissionGuard";
import { usePermissions } from "../../context/PermissionContext";

export default function StaffPayroll() {
  const { hasPermission } = usePermissions();

  return (
    <PermissionGuard module="payroll" action="view">
      <div>
        {/* Payroll interface */}
        
        {/* Only show process payroll button if user has create permission */}
        {hasPermission('payroll', 'create') && (
          <Button onPress={processPayroll}>
            Process Payroll
          </Button>
        )}

        {/* Only show edit salary button if user has edit permission */}
        {hasPermission('payroll', 'edit') && (
          <Button onPress={editSalary}>
            Edit Salary
          </Button>
        )}
      </div>
    </PermissionGuard>
  );
}
```

### Settings Module

```javascript
// school-dashboard/src/pages/settings/InstitutionSettings.jsx
import PermissionGuard from "../../components/PermissionGuard";
import { usePermissions } from "../../context/PermissionContext";

export default function InstitutionSettings() {
  const { hasPermission } = usePermissions();

  return (
    <PermissionGuard module="settings" action="view">
      <div>
        {/* Settings form */}
        
        {/* Only show save button if user has edit permission */}
        {hasPermission('settings', 'edit') && (
          <Button onPress={saveSettings}>
            Save Changes
          </Button>
        )}
      </div>
    </PermissionGuard>
  );
}
```

## Step 6: Dashboard Critical Alerts

Add permission request notifications to the dashboard:

```javascript
// school-dashboard/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { usePermissions } from "../context/PermissionContext";
import { useAuth } from "../context/AuthContext";
import { Bell } from "lucide-react";

export default function Dashboard() {
  const { isAdmin } = usePermissions();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (isAdmin()) {
      fetchPendingCount();
    }
  }, [isAdmin]);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/permissions/requests/count/pending?adminId=${user.id}`
      );
      const data = await response.json();
      setPendingCount(data.count);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  return (
    <div>
      {/* Critical Alerts Section */}
      {isAdmin() && pendingCount > 0 && (
        <Card className="mb-6 border-warning-200 bg-warning-50">
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="text-warning-600" size={24} />
                <div>
                  <h3 className="font-semibold text-warning-900">
                    {pendingCount} Pending Permission Request{pendingCount > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-warning-700">
                    Staff members are waiting for permission approval
                  </p>
                </div>
              </div>
              <Button
                color="warning"
                variant="flat"
                onPress={() => navigate('/settings/permission-requests')}
              >
                Review Requests
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Rest of dashboard */}
    </div>
  );
}
```

## Step 7: Real-Time Updates

The system automatically handles real-time updates via Socket.IO. No additional code needed!

When permissions are updated:
- User's permissions refresh automatically
- Toast notification appears
- UI updates to show/hide features

## Complete Module Checklist

Use this checklist to ensure all modules are protected:

### ✅ Dashboard
- [ ] Wrap main component with PermissionGuard
- [ ] Add critical alerts for admins
- [ ] Hide sensitive stats based on permissions

### ✅ Staff Management
- [ ] Wrap StaffList with PermissionGuard (view)
- [ ] Protect Add Staff button (create)
- [ ] Protect Edit buttons (edit)
- [ ] Protect Delete buttons (delete)
- [ ] Protect Staff Profile page (view)
- [ ] Protect Staff Attendance (attendance module)
- [ ] Protect Staff Payroll (payroll module)

### ✅ Students Management
- [ ] Wrap StudentsList with PermissionGuard (view)
- [ ] Protect Add Student button (create)
- [ ] Protect Edit buttons (edit)
- [ ] Protect Delete buttons (delete)
- [ ] Protect Student Profile page (view)
- [ ] Protect Fee collection (fees module)

### ✅ Classes Management
- [ ] Wrap ClassesList with PermissionGuard (view)
- [ ] Protect Add Class button (create)
- [ ] Protect Edit buttons (edit)
- [ ] Protect Delete buttons (delete)

### ✅ Attendance
- [ ] Wrap Attendance pages with PermissionGuard (view)
- [ ] Protect Mark Attendance (create)
- [ ] Protect Edit Attendance (edit)
- [ ] Protect Regularize (edit)

### ✅ Timetable
- [ ] Wrap Timetable with PermissionGuard (view)
- [ ] Protect Create Timetable (create)
- [ ] Protect Edit Timetable (edit)

### ✅ Fees
- [ ] Wrap Fee pages with PermissionGuard (view)
- [ ] Protect Collect Payment (create)
- [ ] Protect Edit Payment (edit)
- [ ] Protect Refund (delete)
- [ ] Protect Fee Settings (settings module)

### ✅ Payroll
- [ ] Wrap Payroll pages with PermissionGuard (view)
- [ ] Protect Process Payroll (create)
- [ ] Protect Edit Salary (edit)
- [ ] Protect Payroll Settings (settings module)

### ✅ Messaging
- [ ] Wrap Chat with PermissionGuard (view)
- [ ] Protect Send Message (create)
- [ ] Protect Edit Message (edit)
- [ ] Protect Delete Message (delete)
- [ ] Protect Announcements (create)

### ✅ Reports
- [ ] Wrap Reports with PermissionGuard (view)
- [ ] Protect Generate Report (create)
- [ ] Protect Export (create)

### ✅ Settings
- [ ] Wrap Settings pages with PermissionGuard (view)
- [ ] Protect Save Settings (edit)
- [ ] Protect User Management (admin only)
- [ ] Protect Roles & Permissions (admin only)
- [ ] Protect Permission Requests (admin only)

### ✅ Front Desk
- [ ] Wrap Front Desk pages with PermissionGuard (view)
- [ ] Protect Add Visitor (create)
- [ ] Protect Edit Entry (edit)
- [ ] Protect Delete Entry (delete)

## Testing Your Implementation

### Test as Different Roles

1. **Test as Admin**
   - Should have access to everything
   - Should see permission requests in settings
   - Should receive notifications for new requests

2. **Test as Teacher**
   - Should see permission denied for payroll
   - Should be able to view students
   - Should be able to mark attendance
   - Should NOT see delete buttons

3. **Test as Accountant**
   - Should have full access to fees and payroll
   - Should see permission denied for settings
   - Should be able to view reports

4. **Test as Receptionist**
   - Should have access to front desk
   - Should be able to add students
   - Should see permission denied for payroll

### Test Permission Requests

1. Login as non-admin user
2. Try to access restricted module
3. Click "Request Permission"
4. Fill out request form
5. Login as admin
6. Go to Settings > Permission Requests
7. Approve/reject the request
8. Login back as user
9. Verify access granted/denied

## Common Patterns

### Pattern 1: Conditional Rendering

```javascript
const { hasPermission } = usePermissions();

return (
  <div>
    {hasPermission('staff', 'view') && <StaffList />}
    {hasPermission('staff', 'create') && <AddStaffButton />}
  </div>
);
```

### Pattern 2: Disabled State

```javascript
const { hasPermission } = usePermissions();

return (
  <Button
    isDisabled={!hasPermission('staff', 'edit')}
    onPress={handleEdit}
  >
    Edit Staff
  </Button>
);
```

### Pattern 3: Multiple Permissions

```javascript
const { hasPermission } = usePermissions();

const canManageStaff = hasPermission('staff', 'create') && 
                       hasPermission('staff', 'edit') && 
                       hasPermission('staff', 'delete');

return (
  <div>
    {canManageStaff && <AdvancedStaffManagement />}
  </div>
);
```

### Pattern 4: Permission-Based Routing

```javascript
import { Navigate } from "react-router-dom";
import { usePermissions } from "../context/PermissionContext";

function ProtectedRoute({ module, action, children }) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(module, action)) {
    return <Navigate to="/permission-denied" replace />;
  }

  return children;
}
```

## Troubleshooting

### Issue: Permissions not loading
**Solution:** Ensure PermissionProvider wraps your app in App.jsx

### Issue: Permission denied for admin
**Solution:** Check if user role is set to 'admin' in database

### Issue: Buttons still visible
**Solution:** Add hasPermission check around the button

### Issue: Request not appearing for admin
**Solution:** Verify Socket.IO connection and admin role

## Next Steps

1. Go through each module systematically
2. Add PermissionGuard to page components
3. Add hasPermission checks to buttons
4. Test with different user roles
5. Update sidebar navigation
6. Add dashboard alerts
7. Test permission request workflow

---

**Remember:** Always check permissions on both frontend (UX) and backend (security)!
