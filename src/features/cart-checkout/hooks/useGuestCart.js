import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cartAPI } from '@services/api';
import { getGuestCart, clearGuestCart } from '../utils/guestCart';

let mergeInFlight = null;

const mergeGuestCart = async () => {
  const { items } = getGuestCart();
  if (items.length === 0) return;
  clearGuestCart();
  const failed = [];
  for (const item of items) {
    const productId = item.productId && (item.productId._id || item.productId);
    if (!productId) continue;
    try {
      await cartAPI.addItem({ productId, qty: item.qty || 1, sellerId: item.sellerId });
    } catch {
      failed.push(item.name || 'An item');
    }
  }
  if (failed.length) {
    toast.error(
      failed.length === 1
        ? `${failed[0]} could not be moved to your cart — it may be out of stock.`
        : `${failed.length} items could not be moved to your cart — they may be out of stock.`
    );
  }
};

export function useGuestCart(isAuthenticated) {
  const queryClient = useQueryClient();
  const [guestCartItems, setGuestCartItems] = useState([]);

  useEffect(() => {
    if (isAuthenticated) return undefined;
    const sync = () => setGuestCartItems(getGuestCart().items);
    sync();
    window.addEventListener('guestCartChange', sync);
    return () => window.removeEventListener('guestCartChange', sync);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!mergeInFlight && getGuestCart().items.length === 0) return;
    mergeInFlight = mergeInFlight || mergeGuestCart().finally(() => { mergeInFlight = null; });
    mergeInFlight.then(() => {
      setGuestCartItems([]);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    });
  }, [isAuthenticated, queryClient]);

  return [guestCartItems, setGuestCartItems];
}
