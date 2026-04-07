/**
 * Utility functions for product-related calculations
 */

/**
 * Calculate product price with discounts
 * @param {Object} product - Product object
 * @returns {Object} - { discountPrice, discountPercentage, originalPrice }
 */
export const calculateProductPrice = (product) => {
  if (!product || typeof product.price !== 'number') {
    const parsedPrice = Number(product?.price);
    if (!Number.isFinite(parsedPrice)) {
      return {
        discountPrice: 0,
        discountPercentage: 0,
        originalPrice: 0,
      };
    }
    // Continue with parsed numeric string/values.
    product = { ...product, price: parsedPrice };
  }

  const originalPrice = Number(product.price) || 0;
  let discountPrice = originalPrice;
  let discountPercentage = 0;
  if (product.trendingOffer?.discountPercent) {
    discountPercentage = Number(product.trendingOffer.discountPercent) || 0;
    discountPrice = originalPrice * (1 - discountPercentage / 100);
  } else if (product.discount) {
    discountPercentage = Number(product.discount) || 0;
    discountPrice = originalPrice * (1 - discountPercentage / 100);
  }

  return {
    discountPrice,
    discountPercentage,
    originalPrice,
  };
};

/**
 * Format price for display
 * @param {number} price - Price to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price, currency = 'USD') => {
  if (typeof price !== 'number' || isNaN(price)) {
    return `0.00 ${currency}`;
  }
  return `${price.toFixed(2)} ${currency}`;
};

/**
 * Get product image URL
 * @param {Object} product - Product object
 * @param {number} index - Image index (default: 0)
 * @returns {string} - Image URL or placeholder
 */
export const getProductImage = (product, index = 0) => {
  if (product?.images && Array.isArray(product.images) && product.images.length > index) {
    return product.images[index];
  }
  return 'https://via.placeholder.com/300x300?text=No+Image';
};

/**
 * Get product display name
 * @param {Object} product - Product object
 * @returns {string} - Product name or fallback
 */
export const getProductName = (product) => {
  return product?.name || 'Unnamed Product';
};

const normalizeEntityName = (value) => {
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();
    const isMongoId = /^[a-f0-9]{24}$/i.test(trimmed);
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);
    if (isMongoId || isUuid) return '';
    return trimmed;
  }
  if (value && typeof value === 'object') {
    if (typeof value.name === 'string' && value.name.trim()) return value.name.trim();
    if (typeof value.title === 'string' && value.title.trim()) return value.title.trim();
    if (typeof value.label === 'string' && value.label.trim()) return value.label.trim();
  }
  return '';
};

const mapProductTypeValue = (value) => {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toUpperCase();
  if (!normalized) return '';

  if (normalized === 'ACCOUNT_BASED' || normalized === 'ACCOUNT') return 'Account';
  if (normalized === 'LICENSE_KEY' || normalized === 'LICENSE' || normalized === 'KEY') return 'Key';

  // Keep readable labels from backend/type tables
  if (normalized.includes('_')) {
    return normalized
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  return value.trim();
};

/**
 * Get platform name
 * @param {Object} product - Product object
 * @returns {string} - Platform name or fallback
 */
export const getPlatformName = (product) => {
  return (
    normalizeEntityName(product?.platform) ||
    normalizeEntityName(product?.platformId) ||
    normalizeEntityName(product?.platformName) ||
    'Unknown Platform'
  );
};

/**
 * Get region name
 * @param {Object} product - Product object
 * @returns {string} - Region name or fallback
 */
export const getRegionName = (product) => {
  return product?.region?.name || 'Global';
};

/**
 * Get type name
 * @param {Object} product - Product object
 * @returns {string} - Type name or fallback
 */
export const getTypeName = (product) => {
  const productType = mapProductTypeValue(
    normalizeEntityName(product?.productType) ||
    normalizeEntityName(product?.type)
  );
  return productType || 'Unknown Type';
};

/**
 * Get device name
 * @param {Object} product - Product object
 * @returns {string} - Device name or fallback
 */
export const getDeviceName = (product) => {
  return product?.device?.name || 'Unknown Device';
};

export const getKeyTypeName = (product) => {
  return getTypeName(product);
};

export const getKeyType = (product) => {
  return getTypeName(product);
};