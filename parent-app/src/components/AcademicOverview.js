import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';

const ProgressBar = ({ score }) => {
  const getProgressColor = (s) => {
    if (s >= 90) return colors.accentGreen;
    if (s >= 80) return colors.accentBlue;
    return colors.accentOrange;
  };

  return (
    <View style={styles.progressContainer}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${score}%`,
            backgroundColor: getProgressColor(score),
          },
        ]}
      />
    </View>
  );
};

const AcademicOverview = ({ student, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(175, 82, 222, 0.12)' }]}>
            <Ionicons name="book" size={20} color={colors.accentPurple} />
          </View>
          <View>
            <Text style={styles.title}>{student.name.split(' ')[0]}'s Academics</Text>
            <Text style={styles.subtitle}>
              {student.grade} • Roll No. {student.rollNo}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>

      {/* Subject Grades */}
      <View style={styles.subjects}>
        {student.subjects.slice(0, 3).map((subject, index) => (
          <View key={subject.name} style={styles.subjectRow}>
            <View style={styles.subjectInfo}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text
                  style={[
                    styles.subjectGrade,
                    {
                      color:
                        subject.score >= 90
                          ? colors.accentGreen
                          : subject.score >= 80
                          ? colors.accentBlue
                          : colors.accentOrange,
                    },
                  ]}
                >
                  {subject.grade}
                </Text>
              </View>
              <ProgressBar score={subject.score} />
            </View>
            <Text style={styles.subjectScore}>{subject.score}%</Text>
          </View>
        ))}
      </View>

      {/* View All */}
      <View style={styles.viewAll}>
        <Text style={styles.viewAllText}>
          View all {student.subjects.length} subjects
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  subjects: {
    gap: spacing.md,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  subjectGrade: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectScore: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textTertiary,
    width: 32,
    textAlign: 'right',
  },
  viewAll: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accentBlue,
  },
});

export default AcademicOverview;
