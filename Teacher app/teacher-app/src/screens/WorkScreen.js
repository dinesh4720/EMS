import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, SafeAreaView, Platform, KeyboardAvoidingView
} from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../theme';
import { Feather } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import AnimatedPage from '../components/ui/AnimatedPage';
import ModernHeader from '../components/ui/ModernHeader';
import ModernTabBar from '../components/ui/ModernTabBar';
import SectionHeader from '../components/ui/SectionHeader';

const SECTIONS = ['Tasks', 'Planning', 'Notes'];

export default function WorkScreen({ navigation }) {
  const { tasks, notes, addTask, toggleTask, deleteTask, addNote, deleteNote } = useApp();
  const [activeTab, setActiveTab] = useState(0); // 0: Tasks, 1: Planning, 2: Notes
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Task State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Note State
  const [newNote, setNewNote] = useState('');

  const pendingTasks = tasks.filter(t => !t.done);
  const completedTasks = tasks.filter(t => t.done);

  const handleAddTask = () => {
    if (!taskTitle.trim()) return Alert.alert('Error', 'Task title is required');
    addTask({
      title: taskTitle,
      done: false,
      dueDate: taskDueDate || new Date().toISOString(),
      category: 'task'
    });
    setTaskTitle('');
    setTaskDueDate('');
    setShowTaskForm(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote(newNote);
    setNewNote('');
  };

  const TaskRow = ({ task, completed }) => (
    <View style={[styles.taskRow, completed && styles.taskRowDone]}>
      <TouchableOpacity
        style={[styles.checkbox, completed && styles.checkboxActive]}
        onPress={() => toggleTask(task.id)}
      >
        {completed && <Feather name="check" size={14} color="#FFF" />}
      </TouchableOpacity>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.taskTitle, completed && styles.textDone]}>{task.title}</Text>
        {task.dueDate && !completed && <Text style={styles.taskDate}>Due: {new Date(task.dueDate).toLocaleDateString()}</Text>}
      </View>

      {!completed && (
        <TouchableOpacity onPress={() => deleteTask(task.id)}>
          <Feather name="trash-2" size={18} color={COLORS.gray} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <AnimatedPage style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ModernHeader title="Work & Planning" subtitle="Stay organized" hideProfile={true} />
        <ModernTabBar tabs={SECTIONS} activeTab={activeTab} onTabPress={setActiveTab} />

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* TASKS TAB */}
          {activeTab === 0 && (
            <>
              <TouchableOpacity style={styles.addCard} onPress={() => setShowTaskForm(!showTaskForm)}>
                <View style={styles.addIcon}>
                  <Feather name={showTaskForm ? "x" : "plus"} size={24} color="#FFF" />
                </View>
                <Text style={styles.addText}>{showTaskForm ? "Cancel" : "Add New Task"}</Text>
              </TouchableOpacity>

              {showTaskForm && (
                <View style={styles.formContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="What needs to be done?"
                    value={taskTitle} onChangeText={setTaskTitle}
                    placeholderTextColor={COLORS.gray}
                  />
                  <Button title="Save Task" onPress={handleAddTask} />
                </View>
              )}

              <SectionHeader title={`To Do (${pendingTasks.length})`} />
              <View style={styles.listContainer}>
                {pendingTasks.length === 0 ? <Text style={styles.emptyText}>All caught up!</Text> :
                  pendingTasks.map(t => <TaskRow key={t.id} task={t} />)
                }
              </View>

              {completedTasks.length > 0 && (
                <>
                  <SectionHeader title="Completed" />
                  <View style={[styles.listContainer, { opacity: 0.8 }]}>
                    {completedTasks.slice(0, 5).map(t => <TaskRow key={t.id} task={t} completed />)}
                  </View>
                </>
              )}
            </>
          )}

          {/* PLANNING TAB */}
          {activeTab === 1 && (
            <View style={styles.planningCard}>
              <View style={styles.planningHeader}>
                <View style={styles.planningIcon}>
                  <Feather name="book-open" size={24} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.planningTitle}>Lesson Planning</Text>
                  <Text style={styles.planningSubtitle}>Prepare for upcoming weeks</Text>
                </View>
              </View>
              <View style={styles.planningStats}>
                <View style={styles.pStat}>
                  <Text style={styles.pStatVal}>0</Text>
                  <Text style={styles.pStatLabel}>Weekly Plans</Text>
                </View>
                <View style={styles.pStatLine} />
                <View style={styles.pStat}>
                  <Text style={styles.pStatVal}>0</Text>
                  <Text style={styles.pStatLabel}>Pending</Text>
                </View>
              </View>
              <Button title="Open Planner" onPress={() => navigation.navigate('PersonalLessonPlanning')}
                variant="secondary" style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 0 }} textStyle={{ color: '#FFF' }}
              />
            </View>
          )}

          {/* NOTES TAB */}
          {activeTab === 2 && (
            <>
              <View style={styles.noteInputCard}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Jot down a quick note..."
                  multiline
                  value={newNote} onChangeText={setNewNote}
                  placeholderTextColor={COLORS.gray}
                />
                {newNote.length > 0 && (
                  <TouchableOpacity style={styles.noteSendBtn} onPress={handleAddNote}>
                    <Feather name="arrow-up" size={20} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.notesGrid}>
                {notes.map(n => (
                  <View key={n.id} style={styles.noteCard}>
                    <Text style={styles.noteText}>{n.content}</Text>
                    <View style={styles.noteFooter}>
                      <Text style={styles.noteDate}>{new Date(n.createdAt).toLocaleDateString()}</Text>
                      <TouchableOpacity onPress={() => deleteNote(n.id)}>
                        <Feather name="trash-2" size={14} color={COLORS.gray} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

        </ScrollView>
      </SafeAreaView>
    </AnimatedPage >
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.fade, paddingTop: Platform.OS === 'android' ? 30 : 0 },
  container: { padding: SPACING.l, paddingBottom: 100 },

  // Task Styles
  addCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 16, marginBottom: SPACING.l },
  addIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addText: { color: COLORS.primary, fontSize: 16, fontFamily: 'Inter_600SemiBold' },

  formContainer: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 24, ...SHADOWS.small },
  input: { backgroundColor: COLORS.fade, padding: 16, borderRadius: 12, marginBottom: 16, fontFamily: 'Inter_400Regular' },

  listContainer: { backgroundColor: '#FFF', borderRadius: 20, padding: 8, marginBottom: 24, ...SHADOWS.small },
  taskRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.fade },
  taskRowDone: { opacity: 0.6 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.gray, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  taskTitle: { fontSize: 16, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  textDone: { textDecorationLine: 'line-through', color: COLORS.gray },
  taskDate: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  emptyText: { padding: 20, textAlign: 'center', color: COLORS.gray },

  // Planning
  planningCard: { backgroundColor: COLORS.primary, borderRadius: 24, padding: 24, ...SHADOWS.medium },
  planningHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  planningIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  planningTitle: { fontSize: 20, color: '#FFF', fontFamily: 'Inter_700Bold' },
  planningSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  planningStats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 16, padding: 16, marginBottom: 24 },
  pStat: { flex: 1, alignItems: 'center' },
  pStatVal: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  pStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  pStatLine: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Notes
  noteInputCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 8, alignItems: 'flex-end', marginBottom: 24, ...SHADOWS.small },
  noteInput: { flex: 1, padding: 12, maxHeight: 100, fontSize: 16, fontFamily: 'Inter_400Regular' },
  noteSendBtn: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4, marginRight: 4 },

  notesGrid: { gap: 12 },
  noteCard: { backgroundColor: COLORS.surfaceVariant, padding: 16, borderRadius: 16, marginBottom: 8 },
  noteText: { fontSize: 16, color: COLORS.dark, lineHeight: 24, fontFamily: 'Inter_400Regular' },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, opacity: 0.6 },
  noteDate: { fontSize: 12 }
});
