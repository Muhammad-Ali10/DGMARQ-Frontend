import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// One-time legacy cleanup: older builds stored tokens in localStorage. Tokens
// now live ONLY in httpOnly cookies, so strip any leftovers at startup.
try {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
} catch {}

// Persist the non-sensitive user profile via a store subscription, keeping the
// auth reducers pure (no side effects in reducer bodies). The httpOnly auth
// cookie is the source of truth for authorization and is untouched here.
store.subscribe(() => {
  const { user, isAuthenticated } = store.getState().auth;
  try {
    if (isAuthenticated && user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  } catch {}
});
