import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import CONFIG from '../config';

const SECURE_REFRESH_KEY = 'secure_refresh_token';

class ApiService {
  constructor() {
    this.baseUrl = CONFIG.API_BASE_URL;
    this.timeout = CONFIG.API_TIMEOUT;
    this._isRefreshing = false;
    this._refreshQueue = [];
  }

  async getAuthToken() {
    try {
      return await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async getRefreshToken() {
    try {
      // Try SecureStore first (new storage), fall back to AsyncStorage (migration)
      const secure = await SecureStore.getItemAsync(SECURE_REFRESH_KEY);
      if (secure) return secure;
      return await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      return null;
    }
  }

  async refreshAccessToken() {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const response = await fetch(`${this.baseUrl}${CONFIG.API_ENDPOINTS.REFRESH_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    if (data.success && data.data?.accessToken) {
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, data.data.accessToken);
      return data.data.accessToken;
    }
    throw new Error('Token refresh failed');
  }

  async request(endpoint, options = {}, retryOnAuth = true) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await this.getAuthToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 with token refresh
      if (response.status === 401 && retryOnAuth) {
        try {
          await this.refreshAccessToken();
          // Retry the original request with new token
          return this.request(endpoint, options, false);
        } catch (refreshError) {
          // Refresh failed - user needs to re-login
          const error = new Error('Session expired. Please login again.');
          error.code = 'SESSION_EXPIRED';
          throw error;
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const err = new Error(error.error?.message || error.message || `HTTP error! status: ${response.status}`);
        err.code = error.error?.code;
        err.status = response.status;
        throw err;
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, params = null) {
    // Pass optional query params for DELETE (avoids body in DELETE requests)
    const url = params ? `${endpoint}?${new URLSearchParams(params).toString()}` : endpoint;
    return this.request(url, { method: 'DELETE' });
  }

  // Auth endpoints
  async login(credentials) {
    return this.post(CONFIG.API_ENDPOINTS.LOGIN, credentials);
  }

  async sendOtp(phone) {
    return this.post(CONFIG.API_ENDPOINTS.SEND_OTP, { phone });
  }

  async verifyOtp({ phone, otp }) {
    return this.post(CONFIG.API_ENDPOINTS.VERIFY_OTP, { phone, otp });
  }

  async logout() {
    try {
      await this.post(CONFIG.API_ENDPOINTS.LOGOUT, {});
    } catch {
      // Ignore logout API errors
    }
  }

  // Profile
  async getProfile() {
    return this.get(CONFIG.API_ENDPOINTS.PROFILE);
  }

  // Children
  async getChildren() {
    return this.get(CONFIG.API_ENDPOINTS.CHILDREN);
  }

  // Student endpoints - all take studentId
  async getStudentDetail(studentId) {
    return this.get(`${CONFIG.API_ENDPOINTS.STUDENT_DETAIL}/${studentId}`);
  }

  async getStudentAttendance(studentId, params = {}) {
    return this.get(`${CONFIG.API_ENDPOINTS.STUDENT_ATTENDANCE}/${studentId}/attendance`, params);
  }

  async getStudentFees(studentId) {
    return this.get(`${CONFIG.API_ENDPOINTS.STUDENT_FEES}/${studentId}/fees`);
  }

  // Payment endpoints
  async createPaymentOrder(studentId, data) {
    return this.post(`${CONFIG.API_ENDPOINTS.CREATE_PAYMENT_ORDER}/${studentId}/payment/create-order`, data);
  }

  async verifyPayment(studentId, data) {
    return this.post(`${CONFIG.API_ENDPOINTS.VERIFY_PAYMENT}/${studentId}/payment/verify`, data);
  }

  async getStudentResults(studentId, params = {}) {
    return this.get(`${CONFIG.API_ENDPOINTS.STUDENT_RESULTS}/${studentId}/results`, params);
  }

  async getStudentExams(studentId, params = {}) {
    return this.get(`${CONFIG.API_ENDPOINTS.STUDENT_EXAMS}/${studentId}/exams`, params);
  }

  async getStudentRemarks(studentId, params = {}) {
    return this.get(`${CONFIG.API_ENDPOINTS.STUDENT_REMARKS}/${studentId}/remarks`, params);
  }

  async getStudentHomework(studentId) {
    return this.get(`${CONFIG.API_ENDPOINTS.STUDENT_HOMEWORK}/${studentId}/homework`);
  }

  async getStudentTimetable(studentId) {
    return this.get(`${CONFIG.API_ENDPOINTS.STUDENT_TIMETABLE}/${studentId}`);
  }

  // Announcements
  async getAnnouncements(params = {}) {
    return this.get(CONFIG.API_ENDPOINTS.ANNOUNCEMENTS, params);
  }

  // Chat endpoints
  async getChatList() {
    return this.get(CONFIG.API_ENDPOINTS.CHAT_LIST);
  }

  async getChatMessages(conversationId) {
    return this.get(`${CONFIG.API_ENDPOINTS.CHAT_MESSAGES}/${conversationId}`);
  }

  async sendMessage(data) {
    return this.post(CONFIG.API_ENDPOINTS.SEND_MESSAGE, data);
  }

  // Notification Settings
  async getNotificationSettings() {
    return this.get(CONFIG.API_ENDPOINTS.NOTIFICATION_SETTINGS);
  }

  async updateNotificationSettings(settings) {
    return this.put(CONFIG.API_ENDPOINTS.NOTIFICATION_SETTINGS, settings);
  }

  // FCM Token
  async registerFcmToken(token, deviceInfo) {
    return this.post(CONFIG.API_ENDPOINTS.FCM_TOKEN, { token, deviceInfo });
  }

  async removeFcmToken(token) {
    return this.delete(CONFIG.API_ENDPOINTS.FCM_TOKEN, { token });
    // token is passed as query param: DELETE /api/parent/fcm-token?token=...
  }
}

const api = new ApiService();
export default api;
