import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, 
  Modal, SafeAreaView, Platform, KeyboardAvoidingView, Alert, Image 
} from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../theme';
import { Feather } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import FluidTabBar from '../components/ui/FluidTabBar';

const TABS = ['Attend', 'Students', 'Teach', 'Assess', 'Announce'];

export default function ClassWorkspace({ route, navigation }) {
  const { classId, initialTab = 0 } = route.params;
  const [activeTab, setActiveTab] = useState(initialTab);
  const { 
    getStudentsForClass, markAttendance, getAttendance, 
    getLessonPlans, addLessonPlan, getHomework, addHomework,
    getTests, addTest, getAnnouncements, addAnnouncement, 
    addMarks, getMarks, getPendingActions, isClassTeacher,
    addStudentRemark, getStudentRemarks, getClassTeacherData
  } = useApp();

  const students = getStudentsForClass(classId);
  const today = new Date().toISOString().split('T')[0];
  const pendingActions = getPendingActions(classId);
  const isTeacherOfClass = isClassTeacher(classId);
  const classTeacherData = isTeacherOfClass ? getClassTeacherData(classId) : null;

  // Show pending actions banner
  const renderPendingActions = () => {
    if (pendingActions.length === 0) return null;
    return (
      <View style={styles.pendingActionsBar}>
        {pendingActions.slice(0, 2).map((action, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={styles.pendingActionItem}
            onPress={() => setActiveTab(action.tab)}
          >
            <Feather name="alert-circle" size={14} color={COLORS.warning} />
            <Text style={styles.pendingActionText}>{action.message}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderPendingActions()}
      <FluidTabBar tabs={TABS} activeTab={activeTab} onTabPress={setActiveTab} />
      <View style={styles.content}>
        {activeTab === 0 && <AttendanceTab classId={classId} students={students} today={today} markAttendance={markAttendance} getAttendance={getAttendance} />}
        {activeTab === 1 && <StudentsTab students={students} classId={classId} addStudentRemark={addStudentRemark} getStudentRemarks={getStudentRemarks} isClassTeacher={isTeacherOfClass} classTeacherData={classTeacherData} />}
        {activeTab === 2 && <TeachTab classId={classId} getLessonPlans={getLessonPlans} addLessonPlan={addLessonPlan} getHomework={getHomework} addHomework={addHomework} />}
        {activeTab === 3 && <AssessTab classId={classId} students={students} getTests={getTests} addTest={addTest} addMarks={addMarks} getMarks={getMarks} getLessonPlans={getLessonPlans} />}
        {activeTab === 4 && <AnnounceTab classId={classId} students={students} getAnnouncements={getAnnouncements} addAnnouncement={addAnnouncement} />}
      </View>
    </View>
  );
}

// ============ ATTENDANCE TAB ============
function AttendanceTab({ classId, students, today, markAttendance, getAttendance }) {
  const savedAttendance = getAttendance(classId, today);
  const [attendance, setAttendance] = useState(
    savedAttendance || students.reduce((acc, s) => ({ ...acc, [s.id]: 'present' }), {})
  );
  const [editMode, setEditMode] = useState(!savedAttendance);
  const [editReason, setEditReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);

  const toggleAttendance = (studentId) => {
    if (!editMode && savedAttendance) {
      setShowReasonModal(true);
      return;
    }
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const handleSave = async () => {
    const reason = savedAttendance && editMode ? editReason : null;
    const success = await markAttendance(classId, today, attendance, reason);
    if (success) {
      setEditMode(false);
      setEditReason('');
    }
  };

  const handleEditConfirm = () => {
    setShowReasonModal(false);
    setEditMode(true);
  };

  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length;

  if (students.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="users" size={48} color={COLORS.lightGray} />
        <Text style={styles.emptyText}>No students in this class</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContent}>
      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>{presentCount}</Text>
            <Text style={styles.summaryLabel}>Present</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{absentCount}</Text>
            <Text style={styles.summaryLabel}>Absent</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{students.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>
      </Card>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Feather name="info" size={14} color={COLORS.blue} />
        <Text style={styles.infoBannerText}>Default: All Present. Tap to mark absent.</Text>
      </View>

      {/* Student Grid */}
      <View style={styles.grid}>
        {students.map(student => (
          <TouchableOpacity
            key={student.id}
            style={[styles.gridItem, attendance[student.id] === 'present' ? styles.gridItemPresent : styles.gridItemAbsent]}
            onPress={() => toggleAttendance(student.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.avatarSmall, attendance[student.id] === 'absent' && styles.avatarAbsent]}>
              <Text style={styles.avatarTextSmall}>{student.name[0]}</Text>
            </View>
            <Text style={styles.gridName} numberOfLines={1}>{student.name.split(' ')[0]}</Text>
            <Text style={styles.gridRoll}>Roll {student.roll}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Save Button */}
      <View style={styles.footerAction}>
        <Button 
          title={savedAttendance && !editMode ? "Edit Attendance" : "Save Attendance"} 
          onPress={savedAttendance && !editMode ? () => setShowReasonModal(true) : handleSave} 
          size="large" 
        />
      </View>

      {/* Edit Reason Modal */}
      <Modal visible={showReasonModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Attendance</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason for editing</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for edit..."
              value={editReason}
              onChangeText={setEditReason}
              multiline
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" variant="secondary" onPress={() => setShowReasonModal(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Continue" onPress={handleEditConfirm} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ============ STUDENTS TAB ============
function StudentsTab({ students, classId, addStudentRemark, getStudentRemarks, isClassTeacher, classTeacherData }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [msgModalVisible, setMsgModalVisible] = useState(false);
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [remark, setRemark] = useState('');

  const openMessageModal = (student) => {
    setSelectedStudent(student);
    setMsgModalVisible(true);
  };

  const openRemarkModal = (student) => {
    setSelectedStudent(student);
    setRemarkModalVisible(true);
  };

  const sendMessage = () => {
    setMsgModalVisible(false);
    setMessage('');
    Alert.alert('Success', `Message sent to ${selectedStudent?.name}'s parent!`);
  };

  const saveRemark = () => {
    if (!remark.trim()) return;
    addStudentRemark(selectedStudent.id, remark);
    setRemarkModalVisible(false);
    setRemark('');
  };

  const StudentCard = ({ student }) => {
    const remarks = getStudentRemarks(student.id);
    return (
      <Card style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentAvatarText}>{student.name?.[0] || '?'}</Text>
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentMeta}>Roll: {student.roll || '-'}</Text>
          </View>
        </View>
        
        {/* Stats Row */}
        <View style={styles.studentStats}>
          <View style={styles.studentStat}>
            <Text style={[styles.studentStatValue, student.attendance < 85 && { color: COLORS.danger }]}>
              {student.attendance || 0}%
            </Text>
            <Text style={styles.studentStatLabel}>Attendance</Text>
          </View>
          <View style={styles.studentStat}>
            <Text style={styles.studentStatValue}>{student.recentMarks || '-'}</Text>
            <Text style={styles.studentStatLabel}>Recent Marks</Text>
          </View>
        </View>

        {/* Remarks */}
        {remarks.length > 0 && (
          <View style={styles.remarksSection}>
            <Text style={styles.remarksTitle}>Recent Remarks</Text>
            {remarks.slice(0, 2).map(r => (
              <Text key={r.id} style={styles.remarkText}>• {r.text}</Text>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.studentActions}>
          <TouchableOpacity style={styles.studentActionBtn} onPress={() => openRemarkModal(student)}>
            <Feather name="edit-3" size={16} color={COLORS.primary} />
            <Text style={styles.studentActionText}>Add Remark</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.studentActionBtn} onPress={() => openMessageModal(student)}>
            <Feather name="message-circle" size={16} color={COLORS.primary} />
            <Text style={styles.studentActionText}>Message Parent</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.scrollContent}>
      {/* Class Teacher Overview */}
      {isClassTeacher && classTeacherData && (
        <Card style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Class Overview</Text>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewStatValue}>{classTeacherData.classStrength}</Text>
              <Text style={styles.overviewStatLabel}>Strength</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewStatValue, { color: COLORS.danger }]}>
                {classTeacherData.lowAttendanceStudents?.length || 0}
              </Text>
              <Text style={styles.overviewStatLabel}>Low Attendance</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewStatValue, { color: COLORS.warning }]}>
                {classTeacherData.feePendingStudents?.length || 0}
              </Text>
              <Text style={styles.overviewStatLabel}>Fee Pending</Text>
            </View>
          </View>
        </Card>
      )}

      {students.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No students in this class</Text>
        </View>
      ) : (
        students.map(student => <StudentCard key={student.id} student={student} />)
      )}

      {/* Message Modal */}
      <Modal visible={msgModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Message Parent</Text>
              <TouchableOpacity onPress={() => setMsgModalVisible(false)}>
                <Feather name="x" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>To: {selectedStudent?.name}'s Parent</Text>
            <TextInput style={[styles.modalInput, { height: 120 }]} placeholder="Type your message..." multiline value={message} onChangeText={setMessage} />
            <Button title="Send Message" onPress={sendMessage} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Remark Modal */}
      <Modal visible={remarkModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Remark</Text>
              <TouchableOpacity onPress={() => setRemarkModalVisible(false)}>
                <Feather name="x" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>For: {selectedStudent?.name}</Text>
            <TextInput style={[styles.modalInput, { height: 100 }]} placeholder="Enter remark..." multiline value={remark} onChangeText={setRemark} />
            <Button title="Save Remark" onPress={saveRemark} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}


// ============ TEACH TAB ============
function TeachTab({ classId, getLessonPlans, addLessonPlan, getHomework, addHomework }) {
  const [activeSection, setActiveSection] = useState('lessons'); // 'lessons' or 'homework'
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const lessonPlans = getLessonPlans(classId);
  const homeworkList = getHomework(classId);

  const handleAddLesson = () => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    addLessonPlan(classId, { title, topic, description, dueDate: dueDate || new Date().toISOString() });
    resetForm();
  };

  const handleAddHomework = () => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    addHomework(classId, { title, description, dueDate: dueDate || new Date().toISOString(), files: [], voiceNote: null });
    resetForm();
  };

  const resetForm = () => {
    setTitle(''); setTopic(''); setDescription(''); setDueDate('');
    setShowForm(false);
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return COLORS.success;
    if (status === 'overdue') return COLORS.danger;
    return COLORS.warning;
  };

  return (
    <ScrollView style={styles.scrollContent}>
      {/* Section Toggle */}
      <View style={styles.sectionToggle}>
        <TouchableOpacity 
          style={[styles.toggleBtn, activeSection === 'lessons' && styles.toggleBtnActive]}
          onPress={() => { setActiveSection('lessons'); setShowForm(false); }}
        >
          <Feather name="book" size={16} color={activeSection === 'lessons' ? COLORS.white : COLORS.gray} />
          <Text style={[styles.toggleText, activeSection === 'lessons' && styles.toggleTextActive]}>Lesson Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, activeSection === 'homework' && styles.toggleBtnActive]}
          onPress={() => { setActiveSection('homework'); setShowForm(false); }}
        >
          <Feather name="file-text" size={16} color={activeSection === 'homework' ? COLORS.white : COLORS.gray} />
          <Text style={[styles.toggleText, activeSection === 'homework' && styles.toggleTextActive]}>Homework</Text>
        </TouchableOpacity>
      </View>

      {/* Add Button */}
      <Button
        title={showForm ? "Cancel" : activeSection === 'lessons' ? "Add Lesson Plan" : "Assign Homework"}
        variant={showForm ? "secondary" : "primary"}
        onPress={() => setShowForm(!showForm)}
        style={{ marginBottom: SPACING.m }}
      />

      {/* Form */}
      {showForm && (
        <Card>
          <TextInput style={styles.input} placeholder="Title *" value={title} onChangeText={setTitle} />
          {activeSection === 'lessons' && (
            <TextInput style={styles.input} placeholder="Topic" value={topic} onChangeText={setTopic} />
          )}
          <TextInput style={[styles.input, styles.textarea]} placeholder="Description" multiline value={description} onChangeText={setDescription} />
          <TextInput style={styles.input} placeholder="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} />
          
          {activeSection === 'homework' && (
            <View style={styles.attachRow}>
              <TouchableOpacity style={styles.attachBtn}>
                <Feather name="paperclip" size={18} color={COLORS.gray} />
                <Text style={styles.attachText}>Attach Files</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachBtn}>
                <Feather name="mic" size={18} color={COLORS.gray} />
                <Text style={styles.attachText}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <Button title="Save" onPress={activeSection === 'lessons' ? handleAddLesson : handleAddHomework} />
        </Card>
      )}

      {/* List */}
      {activeSection === 'lessons' ? (
        lessonPlans.length === 0 ? (
          <View style={styles.emptyContainer}><Text style={styles.emptyText}>No lesson plans yet</Text></View>
        ) : (
          lessonPlans.map(plan => (
            <Card key={plan.id}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{plan.title}</Text>
                  <Text style={styles.cardMeta}>Topic: {plan.topic || 'General'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(plan.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(plan.status) }]}>
                    {plan.status || 'pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardBody}>{plan.description}</Text>
              {plan.dueDate && <Text style={styles.cardDate}>Due: {new Date(plan.dueDate).toLocaleDateString()}</Text>}
            </Card>
          ))
        )
      ) : (
        homeworkList.length === 0 ? (
          <View style={styles.emptyContainer}><Text style={styles.emptyText}>No homework assigned</Text></View>
        ) : (
          homeworkList.map(hw => (
            <Card key={hw.id}>
              <Text style={styles.cardTitle}>{hw.title}</Text>
              <Text style={styles.cardBody}>{hw.description}</Text>
              {hw.dueDate && <Text style={styles.cardDate}>Due: {new Date(hw.dueDate).toLocaleDateString()}</Text>}
              {hw.files?.length > 0 && (
                <View style={styles.filesRow}>
                  <Feather name="paperclip" size={14} color={COLORS.gray} />
                  <Text style={styles.filesText}>{hw.files.length} file(s) attached</Text>
                </View>
              )}
            </Card>
          ))
        )
      )}
    </ScrollView>
  );
}

// ============ ASSESS TAB ============
function AssessTab({ classId, students, getTests, addTest, addMarks, getMarks, getLessonPlans }) {
  const [showForm, setShowForm] = useState(false);
  const [marksModal, setMarksModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [enteredMarks, setEnteredMarks] = useState({});
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMarks, setMaxMarks] = useState('');
  const [selectedLessons, setSelectedLessons] = useState([]);

  const tests = getTests(classId);
  const lessonPlans = getLessonPlans(classId);

  const createTest = () => {
    if (!name.trim()) return Alert.alert('Error', 'Test name is required');
    addTest(classId, { name, description, maxMarks: parseInt(maxMarks) || 100, date: new Date().toISOString(), lessons: selectedLessons });
    setName(''); setDescription(''); setMaxMarks(''); setSelectedLessons([]);
    setShowForm(false);
  };

  const openMarksSheet = (test) => {
    setSelectedTest(test);
    const savedMarks = getMarks(test.id);
    setEnteredMarks(savedMarks || {});
    setMarksModal(true);
  };

  const handleMarkChange = (studentId, value) => {
    setEnteredMarks(prev => ({ ...prev, [studentId]: value }));
  };

  const saveMarks = () => {
    addMarks(selectedTest.id, enteredMarks);
    setMarksModal(false);
  };

  const toggleLesson = (lessonTitle) => {
    setSelectedLessons(prev => 
      prev.includes(lessonTitle) 
        ? prev.filter(l => l !== lessonTitle)
        : [...prev, lessonTitle]
    );
  };

  return (
    <ScrollView style={styles.scrollContent}>
      <Button
        title={showForm ? "Cancel" : "Create New Test"}
        variant={showForm ? "secondary" : "primary"}
        onPress={() => setShowForm(!showForm)}
        style={{ marginBottom: SPACING.m }}
      />

      {showForm && (
        <Card>
          <TextInput style={styles.input} placeholder="Test Name *" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
          <TextInput style={styles.input} placeholder="Max Marks" keyboardType="numeric" value={maxMarks} onChangeText={setMaxMarks} />
          
          {lessonPlans.length > 0 && (
            <View style={styles.lessonSelector}>
              <Text style={styles.lessonSelectorTitle}>Link to Lessons (optional)</Text>
              <View style={styles.lessonChips}>
                {lessonPlans.map(lp => (
                  <TouchableOpacity 
                    key={lp.id} 
                    style={[styles.lessonChip, selectedLessons.includes(lp.title) && styles.lessonChipActive]}
                    onPress={() => toggleLesson(lp.title)}
                  >
                    <Text style={[styles.lessonChipText, selectedLessons.includes(lp.title) && styles.lessonChipTextActive]}>
                      {lp.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          <Button title="Create Test" onPress={createTest} />
        </Card>
      )}

      {tests.length === 0 ? (
        <View style={styles.emptyContainer}><Text style={styles.emptyText}>No tests created</Text></View>
      ) : (
        tests.map(test => {
          const testMarks = getMarks(test.id);
          const hasMarks = Object.keys(testMarks).length > 0;
          return (
            <Card key={test.id}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{test.name}</Text>
                  <Text style={styles.cardMeta}>Max Marks: {test.maxMarks}</Text>
                  {test.lessons?.length > 0 && (
                    <Text style={styles.cardMeta}>Lessons: {test.lessons.join(', ')}</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.enterMarksBtn} onPress={() => openMarksSheet(test)}>
                  <Text style={styles.enterMarksText}>{hasMarks ? 'View Marks' : 'Enter Marks'}</Text>
                  <Feather name="chevron-right" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </Card>
          );
        })
      )}

      {/* Enter Marks Modal */}
      <Modal visible={marksModal} animationType="slide">
        <SafeAreaView style={styles.fullscreenModal}>
          <View style={styles.fullscreenHeader}>
            <TouchableOpacity onPress={() => setMarksModal(false)} style={styles.backBtn}>
              <Feather name="x" size={24} color={COLORS.dark} />
            </TouchableOpacity>
            <Text style={styles.fullscreenTitle}>{selectedTest?.name}</Text>
            <View style={{ width: 24 }} />
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Text style={styles.marksSubtitle}>Max Marks: {selectedTest?.maxMarks}</Text>
              {students.map(student => (
                <View key={student.id} style={styles.marksRow}>
                  <View style={styles.marksStudentInfo}>
                    <Text style={styles.marksName}>{student.name}</Text>
                    <Text style={styles.marksRoll}>Roll {student.roll}</Text>
                  </View>
                  <TextInput
                    style={styles.marksInput}
                    placeholder="0"
                    keyboardType="numeric"
                    maxLength={3}
                    value={enteredMarks[student.id] || ''}
                    onChangeText={(val) => handleMarkChange(student.id, val)}
                  />
                </View>
              ))}
              <Button title="Save Marks" onPress={saveMarks} style={{ marginTop: SPACING.xl, marginBottom: SPACING.xl }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

// ============ ANNOUNCE TAB ============
function AnnounceTab({ classId, students, getAnnouncements, addAnnouncement }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudents, setSelectedStudents] = useState('all');
  const announcements = getAnnouncements(classId);

  const handleAdd = () => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    addAnnouncement(classId, { title, description, students: selectedStudents, voiceNote: null });
    setTitle(''); setDescription(''); setSelectedStudents('all');
    setShowForm(false);
  };

  return (
    <ScrollView style={styles.scrollContent}>
      <Button
        title={showForm ? "Cancel" : "Post Announcement"}
        variant={showForm ? "secondary" : "primary"}
        onPress={() => setShowForm(!showForm)}
        style={{ marginBottom: SPACING.m }}
      />

      {showForm && (
        <Card>
          <TextInput style={styles.input} placeholder="Title *" value={title} onChangeText={setTitle} />
          <TextInput style={[styles.input, styles.textarea]} placeholder="Description" multiline value={description} onChangeText={setDescription} />
          
          <View style={styles.recipientSelector}>
            <Text style={styles.recipientTitle}>Send to:</Text>
            <View style={styles.recipientOptions}>
              <TouchableOpacity 
                style={[styles.recipientOption, selectedStudents === 'all' && styles.recipientOptionActive]}
                onPress={() => setSelectedStudents('all')}
              >
                <Text style={[styles.recipientText, selectedStudents === 'all' && styles.recipientTextActive]}>All Students</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.recipientOption, selectedStudents === 'select' && styles.recipientOptionActive]}
                onPress={() => setSelectedStudents('select')}
              >
                <Text style={[styles.recipientText, selectedStudents === 'select' && styles.recipientTextActive]}>Select</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.attachRow}>
            <TouchableOpacity style={styles.attachBtn}>
              <Feather name="mic" size={18} color={COLORS.gray} />
              <Text style={styles.attachText}>Add Voice Note</Text>
            </TouchableOpacity>
          </View>
          
          <Button title="Post Now" onPress={handleAdd} />
        </Card>
      )}

      {announcements.length === 0 ? (
        <View style={styles.emptyContainer}><Text style={styles.emptyText}>No announcements yet</Text></View>
      ) : (
        announcements.map(ann => (
          <Card key={ann.id}>
            <View style={styles.announcementHeader}>
              <View style={styles.announcementIcon}>
                <Feather name="bell" size={18} color={COLORS.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{ann.title}</Text>
                <Text style={styles.cardMeta}>{new Date(ann.date).toLocaleDateString()}</Text>
              </View>
            </View>
            <Text style={styles.cardBody}>{ann.description}</Text>
            <Text style={styles.recipientInfo}>Sent to: {ann.students === 'all' ? 'All Students' : 'Selected Students'}</Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { padding: SPACING.m },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyText: { color: COLORS.gray, fontSize: 15 },

  // Pending Actions
  pendingActionsBar: { backgroundColor: '#FEF3C7', paddingHorizontal: SPACING.m, paddingVertical: SPACING.s },
  pendingActionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  pendingActionText: { fontSize: 13, color: COLORS.warning, fontWeight: '500', marginLeft: SPACING.s },

  // Summary Card
  summaryCard: { marginBottom: SPACING.m },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: SPACING.s },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: '800', color: COLORS.dark },
  summaryLabel: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  summaryDivider: { width: 1, height: 40, backgroundColor: COLORS.lightGray },

  // Info Banner
  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', padding: SPACING.m, borderRadius: 10, marginBottom: SPACING.m },
  infoBannerText: { fontSize: 13, color: COLORS.blue, marginLeft: SPACING.s },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '31%', aspectRatio: 0.9, backgroundColor: COLORS.white, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.s, borderWidth: 2 },
  gridItemPresent: { borderColor: COLORS.success, backgroundColor: '#F0FDF4' },
  gridItemAbsent: { borderColor: COLORS.danger, backgroundColor: '#FEF2F2' },
  gridName: { marginTop: SPACING.s, fontSize: 12, fontWeight: '600', color: COLORS.dark },
  gridRoll: { fontSize: 10, color: COLORS.gray },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center' },
  avatarAbsent: { backgroundColor: COLORS.danger },
  avatarTextSmall: { fontSize: 16, fontWeight: '700', color: COLORS.white },

  footerAction: { marginTop: SPACING.l, paddingBottom: SPACING.xl },

  // Student Card
  studentCard: { marginBottom: SPACING.m },
  studentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m },
  studentAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  studentInfo: { flex: 1, marginLeft: SPACING.m },
  studentName: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  studentMeta: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  studentStats: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 10, padding: SPACING.m, marginBottom: SPACING.m },
  studentStat: { flex: 1, alignItems: 'center' },
  studentStatValue: { fontSize: 18, fontWeight: '700', color: COLORS.dark },
  studentStatLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  remarksSection: { marginBottom: SPACING.m },
  remarksTitle: { fontSize: 12, fontWeight: '600', color: COLORS.gray, marginBottom: 4 },
  remarkText: { fontSize: 13, color: COLORS.dark, marginTop: 2 },
  studentActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingTop: SPACING.m },
  studentActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  studentActionText: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginLeft: 6 },

  // Overview Card
  overviewCard: { marginBottom: SPACING.m, backgroundColor: COLORS.primaryLight },
  overviewTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.m },
  overviewStats: { flexDirection: 'row' },
  overviewStat: { flex: 1, alignItems: 'center' },
  overviewStatValue: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  overviewStatLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2 },

  // Section Toggle
  sectionToggle: { flexDirection: 'row', backgroundColor: COLORS.lightGray, borderRadius: 10, padding: 4, marginBottom: SPACING.m },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: COLORS.primary },
  toggleText: { fontSize: 13, fontWeight: '600', color: COLORS.gray, marginLeft: 6 },
  toggleTextActive: { color: COLORS.white },

  // Form
  input: { borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 10, padding: SPACING.m, fontSize: 15, marginBottom: SPACING.m, backgroundColor: COLORS.white },
  textarea: { height: 100, textAlignVertical: 'top' },
  attachRow: { flexDirection: 'row', marginBottom: SPACING.m, gap: SPACING.m },
  attachBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.m, borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 10, borderStyle: 'dashed' },
  attachText: { fontSize: 13, color: COLORS.gray, marginLeft: 6 },

  // Card Content
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  cardMeta: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  cardBody: { fontSize: 14, color: COLORS.gray, marginTop: SPACING.s, lineHeight: 20 },
  cardDate: { fontSize: 12, color: COLORS.primary, marginTop: SPACING.s, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  filesRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.s },
  filesText: { fontSize: 12, color: COLORS.gray, marginLeft: 4 },

  // Lesson Selector
  lessonSelector: { marginBottom: SPACING.m },
  lessonSelectorTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gray, marginBottom: SPACING.s },
  lessonChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s },
  lessonChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.lightGray },
  lessonChipActive: { backgroundColor: COLORS.primary },
  lessonChipText: { fontSize: 12, color: COLORS.gray },
  lessonChipTextActive: { color: COLORS.white },

  // Enter Marks
  enterMarksBtn: { flexDirection: 'row', alignItems: 'center' },
  enterMarksText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  // Recipient Selector
  recipientSelector: { marginBottom: SPACING.m },
  recipientTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gray, marginBottom: SPACING.s },
  recipientOptions: { flexDirection: 'row', gap: SPACING.s },
  recipientOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: COLORS.lightGray },
  recipientOptionActive: { backgroundColor: COLORS.primary },
  recipientText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  recipientTextActive: { color: COLORS.white },
  recipientInfo: { fontSize: 12, color: COLORS.gray, marginTop: SPACING.s, fontStyle: 'italic' },

  // Announcement
  announcementHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.s },
  announcementIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.l, minHeight: 300 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.dark },
  modalSubtitle: { fontSize: 14, color: COLORS.gray, marginBottom: SPACING.m },
  modalInput: { borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 12, padding: SPACING.m, fontSize: 15, marginBottom: SPACING.m, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', marginTop: SPACING.s },

  // Fullscreen Modal
  fullscreenModal: { flex: 1, backgroundColor: COLORS.white },
  fullscreenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.m, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  fullscreenTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark },
  backBtn: { padding: SPACING.s },
  marksSubtitle: { fontSize: 14, color: COLORS.gray, marginBottom: SPACING.m },
  marksRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.m, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  marksStudentInfo: { flex: 1 },
  marksName: { fontSize: 15, fontWeight: '600', color: COLORS.dark },
  marksRoll: { fontSize: 12, color: COLORS.gray },
  marksInput: { borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: SPACING.s, width: 70, textAlign: 'center', fontSize: 16, fontWeight: '600' },
});
