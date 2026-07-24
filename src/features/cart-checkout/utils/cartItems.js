// Shared cart line model — used by both the Cart and Checkout pages so the two
// stay in lockstep. Auth lines come from the server cart (populated product),
// guest lines from localStorage, which carries a thinner subset of the fields.

// Delivery is derived from productType (owner-locked): everything we sell is
// delivered instantly. The mockup's Manual/"5–30 min" variants belong to
// in-game top-up/boosting/player-trade, which this marketplace doesn't model.
export const DELIVERY_LABEL = "Instant";

// The design prints a short human type ("Key"), not the raw enum
// ("LICENSE_KEY"). Unknown values fall back to a de-underscored form.
const PRODUCT_TYPE_LABEL = {
  LICENSE_KEY: "Key",
  ACCOUNT_BASED: "Account",
};

export const productTypeLabel = (productType) => {
  if (!productType) return null;
  return PRODUCT_TYPE_LABEL[productType] || String(productType).replace(/_/g, " ");
};

// The mockup hardcodes "PC / Desktop" when a product carries no device.
export const DEVICE_FALLBACK = "PC / Desktop";

const fromServer = (it) => ({
  key: `${it.product?._id || it.product}|${it.sellerId || ""}`,
  productId: it.product?._id || it.product,
  name: it.product?.name || "Product",
  image: it.product?.images?.[0],
  slug: it.product?.slug || it.product?._id,
  platform: it.product?.platform?.name || null,
  productType: it.product?.productType || null,
  device: it.product?.device?.name || null,
  categoryId: it.product?.categoryId?._id || null,
  region: it.offerRegion || null,
  price: it.discountedPrice ?? it.unitPrice ?? 0,
  original: it.originalPrice ?? null,
  discountPct: it.discountPercentage || 0,
  hasDiscount: !!it.hasDiscount,
  stock: it.availableKeys ?? null,
  seller: it.sellerShopName || null,
  sellerId: it.sellerId || null,
  sellerRating: it.sellerRating ?? null,
  qty: it.qty || 1,
  isPreorder: !!it.isPreorder,
});

// Guest lines never carry device/region/stock/rating — those spec rows simply
// don't render until the buyer signs in and the server cart fills them in.
const fromGuest = (it) => ({
  key: it.productId?._id || it.productId,
  productId: it.productId?._id || it.productId,
  name: it.name || "Product",
  image: it.image,
  slug: it.slug || it.productId?._id || it.productId,
  platform: it.platformName || null,
  productType: it.typeName || null,
  device: null,
  categoryId: null,
  region: null,
  price: Number(it.price) || 0,
  original: it.originalPrice != null ? Number(it.originalPrice) : null,
  discountPct: Number(it.discountPercentage) || 0,
  hasDiscount: Number(it.discountPercentage) > 0,
  stock: null,
  seller: it.shopName || null,
  sellerId: it.sellerId || null,
  sellerRating: null,
  qty: it.qty || 1,
  isPreorder: false,
});

/** One render model for both auth (server) and guest (localStorage) lines. */
export const toCartItems = (rawItems, isAuthenticated) =>
  (rawItems || []).map(isAuthenticated ? fromServer : fromGuest);
