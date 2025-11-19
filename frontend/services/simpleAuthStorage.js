// Simple in-memory auth storage as backup
let authData = {
  accessToken: null,
  refreshToken: null,
  userData: null,
  isLoggedIn: false
};

export const simpleAuthStorage = {
  // Store authentication data in memory
  storeAuthData: async (data) => {
    try {
      if (data.access) {
        authData.accessToken = data.access;
      }
      if (data.refresh) {
        authData.refreshToken = data.refresh;
      }
      if (data.user) {
        authData.userData = data.user;
      }
      authData.isLoggedIn = true;
      console.log('SimpleAuth: Auth data stored in memory');
      return true;
    } catch (error) {
      console.error('SimpleAuth: Error storing auth data:', error);
      return false;
    }
  },

  // Get access token
  getAccessToken: async () => {
    return authData.accessToken;
  },

  // Get refresh token
  getRefreshToken: async () => {
    return authData.refreshToken;
  },

  // Get user data
  getUserData: async () => {
    return authData.userData;
  },

  // Check if user is logged in
  isLoggedIn: async () => {
    return authData.isLoggedIn;
  },

  // Clear all auth data (logout)
  clearAuthData: async () => {
    authData.accessToken = null;
    authData.refreshToken = null;
    authData.userData = null;
    authData.isLoggedIn = false;
    console.log('SimpleAuth: Auth data cleared from memory');
  },
};

export default simpleAuthStorage;