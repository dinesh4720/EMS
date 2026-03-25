import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Edit, Calendar, BookOpen, Clock, Users, PieChart, Activity, AlertTriangle } from 'lucide-react-native';

import { useExamContext } from '../../context/ExamContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const ExamDetailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { examId } = route.params;
  const { colors, typography, spacing, shape } = useTheme();

  const {
    selectedExam,
    results,
    loading,
    fetchExamDetails,
    fetchResults,
  } = useExamContext();

  const [stats, setStats] = useState({
    total: 0,
    pass: 0,
    fail: 0,
    average: 0
  });

  useEffect(() => {
    loadExamDetails();
  }, [examId]);

  useEffect(() => {
    if (results.length > 0 && selectedExam) {
      calculateStats();
    }
  }, [results, selectedExam]);

  const loadExamDetails = async () => {
    const exam = await fetchExamDetails(examId);
    if (exam) {
      await fetchResults(exam.classId, examId);
    }
  };

  const calculateStats = () => {
    const total = results.length;
    const pass = results.filter(r => r.status === 'pass').length;
    const fail = results.filter(r => r.status === 'fail').length;
    const sum = results.reduce((acc, r) => acc + (r.percentage || 0), 0);
    const average = total > 0 ? (sum / total).toFixed(1) : 0;

    setStats({ total, pass, fail, average });
  };

  const handleEnterResults = () => {
    navigation.navigate('ResultsEntry', {
      examId,
      examName: selectedExam?.name
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return colors.primary;
      case 'ongoing': return colors.tertiary;
      case 'completed': return colors.secondary;
      case 'results_published': return colors.green || '#4CAF50';
      default: return colors.outline;
    }
  };

  if (loading && !selectedExam) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, marginTop: spacing.md }]}>
          Loading exam details...
        </Text>
      </View>
    );
  }

  if (!selectedExam) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <AlertTriangle size={48} color={colors.error} />
        <Text style={[typography.headlineSmall, { color: colors.onSurface, marginTop: spacing.md }]}>
          Exam not found
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: colors.primary, borderRadius: shape.pill, marginTop: spacing.lg, opacity: pressed ? 0.8 : 1 }
          ]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color={colors.onPrimary} style={{ marginRight: spacing.sm }} />
          <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>{t('screens.goBack')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.outlineVariant,
      }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: pressed ? colors.surfaceContainerHigh : 'transparent', borderRadius: shape.pill }
          ]}
        >
          <ArrowLeft size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={[typography.titleLarge, { color: colors.onSurface, marginLeft: spacing.md, flex: 1 }]}>
          Exam Details
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Exam Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge }]}>
          <View style={[styles.examHeader, { marginBottom: spacing.md }]}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.headlineSmall, { color: colors.onSurface }]}>
                {selectedExam.name}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(selectedExam.status) + '20', borderRadius: shape.pill }
                ]}>
                  <Text style={[typography.labelSmall, { color: getStatusColor(selectedExam.status), textTransform: 'uppercase' }]}>
                    {selectedExam.status?.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.outlineVariant, marginVertical: spacing.sm }]} />

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Users size={16} color={colors.onSurfaceVariant} style={{ marginRight: 4 }} />
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>{t('screens.cLASS')}</Text>
              </View>
              <Text style={[typography.bodyLarge, { color: colors.onSurface }]}>
                {selectedExam.classId || selectedExam.className}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <BookOpen size={16} color={colors.onSurfaceVariant} style={{ marginRight: 4 }} />
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>{t('screens.sUBJECT')}</Text>
              </View>
              <Text style={[typography.bodyLarge, { color: colors.onSurface }]}>
                {selectedExam.subjectName}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Calendar size={16} color={colors.onSurfaceVariant} style={{ marginRight: 4 }} />
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>{t('screens.dATE')}</Text>
              </View>
              <Text style={[typography.bodyLarge, { color: colors.onSurface }]}>
                {selectedExam.startDate}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Clock size={16} color={colors.onSurfaceVariant} style={{ marginRight: 4 }} />
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>{t('screens.tYPE')}</Text>
              </View>
              <Text style={[typography.bodyLarge, { color: colors.onSurface, textTransform: 'capitalize' }]}>
                {selectedExam.type?.replace('_', ' ') || selectedExam.examType}
              </Text>
            </View>
          </View>
        </View>

        {/* Marks Configuration Card */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge, marginTop: spacing.md }]}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.md }]}>
            Configuration
          </Text>
          <View style={styles.marksRow}>
            <View style={styles.marksItem}>
              <Text style={[typography.headlineMedium, { color: colors.primary }]}>{selectedExam.maxMarks || 100}</Text>
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{t('screens.maxMarks')}</Text>
            </View>
            <View style={[styles.verticalDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.marksItem}>
              <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>{selectedExam.passingMarks || 35}</Text>
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{t('screens.passing')}</Text>
            </View>
            <View style={[styles.verticalDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.marksItem}>
              <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>{selectedExam.weightage || 100}%</Text>
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{t('screens.weightage')}</Text>
            </View>
          </View>
        </View>

        {/* Results Summary (if results exist) */}
        {results.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderRadius: shape.cornerLarge, marginTop: spacing.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <PieChart size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
              <Text style={[typography.titleMedium, { color: colors.onSurface }]}>{t('screens.resultsSummary')}</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={[styles.statItem, { backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.cornerMedium }]}>
                <Text style={[typography.headlineSmall, { color: colors.onSurface }]}>{stats.total}</Text>
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>{t('screens.total')}</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.cornerMedium }]}>
                <Text style={[typography.headlineSmall, { color: colors.green || '#4CAF50' }]}>{stats.pass}</Text>
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>{t('screens.pass')}</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.cornerMedium }]}>
                <Text style={[typography.headlineSmall, { color: colors.error }]}>{stats.fail}</Text>
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>{t('screens.fail')}</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.cornerMedium }]}>
                <Text style={[typography.headlineSmall, { color: colors.primary }]}>{stats.average}%</Text>
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>{t('screens.avg')}</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Floating Action Button for Results */}
      {!selectedExam.isPublished && (
        <View style={[styles.fabContainer, { paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.md }]}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.primary,
                borderRadius: shape.pill,
                opacity: pressed ? 0.9 : 1,
                shadowColor: colors.shadow,
                elevation: 4,
              }
            ]}
            onPress={handleEnterResults}
          >
            <Edit size={20} color={colors.onPrimary} style={{ marginRight: spacing.sm }} />
            <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>
              {results.length > 0 ? 'Edit Results' : 'Enter Results'}
            </Text>
          </Pressable>
        </View>
      )}
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
  },
  iconButton: {
    padding: 8,
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
  },
  card: {
    padding: 16,
    // Shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  examHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  divider: {
    height: 1,
  },
  verticalDivider: {
    width: 1,
    height: 40,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 16,
  },
  marksRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  marksItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionButton: {
    flexDirection: 'row', // To align icon and text
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
});

export default ExamDetailScreen;
