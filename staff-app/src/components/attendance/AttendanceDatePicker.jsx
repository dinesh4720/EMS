import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AttendanceDatePicker = ({ selectedDate, onDateSelect, minDate, maxDate }) => {
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;

  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );

  const selected = selectedDate ? new Date(selectedDate) : new Date();

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    if (!date) return false;
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const isDisabled = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Disable future dates
    if (date > today) return true;

    // Disable dates before minDate
    if (minDate && date < new Date(minDate)) return true;

    // Disable dates after maxDate
    if (maxDate && date > new Date(maxDate)) return true;

    return false;
  };

  const handleDatePress = (date) => {
    if (isDisabled(date)) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDateSelect?.(date.toISOString().split('T')[0]);
  };

  const goToPrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (nextMonth <= today) {
      setCurrentMonth(nextMonth);
    }
  };

  const goToToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect?.(today.toISOString().split('T')[0]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge }]}>
      {/* Header */}
      <View style={[styles.header, { marginBottom: spacing.md }]}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
          <ChevronLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>

        <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>

        <TouchableOpacity
          onPress={goToNextMonth}
          style={[styles.navButton, new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) > new Date() && styles.navButtonDisabled]}
          disabled={new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) > new Date()}
        >
          <ChevronRight size={24} color={new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) > new Date() ? colors.outline : colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Today Button */}
      {/* 
      <TouchableOpacity style={[styles.todayButton, { backgroundColor: colors.secondaryContainer, borderRadius: shape.pill }]} onPress={goToToday}>
        <Text style={[typography.labelLarge, { color: colors.onSecondaryContainer }]}>Today</Text>
      </TouchableOpacity>
      */}

      {/* Day names */}
      <View style={[styles.dayNamesRow, { marginBottom: spacing.sm }]}>
        {DAYS_SHORT.map(day => (
          <Text key={day} style={[styles.dayName, typography.labelMedium, { color: colors.onSurfaceVariant }]}>{day}</Text>
        ))}
      </View>

      {/* Days grid */}
      <View style={styles.daysGrid}>
        {days.map((date, index) => {
          const disabled = isDisabled(date);
          const today = date && isToday(date);
          const selectedDate = date && isSelected(date);

          return (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.dayCell,
                { width: `${100 / 7}%`, aspectRatio: 1, borderRadius: shape.pill },
                today && { borderWidth: 1, borderColor: colors.primary },
                selectedDate && { backgroundColor: colors.primary },
                disabled && { opacity: 0.3 },
              ]}
              onPress={() => date && handleDatePress(date)}
              disabled={disabled}
            >
              {date && (
                <Text
                  style={[
                    typography.bodyMedium,
                    { color: colors.onSurface },
                    today && { color: colors.primary, fontWeight: '700' },
                    selectedDate && { color: colors.onPrimary, fontWeight: '700' },
                    disabled && { color: colors.onSurfaceVariant },
                  ]}
                >
                  {date.getDate()}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Selected date display */}
      {selected && <View style={[styles.selectedDisplay, { borderTopColor: colors.outlineVariant, marginTop: spacing.md, paddingTop: spacing.md }]}>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>Selected: </Text>
        <Text style={[typography.titleSmall, { color: colors.onSurface }]}>
          {selected.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  todayButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
  },
  dayNamesRow: {
    flexDirection: 'row',
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
  },
});

export default AttendanceDatePicker;
