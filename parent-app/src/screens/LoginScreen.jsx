import React, { useState } from 'react';
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

const LoginScreen = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { themeColors, spacing, typography } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Please contact your school administration to reset your password. They will provide you with new login credentials.',
      [{ text: 'OK' }]
    );
  };

  const handleLogin = async () => {
    const id = identifier.trim();
    if (!id) {
      setError('Please enter your email or phone number');
      return;
    }

    // Validate format: must be a valid email OR a valid phone number
    const looksLikeEmail = id.includes('@');
    if (looksLikeEmail && !isValidEmail(id)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!looksLikeEmail && !isValidPhone(id)) {
      setError('Please enter a valid phone number (10–15 digits)');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await login({ identifier: identifier.trim(), password });
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

            {error ? (
              <Text style={[styles.errorText, { color: themeColors.error }]}>
                {error}
              </Text>
            ) : null}

            <Button
              title={t('screens.signIn')}
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />

            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={[styles.forgotText, { color: themeColors.textSecondary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
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
  forgotPassword: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotText: {
    fontSize: 14,
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
