import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { returnRefundAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { TableRowsSkeleton, CardListSkeleton } from '@components/common/Skeletons';
import { refundBadgeProps } from '@features/wallet-payout';
import { formatUSD } from '@lib/money';
import { formatRelativeDate, formatExactTitle } from '@lib/datetime';
import { Eye, ShieldCheck } from 'lucide-react';

const displayOrderId = (orderLike) => {
  if (!orderLike) return '—';
  const orderNumber = typeof orderLike.orderNumber === 'string' ? orderLike.orderNumber.trim() : '';
  if (orderNumber) return orderNumber;
  const raw = orderLike._id?.toString?.() || '';
  return raw ? raw.slice(-8).toUpperCase() : '—';
};

/**
 * Refund requests raised against this seller's products.
 *
 * This file used to carry its own `STATUS_BADGES` table — a fifth copy of the
 * refund vocabulary, alongside the four removed in the token phase. It now reads
 * the canonical taxonomy in features/wallet-payout, so a status added there
 * shows up here with the same label and colour automatically.
 *
 * Money is settlement money (what the seller stands to lose), so `formatUSD`
 * rather than the buyer's display-currency hook.
 */
const SellerReturnRefunds = () => {
  const refundsQuery = useQuery({
    queryKey: ['seller-refunds'],
    queryFn: () => returnRefundAPI.getSellerRefundList().then((res) => res.data.data),
  });

  const refunds = refundsQuery.data?.refunds ?? [];

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
          <CardTitle>{refunds.length > 0 ? `${refunds.length} requests` : 'Requests'}</CardTitle>
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
                            {displayOrderId(refund.orderId)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {refund.productId?.name || '—'}
                          </TableCell>
                          <TableCell>{refund.userId?.name || '—'}</TableCell>
                          <TableCell numeric className="font-semibold">
                            {formatUSD(refund.refundAmount ?? refund.productId?.price)}
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
                          {formatUSD(refund.refundAmount ?? refund.productId?.price)}
                        </p>
                        <p className="mt-1 text-xs text-fg-subtle">
                          {displayOrderId(refund.orderId)} · {refund.userId?.name || 'Buyer'} ·{' '}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerReturnRefunds;
