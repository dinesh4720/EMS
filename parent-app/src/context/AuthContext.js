import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import CONFIG from '../config';
import api from '../services/api';
import socketService from '../services/socketService';

const SECURE_REFRESH_KEY = 'secure_refresh_token';

const AuthContext = createContext(null);

export const AuthProvider = ({ children: childrenProp }) => {
  const [user, setUser] = useState(null);
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Derived: currently selected student
  const student = childrenList[selectedChildIndex] || null;

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      const userData = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
      const childrenData = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.CHILDREN_DATA);
      const selectedIdx = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_CHILD);

      if (token && userData) {
        // Validate the token is still valid by calling the profile endpoint
        try {
          const profileResp = await api.getProfile();
          if (profileResp.success) {
            setUser(JSON.parse(userData));
            if (childrenData) {
              setChildrenList(JSON.parse(childrenData));
            }
            if (selectedIdx !== null) {
              setSelectedChildIndex(parseInt(selectedIdx) || 0);
            }
            setIsAuthenticated(true);
          } else {
            // Token invalid - clear storage
            await clearStorage();
          }
        } catch (err) {
          // Token expired or invalid - clear storage so user sees login
          await clearStorage();
        }
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.multiRemove([
        CONFIG.STORAGE_KEYS.AUTH_TOKEN,
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN, // legacy key – keep removal for migration
        CONFIG.STORAGE_KEYS.USER_DATA,
        CONFIG.STORAGE_KEYS.CHILDREN_DATA,
        CONFIG.STORAGE_KEYS.SELECTED_CHILD,
        CONFIG.STORAGE_KEYS.STUDENT_DATA,
      ]);
      // Remove securely-stored refresh token
      await SecureStore.deleteItemAsync(SECURE_REFRESH_KEY).catch(() => {});
    } catch (e) {
      // ignore
    }
  };

  const persistAuthSession = async (parent, accessToken, refreshToken) => {
    // Store access token in AsyncStorage; refresh token in SecureStore (encrypted)
    await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, accessToken);
    await SecureStore.setItemAsync(SECURE_REFRESH_KEY, refreshToken);

    // Store user data
    const userData = {
      id: parent.id,
      name: parent.name,
      phone: parent.phone,
      email: parent.email,
      avatar: parent.avatar,
    };
    await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(userData));

    // Store children data
    const childrenArr = parent.children || [];
    await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.CHILDREN_DATA, JSON.stringify(childrenArr));
    await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.SELECTED_CHILD, '0');

    setUser(userData);
    setChildrenList(childrenArr);
    setSelectedChildIndex(0);
    setIsAuthenticated(true);
  };

  const login = async (credentials) => {
    try {
      const response = await api.login({
        identifier: credentials.identifier,
        password: credentials.password,
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error?.message || 'Login failed',
        };
      }

      const { parent, accessToken, refreshToken } = response.data;
      await persistAuthSession(parent, accessToken, refreshToken);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const loginWithOtp = async ({ phone, otp }) => {
    try {
      const response = await api.verifyOtp({ phone, otp });

      if (!response.success) {
        return {
          success: false,
          error: response.error?.message || 'OTP verification failed',
          code: response.error?.code,
        };
      }

      const { parent, accessToken, refreshToken } = response.data;
      await persistAuthSession(parent, accessToken, refreshToken);

      return { success: true };
    } catch (error) {
      console.error('OTP login error:', error);
      return { success: false, error: error.message || 'OTP verification failed', code: error.code };
    }
  };

  const sendOtp = async (phone) => {
    try {
      const response = await api.sendOtp(phone);

      if (!response.success) {
        return {
          success: false,
          error: response.error?.message || 'Failed to send OTP',
          code: response.error?.code,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, error: error.message || 'Failed to send OTP', code: error.code };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore API errors during logout
    }

    // Reset socket before clearing state to prevent cross-user data leaks
    socketService.reset();

    await clearStorage();
    setUser(null);
    setChildrenList([]);
    setSelectedChildIndex(0);
    setIsAuthenticated(false);
  };

  const switchChild = async (index) => {
    if (index >= 0 && index < childrenList.length) {
      setSelectedChildIndex(index);
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.SELECTED_CHILD, String(index));
    }
  };

  const value = {
    user,
    student,
    children: childrenList,
    selectedChildIndex,
    loading,
    isAuthenticated,
    login,
    loginWithOtp,
    sendOtp,
    logout,
    switchChild,
  };

  return <AuthContext.Provider value={value}>{childrenProp}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
