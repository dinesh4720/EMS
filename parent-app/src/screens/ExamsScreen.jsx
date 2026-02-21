import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStudent } from '../context/StudentContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Loading } from '../components';
import { formatDate } from '../utils/helpers';
import { FileText, Calendar, Clock, ChevronRight } from 'lucide-react-native';

const ExamsScreen = ({ navigation }) => {
  const { exams, results, loading, fetchExams, fetchResults } = useStudent();
  const { themeColors, spacing, typography, borderRadius } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('exams');

  useEffect(() => {
    fetchExams();
    fetchResults();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchExams(), fetchResults()]);
    setRefreshing(false);
  };

  const getExamTypeLabel = (type) => {
    const types = {
      unit_test: 'Unit Test',
      mid_term: 'Mid Term',
      final: 'Final',
      practical: 'Practical',
    };
    return types[type] || type;
  };

  const ExamCard = ({ exam }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ExamDetail', {
        examId: exam.id,
        examName: exam.name,
      })}
    >
      <Card style={styles.examCard}>
        <View style={styles.examHeader}>
          <View style={styles.examInfo}>
            <Text style={[styles.examName, { color: themeColors.text }]}>
              {exam.name}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: themeColors.backgroundSecondary }]}>
              <Text style={[styles.typeText, { color: themeColors.textSecondary }]}>
                {getExamTypeLabel(exam.type)}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  exam.status === 'upcoming'
                    ? themeColors.warning + '20'
                    : themeColors.text + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    exam.status === 'upcoming'
                      ? themeColors.warning
                      : themeColors.text,
                },
              ]}
            >
              {exam.status === 'upcoming' ? 'Upcoming' : 'Completed'}
            </Text>
          </View>
        </View>

        <View style={styles.examDates}>
          <View style={styles.dateItem}>
            <Calendar size={14} color={themeColors.textSecondary} />
            <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>
              {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
            </Text>
          </View>
          <View style={styles.dateItem}>
            <FileText size={14} color={themeColors.textSecondary} />
            <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>
              {exam.subjects?.length} Subjects
            </Text>
          </View>
        </View>

        <View style={styles.examSubjects}>
          {exam.subjects?.slice(0, 4).map((subject, idx) => (
            <View
              key={idx}
              style={[styles.subjectChip, { backgroundColor: themeColors.backgroundSecondary }]}
            >
              <Text style={[styles.subjectText, { color: themeColors.textSecondary }]}>
                {subject.name}
              </Text>
            </View>
          ))}
          {exam.subjects?.length > 4 && (
            <Text style={[styles.moreText, { color: themeColors.textTertiary }]}>
              +{exam.subjects.length - 4} more
            </Text>
          )}
        </View>

        <View style={styles.viewMore}>
          <Text style={[styles.viewMoreText, { color: themeColors.textSecondary }]}>
            View Details
          </Text>
          <ChevronRight size={16} color={themeColors.textTertiary} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  const ResultCard = ({ result }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ResultDetail', {
        examId: result.examId,
        examName: result.examName,
      })}
    >
      <Card style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={[styles.resultExamName, { color: themeColors.text }]}>
            {result.examName}
          </Text>
          <View style={[styles.gradeBadge, { backgroundColor: themeColors.text }]}>
            <Text style={[styles.gradeText, { color: themeColors.textInverse }]}>
              {result.grade}
            </Text>
          </View>
        </View>

        <View style={styles.resultStats}>
          <View style={styles.resultStat}>
            <Text style={[styles.resultStatValue, { color: themeColors.text }]}>
              {result.obtainedMarks}
            </Text>
            <Text style={[styles.resultStatLabel, { color: themeColors.textTertiary }]}>
              Obtained
            </Text>
          </View>
          <View style={styles.resultStat}>
            <Text style={[styles.resultStatValue, { color: themeColors.text }]}>
              {result.totalMarks}
            </Text>
            <Text style={[styles.resultStatLabel, { color: themeColors.textTertiary }]}>
              Total
            </Text>
          </View>
          <View style={styles.resultStat}>
            <Text style={[styles.resultStatValue, { color: themeColors.text }]}>
              {result.percentage}%
            </Text>
            <Text style={[styles.resultStatLabel, { color: themeColors.textTertiary }]}>
              Percentage
            </Text>
          </View>
          <View style={styles.resultStat}>
            <Text style={[styles.resultStatValue, { color: themeColors.text }]}>
              #{result.rank}
            </Text>
            <Text style={[styles.resultStatLabel, { color: themeColors.textTertiary }]}>
              Rank
            </Text>
          </View>
        </View>

        <View style={styles.viewMore}>
          <Text style={[styles.viewMoreText, { color: themeColors.textSecondary }]}>
            View Subject-wise Marks
          </Text>
          <ChevronRight size={16} color={themeColors.textTertiary} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading.exams && !exams.length) {
    return <Loading fullScreen message="Loading exams..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Tab Selector */}
          <View style={[styles.tabContainer, { backgroundColor: themeColors.backgroundSecondary }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === 'exams' && { backgroundColor: themeColors.surface },
              ]}
              onPress={() => setSelectedTab('exams')}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === 'exams' ? themeColors.text : themeColors.textSecondary },
                ]}
              >
                Exams
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === 'results' && { backgroundColor: themeColors.surface },
              ]}
              onPress={() => setSelectedTab('results')}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === 'results' ? themeColors.text : themeColors.textSecondary },
                ]}
              >
                Results
              </Text>
            </TouchableOpacity>
          </View>

          {selectedTab === 'exams' ? (
            <>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Upcoming Exams
              </Text>
              {exams
                ?.filter((exam) => exam.status === 'upcoming')
                .map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              {exams?.filter((exam) => exam.status === 'upcoming').length === 0 && (
                <Card style={styles.emptyCard}>
                  <Text style={[styles.emptyText, { color: themeColors.textTertiary }]}>
                    No upcoming exams
                  </Text>
                </Card>
              )}

              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Completed Exams
              </Text>
              {exams
                ?.filter((exam) => exam.status === 'completed')
                .map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
            </>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                All Results
              </Text>
              {results?.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}
              {!results?.length && (
                <Card style={styles.emptyCard}>
                  <Text style={[styles.emptyText, { color: themeColors.textTertiary }]}>
                    No results available
                  </Text>
                </Card>
              )}
            </>
          )}
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
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  examCard: {
    marginBottom: 12,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  examDates: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
  },
  examSubjects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  subjectChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectText: {
    fontSize: 12,
  },
  moreText: {
    fontSize: 12,
    alignSelf: 'center',
  },
  viewMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  viewMoreText: {
    fontSize: 13,
  },
  resultCard: {
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultExamName: {
    fontSize: 16,
    fontWeight: '600',
  },
  gradeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  resultStat: {
    alignItems: 'center',
  },
  resultStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  resultStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
  },
});

export default ExamsScreen;
