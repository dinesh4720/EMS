import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { clearLegacyCredentials, clearStoredUser, getAuthHeaders, getStoredUser, saveStoredUser } from "../utils/authSession";
import { isSuperAdminRole } from "../utils/roleUtils";
import { clearApiCache } from "../services/api";
import socketService from "../services/socketServiceEnhanced";
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

  // PERF-05: Keep the latest pathname in a ref so the auth-session-cleared
  // listener can read it without re-subscribing on every navigation. Reading
  // location.pathname directly in the effect deps would re-register the
  // listener (and churn any downstream effect that depends on logout) on each
  // route change.
  const pathnameRef = useRef(location.pathname);
  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    // SECURITY: Clean up legacy mock credentials left by an earlier version
    // of AuthContext (DASHBOARD_AUDIT.md #2). This is a one-time migration
    // that removes plaintext passwords from localStorage.
    clearLegacyCredentials();

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

          // SECURITY: Strip token fields before storing — tokens live in httpOnly
          // cookies only. Keeping them in React state exposes them to XSS via
          // React DevTools or injected scripts.
          const { token: _t, refreshToken: _rt, tokenExpiresAt: _tat, ...safeSessionUser } = sessionUser;

          saveStoredUser(safeSessionUser);

          // SECURITY: Mark role as server-verified. The role in this object
          // came from the backend /auth/session endpoint (which reads from the
          // DB), so it cannot be tampered with via sessionStorage.
          setUser({ ...safeSessionUser, _roleVerified: true });
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }

        // Explicit auth rejection — clear everything
        if (status === 401 || status === 403) {
          clearStoredUser();
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
          }
          return;
        }

        // SECURITY: Network failure (status 0) or any non-OK response that
        // isn't an explicit auth rejection — fail closed. Do NOT fall through
        // to unverified sessionStorage auth, as an attacker could force a
        // network error (e.g. airplane mode, DNS hijack) to bypass server
        // verification and authenticate with tampered sessionStorage data.
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
      } catch (error) {
        logger.warn('Session restore failed:', error.message);
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
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
      if (pathnameRef.current !== '/login') {
        navigate('/login');
      }
    };

    window.addEventListener('auth-session-cleared', handleSessionCleared);
    return () => window.removeEventListener('auth-session-cleared', handleSessionCleared);
  }, [navigate]);

  const login = useCallback(async (emailOrPhone, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Mode': 'cookie',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone) ? emailOrPhone : undefined,
          phone: /^\+?[0-9]{7,15}$/.test(emailOrPhone) ? emailOrPhone : undefined,
          password
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Login failed');
      }

      const userData = await response.json();
      // SECURITY: Strip token fields before storing — tokens live in httpOnly
      // cookies only. Keeping them in React state exposes them to XSS via
      // React DevTools or injected scripts.
      const { token: _t, refreshToken: _rt, tokenExpiresAt: _tat, ...safeUserData } = userData;
      saveStoredUser(safeUserData);
      // SECURITY: Role came from the server login response — mark as verified.
      setUser({ ...safeUserData, _roleVerified: true });
      setIsAuthenticated(true);
      navigate(isSuperAdminRole(safeUserData.role) ? '/super-admin' : '/');
      return safeUserData;
    } catch (error) {
      logger.error('Login error:', error?.message || error);
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      logger.warn('Logout request failed:', error.message);
    }

    setUser(null);
    setIsAuthenticated(false);
    clearStoredUser();
    clearApiCache();
    // Tear down the shared socket singleton on logout (destroyAll clears listeners too)
    socketService.destroyAll();
    navigate('/login');
  }, [navigate]);

  // PERF-05: Memoize the context value so navigation-triggered re-renders of
  // AuthProvider (it subscribes to useLocation) don't hand a new object to the
  // ~20 useAuth consumers. With login/logout stabilized via useCallback, this
  // value's identity only changes when user/isAuthenticated/loading change.
  const value = useMemo(() => ({
    user,
    isAuthenticated,
    login,
    logout,
    loading,
  }), [user, isAuthenticated, login, logout, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

