import api from '@lib/axios';

export const productAPI = {
  getProducts: (params) => api.get('/product/get-products', { params }),
  getProductById: (id) => api.get(`/product/${id}`),
  suggestProducts: (params) => api.get('/product/suggest', { params, skipErrorToast: true }),
  updateProductImages: (id, formData) => api.patch(`/product/update-product-images/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getUploadKeysStatus: (productId, jobId) => api.get(`/product/${productId}/upload-keys/status/${jobId}`),
};

export const categoryAPI = {
  getCategories: (params) => api.get('/category/get-categories', { params }),
  getCategoryById: (categoryId) => api.get(`/category/get-category/${categoryId}`),
  getCategoryBySlug: (slug) => api.get(`/category/get-category-by-slug/${encodeURIComponent(slug)}`, { skipErrorToast: true }),
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
  getHomepageSubcategories: () => api.get('/subcategory/homepage'),
  updateSubcategoryImage: (subCategoryId, formData) => api.patch(`/subcategory/update-subcategory-image/${subCategoryId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getSubcategoryById: (subCategoryId) => api.get(`/subcategory/get-subcategory/${subCategoryId}`),
  getSubcategoryBySlug: (categorySlug, subcategorySlug) => api.get(`/subcategory/get-subcategory-by-slug/${categorySlug}/${subcategorySlug}`),
  getSubcategoriesByCategoryId: (categoryId, params) => api.get(`/subcategory/get-subcategories-by-category/${categoryId}`, { params }),
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
  createDevice: (data) => api.post('/device/create-device', data),
  updateDevice: (id, data) => api.patch(`/device/update-device/${id}`, data),
  toggleDeviceStatus: (id) => api.post(`/device/toggle-device-status/${id}`),
  deleteDevice: (id) => api.delete(`/device/delete-device/${id}`),
};

export const geoAPI = {
  getCountry: () => api.get('/geo/country'),
};

export const currencyAPI = {
  getRates: () => api.get('/currency/rates'),
  setDisplayCurrency: (currency) => api.patch('/currency/preference', { currency }),
};

export const regionAPI = {
  getRegions: (params) => api.get('/region/get-regions', { params }),
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

export const masterCatalogAPI = {
  importCatalog: (formData) => api.post('/catalog/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
  listProducts: (params) => api.get('/catalog/products', { params }),
  createProduct: (formData) => api.post('/catalog/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateProduct: (id, data) => api.patch(`/catalog/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/catalog/products/${id}`),
  getProductOffers: (id) => api.get(`/catalog/products/${id}/offers`),
};

export const offerAPI = {
  browseCatalog: (params) => api.get('/offer/catalog', { params }),
  getMyOffers: (params) => api.get('/offer/mine', { params }),
  getMyOfferSummary: () => api.get('/offer/mine/summary'),
  getOffer: (id) => api.get(`/offer/${id}`),
  createOffer: (data) => api.post('/offer', data),
  updateOffer: (id, data) => api.patch(`/offer/${id}`, data),
  deleteOffer: (id) => api.delete(`/offer/${id}`),
  uploadOfferKeys: (id, keys) => api.post(`/offer/${id}/keys`, { keys }),
  getOfferKeys: (id, params) => api.get(`/offer/${id}/keys`, { params }),
  revealOfferKey: (id, keyId) => api.get(`/offer/${id}/keys/${keyId}/reveal`),
  deleteOfferKey: (id, keyId) => api.delete(`/offer/${id}/keys/${keyId}`),
  syncOfferStock: (id) => api.post(`/offer/${id}/sync-stock`),
  requestFeatured: (id, featured) => api.post(`/offer/${id}/featured`, { featured }),
  adminGetOffers: (params) => api.get('/offer/admin', { params }),
  adminGetOfferCounts: () => api.get('/offer/admin/counts'),
  adminApproveOffer: (id) => api.post(`/offer/admin/${id}/approve`),
  adminRejectOffer: (id, data) => api.post(`/offer/admin/${id}/reject`, data),
  adminRemoveOffer: (id, data) => api.post(`/offer/admin/${id}/remove`, data),
  adminRestoreOffer: (id) => api.post(`/offer/admin/${id}/restore`),
  adminDecideFeatured: (id, data) => api.post(`/offer/admin/${id}/featured`, data),
};

export const bestsellerAPI = {
  getBestsellers: (params) => api.get('/bestseller', { params }),
};

export const softwareAPI = {
  getSoftwarePage: () => api.get('/product/pages/software'),
};
