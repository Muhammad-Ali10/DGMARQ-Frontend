import api from '@lib/axios';

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getTopProducts: () => api.get('/analytics/top-products'),
  getRealTimeCounters: () => api.get('/analytics/realtime'),
  getSellerMonthlyAnalytics: (params) => api.get('/analytics/seller/monthly', { params }),
};
