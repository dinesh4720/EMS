import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { clearStoredUser, getAuthHeaders, getStoredUser, saveStoredUser } from "../utils/authSession";
import { isSuperAdminRole } from "../utils/roleUtils";
import { clearApiCache } from "../services/api";
import { API_URL } from "../config/api.js";
import logger from "../utils/logger";

const AuthContext = createContext();

// Mutex to prevent concurrent session refresh calls
let sessionRestorePromise = null;

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

      // Deduplicate concurrent session restore calls (e.g. StrictMode double-invoke).
      // Resolve the promise with parsed data so all concurrent awaits get the same result.
      if (!sessionRestorePromise) {
        sessionRestorePromise = fetch(`${API_URL}/auth/session`, {
          headers: getAuthHeaders(),
          credentials: 'include'
        })
          .then(async (res) => ({ ok: res.ok, status: res.status, data: res.ok ? await res.json() : null }))
          .catch(() => ({ ok: false, status: 0, data: null }))
          .finally(() => {
            sessionRestorePromise = null;
          });
      }

      try {
        const { ok, status, data: sessionUser } = await sessionRestorePromise;

        if (ok && sessionUser) {
          if (!isMounted) return;

          saveStoredUser(sessionUser);

          // SECURITY: Mark role as server-verified. The role in this object
          // came from the backend /auth/session endpoint (which reads from the
          // DB), so it cannot be tampered with via sessionStorage.
          setUser({ ...sessionUser, _roleVerified: true });
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }

        if (status === 401 || status === 403) {
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

      // SECURITY: When falling back to sessionStorage, the role is NOT
      // verified by the server. Mark it so the permission system can
      // refuse to grant elevated privileges based on a potentially
      // tampered sessionStorage value.
      if (storedUser?.id && isMounted) {
        setUser({ ...storedUser, _roleVerified: false });
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
      // SECURITY: Role came from the server login response — mark as verified.
      setUser({ ...userData, _roleVerified: true });
      setIsAuthenticated(true);
      navigate(isSuperAdminRole(userData.role) ? '/super-admin' : '/');
      return userData;
    } catch (error) {
      logger.error('Login error:', error?.message || error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
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

