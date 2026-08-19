import api from '@lib/axios';

export const userAPI = {
  getMyOrders: (params) => api.get('/order/my-orders', { params }),
  // Review eligibility: returns { hasPurchased, orders: [{_id, createdAt}] }.
  // Do NOT go back to getMyOrders for this — that ships 50 full orders.
  getProductPurchase: (productId) => api.get(`/order/purchased/${productId}`),
  getOrderById: (orderId) => api.get(`/order/${orderId}`),
  getOrderKeys: (orderId, params) => api.get(`/order/${orderId}/keys`, { params: params || {} }),
  reorder: (orderId) => api.post(`/order/${orderId}/reorder`),
  // Paginated + populated — for the wishlist PAGE only.
  getWishlist: (params) => api.get('/wishlist/get-wishlist', { params: params || {} }),
  // Ids + count only, no product documents. This is what the header badge and
  // every product card's heart read, on every route — see useWishlist.js.
  getWishlistIds: () => api.get('/wishlist/ids'),
  addToWishlist: (data) => api.post('/wishlist/create-wishlist', data),
  removeFromWishlist: (data) => api.patch('/wishlist/remove-wishlist', data),
  clearWishlist: () => api.patch('/wishlist/clear-wishlist'),
  createReview: (data) => api.post('/review/create-review', data),
  updateReview: (id, data) => api.patch(`/review/update-review/${id}`, data),
  deleteReview: (id) => api.delete(`/review/delete-review/${id}`),
  voteOnReview: (reviewId, data) => api.post(`/review/${reviewId}/vote`, data),
  replyToReview: (reviewId, data) => api.post(`/review/${reviewId}/reply`, data),
  getReviewReplies: (reviewId) => api.get(`/review/${reviewId}/replies`),
};
