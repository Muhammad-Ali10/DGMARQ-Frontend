import api from '@lib/axios';

export const supportAPI = {
  createSupportChat: (data) => api.post('/support', data),
  getMySupportChats: (params) => api.get('/support', { params }),
  getSupportMessages: (chatId, params) => api.get(`/support/${chatId}/messages`, { params }),
  sendSupportMessage: (chatId, data) => api.post(`/support/${chatId}/message`, data),
  sendSupportImageMessage: (chatId, formData) => api.post(`/support/${chatId}/message/image`, formData),
  rateSupportChat: (chatId, data) => api.post(`/support/${chatId}/rate`, data),
  closeSupportChat: (chatId, data = {}) => api.patch(`/support/${chatId}/close`, data),
};

export const chatAPI = {
  createConversation: (data) => api.post('/chat/conversation', data),
  getConversations: (params) => api.get('/chat/conversations', { params, skipErrorToast: true }),
  getMessages: (conversationId, params) => api.get(`/chat/conversation/${conversationId}/messages`, {
    params,
    skipErrorToast: true,
    timeout: 25000,
  }),
  sendMessage: (data) => api.post('/chat/message', data),
  sendImageMessage: (formData) => api.post('/chat/message/image', formData),
  markAsRead: (conversationId) => api.patch(`/chat/conversation/${conversationId}/read`, {}, {
    skipErrorToast: true,
    timeout: 5000,
  }),
  toggleBlock: (conversationId) => api.post(`/chat/conversation/${conversationId}/block`),
};

export const notificationAPI = {
  getNotifications: (params) => api.get('/notification/my-notifications', { params }),
  getUnreadCount: () => api.get('/notification/unread-count'),
  markAsRead: (notificationId) => api.patch(`/notification/${notificationId}/read`),
  markAllAsRead: () => api.patch('/notification/read-all'),
  deleteNotification: (notificationId) => api.delete(`/notification/${notificationId}`),
};

export const reviewAPI = {
  getReviews: (params) => api.get('/review/get-reviews', { params }),
  getMyReviews: (params) => api.get('/review/my-reviews', { params }),
  createReview: (data) => api.post('/review/create-review', data),
  updateReview: (id, data) => api.patch(`/review/update-review/${id}`, data),
  deleteReview: (id) => api.delete(`/review/delete-review/${id}`),
  replyToReview: (reviewId, data) => api.post(`/review/${reviewId}/reply`, data),
  addReviewPhoto: (reviewId, formData) => api.post(`/review/${reviewId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteReviewPhoto: (reviewId, photoId) => api.delete(`/review/${reviewId}/photos/${photoId}`),
};
