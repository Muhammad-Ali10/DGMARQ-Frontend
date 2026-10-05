import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@hooks/useSocket';
import { patchReviewPages } from '../utils/reviewPages';

/**
 * Live review updates on a product page, for logged-in visitors. Guests have no
 * socket; their page refreshes when the tab regains focus instead.
 *
 * Joins the product's socket room and applies each `review_changed` push to the
 * cached product (rating, count, star bars) and review list in place. The push
 * carries the new data itself, so every viewer of a busy product patches its
 * screen rather than all of them refetching at once. A bulk change (a refunded
 * order's reviews) names no single review, so the list is refetched.
 *
 * @param {string|undefined} productId  product._id
 * @param {string} identifier           the URL identifier the product-detail query is keyed by
 */
export const useLiveProductReviews = (productId, identifier) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Re-runs on every (re)connect: the server forgets a socket's rooms when it drops.
    if (!socket || !isConnected || !productId) return;

    const onReviewChanged = (change) => {
      if (change.productId !== productId) return;
      queryClient.setQueryData(['product-detail', identifier], (product) => product && { ...product, ...change.summary });
      const listKey = ['product-reviews', productId];
      if (change.action === 'bulk') {
        queryClient.invalidateQueries({ queryKey: listKey });
      } else {
        queryClient.setQueryData(listKey, (data) => data && patchReviewPages(data, change));
      }
    };

    socket.emit('join_product', productId);
    socket.on('review_changed', onReviewChanged);
    return () => {
      socket.off('review_changed', onReviewChanged);
      socket.emit('leave_product', productId);
    };
  }, [socket, isConnected, productId, identifier, queryClient]);
};
