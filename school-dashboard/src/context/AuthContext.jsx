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
    const storedUser = localStorage.getItem("app_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userCreds = credentials[email];
        
        if (userCreds && userCreds.password === password) {
          const userData = {
            email,
            name: userCreds.name,
            role: userCreds.role,
            id: userCreds.id
          };
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem("app_user", JSON.stringify(userData));
          resolve(userData);
          navigate("/");
        } else {
          reject(new Error("Invalid email or password"));
        }
      }, 800);
    });
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("app_user");
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
