import { createSlice } from '@reduxjs/toolkit';

const loadInitialState = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const roles = Array.isArray(user?.roles)
        ? user.roles.map(r => String(r).toLowerCase())
        : (user?.role ? [String(user.role).toLowerCase()] : ['customer']);
      return { user, roles, isAuthenticated: true };
    } catch {
      localStorage.removeItem('user');
    }
  }
  return { user: null, roles: [], isAuthenticated: false };
};

const initialState = loadInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user } = action.payload;
      const userData = Array.isArray(user) ? user[0] : user;

      const roles = Array.isArray(userData?.roles)
        ? userData.roles.map(r => String(r).toLowerCase())
        : (userData?.role ? [String(userData.role).toLowerCase()] : ['customer']);

      state.user = userData;
      state.roles = roles;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.roles = [];
      state.isAuthenticated = false;
    },
    updateUser: (state, action) => {
      const merged = { ...state.user, ...action.payload };
      state.user = merged;
      if (action.payload?.roles !== undefined || action.payload?.role !== undefined) {
        state.roles = Array.isArray(merged.roles)
          ? merged.roles.map((r) => String(r).toLowerCase())
          : merged.role ? [String(merged.role).toLowerCase()] : ['customer'];
      }
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
