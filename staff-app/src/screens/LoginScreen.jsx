import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { API_BASE_URL } from '../config';

const BASE_URL = API_BASE_URL;

const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { login, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Fetch staff list on mount
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/staff/public`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Filter only active staff
        const activeStaff = data.filter(s => s.status === 'active');
        setStaffList(activeStaff);
      } catch (err) {
        console.error('Error fetching staff list:', err.message);
        setStaffList([]);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaffList();
  }, []);

  const handleLogin = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await login(email.trim(), password);

    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Login Failed', result.error || 'Please check your credentials and try again.');
    }
  }, [email, password, login]);

  const handleQuickLogin = useCallback((staffEmail) => {
    setEmail(staffEmail);
    setPassword(''); // Clear password - user must enter their actual password
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <LinearGradient
            colors={['#F2F2F7', '#FFFFFF']}
            style={styles.headerGradient}
          >
            {/* Logo/Icon */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoIcon}>👨‍🏫</Text>
              </View>
            </View>

            <Text style={styles.title}>Staff Portal</Text>
            <Text style={styles.subtitle}>Sign in to access your dashboard</Text>
          </LinearGradient>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.gray.dark}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.gray.dark}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  textContentType="password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Text style={styles.eyeIcon}>
                    {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Staff Quick Login */}
            <View style={styles.staffContainer}>
              <Text style={styles.staffTitle}>Select Staff - Tap to fill email</Text>

              {loadingStaff ? (
                <View style={styles.loadingStaff}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading staff...</Text>
                </View>
              ) : staffList.length === 0 ? (
                <View style={styles.loadingStaff}>
                  <Text style={styles.errorText}>Unable to load staff. Check if server is running.</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.staffScrollContent}
                >
                  {staffList.map((staff) => (
                    <TouchableOpacity
                      key={staff._id || staff.id}
                      style={styles.staffCard}
                      onPress={() => handleQuickLogin(staff.email, '')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.staffAvatar, staff.role === 'Admin' || staff.role === 'Super Admin' ? styles.adminAvatar : null]}>
                        <Text style={styles.staffAvatarText}>
                          {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </Text>
                      </View>
                      <Text style={styles.staffName} numberOfLines={1}>{staff.name.split(' ')[0]}</Text>
                      <Text style={styles.staffRole} numberOfLines={1}>{staff.role}</Text>
                      <Text style={styles.staffDept} numberOfLines={1}>{staff.department}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Password Hint */}
            <View style={styles.hintContainer}>
              <Text style={styles.hintText}>
                Enter your registered password to login
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Powered by EMS
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.gray.light,
    ...Shadows.small,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.semantic.error + '15',
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    ...Typography.subheadline,
    color: Colors.semantic.error,
    flex: 1,
  },
  loginButton: {
    backgroundColor: Colors.blue,
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...Shadows.medium,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    ...Typography.headline,
    color: '#FFFFFF',
    fontSize: 18,
  },
  staffContainer: {
    marginBottom: 16,
  },
  staffTitle: {
    ...Typography.caption1,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  loadingStaff: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorText: {
    ...Typography.subheadline,
    color: Colors.semantic.error,
    textAlign: 'center',
  },
  loadingText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    marginLeft: 8,
  },
  staffScrollContent: {
    paddingRight: 8,
  },
  staffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: 12,
    marginRight: 10,
    width: 100,
    alignItems: 'center',
    ...Shadows.small,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  adminAvatar: {
    backgroundColor: '#FF9500',
  },
  staffAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  staffName: {
    ...Typography.caption1,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  staffRole: {
    ...Typography.caption2,
    color: Colors.text.secondary,
    marginBottom: 1,
  },
  staffDept: {
    ...Typography.caption2,
    color: Colors.blue,
  },
  hintContainer: {
    backgroundColor: '#E8F4FD',
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 24,
  },
  hintText: {
    ...Typography.caption1,
    color: Colors.blue,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    ...Typography.caption1,
    color: Colors.text.tertiary,
  },
});

export default LoginScreen;
