import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Moon,
  Calendar,
  ChevronUp,
  X as CloseIcon,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { attendanceApi } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Success Animation Component with Confetti-like effect
const SuccessAnimation = ({ visible, status, onAnimationEnd }) => {
  const { colors, shape } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef([...Array(8)].map(() => ({
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
    scale: new Animated.Value(0),
    opacity: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    if (visible) {
      // Main circle animation
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Checkmark draw animation
        Animated.timing(checkmarkAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Particle burst animation
        Animated.parallel(
          particleAnims.map((anim, index) => {
            const angle = (index * Math.PI * 2) / particleAnims.length;
            const distance = 60;
            return Animated.sequence([
              Animated.parallel([
                Animated.timing(anim.translateX, {
                  toValue: Math.cos(angle) * distance,
                  duration: 500,
                  useNativeDriver: true,
                }),
                Animated.timing(anim.translateY, {
                  toValue: Math.sin(angle) * distance,
                  duration: 500,
                  useNativeDriver: true,
                }),
                Animated.timing(anim.opacity, {
                  toValue: 1,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.spring(anim.scale, {
                  toValue: 1,
                  friction: 3,
                  useNativeDriver: true,
                }),
              ]),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 300,
                delay: 200,
                useNativeDriver: true,
              }),
            ]);
          })
        ),
      ]).start(() => {
        setTimeout(onAnimationEnd, 1500);
      });
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      checkmarkAnim.setValue(0);
      particleAnims.forEach(anim => {
        anim.translateX.setValue(0);
        anim.translateY.setValue(0);
        anim.scale.setValue(0);
        anim.opacity.setValue(0);
      });
    }
  }, [visible]);

  if (!visible) return null;

  const getStatusColor = () => {
    switch (status) {
      case 'present': return colors.success;
      case 'absent': return colors.error;
      case 'leave': return colors.warning;
      case 'halfday': return colors.tertiary;
      default: return colors.success;
    }
  };

  return (
    <View style={[styles.successOverlay, { backgroundColor: colors.surface }]}>
      <Animated.View
        style={[
          styles.successCircle,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            backgroundColor: `${getStatusColor()}20`,
            borderColor: getStatusColor(),
            borderRadius: shape.pill,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: checkmarkAnim }] }}>
          <CheckCircle size={60} color={getStatusColor()} />
        </Animated.View>
      </Animated.View>
      {/* Particle effects */}
      {particleAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              backgroundColor: getStatusColor(),
              transform: [
                { translateX: anim.translateX },
                { translateY: anim.translateY },
                { scale: anim.scale },
              ],
              opacity: anim.opacity,
            },
          ]}
        />
      ))}
      <Animated.Text
        style={[
          styles.successLabel,
          {
            opacity: opacityAnim,
            color: getStatusColor(),
          },
        ]}
      >
        {status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : status === 'leave' ? 'On Leave' : 'Half Day'}
      </Animated.Text>
    </View>
  );
};

// Reason Input Modal Component
const ReasonModal = ({ visible, status, onClose, onSubmit, submitting }) => {
  const { colors, typography, spacing, shape } = useTheme();
  const [reason, setReason] = useState('');
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      setReason('');
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getStatusInfo = () => {
    switch (status) {
      case 'absent':
        return { color: colors.error, icon: XCircle, label: 'Absent' };
      case 'leave':
        return { color: colors.warning, icon: Calendar, label: 'Leave' };
      case 'halfday':
        return { color: colors.tertiary, icon: Moon, label: 'Half Day' };
      default:
        return { color: colors.onSurfaceVariant, icon: AlertCircle, label: 'Other' };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleSubmit = () => {
    if (reason.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSubmit(reason.trim());
    }
  };

  const getPlaceholder = () => {
    switch (status) {
      case 'absent': return 'e.g., Not feeling well, Family emergency...';
      case 'leave': return 'e.g., Personal work, Medical appointment...';
      case 'halfday': return 'e.g., Doctor appointment at 2 PM...';
      default: return 'Enter reason...';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View
            style={[
              styles.modalContent,
              { 
                transform: [{ translateX: slideAnim }],
                backgroundColor: colors.surface,
                borderTopLeftRadius: shape.cornerXLarge,
                borderTopRightRadius: shape.cornerXLarge,
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.surfaceVariant }]}>
              <View style={[styles.modalIconContainer, { backgroundColor: `${statusInfo.color}15` }]}>
                <StatusIcon size={24} color={statusInfo.color} />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={[typography.titleLarge, { color: colors.onSurface }]}>Mark as {statusInfo.label}</Text>
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>Please provide a reason</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <CloseIcon size={24} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[typography.labelLarge, { color: colors.onSurface, marginBottom: spacing.sm }]}>Reason *</Text>
              <TextInput
                style={[
                  styles.reasonInput, 
                  typography.bodyLarge,
                  { 
                    backgroundColor: colors.surfaceContainer,
                    color: colors.onSurface,
                    borderRadius: shape.cornerMedium,
                    padding: spacing.md,
                  }
                ]}
                placeholder={getPlaceholder()}
                placeholderTextColor={colors.onSurfaceVariant}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, textAlign: 'right', marginTop: spacing.xs }]}>
                {reason.length}/200
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  { 
                    backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainer,
                    borderRadius: shape.cornerMedium,
                    paddingVertical: spacing.md,
                  }
                ]}
                onPress={onClose}
              >
                <Text style={[typography.labelLarge, { color: colors.onSurfaceVariant }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  { 
                    backgroundColor: !reason.trim() ? colors.surfaceContainer : pressed ? statusInfo.color + 'CC' : statusInfo.color,
                    borderRadius: shape.cornerMedium,
                    paddingVertical: spacing.md,
                  },
                  !reason.trim() && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!reason.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>Submit</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const AttendanceCard = ({ staffId, staffName }) => {
  const { colors, typography, spacing, shape, shadows } = useTheme();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [animatedStatus, setAnimatedStatus] = useState(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const fetchTodayAttendance = useCallback(async () => {
    if (!staffId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await attendanceApi.getTodayAttendance(staffId);
      setAttendance(data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance status');
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  const handleMarkAttendance = async (status, reason = '') => {
    if (submitting || (attendance && attendance.status !== 'unmarked')) return;

    // If status is not 'present', show reason modal
    if (status !== 'present' && !reason) {
      setSelectedStatus(status);
      setReasonModalVisible(true);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      setReasonModalVisible(false);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await attendanceApi.markAttendance(staffId, status, reason);

      // Animate out current content
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAttendance(result.attendance);
        setAnimatedStatus(status);
        setShowSuccessAnimation(true);

        // Animate in new content
        slideAnim.setValue(20);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } catch (err) {
      console.error('Error marking attendance:', err);
      setError(err.message || 'Failed to mark attendance. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessAnimationEnd = () => {
    setShowSuccessAnimation(false);
    setSuccessMessage(`Attendance marked as ${animatedStatus}!`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return colors.success;
      case 'absent':
        return colors.error;
      case 'leave':
        return colors.warning;
      case 'halfday':
        return colors.tertiary;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle size={20} color={colors.success} />;
      case 'absent':
        return <XCircle size={20} color={colors.error} />;
      case 'leave':
        return <Calendar size={20} color={colors.warning} />;
      case 'halfday':
        return <Moon size={20} color={colors.tertiary} />;
      default:
        return <Clock size={20} color={colors.onSurfaceVariant} />;
    }
  };

  const getStatusLabel = (status) => {
    if (!status || status === 'unmarked') return 'Not Marked';
    if (status === 'halfday') return 'Half Day';
    if (status === 'leave') return 'On Leave';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const isAttendanceMarked = attendance && attendance.status && attendance.status !== 'unmarked';
  const currentTime = today.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceContainerLow, borderRadius: shape.cornerLarge }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>Loading attendance...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.surfaceContainer, 
      borderRadius: shape.cornerLarge,
      marginHorizontal: spacing.md,
      marginVertical: spacing.sm,
    }]}>
      {/* Success Animation Overlay */}
      <SuccessAnimation
        visible={showSuccessAnimation}
        status={animatedStatus}
        onAnimationEnd={handleSuccessAnimationEnd}
      />

      {/* Reason Input Modal */}
      <ReasonModal
        visible={reasonModalVisible}
        status={selectedStatus}
        onClose={() => setReasonModalVisible(false)}
        onSubmit={(reason) => handleMarkAttendance(selectedStatus, reason)}
        submitting={submitting}
      />

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Today's Attendance</Text>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>{formattedDate}</Text>
          </View>
          {isAttendanceMarked && (
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(attendance.status)}15` }]}>
              {getStatusIcon(attendance.status)}
              <Text style={[typography.labelLarge, { color: getStatusColor(attendance.status) }]}>
                {getStatusLabel(attendance.status)}
              </Text>
            </View>
          )}
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: `${colors.error}10` }]}>
            <AlertCircle size={16} color={colors.error} />
            <Text style={[typography.bodySmall, { color: colors.error, flex: 1 }]}>{error}</Text>
          </View>
        )}

        {successMessage && (
          <View style={[styles.successContainer, { backgroundColor: `${colors.success}10` }]}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={[typography.labelMedium, { color: colors.success, flex: 1 }]}>{successMessage}</Text>
          </View>
        )}

        {!isAttendanceMarked ? (
          <View style={styles.actionContainer}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.md }]}>
              Mark your attendance for today
            </Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  { 
                    backgroundColor: pressed ? colors.success : colors.success,
                    opacity: pressed ? 0.8 : 1,
                    borderRadius: shape.cornerMedium,
                  }
                ]}
                onPress={() => handleMarkAttendance('present')}
                disabled={submitting}
              >
                <View style={styles.buttonGradient}>
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.onSuccess} />
                  ) : (
                    <>
                      <Check size={20} color={colors.onSuccess} strokeWidth={3} />
                      <Text style={[typography.labelLarge, { color: colors.onSuccess }]}>Present</Text>
                    </>
                  )}
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  { 
                    backgroundColor: pressed ? colors.error + '20' : 'transparent',
                    borderColor: colors.error,
                    borderWidth: 1.5,
                    borderRadius: shape.cornerMedium,
                  }
                ]}
                onPress={() => handleMarkAttendance('absent')}
                disabled={submitting}
              >
                <View style={styles.absentButtonContent}>
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <>
                      <X size={20} color={colors.error} strokeWidth={3} />
                      <Text style={[typography.labelLarge, { color: colors.error }]}>Absent</Text>
                    </>
                  )}
                </View>
              </Pressable>
            </View>

            {/* More Options Toggle */}
            <TouchableOpacity
              style={styles.moreOptionsButton}
              onPress={() => setShowMoreOptions(!showMoreOptions)}
              activeOpacity={0.7}
            >
              <Text style={[typography.labelLarge, { color: colors.onSurfaceVariant }]}>More Options</Text>
              <ChevronUp
                size={16}
                color={colors.onSurfaceVariant}
                style={{ transform: [{ rotate: showMoreOptions ? '0deg' : '180deg' }] }}
              />
            </TouchableOpacity>

            {/* Additional Options (Leave, Half Day) */}
            {showMoreOptions && (
              <Animated.View style={styles.moreOptionsContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.optionButton,
                    { 
                      backgroundColor: pressed ? colors.warning + '20' : 'transparent',
                      borderColor: colors.warning,
                      borderWidth: 1.5,
                      borderRadius: shape.cornerMedium,
                    }
                  ]}
                  onPress={() => handleMarkAttendance('leave')}
                  disabled={submitting}
                >
                  <Calendar size={18} color={colors.warning} strokeWidth={2.5} />
                  <Text style={[typography.labelMedium, { color: colors.warning }]}>
                    Apply Leave
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.optionButton,
                    { 
                      backgroundColor: pressed ? colors.tertiary + '20' : 'transparent',
                      borderColor: colors.tertiary,
                      borderWidth: 1.5,
                      borderRadius: shape.cornerMedium,
                    }
                  ]}
                  onPress={() => handleMarkAttendance('halfday')}
                  disabled={submitting}
                >
                  <Moon size={18} color={colors.tertiary} strokeWidth={2.5} />
                  <Text style={[typography.labelMedium, { color: colors.tertiary }]}>
                    Half Day
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </View>
        ) : (
          <View style={styles.markedContainer}>
            <View style={[styles.timeContainer, { backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.cornerMedium }]}>
              <View style={styles.timeRow}>
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, textTransform: 'uppercase' }]}>Check In</Text>
                <Text style={[typography.titleLarge, { color: colors.onSurface }]}>
                  {attendance.checkInTime || currentTime}
                </Text>
              </View>
              {attendance.checkOutTime && attendance.checkOutTime !== '-' && (
                <View style={styles.timeRow}>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, textTransform: 'uppercase' }]}>Check Out</Text>
                  <Text style={[typography.titleLarge, { color: colors.onSurface }]}>{attendance.checkOutTime}</Text>
                </View>
              )}
            </View>
            {attendance.reason && (
              <View style={[styles.reasonContainer, { backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.cornerMedium, padding: spacing.md }]}>
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, marginBottom: 4 }]}>Reason:</Text>
                <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>{attendance.reason}</Text>
              </View>
            )}
            <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm }]}>
              Attendance marked for today
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  absentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  moreOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
    gap: 6,
  },
  moreOptionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  markedContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 12,
  },
  timeRow: {
    alignItems: 'center',
  },
  reasonContainer: {
    marginBottom: 12,
  },
  // Success Animation Styles
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  successLabel: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  reasonInput: {
    minHeight: 120,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});

export default AttendanceCard;
