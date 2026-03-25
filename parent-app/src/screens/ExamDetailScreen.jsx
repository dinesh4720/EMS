import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStudent } from '../context/StudentContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Loading } from '../components';
import { formatDate, formatTime } from '../utils/helpers';
import { Calendar, Clock, FileText } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const ExamDetailScreen = ({ route }) => {
  const { t } = useTranslation();
  const { examId } = route.params;
  const { exams, loading } = useStudent();
  const { themeColors, spacing, typography } = useTheme();

  const exam = exams?.find((e) => e.id === examId);

  if (loading.exams && !exam) {
    return <Loading fullScreen message="Loading exam details..." />;
  }

  if (!exam) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: themeColors.textTertiary, fontSize: 16 }}>{t('screens.examNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Exam Header */}
          <Card style={styles.headerCard}>
            <Text style={[styles.examName, { color: themeColors.text }]}>
              {exam.name}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: themeColors.text + '20' }]}>
              <Text style={[styles.statusText, { color: themeColors.text }]}>
                {exam.status === 'upcoming' ? 'Upcoming' : 'Completed'}
              </Text>
            </View>

            <View style={styles.dateInfo}>
              <View style={styles.dateRow}>
                <Calendar size={16} color={themeColors.textSecondary} />
                <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>
                  {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Subjects */}
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Subject Schedule
          </Text>

          {exam.subjects?.map((subject, index) => (
            <Card key={index} style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <View style={[styles.subjectIcon, { backgroundColor: themeColors.backgroundSecondary }]}>
                  <FileText size={18} color={themeColors.text} />
                </View>
                <Text style={[styles.subjectName, { color: themeColors.text }]}>
                  {subject.name}
                </Text>
              </View>

              <View style={styles.subjectDetails}>
                {subject.time ? (
                  <View style={styles.subjectDetail}>
                    <Clock size={14} color={themeColors.textTertiary} />
                    <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>
                      {subject.time}
                    </Text>
                  </View>
                ) : null}
                {subject.duration ? (
                  <View style={styles.subjectDetail}>
                    <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>
                      Duration: {subject.duration}
                    </Text>
                  </View>
                ) : null}
                {subject.date ? (
                  <View style={styles.subjectDetail}>
                    <Calendar size={14} color={themeColors.textTertiary} />
                    <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>
                      {formatDate(subject.date)}
                    </Text>
                  </View>
                ) : null}
                {subject.maxMarks != null ? (
                  <View style={styles.subjectDetail}>
                    <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>
                      Max Marks: {subject.maxMarks}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Card>
          ))}

          {/* Instructions */}
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Exam Instructions
          </Text>
          <Card style={styles.instructionsCard}>
            <Text style={[styles.instructionText, { color: themeColors.textSecondary }]}>
              • Reach the exam center 30 minutes before the exam start time.
            </Text>
            <Text style={[styles.instructionText, { color: themeColors.textSecondary }]}>
              • Carry your student ID card and admit card.
            </Text>
            <Text style={[styles.instructionText, { color: themeColors.textSecondary }]}>
              • No electronic devices are allowed inside the examination hall.
            </Text>
            <Text style={[styles.instructionText, { color: themeColors.textSecondary }]}>
              • Write your details carefully on the answer sheet.
            </Text>
            <Text style={[styles.instructionText, { color: themeColors.textSecondary }]}>
              • Read all questions carefully before answering.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 20,
  },
  examName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dateInfo: {
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  subjectCard: {
    marginBottom: 10,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
  },
  subjectDetails: {
    gap: 6,
  },
  subjectDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
  },
  instructionsCard: {
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default ExamDetailScreen;
