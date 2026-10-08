import { PRODUCT_IMAGE_PLACEHOLDER } from '@lib/placeholders';
export { PRODUCT_IMAGE_PLACEHOLDER };

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

export const getProductImage = (product, index = 0) => {
  if (product?.images && Array.isArray(product.images) && product.images.length > index) {
    const image = product.images[index];
    if (typeof image === 'string' && image.trim()) {
      return image.trim();
    }
  }
  return PRODUCT_IMAGE_PLACEHOLDER;
};

export const getProductName = (product) => {
  return product?.name || 'Unnamed Product';
};

const MONGO_OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

export const isMongoObjectId = (value) =>
  MONGO_OBJECT_ID_PATTERN.test(String(value ?? '').trim());

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

  if (normalized.includes('_')) {
    return normalized
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  return value.trim();
};

export const getPlatformName = (product) => {
  return (
    normalizeEntityName(product?.platform) ||
    normalizeEntityName(product?.platformId) ||
    normalizeEntityName(product?.platformName) ||
    'Unknown Platform'
  );
};

export const getRegionName = (product) => {
  return product?.region?.name || 'Global';
};

export const PRODUCT_TYPE_OPTIONS = [
  { _id: 'LICENSE_KEY', title: 'Key' },
  { _id: 'ACCOUNT_BASED', title: 'Account' },
  { _id: 'GIFT', title: 'Gift' },
  { _id: 'ACTIVATION_LINK', title: 'Activation Link' },
];

export const getTypeName = (product) => {
  return mapProductTypeValue(normalizeEntityName(product?.productType)) || 'Unknown Type';
};

export const getDeviceName = (product) => {
  return product?.device?.name || 'Unknown Device';
};
export const getCardRegionOffer = (product) => {
  if (product?.offerRegionCodes === undefined && product?.bestOfferRegionCodes === undefined) return null;
  return {
    regionCodes: product.offerRegionCodes || product.bestOfferRegionCodes || [],
    countries: product.bestOfferCountries || [],
    excludedCountries: product.bestOfferExcludedCountries || [],
  };
};

export const effectiveOfferPrice = (offer) => {
  const base = Number(offer?.price) || 0;
  const discount = Number(offer?.discount) || 0;
  return discount > 0 ? Math.round(base * (1 - discount / 100) * 100) / 100 : base;
};

export const selectFeaturedOffer = (offers, bestOffer, isCompatible) => {
  const all = offers || [];
  const inStock = all.filter((o) => o?.inStock);

  const pool = inStock.length ? inStock : all;
  if (!pool.length) return bestOffer || null;

  const byPrice = [...pool].sort((a, b) => effectiveOfferPrice(a) - effectiveOfferPrice(b));
  return byPrice.find((o) => isCompatible(o) !== false) || byPrice[0];
};

export const canBuyQuantity = (stock, qty, isPreorder) =>
  Boolean(isPreorder) || (Number(stock) > 0 && Number(stock) >= Number(qty));

export const isAllOutOfStock = (product, isActivePreorder) => {
  if (isActivePreorder) return false;
  if (typeof product?.allOutOfStock === 'boolean') return product.allOutOfStock;
  const offers = product?.offers || [];
  return offers.length > 0 && offers.every((o) => !o?.inStock);
};
