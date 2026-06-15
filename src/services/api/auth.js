import api from '../../lib/axios';

export const authAPI = {
  login: (credentials) => api.post('/user/login', credentials),
  register: (data) => api.post('/user/register', data),
  logout: () => api.post('/user/logout'),
  // SECURITY FIX (#5): refresh token is read from the httpOnly cookie server-side.
  refreshToken: () => api.post('/user/refresh-token', {}),
  updateProfile: (data, formData) => {
    if (formData) {
      return api.patch('/user/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.patch('/user/update-profile', data);
  },
  updatePassword: (data) => api.post('/user/update-password', data),
  // SECURITY FIX (S6): linkOAuth removed — backend endpoint deleted (account-takeover
  // vector). Linking goes through the OAuth redirect flow (/user/auth/<provider>).
  unlinkOAuth: (data) => api.post('/user/unlink-oauth', data),
  sendEmailVerification: () => api.post('/user/send-verification'),
  verifyEmail: (data) => api.post('/user/verify-email', data),
  forgotPassword: (data) => api.post('/user/forgot-password', data),
  resetPassword: (data) => api.post('/user/reset-password', data),
  changeEmail: (data) => api.post('/user/change-email', data),
  verifyEmailChange: (data) => api.post('/user/verify-email-change', data),
  deleteAccount: (data) => api.post('/user/delete-account', data),
  getActiveSessions: () => api.get('/user/sessions'),
  revokeSession: (sessionId) => api.post(`/user/sessions/${sessionId}/revoke`),
  revokeAllSessions: () => api.post('/user/sessions/revoke-all'),
  getProfile: () => api.get('/user/profile'),
};
