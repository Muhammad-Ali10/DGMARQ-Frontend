import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { offerAPI } from '@services/api';

const ADMIN_OFFER_QUERY_KEYS = [
  ['admin-offers'],
  ['admin-offers-count'],
  ['admin-product-offers'],
  ['admin-product-details'],
];

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
      toast.success(res?.data?.message || 'Offer restored');
      onRestored?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Could not restore the offer'),
  });

  return { remove, restore };
};

export default useOfferModeration;
