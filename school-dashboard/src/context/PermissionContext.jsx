import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const PermissionContext = createContext();

export const usePermissions = () => useContext(PermissionContext);

export const PermissionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserPermissions();
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/permissions/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.token || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const apiPermissions = data.permissions || [];

        // If API returns empty or incomplete permissions, merge with role defaults
        if (apiPermissions.length === 0) {
          grantDefaultPermissions();
        } else {
          // Check if academics is included, if not add it based on role
          const roleStr = typeof user?.role === 'string' ? user.role :
                          user?.role?.toString?.() || '';
          const normalizedRole = roleStr.toLowerCase().trim();
          const hasAcademicsPermission = apiPermissions.some(p => p.module === 'academics');

          // For teachers and above, always include academics if missing
          if (!hasAcademicsPermission && ['teacher', 'principal', 'vice principal', 'vice-principal', 'admin', 'super admin', 'superadmin'].includes(normalizedRole)) {
            // Merge role-based academics permission with API permissions
            const academicsPermission = {
              module: 'academics',
              actions: normalizedRole === 'teacher'
                ? ['view', 'create', 'edit']
                : ['view', 'create', 'edit', 'publish']
            };
            setPermissions([...apiPermissions, academicsPermission]);
          } else {
            setPermissions(apiPermissions);
          }
        }
      } else {
        // If fetch fails, grant all permissions for Admin roles
        console.warn('Permissions API not available, using role-based fallback');
        grantDefaultPermissions();
      }
    } catch (error) {
      console.warn('Permissions system not available, using role-based fallback:', error.message);
      // Fallback: Grant permissions based on role
      grantDefaultPermissions();
    } finally {
      setLoading(false);
    }
  };

  const grantDefaultPermissions = () => {
    // Normalize role for case-insensitive comparison - handle various types safely
    const roleStr = typeof user?.role === 'string' ? user.role :
                    user?.role?.toString?.() || '';
    const normalizedRole = roleStr.toLowerCase().trim();

    // Grant all permissions for Admin roles
    if (normalizedRole === 'super admin' || normalizedRole === 'admin' || normalizedRole === 'superadmin') {
      setPermissions([{ module: '*', actions: ['view', 'create', 'edit', 'delete', 'publish'] }]);
    } else if (normalizedRole === 'principal') {
      // Principal has full access except settings delete
      setPermissions([
        { module: '*', actions: ['view', 'create', 'edit', 'delete', 'publish'] },
        { module: 'settings', actions: ['view', 'create', 'edit'] }
      ]);
    } else if (normalizedRole === 'vice principal' || normalizedRole === 'vice-principal') {
      // Vice Principal has access without delete
      setPermissions([
        { module: 'dashboard', actions: ['view'] },
        { module: 'staff', actions: ['view', 'create', 'edit'] },
        { module: 'students', actions: ['view', 'create', 'edit'] },
        { module: 'classes', actions: ['view', 'create', 'edit'] },
        { module: 'academics', actions: ['view', 'create', 'edit', 'publish'] },
        { module: 'attendance', actions: ['view', 'create', 'edit'] },
        { module: 'timetable', actions: ['view', 'create', 'edit'] },
        { module: 'fees', actions: ['view'] },
        { module: 'payroll', actions: ['view'] },
        { module: 'communication', actions: ['view', 'create', 'edit'] },
        { module: 'reports', actions: ['view', 'create'] },
      ]);
    } else if (normalizedRole === 'teacher') {
      // Teacher has access to classes, attendance, academics
      setPermissions([
        { module: 'dashboard', actions: ['view'] },
        { module: 'staff', actions: ['view'] },
        { module: 'students', actions: ['view', 'edit'] },
        { module: 'classes', actions: ['view'] },
        { module: 'academics', actions: ['view', 'create', 'edit'] },
        { module: 'attendance', actions: ['view', 'create', 'edit'] },
        { module: 'timetable', actions: ['view'] },
        { module: 'fees', actions: ['view'] },
        { module: 'communication', actions: ['view', 'create'] },
        { module: 'reports', actions: ['view'] },
      ]);
    } else if (normalizedRole === 'accountant') {
      // Accountant has access to fees and payroll
      setPermissions([
        { module: 'dashboard', actions: ['view'] },
        { module: 'staff', actions: ['view'] },
        { module: 'students', actions: ['view'] },
        { module: 'academics', actions: ['view'] },
        { module: 'fees', actions: ['view', 'create', 'edit', 'delete'] },
        { module: 'payroll', actions: ['view', 'create', 'edit'] },
        { module: 'reports', actions: ['view'] },
      ]);
    } else {
      // Grant basic view permissions for other roles
      setPermissions([
        { module: 'dashboard', actions: ['view'] },
        { module: 'staff', actions: ['view'] },
        { module: 'students', actions: ['view'] },
        { module: 'classes', actions: ['view'] },
        { module: 'academics', actions: ['view'] },
        { module: 'attendance', actions: ['view'] },
        { module: 'timetable', actions: ['view'] },
        { module: 'communication', actions: ['view', 'create'] },
      ]);
    }
  };

  const hasPermission = (module, action = 'view') => {
    // Normalize role for case-insensitive comparison - handle various types safely
    const roleStr = typeof user?.role === 'string' ? user.role :
                    user?.role?.toString?.() || '';
    const normalizedRole = roleStr.toLowerCase().trim();

    // Super Admin has all permissions
    if (normalizedRole === 'super admin' || normalizedRole === 'admin' || normalizedRole === 'superadmin') {
      return true;
    }

    // Check if user has wildcard permission
    const wildcardPermission = permissions.find(p => p.module === '*');
    if (wildcardPermission) {
      // Check if it has actions array (old format) or boolean fields (new format)
      if (wildcardPermission.actions?.includes(action)) {
        return true;
      }
      if (wildcardPermission[action] === true) {
        return true;
      }
    }

    // Check specific module permission
    const modulePermission = permissions.find(p => p.module === module);
    if (modulePermission) {
      // Check if it has actions array (old format) or boolean fields (new format)
      if (modulePermission.actions?.includes(action)) {
        return true;
      }
      if (modulePermission[action] === true) {
        return true;
      }
    }

    return false;
  };

  const requestPermission = async (module, action, reason) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/permissions/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token || ''}`,
        },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name || 'Unknown User',
          userEmail: user.email || '',
          module,
          permissions: [action], // Backend expects array of permissions
          reason,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      const errorData = await response.json().catch(() => ({}));
      
      // If permission system is not available, throw a specific error
      if (response.status === 500) {
        throw new Error('Permission request system is not available. Please contact your administrator directly.');
      }
      
      throw new Error(errorData.error || 'Failed to request permission');
    } catch (error) {
      console.error('Error requesting permission:', error);
      throw error;
    }
  };

  const refreshPermissions = () => {
    if (isAuthenticated && user) {
      fetchUserPermissions();
    }
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        loading,
        hasPermission,
        requestPermission,
        refreshPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};
