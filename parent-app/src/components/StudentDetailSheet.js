import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';

const StudentDetailSheet = ({ student, onClose }) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image source={{ uri: student.photo }} style={styles.photo} />
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.subtitle}>
          {student.grade} • Section {student.section} • Roll No. {student.rollNo}
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
          <Text style={styles.statLabel}>GPA</Text>
          <Text style={[styles.statValue, { color: colors.accentGreen }]}>
            {student.gpa.toFixed(1)}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(0, 113, 227, 0.1)' }]}>
          <Text style={styles.statLabel}>Attendance</Text>
          <Text style={[styles.statValue, { color: colors.accentBlue }]}>
            {student.attendance}%
          </Text>
        </View>
      </View>

      {/* Subjects Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="book" size={18} color={colors.textSecondary} />
          <Text style={styles.sectionTitle}>Subject Performance</Text>
        </View>
        <View style={styles.subjectsList}>
          {student.subjects.map((subject, index) => (
            <View
              key={subject.name}
              style={[
                styles.subjectItem,
                index < student.subjects.length - 1 && styles.subjectItemBorder,
              ]}
            >
              <View style={styles.subjectLeft}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${subject.score}%`,
                        backgroundColor:
                          subject.score >= 90
                            ? colors.accentGreen
                            : subject.score >= 80
                            ? colors.accentBlue
                            : colors.accentOrange,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.subjectRight}>
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
                <Text style={styles.subjectScore}>{subject.score}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pulse" size={18} color={colors.textSecondary} />
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        <View style={styles.activityList}>
          {student.recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <Text style={styles.activityIcon}>{activity.icon}</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Announcements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="megaphone" size={18} color={colors.textSecondary} />
          <Text style={styles.sectionTitle}>Announcements</Text>
        </View>
        <View style={styles.announcementsList}>
          {student.announcements.map((announcement, index) => (
            <View
              key={index}
              style={[
                styles.announcementItem,
                announcement.urgent && styles.announcementUrgent,
              ]}
            >
              <View
                style={[
                  styles.announcementDot,
                  { backgroundColor: announcement.urgent ? colors.accentRed : colors.accentBlue },
                ]}
              />
              <View style={styles.announcementContent}>
                <Text style={styles.announcementTitle}>{announcement.title}</Text>
                <Text style={styles.announcementDate}>{announcement.date}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          ))}
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity activeOpacity={0.9} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Full Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 28,
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subjectsList: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  subjectItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  subjectLeft: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 3,
    width: '80%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectRight: {
    alignItems: 'flex-end',
    marginLeft: spacing.lg,
  },
  subjectGrade: {
    fontSize: 20,
    fontWeight: '600',
  },
  subjectScore: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  activityList: {
    gap: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    ...shadows.card,
  },
  activityIcon: {
    fontSize: 24,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  announcementsList: {
    gap: spacing.md,
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    ...shadows.card,
  },
  announcementUrgent: {
    backgroundColor: 'rgba(255, 59, 48, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.15)',
  },
  announcementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  announcementDate: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  actionContainer: {
    marginTop: spacing.xl,
  },
  actionButton: {
    backgroundColor: colors.accentBlue,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});

export default StudentDetailSheet;
