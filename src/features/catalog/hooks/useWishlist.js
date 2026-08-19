import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '@services/api';
import { showError } from '@utils/toast';

/**
 * Query-key prefix for everything wishlist. Invalidating `['wishlist']` reaches
 * BOTH the membership entry below and the wishlist page's per-page entries.
 */
export const WISHLIST_QUERY_KEY = ['wishlist'];

/**
 * Membership + count. Header, MobileBottomBar, the user Dashboard and every
 * product card share this exact entry, so React Query issues a single request
 * no matter how many hearts are on screen.
 *
 * It is a SEPARATE, id-only endpoint rather than the wishlist itself because
 * the read is now paginated, and a page of 24 cannot answer "is the product on
 * browse page 7 saved?". Splitting it also fixed the reason the cap was needed:
 * the header used to pull fully-populated products on every route to render a
 * number.
 */
export const WISHLIST_IDS_KEY = ['wishlist', 'ids'];

/** Per-page key for the wishlist page. Shares the `['wishlist']` prefix. */
export const wishlistPageKey = (page) => ['wishlist', 'page', page];

const productIdOf = (item) => {
  const p = item?.productId ?? item;
  return (typeof p === 'object' ? p?._id : p)?.toString();
};

/**
 * Shared wishlist state + toggle.
 *
 * Replaces three divergent implementations that had drifted apart:
 *
 *  - ProductCard seeded local `useState` from `product.isWishlisted`, a field
 *    NO endpoint has ever set. So every heart on every card rendered empty,
 *    even on saved products — and because the empty heart always took the "add"
 *    branch, clicking one on an already-saved product got a 400 "Product
 *    already exists in wishlist" back, reverted, and showed "Failed to update
 *    wishlist". Un-saving from a card was impossible.
 *  - ProductCard also never invalidated the query, so the header badge, the
 *    mobile badge and the wishlist page all went stale after a toggle.
 *  - CategoryProduct and ProductDetail each derived the state correctly, but
 *    from their own hand-rolled copies of this logic.
 *
 * State is derived from the shared cache rather than held locally, which is
 * what makes it correct: it cannot disagree with the badge, and every heart for
 * the same product updates together.
 */
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

    // Optimistic, on the SHARED membership entry rather than on local component
    // state, so one click updates every heart for that product plus both badges
    // at once. Only ids move here — the page's own entries are refetched by the
    // prefix invalidation in onSettled.
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

      // The server treats a redundant toggle as an error (400 "already exists",
      // 404 "Wishlist not found"). From the user's point of view the wishlist
      // already says what they asked it to say, so let the refetch in
      // onSettled reconcile instead of flashing a failure at them.
      if ((add && status === 400) || (!add && status === 404)) return;

      queryClient.setQueryData(WISHLIST_IDS_KEY, context?.previous);

      // 409 is the size cap. Unlike every other failure this one is actionable
      // and the server's message names the limit, so show it verbatim rather
      // than a generic "could not save" the user can do nothing about.
      if (add && status === 409) {
        showError(
          error?.response?.data?.message ||
            'Your wishlist is full. Remove something before saving another item.'
        );
        return;
      }

      showError(add ? 'Could not save that item' : 'Could not remove that item');
    },

    // Prefix invalidation: refreshes the membership entry (badges + hearts) AND
    // every cached wishlist page in one call.
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
    // Count and cap come from the same entry the hearts read, so the badge, the
    // "N of 500" line and the hearts can never disagree about the total.
    count,
    max,
    isFull: max != null && count >= max,
  };
};

export default useWishlist;
