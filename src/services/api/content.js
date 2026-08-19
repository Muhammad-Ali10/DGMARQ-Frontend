import api from '@lib/axios';

export const flashDealAPI = {
  getFlashDeals: () => api.get('/flash-deal'),
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
  getAllHomepageSliders: () => api.get('/homepage-slider/admin/all'),
  createHomepageSlider: (formData) => api.post('/homepage-slider', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateHomepageSlider: (id, formData) => api.patch(`/homepage-slider/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteHomepageSlider: (id) => api.delete(`/homepage-slider/${id}`),
};

// M15: admin custom homepage heading-sections (heading + product row → search).
export const homepageSectionAPI = {
  getHomepageSections: () => api.get('/homepage-section'),
  getAllHomepageSections: () => api.get('/homepage-section/admin/all'),
  createHomepageSection: (data) => api.post('/homepage-section', data),
  updateHomepageSection: (id, data) => api.patch(`/homepage-section/${id}`, data),
  deleteHomepageSection: (id) => api.delete(`/homepage-section/${id}`),
};

// M15: admin-editable storefront chrome — homepage trust tiles + the header's
// rotating search hints. One public read, admin-only writes.
export const storefrontAPI = {
  getConfig: () => api.get('/storefront/config'),
  updateTrustTiles: (tiles) => api.patch('/storefront/trust-tiles', { tiles }),
  updateSearchWords: (words) => api.patch('/storefront/search-words', { words }),
  uploadTrustTileImage: (formData) => api.post('/storefront/trust-tile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// M15: admin-built header mega menu (item → heading → link tree).
export const menuAPI = {
  getMenu: () => api.get('/menu'),
  getMenuAdmin: () => api.get('/menu/admin/all'),
  createMenuItem: (data) => api.post('/menu', data),
  updateMenuItem: (id, data) => api.patch(`/menu/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/menu/${id}`),
  reorderMenu: (items) => api.patch('/menu/reorder', { items }),
  // Creates one link per subcategory of the category a heading points at.
  fillSubcategories: (headingId) => api.post(`/menu/${headingId}/fill-subcategories`),
};

export const trendingOfferAPI = {
  getTrendingOffers: () => api.get('/trending-offer'),
  getAllTrendingOffers: (params) => api.get('/trending-offer/admin/all', { params }),
  createTrendingOffer: (data) => api.post('/trending-offer', data),
  updateTrendingOffer: (id, data) => api.patch(`/trending-offer/${id}`, data),
  deleteTrendingOffer: (id) => api.delete(`/trending-offer/${id}`),
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
