import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Search } from 'lucide-react-native';

import { useExamContext } from '../../context/ExamContext';
import { useTheme } from '../../context/ThemeContext';

const ResultsEntryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { exams, loading, error, fetchExams } = useExamContext(); // Just initializing context
  const { colors, typography, spacing, shape } = useTheme();

  const { examId } = route.params;

  const {
    selectedExam,
    students,
    resultEntries,
    fetchExamDetails,
    fetchStudentsForExam,
    fetchResults,
    updateResultEntry,
    saveResults,
  } = useExamContext();

  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [examId]);

  const loadData = async () => {
    const exam = await fetchExamDetails(examId);
    if (exam) {
      await fetchStudentsForExam(exam.classId);
      await fetchResults(exam.classId, examId);
    }
  };

  const handleMarksChange = (studentId, text) => {
    // improved validation to allow empty string (clearing input)
    if (text === '') {
      updateResultEntry(studentId, 0, resultEntries[studentId]?.remarks || '');
      return;
    }

    const marks = parseInt(text) || 0;
    const maxMarks = selectedExam?.maxMarks || 100;

    if (marks > maxMarks) {
      // Inline visual feedback could be better than alert, but alert for now
      // limiting to maxMarks automatically might be better UX
      return;
    }

    updateResultEntry(studentId, marks, resultEntries[studentId]?.remarks || '');
  };

  const handleSave = async () => {
    Alert.alert(
      'Save Results',
      'Are you sure you want to save these results?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            setSaving(true);
            const result = await saveResults(examId);
            setSaving(false);

            if (result.success) {
              Alert.alert('Success', 'Results saved successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } else {
              Alert.alert('Error', result.error || 'Failed to save results');
            }
          }
        }
      ]
    );
  };

  const calculateGrade = (marks) => {
    if (!selectedExam) return '';
    const maxMarks = selectedExam.maxMarks || 100;
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 35) return 'D';
    return 'F';
  };

  const getStatus = (marks) => {
    if (!selectedExam) return '';
    const passingMarks = selectedExam.passingMarks || 35;
    return marks >= passingMarks ? 'Pass' : 'Fail';
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.rollNo && student.rollNo.toString().includes(searchQuery))
  );

  const renderStudentItem = ({ item, index }) => {
    const entry = resultEntries[item.id] || {};
    const marks = entry.marksObtained || 0;
    const grade = calculateGrade(marks);
    const status = getStatus(marks);
    const isPassing = status === 'Pass';

    return (
      <View style={[
        styles.studentRow,
        {
          backgroundColor: colors.surfaceContainer,
          borderRadius: shape.cornerMedium,
          marginBottom: spacing.xs,
          borderColor: colors.outlineVariant,
          borderWidth: 1,
        }
      ]}>
        <View style={styles.studentInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[typography.titleMedium, { color: colors.onPrimaryContainer }]}>
              {index + 1}
            </Text>
          </View>
          <View style={styles.studentDetails}>
            <Text style={[typography.bodyLarge, { color: colors.onSurface }]}>{item.name}</Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
              Roll: {item.rollNo || '-'}
            </Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.marksInput,
              {
                backgroundColor: colors.surface,
                color: colors.onSurface,
                borderColor: colors.outline,
                borderRadius: shape.cornerSmall,
              }
            ]}
            value={marks.toString()}
            onChangeText={(text) => handleMarksChange(item.id, text)}
            keyboardType="numeric"
            maxLength={3}
            placeholder="0"
            placeholderTextColor={colors.onSurfaceVariant}
            selectTextOnFocus
          />
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginLeft: 4 }]}>
            / {selectedExam?.maxMarks || 100}
          </Text>
        </View>

        <View style={styles.resultInfo}>
          <View style={[
            styles.gradeBadge,
            { backgroundColor: isPassing ? colors.greenContainer || '#E8F5E9' : colors.errorContainer }
          ]}>
            <Text style={[
              typography.labelMedium,
              { color: isPassing ? colors.onGreenContainer || '#1B5E20' : colors.onErrorContainer, fontWeight: 'bold' }
            ]}>
              {grade}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !selectedExam) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, marginTop: spacing.md }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, {
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.outlineVariant
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
        <View style={styles.headerTitleContainer}>
          <Text style={[typography.titleLarge, { color: colors.onSurface }]}>Enter Results</Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{selectedExam?.name}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: colors.primary,
              borderRadius: shape.pill,
              opacity: saving || pressed ? 0.7 : 1
            }
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>Save</Text>
          )}
        </Pressable>
      </View>

      <View style={[styles.searchBar, {
        margin: spacing.md,
        backgroundColor: colors.surfaceContainerHigh,
        borderRadius: shape.cornerFull,
        paddingHorizontal: spacing.md
      }]}>
        <Search size={20} color={colors.onSurfaceVariant} />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface, marginLeft: spacing.sm }]}
          placeholder="Search student..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={[styles.infoBar, { backgroundColor: colors.secondaryContainer, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: shape.cornerMedium }]}>
        <Text style={[typography.labelMedium, { color: colors.onSecondaryContainer, textAlign: 'center' }]}>
          Max: {selectedExam?.maxMarks || 100} • Pass: {selectedExam?.passingMarks || 35}
        </Text>
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderStudentItem}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: spacing.md, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant }]}>No students found</Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  infoBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    //
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentDetails: {
    marginLeft: 10,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  marksInput: {
    width: 60,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    borderWidth: 1,
  },
  resultInfo: {
    alignItems: 'center',
    minWidth: 40,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});

export default ResultsEntryScreen;
