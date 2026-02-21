import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ATTENDANCE_COLORS } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const AttendanceSummaryCard = ({ summary, compact = false }) => {
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;

  const {
    present = 0,
    absent = 0,
    late = 0,
    excused = 0,
    unmarked = 0,
    total = 0,
    percentage = 0,
  } = summary || {};

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge }]}>
        <View style={styles.compactStats}>
          <View style={[styles.compactStat, { backgroundColor: ATTENDANCE_COLORS.present + '15', borderRadius: shape.cornerMedium }]}>
            <Text style={[typography.headlineSmall, { color: ATTENDANCE_COLORS.present, fontWeight: '700' }]}>{present}</Text>
            <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Present</Text>
          </View>
          <View style={[styles.compactStat, { backgroundColor: ATTENDANCE_COLORS.absent + '15', borderRadius: shape.cornerMedium }]}>
            <Text style={[typography.headlineSmall, { color: ATTENDANCE_COLORS.absent, fontWeight: '700' }]}>{absent}</Text>
            <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Absent</Text>
          </View>
          <View style={[styles.compactStat, { backgroundColor: colors.primary + '15', borderRadius: shape.cornerMedium }]}>
            <Text style={[typography.headlineSmall, { color: colors.primary, fontWeight: '700' }]}>{percentage}%</Text>
            <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Rate</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge }]}>
      <View style={[styles.header, { marginBottom: spacing.md }]}>
        <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Attendance Summary</Text>
        <View style={[styles.percentageBadge, { backgroundColor: (percentage >= 75 ? ATTENDANCE_COLORS.present : ATTENDANCE_COLORS.absent) + '20', borderRadius: shape.pill }]}>
          <Text style={[typography.labelMedium, { color: percentage >= 75 ? ATTENDANCE_COLORS.present : ATTENDANCE_COLORS.absent, fontWeight: '700' }]}>
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, { marginBottom: spacing.md }]}>
        <View style={[styles.progressBar, { backgroundColor: colors.surfaceContainerHighest, borderRadius: shape.pill }]}>
          {present > 0 && (
            <View style={[styles.progressSegment, { flex: present, backgroundColor: ATTENDANCE_COLORS.present }]} />
          )}
          {late > 0 && (
            <View style={[styles.progressSegment, { flex: late, backgroundColor: ATTENDANCE_COLORS.late }]} />
          )}
          {excused > 0 && (
            <View style={[styles.progressSegment, { flex: excused, backgroundColor: ATTENDANCE_COLORS.excused }]} />
          )}
          {absent > 0 && (
            <View style={[styles.progressSegment, { flex: absent, backgroundColor: ATTENDANCE_COLORS.absent }]} />
          )}
          {unmarked > 0 && (
            <View style={[styles.progressSegment, { flex: unmarked, backgroundColor: colors.outlineVariant }]} />
          )}
        </View>
      </View>

      {/* Stats Grid */}
      <View style={[styles.statsGrid, { marginBottom: spacing.md }]}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: ATTENDANCE_COLORS.present }]} />
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, flex: 1 }]}>Present</Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface, fontWeight: '600' }]}>{present}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: ATTENDANCE_COLORS.absent }]} />
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, flex: 1 }]}>Absent</Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface, fontWeight: '600' }]}>{absent}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: ATTENDANCE_COLORS.late }]} />
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, flex: 1 }]}>Late</Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface, fontWeight: '600' }]}>{late}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: ATTENDANCE_COLORS.excused }]} />
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, flex: 1 }]}>Excused</Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface, fontWeight: '600' }]}>{excused}</Text>
        </View>
      </View>

      {/* Total */}
      <View style={[styles.totalRow, { borderTopColor: colors.outlineVariant, paddingTop: spacing.sm }]}>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>Total Students</Text>
        <Text style={[typography.titleMedium, { color: colors.onSurface }]}>{total}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressBarContainer: {
    // Margin handled inline
  },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    overflow: 'hidden',
  },
  progressSegment: {
    height: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
    paddingRight: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  // Compact styles
  compactContainer: {
    padding: 12,
  },
  compactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  compactStat: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
  },
});

export default AttendanceSummaryCard;
