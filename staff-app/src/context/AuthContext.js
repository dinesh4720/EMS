import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, getUserData, saveUserData, removeUserData, setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext();

// Update user function to refresh user data after profile changes

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Register 401 handler so api.js can trigger logout on expired tokens
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setError('Your session has expired. Please log in again.');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        console.log('Loading stored user data...');
        const storedUser = await Promise.race([
          getUserData(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout loading user data')), 5000)
          )
        ]);
        console.log('Stored user data:', storedUser);
        
        if (storedUser && storedUser.id) {
          // ✅ FIXED: Validate session with server before setting user
          console.log('Validating session with server for user ID:', storedUser.id);
          const validation = await authApi.validateSession(storedUser.id);
          
          if (validation && validation.valid) {
            console.log('✅ Session validated - user exists and is active');
            // Update user data with fresh data from server
            if (validation.staff) {
              const updatedUser = { ...storedUser, ...validation.staff };
              await saveUserData(updatedUser);
              setUser(updatedUser);
            } else {
              setUser(storedUser);
            }
          } else {
            // ❌ Session invalid - user deleted or inactive
            console.warn('⚠️ Session validation failed:', validation.reason || 'User not found or inactive');
            console.log('Clearing invalid session data...');
            await removeUserData();
            await authApi.logout(); // Clear auth token as well
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error loading stored user:', err);
        // Clear potentially corrupted data
        try {
          await removeUserData();
        } catch (clearErr) {
          console.error('Error clearing user data:', clearErr);
        }
      } finally {
        console.log('Auth initialization complete');
        setLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  const login = useCallback(async (email, password) => {
    console.log('Login attempt:', email);
    setLoading(true);
    setError(null);

    try {
      const userData = await authApi.login(email, password);
      console.log('Login response:', userData);

      if (userData && userData.id) {
        setUser(userData);
        console.log('Login successful for:', userData.name);
        return { success: true, user: userData };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Update user data in context and storage
  const updateUser = useCallback(async (updatedData) => {
    try {
      const currentUser = await getUserData();
      const newUserData = { ...currentUser, ...updatedData };
      await saveUserData(newUserData);
      setUser(newUserData);
      return { success: true, user: newUserData };
    } catch (err) {
      console.error('Error updating user:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
    clearError,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
