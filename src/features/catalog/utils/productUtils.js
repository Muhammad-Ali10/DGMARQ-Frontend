/**
 * Utility functions for product-related calculations
 */

// Imported from the shared lib layer (so `ui/SafeImage` can source it without a
// ui→feature dependency) and re-exported so existing `@features/catalog`
// consumers keep working. The local import also keeps it in scope for the
// helpers below (e.g. getProductImage).
import { PRODUCT_IMAGE_PLACEHOLDER } from '@lib/placeholders';
export { PRODUCT_IMAGE_PLACEHOLDER };

/**
 * Calculate product price with discounts.
 *
 * W10 — cards used to ignore seller discounts entirely.
 *
 * `product.price` is the master's `lowestPrice` rollup: the cheapest live
 * offer's BASE price, before that seller's own discount. `product.discount` is
 * a legacy master-level field that `recalcProductRollups` never writes, so on
 * an offer-backed product it is almost always 0. Between them the card showed
 * the undiscounted price for every seller discount on the site, while:
 *
 *   - the product DETAIL page priced the chosen offer with its discount applied
 *     (calculateProductPrice(featuredOffer) — the offer carries price+discount);
 *   - the wishlist price-drop EMAIL quoted `lowestEffectivePrice`, the cheapest
 *     price across offers after each seller's discount.
 *
 * So a seller running 20% off a $10 listing produced a "$10.00" card, an
 * "$8.00" product page, and an email saying it had dropped to $8.00. Reading
 * `lowestEffectivePrice` here is what makes the three agree.
 *
 * An absolute `discountedPrice` from the API still wins over a standing
 * discount percentage.
 *
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
    product.discountPercentage ??
    product.discountPercent ??
    product.discount ??
    0;
  const discountPercentage = Math.max(0, Number(discountPercentRaw) || 0);

  const discountedPriceRaw =
    product.discountedPrice ??
    product.salePrice ??
    product?.pricing?.discountedPrice ??
    // M19 rollup: cheapest live offer AFTER that seller's discount. Last in the
    // chain so an explicit price from the API above still takes precedence.
    product.lowestEffectivePrice ??
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

  const finalPrice = Math.max(0, Math.min(originalPrice, discountPrice));

  // When an absolute discounted price won, DERIVE the percentage from the two
  // prices rather than trusting a percentage field.
  //
  // Otherwise the badge and the price can contradict each other: a product
  // whose master `discount` still reads 10 from some earlier admin edit, but
  // whose live offer is 20% off, would render "-10%" beside a price that is 20%
  // lower. Rounded to a whole number because the effective price is itself
  // rounded to 2dp, which turns an exact 20% off $9.99 into 20.02%.
  const derivedPercentage =
    originalPrice > 0 && finalPrice < originalPrice
      ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
      : 0;

  return {
    discountPrice: finalPrice,
    discountPercentage:
      hasApiDiscountedPrice || !(discountPercentage > 0 && discountPercentage <= 100)
        ? derivedPercentage
        : discountPercentage,
    originalPrice,
  };
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
  if (normalized === 'GIFT') return 'Gift';

  // Anything else (ACTIVATION_LINK -> "Activation Link") becomes Title Case
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
/**
 * The delivery models a buyer can filter by — the backend `productType` enum
 * with the same short labels the cards show. There is no Type taxonomy any
 * more, so this list is fixed and needs no request.
 */
export const PRODUCT_TYPE_OPTIONS = [
  { _id: 'LICENSE_KEY', title: 'Key' },
  { _id: 'ACCOUNT_BASED', title: 'Account' },
  { _id: 'GIFT', title: 'Gift' },
  { _id: 'ACTIVATION_LINK', title: 'Activation Link' },
];

export const getTypeName = (product) => {
  return mapProductTypeValue(normalizeEntityName(product?.productType)) || 'Unknown Type';
};

/**
 * Get device name
 * @param {Object} product - Product object
 * @returns {string} - Device name or fallback
 */
export const getDeviceName = (product) => {
  return product?.device?.name || 'Unknown Device';
};
/**
 * What a seller's offer actually costs the buyer: base price minus that
 * seller's own discount, rounded to 2dp.
 *
 * Mirrors the backend's `effectiveOfferPrice` (utils/priceCalculator.js) exactly,
 * INCLUDING the rounding — the two must agree or the price the buy box shows
 * and the price checkout charges can differ by a cent.
 *
 * @param {object} offer  { price, discount }
 * @returns {number}
 */
export const effectiveOfferPrice = (offer) => {
  const base = Number(offer?.price) || 0;
  const discount = Number(offer?.discount) || 0;
  return discount > 0 ? Math.round(base * (1 - discount / 100) * 100) / 100 : base;
};

/**
 * CLIENT REQ (out-of-stock automation, requirement 3): pick the offer the buy
 * box represents — "next cheapest seller auto-shown if the cheapest is out of
 * stock".
 *
 * Out-of-stock sellers are excluded outright, so the cheapest REMAINING seller
 * is promoted automatically. Among those, the cheapest one the buyer can
 * actually activate wins, so nobody is defaulted into a key that will not work
 * in their country; if no seller covers them, the cheapest in-stock offer is
 * still shown (with the region warning the badge renders separately).
 *
 * "Cheapest" means cheapest EFFECTIVE price — after each seller's own discount.
 *
 * It used to mean cheapest BASE price, which picked the wrong seller whenever a
 * pricier listing was discounted below a cheaper one: a $12 offer at 50% off
 * ($6) lost to an undiscounted $10 offer. That put the more expensive option in
 * the buy box, and it disagreed with the card, which reads the master's
 * `lowestEffectivePrice` rollup — a minimum over effective prices. Same product,
 * two different prices depending on which page you were on.
 *
 * When every seller is out of stock this still picks the cheapest effective
 * offer, from ALL of them, mirroring the backend rollup's own fallback
 * (`pricePool = inStock.length ? inStock : offers`). The server's `bestOffer` is
 * used only when there are no offers to choose from at all.
 *
 * @param {Array<object>} offers      live offers, each with { price, discount, inStock }
 * @param {object|null} bestOffer     server-picked fallback
 * @param {(offer: object) => boolean|null} isCompatible
 *   region verdict: false = cannot activate, true/null = can or unknown
 * @returns {object|null}
 */
export const selectFeaturedOffer = (offers, bestOffer, isCompatible) => {
  const all = offers || [];
  const inStock = all.filter((o) => o?.inStock);

  // Nothing buyable: price the cheapest offer there IS, so the out-of-stock
  // state shows the same figure the card does. Only with no offers at all does
  // the server's fallback apply.
  const pool = inStock.length ? inStock : all;
  if (!pool.length) return bestOffer || null;

  const byPrice = [...pool].sort((a, b) => effectiveOfferPrice(a) - effectiveOfferPrice(b));
  return byPrice.find((o) => isCompatible(o) !== false) || byPrice[0];
};

/**
 * CLIENT REQ (out-of-stock automation, requirement 4): a master product is
 * "Out of Stock" ONLY when EVERY live seller under it is out — one seller
 * running dry just promotes the next cheapest (see selectFeaturedOffer).
 *
 * Trusts the server's `allOutOfStock` when present and derives it otherwise.
 * A product with no offers at all is not "out of stock" — it is unlisted, and
 * the detail route does not serve it.
 *
 * @param {object} product
 * @param {boolean} isActivePreorder  an unreleased pre-order is bought WITHOUT
 *   stock, so it is never out of stock
 * @returns {boolean}
 */
export const isAllOutOfStock = (product, isActivePreorder) => {
  if (isActivePreorder) return false;
  if (typeof product?.allOutOfStock === 'boolean') return product.allOutOfStock;
  const offers = product?.offers || [];
  return offers.length > 0 && offers.every((o) => !o?.inStock);
};
