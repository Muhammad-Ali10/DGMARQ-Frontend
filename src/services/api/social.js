import api from '../../lib/axios';

export const supportAPI = {
  createSupportChat: (data) => api.post('/support', data),
  getMySupportChats: (params) => api.get('/support', { params }),
  getSupportMessages: (chatId, params) => api.get(`/support/${chatId}/messages`, { params }),
  sendSupportMessage: (chatId, data) => api.post(`/support/${chatId}/message`, data),
  sendSupportImageMessage: (chatId, formData) => api.post(`/support/${chatId}/message/image`, formData),
  markMessagesRead: (chatId, data = {}) => api.patch(`/support/${chatId}/messages/read`, data),
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
  deleteConversation: (conversationId) => api.delete(`/chat/conversation/${conversationId}`, { skipErrorToast: true }),
  getUnreadCount: () => api.get('/chat/unread-count', { skipErrorToast: true }),
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
  createReview: (data) => api.post('/review/create-review', data),
  updateReview: (id, data) => api.patch(`/review/update-review/${id}`, data),
  deleteReview: (id) => api.delete(`/review/delete-review/${id}`),
  voteOnReview: (reviewId, data) => api.post(`/review/${reviewId}/vote`, data),
  replyToReview: (reviewId, data) => api.post(`/review/${reviewId}/reply`, data),
  getReviewReplies: (reviewId) => api.get(`/review/${reviewId}/replies`),
  addReviewPhoto: (reviewId, formData) => api.post(`/review/${reviewId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getReviewPhotos: (reviewId) => api.get(`/review/${reviewId}/photos`),
  moderateReview: (reviewId, data) => api.post(`/review/${reviewId}/moderate`, data),
};
