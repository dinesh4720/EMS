import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Plus, NotebookPen, Calendar, ChevronRight, AlertCircle, Clock, CheckCircle, Timer } from 'lucide-react-native';

import { useExamContext } from '../../context/ExamContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const ExamsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { exams, loading, error, fetchExams } = useExamContext();
  const { colors, typography, spacing, shape } = useTheme();

  useFocusEffect(
    useCallback(() => {
      fetchExams();
    }, [fetchExams])
  );

  const getStatusConfig = (status) => {
    switch (status) {
      case 'scheduled':
        return {
          icon: Calendar,
          color: colors.primary,
          container: colors.primaryContainer,
          text: colors.onPrimaryContainer
        };
      case 'ongoing':
        return {
          icon: Timer,
          color: colors.tertiary,
          container: colors.tertiaryContainer,
          text: colors.onTertiaryContainer
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: colors.secondary,
          container: colors.secondaryContainer,
          text: colors.onSecondaryContainer
        };
      case 'results_published':
        return {
          icon: CheckCircle,
          color: colors.green || '#4CAF50',
          container: colors.surfaceVariant,
          text: colors.onSurfaceVariant
        };
      default:
        return {
          icon: AlertCircle,
          color: colors.outline,
          container: colors.surfaceContainerHigh,
          text: colors.onSurfaceVariant
        };
    }
  };

  const handleExamPress = (exam) => {
    navigation.navigate('ExamDetail', { examId: exam.id, examName: exam.name });
  };

  const handleCreateExam = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CreateExam');
  };

  const renderExamItem = ({ item }) => {
    const statusConfig = getStatusConfig(item.status);
    const StatusIcon = statusConfig.icon;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.examCard,
          {
            backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainer,
            borderRadius: shape.cornerLarge,
            borderColor: colors.outlineVariant,
            marginBottom: spacing.md,
          },
        ]}
        onPress={() => handleExamPress(item)}
        accessibilityRole="button"
      >
        <View style={[styles.examHeader, { marginBottom: spacing.sm }]}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
              {item.subjectName} • {item.classId || item.className}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.container, borderRadius: shape.pill }
            ]}
          >
            <StatusIcon size={14} color={statusConfig.text} style={{ marginRight: 4 }} />
            <Text
              style={[
                typography.labelSmall,
                { color: statusConfig.text, textTransform: 'capitalize' }
              ]}
            >
              {item.status?.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.outlineVariant, marginVertical: spacing.sm }]} />

        <View style={styles.examDetails}>
          <View style={styles.detailRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Calendar size={16} color={colors.onSurfaceVariant} style={{ marginRight: spacing.xs }} />
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
                {item.startDate}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.onSurfaceVariant} />
          </View>
        </View>

        {!item.isPublished && item.status === 'completed' && (
          <View style={[styles.actionHint, {
            marginTop: spacing.sm,
            paddingTop: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.outlineVariant
          }]}>
            <Text style={[typography.labelMedium, { color: colors.primary }]}>
              Tap to enter results
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  if (loading && exams.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, marginTop: spacing.md }]}>
          Loading exams...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, {
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.outlineVariant,
      }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>{t('screens.exams')}</Text>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
              {exams.length} exam{exams.length !== 1 ? 's' : ''} scheduled
            </Text>
          </View>
        </View>
      </View>

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer, margin: spacing.md, borderRadius: shape.cornerMedium }]}>
          <AlertCircle size={20} color={colors.onErrorContainer} style={{ marginRight: spacing.sm }} />
          <Text style={[typography.bodyMedium, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
        </View>
      )}

      <FlatList
        data={exams}
        keyExtractor={(item) => item.id}
        renderItem={renderExamItem}
        contentContainerStyle={[styles.listContent, { padding: spacing.md, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchExams}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <NotebookPen size={48} color={colors.outline} />
            <Text style={[typography.titleLarge, { color: colors.onSurface, marginTop: spacing.md }]}>
              No Exams
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm }]}>
              No exams scheduled for your classes yet
            </Text>
          </View>
        }
      />

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primaryContainer,
            borderRadius: shape.cornerXLarge,
            shadowColor: colors.shadow,
            bottom: insets.bottom + spacing.lg,
            right: spacing.lg,
          },
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
        ]}
        onPress={handleCreateExam}
      >
        <Plus size={24} color={colors.onPrimaryContainer} />
        <Text style={[typography.labelLarge, { color: colors.onPrimaryContainer, marginLeft: spacing.sm }]}>
          Create
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    // Dynamic styles
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  examCard: {
    padding: 16,
    borderWidth: 1,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
  },
  examDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionHint: {
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  fab: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default ExamsScreen;
