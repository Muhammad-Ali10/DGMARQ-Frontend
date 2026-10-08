export const GUEST_CART_KEY = 'dgmarq_guest_cart';

function safeParse(json, fallback) {
  try {
    if (json == null || json === '') return fallback;
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getGuestCart() {
  if (typeof window === 'undefined') return { items: [] };
  const raw = localStorage.getItem(GUEST_CART_KEY);
  const parsed = safeParse(raw, { items: [] });
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  return { items };
}

export function setGuestCart(cart) {
  if (typeof window === 'undefined') return;
  const payload = { items: Array.isArray(cart?.items) ? cart.items : [] };
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(payload));
}

const idOf = (value) => (value == null ? '' : String(value._id || value));

const isLine = (item, productId, sellerId) => {
  if (idOf(item.productId) !== productId) return false;
  const stored = idOf(item.sellerId);
  return !stored || stored === sellerId;
};

export function addToGuestCart({
  productId,
  qty = 1,
  price,
  originalPrice,
  discountPercentage,
  sellerId,
  shopName,
  name,
  slug,
  image,
  platformName,
  typeName,
}) {
  const cart = getGuestCart();
  const id = idOf(productId);
  if (!id) return cart;
  const seller = idOf(sellerId);
  const existing = cart.items.find(
    (i) => idOf(i.productId) === id && idOf(i.sellerId) === seller
  );
  const numQty = Math.max(1, parseInt(qty, 10) || 1);
  if (existing) {
    existing.qty = (existing.qty || 0) + numQty;
  } else {
    cart.items.push({
      productId: id,
      qty: numQty,
      price: price != null ? Number(price) : 0,
      originalPrice: originalPrice != null ? Number(originalPrice) : undefined,
      discountPercentage:
        discountPercentage != null ? Number(discountPercentage) : undefined,
      sellerId: seller || undefined,
      shopName: shopName || undefined,
      name: name || undefined,
      slug: slug || undefined,
      image: image || undefined,
      platformName: platformName || undefined,
      typeName: typeName || undefined,
    });
  }
  setGuestCart(cart);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('guestCartChange'));
  return getGuestCart();
}

export function removeFromGuestCart(productId, sellerId) {
  const cart = getGuestCart();
  const id = idOf(productId);
  const seller = idOf(sellerId);
  const index = cart.items.findIndex((i) => isLine(i, id, seller));
  if (index !== -1) cart.items.splice(index, 1);
  setGuestCart(cart);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('guestCartChange'));
  return getGuestCart();
}

export function updateGuestCartQuantity(productId, sellerId, qty) {
  const cart = getGuestCart();
  const id = idOf(productId);
  const seller = idOf(sellerId);
  if (qty <= 0) return removeFromGuestCart(id, seller);
  const item = cart.items.find((i) => isLine(i, id, seller));
  if (item) item.qty = Math.max(1, parseInt(qty, 10) || 1);
  setGuestCart(cart);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('guestCartChange'));
  return getGuestCart();
}

export function clearGuestCart() {
  setGuestCart({ items: [] });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('guestCartChange'));
  return { items: [] };
}

export function getGuestCartCount() {
  const { items } = getGuestCart();
  return items.reduce((sum, i) => sum + (i.qty || 0), 0);
}
