import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { staffData } from "../data/mockData";

const AuthContext = createContext();

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
    
    // Default master user
    const creds = {
      "superid@test.com": { 
        password: "12345", 
        role: "Super Admin", 
        name: "Master User",
        id: "master"
      }
    };

    // Initialize staff credentials
    staffData.forEach(staff => {
      if (staff.email) {
        creds[staff.email] = {
          password: "password123", // Default password for staff
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
    // Use sessionStorage instead of localStorage to avoid tab collision
    const storedUser = sessionStorage.getItem("app_user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Validate that we have required fields
        if (userData.token) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Invalid stored user data:', err);
        sessionStorage.removeItem("app_user");
      }
    }
    setLoading(false);
  }, []);

  // Monitor session storage for changes (e.g., when AppContext clears expired token)
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = sessionStorage.getItem("app_user");
      if (!storedUser && isAuthenticated) {
        // Session was cleared, log out
        setUser(null);
        setIsAuthenticated(false);
        navigate("/login");
      }
    };

    // Listen for storage events instead of polling
    window.addEventListener('storage', checkAuth);
    
    return () => window.removeEventListener('storage', checkAuth);
  }, [isAuthenticated, navigate]);

  const login = async (emailOrPhone, password) => {
    try {
      // Call the backend API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailOrPhone.includes('@') ? emailOrPhone : undefined,
          phone: !emailOrPhone.includes('@') ? emailOrPhone : undefined,
          password
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const userData = await response.json();
      
      console.log('🔑 Login successful, token received:', userData.token ? 'YES' : 'NO');
      
      // Store user data in sessionStorage
      sessionStorage.setItem("app_user", JSON.stringify(userData));
      
      // Update state immediately
      setUser(userData);
      setIsAuthenticated(true);
      
      // Dispatch custom event synchronously (no delay needed)
      console.log('📢 Dispatching user-logged-in event');
      window.dispatchEvent(new Event('user-logged-in'));
      
      navigate("/");
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // Clear session storage instead of localStorage
    sessionStorage.removeItem("app_user");
    navigate("/login");
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
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      logout, 
      loading,
      credentials, // Exposing for settings page (only for super admin in real scenario)
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
