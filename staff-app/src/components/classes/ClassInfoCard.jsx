import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BookOpen, MapPin, User, Users } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const ClassInfoCard = ({ classData, showStats = true }) => {
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;

  const {
    name,
    section,
    subject,
    room,
    teacher,
    studentCount,
    schedule,
  } = classData || {};

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge }]}>
      {/* Header */}
      <View style={[styles.header, { marginBottom: spacing.md }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.secondaryContainer, borderRadius: shape.cornerMedium }]}>
          <BookOpen size={24} color={colors.onSecondaryContainer} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[typography.headlineSmall, { color: colors.onSurface }]}>{name || 'Unknown Class'}</Text>
          {section && <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>Section: {section}</Text>}
        </View>
      </View>

      {/* Info Grid */}
      <View style={[styles.infoGrid, { marginBottom: spacing.md }]}>
        {subject && (
          <View style={[styles.infoItem, { marginBottom: spacing.sm }]}>
            <BookOpen size={16} color={colors.onSurfaceVariant} style={{ marginRight: spacing.sm }} />
            <View style={styles.infoContent}>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Subject</Text>
              <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>{subject}</Text>
            </View>
          </View>
        )}
        {room && (
          <View style={[styles.infoItem, { marginBottom: spacing.sm }]}>
            <MapPin size={16} color={colors.onSurfaceVariant} style={{ marginRight: spacing.sm }} />
            <View style={styles.infoContent}>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Room</Text>
              <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>{room}</Text>
            </View>
          </View>
        )}
        {teacher && (
          <View style={[styles.infoItem, { marginBottom: spacing.sm }]}>
            <User size={16} color={colors.onSurfaceVariant} style={{ marginRight: spacing.sm }} />
            <View style={styles.infoContent}>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Teacher</Text>
              <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>{teacher}</Text>
            </View>
          </View>
        )}
        {studentCount !== undefined && (
          <View style={[styles.infoItem, { marginBottom: spacing.sm }]}>
            <Users size={16} color={colors.onSurfaceVariant} style={{ marginRight: spacing.sm }} />
            <View style={styles.infoContent}>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Students</Text>
              <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>{studentCount}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Schedule */}
      {schedule && schedule.length > 0 && (
        <View style={[styles.scheduleSection, { borderTopColor: colors.outlineVariant, paddingTop: spacing.md, marginTop: spacing.xs }]}>
          <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.sm }]}>Today's Schedule</Text>
          {schedule.map((item, index) => (
            <View key={index} style={[styles.scheduleItem, { paddingVertical: spacing.xs }]}>
              <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
                {item.startTime} - {item.endTime}
              </Text>
              <Text style={[typography.bodyMedium, { color: colors.primary }]}>{item.subject || subject}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Stats */}
      {showStats && studentCount !== undefined && (
        <View style={[styles.statsRow, { borderTopColor: colors.outlineVariant, paddingTop: spacing.md }]}>
          <View style={styles.statItem}>
            <Text style={[typography.headlineSmall, { color: colors.primary }]}>{studentCount}</Text>
            <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Students</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.statItem}>
            <Text style={[typography.headlineSmall, { color: colors.primary }]}>85%</Text>
            <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Avg Attendance</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.statItem}>
            <Text style={[typography.headlineSmall, { color: colors.primary }]}>A</Text>
            <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Avg Grade</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  infoGrid: {
    // marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  scheduleSection: {
    borderTopWidth: 1,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
});

export default ClassInfoCard;
