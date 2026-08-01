import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { userAPI, orderAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import SafeImage from '@components/ui/safe-image';
import { StatusBadge } from '@components/common/StatusBadge';
import { DeliveryTypeBadge } from '@components/common/DeliveryTypeBadge';
import { EmptyState } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { OrderListSkeleton } from '@components/common/Skeletons';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { Pagination } from '@components/common/Pagination';
import { RefundRequestModal } from '@features/wallet-payout';
import { ShoppingCart, RotateCcw, Eye, RefreshCw, KeyRound } from 'lucide-react';
import { showSuccess, showApiError } from '@utils/toast';
import { useSocket } from '@hooks/useSocket';
import useCurrency from '@hooks/useCurrency';
import { getOrderItemProductName } from '@utils/orderItem';
import { formatRelativeDate, formatExactTitle } from '@lib/datetime';

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
  { value: 'partially_completed', label: 'Partially completed' },
];

/** An order whose keys are actually retrievable. */
const hasRetrievableKeys = (order) =>
  ['completed', 'partially_completed', 'PARTIALLY_REFUNDED'].includes(order.orderStatus) &&
  order.paymentStatus === 'paid' &&
  !(order.items || []).every((item) => item.refunded);

/**
 * Buyer order history.
 *
 * Filter and page now live in the URL (`?status=&page=`) so the view survives a
 * refresh, a back-button press, and being pasted to someone else. Both were
 * `useState` before and were lost on every reload.
 *
 * Rows are a list rather than a table: this data is image-led and reads the same
 * on a phone as on a desktop, so there is no second mobile layout to drift out
 * of sync.
 */
const UserOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderOrderId, setReorderOrderId] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { format } = useCurrency();

  const status = searchParams.get('status') || '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const updateParams = useCallback(
    (next) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(next)) {
            if (value === null || value === '' || value === undefined) params.delete(key);
            else params.set(key, String(value));
          }
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const ordersQuery = useQuery({
    queryKey: ['user-orders', page, status],
    queryFn: () =>
      userAPI.getMyOrders({ page, limit: PAGE_SIZE, status }).then((res) => res.data.data),
    placeholderData: keepPreviousData,
  });

  // Phase 6 / Step 12 PART C — an admin executing a refund fans out to
  // user:<buyerId>. There is no `order_status_changed` event on this platform,
  // so this invalidation is the only real-time signal an order row has.
  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['order-detail'] });
      // One polite announcement for the list as a whole. A live region on each
      // row would announce all ten of them on an ordinary page change.
      setLiveMessage('An order was updated. The list has been refreshed.');
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient]);

  const reorderMutation = useMutation({
    mutationFn: (orderId) => userAPI.reorder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showSuccess('Items added to cart for reorder');
      setShowReorderModal(false);
    },
    onError: (error) => showApiError(error, 'Failed to add items to cart'),
  });

  // M21: cancel an undelivered pre-order (before release) → wallet refund.
  const cancelPreorderMutation = useMutation({
    mutationFn: (orderId) => orderAPI.cancelPreorder(orderId),
    onSuccess: (res) => {
      showSuccess(res.data?.message || 'Pre-order cancelled — refunded to your wallet');
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
    onError: (error) => showApiError(error, 'Failed to cancel pre-order'),
  });

  const orders = ordersQuery.data?.orders ?? [];
  const pagination = ordersQuery.data?.pagination ?? {};

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-fg">My orders</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Every purchase, with its delivery status and keys.
        </p>
      </header>

      <span aria-live="polite" className="sr-only">
        {liveMessage}
      </span>

      <Card variant="hud">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{pagination.total != null ? `${pagination.total} orders` : 'Orders'}</CardTitle>
          <Select
            value={status || 'all'}
            onValueChange={(value) =>
              updateParams({ status: value === 'all' ? null : value, page: null })
            }
          >
            <SelectTrigger className="w-48" aria-label="Filter orders by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent>
          {ordersQuery.isPending ? (
            <OrderListSkeleton rows={PAGE_SIZE} />
          ) : ordersQuery.isError ? (
            <ErrorState
              error={ordersQuery.error}
              title="Couldn't load your orders"
              onRetry={() => ordersQuery.refetch()}
            />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title={status ? 'No orders with that status' : 'No orders yet'}
              description={
                status
                  ? 'Try clearing the filter to see your full history.'
                  : "Your purchases show up here the moment they're delivered — usually within seconds."
              }
              action={
                status ? (
                  <Button variant="outline" onClick={() => updateParams({ status: null, page: null })}>
                    Clear filter
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/search">Browse keys</Link>
                  </Button>
                )
              }
            />
          ) : (
            <ul className="space-y-1.5">
              {orders.map((order) => {
                const firstItem = order.items?.[0];
                const image = firstItem?.productId?.images?.[0];
                const extraCount = (order.items?.length ?? 0) - 1;
                const canRefund = order.orderStatus === 'completed' && order.paymentStatus === 'paid';
                const canReorder =
                  order.orderStatus !== 'cancelled' &&
                  order.orderStatus !== 'completed' &&
                  order.paymentStatus === 'paid' &&
                  !order.hasPreorder;
                const canCancelPreorder =
                  order.hasPreorder &&
                  order.orderStatus === 'processing' &&
                  order.paymentStatus === 'paid';

                return (
                  <li
                    key={order._id}
                    className="row-link rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 px-3 py-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <SafeImage
                        src={image}
                        alt=""
                        w={64}
                        className="size-16 shrink-0 rounded-md border border-border object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-fg">
                              {firstItem ? getOrderItemProductName(firstItem) : 'Order'}
                              {extraCount > 0 && (
                                <span className="text-fg-muted"> +{extraCount} more</span>
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-fg-subtle">
                              #{order.orderNumber || order._id.slice(-8)}
                              {' · '}
                              <span title={formatExactTitle(order.createdAt)}>
                                {formatRelativeDate(order.createdAt)}
                              </span>
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                            <span className="text-sm font-semibold tabular-nums text-fg">
                              {format(order.totalAmount)}
                            </span>
                            <StatusBadge domain="order" status={order.orderStatus} />
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {firstItem?.productId?.productType && (
                            <DeliveryTypeBadge productType={firstItem.productId.productType} />
                          )}
                          {order.plusPointsEarned > 0 && (
                            <span className="text-xs font-medium text-accent-on-dark">
                              +{order.plusPointsEarned} Plus points
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/user/orders/${order._id}`}>
                              <Eye aria-hidden="true" />
                              View details
                            </Link>
                          </Button>
                          {hasRetrievableKeys(order) && (
                            <Button asChild size="sm">
                              <Link to={`/user/orders/${order._id}`}>
                                <KeyRound aria-hidden="true" />
                                View keys
                              </Link>
                            </Button>
                          )}
                          {canRefund && (
                            <Button variant="outline" size="sm" onClick={() => setShowRefundModal(true)}>
                              <RefreshCw aria-hidden="true" />
                              Request refund
                            </Button>
                          )}
                          {canReorder && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReorderOrderId(order._id);
                                setShowReorderModal(true);
                              }}
                            >
                              <RotateCcw aria-hidden="true" />
                              Reorder
                            </Button>
                          )}
                          {canCancelPreorder && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelPreorderMutation.mutate(order._id)}
                              disabled={cancelPreorderMutation.isPending}
                            >
                              <RefreshCw aria-hidden="true" />
                              Cancel pre-order
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!ordersQuery.isError && (
            <Pagination
              page={page}
              totalPages={pagination.pages}
              onPageChange={(next) => updateParams({ page: next === 1 ? null : next })}
              total={pagination.total}
              totalNoun="orders"
            />
          )}
        </CardContent>
      </Card>

      <ConfirmationModal
        open={showReorderModal}
        onOpenChange={setShowReorderModal}
        title="Add items to cart"
        description="Add all items from this order to your cart?"
        confirmText="Add to cart"
        cancelText="Cancel"
        onConfirm={() => {
          if (reorderOrderId) {
            reorderMutation.mutate(reorderOrderId);
            setReorderOrderId(null);
          }
        }}
      />

      <RefundRequestModal open={showRefundModal} onOpenChange={setShowRefundModal} />
    </div>
  );
};

export default UserOrders;
