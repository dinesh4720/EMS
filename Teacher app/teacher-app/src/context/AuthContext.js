import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on app start
    AsyncStorage.getItem('teacher_user').then(stored => {
      if (stored) setUser(JSON.parse(stored));
      setLoading(false);
    });
  }, []);

  const login = async (phone, password) => {
    // FIXED: Demo login only in development
    if (process.env.NODE_ENV === 'development' && phone === '1234567890' && password === 'demo') {
      const demoUser = {
        id: 'demo-teacher-1',
        name: 'Demo Teacher',
        phone: '1234567890',
        email: 'demo@school.com',
        designation: 'Senior Teacher',
        employeeId: 'EMP001',
        joiningDate: '2020-01-15',
        role: 'teacher',
      };
      setUser(demoUser);
      await AsyncStorage.setItem('teacher_user', JSON.stringify(demoUser));
      return { success: true };
    }
    
    // Try API login for real credentials
    try {
      const userData = await authApi.login(phone, password);
      setUser(userData);
      await AsyncStorage.setItem('teacher_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? 'Invalid credentials. Demo: 1234567890 / demo' 
        : 'Invalid credentials';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('teacher_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
