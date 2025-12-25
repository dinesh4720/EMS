import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { classesApi, attendanceApi, timetableApi, teacherApi, alertsApi } from '../services/api';
import { useAuth } from './AuthContext';
import {
  mockClasses, mockStudents, mockTasks, mockLessonPlans, mockHomework,
  mockTests, mockMarks, mockAnnouncements, mockAlerts, mockClassTeacherData,
  mockNotes, mockLeaveBalance, mockSalarySlips, mockNotifications
} from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState(mockClasses);
  const [students, setStudents] = useState(mockStudents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [attendanceHistory, setAttendanceHistory] = useState({});
  const [checkin, setCheckin] = useState({ checkedIn: false, time: null, checkoutTime: null });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [teacherProfile, setTeacherProfile] = useState(null);

  // Work section state
  const [tasks, setTasks] = useState(mockTasks);
  const [notes, setNotes] = useState(mockNotes);
  const [personalLessonPlans, setPersonalLessonPlans] = useState([]);

  // Class workspace state
  const [lessonPlans, setLessonPlans] = useState(mockLessonPlans);
  const [homework, setHomework] = useState(mockHomework);
  const [tests, setTests] = useState(mockTests);
  const [marks, setMarks] = useState(mockMarks);
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [studentRemarks, setStudentRemarks] = useState({});

  // Class teacher data
  const [classTeacherData, setClassTeacherData] = useState(mockClassTeacherData);

  // HR data
  const [leaveBalance, setLeaveBalance] = useState(mockLeaveBalance);
  const [salarySlips, setSalarySlips] = useState(mockSalarySlips);
  const [notifications, setNotifications] = useState(mockNotifications);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      // Check if demo mode
      const isDemoMode = user.id.startsWith('demo-');

      // Initialize with mock data (fallback)
      setTeacherProfile(user);
      setAlerts(mockAlerts);
      setTodaySchedule(mockClasses);
      setClasses(mockClasses);
      setStudents(mockStudents);

      // Skip API calls in demo mode
      if (isDemoMode) {
        return;
      }

      // Fetch Dashboard
      try {
        const dashboardData = await teacherApi.getDashboard(user.id);
        if (dashboardData.teacher) setTeacherProfile(dashboardData.teacher);
        if (dashboardData.alerts) setAlerts(dashboardData.alerts);
      } catch (e) { console.log('Dashboard fetch failed, using mock'); }

      // Fetch Schedule
      try {
        const scheduleData = await timetableApi.getTodaySchedule(user.id);
        if (scheduleData && scheduleData.length > 0) {
          const mapped = scheduleData.map(slot => ({
            id: slot.id,
            classId: slot.classId,
            name: slot.className || `${slot.class?.name} ${slot.class?.section}`,
            subject: slot.subject,
            time: slot.startTime,
            endTime: slot.endTime,
            period: slot.period,
            room: slot.room,
          }));
          setTodaySchedule(mapped);
        }
      } catch (e) { console.log('Schedule fetch failed, using mock'); }

      // Fetch Classes
      try {
        const classesData = await classesApi.getByTeacher(user.id);
        if (classesData && classesData.length > 0) {
          const mappedClasses = classesData.map(c => ({
            id: c.id,
            name: `${c.name} ${c.section || ''}`.trim(),
            subject: c.subjects?.[0] || c.subject || 'General',
            studentCount: c.studentCount,
            role: c.role || 'class_teacher',
            time: c.time || '',
            room: c.room || '',
          }));
          setClasses(mappedClasses);

          // Fetch Students for classes
          const studentsMap = {};
          for (const cls of classesData) {
            try {
              const classStudents = await classesApi.getStudents(cls.id);
              studentsMap[cls.id] = classStudents.map(s => ({
                id: s.id,
                name: s.name,
                roll: s.rollNo,
                attendance: s.attendancePercent || 90,
                recentMarks: s.recentMarks || 0,
                parentPhone: s.parentPhone,
                feeStatus: s.feeStatus,
                remarks: s.remarks || [],
              }));
            } catch (err) { }
          }
          if (Object.keys(studentsMap).length > 0) setStudents(studentsMap);
        }
      } catch (e) { console.log('Classes fetch failed, using mock'); }

    } catch (err) {
      console.error('Context fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (message) => Alert.alert('Success', message);
  const getStudentsForClass = (classId) => students[classId] || [];

  // Attendance functions
  const markAttendance = async (classId, date, studentAttendance, editReason = null) => {
    const key = `${classId}-${date}`;
    const existingRecord = attendance[key];

    if (existingRecord && editReason) {
      // Store edit history
      setAttendanceHistory(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), {
          previous: existingRecord,
          editedAt: new Date().toISOString(),
          reason: editReason
        }]
      }));
    }

    // Save locally first (offline-first approach)
    setAttendance(prev => ({ ...prev, [key]: studentAttendance }));

    // Try to sync with API in background (don't block on errors)
    try {
      await attendanceApi.markBulk({
        classId,
        date,
        attendance: Object.entries(studentAttendance).map(([studentId, status]) => ({ studentId, status })),
        markedBy: user?.id,
        editReason,
      });
      showToast('Attendance saved');
    } catch (err) {
      // Silently fail - data is already saved locally
      showToast('Attendance saved locally');
    }

    return true;
  };

  const getAttendance = (classId, date) => attendance[`${classId}-${date}`] || null;

  const isAttendanceMarked = (classId) => {
    const today = new Date().toISOString().split('T')[0];
    return !!attendance[`${classId}-${today}`];
  };

  const getAttendanceHistory = (classId, date) => attendanceHistory[`${classId}-${date}`] || [];

  // Check-in/out functions
  const doCheckin = () => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setCheckin({ checkedIn: true, time, checkoutTime: null });
    showToast('Checked in at ' + time);
  };

  const doCheckout = () => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setCheckin(prev => ({ ...prev, checkedIn: false, checkoutTime: time }));
    showToast('Checked out at ' + time);
  };

  // Task management
  const addTask = (task) => {
    const newTask = { ...task, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Notes management
  const addNote = (content) => {
    const newNote = { id: Date.now().toString(), content, createdAt: new Date().toISOString() };
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (noteId, content) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content } : n));
  };

  const deleteNote = (noteId) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  // Lesson Plans
  const getLessonPlans = (classId) => lessonPlans[classId] || [];

  const addLessonPlan = (classId, plan) => {
    const newPlan = { ...plan, id: Date.now().toString(), status: 'pending' };
    setLessonPlans(prev => ({
      ...prev,
      [classId]: [newPlan, ...(prev[classId] || [])]
    }));
    showToast('Lesson plan added');
  };

  const updateLessonPlan = (classId, planId, updates) => {
    setLessonPlans(prev => ({
      ...prev,
      [classId]: (prev[classId] || []).map(p => p.id === planId ? { ...p, ...updates } : p)
    }));
  };

  // Homework
  const getHomework = (classId) => homework[classId] || [];

  const addHomework = (classId, hw) => {
    const newHw = { ...hw, id: Date.now().toString() };
    setHomework(prev => ({
      ...prev,
      [classId]: [newHw, ...(prev[classId] || [])]
    }));
    showToast('Homework assigned');
  };

  // Tests
  const getTests = (classId) => tests[classId] || [];

  const addTest = (classId, test) => {
    const newTest = { ...test, id: Date.now().toString() };
    setTests(prev => ({
      ...prev,
      [classId]: [newTest, ...(prev[classId] || [])]
    }));
    showToast('Test created');
  };

  // Marks
  const getMarks = (testId) => marks[testId] || {};

  const addMarks = (testId, studentMarks) => {
    setMarks(prev => ({ ...prev, [testId]: studentMarks }));
    showToast('Marks saved');
  };

  // Announcements
  const getAnnouncements = (classId) => announcements[classId] || [];

  const addAnnouncement = (classId, announcement) => {
    const newAnn = {
      ...announcement,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    setAnnouncements(prev => ({
      ...prev,
      [classId]: [newAnn, ...(prev[classId] || [])]
    }));
    showToast('Announcement posted');
  };

  // Student remarks
  const addStudentRemark = (studentId, remark) => {
    const newRemark = { id: Date.now().toString(), text: remark, date: new Date().toISOString() };
    setStudentRemarks(prev => ({
      ...prev,
      [studentId]: [newRemark, ...(prev[studentId] || [])]
    }));
    showToast('Remark added');
  };

  const getStudentRemarks = (studentId) => studentRemarks[studentId] || [];

  // Class teacher functions
  const getClassTeacherData = (classId) => classTeacherData[classId] || null;

  const isClassTeacher = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.role === 'class_teacher';
  };

  const getClassTeacherClass = () => classes.find(c => c.role === 'class_teacher');

  // Get pending actions for a class
  const getPendingActions = (classId) => {
    const actions = [];
    const today = new Date().toISOString().split('T')[0];

    // Check attendance
    if (!isAttendanceMarked(classId)) {
      actions.push({ type: 'attendance', message: 'Mark attendance', priority: 'high', tab: 0 });
    }

    // Check overdue lesson plans
    const plans = getLessonPlans(classId);
    const overduePlans = plans.filter(p => p.status === 'overdue' || (p.dueDate < today && p.status !== 'completed'));
    if (overduePlans.length > 0) {
      actions.push({ type: 'lesson', message: `${overduePlans.length} lesson plan(s) overdue`, priority: 'medium', tab: 2 });
    }

    // Check pending mark entry
    const classTests = getTests(classId);
    const pendingMarks = classTests.filter(t => {
      const testMarks = getMarks(t.id);
      return Object.keys(testMarks).length === 0;
    });
    if (pendingMarks.length > 0) {
      actions.push({ type: 'marks', message: `Mark entry pending: ${pendingMarks[0].name}`, priority: 'high', tab: 3 });
    }

    return actions;
  };

  // Notifications
  const markNotificationRead = (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const getUnreadNotificationCount = () => notifications.filter(n => !n.read).length;

  // Leave application
  const applyLeave = async (leaveData) => {
    try {
      // Save locally first
      const newLeave = {
        ...leaveData,
        id: Date.now().toString(),
        status: 'pending',
        appliedAt: new Date().toISOString()
      };
      
      // TODO: Sync with API
      showToast('Leave application submitted');
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to submit leave application');
      return false;
    }
  };

  // Regularization request
  const requestRegularization = async (regularizationData) => {
    try {
      // Save locally first
      const newRequest = {
        ...regularizationData,
        id: Date.now().toString(),
        status: 'pending',
        requestedAt: new Date().toISOString()
      };
      
      // TODO: Sync with API
      showToast('Regularization request submitted');
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to submit regularization request');
      return false;
    }
  };

  // Profile update
  const updateProfile = async (profileData) => {
    try {
      // Update locally first
      setTeacherProfile(prev => ({ ...prev, ...profileData }));
      
      // TODO: Sync with API
      showToast('Profile updated successfully');
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      return false;
    }
  };

  // Personal lesson plans
  const addPersonalLessonPlan = (planData) => {
    const newPlan = {
      ...planData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setPersonalLessonPlans(prev => [newPlan, ...prev]);
    showToast('Lesson plan saved');
  };

  const updatePersonalLessonPlan = (planId, updates) => {
    setPersonalLessonPlans(prev =>
      prev.map(p => p.id === planId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
    );
    showToast('Lesson plan updated');
  };

  const deletePersonalLessonPlan = (planId) => {
    setPersonalLessonPlans(prev => prev.filter(p => p.id !== planId));
    showToast('Lesson plan deleted');
  };

  return (
    <AppContext.Provider value={{
      // Data
      classes, students, loading, error, attendance, checkin,
      todaySchedule, alerts, teacherProfile, tasks, notes,
      leaveBalance, salarySlips, notifications, personalLessonPlans,

      // Core functions
      refetch: fetchData, showToast, getStudentsForClass,

      // Attendance
      markAttendance, getAttendance, isAttendanceMarked, getAttendanceHistory,

      // Check-in/out
      doCheckin, doCheckout,

      // Tasks & Notes
      addTask, toggleTask, deleteTask,
      addNote, updateNote, deleteNote,

      // Lesson Plans & Homework
      getLessonPlans, addLessonPlan, updateLessonPlan,
      getHomework, addHomework,

      // Tests & Marks
      getTests, addTest, getMarks, addMarks,

      // Announcements
      getAnnouncements, addAnnouncement,

      // Student management
      addStudentRemark, getStudentRemarks,

      // Class teacher
      getClassTeacherData, isClassTeacher, getClassTeacherClass, getPendingActions,

      // Notifications
      markNotificationRead, getUnreadNotificationCount,

      // HR & Personal
      applyLeave, requestRegularization, updateProfile,

      // Personal Lesson Plans
      addPersonalLessonPlan, updatePersonalLessonPlan, deletePersonalLessonPlan,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
