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
    return {
      discountPrice: 0,
      discountPercentage: 0,
      originalPrice: 0,
    };
  }

  const originalPrice = product.price;
  let discountPrice = originalPrice;
  let discountPercentage = 0;

  // Trending offer discount takes priority
  if (product.trendingOffer?.discountPercent) {
    discountPercentage = product.trendingOffer.discountPercent;
    discountPrice = originalPrice * (1 - discountPercentage / 100);
  } else if (product.discount) {
    // Regular product discount
    discountPercentage = product.discount;
    discountPrice = originalPrice * (1 - product.discount / 100);
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

/**
 * Get platform name
 * @param {Object} product - Product object
 * @returns {string} - Platform name or fallback
 */
export const getPlatformName = (product) => {
  return product?.platform?.name || 'Unknown Platform';
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
  return product?.type?.name || 'KEY';
};
