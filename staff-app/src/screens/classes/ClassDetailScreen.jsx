import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ClipboardList,
  Users,
  FileText,
  History,
  CalendarDays,
  Plus,
  BookOpen,
  ChevronRight
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useClassContext } from '../../context/ClassContext';
import { ClassInfoCard, ScheduleItem } from '../../components/classes';
import { AttendanceSummaryCard } from '../../components/attendance';
import { examsApi } from '../../services/api';

const QUICK_ACTIONS = [
  { id: 'attendance', label: 'Take Attendance', Icon: ClipboardList, colorRole: 'primary' },
  { id: 'students', label: 'View Students', Icon: Users, colorRole: 'secondary' },
  { id: 'exams', label: 'Exams', Icon: FileText, colorRole: 'tertiary' },
  { id: 'history', label: 'History', Icon: History, colorRole: 'error' },
];

const ClassDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;
  const { classId, className, classData } = route.params || {};

  const {
    fetchStudents,
    students,
    fetchAttendance,
    attendance,
    getAttendanceSummary,
    loading,
    error,
  } = useClassContext();

  const [refreshing, setRefreshing] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [classExams, setClassExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      if (classId) {
        fetchStudents(classId);
        fetchAttendance(classId, today);
        fetchTodaySchedule();
        fetchClassExams();
      }
    }, [classId])
  );

  const fetchClassExams = async () => {
    setExamsLoading(true);
    try {
      const exams = await examsApi.getByClass(classId);
      setClassExams(exams || []);
    } catch (err) {
      console.error('Error fetching class exams:', err);
    } finally {
      setExamsLoading(false);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      const schedule = [
        { startTime: '09:00', endTime: '09:45', subject: 'Mathematics', room: 'Room 101', type: 'class' },
        { startTime: '10:00', endTime: '10:45', subject: 'Mathematics', room: 'Room 101', type: 'class' },
        { startTime: '11:00', endTime: '11:30', subject: 'Break', type: 'break' },
        { startTime: '11:45', endTime: '12:30', subject: 'Mathematics Lab', room: 'Lab 1', type: 'lab' },
      ];
      setTodaySchedule(schedule);
    } catch (err) {
      console.error('Error fetching schedule:', err);
    }
  };

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await Promise.all([
      fetchStudents(classId),
      fetchAttendance(classId, today),
      fetchTodaySchedule(),
      fetchClassExams(),
    ]);
    setRefreshing(false);
  };

  const handleAction = (actionId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (actionId) {
      case 'attendance':
        navigation.navigate('Attendance', { classId, className });
        break;
      case 'students':
        navigation.navigate('ClassStudents', { classId, className });
        break;
      case 'history':
        navigation.navigate('AttendanceHistory', { classId, className });
        break;
      case 'exams':
        navigation.navigate('ExamsTab');
        break;
    }
  };

  const handleCreateExam = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('ExamsTab', {
      screen: 'CreateExam',
      params: { classId, className }
    });
  };

  const getExamStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return colors.primary;
      case 'ongoing': return colors.tertiary;
      case 'completed': return colors.outline;
      case 'results_published': return colors.secondary;
      default: return colors.outline;
    }
  };

  const upcomingExams = classExams
    .filter(e => new Date(e.date) >= new Date() && e.status === 'scheduled')
    .slice(0, 3);

  const recentExams = classExams
    .filter(e => e.status === 'completed' || e.status === 'results_published')
    .slice(0, 2);

  const summary = getAttendanceSummary();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <ChevronRight size={24} color={colors.onSurface} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={[typography.titleLarge, { color: colors.onSurface, flex: 1, textAlign: 'center', marginRight: 28 }]}>
          {className || 'Class Detail'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Class Info Card */}
        <ClassInfoCard
          classData={{
            name: className || classData?.name,
            section: classData?.section,
            subject: classData?.subject || classData?.department,
            room: classData?.room,
            studentCount: students.length,
            schedule: todaySchedule,
          }}
          showStats={false}
        />

        {/* Quick Actions */}
        <View style={[styles.section, { marginBottom: spacing.lg }]}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.sm }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(action => {
              const Icon = action.Icon;
              const color = colors[action.colorRole] || colors.primary;
              return (
                <Pressable
                  key={action.id}
                  style={({ pressed }) => [
                    styles.actionCard,
                    {
                      backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainer,
                      borderRadius: shape.cornerLarge,
                      width: '48%' // Approximate
                    }
                  ]}
                  onPress={() => handleAction(action.id)}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: color + '15' }]}>
                    <Icon size={24} color={color} />
                  </View>
                  <Text style={[typography.labelMedium, { color: colors.onSurface }]}>{action.label}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Attendance Summary */}
        {Object.keys(attendance).length > 0 && (
          <View style={[styles.section, { marginBottom: spacing.lg }]}>
            <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.sm }]}>Today's Attendance</Text>
            <AttendanceSummaryCard summary={summary} compact />
          </View>
        )}

        {/* Today's Schedule */}
        <View style={[styles.section, { marginBottom: spacing.lg }]}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.sm }]}>Today's Schedule</Text>
          <View style={[styles.scheduleContainer, { backgroundColor: colors.surfaceContainerLow, borderRadius: shape.cornerLarge }]}>
            {todaySchedule.length > 0 ? (
              todaySchedule.map((item, index) => (
                <ScheduleItem
                  key={index}
                  schedule={item}
                  index={index}
                  isToday={true}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <CalendarDays size={48} color={colors.outline} style={{ marginBottom: spacing.sm }} />
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>No classes scheduled for today</Text>
              </View>
            )}
          </View>
        </View>

        {/* Exams Section */}
        <View style={[styles.section, { marginBottom: spacing.lg }]}>
          <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Exams</Text>
            <Pressable onPress={handleCreateExam} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Plus size={16} color={colors.primary} />
              <Text style={[typography.labelLarge, { color: colors.primary }]}>Create</Text>
            </Pressable>
          </View>

          {examsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              {/* Upcoming Exams */}
              {upcomingExams.length > 0 && (
                <View style={styles.examsSubsection}>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, marginBottom: spacing.xs, textTransform: 'uppercase' }]}>Upcoming</Text>
                  {upcomingExams.map(exam => (
                    <View key={exam.id} style={[styles.examCard, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerMedium }]}>
                      <View style={styles.examInfo}>
                        <Text style={[typography.titleSmall, { color: colors.onSurface }]}>{exam.name}</Text>
                        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{exam.subjectName}</Text>
                        <Text style={[typography.bodySmall, { color: colors.primary }]}>
                          {new Date(exam.date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric'
                          })}
                        </Text>
                      </View>
                      <View style={[styles.examStatusBadge, { backgroundColor: getExamStatusColor(exam.status) + '15' }]}>
                        <Text style={[typography.labelSmall, { color: getExamStatusColor(exam.status) }]}>
                          {exam.status?.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Recent Completed Exams */}
              {recentExams.length > 0 && (
                <View style={styles.examsSubsection}>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, marginBottom: spacing.xs, textTransform: 'uppercase' }]}>Completed</Text>
                  {recentExams.map(exam => (
                    <View key={exam.id} style={[styles.examCard, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerMedium }]}>
                      <View style={styles.examInfo}>
                        <Text style={[typography.titleSmall, { color: colors.onSurface }]}>{exam.name}</Text>
                        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{exam.subjectName}</Text>
                      </View>
                      <View style={[styles.examStatusBadge, { backgroundColor: getExamStatusColor(exam.status) + '15' }]}>
                        <Text style={[typography.labelSmall, { color: getExamStatusColor(exam.status) }]}>
                          {exam.isPublished ? 'Results' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Empty State */}
              {classExams.length === 0 && (
                <View style={[styles.examsEmptyState, { backgroundColor: colors.surfaceContainerLow, borderRadius: shape.cornerLarge }]}>
                  <FileText size={48} color={colors.outline} style={{ marginBottom: spacing.sm }} />
                  <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>No exams scheduled yet</Text>
                  <Pressable
                    style={[styles.createExamButton, { backgroundColor: colors.primary, borderRadius: shape.pill, marginTop: spacing.md }]}
                    onPress={handleCreateExam}
                  >
                    <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>Create First Exam</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>

        {/* Students Preview */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Students</Text>
            <TouchableOpacity onPress={() => handleAction('students')}>
              <Text style={[typography.labelLarge, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.studentsPreview}>
            {students.slice(0, 3).map(student => (
              <View key={student.id} style={[styles.studentChip, { backgroundColor: colors.secondaryContainer, borderRadius: shape.pill }]}>
                <Text style={[typography.labelMedium, { color: colors.onSecondaryContainer }]}>
                  {student.name?.split(' ')[0]}
                </Text>
              </View>
            ))}
            {students.length > 3 && (
              <View style={[styles.studentChip, { backgroundColor: colors.secondaryContainer, borderRadius: shape.pill }]}>
                <Text style={[typography.labelMedium, { color: colors.onSecondaryContainer }]}>+{students.length - 3}</Text>
              </View>
            )}
          </View>
          {students.length === 0 && (
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>No students enrolled</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    // marginBottom: 24, // Handled inline
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  scheduleContainer: {
    padding: 16,
  },
  studentsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  studentChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  examsSubsection: {
    marginBottom: 16,
  },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
  },
  examInfo: {
    flex: 1,
  },
  examStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  examsEmptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  createExamButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});

export default ClassDetailScreen;
