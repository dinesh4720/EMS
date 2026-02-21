import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';

const StudentCard = ({ student, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      {/* Photo */}
      <Image source={{ uri: student.photo }} style={styles.photo} />

      {/* Name & Grade */}
      <View style={styles.info}>
        <Text style={styles.name}>{student.name.split(' ')[0]}</Text>
        <Text style={styles.grade}>
          {student.grade} • Section {student.section}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={[styles.statBox, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
          <Text style={styles.statLabel}>GPA</Text>
          <Text style={[styles.statValue, { color: colors.accentGreen }]}>
            {student.gpa.toFixed(1)}
          </Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: 'rgba(0, 113, 227, 0.1)' }]}>
          <Text style={styles.statLabel}>Attendance</Text>
          <Text style={[styles.statValue, { color: colors.accentBlue }]}>
            {student.attendance}%
          </Text>
        </View>
      </View>

      {/* View Details */}
      <View style={styles.viewDetails}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.accentBlue} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  info: {
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  grade: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accentBlue,
  },
});

export default StudentCard;
