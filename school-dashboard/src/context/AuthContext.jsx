import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { clearStoredUser, getAuthHeaders, getStoredUser, saveStoredUser } from "../utils/authSession";
import { isSuperAdminRole } from "../utils/roleUtils";
import { clearApiCache } from "../services/api";

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedUser = getStoredUser();

      try {
        const response = await fetch(`${API_URL}/auth/session`, {
          headers: getAuthHeaders(),
          credentials: 'include'
        });

        if (response.ok) {
          const sessionUser = await response.json();
          if (!isMounted) return;

          saveStoredUser(sessionUser);

          setUser(sessionUser);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }

        if (response.status === 401 || response.status === 403) {
          clearStoredUser();
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
          }
          return;
        }
      } catch (error) {
        console.warn('Session restore failed, using stored user fallback:', error.message);
      }

      if (storedUser?.id && isMounted) {
        setUser(storedUser);
        setIsAuthenticated(true);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleSessionCleared = () => {
      setUser(null);
      setIsAuthenticated(false);
      if (location.pathname !== '/login') {
        navigate('/login');
      }
    };

    window.addEventListener('auth-session-cleared', handleSessionCleared);
    return () => window.removeEventListener('auth-session-cleared', handleSessionCleared);
  }, [location.pathname, navigate]);

  const login = async (emailOrPhone, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Mode': 'cookie',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: emailOrPhone.includes('@') ? emailOrPhone : undefined,
          phone: !emailOrPhone.includes('@') ? emailOrPhone : undefined,
          password
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Login failed');
      }

      const userData = await response.json();
      saveStoredUser(userData);
      setUser(userData);
      setIsAuthenticated(true);
      navigate(isSuperAdminRole(userData.role) ? '/super-admin' : '/');
      return userData;
    } catch (error) {
      console.error('Login error:', error?.message || error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.warn('Logout request failed:', error.message);
    }

    setUser(null);
    setIsAuthenticated(false);
    clearStoredUser();
    clearApiCache();
    navigate('/login');
  };

  const updatePassword = () => false;

  const updateStaffCredentials = () => false;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      loading,
      updatePassword,
      updateStaffCredentials
    }}>
      {children}
    </AuthContext.Provider>
  );
};

