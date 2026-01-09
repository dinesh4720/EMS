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
      // Set default permissions on error
      setPermissions({
        role: 'teacher',
        permissions: [],
        customPermissions: false
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch pending requests
  const fetchPendingRequests = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_URL}/api/permissions/user/${user.id}/requests?status=pending`);
      
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchPermissions();
      fetchPendingRequests();
    }
  }, [isAuthenticated, user?.id, fetchPermissions, fetchPendingRequests]);

  // Listen for permission updates via socket
  useEffect(() => {
    if (!window.socketService || !user?.id) return;

    const handlePermissionUpdate = (data) => {
      if (data.userId === user.id) {
        console.log('📢 Permission updated, refetching...');
        fetchPermissions();
        toast.success(`Your ${data.module} permissions have been updated`);
      }
    };

    const handleRequestReviewed = (data) => {
      if (data.userId === user.id) {
        console.log('📢 Permission request reviewed');
        fetchPermissions();
        fetchPendingRequests();
        
        if (data.status === 'approved') {
          toast.success(`Your request for ${data.module} access has been approved!`);
        } else {
          toast.error(`Your request for ${data.module} access was rejected`);
        }
      }
    };

    window.socketService.on('permission_updated', handlePermissionUpdate);
    window.socketService.on('permission_request_reviewed', handleRequestReviewed);

    return () => {
      window.socketService.off('permission_updated', handlePermissionUpdate);
      window.socketService.off('permission_request_reviewed', handleRequestReviewed);
    };
  }, [user?.id, fetchPermissions, fetchPendingRequests]);

  /**
   * Check if user has permission for a module and action
   * @param {string} module - Module name
   * @param {string} action - Action type (view, create, edit, delete)
   * @returns {boolean}
   */
  const hasPermission = useCallback((module, action = 'view') => {
    if (!permissions) return false;

    // Admin has all permissions
    if (permissions.role === 'admin') return true;

    // Find module permission
    const modulePermission = permissions.permissions.find(p => p.module === module);
    
    if (!modulePermission) return false;

    return modulePermission[action] === true;
  }, [permissions]);

  /**
   * Check if user has any permission for a module
   * @param {string} module - Module name
   * @returns {boolean}
   */
  const hasAnyPermission = useCallback((module) => {
    if (!permissions) return false;
    if (permissions.role === 'admin') return true;

    const modulePermission = permissions.permissions.find(p => p.module === module);
    if (!modulePermission) return false;

    return modulePermission.view || modulePermission.create || 
           modulePermission.edit || modulePermission.delete;
  }, [permissions]);

  /**
   * Get all permissions for a module
   * @param {string} module - Module name
   * @returns {object} - { view, create, edit, delete }
   */
  const getModulePermissions = useCallback((module) => {
    if (!permissions) {
      return { view: false, create: false, edit: false, delete: false };
    }

    if (permissions.role === 'admin') {
      return { view: true, create: true, edit: true, delete: true };
    }

    const modulePermission = permissions.permissions.find(p => p.module === module);
    
    if (!modulePermission) {
      return { view: false, create: false, edit: false, delete: false };
    }

    return {
      view: modulePermission.view || false,
      create: modulePermission.create || false,
      edit: modulePermission.edit || false,
      delete: modulePermission.delete || false
    };
  }, [permissions]);

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  const isAdmin = useCallback(() => {
    return permissions?.role === 'admin';
  }, [permissions]);

  /**
   * Check if user has a pending request for a module
   * @param {string} module - Module name
   * @returns {boolean}
   */
  const hasPendingRequest = useCallback((module) => {
    return pendingRequests.some(req => req.module === module);
  }, [pendingRequests]);

  const value = {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    getModulePermissions,
    isAdmin,
    pendingRequests,
    hasPendingRequest,
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
