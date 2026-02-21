import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check, X, Clock, FileText } from 'lucide-react-native';
import { ATTENDANCE_COLORS, ATTENDANCE_STATUS } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const STATUS_ORDER = [
  ATTENDANCE_STATUS.PRESENT,
  ATTENDANCE_STATUS.ABSENT,
  ATTENDANCE_STATUS.LATE,
  ATTENDANCE_STATUS.EXCUSED,
];

const STATUS_ICONS = {
  present: Check,
  absent: X,
  late: Clock,
  excused: FileText,
};

const StudentAttendanceRow = ({
  student,
  attendanceStatus,
  onStatusChange,
  rollNumber,
  showPhoto = true,
}) => {
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;

  const handleStatusPress = (status) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStatusChange?.(student.id, status);
  };

  const currentColor = ATTENDANCE_COLORS[attendanceStatus] || colors.outline;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
      <Pressable style={styles.studentInfo} activeOpacity={0.7} onPress={() => handleStatusPress(attendanceStatus ? STATUS_ORDER[(STATUS_ORDER.indexOf(attendanceStatus) + 1) % STATUS_ORDER.length] : STATUS_ORDER[0])}>
        {showPhoto && (
          <View style={[styles.photoContainer, { borderColor: currentColor, borderRadius: shape.cornerMedium, marginRight: spacing.md }]}>
            {student.photo ? (
              <Image source={{ uri: student.photo }} style={styles.photo} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: currentColor + '30' }]}>
                <Text style={[typography.titleMedium, { color: currentColor }]}>
                  {student.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.nameContainer}>
          <Text style={[typography.bodyLarge, { color: colors.onSurface }]} numberOfLines={1}>
            {student.name}
          </Text>
          {rollNumber && (
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>Roll: {rollNumber}</Text>
          )}
        </View>
      </Pressable>

      <View style={[styles.statusButtons, { marginLeft: spacing.sm }]}>
        {STATUS_ORDER.map((status) => {
          const isActive = attendanceStatus === status;
          const color = ATTENDANCE_COLORS[status];
          const Icon = STATUS_ICONS[status];

          return (
            <Pressable
              key={status}
              style={({ pressed }) => [
                styles.statusButton,
                {
                  backgroundColor: isActive ? color : (pressed ? color + '20' : 'transparent'),
                  borderColor: isActive ? color : colors.outline,
                  borderWidth: isActive ? 0 : 1,
                  borderRadius: shape.cornerMedium,
                  marginLeft: spacing.xs
                }
              ]}
              onPress={() => handleStatusPress(status)}
            >
              <Icon size={16} color={isActive ? colors.onPrimary : color} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  photoContainer: {
    width: 44,
    height: 44,
    borderWidth: 2,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    flex: 1,
  },
  statusButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StudentAttendanceRow;
