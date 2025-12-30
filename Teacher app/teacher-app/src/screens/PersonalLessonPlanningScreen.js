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
import ModernHeader from '../components/ui/ModernHeader';
import SectionHeader from '../components/ui/SectionHeader';

export default function PersonalLessonPlanningScreen({ navigation }) {
  const { personalLessonPlans, addPersonalLessonPlan, updatePersonalLessonPlan, deletePersonalLessonPlan } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState('');
  const [activities, setActivities] = useState('');
  const [resources, setResources] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setTitle(''); setSubject(''); setTopic('');
    setObjectives(''); setActivities(''); setResources(''); setNotes('');
    setEditingPlan(null); setShowForm(false);
  };

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    const planData = { title, subject, topic, objectives, activities, resources, notes };
    if (editingPlan) updatePersonalLessonPlan(editingPlan.id, planData);
    else addPersonalLessonPlan(planData);
    resetForm();
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan); setTitle(plan.title); setSubject(plan.subject || '');
    setTopic(plan.topic || ''); setObjectives(plan.objectives || '');
    setActivities(plan.activities || ''); setResources(plan.resources || '');
    setNotes(plan.notes || ''); setShowForm(true);
  };

  const handleDelete = (planId) => {
    Alert.alert('Delete Plan', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePersonalLessonPlan(planId) }
    ]);
  };

  const InputField = ({ label, value, onChange, placeholder, multiline }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value} onChangeText={onChange}
        placeholder={placeholder} multiline={multiline}
        placeholderTextColor={COLORS.gray}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ModernHeader title="My Lesson Plans" subtitle="Organize your curriculum" backAction={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.actionsRow}>
          <SectionHeader title={`Saved Plans (${personalLessonPlans.length})`} />
          <TouchableOpacity style={styles.addBtnSmall} onPress={() => setShowForm(true)}>
            <Feather name="plus" size={20} color="#FFF" />
            <Text style={styles.addBtnText}>New Plan</Text>
          </TouchableOpacity>
        </View>

        {personalLessonPlans.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="book-open" size={48} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>No lesson plans yet.</Text>
            <Button title="Create Plan" onPress={() => setShowForm(true)} style={{ marginTop: 16 }} />
          </View>
        ) : (
          personalLessonPlans.map(plan => (
            <TouchableOpacity key={plan.id} activeOpacity={0.9} onPress={() => handleEdit(plan)}>
              <Card style={styles.planCard}>
                <View style={styles.stripe} />
                <View style={styles.cardContent}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <TouchableOpacity onPress={() => handleDelete(plan.id)}>
                      <Feather name="trash-2" size={18} color={COLORS.gray} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.subText}>{plan.subject} • {plan.topic}</Text>

                  {plan.objectives ? (
                    <View style={styles.snippetBox}>
                      <Text numberOfLines={2} style={styles.snippetText}>{plan.objectives}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.date}>Created: {new Date(plan.createdAt).toLocaleDateString()}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={showForm} animationType="slide">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingPlan ? 'Edit Plan' : 'New Plan'}</Text>
            <TouchableOpacity onPress={resetForm} style={styles.closeBtn}>
              <Feather name="x" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formContainer}>
            <InputField label="Lesson Title *" value={title} onChange={setTitle} placeholder="e.g. Algebra Basics" />
            <View style={styles.rowInput}>
              <View style={{ flex: 1, marginRight: 8 }}><InputField label="Subject" value={subject} onChange={setSubject} placeholder="Math" /></View>
              <View style={{ flex: 1, marginLeft: 8 }}><InputField label="Topic" value={topic} onChange={setTopic} placeholder="Equations" /></View>
            </View>
            <InputField label="Learning Objectives" value={objectives} onChange={setObjectives} placeholder="What will students learn?" multiline />
            <InputField label="Activities" value={activities} onChange={setActivities} placeholder="Class activities..." multiline />
            <InputField label="Resources" value={resources} onChange={setResources} placeholder="Materials needed..." multiline />
            <InputField label="Notes" value={notes} onChange={setNotes} placeholder="Personal notes..." multiline />

            <View style={{ height: 20 }} />
            <Button title="Save Lesson Plan" onPress={handleSave} size="large" />
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.fade, paddingTop: Platform.OS === 'android' ? 30 : 0 },
  container: { padding: SPACING.l, paddingBottom: 100 },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addBtnSmall: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, alignItems: 'center' },
  addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600', marginLeft: 6 },

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, color: COLORS.gray },

  planCard: { flexDirection: 'row', padding: 0, borderRadius: 16, marginBottom: 16, overflow: 'hidden', ...SHADOWS.small },
  stripe: { width: 6, backgroundColor: COLORS.secondary },
  cardContent: { flex: 1, padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: COLORS.dark },
  subText: { fontSize: 13, color: COLORS.gray, marginTop: 4, fontFamily: 'Inter_500Medium' },
  snippetBox: { backgroundColor: COLORS.fade, padding: 8, borderRadius: 8, marginTop: 12 },
  snippetText: { fontSize: 12, color: COLORS.dark, fontStyle: 'italic' },
  date: { fontSize: 11, color: COLORS.lightGray, marginTop: 12 },

  modalSafe: { flex: 1, backgroundColor: '#FFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.fade },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  closeBtn: { padding: 4 },
  formContainer: { padding: 20 },

  label: { fontSize: 13, color: COLORS.dark, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  input: { backgroundColor: COLORS.fade, borderRadius: 12, padding: 12, fontSize: 15, fontFamily: 'Inter_400Regular', color: COLORS.dark },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  rowInput: { flexDirection: 'row' }
});
