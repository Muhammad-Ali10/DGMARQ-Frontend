import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

try {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
} catch {
  /* localStorage unavailable (private mode / SSR) — non-fatal */
}

const PERSISTED_USER_FIELDS = ['_id', 'name', 'email', 'roles', 'profileImage', 'displayCurrency', 'emailVerified'];

const persistedUser = (user) =>
  Object.fromEntries(PERSISTED_USER_FIELDS.filter((key) => user[key] !== undefined).map((key) => [key, user[key]]));

store.subscribe(() => {
  const { user, isAuthenticated } = store.getState().auth;
  try {
    if (isAuthenticated && user) {
      localStorage.setItem('user', JSON.stringify(persistedUser(user)));
    } else {
      localStorage.removeItem('user');
    }
  } catch {
    /* localStorage unavailable or quota exceeded — profile cache is optional */
  }
});
