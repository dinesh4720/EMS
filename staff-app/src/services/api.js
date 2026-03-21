// API Service for Staff App
// Connects to the school dashboard backend

import config from '../config';

const API_URL = config.API_URL;

// Callback to trigger logout on 401 – set by AuthContext after mount
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

// Helper function for API requests
const request = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;

  const reqConfig = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = await getAuthToken();
  if (token) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, reqConfig);

    // Handle 401 – session expired or token invalid
    if (response.status === 401) {
      console.warn('[API] 401 Unauthorized – clearing session');
      await removeAuthToken();
      await removeUserData();
      if (onUnauthorized) onUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};

// Auth token management using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@staff_app_token';
const USER_DATA_KEY = '@staff_app_user';

export const saveAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const removeAuthToken = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const removeUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    console.error('Error removing user data:', error);
  }
};

// Auth API
export const authApi = {
  login: async (email, password) => {
    const response = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Save token and user data if login successful
    if (response && response.id) {
      await saveAuthToken(response.token || 'authenticated');
      await saveUserData(response);
    }

    return response;
  },

  // Validate if stored session is still valid (user exists and is active)
  validateSession: async (staffId) => {
    try {
      const response = await request(`/staff/validate/${staffId}`);
      return response;
    } catch (error) {
      console.error('Session validation failed:', error);
      return { valid: false, reason: error.message || 'Validation failed' };
    }
  },

  // Login with phone
  loginWithPhone: async (phone, password) => {
    const response = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });

    // Save token and user data if login successful
    if (response && response.id) {
      await saveAuthToken(response.token || 'authenticated');
      await saveUserData(response);
    }

    return response;
  },

  logout: async () => {
    await removeAuthToken();
    await removeUserData();
  },

  getCurrentUser: async () => {
    return await getUserData();
  },
};

// Staff API
export const staffApi = {
  // Get own profile (self-service)
  getMyProfile: async () => {
    return await request('/staff/me');
  },

  // Get staff profile by ID (requires permission)
  getProfile: async (staffId) => {
    return await request(`/staff/${staffId}`);
  },

  // Update staff profile (admin only - requires permission)
  updateProfile: async (staffId, data) => {
    return await request(`/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Update own profile (self-service)
  updateMyProfile: async (data) => {
    // Get current user ID from stored data
    const userData = await getUserData();
    if (!userData || !userData.id) {
      throw new Error('User not found');
    }
    return await request(`/staff/${userData.id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Update staff credentials (password - requires admin)
  updateCredentials: async (staffId, data) => {
    return await request(`/staff/${staffId}/credentials`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Change own password (staff self-service)
  changePassword: async (staffId, currentPassword, newPassword) => {
    return await request(`/staff/${staffId}/change-password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Get today's timetable for a staff member
  getTodayTimetable: async (staffId) => {
    return await request(`/staff/${staffId}/timetable/today`);
  },

  // Get weekly timetable for a staff member
  getWeeklyTimetable: async (staffId) => {
    return await request(`/staff/${staffId}/timetable/week`);
  },

  // Get staff attendance
  getAttendance: async (staffId, month, year) => {
    return await request(`/staff/${staffId}/attendance?month=${month}&year=${year}`);
  },

  // Mark attendance for a class
  markClassAttendance: async (classId, date, attendanceData) => {
    return await request('/attendance/class', {
      method: 'POST',
      body: JSON.stringify({ classId, date, attendance: attendanceData }),
    });
  },
};

// Staff Attendance API (for self-attendance marking)
export const attendanceApi = {
  getTodayAttendance: async (staffId) => {
    const today = new Date().toISOString().split('T')[0];
    return await request(`/staff-attendance/staff/${staffId}/today`);
  },

  getAttendanceHistory: async (staffId, startDate, endDate) => {
    return await request(`/staff-attendance/staff/${staffId}?startDate=${startDate}&endDate=${endDate}`);
  },

  getMonthlySummary: async (staffId, month, year) => {
    return await request(`/staff-attendance/summary/${staffId}?month=${month}&year=${year}`);
  },

  markAttendance: async (staffId, status, reason = '', location = null) => {
    return await request('/staff-attendance/mobile/mark', {
      method: 'POST',
      body: JSON.stringify({ staffId, status, reason, location }),
    });
  },

  checkIn: async (staffId, location = null) => {
    return await request('/staff-attendance/mobile/checkin', {
      method: 'POST',
      body: JSON.stringify({ staffId, location }),
    });
  },

  checkOut: async (staffId, location = null) => {
    return await request('/staff-attendance/mobile/checkout', {
      method: 'POST',
      body: JSON.stringify({ staffId, location }),
    });
  },

  applyLeave: async (staffId, leaveData) => {
    return await request('/staff-attendance/mobile/leave/apply', {
      method: 'POST',
      body: JSON.stringify({ staffId, ...leaveData }),
    });
  },
};

// Classes API
export const classesApi = {
  // Get class details
  getClassDetails: async (classId) => {
    return await request(`/classes/${classId}`);
  },

  // Get students in a class
  getClassStudents: async (classId) => {
    return await request(`/classes/${classId}/students`);
  },

  // Get classes assigned to a staff member
  getStaffClasses: async (staffId) => {
    return await request(`/staff/${staffId}/classes`);
  },

  // Get attendance for a class on a specific date
  getClassAttendance: async (classId, date) => {
    return await request(`/attendance/${classId}/${date}`);
  },

  // Mark bulk attendance for a class
  markAttendance: async (classId, date, attendanceData) => {
    return await request('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({ classId, date, attendance: attendanceData }),
    });
  },

  // Get attendance history for a class
  getAttendanceHistory: async (classId, startDate, endDate) => {
    return await request(`/attendance/history/${classId}?start=${startDate}&end=${endDate}`);
  },

  // Get student attendance history
  getStudentAttendanceHistory: async (studentId, startDate, endDate) => {
    return await request(`/attendance/student/${studentId}?start=${startDate}&end=${endDate}`);
  },
};

// Attendance Status Constants
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
};

// Attendance Status Colors
export const ATTENDANCE_COLORS = {
  present: '#34C759',  // Green
  absent: '#FF3B30',   // Red
  late: '#FF9500',     // Orange
  excused: '#007AFF',  // Blue
  pending: '#8E8E93',  // Gray
};

// === EXAMS API ===
export const examsApi = {
  // Get all exams with filters
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/exams${query ? `?${query}` : ''}`);
  },

  // Get exam by ID
  getById: async (examId) => {
    return await request(`/exams/${examId}`);
  },

  // Get exams for staff's classes
  getByStaff: async (staffId) => {
    return await request(`/exams/staff/${staffId}`);
  },

  // Get exams for a class
  getByClass: async (classId) => {
    return await request(`/exams/class/${classId}`);
  },

  // Get upcoming exams for staff's classes
  getUpcoming: async (staffId, days = 30) => {
    return await request(`/exams/upcoming/${staffId}?days=${days}`);
  },

  // Get results for an exam
  getResults: async (examId) => {
    return await request(`/exams/${examId}/results`);
  },

  // Create exam
  create: async (examData) => {
    return await request('/exams', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  },

  // Create exam with empty results for all students
  createWithResults: async (examData) => {
    return await request('/exams/create-with-results', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  },

  // Update exam
  update: async (examId, examData) => {
    return await request(`/exams/${examId}`, {
      method: 'PUT',
      body: JSON.stringify(examData),
    });
  },

  // Delete exam
  delete: async (examId) => {
    return await request(`/exams/${examId}`, {
      method: 'DELETE',
    });
  },

  // Publish results
  publish: async (examId) => {
    return await request(`/exams/${examId}/publish`, {
      method: 'PUT',
    });
  },
};

// === RESULTS API ===
export const resultsApi = {
  // Create single result
  create: async (resultData) => {
    return await request('/results', {
      method: 'POST',
      body: JSON.stringify(resultData),
    });
  },

  // Bulk create/update results
  bulkCreate: async (data) => {
    return await request('/results/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update result
  update: async (resultId, resultData) => {
    return await request(`/results/${resultId}`, {
      method: 'PUT',
      body: JSON.stringify(resultData),
    });
  },

  // Get student's results
  getByStudent: async (studentId) => {
    return await request(`/results/student/${studentId}`);
  },

  // Get class results for exam
  getByClassExam: async (classId, examId) => {
    return await request(`/results/class/${classId}/exam/${examId}`);
  },
};

// === SUBJECTS API ===
export const subjectsApi = {
  getAll: async () => {
    return await request('/subjects');
  },

  create: async (subjectData) => {
    return await request('/subjects', {
      method: 'POST',
      body: JSON.stringify(subjectData),
    });
  },
};

// === PAYSLIPS API ===
export const payslipsApi = {
  // Get all payslips for a staff member
  getStaffPayslips: async (employeeId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/payslips/staff/${employeeId}${query ? `?${query}` : ''}`);
  },

  // Get single payslip by ID
  getById: async (payslipId) => {
    return await request(`/payslips/${payslipId}`);
  },

  // Get payslip summary for current year
  getSummary: async (employeeId) => {
    return await request(`/payslips/staff/${employeeId}/summary`);
  },
};

// === LEAVES API ===
export const leavesApi = {
  // Get all leaves for a teacher
  getTeacherLeaves: async (teacherId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/teacher-leaves/teacher/${teacherId}${query ? `?${query}` : ''}`);
  },

  // Get leave by ID
  getById: async (leaveId) => {
    return await request(`/teacher-leaves/${leaveId}`);
  },

  // Apply for leave
  apply: async (leaveData) => {
    return await request('/teacher-leaves', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    });
  },

  // Cancel leave
  cancel: async (leaveId) => {
    return await request(`/teacher-leaves/${leaveId}/cancel`, {
      method: 'PUT',
    });
  },

  // Get leave statistics
  getStats: async (teacherId, year) => {
    return await request(`/teacher-leaves/teacher/${teacherId}/stats?year=${year}`);
  },
};

// === REMARKS API ===
export const remarksApi = {
  // Get remarks for a student
  getStudentRemarks: async (studentId, category = null) => {
    const query = category ? `?category=${category}` : '';
    return await request(`/students/${studentId}/remarks${query}`);
  },

  // Create remark for a student
  create: async (studentId, remarkData) => {
    return await request(`/students/${studentId}/remarks`, {
      method: 'POST',
      body: JSON.stringify(remarkData),
    });
  },
};

// Upload API for photos and files
export const uploadApi = {
  uploadFile: async (file, type = 'image') => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'photo.jpg',
    });

    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }
    return await response.json();
  },

  uploadImage: async (imageUri) => {
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    });

    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }
    return await response.json();
  },
};

export default {
  auth: authApi,
  staff: staffApi,
  classes: classesApi,
  attendance: attendanceApi,
  exams: examsApi,
  results: resultsApi,
  subjects: subjectsApi,
  payslips: payslipsApi,
  leaves: leavesApi,
  remarks: remarksApi,
  upload: uploadApi,
};
