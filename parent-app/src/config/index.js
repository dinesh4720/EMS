// Configuration for parent-app
// API and backend settings

export const CONFIG = {
  // API Base URL - change this to your backend URL
  API_BASE_URL: 'http://localhost:3001',

  // Socket URL for real-time communication
  SOCKET_URL: 'http://localhost:3001',

  // App info
  APP_NAME: 'Parent App',
  APP_VERSION: '1.0.0',

  // Storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    CHILDREN_DATA: 'children_data',
    SELECTED_CHILD: 'selected_child',
    STUDENT_DATA: 'student_data',
    THEME: 'app_theme',
    SETTINGS: 'app_settings',
  },

  // API endpoints
  API_ENDPOINTS: {
    LOGIN: '/api/parent/auth/login',
    REFRESH_TOKEN: '/api/parent/auth/refresh',
    LOGOUT: '/api/parent/auth/logout',
    PROFILE: '/api/parent/profile',
    CHILDREN: '/api/parent/children',
    STUDENT_DETAIL: '/api/parent/students', // + /:id
    STUDENT_ATTENDANCE: '/api/parent/students', // + /:id/attendance
    STUDENT_FEES: '/api/parent/students', // + /:id/fees
    CREATE_PAYMENT_ORDER: '/api/parent/students', // + /:id/payment/create-order
    VERIFY_PAYMENT: '/api/parent/students', // + /:id/payment/verify
    STUDENT_RESULTS: '/api/parent/students', // + /:id/results
    STUDENT_REMARKS: '/api/parent/students', // + /:id/remarks
    STUDENT_TIMETABLE: '/api/parent/timetable', // + /:studentId
    ANNOUNCEMENTS: '/api/parent/announcements',
    FCM_TOKEN: '/api/parent/fcm-token',
    CHAT_LIST: '/api/parent/messages/conversations',
    CHAT_MESSAGES: '/api/parent/messages', // + /:conversationId
    SEND_MESSAGE: '/api/parent/messages/send',
  },

  // Pagination
  PAGE_SIZE: 20,

  // Timeouts
  API_TIMEOUT: 30000,
  SOCKET_TIMEOUT: 5000,
};

export default CONFIG;
