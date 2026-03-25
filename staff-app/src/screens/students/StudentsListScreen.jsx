import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Search, User, GraduationCap, Phone, Mail, ChevronRight, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { classesApi } from '../../services/api';
import { useTranslation } from 'react-i18next';

const StudentsListScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, typography, spacing, shape, isDark } = useTheme();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStudents();
  }, [user?.id]);

  const loadStudents = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, get the classes assigned to this staff member
      const classes = await classesApi.getStaffClasses(user.id);
      setAssignedClasses(classes || []);

      // If no classes assigned, show empty state
      if (!classes || classes.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Fetch students from all assigned classes
      const studentPromises = classes.map(async (cls) => {
        try {
          const classStudents = await classesApi.getClassStudents(cls.id || cls._id);
          // Add class info to each student
          return (classStudents || []).map(student => ({
            ...student,
            className: cls.name || cls.className,
            classId: cls.id || cls._id,
          }));
        } catch (err) {
          console.error(`Error fetching students for class ${cls.id || cls._id}:`, err);
          return [];
        }
      });

      const studentArrays = await Promise.all(studentPromises);
      const allStudents = studentArrays.flat();

      // Sort by name
      allStudents.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      setStudents(allStudents);
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Failed to load students. Please try again.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadStudents();
    setRefreshing(false);
  }, []);

  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    return (
      (student.name || '').toLowerCase().includes(query) ||
      (student.className || student.class || '').toLowerCase().includes(query) ||
      (student.rollNo || student.rollNumber || '').includes(query)
    );
  });

  const handleStudentPress = useCallback((student) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('StudentDetail', { student });
  }, [navigation]);

  const getInitials = (name) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['#4285F4', '#EA4335', '#34A853', '#FBBC04'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderStudent = ({ item, index }) => {
    const avatarColor = getAvatarColor(item.name);

    return (
      <Pressable
        onPress={() => handleStudentPress(item)}
        style={({ pressed }) => [
          styles.studentItem,
          {
            backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainer,
            borderRadius: shape.cornerLarge,
            marginBottom: spacing.sm,
          },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: avatarColor, borderRadius: shape.pill }]}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={[typography.titleSmall, { color: colors.onSurface }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
            {item.className || item.class || 'No Class'} • Roll No. {item.rollNo || item.rollNumber || 'N/A'}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.onSurfaceVariant} />
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {assignedClasses.length === 0 ? (
        <>
          <AlertCircle size={56} color={colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
          <Text style={[typography.titleMedium, { color: colors.onSurfaceVariant, marginTop: spacing.md }]}>
            No Classes Assigned
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, opacity: 0.7, marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: spacing.lg }]}>
            You haven't been assigned to any classes yet. Students from your assigned classes will appear here.
          </Text>
        </>
      ) : (
        <>
          <GraduationCap size={48} color={colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
          <Text style={[typography.titleMedium, { color: colors.onSurfaceVariant, marginTop: spacing.md }]}>
            No students found
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, opacity: 0.7, marginTop: spacing.xs }]}>
            Try adjusting your search
          </Text>
        </>
      )}
    </View>
  );

  // Error state
  if (error && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>{t('screens.students1')}</Text>
        </View>
        <View style={styles.emptyState}>
          <AlertCircle size={56} color={colors.error} style={{ opacity: 0.6 }} />
          <Text style={[typography.titleMedium, { color: colors.onSurfaceVariant, marginTop: spacing.md }]}>
            Something went wrong
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, opacity: 0.7, marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: spacing.lg }]}>
            {error}
          </Text>
          <Pressable
            onPress={loadStudents}
            style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: shape.cornerMedium }]}
          >
            <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>{t('screens.tryAgain1')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>{t('screens.students1')}</Text>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
          {filteredStudents.length} students
        </Text>
      </View>

      {/* Search Bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surfaceContainer,
            borderRadius: shape.cornerXLarge,
            marginHorizontal: spacing.md,
          },
        ]}
      >
        <Search size={20} color={colors.onSurfaceVariant} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('screens.searchByNameClassOrRollNo')}
          placeholderTextColor={colors.onSurfaceVariant}
          style={[styles.searchInput, typography.bodyLarge, { color: colors.onSurface }]}
        />
      </View>

      {/* Student List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          renderItem={renderStudent}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4285F4"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});

export default StudentsListScreen;
