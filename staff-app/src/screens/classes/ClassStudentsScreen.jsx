import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Pressable
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Search, X, Users, CheckCircle, AlertCircle, ChevronDown, Filter, ChevronRight, User } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useClassContext } from '../../context/ClassContext';
import { StudentListItem } from '../../components/classes';
import { AttendanceStatusBadge } from '../../components/attendance';
import { useTranslation } from 'react-i18next';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'present', label: 'Present' },
  { id: 'absent', label: 'Absent' },
];

const ClassStudentsScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;
  const { classId, className } = route.params || {};

  const {
    students,
    attendance,
    loading,
    fetchStudents,
    fetchAttendance,
  } = useClassContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      if (classId) {
        fetchStudents(classId);
        fetchAttendance(classId, today);
      }
    }, [classId])
  );

  const getFilteredStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        student =>
          student.name?.toLowerCase().includes(query) ||
          student.rollNumber?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(student => {
        const status = attendance[student.id]?.status;
        return status === activeFilter;
      });
    }

    return filtered;
  };

  const handleFilterChange = (filter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const getParentPhone = (student) => {
    return student.parents?.find(p => p.isParent !== false)?.phone || student.parents?.[0]?.phone || null;
  };

  const handleStudentPress = (student) => {
    setSelectedStudent(student);
    const parentPhone = getParentPhone(student);
    // Show student details in an alert for now
    Alert.alert(
      student.name,
      `Roll: ${student.rollNumber || 'N/A'}\nClass: ${student.class || className}\n${parentPhone ? `Parent: ${parentPhone}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...(parentPhone ? [
          {
            text: 'Call Parent',
            onPress: () => Linking.openURL(`tel:${parentPhone}`),
          },
        ] : []),
      ]
    );
  };

  const renderStudent = ({ item, index }) => {
    const studentAttendance = attendance[item.id];
    const status = studentAttendance?.status || null;

    return (
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.outlineVariant }}>
        <StudentListItem
          student={item}
          onPress={handleStudentPress}
          showAttendance={true}
          attendanceStatus={status}
          showContact={true}
        />
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <ChevronRight size={24} color={colors.onSurface} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', marginRight: 28 }}>
          <Text style={[typography.titleLarge, { color: colors.onSurface, textAlign: 'center' }]}>
            Students
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{className}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.pill }]}>
        <Search size={20} color={colors.onSurfaceVariant} style={{ marginRight: spacing.sm }} />
        <TextInput
          style={[styles.searchInput, typography.bodyLarge, { color: colors.onSurface }]}
          placeholder={t('screens.searchStudents')}
          placeholderTextColor={colors.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <X size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {FILTER_OPTIONS.map(filter => {
          const count = filter.id === 'all'
            ? students.length
            : students.filter(s => attendance[s.id]?.status === filter.id).length;

          return (
            <Pressable
              key={filter.id}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor: activeFilter === filter.id ? colors.secondaryContainer : colors.surface,
                  borderColor: activeFilter === filter.id ? colors.secondaryContainer : colors.outline,
                  borderWidth: 1,
                  borderRadius: shape.pill
                },
              ]}
              onPress={() => handleFilterChange(filter.id)}
            >
              <Text
                style={[
                  typography.labelMedium,
                  { color: activeFilter === filter.id ? colors.onSecondaryContainer : colors.onSurfaceVariant },
                ]}
              >
                {filter.label} ({count})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge }]}>
        <View style={styles.statItem}>
          <Text style={[typography.headlineSmall, { color: colors.onSurface }]}>{students.length}</Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{t('screens.total')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
        <View style={styles.statItem}>
          <Text style={[typography.headlineSmall, { color: colors.primary }]}>
            {students.filter(s => attendance[s.id]?.status === 'present').length}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{t('screens.present1')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
        <View style={styles.statItem}>
          <Text style={[typography.headlineSmall, { color: colors.error }]}>
            {students.filter(s => attendance[s.id]?.status === 'absent').length}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{t('screens.absent1')}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Users size={64} color={colors.outline} style={{ marginBottom: spacing.md }} />
      <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: spacing.sm }]}>
        {searchQuery ? 'No Results' : 'No Students'}
      </Text>
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
        {searchQuery
          ? 'Try adjusting your search or filter.'
          : 'No students are enrolled in this class.'}
      </Text>
    </View>
  );

  const filteredStudents = getFilteredStudents();

  if (loading && students.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>{t('screens.loadingStudents')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderStudent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    height: 40,
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    alignSelf: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
});

export default ClassStudentsScreen;
