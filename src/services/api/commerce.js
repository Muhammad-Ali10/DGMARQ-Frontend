import api from '../../lib/axios';

export const orderAPI = {
  getAllOrders: (params) => api.get('/order/my-orders', { params }),
  getOrderById: (orderId) => api.get(`/order/${orderId}`),
};

export const checkoutAPI = {
  createCheckoutSession: (data) => api.post('/checkout/create', data),
  createGuestCheckoutSession: (data) => api.post('/checkout/guest/create', data),
  // SECURITY FIX (S3): unauthenticated guest reads/cancels now require the
  // guest email used at session creation (backend enforces ownership proof).
  getCheckoutStatus: (checkoutId, guestEmail) =>
    api.get(`/checkout/${checkoutId}`, { params: guestEmail ? { guestEmail } : {} }),
  getHandlingFeeEstimate: (amount) => api.get('/checkout/handling-fee-estimate', { params: { amount } }),
  cancelCheckout: (checkoutId, guestEmail) =>
    api.post(`/checkout/${checkoutId}/cancel`, guestEmail ? { guestEmail } : {}),
  payWithWallet: (checkoutId) => api.post(`/checkout/${checkoutId}/pay-with-wallet`),
};

export const paypalAPI = {
  createOrder: (data) => api.post('/paypal/orders', data),
  captureOrder: (orderId, checkoutId) => api.post(`/paypal/orders/${orderId}/capture`, { checkoutId }),
};

export const cartAPI = {
  addItem: (data) => api.post('/cart/add-item', data),
  getCart: () => api.get('/cart/get-cart'),
  removeItem: (data) => api.patch('/cart/remove-item', data),
  updateCart: (data) => api.patch('/cart/update-cart', data),
  clearCart: () => api.patch('/cart/clear-cart'),
  addBundle: (data) => api.post('/cart/add-bundle', data),
};

export const couponAPI = {
  getActiveCoupons: () => api.get('/coupon/active'),
  validateCoupon: (data) => api.post('/coupon/validate', data),
  createCoupon: (data) => api.post('/coupon', data),
  getAllCoupons: () => api.get('/coupon'),
  getCouponById: (couponId) => api.get(`/coupon/${couponId}`),
  updateCoupon: (couponId, data) => api.patch(`/coupon/${couponId}`, data),
  deleteCoupon: (couponId) => api.delete(`/coupon/${couponId}`),
};

export const returnRefundAPI = {
  createRefundRequest: (data) => api.post('/return-refund', data),
  uploadEvidence: (formData) => api.post('/return-refund/upload-evidence', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyRefunds: (params) => api.get('/return-refund/my-refunds', { params }),
  getRefundById: (refundId) => api.get(`/return-refund/${refundId}`),
  cancelRefund: (refundId) => api.delete(`/return-refund/${refundId}`),
  getCompletedOrders: () => api.get('/return-refund/completed-orders'),
  getOrderItemLicenseKeys: (orderId, productId) =>
    api.get('/return-refund/order-item-keys', { params: { orderId, productId } }),
  previewSplit: (orderId, productId, licenseKeyIds, refundDestination) => {
    const params = { orderId, productId };
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
  escalateToAdmin: (refundId) => api.post(`/return-refund/${refundId}/escalate`),
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
  sellerApproveRefund: (refundId) => api.patch(`/return-refund/seller/${refundId}/approve`),
  sellerRejectRefund: (refundId, reason) => api.patch(`/return-refund/seller/${refundId}/reject`, { reason }),
  sellerSubmitFeedback: (refundId, feedback) => api.patch(`/return-refund/seller/${refundId}/feedback`, { feedback }),
  getAllRefunds: (params) => api.get('/return-refund/admin/all', { params }),
  updateRefundStatus: (refundId, data) => api.patch(`/return-refund/admin/${refundId}`, data),
  requestSellerInput: (refundId, note) => api.patch(`/return-refund/admin/${refundId}/request-seller-input`, { note }),
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
};

export const licenseKeyAPI = {
  getMyLicenseKeys: (params) => api.get('/license-key/my-keys', { params }),
  revealLicenseKey: (keyId) => api.get(`/license-key/${keyId}/reveal`),
};
