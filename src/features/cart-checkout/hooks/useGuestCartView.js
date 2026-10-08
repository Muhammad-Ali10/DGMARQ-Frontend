import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { cartAPI } from '@services/api';

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
