import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { staffApi } from '../services/api';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

// Password Input Component - defined outside to prevent re-renders
const PasswordInput = React.memo(({ value, onChangeText, placeholder, label, showPassword, onTogglePassword }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.passwordInputContainer}>
      <TextInput
        style={styles.passwordInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.tertiary}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        editable={true}
        multiline={false}
      />
      <TouchableOpacity
        onPress={onTogglePassword}
        style={styles.showPasswordButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.showPasswordText}>
          {showPassword ? '🙈' : '👁️'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
));

const ChangePasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = useCallback(() => {
    if (!currentPassword) {
      Alert.alert('Validation Error', 'Please enter your current password.');
      return false;
    }

    if (!newPassword) {
      Alert.alert('Validation Error', 'Please enter a new password.');
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert('Validation Error', 'New password must be at least 8 characters long.');
      return false;
    }

    if (!confirmPassword) {
      Alert.alert('Validation Error', 'Please confirm your new password.');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirm password do not match.');
      return false;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Validation Error', 'New password must be different from current password.');
      return false;
    }

    return true;
  }, [currentPassword, newPassword, confirmPassword]);

  const handleSave = useCallback(async () => {
    if (!user?.id) return;

    if (!validateForm()) return;

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await staffApi.changePassword(user.id, currentPassword, newPassword);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Success',
        'Password changed successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error changing password:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (error.message.includes('incorrect') || error.message.includes('wrong')) {
        Alert.alert('Error', 'Current password is incorrect. Please try again.');
      } else if (error.message.includes('same')) {
        Alert.alert('Error', 'New password must be different from current password.');
      } else {
        Alert.alert('Error', error.message || 'Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, currentPassword, newPassword, validateForm, navigation]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        removeClippedSubviews={false}
        scrollEnabled={true}
      >
        {/* Security Notice */}
        <View style={styles.notice}>
          <Text style={styles.noticeIcon}>🔒</Text>
          <Text style={styles.noticeText}>
            Your password must be at least 8 characters long and different from your current password.
          </Text>
        </View>

        {/* Password Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Password Information</Text>
          <View style={styles.sectionContent}>
            <PasswordInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              showPassword={showCurrentPassword}
              onTogglePassword={() => setShowCurrentPassword(!showCurrentPassword)}
            />
            <View style={styles.inputDivider} />
            <PasswordInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              showPassword={showNewPassword}
              onTogglePassword={() => setShowNewPassword(!showNewPassword)}
            />
            <View style={styles.inputDivider} />
            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </View>
        </View>

        {/* Password Requirements */}
        <View style={styles.requirements}>
          <Text style={styles.requirementsTitle}>Password Requirements:</Text>
          <View style={styles.requirementItem}>
            <Text style={styles.requirementIcon}>✓</Text>
            <Text style={styles.requirementText}>At least 8 characters long</Text>
          </View>
          <View style={styles.requirementItem}>
            <Text style={styles.requirementIcon}>✓</Text>
            <Text style={styles.requirementText}>Different from current password</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.background.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Change Password</Text>
          )}
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gray.light,
  },
  backButton: {
    padding: Spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.blue,
  },
  headerTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  noticeIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  noticeText: {
    ...Typography.subheadline,
    color: Colors.blue,
    flex: 1,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
    fontSize: 13,
  },
  sectionContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  inputGroup: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputLabel: {
    ...Typography.caption1,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
    padding: 0,
    minHeight: 30,
  },
  showPasswordButton: {
    padding: Spacing.xs,
  },
  showPasswordText: {
    fontSize: 18,
  },
  inputDivider: {
    height: 0.5,
    backgroundColor: Colors.gray.light,
    marginHorizontal: Spacing.md,
  },
  requirements: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  requirementsTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  requirementIcon: {
    ...Typography.body,
    color: Colors.green,
    marginRight: Spacing.sm,
  },
  requirementText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  saveButton: {
    backgroundColor: Colors.blue,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    ...Typography.headline,
    color: Colors.background.primary,
  },
});

export default ChangePasswordScreen;
