import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '@services/api';
import { showError } from '@utils/toast';

export const WISHLIST_QUERY_KEY = ['wishlist'];

export const WISHLIST_IDS_KEY = ['wishlist', 'ids'];

export const wishlistPageKey = (page) => ['wishlist', 'page', page];

const productIdOf = (item) => {
  const p = item?.productId ?? item;
  return (typeof p === 'object' ? p?._id : p)?.toString();
};

export const useWishlist = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);

  const { data } = useQuery({
    queryKey: WISHLIST_IDS_KEY,
    queryFn: async () => {
      const payload = (await userAPI.getWishlistIds()).data.data;
      return {
        productIds: payload?.productIds || [],
        count: payload?.count ?? 0,
        max: payload?.max ?? null,
      };
    },
    enabled: !!isAuthenticated,
    staleTime: 60_000,
  });

  const wishlistedIds = useMemo(
    () => new Set((data?.productIds || []).map(productIdOf).filter(Boolean)),
    [data]
  );

  const mutation = useMutation({
    mutationFn: ({ productId, add }) =>
      add ? userAPI.addToWishlist({ productId }) : userAPI.removeFromWishlist({ productId }),

    onMutate: async ({ productId, add }) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_IDS_KEY });
      const previous = queryClient.getQueryData(WISHLIST_IDS_KEY);

      queryClient.setQueryData(WISHLIST_IDS_KEY, (current) => {
        const ids = current?.productIds || [];
        const next = add
          ? (ids.some((id) => productIdOf(id) === productId) ? ids : [...ids, productId])
          : ids.filter((id) => productIdOf(id) !== productId);
        return { ...current, productIds: next, count: next.length };
      });

      return { previous };
    },

    onError: (error, { add }, context) => {
      const status = error?.response?.status;

      if ((add && status === 400) || (!add && status === 404)) return;

      queryClient.setQueryData(WISHLIST_IDS_KEY, context?.previous);

      if (add && status === 409) {
        showError(
          error?.response?.data?.message ||
            'Your wishlist is full. Remove something before saving another item.'
        );
        return;
      }

      showError(add ? 'Could not save that item' : 'Could not remove that item');
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY }),
  });

  const isWishlisted = useCallback(
    (productId) => !!productId && wishlistedIds.has(productId.toString()),
    [wishlistedIds]
  );

  const toggle = useCallback(
    (productId) => {
      if (!isAuthenticated) {
        showError('Sign in to save items to your wishlist');
        navigate('/login');
        return;
      }
      if (!productId) return;
      mutation.mutate({ productId, add: !isWishlisted(productId) });
    },
    [isAuthenticated, isWishlisted, mutation, navigate]
  );

  const count = data?.count ?? 0;
  const max = data?.max ?? null;

  return {
    isWishlisted,
    toggle,
    isPending: mutation.isPending,
    isAuthenticated: !!isAuthenticated,
    count,
    max,
    isFull: max != null && count >= max,
  };
};

export default useWishlist;
