import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  PENDING_EMAIL: 'pending_2fa_email',  // For 2FA flow
};

export const authStorage = {
  // Store authentication data
  storeAuthData: async (authData) => {
    try {
      if (authData.access) {
        await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, authData.access);
      }
      if (authData.refresh) {
        await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, authData.refresh);
      }
      if (authData.user) {
        await AsyncStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(authData.user));
      }
      console.log('Auth data stored successfully');
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  },

  // Get access token
  getAccessToken: async () => {
    try {
      return await AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  // Get refresh token
  getRefreshToken: async () => {
    try {
      return await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  // Get user data
  getUserData: async () => {
    try {
      const userData = await AsyncStorage.getItem(AUTH_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Check if user is logged in
  isLoggedIn: async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
      return !!token;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  },

  // Clear all auth data (logout)
  clearAuthData: async () => {
    try {
      await AsyncStorage.multiRemove([
        AUTH_KEYS.ACCESS_TOKEN,
        AUTH_KEYS.REFRESH_TOKEN,
        AUTH_KEYS.USER_DATA,
        AUTH_KEYS.PENDING_EMAIL,
      ]);
      console.log('Auth data cleared successfully');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  // Store user email for 2FA verification
  storeUserEmail: async (email) => {
    try {
      await AsyncStorage.setItem(AUTH_KEYS.PENDING_EMAIL, email);
      console.log('User email stored for 2FA');
    } catch (error) {
      console.error('Error storing user email:', error);
    }
  },

  // Get stored user email for 2FA verification
  getUserEmail: async () => {
    try {
      return await AsyncStorage.getItem(AUTH_KEYS.PENDING_EMAIL);
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  },

  // Clear stored email after successful 2FA
  clearUserEmail: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_KEYS.PENDING_EMAIL);
      console.log('Pending email cleared');
    } catch (error) {
      console.error('Error clearing user email:', error);
    }
  },
};

export default authStorage;