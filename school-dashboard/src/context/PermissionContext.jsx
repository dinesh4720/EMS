import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const PermissionContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function PermissionProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Fetch user permissions
  const fetchPermissions = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/permissions/user/${user.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const data = await response.json();
      setPermissions(data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // Fallback for when backend is not reachable or user not found
      setPermissions({
        role: user?.role || 'teacher',
        permissions: [],
        customPermissions: false
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch pending requests (User sees their own, Admin sees ALL)
  const fetchPendingRequests = useCallback(async () => {
    if (!user?.id) return;

    try {
      let url = `${API_URL}/api/permissions/user/${user.id}/requests?status=pending`;

      // If user is admin (check against auth user role or loaded permissions role)
      const isAdminUser = user.role === 'admin' || (permissions && permissions.role === 'admin');

      if (isAdminUser) {
        url = `${API_URL}/api/admin/requests/pending`;
      }

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  }, [user, permissions]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchPermissions();
    }
  }, [isAuthenticated, user?.id, fetchPermissions]);

  useEffect(() => {
    // Fetch requests only after permissions are loaded to know if admin
    if (!loading && isAuthenticated) {
      fetchPendingRequests();
    }
  }, [loading, isAuthenticated, fetchPendingRequests]);

  // Request Permission
  const requestPermission = useCallback(async (module, permissionsList, reason) => {
    try {
      const response = await fetch(`${API_URL}/api/permissions/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          module,
          permissions: permissionsList, // Currently backend just stores the module, but passing details is good
          reason
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to request permission');
      }

      toast.success("Permission request submitted successfully");
      fetchPendingRequests(); // Refresh list
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  }, [user, fetchPendingRequests]);

  // Resolve Request (Admin only)
  const resolveRequest = useCallback(async (requestId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/requests/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status,
          adminId: user.id
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to resolve request');
      }

      toast.success(`Request ${status} successfully`);
      fetchPendingRequests(); // Refresh admin list
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  }, [user, fetchPendingRequests]);

  /**
   * Check if user has permission for a module and action
   */
  const hasPermission = useCallback((module, action = 'view') => {
    // If permissions haven't loaded yet, check the user object directly for admin role
    if (loading && user?.role?.toLowerCase() === 'admin') return true;

    // If we have permissions state
    if (permissions) {
      if (permissions.role?.toLowerCase() === 'admin') return true;

      // Also check if permissions array exists
      if (!permissions.permissions) return false;

      const modulePermission = permissions.permissions.find(p => p.module === module);
      if (!modulePermission) return false;
      return modulePermission[action] === true;
    }

    // Fallback to user object if permissions state is missing but we have user
    if (user?.role?.toLowerCase() === 'admin') return true;

    return false;
  }, [permissions, user, loading]);

  /**
   * Check if user has any permission for a module
   */
  const hasAnyPermission = useCallback((module) => {
    if (loading && user?.role?.toLowerCase() === 'admin') return true;

    if (permissions) {
      if (permissions.role?.toLowerCase() === 'admin') return true;

      if (!permissions.permissions) return false;

      const modulePermission = permissions.permissions.find(p => p.module === module);
      if (!modulePermission) return false;
      return modulePermission.view || modulePermission.create ||
        modulePermission.edit || modulePermission.delete;
    }

    if (user?.role?.toLowerCase() === 'admin') return true;

    return false;
  }, [permissions, user, loading]);

  const isAdmin = useCallback(() => {
    return permissions?.role === 'admin' || user?.role === 'admin';
  }, [permissions, user]);

  const value = {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    isAdmin,
    pendingRequests,
    requestPermission,
    resolveRequest,
    refetchPermissions: fetchPermissions,
    refetchPendingRequests: fetchPendingRequests
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionProvider");
  }
  return context;
};
