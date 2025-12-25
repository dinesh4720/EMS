import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, SafeAreaView, Platform
} from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../theme';
import { Feather } from '@expo/vector-icons';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AnimatedPage from '../components/ui/AnimatedPage';

export default function WorkScreen({ navigation }) {
  const { tasks, notes, addTask, toggleTask, deleteTask, addNote, updateNote, deleteNote } = useApp();
  const [activeSection, setActiveSection] = useState('tasks'); // 'tasks', 'planning', 'notes'
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);

  const pendingTasks = tasks.filter(t => !t.done);
  const completedTasks = tasks.filter(t => t.done);

  const handleAddTask = () => {
    if (!taskTitle.trim()) return Alert.alert('Error', 'Task title is required');
    addTask({
      title: taskTitle,
      notes: taskNotes,
      done: false,
      dueDate: taskDueDate || new Date().toISOString(),
      category: 'task'
    });
    setTaskTitle('');
    setTaskNotes('');
    setTaskDueDate('');
    setShowTaskForm(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote(newNote);
    setNewNote('');
  };

  const handleDeleteTask = (taskId) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(taskId) }
    ]);
  };

  const TaskItem = ({ task, completed }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => toggleTask(task.id)}>
      <Card style={[styles.taskCard, completed && styles.taskDone]}>
        <View style={styles.taskRow}>
          <View style={[styles.checkbox, completed && styles.checkboxDone]}>
            {completed && <Feather name="check" size={14} color={COLORS.white} />}
          </View>
          <View style={styles.taskContent}>
            <Text style={[styles.taskTitle, completed && styles.taskTitleDone]}>{task.title}</Text>
            {task.notes && <Text style={styles.taskNotes}>{task.notes}</Text>}
            {task.dueDate && !completed && (
              <Text style={styles.taskDue}>Due: {new Date(task.dueDate).toLocaleDateString()}</Text>
            )}
          </View>
          {!completed && (
            <TouchableOpacity onPress={() => handleDeleteTask(task.id)} style={styles.deleteBtn}>
              <Feather name="trash-2" size={16} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  const NoteItem = ({ note }) => (
    <Card style={styles.noteCard}>
      <Text style={styles.noteContent}>{note.content}</Text>
      <View style={styles.noteFooter}>
        <Text style={styles.noteDate}>{new Date(note.createdAt).toLocaleDateString()}</Text>
        <TouchableOpacity onPress={() => deleteNote(note.id)}>
          <Feather name="trash-2" size={14} color={COLORS.gray} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <AnimatedPage style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Work</Text>
            <Text style={styles.pageSubtitle}>Tasks, planning & notes</Text>
          </View>

          {/* Section Tabs */}
          <View style={styles.sectionTabs}>
            <TouchableOpacity
              style={[styles.sectionTab, activeSection === 'tasks' && styles.sectionTabActive]}
              onPress={() => setActiveSection('tasks')}
            >
              <Feather name="check-square" size={18} color={activeSection === 'tasks' ? COLORS.primary : COLORS.gray} />
              <Text style={[styles.sectionTabText, activeSection === 'tasks' && styles.sectionTabTextActive]}>Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sectionTab, activeSection === 'planning' && styles.sectionTabActive]}
              onPress={() => setActiveSection('planning')}
            >
              <Feather name="calendar" size={18} color={activeSection === 'planning' ? COLORS.primary : COLORS.gray} />
              <Text style={[styles.sectionTabText, activeSection === 'planning' && styles.sectionTabTextActive]}>Planning</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sectionTab, activeSection === 'notes' && styles.sectionTabActive]}
              onPress={() => setActiveSection('notes')}
            >
              <Feather name="file-text" size={18} color={activeSection === 'notes' ? COLORS.primary : COLORS.gray} />
              <Text style={[styles.sectionTabText, activeSection === 'notes' && styles.sectionTabTextActive]}>Notes</Text>
            </TouchableOpacity>
          </View>

          {/* Tasks Section */}
          {activeSection === 'tasks' && (
            <>
              {/* Add Task */}
              {!showTaskForm ? (
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowTaskForm(true)}>
                  <Feather name="plus-circle" size={22} color={COLORS.primary} />
                  <Text style={styles.addBtnText}>Add New Task</Text>
                </TouchableOpacity>
              ) : (
                <Card>
                  <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>New Task</Text>
                    <TouchableOpacity onPress={() => setShowTaskForm(false)}>
                      <Feather name="x" size={20} color={COLORS.gray} />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="What needs to be done?"
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                    autoFocus
                  />
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Notes (optional)"
                    value={taskNotes}
                    onChangeText={setTaskNotes}
                    multiline
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Due date (YYYY-MM-DD)"
                    value={taskDueDate}
                    onChangeText={setTaskDueDate}
                  />
                  <Button title="Save Task" onPress={handleAddTask} />
                </Card>
              )}

              {/* Pending Tasks */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>To Do ({pendingTasks.length})</Text>
                {pendingTasks.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Feather name="check-circle" size={40} color={COLORS.lightGray} />
                    <Text style={styles.emptyText}>All caught up!</Text>
                  </View>
                ) : (
                  pendingTasks.map(task => <TaskItem key={task.id} task={task} />)
                )}
              </View>

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Completed ({completedTasks.length})</Text>
                  {completedTasks.slice(0, 5).map(task => <TaskItem key={task.id} task={task} completed />)}
                </View>
              )}
            </>
          )}

          {/* Planning Section */}
          {activeSection === 'planning' && (
            <View style={styles.section}>
              <Card style={styles.planningCard}>
                <View style={styles.planningHeader}>
                  <Feather name="calendar" size={24} color={COLORS.primary} />
                  <Text style={styles.planningTitle}>Lesson Planning</Text>
                </View>
                <Text style={styles.planningDesc}>
                  Personal lesson planning and preparation notes. Use this space to organize your teaching materials.
                </Text>
                <View style={styles.planningStats}>
                  <View style={styles.planningStat}>
                    <Text style={styles.planningStatValue}>0</Text>
                    <Text style={styles.planningStatLabel}>This Week</Text>
                  </View>
                  <View style={styles.planningStat}>
                    <Text style={styles.planningStatValue}>0</Text>
                    <Text style={styles.planningStatLabel}>Pending</Text>
                  </View>
                </View>
                <Button title="Start Planning" variant="secondary" onPress={() => navigation.navigate('PersonalLessonPlanning')} />
              </Card>
            </View>
          )}

          {/* Notes Section */}
          {activeSection === 'notes' && (
            <>
              {/* Quick Note Input */}
              <Card style={styles.quickNoteCard}>
                <TextInput
                  style={styles.quickNoteInput}
                  placeholder="Jot down a quick note..."
                  value={newNote}
                  onChangeText={setNewNote}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={[styles.quickNoteBtn, !newNote.trim() && styles.quickNoteBtnDisabled]}
                  onPress={handleAddNote}
                  disabled={!newNote.trim()}
                >
                  <Feather name="plus" size={20} color={newNote.trim() ? COLORS.white : COLORS.gray} />
                </TouchableOpacity>
              </Card>

              {/* Notes List */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Notes ({notes.length})</Text>
                {notes.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Feather name="file-text" size={40} color={COLORS.lightGray} />
                    <Text style={styles.emptyText}>No notes yet</Text>
                  </View>
                ) : (
                  notes.map(note => <NoteItem key={note.id} note={note} />)
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </AnimatedPage >
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: Platform.OS === 'android' ? 40 : 0 },
  container: { padding: SPACING.l, paddingBottom: 100 },

  header: { marginBottom: SPACING.l },
  pageTitle: { fontSize: 32, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  pageSubtitle: { fontSize: 14, color: COLORS.gray, marginTop: 4, fontFamily: 'Inter_400Regular' },

  // Section Tabs
  sectionTabs: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 4, marginBottom: SPACING.l, ...SHADOWS.small },
  sectionTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
  sectionTabActive: { backgroundColor: COLORS.primaryLight },
  sectionTabText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: COLORS.gray, marginLeft: 6 },
  sectionTabTextActive: { color: COLORS.primary },

  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_500Medium', color: COLORS.gray, textTransform: 'uppercase', marginBottom: SPACING.m, letterSpacing: 0.5 },

  // Add Button
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed', borderRadius: 12, padding: SPACING.l, backgroundColor: COLORS.primaryLight + '40', marginBottom: SPACING.l },
  addBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: COLORS.primary, marginLeft: SPACING.s },

  // Form
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.m },
  formTitle: { fontSize: 16, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  input: { borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 10, padding: SPACING.m, fontSize: 15, marginBottom: SPACING.m, backgroundColor: '#FAFAFA', fontFamily: 'Inter_400Regular' },
  textarea: { minHeight: 80, textAlignVertical: 'top' },

  // Task Card
  taskCard: { marginBottom: SPACING.s },
  taskDone: { opacity: 0.6, backgroundColor: '#F9FAFB' },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.gray, marginRight: SPACING.m, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 15, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  taskTitleDone: { textDecorationLine: 'line-through', color: COLORS.gray },
  taskNotes: { fontSize: 13, color: COLORS.gray, marginTop: 4, fontFamily: 'Inter_400Regular' },
  taskDue: { fontSize: 12, color: COLORS.primary, marginTop: 4, fontFamily: 'Inter_500Medium' },
  deleteBtn: { padding: SPACING.s },

  // Empty State
  emptyState: { alignItems: 'center', padding: SPACING.xl },
  emptyText: { marginTop: SPACING.m, color: COLORS.gray, fontFamily: 'Inter_400Regular' },

  // Planning Card
  planningCard: { padding: SPACING.l },
  planningHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m },
  planningTitle: { fontSize: 18, fontFamily: 'Inter_500Medium', color: COLORS.dark, marginLeft: SPACING.m },
  planningDesc: { fontSize: 14, color: COLORS.gray, lineHeight: 20, marginBottom: SPACING.l, fontFamily: 'Inter_400Regular' },
  planningStats: { flexDirection: 'row', marginBottom: SPACING.l },
  planningStat: { flex: 1, alignItems: 'center' },
  planningStatValue: { fontSize: 24, fontFamily: 'Inter_500Medium', color: COLORS.dark },
  planningStatLabel: { fontSize: 12, color: COLORS.gray, marginTop: 2, fontFamily: 'Inter_400Regular' },

  // Quick Note
  quickNoteCard: { flexDirection: 'row', alignItems: 'flex-end', padding: SPACING.m, marginBottom: SPACING.l },
  quickNoteInput: { flex: 1, fontSize: 15, minHeight: 60, textAlignVertical: 'top', marginRight: SPACING.m, fontFamily: 'Inter_400Regular' },
  quickNoteBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  quickNoteBtnDisabled: { backgroundColor: COLORS.lightGray },

  // Note Card
  noteCard: { marginBottom: SPACING.s },
  noteContent: { fontSize: 14, color: COLORS.dark, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.m, paddingTop: SPACING.s, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  noteDate: { fontSize: 12, color: COLORS.gray, fontFamily: 'Inter_400Regular' },
});
