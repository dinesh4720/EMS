import { API_URL } from '../config';

async function request(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers 
      },
      signal: controller.signal,
      ...options,
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json().catch(() => ({ error: 'Invalid response' }));
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('API unavailable');
    }
    throw err;
  }
}

// Auth API
export const authApi = {
  login: (phone, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  }),
};

// Classes API
export const classesApi = {
  getByTeacher: (teacherId) => request(`/classes?teacherId=${teacherId}`),
  getById: (id) => request(`/classes/${id}`),
  getStudents: (id) => request(`/classes/${id}/students`),
};

// Students API
export const studentsApi = {
  getByClass: (classId) => request(`/students?classId=${classId}`),
  getById: (id) => request(`/students/${id}`),
};

// Attendance API
export const attendanceApi = {
  markBulk: (data) => request('/attendance/bulk', { method: 'POST', body: JSON.stringify(data) }),
  getByClassDate: (classId, date) => request(`/attendance/${classId}/${date}`),
};

// Timetable API
export const timetableApi = {
  getByTeacher: (teacherId) => request(`/timetable/teacher/${teacherId}`),
  getTodaySchedule: (teacherId) => request(`/timetable/teacher/${teacherId}/today`),
};

// Teacher API
export const teacherApi = {
  getProfile: (teacherId) => request(`/teachers/${teacherId}`),
  getDashboard: (teacherId) => request(`/teachers/${teacherId}/dashboard`),
};

// Alerts/Notifications API
export const alertsApi = {
  getByTeacher: (teacherId) => request(`/alerts/teacher/${teacherId}`),
};

export default { authApi, classesApi, studentsApi, attendanceApi, timetableApi, teacherApi, alertsApi };
