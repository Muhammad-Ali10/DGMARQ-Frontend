import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Skeleton } from '@components/ui/skeleton';
import SafeImage from '@components/ui/safe-image';
import { ErrorState } from '@components/common/ErrorState';
import { Fact } from '@components/common/SpecList';
import { RefundChat, isRefundChatLocked, refundBadgeProps } from '@features/wallet-payout';
import { getDisplayOrderId } from '@lib/orderDisplay';
import { useSocket } from '@hooks/useSocket';
import useCurrency from '@hooks/useCurrency';
import { formatDateTime, formatRelativeDate } from '@lib/datetime';
import { ArrowLeft, MessagesSquare } from 'lucide-react';

/**
 * A buyer's refund request in full.
 *
 * This file carried a NINTH copy of the refund vocabulary — `STATUS_LABELS`,
 * `STATUS_VARIANTS`, and a local `StatusBadge` component shadowing the shared
 * one by the same name. All three are gone; it reads the canonical taxonomy.
 *
 * The facts grid used `<Label>` for read-only values. `<Label>` is for form
 * controls, so screen readers announced these as orphaned field labels; they
 * are a description list now.
 */
const RefundDetail = () => {
  const { refundId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { format } = useCurrency();

  const refundQuery = useQuery({
    queryKey: ['user-refund-details', refundId],
    queryFn: () => returnRefundAPI.getRefundById(refundId).then((res) => res.data.data),
    enabled: Boolean(refundId),
    retry: 1,
  });

  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['user-refund-details', refundId] });
      queryClient.invalidateQueries({ queryKey: ['user-refunds'] });
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient, refundId]);

  const back = (
    <Button onClick={() => navigate('/user/return-refunds')} variant="outline">
      <ArrowLeft aria-hidden="true" />
      Back to refunds
    </Button>
  );

  if (refundQuery.isPending) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const refund = refundQuery.data;
  if (refundQuery.isError || !refund) {
    return (
      <div className="space-y-6">
        {back}
        <Card variant="hud">
          <CardContent>
            <ErrorState
              error={refundQuery.error}
              title="Couldn't load this refund request"
              onRetry={() => refundQuery.refetch()}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const amount = Number(refund.refundAmount ?? refund.productId?.price ?? 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-fg">Refund #{refund._id?.slice(-8)}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Opened {formatRelativeDate(refund.createdAt)} · {formatDateTime(refund.createdAt)}
          </p>
        </div>
        {back}
      </header>

      <Card variant="hud">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Overview</CardTitle>
          <Badge {...refundBadgeProps(refund.status)} />
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Fact label="Order">
              <span className="font-mono">#{getDisplayOrderId(refund.orderId, '—')}</span>
            </Fact>
            <Fact label="Sold by">{refund.sellerId?.shopName || 'Seller'}</Fact>
            <Fact label="Product">{refund.productId?.name || 'Product'}</Fact>
            <Fact label="Amount requested">
              <span className="text-base font-semibold tabular-nums">{format(amount)}</span>
            </Fact>
          </dl>

          <div>
            <h2 className="text-xs tracking-wide text-fg-subtle uppercase">Your reason</h2>
            <p className="mt-1 text-sm text-fg">{refund.reason || 'No reason given'}</p>
          </div>

          {refund.evidenceFiles?.length > 0 && (
            <div>
              <h2 className="text-xs tracking-wide text-fg-subtle uppercase">Evidence you sent</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {refund.evidenceFiles.map((url, i) => (
                  <li key={url || i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Open evidence image ${i + 1} in a new tab`}
                    >
                      <SafeImage
                        src={url}
                        alt=""
                        w={80}
                        className="size-20 rounded border border-border object-cover transition-colors duration-150 ease-out hover:border-border-interactive"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {refund.adminNotes && (
            <div className="rounded-lg border border-info/35 bg-info-soft p-3">
              <h2 className="text-xs tracking-wide text-info uppercase">Note from DGMARQ</h2>
              <p className="mt-1 text-sm text-fg">{refund.adminNotes}</p>
            </div>
          )}

          {refund.rejectionReason && (
            <div className="rounded-lg border border-danger/35 bg-danger-soft p-3">
              <h2 className="text-xs tracking-wide text-danger uppercase">Why this was rejected</h2>
              <p className="mt-1 text-sm text-fg">{refund.rejectionReason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="hud">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessagesSquare aria-hidden="true" className="size-4" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RefundChat
            refundId={refund._id}
            canSend
            locked={isRefundChatLocked(refund.status)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default RefundDetail;
