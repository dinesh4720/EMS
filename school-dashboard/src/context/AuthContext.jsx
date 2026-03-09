import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { staffData } from "../data/mockData";
import { clearStoredUser, getAuthHeaders, getStoredUser, saveStoredUser } from "../utils/authSession";

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Mock database for credentials (stored in local storage for persistence across reloads)
  // In a real app, this would be in a backend
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem("app_credentials");
    if (saved) return JSON.parse(saved);

    const creds = {
      "superid@test.com": {
        password: "12345",
        role: "Super Admin",
        name: "Master User",
        id: "master"
      }
    };

    staffData.forEach(staff => {
      if (staff.email) {
        creds[staff.email] = {
          password: "password123",
          role: staff.role,
          name: staff.name,
          id: staff.id
        };
      }
    });

    return creds;
  });

  useEffect(() => {
    localStorage.setItem("app_credentials", JSON.stringify(credentials));
  }, [credentials]);

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
      navigate('/');
      return userData;
    } catch (error) {
      console.error('Login error:', error);
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
    navigate('/login');
  };

  const updatePassword = (email, newPassword) => {
    if (credentials[email]) {
      const newCredentials = {
        ...credentials,
        [email]: {
          ...credentials[email],
          password: newPassword
        }
      };
      setCredentials(newCredentials);
      return true;
    }
    return false;
  };

  const updateStaffCredentials = (staffEmail, newPassword) => {
    return updatePassword(staffEmail, newPassword);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      loading,
      credentials,
      updatePassword,
      updateStaffCredentials
    }}>
      {children}
    </AuthContext.Provider>
  );
};

