import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button, TextInput } from '../components';
import { isValidEmail, isValidPhone } from '../utils/helpers';
import { useTranslation } from 'react-i18next';

const RESEND_COOLDOWN_SECONDS = 30;

const LoginScreen = () => {
  const { t } = useTranslation();
  const { login, loginWithOtp, sendOtp } = useAuth();
  const { themeColors, spacing, typography } = useTheme();

  const [loginMode, setLoginMode] = useState('password'); // 'password' | 'otp'
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  const resetOtpFlow = () => {
    setOtp('');
    setOtpSent(false);
    setResendCountdown(0);
  };

  const switchMode = (mode) => {
    setLoginMode(mode);
    setError('');
    resetOtpFlow();
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Please contact your school administration to reset your password. They will provide you with new login credentials.',
      [{ text: 'OK' }]
    );
  };

  const validatePasswordLogin = () => {
    const id = identifier.trim();
    if (!id) {
      setError('Please enter your email or phone number');
      return null;
    }

    const looksLikeEmail = id.includes('@');
    if (looksLikeEmail && !isValidEmail(id)) {
      setError('Please enter a valid email address');
      return null;
    }
    if (!looksLikeEmail && !isValidPhone(id)) {
      setError('Please enter a valid phone number (10–15 digits)');
      return null;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return null;
    }

    return { identifier: id, password };
  };

  const validateOtpPhone = () => {
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      setError('Please enter your phone number');
      return null;
    }
    if (!isValidPhone(normalizedPhone)) {
      setError('Please enter a valid phone number (10–15 digits)');
      return null;
    }
    return normalizedPhone;
  };

  const handleSendOtp = async (isResend = false) => {
    const normalizedPhone = validateOtpPhone();
    if (!normalizedPhone) return;

    setError('');
    setLoading(true);

    try {
      const result = await sendOtp(normalizedPhone);
      if (!result.success) {
        setError(result.error || 'Failed to send OTP');
        return;
      }

      setOtpSent(true);
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      if (!isResend) {
        setOtp('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const normalizedPhone = validateOtpPhone();
    if (!normalizedPhone) return;

    const code = otp.trim();
    if (!code || code.length < 4) {
      setError('Please enter the OTP sent to your phone');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await loginWithOtp({ phone: normalizedPhone, otp: code });
      if (!result.success) {
        setError(result.error || 'OTP verification failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    const credentials = validatePasswordLogin();
    if (!credentials) return;

    setError('');
    setLoading(true);

    try {
      const result = await login(credentials);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordForm = () => (
    <>
      <TextInput
        label={t('screens.emailOrPhoneNumber')}
        value={identifier}
        onChangeText={setIdentifier}
        placeholder={t('screens.enterYourEmailOrPhoneNumber')}
        keyboardType="default"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        label={t('screens.password1')}
        value={password}
        onChangeText={setPassword}
        placeholder={t('screens.enterYourPassword')}
        secureTextEntry
      />

      <Button
        title={t('screens.signIn')}
        onPress={handlePasswordLogin}
        loading={loading}
        style={styles.button}
      />

      <TouchableOpacity style={styles.link} onPress={handleForgotPassword}>
        <Text style={[styles.linkText, { color: themeColors.textSecondary }]}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.link} onPress={() => switchMode('otp')}>
        <Text style={[styles.linkTextPrimary, { color: themeColors.primary }]}>
          Login with OTP
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderOtpForm = () => (
    <>
      <TextInput
        label="Phone Number"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          if (otpSent) resetOtpFlow();
        }}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!otpSent}
      />

      {otpSent && (
        <TextInput
          label="OTP"
          value={otp}
          onChangeText={setOtp}
          placeholder="Enter 6-digit OTP"
          keyboardType="number-pad"
          maxLength={10}
        />
      )}

      {!otpSent ? (
        <Button
          title="Send OTP"
          onPress={() => handleSendOtp(false)}
          loading={loading}
          style={styles.button}
        />
      ) : (
        <Button
          title="Verify OTP"
          onPress={handleVerifyOtp}
          loading={loading}
          style={styles.button}
        />
      )}

      {otpSent && (
        <View style={styles.otpActions}>
          <TouchableOpacity
            style={styles.link}
            onPress={() => handleSendOtp(true)}
            disabled={resendCountdown > 0 || loading}
          >
            <Text
              style={[
                styles.linkTextPrimary,
                {
                  color: resendCountdown > 0 ? themeColors.textTertiary : themeColors.primary,
                },
              ]}
            >
              {resendCountdown > 0
                ? `Resend OTP in ${resendCountdown}s`
                : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.link} onPress={() => switchMode('password')}>
        <Text style={[styles.linkTextPrimary, { color: themeColors.primary }]}>
          Login with password
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: themeColors.backgroundSecondary }]}>
              <Text style={[styles.logoText, { color: themeColors.text }]}>P</Text>
            </View>
            <Text style={[styles.title, { color: themeColors.text }]}>{t('screens.parentPortal')}</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Stay connected with your child's education
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <Text style={[styles.errorText, { color: themeColors.error }]}>
                {error}
              </Text>
            ) : null}

            {loginMode === 'password' ? renderPasswordForm() : renderOtpForm()}
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: themeColors.textTertiary }]}>
              Having trouble? Contact school administration
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
  link: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
  },
  linkTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
  },
  otpActions: {
    alignItems: 'center',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default LoginScreen;
