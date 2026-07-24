import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { cartAPI } from '@services/api';

/**
 * Hydrates guest cart lines from the server so they carry the same data as
 * the authed cart (region, stock, rating, discount, device).
 *
 * The caller passes the current localStorage items (from useGuestCart) so
 * the query re-fires whenever add/remove/qty-change updates them.
 * `keepPreviousData` ensures the old enriched data stays visible while the
 * new query is in flight (no flash-to-empty on qty change).
 *
 * @param {Array}   localItems  the raw localStorage items from useGuestCart
 * @param {boolean} enabled     false when the user is authenticated
 * @returns {{ items: Array, subtotal: number, isLoading: boolean }}
 */
export function useGuestCartView(localItems, enabled) {
  const queryPayload = (enabled ? localItems : []).map((it) => ({
    productId: it.productId?._id || it.productId,
    sellerId: it.sellerId || undefined,
    qty: it.qty || 1,
  }));

  const hasItems = queryPayload.length > 0;

  const { data, isLoading } = useQuery({
    queryKey: ['guest-cart-view', queryPayload],
    queryFn: () => cartAPI.guestView(queryPayload).then((r) => r.data.data),
    enabled: enabled && hasItems,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: false,
  });

  return {
    items: data?.items ?? [],
    subtotal: data?.subtotal ?? 0,
    isLoading: enabled && hasItems && isLoading,
  };
}
