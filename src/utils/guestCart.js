/**
 * Guest cart stored in localStorage. Used when user is not authenticated.
 * Format: { items: [{ productId, qty, price, sellerId, name?, slug? }] }
 * Same key as Checkout expects for guest checkout.
 */
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

export function addToGuestCart({ productId, qty = 1, price, sellerId, name, slug, image }) {
  const cart = getGuestCart();
  const id = (productId && (productId._id || productId)).toString();
  if (!id) return cart;
  const existing = cart.items.find(
    (i) => (i.productId && (i.productId._id || i.productId).toString()) === id
  );
  const numQty = Math.max(1, parseInt(qty, 10) || 1);
  if (existing) {
    existing.qty = (existing.qty || 0) + numQty;
  } else {
    cart.items.push({
      productId: id,
      qty: numQty,
      price: price != null ? Number(price) : 0,
      sellerId: sellerId != null ? (sellerId._id || sellerId).toString() : undefined,
      name: name || undefined,
      slug: slug || undefined,
      image: image || undefined,
    });
  }
  setGuestCart(cart);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('guestCartChange'));
  return getGuestCart();
}

export function removeFromGuestCart(productId) {
  const cart = getGuestCart();
  const id = (productId && (productId._id || productId)).toString();
  cart.items = cart.items.filter(
    (i) => (i.productId && (i.productId._id || i.productId).toString()) !== id
  );
  setGuestCart(cart);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('guestCartChange'));
  return getGuestCart();
}

export function updateGuestCartQuantity(productId, qty) {
  const cart = getGuestCart();
  const id = (productId && (productId._id || productId)).toString();
  if (qty <= 0) return removeFromGuestCart(id);
  const item = cart.items.find(
    (i) => (i.productId && (i.productId._id || i.productId).toString()) === id
  );
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
