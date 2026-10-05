// Shared cart line model — used by both the Cart and Checkout pages so the two
// stay in lockstep. Auth lines come from the server cart (populated product),
// guest lines from localStorage, which carries a thinner subset of the fields.

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
  // The server sends this beside isPreorder. Carrying only the flag meant the
  // cart and checkout could say "PRE-ORDER" but never say WHEN — the one fact
  // the buyer is weighing before they pay.
  preorderReleaseDate: it.preorderReleaseDate || null,
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
  // A guest cannot hold a pre-order at all — ProductDetail and ProductCard turn
  // them away at add-to-cart, and the server refuses one at checkout. Hardcoded
  // false rather than read, so a stale localStorage cart from before that gate
  // cannot present itself as one.
  isPreorder: false,
  preorderReleaseDate: null,
});

/** One render model for both auth (server) and guest (localStorage) lines. */
export const toCartItems = (rawItems, isAuthenticated) =>
  (rawItems || []).map(isAuthenticated ? fromServer : fromGuest);
