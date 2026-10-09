import api from '@lib/axios';

export const authAPI = {
  register: (data) => api.post('/user/register', data, { skipErrorToast: true }),
  logout: () => api.post('/user/logout'),
  updateProfile: (data, formData) => {
    if (formData) {
      return api.patch('/user/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.patch('/user/update-profile', data);
  },
  updatePassword: (data) => api.post('/user/update-password', data),
  unlinkOAuth: (data) => api.post('/user/unlink-oauth', data),
  startOAuthLink: (provider) => api.post(`/user/auth/${provider}/link`),
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
  getSocialProviders: () => api.get('/user/auth/providers', { skipErrorToast: true }),
  exportMyData: () => api.get('/user/my-data'),
};
