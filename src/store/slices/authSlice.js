import { createSlice } from '@reduxjs/toolkit';

// Callback to clear query cache on logout — set from main.jsx
let onLogoutCallback = null;
export const setOnLogoutCallback = (cb) => { onLogoutCallback = cb; };

// Load initial state from localStorage
const loadInitialState = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const userStr = localStorage.getItem('user');

  if (accessToken && userStr) {
    try {
      const user = JSON.parse(userStr);
      const roles = Array.isArray(user?.roles)
        ? user.roles.map(r => r.toLowerCase())
        : (user?.role ? [user.role.toLowerCase()] : ['customer']);

      return {
        user,
        token: accessToken,
        refreshToken: refreshToken || null,
        roles,
        isAuthenticated: true,
      };
    } catch (e) {
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
      const userData = Array.isArray(user) ? user[0] : user;

      if (userData && userData.seller === null) {
        userData.seller = null;
      }

      const roles = Array.isArray(userData?.roles)
        ? userData.roles.map(r => r.toLowerCase())
        : (userData?.role ? [userData.role.toLowerCase()] : ['customer']);

      state.user = userData;
      state.token = accessToken;
      state.refreshToken = refreshToken;
      state.roles = roles;
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

      // Clear React Query cache to prevent data leakage between users
      if (onLogoutCallback) onLogoutCallback();
    },
    updateUser: (state, action) => {
      const merged = { ...state.user, ...action.payload };
      state.user = merged;
      if (
        action.payload?.roles !== undefined ||
        action.payload?.role !== undefined
      ) {
        state.roles = Array.isArray(merged.roles)
          ? merged.roles.map((r) => String(r).toLowerCase())
          : merged.role
            ? [String(merged.role).toLowerCase()]
            : ['customer'];
      }
      if (state.isAuthenticated && state.token) {
        localStorage.setItem('user', JSON.stringify(merged));
      }
    },
  },
});

export const { setCredentials, logout, updateUser, setToken } = authSlice.actions;
export default authSlice.reducer;
