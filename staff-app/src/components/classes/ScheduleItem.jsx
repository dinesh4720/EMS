import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const ScheduleItem = ({ schedule, index, isToday = false }) => {
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;

  const {
    startTime,
    endTime,
    subject,
    class: className,
    room,
    type = 'class',
  } = schedule || {};

  const getTypeColor = () => {
    switch (type) {
      case 'break':
        return colors.tertiary;
      case 'lab':
        return colors.secondary;
      case 'assembly':
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  const color = getTypeColor();

  return (
    <View style={styles.container}>
      {/* Time Column */}
      <View style={[styles.timeColumn, { borderRightColor: colors.outlineVariant }]}>
        <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, textAlign: 'right' }]}>{startTime}</Text>
        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, textAlign: 'right' }]}>{endTime}</Text>
      </View>

      {/* Timeline */}
      <View style={styles.timelineColumn}>
        <View style={[styles.timelineDot, { backgroundColor: color, borderColor: colors.surface, borderWidth: 2 }]} />
        <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant }, index === 0 && { backgroundColor: 'transparent' }]} />
      </View>

      {/* Content */}
      <View
        style={[
          styles.contentColumn,
          {
            backgroundColor: isToday ? colors.surfaceContainer : 'transparent',
            borderRadius: shape.cornerMedium,
            borderColor: isToday ? colors.outlineVariant : 'transparent',
            borderWidth: isToday ? 1 : 0
          }
        ]}
      >
        <View style={[styles.subjectBadge, { backgroundColor: color + '15' }]}>
          <Text style={[typography.labelSmall, { color: color }]}>{subject || 'Class'}</Text>
        </View>
        {className && (
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>{className}</Text>
        )}
        {room && (
          <View style={styles.roomContainer}>
            <MapPin size={12} color={colors.onSurfaceVariant} style={{ marginRight: 4 }} />
            <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>{room}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeColumn: {
    width: 60,
    paddingRight: 12,
    alignItems: 'flex-end',
    borderRightWidth: 1,
  },
  timelineColumn: {
    width: 20,
    alignItems: 'center',
    marginLeft: -10, // Pull overlapping the border
    zIndex: 1,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: -6, // Connect to top
    zIndex: 1,
  },
  contentColumn: {
    flex: 1,
    padding: 12,
    marginLeft: 12,
  },
  subjectBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  roomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});

export default ScheduleItem;
