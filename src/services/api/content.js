import api from '@lib/axios';

export const homepageSliderAPI = {
  getHomepageSliders: () => api.get('/homepage-slider'),
  getAllHomepageSliders: (params) => api.get('/homepage-slider/admin/all', { params }),
  createHomepageSlider: (formData) => api.post('/homepage-slider', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateHomepageSlider: (id, formData) => api.patch(`/homepage-slider/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteHomepageSlider: (id) => api.delete(`/homepage-slider/${id}`),
};

export const homepageSectionAPI = {
  getHomepageSections: () => api.get('/homepage-section'),
  getAllHomepageSections: () => api.get('/homepage-section/admin/all'),
  createHomepageSection: (data) => api.post('/homepage-section', data),
  updateHomepageSection: (id, data) => api.patch(`/homepage-section/${id}`, data),
  deleteHomepageSection: (id) => api.delete(`/homepage-section/${id}`),
};

export const storefrontAPI = {
  getConfig: () => api.get('/storefront/config'),
  updateTrustTiles: (tiles) => api.patch('/storefront/trust-tiles', { tiles }),
  updateSearchWords: (words) => api.patch('/storefront/search-words', { words }),
  uploadTrustTileImage: (formData) => api.post('/storefront/trust-tile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const menuAPI = {
  getMenu: () => api.get('/menu'),
  getMenuAdmin: () => api.get('/menu/admin/all'),
  createMenuItem: (data) => api.post('/menu', data),
  updateMenuItem: (id, data) => api.patch(`/menu/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/menu/${id}`),
  reorderMenu: (items) => api.patch('/menu/reorder', { items }),
  fillSubcategories: (headingId) => api.post(`/menu/${headingId}/fill-subcategories`),
};

export const upcomingGamesAPI = {
  getUpcomingGames: () => api.get('/upcoming-games'),
  getUpcomingGamesConfig: () => api.get('/upcoming-games/admin'),
  addProducts: (data) => api.post('/upcoming-games/add', data),
  removeProducts: (data) => api.delete('/upcoming-games/remove', { data }),
  reorderProducts: (data) => api.put('/upcoming-games/reorder', data),
};

export const seoAPI = {
  getHomePageSEO: () => api.get('/seo/home'),
};

export const legalAPI = {
  getFigures: () => api.get('/legal/figures'),
};
