import axios from 'axios';
import { authStorage } from './authStorage';

// Base URL for Django backend - using 10.0.2.2 for Android emulator
const BASE_URL = 'http://10.0.2.2:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding auth token to request:', config.url);
    } else {
      console.log('No auth token found for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await authStorage.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          const newToken = response.data.access;
          await authStorage.storeAuthData({ access: newToken });
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear auth data
        await authStorage.clearAuthData();
        console.log('Token refresh failed, user logged out');
      }
    }
    
    return Promise.reject(error);
  }
);

// Simple API functions
export const apiService = {
  // Test endpoint to verify connection
  testConnection: async () => {
    try {
      // Test the auth/register endpoint with GET (should return 405 Method Not Allowed but proves connectivity)
      const response = await api.get('/auth/register/');
      return { success: true, data: response.data };
    } catch (error) {
      // 405 Method Not Allowed is expected for GET on a POST endpoint - this means backend is reachable
      if (error.response && error.response.status === 405) {
        return { success: true, message: 'Backend is reachable! (405 Method Not Allowed expected)' };
      }
      console.error('API connection test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Basic login function
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login/', {
        email,
        password,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Login failed' 
      };
    }
  },

  // Basic registration function
  register: async (userData) => {
    try {
      // Map frontend form data to backend API format
      const registrationData = {
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        password: userData.password,
        password_confirm: userData.confirmPassword,
        phone_number: userData.phoneNumber || '', // Optional field
      };

      console.log('Registering user with data:', registrationData);
      const response = await api.post('/auth/register/', registrationData);
      console.log('Registration successful:', response.data);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Handle validation errors from Django
      if (error.response?.data) {
        const errorData = error.response.data;
        let errorMessage = 'Registration failed';
        
        // Extract specific field errors
        if (errorData.email) {
          errorMessage = `Email: ${errorData.email[0]}`;
        } else if (errorData.password) {
          errorMessage = `Password: ${errorData.password[0]}`;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        
        return { success: false, error: errorMessage };
      }
      
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  },

  // Logout function
  logout: async () => {
    try {
      const refreshToken = await authStorage.getRefreshToken();
      if (refreshToken) {
        // Try to invalidate refresh token on server
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.log('Logout API call failed (probably OK):', error.message);
    } finally {
      // Always clear local storage
      await authStorage.clearAuthData();
      console.log('User logged out successfully');
    }
  },

  // Check authentication status
  isAuthenticated: async () => {
    return await authStorage.isLoggedIn();
  },

  // Get current user data
  getCurrentUser: async () => {
    return await authStorage.getUserData();
  },

  // Verify 2FA OTP
  verify2FA: async (otp, email) => {
    try {
      // Use direct axios call to bypass auth interceptors for 2FA
      const response = await axios.post(`${BASE_URL}/auth/verify-2fa/`, {
        otp,
        email,  // Include email for verification
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('2FA verification failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || '2FA verification failed' 
      };
    }
  },

  // Get current user profile
  getUserProfile: async () => {
    try {
      const response = await api.get('/auth/profile/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get user profile failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Failed to get user profile' 
      };
    }
  },

  // Get dashboard data (user + expenses summary)
  getDashboardData: async () => {
    try {
      const response = await api.get('/auth/dashboard/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get dashboard data failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Failed to get dashboard data' 
      };
    }
  },

  // Resend OTP code
  resendOTP: async (email) => {
    try {
      // Use direct axios call to bypass auth interceptors
      const response = await axios.post(`${BASE_URL}/auth/resend-otp/`, {
        email,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Resend OTP failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Failed to resend OTP' 
      };
    }
  },

  // ===== EXPENSES API =====

  // Create new expense
  createExpense: async (expenseData) => {
    try {
      const response = await api.post('/expenses/', expenseData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create expense failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Failed to create expense' 
      };
    }
  },

  // Get all expenses for user
  getExpenses: async () => {
    try {
      const response = await api.get('/expenses/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get expenses failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Failed to get expenses' 
      };
    }
  },

  // Get single expense by ID
  getExpense: async (expenseId) => {
    try {
      const response = await api.get(`/expenses/${expenseId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get expense failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Failed to get expense' 
      };
    }
  },

  // ===== GROUPS API =====

  // Get all groups for user
  getGroups: async () => {
    try {
      const response = await api.get('/groups/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get groups failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Failed to get groups' 
      };
    }
  },

  // Get group members
  getGroupMembers: async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/members/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get group members failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Failed to get group members' 
      };
    }
  },

  // Get users list
  getUsers: async () => {
    try {
      const response = await api.get('/auth/users/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get users failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Failed to fetch users' 
      };
    }
  },

  // Toggle 2FA
  toggle2FA: async (enabled) => {
    try {
      const response = await api.patch('/auth/profile/', {
        two_factor_enabled: enabled
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Toggle 2FA failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Failed to update 2FA settings' 
      };
    }
  },

  // Create expense
  createExpense: async (expenseData) => {
    try {
      const response = await api.post('/expenses/', expenseData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create expense failed:', error);
      console.error('Error response data:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.detail || 
               JSON.stringify(error.response?.data) || 
               error.message || 
               'Failed to create expense' 
      };
    }
  },
};

export default api;