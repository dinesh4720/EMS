import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';

const ScheduleCard = ({ student }) => {
  return (
    <View style={[styles.card, shadows.card]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 149, 0, 0.12)' }]}>
          <Ionicons name="time" size={20} color={colors.accentOrange} />
        </View>
        <View>
          <Text style={styles.title}>Today's Schedule</Text>
          <Text style={styles.subtitle}>{student.name.split(' ')[0]}'s classes</Text>
        </View>
      </View>

      {/* Classes */}
      <View style={styles.classes}>
        {student.upcomingClasses.map((classItem, index) => (
          <View
            key={index}
            style={[
              styles.classItem,
              index === 0 && styles.classItemActive,
            ]}
          >
            {/* Time */}
            <View style={styles.timeContainer}>
              <Text
                style={[
                  styles.time,
                  index === 0 && { color: colors.accentBlue },
                ]}
              >
                {classItem.time}
              </Text>
            </View>

            {/* Details */}
            <View style={styles.details}>
              <Text style={styles.subject}>{classItem.subject}</Text>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.detailText}>{classItem.room}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.detailText}>{classItem.teacher}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  classes: {
    gap: spacing.md,
  },
  classItem: {
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: borderRadius.md,
  },
  classItemActive: {
    backgroundColor: 'rgba(0, 113, 227, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 113, 227, 0.15)',
  },
  timeContainer: {
    width: 60,
    alignItems: 'center',
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  details: {
    flex: 1,
  },
  subject: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export default ScheduleCard;
