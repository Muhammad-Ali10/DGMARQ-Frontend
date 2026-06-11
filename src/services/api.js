import api from '../lib/axios';

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
  linkOAuth: (data) => api.post('/user/link-oauth', data),
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

export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  // Phase 2: platform-wide payout balance (same source as seller balance API).
  getPlatformPayoutBalance: () => api.get('/payout/admin/platform-balance'),
  getOrderPayoutLines: (orderId) => api.get(`/payout/order/${orderId}/lines`),
  getPendingSellers: (params) => api.get('/admin/sellers/pending', { params }),
  getAllSellers: (params) => api.get('/admin/sellers', { params }),
  getSellerDetails: (sellerId) => api.get(`/admin/seller/${sellerId}`),
  approveSeller: (sellerId) => api.post(`/admin/seller/${sellerId}/approve`),
  rejectSeller: (sellerId, data) => api.post(`/admin/seller/${sellerId}/reject`, data),
  blockSeller: (sellerId, data) => api.post(`/admin/seller/${sellerId}/block`, data),
  getPendingProducts: (params) => api.get('/admin/products/pending', { params }),
  getAllProducts: (params) => api.get('/admin/products', { params }),
  getProductDetails: (productId) => api.get(`/admin/product/${productId}`),
  approveProduct: (productId) => api.post(`/admin/product/${productId}/approve`),
  rejectProduct: (productId, data) => api.post(`/admin/product/${productId}/reject`, data),
  deleteProduct: (productId) => api.delete(`/admin/products/${productId}`),
  getAllPayouts: (params) => api.get('/admin/payouts', { params }),
  getOrderPayoutDetails: (orderId) => api.get(`/payout/admin/order/${orderId}`),
  // Phase 5: admin withdrawal lifecycle management.
  listWithdrawals: (params) => api.get('/withdrawal/admin', { params }),
  getWithdrawal: (id) => api.get(`/withdrawal/${id}`),
  approveWithdrawal: (id) => api.patch(`/withdrawal/${id}/approve`),
  rejectWithdrawal: (id, data) => api.patch(`/withdrawal/${id}/reject`, data),
  retryWithdrawal: (id) => api.post(`/withdrawal/${id}/retry`),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  banUser: (userId, data) => api.post(`/admin/user/${userId}/ban`, data),
  getCommissionRate: () => api.get('/admin/settings/commission-rate'),
  updateCommissionRate: (data) => api.patch('/admin/settings/commission-rate', data),
  getAutoApproveSetting: () => api.get('/admin/settings/auto-approve-products'),
  updateAutoApproveSetting: (data) => api.patch('/admin/settings/auto-approve-products', data),
  getHomePageSEO: () => api.get('/admin/settings/seo/home'),
  updateHomePageSEO: (data) => api.patch('/admin/settings/seo/home', data),
  getBuyerHandlingFeeSetting: () => api.get('/admin/settings/buyer-handling-fee'),
  updateBuyerHandlingFeeSetting: (data) => api.patch('/admin/settings/buyer-handling-fee', data),
  getPayoutSettings: () => api.get('/admin/settings/payouts'),
  updatePayoutSettings: (data) => api.patch('/admin/settings/payouts', data),
  getHandlingFeeStats: () => api.get('/admin/stats/handling-fees'),
  getAllSupportChats: (params) => api.get('/support/admin/chats', { params }),
  assignAdminToChat: (chatId, assignTo = null) => api.post(`/support/admin/${chatId}/assign`, assignTo ? { assignTo } : {}),
  unassignChat: (chatId) => api.post(`/support/admin/${chatId}/unassign`, {}),
  updateChatPriority: (chatId, priority) => api.patch(`/support/admin/${chatId}/priority`, { priority }),
  updateChatStatus: (chatId, status) => api.patch(`/support/admin/${chatId}/status`, { status }),
  getSupportStats: () => api.get('/support/admin/stats'),
  // Canned responses
  getCannedResponses: () => api.get('/support/admin/canned'),
  createCannedResponse: (data) => api.post('/support/admin/canned', data),
  updateCannedResponse: (id, data) => api.patch(`/support/admin/canned/${id}`, data),
  deleteCannedResponse: (id) => api.delete(`/support/admin/canned/${id}`),
  moderateChat: (conversationId, data) => api.post(`/admin/chat/${conversationId}/moderate`, data),
  // Phase 4 (RETIRED): manual verify is gone. Verification is now automatic
  // via PayPal OAuth. The route still returns 410 on the backend.
  blockPayoutAccount: (accountId, data) => api.patch(`/payout-account/${accountId}/block`, data),
  getSellerPayoutAccount: (sellerId) => api.get(`/payout-account/seller/${sellerId}`),
  getSellersPayoutStatus: (params) => api.get('/payout-account/sellers/status', { params }),
  createBundleDeal: (formData) => api.post('/bundle-deal', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAllBundleDeals: (params) => api.get('/bundle-deal', { params }),
  getBundleDealById: (id) => api.get(`/bundle-deal/${id}`),
  updateBundleDeal: (id, formData) => api.patch(`/bundle-deal/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteBundleDeal: (id) => api.delete(`/bundle-deal/${id}`),
  toggleBundleDealStatus: (id) => api.patch(`/bundle-deal/${id}/toggle-status`),
  updateProductFeaturedSettings: (productId, data) => api.patch(`/admin/product/${productId}/featured`, data),
};

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

export const productAPI = {
  getProducts: (params) => api.get('/product/get-products', { params }),
  getProductById: (id) => api.get(`/product/${id}`),
  createProduct: (formData) => api.post('/product/create-product', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateProduct: (id, data) => api.patch(`/product/update-product/${id}`, data),
  updateProductImages: (id, formData) => api.patch(`/product/update-product-images/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteProduct: (id) => api.delete(`/product/delete-product/${id}`),
  uploadKeys: (productId, keys) => api.post(`/product/${productId}/upload-keys`, { keys }),
  getUploadKeysStatus: (productId, jobId) => api.get(`/product/${productId}/upload-keys/status/${jobId}`),
  getProductKeys: (id, params) => api.get(`/product/${id}/keys`, { params }),
  syncStock: (id) => api.post(`/product/${id}/sync-stock`),
  duplicateProduct: (id) => api.post(`/product/${id}/duplicate`),
};

export const orderAPI = {
  getAllOrders: (params) => api.get('/order/my-orders', { params }),
  getOrderById: (orderId) => api.get(`/order/${orderId}`),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getTopProducts: () => api.get('/analytics/top-products'),
  getAdminMonthlyAnalytics: (params) => api.get('/analytics/admin/monthly', { params }),
  getRealTimeCounters: () => api.get('/analytics/realtime'),
  getUserBehaviorAnalytics: () => api.get('/analytics/user-behavior'),
  exportCSV: () => api.get('/analytics/export/csv'),
  exportPDF: () => api.get('/analytics/export/pdf'),
  getProductAnalytics: (productId) => api.get(`/analytics/product/${productId}`),
  incrementProductViews: (productId) => api.post(`/analytics/product/${productId}/view`),
  getCategoryAnalytics: (categoryId) => api.get(`/analytics/category/${categoryId}`),
  getSellerMonthlyAnalytics: (params) => api.get('/analytics/seller/monthly', { params }),
  createCustomReport: (data) => api.post('/analytics/custom-report', data),
  trackUserBehavior: (data) => api.post('/analytics/track-behavior', data),
};

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

export const checkoutAPI = {
  createCheckoutSession: (data) => api.post('/checkout/create', data),
  createGuestCheckoutSession: (data) => api.post('/checkout/guest/create', data),
  getCheckoutStatus: (checkoutId) => api.get(`/checkout/${checkoutId}`),
  getHandlingFeeEstimate: (amount) => api.get('/checkout/handling-fee-estimate', { params: { amount } }),
  cancelCheckout: (checkoutId) => api.post(`/checkout/${checkoutId}/cancel`),
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

export const categoryAPI = {
  getCategories: (params) => api.get('/category/get-categories', { params }),
  getCategoryById: (categoryId) => api.get(`/category/get-category/${categoryId}`),
  createCategory: (formData) => api.post('/category/create-category', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateCategory: (categoryId, data) => api.patch(`/category/update-category/${categoryId}`, data),
  updateCategoryImage: (categoryId, formData) => api.patch(`/category/update-category-image/${categoryId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateCategoryStatus: (categoryId, data) => api.post(`/category/update-category-status/${categoryId}`, data),
  deleteCategory: (categoryId) => api.delete(`/category/delete-category/${categoryId}`),
};

export const subcategoryAPI = {
  getSubcategories: (params) => api.get('/subcategory/get-subcategories', { params }),
  getSubcategoryById: (subCategoryId) => api.get(`/subcategory/get-subcategory/${subCategoryId}`),
  getSubcategoryBySlug: (categorySlug, subcategorySlug) => api.get(`/subcategory/get-subcategory-by-slug/${categorySlug}/${subcategorySlug}`),
  getSubcategoriesByCategoryId: (categoryId, params) => api.get(`/subcategory/get-subcategories-by-category/${categoryId}`, { params }),
  getSubcategoriesByCategorySlug: (categorySlug, params) => api.get(`/subcategory/get-subcategories-by-category-slug/${categorySlug}`, { params }),
  createSubcategory: (data) => api.post('/subcategory/create-subcategory', data),
  updateSubcategory: (subCategoryId, data) => api.patch(`/subcategory/update-subcategory/${subCategoryId}`, data),
  updateSubcategoryStatus: (subCategoryId, data) => api.post(`/subcategory/update-subcategory-status/${subCategoryId}`, data),
  deleteSubcategory: (subCategoryId) => api.delete(`/subcategory/delete-subcategory/${subCategoryId}`),
};

export const platformAPI = {
  getAllPlatforms: (params) => api.get('/platform/get-all-platforms', { params }),
  createPlatform: (data) => api.post('/platform/create-platforms', data),
  updatePlatform: (id, data) => api.patch(`/platform/update-platforms-name/${id}`, data),
  togglePlatformStatus: (id) => api.patch(`/platform/update-platforms-status/${id}/toggle-status`),
  deletePlatform: (id) => api.delete(`/platform/delete-platforms/${id}`),
};

export const deviceAPI = {
  getDevices: (params) => api.get('/device/get-devices', { params }),
  getDeviceById: (id) => api.get(`/device/get-device/${id}`),
  createDevice: (data) => api.post('/device/create-device', data),
  updateDevice: (id, data) => api.patch(`/device/update-device/${id}`, data),
  toggleDeviceStatus: (id) => api.post(`/device/toggle-device-status/${id}`),
  deleteDevice: (id) => api.delete(`/device/delete-device/${id}`),
};

export const regionAPI = {
  getRegions: (params) => api.get('/region/get-regions', { params }),
  getRegionById: (regionId) => api.get(`/region/get-region/${regionId}`),
  createRegion: (data) => api.post('/region/create-region', data),
  updateRegion: (regionId, data) => api.patch(`/region/update-region/${regionId}`, data),
  deleteRegion: (regionId) => api.delete(`/region/delete-region/${regionId}`),
};

export const genreAPI = {
  getGenres: (params) => api.get('/genre/get-genres', { params }),
  createGenre: (data) => api.post('/genre/create-genre', data),
  updateGenre: (id, data) => api.patch(`/genre/update-genre/${id}`, data),
  deleteGenre: (id) => api.delete(`/genre/delete-genre/${id}`),
};

export const themeAPI = {
  getThemes: (params) => api.get('/theme/get-themes', { params }),
  createTheme: (data) => api.post('/theme/create-theme', data),
  updateTheme: (id, data) => api.patch(`/theme/update-theme/${id}`, data),
  deleteTheme: (id) => api.delete(`/theme/delete-theme/${id}`),
};

export const modeAPI = {
  getModes: (params) => api.get('/mode/get-modes', { params }),
  createMode: (data) => api.post('/mode/create-mode', data),
  updateMode: (modeId, data) => api.patch(`/mode/update-mode/${modeId}`, data),
  toggleModeStatus: (modeId) => api.post(`/mode/toggle-mode-status/${modeId}`),
  deleteMode: (modeId) => api.delete(`/mode/delete-mode/${modeId}`),
};

// Type APIs (Admin)
export const typeAPI = {
  getAllTypes: (params) => api.get('/type/get-all-product-types', { params }),
  createType: (data) => api.post('/type/create-product-type', data),
  updateType: (id, data) => api.patch(`/type/update-product-type/${id}`, data),
  toggleTypeStatus: (id) => api.patch(`/type/toggle-product-type-status/${id}`),
  deleteType: (id) => api.delete(`/type/delete-product-type/${id}`),
};


export const flashDealAPI = {
  getFlashDeals: () => api.get('/flash-deal'),
  getFlashDealById: (id) => api.get(`/flash-deal/${id}`),
  getAllFlashDeals: () => api.get('/flash-deal/admin/all'),
  createFlashDeal: (formData) => api.post('/flash-deal', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateFlashDeal: (id, formData) => api.patch(`/flash-deal/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteFlashDeal: (id) => api.delete(`/flash-deal/${id}`),
};


export const homepageSliderAPI = {
  getHomepageSliders: () => api.get('/homepage-slider'),
  getHomepageSliderById: (id) => api.get(`/homepage-slider/${id}`),
  getAllHomepageSliders: () => api.get('/homepage-slider/admin/all'),
  createHomepageSlider: (formData) => api.post('/homepage-slider', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateHomepageSlider: (id, formData) => api.patch(`/homepage-slider/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteHomepageSlider: (id) => api.delete(`/homepage-slider/${id}`),
};

export const bestsellerAPI = {
  getBestsellers: (params) => api.get('/bestseller', { params }),
  getBestsellerByProduct: (productId) => api.get(`/bestseller/product/${productId}`),
};

export const bundleDealAPI = {
  getActiveBundleDeals: () => api.get('/bundle-deal/active'),
  getBundleDealById: (id) => api.get(`/bundle-deal/${id}`),
};

export const trendingOfferAPI = {
  getTrendingOffers: () => api.get('/trending-offer'),
  getTrendingOfferById: (id) => api.get(`/trending-offer/${id}`),
  getOfferByProduct: (productId) => api.get(`/trending-offer/product/${productId}`),
  getAllTrendingOffers: (params) => api.get('/trending-offer/admin/all', { params }),
  createTrendingOffer: (data) => api.post('/trending-offer', data),
  updateTrendingOffer: (id, data) => api.patch(`/trending-offer/${id}`, data),
  deleteTrendingOffer: (id) => api.delete(`/trending-offer/${id}`),
  updateAllStatuses: () => api.post('/trending-offer/admin/update-statuses'),
};

export const upcomingReleaseAPI = {
  getUpcomingReleases: () => api.get('/upcoming-release'),
  getUpcomingReleasesConfig: () => api.get('/upcoming-release/admin'),
  updateSlot: (slotNumber, data) => api.put(`/upcoming-release/slot/${slotNumber}`, data),
  updateSlotImage: (slotNumber, formData) => api.put(`/upcoming-release/slot/${slotNumber}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const upcomingGamesAPI = {
  getUpcomingGames: () => api.get('/upcoming-games'),
  getUpcomingGamesConfig: () => api.get('/upcoming-games/admin'),
  addProducts: (data) => api.post('/upcoming-games/add', data),
  removeProducts: (data) => api.delete('/upcoming-games/remove', { data }),
  reorderProducts: (data) => api.put('/upcoming-games/reorder', data),
  updateUpcomingGames: (data) => api.put('/upcoming-games', data),
};

export const softwareAPI = {
  getSoftwarePage: () => api.get('/product/pages/software'),
};

// SEO APIs (Public)
export const seoAPI = {
  getHomePageSEO: () => api.get('/seo/home'),
};