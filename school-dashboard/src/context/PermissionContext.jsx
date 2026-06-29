import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { getStoredUser } from "../utils/authSession";
import { request } from "../services/api.js";
import logger from "../utils/logger";

const PermissionContext = createContext();

export const usePermissions = () => useContext(PermissionContext);

// ---------------------------------------------------------------------------
// Pure helper — compute role-based default permissions for a user object.
// Called synchronously on mount so the UI always starts with sensible defaults
// rather than an empty-permission state that requires a full-screen spinner.
//
// SECURITY: `_roleVerified` is intentionally excluded from sessionStorage
// (see authSession.js STORED_USER_FIELDS). So stored users always have
// _roleVerified === undefined → defaults are always conservative (view-only)
// until AuthContext confirms the role from the server and triggers a re-fetch.
// ---------------------------------------------------------------------------
function getDefaultPermissionsForUser(u) {
  if (!u) return [];

  const roleVerified = u._roleVerified === true;
  const roleStr = typeof u.role === 'string' ? u.role : (u.role?.toString?.() || '');
  const normalizedRole = roleStr.toLowerCase().trim();

  if (!roleVerified) {
    // Unverified role — grant minimal view-only permissions. The user will
    // get proper permissions once /permissions/me resolves or the role is
    // server-verified.
    return [
      { module: 'dashboard', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'staff', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'students', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'classes', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'academics', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'attendance', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'timetable', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'messaging', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'front-desk', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'inventory', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'hostel', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'transport', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'library', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'intake-forms', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'dataTools', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'analytics', view: true, create: false, edit: false, delete: false, publish: false },
    ];
  }

  if (normalizedRole === 'super admin' || normalizedRole === 'admin' || normalizedRole === 'superadmin') {
    return [{ module: '*', view: true, create: true, edit: true, delete: true, publish: true }];
  }
  if (normalizedRole === 'principal') {
    return [
      { module: '*', view: true, create: true, edit: true, delete: true, publish: true },
      { module: 'settings', view: true, create: true, edit: true, delete: false, publish: false },
    ];
  }
  if (normalizedRole === 'vice principal' || normalizedRole === 'vice-principal') {
    return [
      { module: 'dashboard', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'staff', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'students', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'classes', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'academics', view: true, create: true, edit: true, delete: false, publish: true },
      { module: 'attendance', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'timetable', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'fees', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'payroll', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'messaging', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'reports', view: true, create: true, edit: false, delete: false, publish: false },
      { module: 'front-desk', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'inventory', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'hostel', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'transport', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'library', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'intake-forms', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'dataTools', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'analytics', view: true, create: false, edit: false, delete: false, publish: false },
    ];
  }
  if (normalizedRole === 'teacher') {
    return [
      { module: 'dashboard', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'staff', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'students', view: true, create: false, edit: true, delete: false, publish: false },
      { module: 'classes', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'academics', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'attendance', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'timetable', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'fees', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'messaging', view: true, create: true, edit: false, delete: false, publish: false },
      { module: 'reports', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'front-desk', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'inventory', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'hostel', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'transport', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'library', view: true, create: true, edit: false, delete: false, publish: false },
      { module: 'intake-forms', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'dataTools', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'analytics', view: true, create: false, edit: false, delete: false, publish: false },
    ];
  }
  if (normalizedRole === 'accountant') {
    return [
      { module: 'dashboard', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'staff', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'students', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'academics', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'fees', view: true, create: true, edit: true, delete: true, publish: false },
      { module: 'payroll', view: true, create: true, edit: true, delete: false, publish: false },
      { module: 'reports', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'front-desk', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'inventory', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'hostel', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'transport', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'library', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'intake-forms', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'dataTools', view: true, create: false, edit: false, delete: false, publish: false },
      { module: 'analytics', view: true, create: false, edit: false, delete: false, publish: false },
    ];
  }
  // Grant basic view permissions for other roles
  return [
    { module: 'dashboard', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'staff', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'students', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'classes', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'academics', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'attendance', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'timetable', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'messaging', view: true, create: true, edit: false, delete: false, publish: false },
    { module: 'front-desk', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'inventory', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'hostel', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'transport', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'library', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'intake-forms', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'dataTools', view: true, create: false, edit: false, delete: false, publish: false },
    { module: 'analytics', view: true, create: false, edit: false, delete: false, publish: false },
  ];
}

export const PermissionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // Initialize synchronously from stored user so the app renders immediately
  // with conservative defaults — no spinner needed. Permissions update silently
  // when /permissions/me resolves and again when the role is server-verified.
  const [permissions, setPermissions] = useState(() => getDefaultPermissionsForUser(getStoredUser()));
  const [loading, setLoading] = useState(false);

  // Track whether the initial fetch already ran to avoid duplicate requests.
  const initialFetchDoneRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Fetch permissions from the server. Accepts a targetUser so it can be
  // called before AuthContext's user state is set (e.g. on mount from stored user).
  // ---------------------------------------------------------------------------
  const fetchUserPermissions = useCallback(async (targetUser) => {
    const id = targetUser?.id;
    if (!id) return;
    try {
      setLoading(true);
      // /permissions/me derives the user from the auth cookie server-side — safe
      // to call immediately on mount without waiting for isAuthenticated.
      const data = await request(`/permissions/me`);
      const apiPermissions = data.permissions || [];
      if (apiPermissions.length === 0) {
        setPermissions(getDefaultPermissionsForUser(targetUser));
      } else {
        setPermissions(apiPermissions);
      }
    } catch (error) {
      logger.warn('Permissions system not available, using role-based fallback:', error.message);
      setPermissions(getDefaultPermissionsForUser(targetUser));
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // On mount: fire /permissions/me from the stored user immediately — runs
  // in parallel with appDataQuery and settingsDataQuery (both of which also
  // read from stored user rather than waiting for isAuthenticated).
  // This eliminates the sequential auth → permissions waterfall.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const stored = getStoredUser();
    if (stored?.id) {
      initialFetchDoneRef.current = true;
      fetchUserPermissions(stored);
    } else {
      setPermissions([]);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Re-fetch when the role is server-verified by AuthContext. This upgrades
  // permissions from conservative defaults to accurate role-specific values.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isAuthenticated && user?._roleVerified) {
      fetchUserPermissions(user);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?._roleVerified]);

  // Clear permissions on logout.
  useEffect(() => {
    if (!isAuthenticated && !getStoredUser()) {
      setPermissions([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const hasPermission = useCallback((module, action = 'view') => {
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
      if (wildcardPermission[action] === true) {
        return true;
      }
    }

    return false;
  }, [user, permissions]);

  const requestPermission = useCallback(async (module, action, reason) => {
    try {
      return await request('/permissions/request', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          userName: user.name || 'Unknown User',
          userEmail: user.email || '',
          module,
          permissions: Array.isArray(action) ? action : [action],
          reason,
        }),
      });
    } catch (error) {
      logger.error('Error requesting permission:', error);
      throw error;
    }
  }, [user]);

  const isAdmin = useCallback(() => {
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
  }, [user]);

  const refreshPermissions = useCallback(() => {
    if (isAuthenticated && user) {
      fetchUserPermissions(user);
    }
  }, [isAuthenticated, user, fetchUserPermissions]);

  const value = useMemo(
    () => ({
      permissions,
      loading,
      hasPermission,
      isAdmin,
      requestPermission,
      refreshPermissions,
    }),
    [permissions, loading, hasPermission, isAdmin, requestPermission, refreshPermissions]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
