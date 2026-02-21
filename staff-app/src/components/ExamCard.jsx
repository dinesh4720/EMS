import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const ExamCard = ({ exams = [], loading }) => {
  const navigation = useNavigation();
  const { colors, typography, spacing, shape } = useTheme();

  const upcomingExams = exams
    .filter(e => e.status === 'scheduled' || e.status === 'ongoing')
    .slice(0, 3);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge }]}>
        <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Upcoming Exams</Text>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: spacing.md }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (upcomingExams.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.surfaceContainer, 
      borderRadius: shape.cornerLarge,
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      padding: spacing.md,
    }]}>
      <View style={styles.header}>
        <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Upcoming Exams</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ExamsTab')}>
          <Text style={[typography.labelLarge, { color: colors.primary }]}>View All</Text>
        </TouchableOpacity>
      </View>

      {upcomingExams.map((exam, index) => (
        <Pressable
          key={exam.id}
          style={({ pressed }) => [
            styles.examItem,
            { 
              backgroundColor: pressed ? colors.surfaceContainerHigh : 'transparent',
              borderRadius: shape.cornerMedium,
              padding: spacing.sm,
              marginBottom: index < upcomingExams.length - 1 ? 4 : 0
            }
          ]}
          onPress={() => navigation.navigate('ExamsTab', {
            screen: 'ExamDetail',
            params: { examId: exam.id, examName: exam.name }
          })}
        >
          <View style={styles.examInfo}>
            <Text style={[typography.titleSmall, { color: colors.onSurface }]}>{exam.name}</Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
              {exam.classId || exam.className} • {exam.subjectName}
            </Text>
          </View>
          <View style={[styles.examDate, { backgroundColor: colors.secondaryContainer, borderRadius: shape.pill }]}>
            <Text style={[typography.labelSmall, { color: colors.onSecondaryContainer }]}>{exam.startDate}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  examItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examInfo: {
    flex: 1,
  },
  examDate: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});

export default ExamCard;
