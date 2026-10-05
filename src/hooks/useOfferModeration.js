import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { offerAPI } from '@services/api';

// Every admin screen that shows offers. Refreshed together, so a takedown on the
// Seller Offers list shows on the product page (and the product's public
// rollups) without a reload, and the other way round.
const ADMIN_OFFER_QUERY_KEYS = [
  ['admin-offers'],
  ['admin-offers-count'],
  ['admin-product-offers'],
  ['admin-product-details'],
];

/**
 * Admin takedown and restore of a seller's offer. Both pages that list offers
 * use this, so the requests, the toasts and the cache refresh cannot drift.
 * `onRemoved` / `onRestored` let the caller close its dialog on success only.
 */
export const useOfferModeration = ({ onRemoved, onRestored } = {}) => {
  const queryClient = useQueryClient();
  const refresh = () =>
    ADMIN_OFFER_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));

  const remove = useMutation({
    mutationFn: ({ offerId, reason }) => offerAPI.adminRemoveOffer(offerId, { reason }),
    onSuccess: () => {
      refresh();
      toast.success('Offer removed — the seller has been notified');
      onRemoved?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Could not remove the offer'),
  });

  const restore = useMutation({
    mutationFn: (offerId) => offerAPI.adminRestoreOffer(offerId),
    onSuccess: (res) => {
      refresh();
      // The server says whether it is actually live: a restore while the seller is on
      // hold undoes the admin takedown but the listing stays hidden.
      toast.success(res?.data?.message || 'Offer restored');
      onRestored?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Could not restore the offer'),
  });

  return { remove, restore };
};

export default useOfferModeration;
