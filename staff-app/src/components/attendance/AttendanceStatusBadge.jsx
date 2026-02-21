import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, BorderRadius } from '../../theme';
import { ATTENDANCE_COLORS } from '../../services/api';

const STATUS_LABELS = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
  pending: 'Pending',
  unmarked: 'Unmarked',
};

const AttendanceStatusBadge = ({ status, size = 'medium', showLabel = true }) => {
  const color = ATTENDANCE_COLORS[status] || ATTENDANCE_COLORS.pending;
  const label = STATUS_LABELS[status] || status;

  const sizeStyles = {
    small: {
      badge: { paddingHorizontal: 8, paddingVertical: 4 },
      dot: { width: 6, height: 6 },
      text: { ...Typography.caption2 },
    },
    medium: {
      badge: { paddingHorizontal: 12, paddingVertical: 6 },
      dot: { width: 8, height: 8 },
      text: { ...Typography.caption1 },
    },
    large: {
      badge: { paddingHorizontal: 16, paddingVertical: 8 },
      dot: { width: 10, height: 10 },
      text: { ...Typography.subheadline },
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.medium;

  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }, currentSize.badge]}>
      <View style={[styles.dot, { backgroundColor: color }, currentSize.dot]} />
      {showLabel && (
        <Text style={[styles.text, { color }, currentSize.text]}>{label}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  dot: {
    borderRadius: BorderRadius.full,
    marginRight: 6,
  },
  text: {
    fontWeight: '600',
  },
});

export default AttendanceStatusBadge;
