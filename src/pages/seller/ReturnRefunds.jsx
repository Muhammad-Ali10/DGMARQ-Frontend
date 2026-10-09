import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { returnRefundAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { TableRowsSkeleton, CardListSkeleton } from '@components/common/Skeletons';
import { Pagination } from '@components/common/Pagination';
import { refundBadgeProps } from '@features/wallet-payout';
import useCurrency from '@hooks/useCurrency';
import { formatRelativeDate, formatExactTitle } from '@lib/datetime';
import { Eye, ShieldCheck } from 'lucide-react';
import { getDisplayOrderId } from '@lib/orderDisplay';
import { useSocket } from '@hooks/useSocket';

const PAGE_SIZE = 10;

const SellerReturnRefunds = () => {
  const { formatSettlement } = useCurrency();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [page, setPage] = useState(1);

  const refundsQuery = useQuery({
    queryKey: ['seller-refunds', page],
    queryFn: () => returnRefundAPI.getSellerRefundList({ page, limit: PAGE_SIZE }).then((res) => res.data.data),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['seller-refunds'] });
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient]);

  const refunds = refundsQuery.data?.refunds ?? [];
  const pagination = refundsQuery.data?.pagination;
  const total = pagination?.total ?? refunds.length;

  const emptyState = (
    <EmptyState
      icon={ShieldCheck}
      tone="success"
      title="No refund requests"
      description="Nobody has raised a problem with your keys. That is exactly where you want to be."
    />
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-fg">Returns &amp; refunds</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Requests raised against your products. An admin makes the final call — your feedback is
          advisory, but it is read.
        </p>
      </header>

      <Card variant="hud">
        <CardHeader>
          <CardTitle>{total > 0 ? `${total} request${total === 1 ? '' : 's'}` : 'Requests'}</CardTitle>
        </CardHeader>
        <CardContent>
          {refundsQuery.isError ? (
            <ErrorState
              error={refundsQuery.error}
              title="Couldn't load refund requests"
              onRetry={() => refundsQuery.refetch()}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table variant="hud">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead numeric>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead numeric>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refundsQuery.isPending ? (
                      <TableRowsSkeleton rows={5} cols={7} />
                    ) : refunds.length === 0 ? (
                      <TableEmptyRow colSpan={7}>{emptyState}</TableEmptyRow>
                    ) : (
                      refunds.map((refund) => (
                        <TableRow key={refund._id}>
                          <TableCell className="font-mono text-xs">
                            {getDisplayOrderId(refund.orderId, '—')}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {refund.productId?.name || '—'}
                          </TableCell>
                          <TableCell>{refund.userId?.name || '—'}</TableCell>
                          <TableCell numeric className="font-semibold">
                            {formatSettlement(refund.refundAmount ?? 0)}
                          </TableCell>
                          <TableCell>
                            <Badge {...refundBadgeProps(refund.status)} />
                          </TableCell>
                          <TableCell
                            className="text-fg-muted"
                            title={formatExactTitle(refund.createdAt)}
                          >
                            {formatRelativeDate(refund.createdAt)}
                          </TableCell>
                          <TableCell numeric>
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/seller/return-refunds/${refund._id}`}>
                                <Eye aria-hidden="true" />
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden">
                {refundsQuery.isPending ? (
                  <CardListSkeleton rows={4} />
                ) : refunds.length === 0 ? (
                  emptyState
                ) : (
                  <ul className="space-y-3">
                    {refunds.map((refund) => (
                      <li
                        key={refund._id}
                        className="rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                            {refund.productId?.name || 'Product'}
                          </p>
                          <Badge {...refundBadgeProps(refund.status)} />
                        </div>
                        <p className="mt-2 text-sm font-semibold tabular-nums text-fg">
                          {formatSettlement(refund.refundAmount ?? 0)}
                        </p>
                        <p className="mt-1 text-xs text-fg-subtle">
                          {getDisplayOrderId(refund.orderId, '—')} · {refund.userId?.name || 'Buyer'} ·{' '}
                          {formatRelativeDate(refund.createdAt)}
                        </p>
                        <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                          <Link to={`/seller/return-refunds/${refund._id}`}>
                            <Eye aria-hidden="true" />
                            View request
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Pagination
                page={page}
                totalPages={pagination?.pages}
                onPageChange={setPage}
                total={pagination?.total}
                totalNoun="requests"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerReturnRefunds;
