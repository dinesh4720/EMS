import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Calendar, ChevronDown, Check, Info } from 'lucide-react-native';

import { useTheme } from '../../context/ThemeContext';
import { examsApi, subjectsApi, authApi, classesApi } from '../../services/api';

const CreateExamScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, typography, spacing, shape } = useTheme();

  const preselectedClassId = route.params?.classId;
  const preselectedClassName = route.params?.className;

  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    classId: preselectedClassId || '',
    subjectId: '',
    subjectName: '',
    date: new Date(),
    maxMarks: '100',
    passingMarks: '35',
    duration: '60',
    term: 'Term 1',
    academicYear: new Date().getFullYear().toString(),
    weightage: '10',
    examType: 'written',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await authApi.getCurrentUser();
      if (user?.id) {
        // Load subjects
        const subjectsData = await subjectsApi.getAll();
        setSubjects(subjectsData || []);

        // Load staff's classes
        const classesData = await classesApi.getStaffClasses(user.id);
        setClasses(classesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Exam name is required';
    }
    if (!formData.classId) {
      newErrors.classId = 'Please select a class';
    }
    if (!formData.subjectId) {
      newErrors.subjectId = 'Please select a subject';
    }
    if (!formData.maxMarks || parseInt(formData.maxMarks) <= 0) {
      newErrors.maxMarks = 'Enter valid max marks';
    }
    if (!formData.passingMarks || parseInt(formData.passingMarks) < 0) {
      newErrors.passingMarks = 'Enter valid passing marks';
    }
    if (parseInt(formData.passingMarks) > parseInt(formData.maxMarks)) {
      newErrors.passingMarks = 'Passing marks cannot exceed max marks';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const user = await authApi.getCurrentUser();

      const examData = {
        name: formData.name.trim(),
        classId: formData.classId,
        subjectId: formData.subjectId,
        subjectName: formData.subjectName,
        date: formData.date.toISOString().split('T')[0],
        startDate: formData.date.toISOString().split('T')[0],
        maxMarks: parseInt(formData.maxMarks),
        passingMarks: parseInt(formData.passingMarks),
        duration: parseInt(formData.duration) || 60,
        term: formData.term,
        academicYear: formData.academicYear,
        weightage: parseInt(formData.weightage) || 10,
        examType: formData.examType,
        createdBy: user?.id,
        status: 'scheduled',
      };

      const result = await examsApi.createWithResults(examData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Success',
        `Exam "${formData.name}" created successfully with ${result.resultsInitialized || 0} result entries`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating exam:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const renderFormField = (label, field, placeholder, keyboardType = 'default', multiline = false) => (
    <View style={styles.fieldContainer}>
      <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: colors.surfaceContainer,
            color: colors.onSurface,
            borderColor: errors[field] ? colors.error : colors.outline,
            borderRadius: shape.cornerMedium,
            padding: spacing.md,
          },
          multiline && styles.textInputMultiline,
        ]}
        value={formData[field]}
        onChangeText={(value) => updateField(field, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {errors[field] && (
        <Text style={[typography.bodySmall, { color: colors.error, marginTop: spacing.xs }]}>
          {errors[field]}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.outlineVariant
      }]}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: pressed ? colors.surfaceContainerHigh : 'transparent', borderRadius: shape.pill }
          ]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={[typography.titleLarge, { color: colors.onSurface, flex: 1, marginLeft: spacing.md }]}>
          Create Exam
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { padding: spacing.md, paddingBottom: 100 }]}>
        {/* Exam Name */}
        {renderFormField('Exam Name *', 'name', 'e.g., Mid-Term Examination')}

        {/* Class Selection */}
        <View style={styles.fieldContainer}>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
            Class *
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.picker,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: errors.classId ? colors.error : colors.outline,
                borderRadius: shape.cornerMedium,
                padding: spacing.md,
              },
              pressed && { opacity: 0.8 }
            ]}
            onPress={() => {
              Alert.alert(
                'Select Class',
                'Choose a class',
                classes.map(c => ({
                  text: c.name || c.id,
                  onPress: () => updateField('classId', c.id),
                })),
                { cancelable: true }
              );
            }}
          >
            <Text style={[typography.bodyLarge, { color: formData.classId ? colors.onSurface : colors.onSurfaceVariant }]}>
              {preselectedClassName ||
                classes.find(c => c.id === formData.classId)?.name ||
                'Select Class'}
            </Text>
            <ChevronDown size={20} color={colors.onSurfaceVariant} />
          </Pressable>
          {errors.classId && (
            <Text style={[typography.bodySmall, { color: colors.error, marginTop: spacing.xs }]}>
              {errors.classId}
            </Text>
          )}
        </View>

        {/* Subject Selection */}
        <View style={styles.fieldContainer}>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
            Subject *
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.picker,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: errors.subjectId ? colors.error : colors.outline,
                borderRadius: shape.cornerMedium,
                padding: spacing.md,
              },
              pressed && { opacity: 0.8 }
            ]}
            onPress={() => {
              Alert.alert(
                'Select Subject',
                'Choose a subject',
                subjects.map(s => ({
                  text: s.name,
                  onPress: () => {
                    updateField('subjectId', s.id);
                    updateField('subjectName', s.name);
                  },
                })),
                { cancelable: true }
              );
            }}
          >
            <Text style={[typography.bodyLarge, { color: formData.subjectId ? colors.onSurface : colors.onSurfaceVariant }]}>
              {formData.subjectName || 'Select Subject'}
            </Text>
            <ChevronDown size={20} color={colors.onSurfaceVariant} />
          </Pressable>
          {errors.subjectId && (
            <Text style={[typography.bodySmall, { color: colors.error, marginTop: spacing.xs }]}>
              {errors.subjectId}
            </Text>
          )}
        </View>

        {/* Date Picker */}
        <View style={styles.fieldContainer}>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
            Exam Date *
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.picker,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.outline,
                borderRadius: shape.cornerMedium,
                padding: spacing.md,
              },
              pressed && { opacity: 0.8 }
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[typography.bodyLarge, { color: colors.onSurface }]}>
              {formData.date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Calendar size={20} color={colors.primary} />
          </Pressable>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Marks Section */}
        <View style={styles.row}>
          <View style={[styles.fieldContainer, { flex: 1, marginRight: spacing.sm }]}>
            {renderFormField('Max Marks *', 'maxMarks', '100', 'numeric')}
          </View>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            {renderFormField('Passing Marks *', 'passingMarks', '35', 'numeric')}
          </View>
        </View>

        {/* Duration & Weightage */}
        <View style={styles.row}>
          <View style={[styles.fieldContainer, { flex: 1, marginRight: spacing.sm }]}>
            {renderFormField('Duration (min)', 'duration', '60', 'numeric')}
          </View>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            {renderFormField('Weightage (%)', 'weightage', '10', 'numeric')}
          </View>
        </View>

        {/* Term & Academic Year */}
        <View style={styles.row}>
          <View style={[styles.fieldContainer, { flex: 1, marginRight: spacing.sm }]}>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
              Term
            </Text>
            <View style={[styles.segmentedControl, { borderColor: colors.outline }]}>
              {['Term 1', 'Term 2', 'Term 3', 'Final'].map((term, index, arr) => (
                <Pressable
                  key={term}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: formData.term === term ? colors.secondaryContainer : 'transparent',
                      borderRightWidth: index < arr.length - 1 ? 1 : 0,
                      borderRightColor: colors.outline
                    }
                  ]}
                  onPress={() => updateField('term', term)}
                >
                  <Text
                    style={[
                      typography.labelSmall,
                      { color: formData.term === term ? colors.onSecondaryContainer : colors.onSurfaceVariant }
                    ]}
                  >
                    {term}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.fieldContainer}>
          {renderFormField('Academic Year', 'academicYear', new Date().getFullYear().toString(), 'numeric')}
        </View>

        {/* Exam Type */}
        <View style={styles.fieldContainer}>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
            Exam Type
          </Text>
          <View style={[styles.segmentedControl, { borderColor: colors.outline }]}>
            {[
              { id: 'written', label: 'Written' },
              { id: 'practical', label: 'Practical' },
              { id: 'oral', label: 'Oral' },
            ].map((type, index, arr) => (
              <Pressable
                key={type.id}
                style={[
                  styles.segment,
                  {
                    backgroundColor: formData.examType === type.id ? colors.secondaryContainer : 'transparent',
                    borderRightWidth: index < arr.length - 1 ? 1 : 0,
                    borderRightColor: colors.outline
                  }
                ]}
                onPress={() => updateField('examType', type.id)}
              >
                <Text
                  style={[
                    typography.labelSmall,
                    { color: formData.examType === type.id ? colors.onSecondaryContainer : colors.onSurfaceVariant }
                  ]}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Info Note */}
        <View style={[styles.infoCard, { backgroundColor: colors.surfaceContainerHighest, borderRadius: shape.cornerMedium }]}>
          <Info size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, flex: 1 }]}>
            Creating this exam will automatically initialize empty result entries for all students in the selected class.
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, {
        backgroundColor: colors.surface,
        paddingBottom: insets.bottom + spacing.md,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.outlineVariant
      }]}>
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: colors.primary,
              borderRadius: shape.pill,
              opacity: loading || pressed ? 0.8 : 1
            }
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <Check size={20} color={colors.onPrimary} style={{ marginRight: spacing.sm }} />
              <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>Create Exam</Text>
            </>
          )}
        </Pressable>
      </View>
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
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    fontSize: 16,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginTop: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
});

export default CreateExamScreen;
