import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cartAPI } from '@services/api';
import { getGuestCart, clearGuestCart } from '../utils/guestCart';

/**
 * Owns the guest (localStorage) cart for a page that renders both the guest and
 * the signed-in cart — currently public/Cart and public/Checkout, which carried
 * byte-identical copies of these two effects (F43).
 *
 * 1. Keeps local state in sync with the `guestCartChange` event other components
 *    dispatch (add-to-cart from a product card, the header dropdown, other tabs).
 * 2. On login, merges the guest lines into the server cart exactly once, then
 *    clears localStorage.
 *
 * @param {boolean} isAuthenticated
 * @returns {[Array, Function]} the guest lines and their setter
 */
export function useGuestCart(isAuthenticated) {
  const queryClient = useQueryClient();
  const [guestCartItems, setGuestCartItems] = useState([]);

  // Guest cart lives in localStorage; keep it in sync with other tabs/components.
  useEffect(() => {
    if (isAuthenticated) return undefined;
    const sync = () => setGuestCartItems(getGuestCart().items);
    sync();
    window.addEventListener('guestCartChange', sync);
    return () => window.removeEventListener('guestCartChange', sync);
  }, [isAuthenticated]);

  // On login, merge the guest cart into the server cart (once).
  const guestCartMergedRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated) {
      guestCartMergedRef.current = false;
      return;
    }
    if (guestCartMergedRef.current) return;
    const { items } = getGuestCart();
    if (items.length === 0) return;
    guestCartMergedRef.current = true;
    (async () => {
      for (const item of items) {
        const productId = item.productId && (item.productId._id || item.productId);
        if (!productId) continue;
        try {
          // `sellerId` MUST be forwarded: the guest picked a specific seller's
          // offer, and without it the server falls back to the cheapest offer —
          // silently rebinding the line to a different seller and price.
          await cartAPI.addItem({ productId, qty: item.qty || 1, sellerId: item.sellerId });
        } catch {
          /* out of stock / removed — merge the rest */
        }
      }
      clearGuestCart();
      setGuestCartItems([]);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    })();
  }, [isAuthenticated, queryClient]);

  return [guestCartItems, setGuestCartItems];
}
