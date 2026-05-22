/**
 * Utility functions for product-related calculations
 */

export const PRODUCT_IMAGE_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22 viewBox=%220 0 300 300%22%3E%3Crect width=%22300%22 height=%22300%22 fill=%22%231f2937%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 fill=%22%239ca3af%22 font-family=%22Arial,sans-serif%22 font-size=%2224%22 text-anchor=%22middle%22 dy=%22.35em%22%3ENo Image%3C/text%3E%3C/svg%3E';

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

  const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;
  const originalPrice = round2(Number(product.price) || 0);
  const discountPercentRaw =
    product.trendingOffer?.discountPercent ??
    product.trendingOffer?.discountPercentage ??
    product.discountPercentage ??
    product.discountPercent ??
    product.discount ??
    0;
  const discountPercentage = Math.max(0, Number(discountPercentRaw) || 0);

  const discountedPriceRaw =
    product.discountedPrice ??
    product.salePrice ??
    product?.pricing?.discountedPrice ??
    null;
  const discountedPriceNum = Number(discountedPriceRaw);
  const hasApiDiscountedPrice =
    discountedPriceRaw !== null &&
    discountedPriceRaw !== undefined &&
    Number.isFinite(discountedPriceNum) &&
    discountedPriceNum > 0 &&
    discountedPriceNum < originalPrice;

  let discountPrice = originalPrice;
  if (hasApiDiscountedPrice) {
    discountPrice = round2(discountedPriceNum);
  } else if (discountPercentage > 0 && discountPercentage <= 100) {
    discountPrice = round2(originalPrice * (1 - discountPercentage / 100));
  }

  return {
    discountPrice: Math.max(0, Math.min(originalPrice, discountPrice)),
    discountPercentage:
      discountPercentage > 0 && discountPercentage <= 100
        ? discountPercentage
        : originalPrice > 0 && discountPrice < originalPrice
          ? round2(((originalPrice - discountPrice) / originalPrice) * 100)
          : 0,
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
    const image = product.images[index];
    if (typeof image === 'string' && image.trim()) {
      return image.trim();
    }
  }
  return PRODUCT_IMAGE_PLACEHOLDER;
};

/**
 * Get product display name
 * @param {Object} product - Product object
 * @returns {string} - Product name or fallback
 */
export const getProductName = (product) => {
  return product?.name || 'Unnamed Product';
};

const MONGO_OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

export const isMongoObjectId = (value) =>
  MONGO_OBJECT_ID_PATTERN.test(String(value ?? '').trim());

/** Public product detail path; prefers slug over MongoDB id. */
export const getProductPath = (product) => {
  const slug = typeof product?.slug === 'string' ? product.slug.trim() : '';
  if (slug) return `/product/${slug}`;

  const id = product?._id ?? product?.id;
  if (id != null && String(id).trim()) {
    return `/product/${String(id).trim()}`;
  }

  return '/search';
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