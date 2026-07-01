import api from '@lib/axios';

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
