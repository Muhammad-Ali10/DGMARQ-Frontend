import api from '@lib/axios';

export const userAPI = {
  getMyOrders: (params) => api.get('/order/my-orders', { params }),
  getProductPurchase: (productId) => api.get(`/order/purchased/${productId}`),
  getOrderKeys: (orderId, params) => api.get(`/order/${orderId}/keys`, { params: params || {} }),
  reorder: (orderId) => api.post(`/order/${orderId}/reorder`),
  getWishlist: (params) => api.get('/wishlist/get-wishlist', { params: params || {} }),
  getWishlistIds: () => api.get('/wishlist/ids'),
  addToWishlist: (data) => api.post('/wishlist/create-wishlist', data),
  removeFromWishlist: (data) => api.patch('/wishlist/remove-wishlist', data),
  clearWishlist: () => api.patch('/wishlist/clear-wishlist'),
};
