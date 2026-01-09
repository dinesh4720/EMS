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
        setPermissions(data.permissions || []);
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
    // Grant all permissions for Admin roles
    if (user.role === 'Super Admin' || user.role === 'Admin') {
      setPermissions([{ module: '*', actions: ['view', 'create', 'edit', 'delete'] }]);
    } else {
      // Grant basic view permissions for other roles
      setPermissions([{ module: '*', actions: ['view'] }]);
    }
  };

  const hasPermission = (module, action = 'view') => {
    // Super Admin has all permissions
    if (user?.role === 'Super Admin') {
      return true;
    }

    // Check if user has wildcard permission
    const wildcardPermission = permissions.find(p => p.module === '*');
    if (wildcardPermission && wildcardPermission.actions?.includes(action)) {
      return true;
    }

    // Check specific module permission
    const modulePermission = permissions.find(p => p.module === module);
    if (modulePermission && modulePermission.actions?.includes(action)) {
      return true;
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
