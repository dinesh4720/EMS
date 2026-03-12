import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStudent } from '../context/StudentContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components';
import { Trophy, TrendingUp } from 'lucide-react-native';
import { getGradeColor } from '../utils/helpers';

const ResultDetailScreen = ({ route }) => {
  const { examId, examName } = route.params;
  const { results } = useStudent();
  const { themeColors, spacing, typography } = useTheme();

  const result = results?.find((r) => (r.examId?._id || r.examId) === examId);

  if (!result) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: themeColors.textTertiary }]}>
            Result not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Summary Card */}
          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={[styles.examName, { color: themeColors.text }]}>
                {result.examId?.name || examName || 'Exam'}
              </Text>
              <View style={[styles.gradeBadge, { backgroundColor: themeColors.text }]}>
                <Text style={[styles.gradeText, { color: themeColors.textInverse }]}>
                  {result.grade || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: themeColors.text }]}>
                  {result.marks?.length > 0 ? result.totalMarksObtained : result.marksObtained}
                </Text>
                <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                  Obtained Marks
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: themeColors.text }]}>
                  {result.marks?.length > 0 ? result.totalMaxMarks : result.maxMarks}
                </Text>
                <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                  Total Marks
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: themeColors.text }]}>
                  {result.percentage || 0}%
                </Text>
                <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                  Percentage
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
              <View style={styles.statItem}>
                <View style={styles.rankContainer}>
                  <Trophy size={16} color={themeColors.warning} />
                  <Text style={[styles.statValue, { color: themeColors.text }]}>
                    {result.rank ? `#${result.rank}` : 'N/A'}
                  </Text>
                </View>
                <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                  Class Rank
                </Text>
              </View>
            </View>
          </Card>

          {/* Subject-wise Marks */}
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Subject-wise Performance
          </Text>

          {result.marks?.map((subject, index) => (
            <Card key={index} style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <Text style={[styles.subjectName, { color: themeColors.text }]}>
                  {subject.subjectName}
                </Text>
                <View style={[styles.subjectGrade, { backgroundColor: getGradeColor(subject.grade) + '20' }]}>
                  <Text style={[styles.subjectGradeText, { color: getGradeColor(subject.grade) }]}>
                    {subject.grade || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.marksContainer}>
                <View style={styles.marksBar}>
                  <View
                    style={[
                      styles.marksFill,
                      {
                        width: `${subject.maxMarks > 0 ? (subject.marksObtained / subject.maxMarks) * 100 : 0}%`,
                        backgroundColor: themeColors.text,
                      },
                    ]}
                  />
                </View>
                <View style={styles.marksText}>
                  <Text style={[styles.obtainedMarks, { color: themeColors.text }]}>
                    {subject.marksObtained}
                  </Text>
                  <Text style={[styles.maxMarks, { color: themeColors.textTertiary }]}>
                    / {subject.maxMarks}
                  </Text>
                </View>
              </View>

              <Text style={[styles.percentageText, { color: themeColors.textSecondary }]}>
                {subject.maxMarks > 0 ? Math.round((subject.marksObtained / subject.maxMarks) * 100) : 0}%
              </Text>
            </Card>
          ))}

          {/* Performance Summary */}
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Performance Summary
          </Text>
          <Card style={styles.summaryCard}>
            <View style={styles.perfItem}>
              <TrendingUp size={18} color={themeColors.text} />
              <Text style={[styles.perfText, { color: themeColors.text }]}>
                {(result.percentage || 0) >= 90
                  ? 'Outstanding Performance!'
                  : (result.percentage || 0) >= 75
                  ? 'Excellent Performance!'
                  : (result.percentage || 0) >= 60
                  ? 'Good Performance!'
                  : 'Keep Improving!'}
              </Text>
            </View>
            <Text style={[styles.perfDetail, { color: themeColors.textSecondary }]}>
              {(result.percentage || 0) >= 60
                ? 'Great job! Keep up the good work.'
                : 'Focus on weaker subjects and practice more.'}
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
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  examName: {
    fontSize: 18,
    fontWeight: '600',
  },
  gradeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 50,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  subjectCard: {
    marginBottom: 10,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
  },
  subjectGrade: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectGradeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  marksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  marksBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  marksFill: {
    height: '100%',
    borderRadius: 4,
  },
  marksText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 60,
  },
  obtainedMarks: {
    fontSize: 16,
    fontWeight: '600',
  },
  maxMarks: {
    fontSize: 14,
  },
  percentageText: {
    fontSize: 13,
  },
  perfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  perfText: {
    fontSize: 16,
    fontWeight: '600',
  },
  perfDetail: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ResultDetailScreen;
