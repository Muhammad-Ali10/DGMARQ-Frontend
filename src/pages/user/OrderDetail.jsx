import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { orderAPI, chatAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import SafeImage from '@components/ui/safe-image';
import { StatusBadge } from '@components/common/StatusBadge';
import { PlatformBadge, isKnownPlatform } from '@components/common/PlatformBadge';
import { ErrorState } from '@components/common/ErrorState';
import { SpecList, SpecRow } from '@components/common/SpecList';
import { LicenseKeysModal } from '@features/seller';
import { getOrderItemProductName } from '@utils/orderItem';
import { getRedemption } from '@lib/redemption';
import { formatOrderAmount } from '@lib/orderDisplay';
import { formatDateTime, formatRelativeDate, formatExactTitle } from '@lib/datetime';
import { useSocket } from '@hooks/useSocket';
import {
  ArrowLeft,
  Package,
  CreditCard,
  MapPin,
  MessageSquare,
  ExternalLink,
  KeyRound,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { socket, isConnected } = useSocket();
  const [keysOpen, setKeysOpen] = useState(false);

  const orderQuery = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => orderAPI.getOrderById(orderId).then((res) => res.data.data),
    enabled: Boolean(orderId),
    retry: 1,
  });

  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient, orderId]);

  const createConversation = useMutation({
    mutationFn: (data) => chatAPI.createConversation(data),
    onSuccess: (response) => {
      const conversation = response.data.data;
      navigate(`/user/chat?conversation=${conversation._id}`);
    },
    onError: (err) => {
      if (err.response?.status === 200 && err.response?.data?.data) {
        navigate(`/user/chat?conversation=${err.response.data.data._id}`);
      } else {
        toast.error(err.response?.data?.message || 'Could not open the conversation');
      }
    },
  });

  const handleContactSeller = (sellerId) => {
    if (!isAuthenticated) {
      toast.info('Sign in to contact the seller');
      navigate('/login', { state: { from: `/user/orders/${orderId}` } });
      return;
    }
    createConversation.mutate({ sellerId });
  };

  const backButton = (
    <Button variant="outline" onClick={() => navigate('/user/orders')}>
      <ArrowLeft aria-hidden="true" />
      Back to orders
    </Button>
  );

  if (orderQuery.isPending) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="space-y-6">
        {backButton}
        <Card variant="hud">
          <CardContent>
            <ErrorState
              error={orderQuery.error}
              title="Couldn't load this order"
              onRetry={() => orderQuery.refetch()}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = orderQuery.data;
  const format = (usdAmount) => formatOrderAmount(usdAmount, order);
  const totalRefunded = (order.items || []).reduce(
    (sum, item) => sum + (Number(item.refundedAmount) || 0),
    0
  );
  const keysAvailable =
    ['completed', 'PARTIALLY_REFUNDED'].includes(order.orderStatus) &&
    order.paymentStatus === 'paid' &&
    !(order.items || []).every((item) => item.refunded);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-fg">
            Order #{order.orderNumber || order._id.slice(-8)}
          </h1>
          <p className="mt-1 text-sm text-fg-muted" title={formatExactTitle(order.createdAt)}>
            Placed {formatRelativeDate(order.createdAt)}
          </p>
        </div>
        {backButton}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card variant="hud">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package aria-hidden="true" className="size-4" />
                What you bought
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items?.map((item, idx) => {
                const sellerId = item.sellerId?._id ?? item.sellerId;
                const sellerName = item.sellerId?.shopName || 'Seller';
                const sellerLogo = item.sellerId?.shopLogo;
                const platform = item.productId?.platform;
                const redemption =
                  item.productId?.productType === 'LICENSE_KEY' ? getRedemption(platform) : null;

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <SafeImage
                        src={item.productId?.images?.[0]}
                        alt=""
                        w={80}
                        className="size-20 shrink-0 rounded-md border border-border object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-fg">
                          {getOrderItemProductName(item)}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {isKnownPlatform(platform) && <PlatformBadge platform={platform} />}
                        </div>
                        <p className="mt-2 text-xs text-fg-muted">
                          Qty {item.qty} · {format(item.unitPrice)} each
                        </p>
                        {(item.refundedKeysCount > 0 || item.refundedAmount > 0) && (
                          <p className="mt-1 text-xs text-warning">
                            Refunded: {item.refundedKeysCount || 0} key(s) ·{' '}
                            −{format(Number(item.refundedAmount) || 0)}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-fg">
                          {format(item.lineTotal ?? item.qty * item.unitPrice)}
                        </p>
                      </div>
                    </div>

                    {redemption && (
                      <div className="mt-4 rounded-lg border border-brand-cyan/12 bg-brand-cyan/3 p-3">
                        <p className="mb-2 text-xs font-semibold tracking-wide text-fg-subtle uppercase">
                          How to redeem on {redemption.label}
                        </p>
                        <ol className="mb-3 list-decimal space-y-1 pl-4 text-xs text-fg-muted">
                          {redemption.steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                        <Button asChild variant="outline" size="sm">
                          <a href={redemption.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink aria-hidden="true" />
                            Open {redemption.label}
                          </a>
                        </Button>
                      </div>
                    )}

                    {sellerId && (
                      <div className="mt-4 flex flex-col gap-3 border-t border-brand-cyan/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          {sellerLogo ? (
                            <SafeImage
                              src={sellerLogo}
                              alt=""
                              w={40}
                              className="size-10 rounded-full border border-border object-cover"
                            />
                          ) : (
                            <div className="flex size-10 items-center justify-center rounded-full border border-border bg-surface-2">
                              <Package aria-hidden="true" className="size-4 text-fg-subtle" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs text-fg-subtle">Sold by</p>
                            <p className="truncate text-sm font-medium text-fg">{sellerName}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContactSeller(sellerId)}
                            disabled={createConversation.isPending}
                          >
                            <MessageSquare aria-hidden="true" />
                            Contact seller
                          </Button>
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/seller/${sellerId}`}>
                              <ExternalLink aria-hidden="true" />
                              Seller profile
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {order.shippingAddress && (
            <Card variant="hud">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin aria-hidden="true" className="size-4" />
                  Billing address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-fg-muted">
                <p className="font-medium text-fg">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.address}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p className="pt-1">{order.shippingAddress.phone}</p>}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {keysAvailable && (
            <Card variant="hud">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound aria-hidden="true" className="size-4" />
                  Your keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => setKeysOpen(true)}>
                  <KeyRound aria-hidden="true" />
                  View keys
                </Button>
                <p className="flex items-start gap-2 text-xs text-fg-subtle">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-success" />
                  Keys stay hidden until you choose to reveal them.{' '}
                  <Link to="/refund-policy" className="text-accent-on-dark underline-offset-4 hover:underline">
                    Refund policy
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}

          <Card variant="hud">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <SpecList>
                <SpecRow
                  label="Order status"
                  value={<StatusBadge domain="order" status={order.orderStatus} announce />}
                />
                <SpecRow
                  label="Payment"
                  value={<StatusBadge domain="payment" status={order.paymentStatus} />}
                />
                <SpecRow label="Placed" value={formatDateTime(order.createdAt)} />
                <SpecRow label="Subtotal" value={format(order.subtotal ?? order.totalAmount)} />
                {order.discount > 0 && (
                  <SpecRow label="Discount" value={`−${format(order.discount)}`} tone="success" />
                )}
                {order.buyerProtectionFee > 0 && (
                  <SpecRow label="Buyer protection" value={format(order.buyerProtectionFee)} />
                )}
                {order.buyerHandlingFee > 0 && (
                  <SpecRow label="Checkout fee" value={format(order.buyerHandlingFee)} />
                )}
                {totalRefunded > 0 && (
                  <SpecRow label="Refunded" value={`−${format(totalRefunded)}`} tone="warning" />
                )}
                {order.paymentMethod && (
                  <SpecRow
                    label="Paid by"
                    value={
                      <span className="inline-flex items-center gap-2">
                        <CreditCard aria-hidden="true" className="size-4 text-fg-subtle" />
                        {order.paymentMethod === 'Card'
                          ? 'Card'
                          : order.paymentMethod === 'Wallet+Card'
                            ? 'Wallet + card'
                            : order.paymentMethod}
                      </span>
                    }
                  />
                )}
                <SpecRow
                  emphasis
                  label="Total"
                  value={format(order.grandTotal ?? order.totalAmount)}
                />
                {order.plusPointsEarned > 0 && (
                  <SpecRow
                    label="Points earned"
                    value={
                      <span className="inline-flex items-center gap-1.5 text-accent-on-dark">
                        <Sparkles aria-hidden="true" className="size-3.5" />
                        +{order.plusPointsEarned}
                      </span>
                    }
                  />
                )}
              </SpecList>
            </CardContent>
          </Card>

          <Card variant="hud">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy aria-hidden="true" className="size-4" />
                Need help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link to="/user/return-refunds">Report a problem</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/user/support">Contact support</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <LicenseKeysModal
        open={keysOpen}
        onOpenChange={setKeysOpen}
        orderId={order._id}
        guestEmail={order.isGuest ? order.guestEmail : undefined}
      />
    </div>
  );
};

export default OrderDetail;
