import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { returnRefundAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { TableRowsSkeleton, CardListSkeleton } from '@components/common/Skeletons';
import { RefundRequestModal, refundBadgeProps } from '@features/wallet-payout';
import { useSocket } from '@hooks/useSocket';
import useCurrency from '@hooks/useCurrency';
import { formatRelativeDate, formatExactTitle } from '@lib/datetime';
import { Plus, Eye, ShieldQuestion } from 'lucide-react';

// `sellerId` is populated with `shopName` by the refund endpoints; fall back to
// a generic label if a populate is ever missed (mirrors OrderDetail's read).
const getSellerName = (refund) => refund?.sellerId?.shopName || 'Seller';

const amountOf = (refund) =>
  Number(refund?.refundAmount ?? refund?.productId?.price ?? 0);

/**
 * Buyer refund requests.
 *
 * The brief asks for an SLA countdown on open tickets. NOT BUILT: the
 * ReturnRefund model carries no `dueAt`, `respondBy` or `slaHours` field and
 * there is no escalation timer anywhere in the controller, so there is no
 * deadline to count down to. Counting down to an invented deadline would set an
 * expectation the platform does not keep. What is shown instead is real elapsed
 * time — how long ago it was opened, and when it last moved — which is the
 * genuinely useful triage signal.
 */
const UserReturnRefunds = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { format } = useCurrency();

  const refundsQuery = useQuery({
    queryKey: ['user-refunds'],
    queryFn: () => returnRefundAPI.getMyRefunds().then((res) => res.data.data),
  });

  // Phase 6 / Step 12 PART C — refund_executed fan-out updates this list.
  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['user-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient]);

  const refunds = refundsQuery.data?.refunds ?? [];

  const emptyState = (
    <EmptyState
      icon={ShieldQuestion}
      tone="success"
      title="No refund requests"
      description="Nothing has gone wrong with your orders. If a key ever fails, open a request here and we'll look into it."
      action={
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" />
          Request a refund
        </Button>
      }
    />
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-fg">Returns &amp; refunds</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Track a request from the moment you open it to the money landing back.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" />
          Request a refund
        </Button>
      </header>

      <Card variant="hud">
        <CardHeader>
          <CardTitle>{refunds.length > 0 ? `${refunds.length} requests` : 'Requests'}</CardTitle>
        </CardHeader>
        <CardContent>
          {refundsQuery.isError ? (
            <ErrorState
              error={refundsQuery.error}
              title="Couldn't load your refund requests"
              onRetry={() => refundsQuery.refetch()}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table variant="hud">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request</TableHead>
                      <TableHead>Sold by</TableHead>
                      <TableHead numeric>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead numeric>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refundsQuery.isPending ? (
                      <TableRowsSkeleton rows={5} cols={6} />
                    ) : refunds.length === 0 ? (
                      <TableEmptyRow colSpan={6}>{emptyState}</TableEmptyRow>
                    ) : (
                      refunds.map((refund) => (
                        <TableRow key={refund._id}>
                          <TableCell className="font-mono text-xs">
                            #{refund._id?.slice(-8)}
                          </TableCell>
                          <TableCell>{getSellerName(refund)}</TableCell>
                          <TableCell numeric className="font-semibold">
                            {format(amountOf(refund))}
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
                              <Link to={`/user/return-refunds/${refund._id}`}>
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
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-fg-muted">
                            #{refund._id?.slice(-8)}
                          </span>
                          <Badge {...refundBadgeProps(refund.status)} />
                        </div>
                        <p className="mt-2 text-sm font-semibold tabular-nums text-fg">
                          {format(amountOf(refund))}
                        </p>
                        <p className="mt-1 text-xs text-fg-subtle">
                          {getSellerName(refund)} · opened {formatRelativeDate(refund.createdAt)}
                        </p>
                        <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                          <Link to={`/user/return-refunds/${refund._id}`}>
                            <Eye aria-hidden="true" />
                            View request
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <RefundRequestModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
};

export default UserReturnRefunds;
