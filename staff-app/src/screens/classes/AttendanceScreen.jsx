import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Check, Save, AlertTriangle, Calendar as CalendarIcon, ChevronDown, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useClassContext } from '../../context/ClassContext';
import { StudentAttendanceRow, AttendanceSummaryCard, AttendanceDatePicker } from '../../components/attendance';
import { ATTENDANCE_STATUS } from '../../services/api';

const AttendanceScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;
  const { classId, className } = route.params || {};

  const {
    students,
    attendance,
    loading,
    error,
    fetchStudents,
    fetchAttendance,
    updateAttendanceStatus,
    markAllAttendance,
    saveAttendance,
    clearAttendance,
    getAttendanceSummary,
    offlineQueue,
  } = useClassContext();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load students and attendance on mount
  useFocusEffect(
    useCallback(() => {
      if (classId) {
        fetchStudents(classId);
        fetchAttendance(classId, selectedDate);
      }
    }, [classId, selectedDate])
  );

  // Track changes
  useEffect(() => {
    if (Object.keys(attendance).length > 0) {
      setHasChanges(true);
    }
  }, [attendance]);

  const handleStatusChange = (studentId, status) => {
    updateAttendanceStatus(studentId, status);
    setHasChanges(true);
  };

  const handleMarkAllPresent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markAllAttendance(ATTENDANCE_STATUS.PRESENT);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      Alert.alert('No Changes', 'Please mark attendance before saving.');
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await saveAttendance(classId, selectedDate);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (result.offline) {
          Alert.alert(
            'Saved Offline',
            'Attendance has been saved locally. It will sync when you\'re back online.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert(
            'Success',
            'Attendance has been saved successfully.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', result.error || 'Failed to save attendance.');
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    clearAttendance();
    setHasChanges(false);
  };

  const renderStudent = ({ item, index }) => {
    const studentAttendance = attendance[item.id];
    const status = studentAttendance?.status || null;

    return (
      <StudentAttendanceRow
        student={item}
        attendanceStatus={status}
        onStatusChange={handleStatusChange}
        rollNumber={item.rollNumber || (index + 1).toString().padStart(2, '0')}
      />
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <ChevronRight size={24} color={colors.onSurface} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', marginRight: 28 }}>
          <Text style={[typography.titleLarge, { color: colors.onSurface, textAlign: 'center' }]}>
            Mark Attendance
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{className}</Text>
        </View>
      </View>

      {/* Date Selector */}
      <Pressable
        style={({ pressed }) => [
          styles.dateSelector,
          {
            backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainer,
            borderRadius: shape.cornerMedium
          }
        ]}
        onPress={() => setShowDatePicker(!showDatePicker)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <CalendarIcon size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
          <Text style={[typography.labelLarge, { color: colors.onSurface }]}>Date:</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, marginRight: spacing.sm }]}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <ChevronDown size={20} color={colors.onSurfaceVariant} />
        </View>
      </Pressable>

      {/* Date Picker */}
      {showDatePicker && (
        <View style={styles.datePickerContainer}>
          <AttendanceDatePicker
            selectedDate={selectedDate}
            onDateSelect={handleDateChange}
            maxDate={new Date().toISOString().split('T')[0]}
          />
        </View>
      )}

      {/* Summary Card */}
      {!showDatePicker && <AttendanceSummaryCard summary={getAttendanceSummary()} />}

      {/* Actions Row */}
      {!showDatePicker && (
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.markAllButton,
              { backgroundColor: pressed ? colors.primaryContainer : colors.surfaceContainerHighest, borderRadius: shape.cornerMedium }
            ]}
            onPress={handleMarkAllPresent}
          >
            <Check size={18} color={colors.primary} style={{ marginRight: spacing.sm }} />
            <Text style={[typography.labelLarge, { color: colors.primary }]}>Mark All Present</Text>
          </Pressable>
        </View>
      )}

      {/* Student Count */}
      {!showDatePicker && (
        <View style={[styles.studentCountRow, { borderBottomColor: colors.outlineVariant }]}>
          <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}>
            {students.length} Students
          </Text>
        </View>
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, backgroundColor: colors.surface, borderTopColor: colors.outlineVariant }]}>
      {/* Offline Indicator */}
      {offlineQueue.length > 0 && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.tertiaryContainer }]}>
          <AlertTriangle size={16} color={colors.onTertiaryContainer} style={{ marginRight: spacing.md }} />
          <Text style={[typography.labelMedium, { color: colors.onTertiaryContainer }]}>
            {offlineQueue.length} record(s) pending sync
          </Text>
        </View>
      )}

      {/* Save Button */}
      <Pressable
        style={({ pressed }) => [
          styles.saveButton,
          { backgroundColor: (!hasChanges || saving) ? colors.surfaceContainerHighest : (pressed ? colors.primaryContainer : colors.primary), borderRadius: shape.pill },
          (!hasChanges || saving) && { opacity: 0.5 },
        ]}
        onPress={handleSave}
        disabled={!hasChanges || saving}
      >
        {saving ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <>
            <Save size={20} color={(!hasChanges || saving) ? colors.onSurfaceVariant : colors.onPrimary} style={{ marginRight: spacing.sm }} />
            <Text style={[typography.labelLarge, { color: (!hasChanges || saving) ? colors.onSurfaceVariant : colors.onPrimary }]}>
              Save Attendance
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );

  if (loading && students.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>Loading students...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderStudent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={showDatePicker ? [] : [0]}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  header: {
    // paddingTop: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  datePickerContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  actionsRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  studentCountRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  footer: {
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    elevation: 2,
  },
});

export default AttendanceScreen;
