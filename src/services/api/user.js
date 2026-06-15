import api from '../../lib/axios';

export const userAPI = {
  getMyOrders: (params) => api.get('/order/my-orders', { params }),
  getOrderById: (orderId) => api.get(`/order/${orderId}`),
  getOrderKeys: (orderId, params) => api.get(`/order/${orderId}/keys`, { params: params || {} }),
  cancelOrder: (orderId, data) => api.post(`/order/${orderId}/cancel`, data),
  reorder: (orderId) => api.post(`/order/${orderId}/reorder`),
  getWishlist: () => api.get('/wishlist/get-wishlist'),
  addToWishlist: (data) => api.post('/wishlist/create-wishlist', data),
  removeFromWishlist: (data) => api.patch('/wishlist/remove-wishlist', data),
  clearWishlist: () => api.patch('/wishlist/clear-wishlist'),
  getMyReviews: (params) => api.get('/review/get-reviews', { params }),
  createReview: (data) => api.post('/review/create-review', data),
  updateReview: (id, data) => api.patch(`/review/update-review/${id}`, data),
  deleteReview: (id) => api.delete(`/review/delete-review/${id}`),
  voteOnReview: (reviewId, data) => api.post(`/review/${reviewId}/vote`, data),
  replyToReview: (reviewId, data) => api.post(`/review/${reviewId}/reply`, data),
  getReviewReplies: (reviewId) => api.get(`/review/${reviewId}/replies`),
};
