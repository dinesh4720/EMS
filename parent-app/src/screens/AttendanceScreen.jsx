import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStudent } from '../context/StudentContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Loading, EmptyState } from '../components';
import { calculatePercentage } from '../utils/helpers';
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react-native';

const AttendanceScreen = () => {
  const { attendance, loading, errors, fetchAttendance } = useStudent();
  const { themeColors } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendance();
    setRefreshing(false);
  };

  // Parse stats from backend response
  // Backend returns: { stats: { total, present, absent, late, percentage }, attendance: [...records] }
  const stats = useMemo(() => {
    if (!attendance) return null;
    // If attendance has stats directly (from StudentContext mapping)
    if (attendance.total !== undefined) {
      return {
        totalDays: attendance.total || 0,
        present: attendance.present || 0,
        absent: attendance.absent || 0,
        late: attendance.late || 0,
        leave: attendance.leave || 0,
        percentage: attendance.percentage || 0,
      };
    }
    // If it has stats nested
    if (attendance.stats) {
      return {
        totalDays: attendance.stats.total || 0,
        present: attendance.stats.present || 0,
        absent: attendance.stats.absent || 0,
        late: attendance.stats.late || 0,
        leave: attendance.stats.leave || 0,
        percentage: attendance.stats.percentage || 0,
      };
    }
    return null;
  }, [attendance]);

  // Group attendance records by month for monthly breakdown
  const monthlyBreakdown = useMemo(() => {
    const records = attendance?.records || attendance?.attendance || [];
    if (!records.length) return [];

    const monthMap = {};
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    records.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthName,
          sortKey: `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
        };
      }

      switch (record.status) {
        case 'present':
          monthMap[monthKey].present++;
          break;
        case 'absent':
          monthMap[monthKey].absent++;
          break;
        case 'late':
          monthMap[monthKey].late++;
          break;
        case 'leave':
          monthMap[monthKey].leave++;
          break;
      }
    });

    return Object.values(monthMap).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [attendance]);

  if (loading.attendance && !attendance) {
    return <Loading fullScreen message="Loading attendance..." />;
  }

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: themeColors.backgroundSecondary }]}>
        <Icon size={20} color={color || themeColors.text} />
      </View>
      <Text style={[styles.statValue, { color: themeColors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>{label}</Text>
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
        <View style={styles.content}>
          {errors?.attendance ? (
            <Card style={styles.errorCard}>
              <Text style={[styles.errorText, { color: themeColors.error || '#ef4444' }]}>
                {errors.attendance}
              </Text>
            </Card>
          ) : null}

          {stats ? (
            <>
              {/* Overall Summary */}
              <Card style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
                    Attendance Overview
                  </Text>
                  <View style={[styles.percentageBadge, { backgroundColor: themeColors.text }]}>
                    <Text style={[styles.percentageText, { color: themeColors.textInverse }]}>
                      {stats.percentage}%
                    </Text>
                  </View>
                </View>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${stats.percentage}%`,
                        backgroundColor: themeColors.text,
                      },
                    ]}
                  />
                </View>

                <View style={styles.statsRow}>
                  <StatCard
                    icon={CheckCircle}
                    label="Present"
                    value={stats.present}
                    color={themeColors.success || '#22c55e'}
                  />
                  <StatCard
                    icon={XCircle}
                    label="Absent"
                    value={stats.absent}
                    color={themeColors.error || '#ef4444'}
                  />
                  <StatCard
                    icon={AlertTriangle}
                    label="Late"
                    value={stats.late}
                    color={themeColors.warning || '#f59e0b'}
                  />
                  <StatCard
                    icon={Calendar}
                    label="Total"
                    value={stats.totalDays}
                  />
                </View>
              </Card>

              {/* Monthly Breakdown */}
              {monthlyBreakdown.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                    Monthly Breakdown
                  </Text>

                  {monthlyBreakdown.map((month, index) => {
                    const total = month.present + month.absent + month.late + month.leave;
                    const percentage = total > 0 ? Math.round((month.present / total) * 100) : 0;

                    return (
                      <Card key={index} style={styles.monthCard}>
                        <View style={styles.monthHeader}>
                          <Text style={[styles.monthName, { color: themeColors.text }]}>
                            {month.month}
                          </Text>
                          <Text style={[styles.monthPercentage, { color: themeColors.textSecondary }]}>
                            {percentage}% Present
                          </Text>
                        </View>

                        <View style={styles.monthProgress}>
                          <View
                            style={[
                              styles.monthProgressFill,
                              {
                                width: `${percentage}%`,
                                backgroundColor: themeColors.text,
                              },
                            ]}
                          />
                        </View>

                        <View style={styles.monthStats}>
                          <View style={styles.monthStat}>
                            <View style={[styles.monthStatDot, { backgroundColor: themeColors.success || '#22c55e' }]} />
                            <Text style={[styles.monthStatText, { color: themeColors.textSecondary }]}>
                              Present: {month.present}
                            </Text>
                          </View>
                          <View style={styles.monthStat}>
                            <View style={[styles.monthStatDot, { backgroundColor: themeColors.error || '#ef4444' }]} />
                            <Text style={[styles.monthStatText, { color: themeColors.textSecondary }]}>
                              Absent: {month.absent}
                            </Text>
                          </View>
                          <View style={styles.monthStat}>
                            <View style={[styles.monthStatDot, { backgroundColor: themeColors.warning || '#f59e0b' }]} />
                            <Text style={[styles.monthStatText, { color: themeColors.textSecondary }]}>
                              Late: {month.late}
                            </Text>
                          </View>
                        </View>
                      </Card>
                    );
                  })}
                </>
              )}
            </>
          ) : !errors?.attendance ? (
            <EmptyState
              title="No Attendance Data"
              message="Attendance records will appear here once they are available."
              icon={<Calendar size={48} color={themeColors.textTertiary} />}
            />
          ) : null}
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
  errorCard: {
    marginBottom: 12,
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  monthCard: {
    marginBottom: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthName: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthPercentage: {
    fontSize: 14,
  },
  monthProgress: {
    height: 6,
    backgroundColor: '#e5e5e5',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  monthProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  monthStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  monthStatText: {
    fontSize: 12,
  },
});

export default AttendanceScreen;
