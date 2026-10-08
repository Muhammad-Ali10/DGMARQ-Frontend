import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { sellerAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { StatusBadge } from '@components/common/StatusBadge';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { TableRowsSkeleton, CardListSkeleton } from '@components/common/Skeletons';
import { Pagination } from '@components/common/Pagination';
import useCurrency from '@hooks/useCurrency';
import { formatRelativeDate, formatExactTitle } from '@lib/datetime';
import { useSocket } from '@hooks/useSocket';
import { ShoppingCart, Eye } from 'lucide-react';

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'PARTIALLY_REFUNDED', label: 'Partially refunded' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
];

const sellerTotals = (order) => {
  const items = order.items || [];
  const sum = (fn) => items.reduce((acc, item) => acc + fn(item), 0);
  return {
    total: sum((i) => (Number(i.lineTotal) || 0) - (Number(i.refundedAmount) || 0)),
    earning: sum((i) => (Number(i.sellerEarning) || 0) - (Number(i.refundedSellerAmount) || 0)),
    refunded: sum((i) => Number(i.refundedAmount) || 0),
  };
};

const SellerOrders = () => {
  const { formatSettlement } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const [liveMessage, setLiveMessage] = useState('');
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

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
    queryKey: ['seller-orders', page, status],
    queryFn: () =>
      sellerAPI.getMyOrders({ page, limit: PAGE_SIZE, status }).then((res) => res.data.data),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-balance'] });
      queryClient.invalidateQueries({ queryKey: ['seller-payouts'] });
      setLiveMessage('An order was refunded. Your orders and balance have been refreshed.');
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient]);

  const orders = ordersQuery.data?.orders ?? [];
  const pagination = ordersQuery.data?.pagination ?? {};
  const totalPages = pagination.pages ?? pagination.totalPages ?? 1;

  const emptyState = (
    <EmptyState
      icon={ShoppingCart}
      title={status ? 'No orders with that status' : 'No orders yet'}
      description={
        status
          ? 'Try clearing the filter to see every order.'
          : 'Orders appear here the moment a buyer purchases one of your listings.'
      }
      action={
        status ? (
          <Button variant="outline" onClick={() => updateParams({ status: null, page: null })}>
            Clear filter
          </Button>
        ) : (
          <Button asChild>
            <Link to="/seller/catalog">List a product</Link>
          </Button>
        )
      }
    />
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-fg">Orders</h1>
        <p className="mt-1 text-sm text-fg-muted">Every sale, and what you earned on it.</p>
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
          {ordersQuery.isError ? (
            <ErrorState
              error={ordersQuery.error}
              title="Couldn't load your orders"
              onRetry={() => ordersQuery.refetch()}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table variant="hud">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead numeric>Items</TableHead>
                      <TableHead numeric>Total</TableHead>
                      <TableHead numeric>Refunded</TableHead>
                      <TableHead numeric>You earn</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead numeric>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersQuery.isPending ? (
                      <TableRowsSkeleton rows={PAGE_SIZE} cols={9} />
                    ) : orders.length === 0 ? (
                      <TableEmptyRow colSpan={9}>{emptyState}</TableEmptyRow>
                    ) : (
                      orders.map((order) => {
                        const t = sellerTotals(order);
                        return (
                          <TableRow key={order._id}>
                            <TableCell className="font-mono text-xs">
                              {order.orderNumber || order._id.slice(-8)}
                            </TableCell>
                            <TableCell>{order.buyer?.name || order.userId?.name || '—'}</TableCell>
                            <TableCell numeric>{order.items?.length || 0}</TableCell>
                            <TableCell numeric>{formatSettlement(t.total)}</TableCell>
                            <TableCell numeric className={t.refunded > 0 ? 'text-warning' : 'text-fg-subtle'}>
                              {t.refunded > 0 ? `−${formatSettlement(t.refunded)}` : '—'}
                            </TableCell>
                            <TableCell numeric className="font-semibold text-success">
                              {formatSettlement(t.earning)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge domain="order" status={order.orderStatus} />
                            </TableCell>
                            <TableCell
                              className="text-fg-muted"
                              title={formatExactTitle(order.createdAt)}
                            >
                              {formatRelativeDate(order.createdAt)}
                            </TableCell>
                            <TableCell numeric>
                              <Button asChild variant="outline" size="sm">
                                <Link to={`/seller/orders/${order._id}`}>
                                  <Eye aria-hidden="true" />
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden">
                {ordersQuery.isPending ? (
                  <CardListSkeleton rows={5} />
                ) : orders.length === 0 ? (
                  emptyState
                ) : (
                  <ul className="space-y-3">
                    {orders.map((order) => {
                      const t = sellerTotals(order);
                      return (
                        <li
                          key={order._id}
                          className="rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-mono text-xs text-fg-muted">
                                {order.orderNumber || order._id.slice(-8)}
                              </p>
                              <p className="mt-1 truncate text-sm text-fg">
                                {order.buyer?.name || order.userId?.name || 'Buyer'}
                              </p>
                            </div>
                            <StatusBadge domain="order" status={order.orderStatus} />
                          </div>

                          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                            <div>
                              <dt className="text-fg-subtle">Total</dt>
                              <dd className="tabular-nums text-fg">{formatSettlement(t.total)}</dd>
                            </div>
                            <div>
                              <dt className="text-fg-subtle">You earn</dt>
                              <dd className="font-semibold tabular-nums text-success">
                                {formatSettlement(t.earning)}
                              </dd>
                            </div>
                            {t.refunded > 0 && (
                              <div>
                                <dt className="text-fg-subtle">Refunded</dt>
                                <dd className="tabular-nums text-warning">−{formatSettlement(t.refunded)}</dd>
                              </div>
                            )}
                            <div>
                              <dt className="text-fg-subtle">Date</dt>
                              <dd className="text-fg">{formatRelativeDate(order.createdAt)}</dd>
                            </div>
                          </dl>

                          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                            <Link to={`/seller/orders/${order._id}`}>
                              <Eye aria-hidden="true" />
                              View order
                            </Link>
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(next) => updateParams({ page: next === 1 ? null : next })}
                total={pagination.total ?? orders.length}
                totalNoun="orders"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerOrders;
