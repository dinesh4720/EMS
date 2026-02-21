import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useStudent } from '../context/StudentContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Avatar, Button } from '../components';
import { formatCurrency, calculatePercentage } from '../utils/helpers';
import {
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  TrendingUp,
  ChevronRight,
} from 'lucide-react-native';

const HomeScreen = ({ navigation }) => {
  const { student, user, children, selectedChildIndex, switchChild } = useAuth();
  const { attendance, fees, exams, results, fetchAttendance, fetchFees, fetchExams, fetchResults } = useStudent();
  const { themeColors, spacing, typography, borderRadius } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadData();
  }, [student?.studentId]);

  const loadData = async () => {
    await Promise.all([
      fetchAttendance(),
      fetchFees(),
      fetchExams(),
      fetchResults(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleChildSwitch = async (index) => {
    await switchChild(index);
  };

  const QuickStatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: themeColors.backgroundSecondary }]}>
        <Icon size={20} color={color || themeColors.text} />
      </View>
      <Text style={[styles.statTitle, { color: themeColors.textSecondary }]}>{title}</Text>
      <Text style={[styles.statValue, { color: themeColors.text }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: themeColors.textTertiary }]}>
          {subtitle}
        </Text>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.surface }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.greeting, { color: themeColors.textSecondary }]}>
                Welcome back,
              </Text>
              <Text style={[styles.parentName, { color: themeColors.text }]}>
                {user?.name || 'Parent'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={styles.profileButton}
            >
              <Avatar name={student?.name} source={student?.photo} size="small" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Child Switcher - only show when multiple children */}
          {children.length > 1 && (
            <View style={styles.childSwitcher}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Your Children
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.childCards}
              >
                {children.map((child, index) => (
                  <TouchableOpacity
                    key={child.studentId || index}
                    onPress={() => handleChildSwitch(index)}
                    style={[
                      styles.childCard,
                      {
                        backgroundColor: index === selectedChildIndex
                          ? themeColors.text
                          : themeColors.backgroundSecondary,
                        borderColor: index === selectedChildIndex
                          ? themeColors.text
                          : themeColors.border,
                      },
                    ]}
                  >
                    <Avatar name={child.name} source={child.photo} size="small" />
                    <View style={styles.childCardInfo}>
                      <Text
                        style={[
                          styles.childCardName,
                          {
                            color: index === selectedChildIndex
                              ? themeColors.textInverse
                              : themeColors.text,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {child.name}
                      </Text>
                      <Text
                        style={[
                          styles.childCardClass,
                          {
                            color: index === selectedChildIndex
                              ? themeColors.textInverse
                              : themeColors.textSecondary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {child.class ? `${child.class.name} ${child.class.section}` : child.relationship}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Student Card */}
          <Card style={styles.studentCard}>
            <View style={styles.studentInfo}>
              <Avatar name={student?.name} source={student?.photo} size="large" />
              <View style={styles.studentDetails}>
                <Text style={[styles.studentName, { color: themeColors.text }]}>
                  {student?.name || 'Student Name'}
                </Text>
                <Text style={[styles.studentClass, { color: themeColors.textSecondary }]}>
                  {student?.class
                    ? typeof student.class === 'object'
                      ? `${student.class.name}${student.class.section ? ` - Section ${student.class.section}` : ''}`
                      : student.class
                    : ''}
                </Text>
                <Text style={[styles.rollNumber, { color: themeColors.textTertiary }]}>
                  Roll No: {student?.rollNo || '-'} | Adm No: {student?.admissionId || student?.admissionNumber || '-'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Quick Stats */}
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Quick Overview
          </Text>
          <View style={styles.statsGrid}>
            <QuickStatCard
              icon={Calendar}
              title="Attendance"
              value={`${attendance?.percentage || 0}%`}
              subtitle={`${attendance?.present || 0} days present`}
            />
            <QuickStatCard
              icon={CreditCard}
              title="Fees Due"
              value={formatCurrency(fees?.feeDetails?.balanceAmount || 0)}
              subtitle={`of ${formatCurrency(fees?.feeDetails?.totalFee || 0)}`}
            />
            <QuickStatCard
              icon={FileText}
              title="Exams"
              value={`${exams?.length || 0}`}
              subtitle="completed"
            />
            <QuickStatCard
              icon={TrendingUp}
              title="Last Result"
              value={results[0]?.percentage ? `${results[0].percentage}%` : '-'}
              subtitle={results[0]?.grade ? `Grade: ${results[0].grade}` : 'No results'}
            />
          </View>

          {/* Upcoming Exams */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Upcoming Exams
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Exams')}>
              <Text style={[styles.seeAll, { color: themeColors.textSecondary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          <Card style={styles.examCard}>
            {exams
              ?.filter((exam) => exam.status === 'upcoming')
              .slice(0, 1)
              .map((exam) => (
                <View key={exam.id}>
                  <Text style={[styles.examName, { color: themeColors.text }]}>
                    {exam.name}
                  </Text>
                  <Text style={[styles.examDate, { color: themeColors.textSecondary }]}>
                    {exam.startDate} - {exam.endDate}
                  </Text>
                  <View style={styles.examSubjects}>
                    {exam.subjects?.slice(0, 3).map((subject, idx) => (
                      <View
                        key={idx}
                        style={[styles.subjectChip, { backgroundColor: themeColors.backgroundSecondary }]}
                      >
                        <Text style={[styles.subjectText, { color: themeColors.textSecondary }]}>
                          {subject.name}
                        </Text>
                      </View>
                    ))}
                    {exam.subjects?.length > 3 && (
                      <Text style={[styles.moreSubjects, { color: themeColors.textTertiary }]}>
                        +{exam.subjects.length - 3} more
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            {exams?.filter((exam) => exam.status === 'upcoming').length === 0 && (
              <Text style={[styles.noExams, { color: themeColors.textTertiary }]}>
                No upcoming exams
              </Text>
            )}
          </Card>

          {/* Recent Results */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Recent Results
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Exams')}>
              <Text style={[styles.seeAll, { color: themeColors.textSecondary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          <Card style={styles.resultCard}>
            {results[0] && (
              <View>
                <View style={styles.resultHeader}>
                  <Text style={[styles.resultExamName, { color: themeColors.text }]}>
                    {results[0].examId?.name || results[0].examName || 'Exam'}
                  </Text>
                  <View style={[styles.gradeBadge, { backgroundColor: themeColors.text }]}>
                    <Text style={[styles.gradeText, { color: themeColors.textInverse }]}>
                      {results[0].grade || '-'}
                    </Text>
                  </View>
                </View>
                <View style={styles.resultStats}>
                  <View style={styles.resultStat}>
                    <Text style={[styles.resultStatValue, { color: themeColors.text }]}>
                      {results[0].obtainedMarks || '-'}
                    </Text>
                    <Text style={[styles.resultStatLabel, { color: themeColors.textTertiary }]}>
                      Obtained
                    </Text>
                  </View>
                  <View style={[styles.resultDivider, { backgroundColor: themeColors.border }]} />
                  <View style={styles.resultStat}>
                    <Text style={[styles.resultStatValue, { color: themeColors.text }]}>
                      {results[0].totalMarks || '-'}
                    </Text>
                    <Text style={[styles.resultStatLabel, { color: themeColors.textTertiary }]}>
                      Total
                    </Text>
                  </View>
                  <View style={[styles.resultDivider, { backgroundColor: themeColors.border }]} />
                  <View style={styles.resultStat}>
                    <Text style={[styles.resultStatValue, { color: themeColors.text }]}>
                      {results[0].rank ? `#${results[0].rank}` : '-'}
                    </Text>
                    <Text style={[styles.resultStatLabel, { color: themeColors.textTertiary }]}>
                      Rank
                    </Text>
                  </View>
                </View>
              </View>
            )}
            {!results[0] && (
              <Text style={[styles.noExams, { color: themeColors.textTertiary }]}>
                No results available
              </Text>
            )}
          </Card>

          {/* Quick Actions */}
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: themeColors.backgroundSecondary }]}
              onPress={() => navigation.navigate('Timetable')}
            >
              <Clock size={24} color={themeColors.text} />
              <Text style={[styles.actionText, { color: themeColors.text }]}>Timetable</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: themeColors.backgroundSecondary }]}
              onPress={() => navigation.navigate('Chat')}
            >
              <BookOpen size={24} color={themeColors.text} />
              <Text style={[styles.actionText, { color: themeColors.text }]}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: themeColors.backgroundSecondary }]}
              onPress={() => navigation.navigate('Fees')}
            >
              <CreditCard size={24} color={themeColors.text} />
              <Text style={[styles.actionText, { color: themeColors.text }]}>Pay Fees</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
  },
  parentName: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  childSwitcher: {
    marginBottom: 16,
  },
  childCards: {
    gap: 10,
    paddingVertical: 4,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    minWidth: 160,
  },
  childCardInfo: {
    flex: 1,
  },
  childCardName: {
    fontSize: 14,
    fontWeight: '600',
  },
  childCardClass: {
    fontSize: 12,
    marginTop: 2,
  },
  studentCard: {
    marginBottom: 20,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 14,
    marginBottom: 2,
  },
  rollNumber: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    padding: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
  },
  examCard: {
    marginBottom: 20,
  },
  examName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  examDate: {
    fontSize: 13,
    marginBottom: 12,
  },
  examSubjects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  subjectChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectText: {
    fontSize: 12,
  },
  moreSubjects: {
    fontSize: 12,
  },
  noExams: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  resultCard: {
    marginBottom: 20,
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  resultStat: {
    alignItems: 'center',
  },
  resultStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  resultStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  resultDivider: {
    width: 1,
    height: 40,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HomeScreen;
