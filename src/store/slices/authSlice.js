import { createSlice } from '@reduxjs/toolkit';

// Load initial state from localStorage
const loadInitialState = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const userStr = localStorage.getItem('user');
  
  if (accessToken && userStr) {
    try {
      const user = JSON.parse(userStr);
      // Handle roles as array - normalize from backend format and lowercase for consistency
      const roles = Array.isArray(user?.roles) 
        ? user.roles.map(r => r.toLowerCase())
        : (user?.role ? [user.role.toLowerCase()] : ['customer']);
      
      return {
        user,
        token: accessToken,
        refreshToken: refreshToken || null,
        roles, // Store as array
        isAuthenticated: true,
      };
    } catch (e) {
      // Invalid stored data, clear it
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }
  
  return {
    user: null,
    token: null,
    refreshToken: null,
    roles: [],
    isAuthenticated: false,
  };
};

const initialState = loadInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      // Handle user as array (from backend aggregation) - backend now returns single object
      const userData = Array.isArray(user) ? user[0] : user;
      
      // Ensure seller is properly handled (may be null if user doesn't have seller record)
      // This prevents "Cannot read properties of null" errors when accessing seller._id
      if (userData && userData.seller === null) {
        userData.seller = null; // Explicitly set to null to prevent undefined errors
      }
      
      // Normalize roles to array format and lowercase for consistency
      const roles = Array.isArray(userData?.roles) 
        ? userData.roles.map(r => r.toLowerCase())
        : (userData?.role ? [userData.role.toLowerCase()] : ['customer']);
      
      state.user = userData;
      state.token = accessToken;
      state.refreshToken = refreshToken;
      state.roles = roles; // Store as array
      state.isAuthenticated = true;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
    },
    setToken: (state, action) => {
      const { accessToken, refreshToken } = action.payload;
      state.token = accessToken;
      if (refreshToken) {
        state.refreshToken = refreshToken;
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('accessToken', accessToken);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.roles = [];
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
});

export const { setCredentials, logout, updateUser, setToken } = authSlice.actions;
export default authSlice.reducer;


