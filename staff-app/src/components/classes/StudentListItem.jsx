import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronRight, User } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import AttendanceStatusBadge from '../attendance/AttendanceStatusBadge';

const StudentListItem = ({
  student,
  onPress,
  showAttendance = false,
  attendanceStatus,
  showContact = false,
}) => {
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(student);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surface,
          borderBottomColor: colors.outlineVariant
        }
      ]}
      onPress={handlePress}
    >
      {/* Photo/Avatar */}
      <View style={[styles.photoContainer, { marginRight: spacing.md }]}>
        {student.photo ? (
          <Image source={{ uri: student.photo }} style={[styles.photo, { borderRadius: shape.cornerMedium }]} />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.secondaryContainer, borderRadius: shape.cornerMedium }]}>
            <Text style={[typography.titleMedium, { color: colors.onSecondaryContainer }]}>{getInitials(student.name)}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={[typography.bodyLarge, { color: colors.onSurface }]} numberOfLines={1}>
          {student.name || 'Unknown Student'}
        </Text>
        <View style={styles.detailsRow}>
          {student.rollNumber && (
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>Roll: {student.rollNumber}</Text>
          )}
          {student.gender && (
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}> • {student.gender}</Text>
          )}
        </View>
        {showContact && student.parentPhone && (
          <Text style={[typography.labelSmall, { color: colors.primary, marginTop: 2 }]}>Parent: {student.parentPhone}</Text>
        )}
      </View>

      {/* Status or Arrow */}
      <View style={[styles.rightContainer, { marginLeft: spacing.sm }]}>
        {showAttendance && attendanceStatus ? (
          <AttendanceStatusBadge status={attendanceStatus} size="small" />
        ) : (
          <ChevronRight size={24} color={colors.onSurfaceVariant} />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  photoContainer: {
    // Margin handled inline
  },
  photo: {
    width: 44,
    height: 44,
  },
  photoPlaceholder: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  rightContainer: {
    // Margin handled inline
  },
});

export default StudentListItem;
