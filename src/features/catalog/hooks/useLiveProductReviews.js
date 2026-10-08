import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@hooks/useSocket';
import { patchReviewPages } from '../utils/reviewPages';

export const useLiveProductReviews = (productId, identifier) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
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
