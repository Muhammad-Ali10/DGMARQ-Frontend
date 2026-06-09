import { createSlice } from '@reduxjs/toolkit';

// Callback to clear query cache on logout — set from main.jsx
let onLogoutCallback = null;
export const setOnLogoutCallback = (cb) => { onLogoutCallback = cb; };

// SECURITY FIX (#5): tokens now live ONLY in httpOnly cookies, which JS cannot
// read. We persist only the non-sensitive user profile for fast UI hydration.
// Authorization is proven by the cookie on each request; the server is the
// source of truth (verify-token / getProfile).
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
      // Accept { user } — tokens are no longer passed around the client.
      const { user } = action.payload;
      const userData = Array.isArray(user) ? user[0] : user;

      const roles = Array.isArray(userData?.roles)
        ? userData.roles.map(r => String(r).toLowerCase())
        : (userData?.role ? [String(userData.role).toLowerCase()] : ['customer']);

      state.user = userData;
      state.roles = roles;
      state.isAuthenticated = true;
      // Persistence is handled by a store subscription (see store.js) so that
      // reducers stay pure and free of side effects. Only the profile is
      // cached there — NEVER tokens.
    },
    logout: (state) => {
      state.user = null;
      state.roles = [];
      state.isAuthenticated = false;
      // Clearing of the cached user is handled by the store subscription.
      if (onLogoutCallback) onLogoutCallback();
    },
    updateUser: (state, action) => {
      const merged = { ...state.user, ...action.payload };
      state.user = merged;
      if (action.payload?.roles !== undefined || action.payload?.role !== undefined) {
        state.roles = Array.isArray(merged.roles)
          ? merged.roles.map((r) => String(r).toLowerCase())
          : merged.role ? [String(merged.role).toLowerCase()] : ['customer'];
      }
      // Persistence is handled by the store subscription.
    },
  },
});

// `setToken` removed — there is no client-side token to set anymore.
export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
