const PRODUCT_TYPE_LABEL = {
  LICENSE_KEY: "Key",
  ACCOUNT_BASED: "Account",
};

export const productTypeLabel = (productType) => {
  if (!productType) return null;
  return PRODUCT_TYPE_LABEL[productType] || String(productType).replace(/_/g, " ");
};

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
  stock: it.isPreorder ? null : it.availableKeys ?? null,
  unavailable: !!it.offerUnavailable,
  stockShort: !it.offerUnavailable && it.isAvailable === false,
  availabilityMessage: it.availabilityMessage || null,
  seller: it.sellerShopName || null,
  sellerId: it.sellerId || null,
  sellerRating: it.sellerRating ?? null,
  qty: it.qty || 1,
  isPreorder: !!it.isPreorder,
  preorderReleaseDate: it.preorderReleaseDate || null,
});

const fromGuest = (it) => ({
  key: `${it.productId?._id || it.productId}|${it.sellerId || ""}`,
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
  unavailable: false,
  stockShort: false,
  availabilityMessage: null,
  seller: it.shopName || null,
  sellerId: it.sellerId || null,
  sellerRating: null,
  qty: it.qty || 1,
  isPreorder: false,
  preorderReleaseDate: null,
});

export const toCartItems = (rawItems, isAuthenticated) =>
  (rawItems || []).map(isAuthenticated ? fromServer : fromGuest);
