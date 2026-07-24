import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderAPI, adminAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { StatusBadge } from '@components/common/StatusBadge';
import { Loading, ErrorMessage } from '@components/ui/loading';
import SafeImage from '@components/ui/safe-image';
import { ArrowLeft, Package, CreditCard, MapPin, Calendar, ExternalLink, DollarSign } from 'lucide-react';
import { showApiError } from '@utils/toast';
import { payoutBadgeProps } from '@features/wallet-payout';

const AdminOrderDetail = () => {
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
          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
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
                            <span>Unit price: ${item.unitPrice?.toFixed(2)}</span>
                            <span>Product price: ${breakdown.lineTotal.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-white text-lg">
                            ${(item.lineTotal ?? item.qty * item.unitPrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-300 border-t border-gray-700 pt-3">
                        <div className="flex justify-between">
                          <span>Normal platform commission:</span>
                          <span>${breakdown.normalCommission.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Featured extra commission:</span>
                          <span>
                            {breakdown.featuredExtraCommission > 0
                              ? `$${breakdown.featuredExtraCommission.toFixed(2)}`
                              : '$0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total platform commission:</span>
                          <span>${breakdown.totalCommission.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Seller net earnings:</span>
                          <span>${breakdown.sellerEarning.toFixed(2)}</span>
                        </div>
                        {(item.refundedAmount > 0 || item.refunded) && (
                          <>
                            <div className="flex justify-between text-amber-400">
                              <span>Refunded amount:</span>
                              <span>-${(item.refundedAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-amber-400">
                              <span>Refunded seller amount:</span>
                              <span>-${(item.refundedSellerAmount || 0).toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        {payoutLine && (
                          <>
                            <div className="flex justify-between items-center">
                              <span>Payout status:</span>
                              {(() => {
                                const props = payoutBadgeProps(payoutLine.displayStatus || payoutLine.status);
                                return <Badge variant={props.variant}>{props.label}</Badge>;
                              })()}
                            </div>
                            {payoutLine.holdUntil && (
                              <div className="flex justify-between">
                                <span>Release date:</span>
                                <span>{new Date(payoutLine.holdUntil).toLocaleDateString()}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
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
            <Card className="bg-primary border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
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
          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Order Status:</span>
                  <StatusBadge domain="order" status={order.orderStatus} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Payment Status:</span>
                  <StatusBadge domain="payment" status={order.paymentStatus} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Order Date:
                  </span>
                  <span className="text-white">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {order.userId && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Customer:</span>
                    <span className="text-white">
                      {order.userId.name ?? order.userId.email ?? '—'}
                    </span>
                  </div>
                )}
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Last Updated:</span>
                    <span className="text-white">
                      {new Date(order.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal:</span>
                  <span>${order.subtotal?.toFixed(2) || order.totalAmount?.toFixed(2)}</span>
                </div>
                {order.shippingCost > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping:</span>
                    <span>${order.shippingCost.toFixed(2)}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Tax:</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount:</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                {order.buyerHandlingFee > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Buyer Protection Fee:</span>
                    <span>${order.buyerHandlingFee.toFixed(2)}</span>
                  </div>
                )}
                {(() => {
                  const totalRefunded = (order.items || []).reduce(
                    (sum, item) => sum + (Number(item.refundedAmount) || 0),
                    0
                  );
                  return totalRefunded > 0 ? (
                    <div className="flex justify-between text-amber-400">
                      <span>Refunded:</span>
                      <span>-${totalRefunded.toFixed(2)}</span>
                    </div>
                  ) : null;
                })()}
                <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-gray-700">
                  <span>{order.grandTotal != null ? 'Grand Total:' : 'Total:'}</span>
                  <span>${(order.grandTotal ?? order.totalAmount)?.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700 space-y-2">
                <p className="text-sm text-gray-300 font-semibold">Commission & Earnings Breakdown</p>
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Normal platform commission:</span>
                  <span>${commissionTotals.normalCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Featured extra commission:</span>
                  <span>
                    {commissionTotals.featuredExtraCommission > 0
                      ? `$${commissionTotals.featuredExtraCommission.toFixed(2)}`
                      : '$0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-100 font-medium text-sm">
                  <span>Total platform commission:</span>
                  <span>${commissionTotals.totalCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-100 font-medium text-sm">
                  <span>Seller net earnings:</span>
                  <span>${commissionTotals.sellerEarning.toFixed(2)}</span>
                </div>
              </div>

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
