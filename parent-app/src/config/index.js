// Configuration for parent-app
// API and backend settings

import Constants from 'expo-constants';

const expoExtra = Constants.expoConfig?.extra ?? Constants.manifest2?.extra ?? Constants.manifest?.extra ?? {};

const getValue = (value) => (
  typeof value === 'string' && value.trim() ? value.trim() : undefined
);

const getConfigValue = (envKey, extraKey, fallback) => (
  getValue(typeof process !== 'undefined' ? process.env?.[envKey] : undefined)
  ?? getValue(expoExtra?.[extraKey])
  ?? fallback
);

const APP_ENV = getConfigValue('EXPO_PUBLIC_APP_ENV', 'appEnv', 'development');

const resolveApiBaseUrl = () => {
  const url = getConfigValue('EXPO_PUBLIC_API_BASE_URL', 'apiBaseUrl', undefined);
  if (!url) {
    if (APP_ENV === 'production') {
      throw new Error(
        '[Config] EXPO_PUBLIC_API_BASE_URL is required in production. ' +
        'Set it in your EAS environment or .env file.'
      );
    }
    console.warn(
      '[Config] EXPO_PUBLIC_API_BASE_URL is not set. ' +
      'API calls will fail until this is configured. ' +
      'Set it in your .env.local file (e.g. EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:3001).'
    );
    return '';
  }
  return url;
};

const API_BASE_URL = resolveApiBaseUrl();

export const CONFIG = {
  APP_ENV,

  API_BASE_URL,

  SOCKET_URL: getConfigValue('EXPO_PUBLIC_SOCKET_URL', 'socketUrl', API_BASE_URL),

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
    SEND_OTP: '/api/parent/auth/send-otp',
    VERIFY_OTP: '/api/parent/auth/verify-otp',
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
    STUDENT_EXAMS: '/api/parent/students', // + /:id/exams
    STUDENT_REMARKS: '/api/parent/students', // + /:id/remarks
    STUDENT_HOMEWORK: '/api/parent/students', // + /:id/homework
    STUDENT_TIMETABLE: '/api/parent/timetable', // + /:studentId
    ANNOUNCEMENTS: '/api/parent/announcements',
    FCM_TOKEN: '/api/parent/fcm-token',
    CHAT_LIST: '/api/parent/messages/conversations',
    CHAT_MESSAGES: '/api/parent/messages', // + /:conversationId
    SEND_MESSAGE: '/api/parent/messages/send',
    NOTIFICATION_SETTINGS: '/api/parent/notification-settings',
  },

  // Pagination
  PAGE_SIZE: 20,

  // Timeouts
  API_TIMEOUT: 30000,
  SOCKET_TIMEOUT: 5000,
};

export default CONFIG;
