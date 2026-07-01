import api from '@lib/axios';

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

// SEO APIs (Public)
export const seoAPI = {
  getHomePageSEO: () => api.get('/seo/home'),
};
