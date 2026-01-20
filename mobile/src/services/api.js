/**
 * API Service
 * Handles all API calls to the backend
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken } = response.data.data;
        await AsyncStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // Navigate to login screen
        // navigation.navigate('Login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ========== Authentication APIs ==========

export const register = async (userData) => {
  return api.post('/auth/register', userData);
};

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  // Store tokens
  await AsyncStorage.setItem('accessToken', response.data.tokens.accessToken);
  await AsyncStorage.setItem('refreshToken', response.data.tokens.refreshToken);
  await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
  return response;
};

export const logout = async () => {
  await api.post('/auth/logout');
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
};

// ========== Loan APIs ==========

export const createLoan = async (loanData) => {
  return api.post('/loans', loanData);
};

export const getLoans = async (filters = {}) => {
  return api.get('/loans', { params: filters });
};

export const getLoanById = async (loanId) => {
  return api.get(`/loans/${loanId}`);
};

export const updateLoan = async (loanId, updateData) => {
  return api.put(`/loans/${loanId}`, updateData);
};

export const deleteLoan = async (loanId) => {
  return api.delete(`/loans/${loanId}`);
};

export const getLoanAmortization = async (loanId) => {
  return api.get(`/loans/${loanId}/amortization`);
};

export const calculateLoan = async (loanDetails) => {
  return api.post('/loans/calculate', loanDetails);
};

// ========== Payment APIs ==========

export const recordPayment = async (loanId, paymentData) => {
  return api.post(`/loans/${loanId}/payments`, paymentData);
};

export const getPaymentHistory = async (loanId) => {
  return api.get(`/loans/${loanId}/payments`);
};

export const updatePayment = async (paymentId, updateData) => {
  return api.put(`/payments/${paymentId}`, updateData);
};

export const deletePayment = async (paymentId) => {
  return api.delete(`/payments/${paymentId}`);
};

// ========== Dashboard APIs ==========

export const getDashboardSummary = async () => {
  return api.get('/dashboard/summary');
};

export const getUpcomingPayments = async () => {
  return api.get('/dashboard/upcoming-payments');
};

// ========== Analytics APIs ==========

export const getCashFlowAnalytics = async (params) => {
  return api.get('/analytics/cashflow', { params });
};

export const getInterestAnalytics = async (year) => {
  return api.get('/analytics/interest', { params: { year } });
};

export const getLoanDistribution = async () => {
  return api.get('/analytics/distribution');
};

// ========== Attachment APIs ==========

export const uploadAttachment = async (loanId, formData) => {
  return api.post(`/loans/${loanId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getAttachments = async (loanId) => {
  return api.get(`/loans/${loanId}/attachments`);
};

export const deleteAttachment = async (attachmentId) => {
  return api.delete(`/attachments/${attachmentId}`);
};

// ========== Reminder APIs ==========

export const getReminders = async (params) => {
  return api.get('/reminders', { params });
};

export const updateReminderSettings = async (loanId, settings) => {
  return api.put(`/loans/${loanId}/reminders`, settings);
};

export const snoozeReminder = async (reminderId, snoozeUntil) => {
  return api.post(`/reminders/${reminderId}/snooze`, { snoozeUntil });
};

// ========== User APIs ==========

export const getUserProfile = async () => {
  return api.get('/users/me');
};

export const updateUserProfile = async (updateData) => {
  return api.put('/users/me', updateData);
};

export const changePassword = async (passwordData) => {
  return api.post('/users/me/change-password', passwordData);
};

// ========== Report APIs ==========

export const generateReport = async (reportConfig) => {
  return api.post('/reports/generate', reportConfig);
};

export const exportData = async (params) => {
  return api.get('/export', { params, responseType: 'blob' });
};

// ========== Search API ==========

export const globalSearch = async (query, types) => {
  return api.get('/search', { params: { q: query, type: types.join(',') } });
};

// ========== Notifications API ==========

export const getNotifications = async (params) => {
  return api.get('/notifications', { params });
};

export const markNotificationAsRead = async (notificationId) => {
  return api.put(`/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsRead = async () => {
  return api.put('/notifications/read-all');
};

export default api;
