import api from '../lib/axios';

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/user/login', credentials),
  register: (data) => api.post('/user/register', data),
  logout: () => api.post('/user/logout'),
  refreshToken: (refreshToken) => api.post('/user/refresh-token', { refreshToken }),
  updateProfile: (data, formData) => {
    if (formData) {
      return api.patch('/user/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.patch('/user/update-profile', data);
  },
  updatePassword: (data) => api.post('/user/update-password', data),
  // OAuth
  linkOAuth: (data) => api.post('/user/link-oauth', data),
  unlinkOAuth: (data) => api.post('/user/unlink-oauth', data),
  // Email verification
  sendEmailVerification: () => api.post('/user/send-verification'),
  verifyEmail: (data) => api.post('/user/verify-email', data),
  // Password reset
  forgotPassword: (data) => api.post('/user/forgot-password', data),
  resetPassword: (data) => api.post('/user/reset-password', data),
  // Email change
  changeEmail: (data) => api.post('/user/change-email', data),
  verifyEmailChange: (data) => api.post('/user/verify-email-change', data),
  // Account management
  deleteAccount: (data) => api.post('/user/delete-account', data),
  // Session management
  getActiveSessions: () => api.get('/user/sessions'),
  revokeSession: (sessionId) => api.post(`/user/sessions/${sessionId}/revoke`),
  revokeAllSessions: () => api.post('/user/sessions/revoke-all'),
  // Profile
  getProfile: () => api.get('/user/profile'),
};

// Admin APIs
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
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
  getAllPayouts: (params) => api.get('/admin/payouts', { params }),
  processPayout: (payoutId) => api.post(`/admin/payout/${payoutId}/process`),
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
  getHandlingFeeStats: () => api.get('/admin/stats/handling-fees'),
  getAllSupportChats: () => api.get('/support/admin/chats'),
  assignAdminToChat: (chatId, assignTo = null) => api.post(`/support/admin/${chatId}/assign`, assignTo ? { assignTo } : {}),
  getSupportStats: () => api.get('/support/admin/stats'),
  moderateChat: (conversationId, data) => api.post(`/admin/chat/${conversationId}/moderate`, data),
  // Payout account management
  verifyPayoutAccount: (accountId) => api.patch(`/payout-account/${accountId}/verify`),
  blockPayoutAccount: (accountId, data) => api.patch(`/payout-account/${accountId}/block`, data),
  getSellerPayoutAccount: (sellerId) => api.get(`/payout-account/seller/${sellerId}`),
  getSellersPayoutStatus: () => api.get('/payout-account/sellers/status'),
  // Bundle Deal management
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
};

// Seller APIs
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
  // License Key Management
  getLicenseKeys: (productId, params) => api.get(`/seller/license-keys/${productId}`, { params }),
  revealLicenseKey: (keyId) => api.get(`/seller/license-keys/${keyId}/reveal`),
  deleteLicenseKey: (keyId) => api.delete(`/seller/license-keys/${keyId}`),
  getPayoutReports: () => api.get('/payout/reports'),
  getSellerMonthlyAnalytics: (params) => api.get('/analytics/seller/monthly', { params }),
  // Payout account (PayPal OAuth only – no email link)
  getPayPalConnectUrl: () => api.get('/payout-account/paypal/connect'),
  getMyPayoutAccount: () => api.get('/payout-account/my'),
  linkPayoutAccount: (data) => api.post('/payout-account/link', data),
  // Apply seller
  applySeller: (formData) => api.post('/seller/apply-seller', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  // Check seller application status
  checkSellerApplicationStatus: () => api.get('/seller/check-application-status'),
  // Public seller profile endpoints
  getPublicSellerProfile: (sellerId) => api.get(`/seller/public/${sellerId}`),
  getSellerProducts: (sellerId, params) => api.get(`/seller/${sellerId}/products`, { params }),
  getSellerReviews: (sellerId) => api.get(`/seller/${sellerId}/reviews`),
};

// User APIs
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

// Product APIs
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
  getProductKeys: (id, params) => api.get(`/product/${id}/keys`, { params }),
  syncStock: (id) => api.post(`/product/${id}/sync-stock`),
  duplicateProduct: (id) => api.post(`/product/${id}/duplicate`),
};

// Order APIs (for admin and users)
export const orderAPI = {
  getAllOrders: (params) => api.get('/order/my-orders', { params }),
  getOrderById: (orderId) => api.get(`/order/${orderId}`),
};

// Analytics APIs
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

// Support APIs
export const supportAPI = {
  createSupportChat: (data) => api.post('/support', data),
  getMySupportChats: (params) => api.get('/support', { params }),
  getSupportMessages: (chatId) => api.get(`/support/${chatId}/messages`),
  sendSupportMessage: (chatId, data) => api.post(`/support/${chatId}/message`, data),
  closeSupportChat: (chatId, data = {}) => api.patch(`/support/${chatId}/close`, data),
};

// Chat APIs (buyer-seller conversations)
export const chatAPI = {
  createConversation: (data) => api.post('/chat/conversation', data),
  getConversations: (params) => api.get('/chat/conversations', { params, skipErrorToast: true }),
  // Increased timeout for message fetching (large chat history)
  getMessages: (conversationId, params) => api.get(`/chat/conversation/${conversationId}/messages`, { 
    params, 
    skipErrorToast: true,
    timeout: 25000, // 25 seconds for message loading (longer than default)
  }),
  sendMessage: (data) => api.post('/chat/message', data),
  sendImageMessage: (formData) => api.post('/chat/message/image', formData),
  markAsRead: (conversationId) => api.patch(`/chat/conversation/${conversationId}/read`, {}, { 
    skipErrorToast: true,
    timeout: 5000, // 5 second timeout (should be fast, background operation)
  }),
  deleteConversation: (conversationId) => api.delete(`/chat/conversation/${conversationId}`, { skipErrorToast: true }),
  getUnreadCount: () => api.get('/chat/unread-count', { skipErrorToast: true }),
};

// Notification APIs
export const notificationAPI = {
  getNotifications: (params) => api.get('/notification/my-notifications', { params }),
  getUnreadCount: () => api.get('/notification/unread-count'),
  markAsRead: (notificationId) => api.patch(`/notification/${notificationId}/read`),
  markAllAsRead: () => api.patch('/notification/read-all'),
  deleteNotification: (notificationId) => api.delete(`/notification/${notificationId}`),
};

// Checkout APIs
export const checkoutAPI = {
  createCheckoutSession: (data) => api.post('/checkout/create', data),
  createGuestCheckoutSession: (data) => api.post('/checkout/guest/create', data),
  getCheckoutStatus: (checkoutId) => api.get(`/checkout/${checkoutId}`),
  getHandlingFeeEstimate: (amount) => api.get('/checkout/handling-fee-estimate', { params: { amount } }),
  cancelCheckout: (checkoutId) => api.post(`/checkout/${checkoutId}/cancel`),
  payWithWallet: (checkoutId) => api.post(`/checkout/${checkoutId}/pay-with-wallet`),
};

// PayPal Order APIs
export const paypalAPI = {
  createOrder: (data) => api.post('/paypal/orders', data),
  captureOrder: (orderId, checkoutId) => api.post(`/paypal/orders/${orderId}/capture`, { checkoutId }),
};

// Cart APIs
export const cartAPI = {
  addItem: (data) => api.post('/cart/add-item', data),
  getCart: () => api.get('/cart/get-cart'),
  removeItem: (data) => api.patch('/cart/remove-item', data),
  updateCart: (data) => api.patch('/cart/update-cart', data),
  clearCart: () => api.patch('/cart/clear-cart'),
  addBundle: (data) => api.post('/cart/add-bundle', data),
};

// Coupon APIs
export const couponAPI = {
  getActiveCoupons: () => api.get('/coupon/active'),
  validateCoupon: (data) => api.post('/coupon/validate', data),
  // Admin only
  createCoupon: (data) => api.post('/coupon', data),
  getAllCoupons: () => api.get('/coupon'),
  getCouponById: (couponId) => api.get(`/coupon/${couponId}`),
  updateCoupon: (couponId, data) => api.patch(`/coupon/${couponId}`, data),
  deleteCoupon: (couponId) => api.delete(`/coupon/${couponId}`),
};

// Return-Refund APIs (refund-only; no disputes)
export const returnRefundAPI = {
  createRefundRequest: (data) => api.post('/return-refund', data),
  uploadEvidence: (formData) => api.post('/return-refund/upload-evidence', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyRefunds: (params) => api.get('/return-refund/my-refunds', { params }),
  getRefundById: (refundId) => api.get(`/return-refund/${refundId}`),
  cancelRefund: (refundId) => api.delete(`/return-refund/${refundId}`),
  getCompletedOrders: () => api.get('/return-refund/completed-orders'),
  getOrderItemLicenseKeys: (orderId, productId) =>
    api.get('/return-refund/order-item-keys', { params: { orderId, productId } }),
  escalateToAdmin: (refundId) => api.post(`/return-refund/${refundId}/escalate`),
  getRefundMessages: (refundId) => api.get(`/return-refund/${refundId}/messages`),
  addRefundMessage: (refundId, message) => api.post(`/return-refund/${refundId}/messages`, { message }),
  getSellerRefundList: (params) => api.get('/return-refund/seller/list', { params }),
  sellerApproveRefund: (refundId) => api.patch(`/return-refund/seller/${refundId}/approve`),
  sellerRejectRefund: (refundId, reason) => api.patch(`/return-refund/seller/${refundId}/reject`, { reason }),
  sellerSubmitFeedback: (refundId, feedback) => api.patch(`/return-refund/seller/${refundId}/feedback`, { feedback }),
  getAllRefunds: (params) => api.get('/return-refund/admin/all', { params }),
  updateRefundStatus: (refundId, data) => api.patch(`/return-refund/admin/${refundId}`, data),
  markManualRefund: (refundId, data) => api.patch(`/return-refund/admin/${refundId}/mark-manual-refund`, data || {}),
  requestSellerInput: (refundId, note) => api.patch(`/return-refund/admin/${refundId}/request-seller-input`, { note }),
};

// Wallet APIs
export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
};

// Subscription APIs
export const subscriptionAPI = {
  getSubscriptionPlans: () => api.get('/subscription/plans'),
  getMySubscription: () => api.get('/subscription/me'),
  subscribe: () => api.post('/subscription/subscribe'),
  confirmSubscription: (data) => api.post('/subscription/confirm', data),
  cancelSubscription: () => api.post('/subscription/cancel'),
  renewSubscription: (data) => api.post('/subscription/renew', data),
  // Admin only
  getAllSubscriptions: (params) => api.get('/subscription', { params }),
  getSubscriptionStats: () => api.get('/subscription/stats'),
};

// License Key APIs
export const licenseKeyAPI = {
  getMyLicenseKeys: (params) => api.get('/license-key/my-keys', { params }),
  revealLicenseKey: (keyId) => api.get(`/license-key/${keyId}/reveal`),
};

// Review APIs (additional)
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


// Category APIs (Admin)
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

// Subcategory APIs (Admin)
export const subcategoryAPI = {
  getSubcategories: (params) => api.get('/subcategory/get-subcategories', { params }),
  getSubcategoryById: (subCategoryId) => api.get(`/subcategory/get-subcategory/${subCategoryId}`),
  getSubcategoryBySlug: (categorySlug, subcategorySlug) => api.get(`/subcategory/get-subcategory-by-slug/${categorySlug}/${subcategorySlug}`),
  getSubcategoriesByCategoryId: (categoryId, params) => api.get(`/subcategory/get-subcategories-by-category/${categoryId}`, { params }),
  getSubcategoriesByCategorySlug: (categorySlug, params) => api.get(`/subcategory/get-subcategories-by-category-slug/${categorySlug}`, { params }),
  createSubcategory: (formData) => api.post('/subcategory/create-subcategory', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateSubcategory: (subCategoryId, data) => api.patch(`/subcategory/update-subcategory/${subCategoryId}`, data),
  updateSubcategoryImage: (subCategoryId, formData) => api.patch(`/subcategory/update-subcategory-image/${subCategoryId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateSubcategoryStatus: (subCategoryId, data) => api.post(`/subcategory/update-subcategory-status/${subCategoryId}`, data),
  deleteSubcategory: (subCategoryId) => api.delete(`/subcategory/delete-subcategory/${subCategoryId}`),
};

// Platform APIs (Admin)
export const platformAPI = {
  getAllPlatforms: (params) => api.get('/platform/get-all-platforms', { params }),
  createPlatform: (data) => api.post('/platform/create-platforms', data),
  updatePlatform: (id, data) => api.patch(`/platform/update-platforms-name/${id}`, data),
  togglePlatformStatus: (id) => api.patch(`/platform/update-platforms-status/${id}/toggle-status`),
  deletePlatform: (id) => api.delete(`/platform/delete-platforms/${id}`),
};

// Device APIs (Admin)
export const deviceAPI = {
  getDevices: (params) => api.get('/device/get-devices', { params }),
  getDeviceById: (id) => api.get(`/device/get-device/${id}`),
  createDevice: (data) => api.post('/device/create-device', data),
  updateDevice: (id, data) => api.patch(`/device/update-device/${id}`, data),
  toggleDeviceStatus: (id) => api.post(`/device/toggle-device-status/${id}`),
  deleteDevice: (id) => api.delete(`/device/delete-device/${id}`),
};

// Region APIs (Admin)
export const regionAPI = {
  getRegions: (params) => api.get('/region/get-regions', { params }),
  getRegionById: (regionId) => api.get(`/region/get-region/${regionId}`),
  createRegion: (data) => api.post('/region/create-region', data),
  updateRegion: (regionId, data) => api.patch(`/region/update-region/${regionId}`, data),
  deleteRegion: (regionId) => api.delete(`/region/delete-region/${regionId}`),
};

// Genre APIs (Admin)
export const genreAPI = {
  getGenres: (params) => api.get('/genre/get-genres', { params }),
  createGenre: (data) => api.post('/genre/create-genre', data),
  updateGenre: (id, data) => api.patch(`/genre/update-genre/${id}`, data),
  deleteGenre: (id) => api.delete(`/genre/delete-genre/${id}`),
};

// Theme APIs (Admin)
export const themeAPI = {
  getThemes: (params) => api.get('/theme/get-themes', { params }),
  createTheme: (data) => api.post('/theme/create-theme', data),
  updateTheme: (id, data) => api.patch(`/theme/update-theme/${id}`, data),
  deleteTheme: (id) => api.delete(`/theme/delete-theme/${id}`),
};

// Mode APIs (Admin)
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


// Flash Deal APIs
export const flashDealAPI = {
  getFlashDeals: () => api.get('/flash-deal'),
  getFlashDealById: (id) => api.get(`/flash-deal/${id}`),
  // Admin only
  getAllFlashDeals: () => api.get('/flash-deal/admin/all'),
  createFlashDeal: (formData) => api.post('/flash-deal', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateFlashDeal: (id, formData) => api.patch(`/flash-deal/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteFlashDeal: (id) => api.delete(`/flash-deal/${id}`),
};


// Homepage Slider APIs
export const homepageSliderAPI = {
  getHomepageSliders: () => api.get('/homepage-slider'),
  getHomepageSliderById: (id) => api.get(`/homepage-slider/${id}`),
  // Admin only
  getAllHomepageSliders: () => api.get('/homepage-slider/admin/all'),
  createHomepageSlider: (formData) => api.post('/homepage-slider', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateHomepageSlider: (id, formData) => api.patch(`/homepage-slider/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteHomepageSlider: (id) => api.delete(`/homepage-slider/${id}`),
};

// Trending Category APIs
export const trendingCategoryAPI = {
  getTrendingCategories: () => api.get('/trending-category'),
  getTrendingCategoryById: (id) => api.get(`/trending-category/${id}`),
  // Admin only
  getAllTrendingCategories: () => api.get('/trending-category/admin/all'),
  updateTrendingCategories: (data) => api.post('/trending-category/update', data),
};

// Bestseller APIs
export const bestsellerAPI = {
  getBestsellers: (params) => api.get('/bestseller', { params }),
  getBestsellerByProduct: (productId) => api.get(`/bestseller/product/${productId}`),
};

// Bundle Deal APIs (Public)
export const bundleDealAPI = {
  getActiveBundleDeals: () => api.get('/bundle-deal/active'),
  getBundleDealById: (id) => api.get(`/bundle-deal/${id}`),
};

// Trending Offer APIs
export const trendingOfferAPI = {
  getTrendingOffers: () => api.get('/trending-offer'),
  getTrendingOfferById: (id) => api.get(`/trending-offer/${id}`),
  getOfferByProduct: (productId) => api.get(`/trending-offer/product/${productId}`),
  // Admin only
  getAllTrendingOffers: (params) => api.get('/trending-offer/admin/all', { params }),
  createTrendingOffer: (data) => api.post('/trending-offer', data),
  updateTrendingOffer: (id, data) => api.patch(`/trending-offer/${id}`, data),
  deleteTrendingOffer: (id) => api.delete(`/trending-offer/${id}`),
  updateAllStatuses: () => api.post('/trending-offer/admin/update-statuses'),
};

// Upcoming Release APIs
export const upcomingReleaseAPI = {
  getUpcomingReleases: () => api.get('/upcoming-release'),
  // Admin only
  getUpcomingReleasesConfig: () => api.get('/upcoming-release/admin'),
  updateSlot: (slotNumber, data) => api.put(`/upcoming-release/slot/${slotNumber}`, data),
  updateSlotImage: (slotNumber, formData) => api.put(`/upcoming-release/slot/${slotNumber}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Upcoming Games APIs
export const upcomingGamesAPI = {
  getUpcomingGames: () => api.get('/upcoming-games'),
  // Admin only
  getUpcomingGamesConfig: () => api.get('/upcoming-games/admin'),
  addProducts: (data) => api.post('/upcoming-games/add', data),
  removeProducts: (data) => api.delete('/upcoming-games/remove', { data }),
  reorderProducts: (data) => api.put('/upcoming-games/reorder', data),
  updateUpcomingGames: (data) => api.put('/upcoming-games', data),
};

// Software Page APIs
export const softwareAPI = {
  getSoftwarePage: () => api.get('/product/pages/software'),
};

// SEO APIs (Public)
export const seoAPI = {
  getHomePageSEO: () => api.get('/seo/home'),
};