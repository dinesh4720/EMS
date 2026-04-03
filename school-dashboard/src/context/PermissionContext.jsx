import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { request } from "../services/api.js";
import logger from "../utils/logger";

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
  // Use user?.id instead of user object to avoid re-running on every render
  // when AuthContext creates a new user object reference (AP-13).
  // Also depend on _roleVerified so permissions are re-fetched once the
  // server confirms the role (transitions from false -> true).
  }, [isAuthenticated, user?.id, user?._roleVerified]);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);

      const data = await request(`/permissions/user/${user.id}`);
      const apiPermissions = data.permissions || [];

      // If API returns empty or incomplete permissions, merge with role defaults
      if (apiPermissions.length === 0) {
        grantDefaultPermissions();
      } else {
        setPermissions(apiPermissions);
      }
    } catch (error) {
      console.warn('Permissions system not available, using role-based fallback:', error.message);
      grantDefaultPermissions();
    } finally {
      setLoading(false);
    }
  };

  const grantDefaultPermissions = () => {
    // SECURITY: The role used here may come from sessionStorage, which a user
    // can tamper with via the browser console. Only grant elevated (admin/
    // principal) permissions when the role has been verified by the server
    // (i.e. _roleVerified === true, set by AuthContext after a successful
    // /auth/session or /auth/login response). When the role is unverified,
    // fall through to basic view-only permissions to prevent privilege
    // escalation via sessionStorage manipulation.
    const roleVerified = user?._roleVerified === true;

    // Normalize role for case-insensitive comparison - handle various types safely
    const roleStr = typeof user?.role === 'string' ? user.role :
                    user?.role?.toString?.() || '';
    const normalizedRole = roleStr.toLowerCase().trim();

    // Only trust elevated roles when verified by the server
    if (!roleVerified) {
      // Unverified role — grant minimal view-only permissions regardless of
      // what the role field says. The user will get proper permissions once
      // the /auth/session call succeeds and re-triggers this flow.
      console.warn(
        'PermissionContext: role not server-verified, granting view-only fallback permissions'
      );
      setPermissions([
        { module: 'dashboard', actions: ['view'] },
        { module: 'staff', actions: ['view'] },
        { module: 'students', actions: ['view'] },
        { module: 'classes', actions: ['view'] },
        { module: 'academics', actions: ['view'] },
        { module: 'attendance', actions: ['view'] },
        { module: 'timetable', actions: ['view'] },
        { module: 'messaging', actions: ['view'] },
      ]);
      return;
    }

    // Grant all permissions for Admin roles (role verified by server)
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
        { module: 'messaging', actions: ['view', 'create', 'edit'] },
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
        { module: 'messaging', actions: ['view', 'create'] },
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
        { module: 'messaging', actions: ['view', 'create'] },
      ]);
    }
  };

  const hasPermission = (module, action = 'view') => {
    // SECURITY: Only trust the role for admin short-circuit when the role has
    // been verified by the server. This prevents privilege escalation via
    // sessionStorage tampering. The _roleVerified flag is set by AuthContext
    // only when user data comes from /auth/session or /auth/login responses.
    const roleVerified = user?._roleVerified === true;

    // Normalize role for case-insensitive comparison - handle various types safely
    const roleStr = typeof user?.role === 'string' ? user.role :
                    user?.role?.toString?.() || '';
    const normalizedRole = roleStr.toLowerCase().trim();

    // Super Admin has all permissions — but ONLY when role is server-verified
    if (roleVerified && (normalizedRole === 'super admin' || normalizedRole === 'admin' || normalizedRole === 'superadmin')) {
      return true;
    }

    // Check specific module permission FIRST — explicit module rules take
    // priority over wildcard. This ensures that, e.g., a principal's restricted
    // settings entry (no 'delete') is respected even when a wildcard (*) entry
    // would otherwise grant it.
    const modulePermission = permissions.find(p => p.module === module);
    if (modulePermission) {
      // Check if it has actions array (old format) or boolean fields (new format)
      if (modulePermission.actions?.includes(action)) {
        return true;
      }
      if (modulePermission[action] === true) {
        return true;
      }
      // Module-specific entry exists but does NOT include the requested action
      // — do NOT fall through to wildcard. The specific entry is authoritative.
      return false;
    }

    // No specific entry for this module — check wildcard permission
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

    return false;
  };

  const requestPermission = async (module, action, reason) => {
    try {

      return await request('/permissions/request', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          userName: user.name || 'Unknown User',
          userEmail: user.email || '',
          module,
          permissions: [action],
          reason,
        }),
      });
    } catch (error) {
      logger.error('Error requesting permission:', error);
      throw error;
    }
  };

  const isAdmin = () => {
    const roleVerified = user?._roleVerified === true;
    const roleStr = typeof user?.role === 'string' ? user.role :
                    user?.role?.toString?.() || '';
    const normalizedRole = roleStr.toLowerCase().trim();
    return roleVerified && (
      normalizedRole === 'admin' ||
      normalizedRole === 'super admin' ||
      normalizedRole === 'superadmin' ||
      normalizedRole === 'principal'
    );
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
        isAdmin,
        requestPermission,
        refreshPermissions,
      }}
    >
      {loading ? (
        <div className="h-screen w-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        children
      )}
    </PermissionContext.Provider>
  );
};
