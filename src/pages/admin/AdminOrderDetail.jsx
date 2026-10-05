import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderAPI, adminAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { StatusBadge } from '@components/common/StatusBadge';
import { SpecList, SpecRow } from '@components/common/SpecList';
import { Loading, ErrorMessage } from '@components/ui/loading';
import SafeImage from '@components/ui/safe-image';
import { ArrowLeft, Package, CreditCard, MapPin, Calendar, ExternalLink, DollarSign } from 'lucide-react';
import { showApiError } from '@utils/toast';
import { payoutBadgeProps } from '@features/wallet-payout';
import useCurrency from '@hooks/useCurrency';

const AdminOrderDetail = () => {
  const { format: formatMoney } = useCurrency();
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ['admin-order-detail', orderId],
    queryFn: () => orderAPI.getOrderById(orderId).then(res => res.data.data),
    enabled: !!orderId,
    retry: 1,
    onError: (err) => {
      showApiError(err, 'Failed to load order details');
    },
  });

  // Phase 2: per-item payout-line state from the unified backend source so the admin
  // view matches the seller view and the Earnings/Dashboard pages.
  const { data: payoutLinesData } = useQuery({
    queryKey: ['admin-order-payout-lines', orderId],
    queryFn: () => adminAPI.getOrderPayoutLines(orderId).then((res) => res.data.data),
    enabled: !!orderId,
    retry: 0,
  });
  const payoutLineByProductId = useMemo(() => {
    const map = new Map();
    const lines = payoutLinesData?.lines || [];
    for (const line of lines) {
      const key = (line.productId || '').toString();
      if (key && !map.has(key)) map.set(key, line);
    }
    return map;
  }, [payoutLinesData]);

  if (isLoading) return <Loading message="Loading order details..." />;

  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Error loading order details';
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <Button onClick={() => navigate('/admin/orders')} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <ErrorMessage message={errorMessage} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <Button onClick={() => navigate('/admin/orders')} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <ErrorMessage message="Order not found" />
      </div>
    );
  }

  const getItemCommissionBreakdown = (item) => {
    const lineTotal = typeof item.lineTotal === 'number'
      ? item.lineTotal
      : (item.qty || 0) * (item.unitPrice || 0);
    const sellerEarning = typeof item.sellerEarning === 'number' ? item.sellerEarning : 0;
    const totalCommission = typeof item.commissionAmount === 'number'
      ? item.commissionAmount
      : Math.max(0, lineTotal - sellerEarning);
    const featuredExtraCommission = typeof item.featuredExtraCommissionAmount === 'number'
      ? item.featuredExtraCommissionAmount
      : 0;
    const normalCommission = typeof item.normalCommissionAmount === 'number'
      ? item.normalCommissionAmount
      : Math.max(0, totalCommission - featuredExtraCommission);
    return {
      lineTotal,
      normalCommission,
      featuredExtraCommission,
      totalCommission,
      sellerEarning,
    };
  };

  const getOrderCommissionTotals = () => {
    if (!order?.items || !Array.isArray(order.items)) {
      return {
        normalCommission: 0,
        featuredExtraCommission: 0,
        totalCommission: order?.commissionAmount || 0,
        sellerEarning: order?.sellerEarning || 0,
      };
    }

    let normal = 0;
    let featured = 0;
    let totalSeller = 0;

    order.items.forEach((item) => {
      const productKey = (item.productId?._id || item.productId || '').toString();
      const payoutLine = productKey ? payoutLineByProductId.get(productKey) : null;
      const breakdown = getItemCommissionBreakdown(item);
      normal += breakdown.normalCommission;
      featured += breakdown.featuredExtraCommission;
      totalSeller += payoutLine ? Number(payoutLine.netAmount) || 0 : breakdown.sellerEarning;
    });

    const payoutLineCommission = Array.from(payoutLineByProductId.values()).reduce(
      (sum, line) => sum + (Number(line.commissionAmount) || 0),
      0
    );
    const totalCommission = payoutLineByProductId.size > 0 ? payoutLineCommission : normal + featured;

    return {
      normalCommission: normal,
      featuredExtraCommission: featured,
      totalCommission,
      sellerEarning: totalSeller,
    };
  };

  const commissionTotals = getOrderCommissionTotals();
  const totalRefunded = (order?.items || []).reduce(
    (sum, item) => sum + (Number(item.refundedAmount) || 0),
    0
  );

  // M14: what PayPal actually charged us on this capture — their own figures,
  // never a computed percentage. Shown only for PayPal-settled orders; a
  // wallet-paid order has no capture, so the block would be meaningless.
  // Individual values read "—" when PayPal has not settled the capture yet.
  const hasPayPalCapture = !!(order.paypalCaptureId || order.paypalOrderId);
  const paypalCurrency = order.paypalFeeCurrency;
  const formatSettlement = (amount) => {
    if (typeof amount !== 'number') return '—';
    return paypalCurrency && paypalCurrency !== 'USD'
      ? `${amount.toFixed(2)} ${paypalCurrency}`
      : `$${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Order Details</h1>
          <p className="text-gray-400 mt-1">
            Order #{order.orderNumber || order._id?.slice(-8)}
          </p>
        </div>
        <Button onClick={() => navigate('/admin/orders')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="hud">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {order.items?.map((item, idx) => {
                  const productImage = item.productId?.images?.[0];
                  const sellerId = item.sellerId?._id ?? item.sellerId;
                  const sellerName = item.sellerId?.shopName ?? (typeof item.sellerId === 'object' ? null : 'Seller');
                  const sellerLogo = item.sellerId?.shopLogo;
                  const displaySellerName = sellerName || 'Seller';
                  const productKey = (item.productId?._id || item.productId || '').toString();
                  const payoutLine = productKey ? payoutLineByProductId.get(productKey) : null;
                  const localBreakdown = getItemCommissionBreakdown(item);
                  const breakdown = payoutLine
                    ? {
                        ...localBreakdown,
                        totalCommission: Number(payoutLine.commissionAmount) || 0,
                        sellerEarning: Number(payoutLine.netAmount) || 0,
                      }
                    : localBreakdown;
                  // Phase 5: highlight rows whose payout line is on dispute hold so
                  // the operator immediately sees which item in a multi-item order is
                  // blocked (matching the seller-side behaviour).
                  const isDisputedRow =
                    !!payoutLine &&
                    (payoutLine.status === 'blocked' || payoutLine.status === 'hold');
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border space-y-4 ${
                        isDisputedRow
                          ? 'bg-red-950/30 border-red-700/60'
                          : 'bg-secondary border-gray-700'
                      }`}
                    >
                      {isDisputedRow && (
                        <div className="text-xs text-red-300 flex items-start gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          <span>
                            Payout for this item is on hold due to an open dispute or refund request.
                            {payoutLine?.blockReason ? ` (${payoutLine.blockReason})` : ''}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        {productImage && (
                          <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-800">
                            <SafeImage
                              src={productImage}
                              alt={item.productId?.name || 'Product'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white mb-1">
                            {item.productId?.name || 'Product'}
                          </h4>
                          {item.productId?.slug && (
                            <p className="text-sm text-gray-400 mb-1">SKU: {item.productId.slug}</p>
                          )}
                          {item.productId?.description && (
                            <p className="text-sm text-gray-400 mb-2">{item.productId.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                            <span>Quantity: {item.qty}</span>
                            <span>Unit price: {formatMoney(item.unitPrice)}</span>
                            <span>Product price: {formatMoney(breakdown.lineTotal)}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-white text-lg">
                            {formatMoney(item.lineTotal ?? item.qty * item.unitPrice)}
                          </p>
                        </div>
                      </div>
                      <SpecList className="mt-3 grid grid-cols-1 gap-x-6 border-t border-brand-cyan/10 pt-1 sm:grid-cols-2">
                        <SpecRow
                          label="Normal platform commission"
                          value={formatMoney(breakdown.normalCommission)}
                        />
                        <SpecRow
                          label="Featured extra commission"
                          value={formatMoney(breakdown.featuredExtraCommission || 0)}
                        />
                        <SpecRow
                          label="Total platform commission"
                          value={formatMoney(breakdown.totalCommission)}
                        />
                        <SpecRow
                          label="Seller net earnings"
                          value={formatMoney(breakdown.sellerEarning)}
                          tone="success"
                        />
                        {(item.refundedAmount > 0 || item.refunded) && (
                          <>
                            <SpecRow
                              label="Refunded amount"
                              value={`-${formatMoney(item.refundedAmount || 0)}`}
                              tone="warning"
                            />
                            <SpecRow
                              label="Refunded seller amount"
                              value={`-${formatMoney(item.refundedSellerAmount || 0)}`}
                              tone="warning"
                            />
                          </>
                        )}
                        {payoutLine && (
                          <>
                            <SpecRow
                              label="Payout status"
                              value={(() => {
                                const props = payoutBadgeProps(payoutLine.displayStatus || payoutLine.status);
                                return <Badge variant={props.variant}>{props.label}</Badge>;
                              })()}
                            />
                            {payoutLine.holdUntil && (
                              <SpecRow
                                label="Release date"
                                value={new Date(payoutLine.holdUntil).toLocaleDateString()}
                              />
                            )}
                          </>
                        )}
                      </SpecList>
                      {sellerId && (
                        <div className="border-t border-gray-700 pt-4">
                          <p className="text-sm text-gray-400 mb-2">Sold by</p>
                          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#0E092C]/60 border border-gray-700">
                            <div className="flex items-center gap-3">
                              {sellerLogo && (
                                <SafeImage
                                  src={sellerLogo}
                                  alt={displaySellerName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              )}
                              <span className="font-medium text-white">{displaySellerName}</span>
                            </div>
                            <Link to={`/seller/${sellerId}`}>
                              <Button variant="secondary" size="sm" className="gap-1.5">
                                <ExternalLink className="w-4 h-4" />
                                View Seller Profile
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {order.shippingAddress && (
            <Card variant="hud">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-300 space-y-1">
                  <p className="font-medium text-white">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.address}</p>
                  {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card variant="hud">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SpecList>
                <SpecRow
                  label="Order status"
                  value={<StatusBadge domain="order" status={order.orderStatus} />}
                />
                <SpecRow
                  label="Payment status"
                  value={<StatusBadge domain="payment" status={order.paymentStatus} />}
                />
                <SpecRow
                  label={
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Order date
                    </span>
                  }
                  value={new Date(order.createdAt).toLocaleDateString()}
                />
                {order.userId && (
                  <SpecRow
                    label="Customer"
                    value={order.userId.name ?? order.userId.email ?? '—'}
                  />
                )}
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <SpecRow
                    label="Last updated"
                    value={new Date(order.updatedAt).toLocaleDateString()}
                  />
                )}
                <SpecRow
                  label="Subtotal"
                  value={formatMoney(order.subtotal ?? order.totalAmount)}
                />
                {order.shippingCost > 0 && (
                  <SpecRow label="Shipping" value={formatMoney(order.shippingCost)} />
                )}
                {order.tax > 0 && <SpecRow label="Tax" value={formatMoney(order.tax)} />}
                {order.discount > 0 && (
                  <SpecRow
                    label="Discount"
                    value={`-${formatMoney(order.discount)}`}
                    tone="success"
                  />
                )}
                {order.buyerHandlingFee > 0 && (
                  <SpecRow
                    label="Buyer protection fee"
                    value={formatMoney(order.buyerHandlingFee)}
                  />
                )}
                {totalRefunded > 0 && (
                  <SpecRow
                    label="Refunded"
                    value={`-${formatMoney(totalRefunded)}`}
                    tone="warning"
                  />
                )}
                <SpecRow
                  emphasis
                  label={order.grandTotal != null ? 'Grand total' : 'Total'}
                  value={formatMoney(order.grandTotal ?? order.totalAmount)}
                />
              </SpecList>

              <div>
                <p className="mb-1 text-xs font-extrabold tracking-[0.13em] text-info uppercase">
                  Commission &amp; earnings breakdown
                </p>
                <SpecList>
                  <SpecRow
                    label="Normal platform commission"
                    value={formatMoney(commissionTotals.normalCommission)}
                  />
                  <SpecRow
                    label="Featured extra commission"
                    value={formatMoney(commissionTotals.featuredExtraCommission || 0)}
                  />
                  <SpecRow
                    label="Total platform commission"
                    value={formatMoney(commissionTotals.totalCommission)}
                  />
                  <SpecRow
                    label="Seller net earnings"
                    value={formatMoney(commissionTotals.sellerEarning)}
                    tone="success"
                  />
                </SpecList>
              </div>

              {hasPayPalCapture && (
                <div>
                  <p className="mb-1 text-xs font-extrabold tracking-[0.13em] text-info uppercase">
                    PayPal settlement
                  </p>
                  <SpecList>
                    <SpecRow label="Gross amount" value={formatSettlement(order.paypalGrossAmount)} />
                    <SpecRow
                      label="PayPal fee"
                      value={
                        typeof order.paypalFee === 'number'
                          ? `-${formatSettlement(order.paypalFee)}`
                          : '—'
                      }
                      tone={typeof order.paypalFee === 'number' ? 'warning' : undefined}
                      hint={
                        typeof order.paypalFee === 'number'
                          ? undefined
                          : 'PayPal has not settled this capture yet.'
                      }
                    />
                    <SpecRow
                      emphasis
                      label="Net received"
                      value={formatSettlement(order.paypalNetAmount)}
                    />
                  </SpecList>
                </div>
              )}

              {order.paymentMethod && (
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Payment Method:</span>
                  </div>
                  <p className="text-white">
                    {order.paymentMethod === 'Card' ? 'Credit/Debit Card'
                      : order.paymentMethod === 'Wallet+Card' ? 'Wallet + Credit/Debit Card'
                      : order.paymentMethod}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-700">
                <Button asChild variant="outline" className="w-full border-gray-700 text-gray-300">
                  <Link to={`/admin/payouts/${order._id}`}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    View Payout Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
