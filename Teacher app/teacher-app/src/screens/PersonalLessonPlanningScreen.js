import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, Platform, Alert, Modal
} from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, SHADOWS } from '../theme';
import { Feather } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function PersonalLessonPlanningScreen({ navigation }) {
  const { personalLessonPlans, addPersonalLessonPlan, updatePersonalLessonPlan, deletePersonalLessonPlan } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState('');
  const [activities, setActivities] = useState('');
  const [resources, setResources] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setTopic('');
    setObjectives('');
    setActivities('');
    setResources('');
    setNotes('');
    setEditingPlan(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    const planData = {
      title,
      subject,
      topic,
      objectives,
      activities,
      resources,
      notes
    };

    if (editingPlan) {
      updatePersonalLessonPlan(editingPlan.id, planData);
    } else {
      addPersonalLessonPlan(planData);
    }

    resetForm();
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setTitle(plan.title);
    setSubject(plan.subject || '');
    setTopic(plan.topic || '');
    setObjectives(plan.objectives || '');
    setActivities(plan.activities || '');
    setResources(plan.resources || '');
    setNotes(plan.notes || '');
    setShowForm(true);
  };

  const handleDelete = (planId) => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this lesson plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deletePersonalLessonPlan(planId) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Lesson Plans</Text>
        <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addBtn}>
          <Feather name="plus" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {personalLessonPlans.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="book-open" size={64} color={COLORS.lightGray} />
            <Text style={styles.emptyTitle}>No Lesson Plans Yet</Text>
            <Text style={styles.emptyText}>
              Create your personal lesson plans for better organization
            </Text>
            <Button
              title="Create First Plan"
              onPress={() => setShowForm(true)}
              style={{ marginTop: SPACING.l }}
            />
          </View>
        ) : (
          personalLessonPlans.map(plan => (
            <Card key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  {plan.subject && (
                    <Text style={styles.planMeta}>Subject: {plan.subject}</Text>
                  )}
                  {plan.topic && (
                    <Text style={styles.planMeta}>Topic: {plan.topic}</Text>
                  )}
                </View>
                <View style={styles.planActions}>
                  <TouchableOpacity onPress={() => handleEdit(plan)} style={styles.actionBtn}>
                    <Feather name="edit-2" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(plan.id)} style={styles.actionBtn}>
                    <Feather name="trash-2" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              {plan.objectives && (
                <View style={styles.planSection}>
                  <Text style={styles.sectionLabel}>Objectives:</Text>
                  <Text style={styles.sectionText}>{plan.objectives}</Text>
                </View>
              )}

              {plan.activities && (
                <View style={styles.planSection}>
                  <Text style={styles.sectionLabel}>Activities:</Text>
                  <Text style={styles.sectionText}>{plan.activities}</Text>
                </View>
              )}

              {plan.resources && (
                <View style={styles.planSection}>
                  <Text style={styles.sectionLabel}>Resources:</Text>
                  <Text style={styles.sectionText}>{plan.resources}</Text>
                </View>
              )}

              {plan.notes && (
                <View style={styles.planSection}>
                  <Text style={styles.sectionLabel}>Notes:</Text>
                  <Text style={styles.sectionText}>{plan.notes}</Text>
                </View>
              )}

              <Text style={styles.planDate}>
                Created: {new Date(plan.createdAt).toLocaleDateString()}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={resetForm}>
              <Feather name="x" size={24} color={COLORS.dark} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingPlan ? 'Edit Lesson Plan' : 'New Lesson Plan'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Lesson title"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={COLORS.gray}
            />

            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mathematics, Science"
              value={subject}
              onChangeText={setSubject}
              placeholderTextColor={COLORS.gray}
            />

            <Text style={styles.label}>Topic</Text>
            <TextInput
              style={styles.input}
              placeholder="Specific topic"
              value={topic}
              onChangeText={setTopic}
              placeholderTextColor={COLORS.gray}
            />

            <Text style={styles.label}>Learning Objectives</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="What students will learn..."
              value={objectives}
              onChangeText={setObjectives}
              multiline
              textAlignVertical="top"
              placeholderTextColor={COLORS.gray}
            />

            <Text style={styles.label}>Activities</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Teaching activities and methods..."
              value={activities}
              onChangeText={setActivities}
              multiline
              textAlignVertical="top"
              placeholderTextColor={COLORS.gray}
            />

            <Text style={styles.label}>Resources Needed</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Materials, tools, references..."
              value={resources}
              onChangeText={setResources}
              multiline
              textAlignVertical="top"
              placeholderTextColor={COLORS.gray}
            />

            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Any other notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
              placeholderTextColor={COLORS.gray}
            />

            <Button
              title={editingPlan ? "Update Plan" : "Save Plan"}
              onPress={handleSave}
              size="large"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: Platform.OS === 'android' ? 40 : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray
  },
  backBtn: {
    padding: SPACING.s
  },
  addBtn: {
    padding: SPACING.s
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    color: COLORS.dark
  },
  container: {
    padding: SPACING.l,
    paddingBottom: 100
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter_500Medium',
    color: COLORS.dark,
    marginTop: SPACING.l
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: SPACING.s,
    paddingHorizontal: SPACING.xl
  },
  planCard: {
    marginBottom: SPACING.m
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.m
  },
  planTitle: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    color: COLORS.dark
  },
  planMeta: {
    fontSize: 13,
    color: COLORS.gray,
    fontFamily: 'Inter_400Regular',
    marginTop: 4
  },
  planActions: {
    flexDirection: 'row',
    gap: SPACING.s
  },
  actionBtn: {
    padding: SPACING.s
  },
  planSection: {
    marginBottom: SPACING.m
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: COLORS.gray,
    marginBottom: 4
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.dark,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20
  },
  planDate: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: 'Inter_400Regular',
    marginTop: SPACING.s
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    color: COLORS.dark
  },
  modalContent: {
    padding: SPACING.l,
    paddingBottom: 100
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: COLORS.dark,
    marginBottom: SPACING.s
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    padding: SPACING.m,
    fontSize: 15,
    marginBottom: SPACING.m,
    backgroundColor: COLORS.white,
    fontFamily: 'Inter_400Regular',
    color: COLORS.dark
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top'
  }
});
