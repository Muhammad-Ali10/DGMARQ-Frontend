import api from '@lib/axios';

export const sellerAPI = {
  getSellerInfo: () => api.get('/seller/get-seller-info'),
  updateProfile: (data) => api.patch('/seller/update-profile', data),
  updateShopLogo: (formData) => api.patch('/seller/update-shop-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateShopBanner: (formData) => api.patch('/seller/update-shop-banner', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getWithdrawalHistory: () => api.get('/seller/withdrawal-history'),
  getPerformanceMetrics: (params) => api.get('/seller/performance-metrics', { params }),
  getVerificationBadge: () => api.get('/seller/verification-badge'),
  getMyOrders: (params) => api.get('/order/seller/my-orders', { params }),
  getMyPayouts: (params) => api.get('/payout/my-payouts', { params }),
  getPayoutBalance: () => api.get('/payout/balance'),
  getPayoutDetails: (payoutId) => api.get(`/payout/${payoutId}`),
  getPayoutRequests: () => api.get('/payout/requests'),
  // Phase 2 additions - shared between seller and admin contexts.
  getPublicPayoutSettings: () => api.get('/payout/settings/public'),
  getOrderPayoutLines: (orderId) => api.get(`/payout/order/${orderId}/lines`),
  getLicenseKeys: (productId, params) => api.get(`/seller/license-keys/${productId}`, { params }),
  revealLicenseKey: (keyId) => api.get(`/seller/license-keys/${keyId}/reveal`),
  deleteLicenseKey: (keyId) => api.delete(`/seller/license-keys/${keyId}`),
  getPayoutReports: () => api.get('/payout/reports'),
  getSellerMonthlyAnalytics: (params) => api.get('/analytics/seller/monthly', { params }),
  getPayPalConnectUrl: () => api.get('/payout-account/paypal/connect'),
  getMyPayoutAccount: () => api.get('/payout-account/my'),
  linkPayoutAccount: (data) => api.post('/payout-account/link', data),
  unlinkPayoutAccount: (method) => api.delete(`/payout-account/method/${method}`),
  // Phase 5: withdrawal request flow (replaces auto-release).
  getWithdrawalQuote: (data) => api.post('/withdrawal/quote', data),
  createWithdrawal: (data) => api.post('/withdrawal', data),
  listMyWithdrawals: (params) => api.get('/withdrawal/my', { params }),
  getWithdrawal: (id) => api.get(`/withdrawal/${id}`),
  applySeller: (formData) => api.post('/seller/apply-seller', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  checkSellerApplicationStatus: () => api.get('/seller/check-application-status'),
  getPublicSellerProfile: (sellerId) => api.get(`/seller/public/${sellerId}`),
  getSellerProducts: (sellerId, params) => api.get(`/seller/${sellerId}/products`, { params }),
  getSellerReviews: (sellerId) => api.get(`/seller/${sellerId}/reviews`),
};
