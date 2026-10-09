import api from '@lib/axios';

export const orderAPI = {
  getAllOrders: (params) => api.get('/order/my-orders', { params }),
  getOrderById: (orderId) => api.get(`/order/${orderId}`),
  cancelPreorder: (orderId) => api.post(`/order/${orderId}/cancel-preorder`),
};

export const checkoutAPI = {
  createCheckoutSession: (data) => api.post('/checkout/create', data),
  createGuestCheckoutSession: (data) => api.post('/checkout/guest/create', data),
  getCheckoutStatus: (checkoutId, guestEmail) =>
    api.get(`/checkout/${checkoutId}`, { params: guestEmail ? { guestEmail } : {} }),
  getHandlingFeeEstimate: (amount) => api.get('/checkout/handling-fee-estimate', { params: { amount } }),
  getCheckoutPreview: (params) => api.get('/checkout/preview', { params: params || {} }),
  payWithWallet: (checkoutId) => api.post(`/checkout/${checkoutId}/pay-with-wallet`),
};

export const paypalAPI = {
  createOrder: (data) => api.post('/paypal/orders', data),
  captureOrder: (orderId, checkoutId) => api.post(`/paypal/orders/${orderId}/capture`, { checkoutId }),
};

export const cartAPI = {
  addItem: (data) => api.post('/cart/add-item', data),
  getCart: () => api.get('/cart/get-cart'),
  getCount: () => api.get('/cart/count'),
  removeItem: (data) => api.patch('/cart/remove-item', data),
  updateCart: (data) => api.patch('/cart/update-cart', data),
  clearCart: () => api.patch('/cart/clear-cart'),
  guestView: (items) => api.post('/cart/guest-view', { items }),
};

export const couponAPI = {
  validateCoupon: (data, config) => api.post('/coupon/validate', data, config),
  createCoupon: (data) => api.post('/coupon', data),
  getAllCoupons: (params) => api.get('/coupon', { params }),
  updateCoupon: (couponId, data) => api.patch(`/coupon/${couponId}`, data),
  deleteCoupon: (couponId) => api.delete(`/coupon/${couponId}`),
};

export const returnRefundAPI = {
  createRefundRequest: (data) => api.post('/return-refund', data),
  uploadEvidence: (formData) => api.post('/return-refund/upload-evidence', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyRefunds: (params) => api.get('/return-refund/my-refunds', { params }),
  getRefundById: (refundId) => api.get(`/return-refund/${refundId}`),
  getCompletedOrders: () => api.get('/return-refund/completed-orders'),
  getOrderItemLicenseKeys: (orderId, productId, sellerId) =>
    api.get('/return-refund/order-item-keys', { params: { orderId, productId, ...(sellerId ? { sellerId } : {}) } }),
  previewSplit: (orderId, productId, licenseKeyIds, refundDestination, sellerId) => {
    const params = { orderId, productId, ...(sellerId ? { sellerId } : {}) };
    if (Array.isArray(licenseKeyIds) && licenseKeyIds.length > 0) {
      params.licenseKeyIds = licenseKeyIds.join(',');
    }
    if (refundDestination) {
      params.refundDestination = refundDestination;
    }
    return api.get('/return-refund/preview-split', { params });
  },
  validateGuestOrder: (queryString) =>
    api.get(`/return-refund/guest/validate?${queryString}`),
  getRefundMessages: (refundId) => api.get(`/return-refund/${refundId}/messages`),
  addRefundMessage: (refundId, payload) => {
    if (payload instanceof FormData) {
      return api.post(`/return-refund/${refundId}/messages`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post(`/return-refund/${refundId}/messages`, payload);
  },
  getSellerRefundList: (params) => api.get('/return-refund/seller/list', { params }),
  sellerSubmitFeedback: (refundId, feedback) => api.patch(`/return-refund/seller/${refundId}/feedback`, { feedback }),
  getAllRefunds: (params) => api.get('/return-refund/admin/all', { params }),
  updateRefundStatus: (refundId, data) => api.patch(`/return-refund/admin/${refundId}`, data),
  getRefundKeyDetails: (refundId) => api.get(`/return-refund/${refundId}/key-details`),
};

export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
};

export const subscriptionAPI = {
  getSubscriptionPlans: () => api.get('/subscription/plans'),
  getMySubscription: () => api.get('/subscription/me'),
  subscribe: () => api.post('/subscription/subscribe'),
  confirmSubscription: (data) => api.post('/subscription/confirm', data),
  cancelSubscription: () => api.post('/subscription/cancel'),
  renewSubscription: (data) => api.post('/subscription/renew', data),
  getAllSubscriptions: (params) => api.get('/subscription', { params }),
  getSubscriptionStats: () => api.get('/subscription/stats'),
  getMyPoints: () => api.get('/subscription/points'),
  redeemPoints: (points) => api.post('/subscription/points/redeem', { points }),
};

export const licenseKeyAPI = {
  getMyLicenseKeys: (params) => api.get('/license-key/my-keys', { params }),
  revealLicenseKey: (keyId) => api.get(`/license-key/${keyId}/reveal`),
};
