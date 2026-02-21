import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStudent } from '../context/StudentContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Loading } from '../components';
import { Clock, BookOpen } from 'lucide-react-native';

const TimetableScreen = () => {
  const { timetable, loading, fetchTimetable } = useStudent();
  const { themeColors, spacing, typography, borderRadius } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTimetable();
    setRefreshing(false);
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading.timetable && !timetable.length) {
    return <Loading fullScreen message="Loading timetable..." />;
  }

  const currentDayTimetable = timetable[selectedDay];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Day Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.daySelector}
          >
            {timetable.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor:
                      selectedDay === index
                        ? themeColors.text
                        : themeColors.backgroundSecondary,
                  },
                ]}
                onPress={() => setSelectedDay(index)}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color:
                        selectedDay === index
                          ? themeColors.textInverse
                          : themeColors.textSecondary,
                    },
                  ]}
                >
                  {days[index]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Periods */}
          <Text style={[styles.dayLabel, { color: themeColors.text }]}>
            {currentDayTimetable?.day || 'Monday'}
          </Text>

          {currentDayTimetable?.periods?.map((period, index) => (
            <Card
              key={index}
              style={[
                styles.periodCard,
                !period.subject && { opacity: 0.6 },
              ]}
            >
              <View style={styles.periodTime}>
                <Clock size={14} color={themeColors.textTertiary} />
                <Text style={[styles.periodTimeText, { color: themeColors.textSecondary }]}>
                  {period.time}
                </Text>
              </View>

              <View style={styles.periodContent}>
                <Text
                  style={[
                    styles.periodSubject,
                    { color: themeColors.text },
                    !period.subject && styles.breakText,
                  ]}
                >
                  {period.subject || 'Break'}
                </Text>
                {period.teacher && (
                  <Text style={[styles.periodTeacher, { color: themeColors.textTertiary }]}>
                    {period.teacher}
                  </Text>
                )}
              </View>

              {period.subject && (
                <View style={[styles.periodIndicator, { backgroundColor: themeColors.text }]} />
              )}
            </Card>
          ))}

          {/* Legend */}
          <Text style={[styles.legendTitle, { color: themeColors.text }]}>
            Legend
          </Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: themeColors.text }]} />
              <Text style={[styles.legendText, { color: themeColors.textSecondary }]}>
                Regular Class
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: themeColors.backgroundSecondary }]} />
              <Text style={[styles.legendText, { color: themeColors.textSecondary }]}>
                Break / Activity
              </Text>
            </View>
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
  content: {
    padding: 16,
  },
  daySelector: {
    marginBottom: 20,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  periodTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 90,
  },
  periodTimeText: {
    fontSize: 12,
  },
  periodContent: {
    flex: 1,
    paddingLeft: 12,
  },
  periodSubject: {
    fontSize: 15,
    fontWeight: '600',
  },
  breakText: {
    fontStyle: 'italic',
  },
  periodTeacher: {
    fontSize: 12,
    marginTop: 2,
  },
  periodIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 13,
  },
});

export default TimetableScreen;
