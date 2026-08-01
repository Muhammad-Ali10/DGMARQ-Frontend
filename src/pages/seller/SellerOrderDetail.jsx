import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { userAPI, sellerAPI } from "@services/api";
import { payoutBadgeProps } from "@features/wallet-payout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { StatusBadge } from "@components/common/StatusBadge";
import { Skeleton } from "@components/ui/skeleton";
import { ErrorState } from "@components/common/ErrorState";
import { SpecList, SpecRow } from "@components/common/SpecList";
import { LicenseKeysModal } from "@features/seller";
import SafeImage from "@components/ui/safe-image";
import {
  ArrowLeft,
  Package,
  CreditCard,
  MapPin,
  Calendar,
} from "lucide-react";
import { showApiError } from "@utils/toast";

const SellerOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [licenseKeysModalOpen, setLicenseKeysModalOpen] = useState(false);

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => userAPI.getOrderById(orderId).then((res) => res.data.data),
    enabled: !!orderId,
    retry: 1,
    onError: (err) => {
      showApiError(err, "Failed to load order details");
    },
  });

  // Phase 2: per-item payout lines so the UI shows backend-driven release-state
  // (held / available / released / blocked) instead of computing it locally.
  const { data: payoutLinesData } = useQuery({
    queryKey: ["seller-order-payout-lines", orderId],
    queryFn: () => sellerAPI.getOrderPayoutLines(orderId).then((res) => res.data.data),
    enabled: !!orderId,
    retry: 0,
  });
  // Index payout lines by productId for fast per-item lookup.
  const payoutLineByProductId = useMemo(() => {
    const map = new Map();
    const lines = payoutLinesData?.lines || [];
    for (const line of lines) {
      const key = (line.productId || "").toString();
      if (key && !map.has(key)) map.set(key, line);
    }
    return map;
  }, [payoutLinesData]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-lg lg:col-span-2" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Button
          onClick={() => navigate("/seller/orders")}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <Card variant="hud">
          <CardContent>
            <ErrorState error={error} title="Couldn't load this order" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Button
          onClick={() => navigate("/seller/orders")}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <Card variant="hud">
          <CardContent>
            <ErrorState
              title="Order not found"
              description="It may have been removed, or the link you followed is out of date."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRefunded =
    (order.items || []).reduce(
      (sum, item) => sum + (Number(item.refundedAmount) || 0),
      0
    ) || 0;
  const payoutLines = payoutLinesData?.lines || [];
  const totalSellerEarning = payoutLines.length > 0
    ? payoutLines.reduce((sum, line) => sum + (Number(line.netAmount) || 0), 0)
    : (order.items || []).reduce(
        (sum, item) =>
          sum +
          (Number(item.sellerEarning) || 0) -
          (Number(item.refundedSellerAmount) || 0),
        0
      );
  const isGuestOrder = order.isGuest || !order.userId;
  const buyerName =
    order.userId?.name ?? (isGuestOrder ? "Guest User" : "Customer");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg">
            Order Details
          </h1>
          <p className="text-fg-muted mt-1">Order #{order.orderNumber || order._id?.slice(-8)}</p>
        </div>
        <Button onClick={() => navigate("/seller/orders")} variant="outline">
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
                  const lineTotal =
                    item.lineTotal ?? (item.qty || 0) * (item.unitPrice || 0);
                  const itemRefunded = Number(item.refundedAmount) || 0;
                  const productKey = (item.productId?._id || item.productId || "").toString();
                  const payoutLine = productKey ? payoutLineByProductId.get(productKey) : null;
                  const itemSellerEarning = payoutLine
                    ? Number(payoutLine.netAmount) || 0
                    : (Number(item.sellerEarning) || 0) -
                      (Number(item.refundedSellerAmount) || 0);
                  // Phase 5: highlight rows whose payout line is currently held / blocked
                  // because of an open dispute or refund request. Operators (and sellers
                  // double-checking their orders) can spot disputed rows at a glance.
                  const isDisputedRow =
                    !!payoutLine &&
                    (payoutLine.status === "blocked" || payoutLine.status === "hold");
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border space-y-4 ${
                        isDisputedRow
                          ? "bg-danger-soft border-danger/35"
                          : "bg-secondary border-border"
                      }`}
                    >
                      {isDisputedRow && (
                        <div className="text-xs text-danger flex items-start gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-danger-soft mt-1.5 shrink-0" />
                          <span>
                            This item is on hold due to an open dispute or refund request. Other items in this order release on schedule.
                            {payoutLine?.blockReason ? ` (${payoutLine.blockReason})` : ""}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        {productImage && (
                          <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-surface-2">
                            <SafeImage
                              src={productImage}
                              alt={item.productId?.name || "Product"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-fg mb-1">
                            {item.productId?.name || "Product"}
                          </h4>
                          {item.productId?.slug && (
                            <p className="text-sm text-fg-muted mb-1">
                              SKU: {item.productId.slug}
                            </p>
                          )}
                          {item.productId?.description && (
                            <p className="text-sm text-fg-muted mb-2">
                              {item.productId.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-fg-muted">
                            <span>Quantity: {item.qty}</span>
                            <span>Unit price: ${item.unitPrice?.toFixed(2)}</span>
                            <span>
                              Product price: ${lineTotal.toFixed(2)}
                            </span>
                            {itemRefunded > 0 && (
                              <span className="text-warning/90">
                                Refunded: -${itemRefunded.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-fg text-lg">
                            ${lineTotal.toFixed(2)}
                          </p>
                          {itemRefunded > 0 && (
                            <p className="text-sm text-warning/90 mt-0.5">
                              After refund: $
                              {(lineTotal - itemRefunded).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Two columns, as the product page's spec table is
                          (`.fx-pd4-body`) — these are short pairs and a single
                          column would leave half the card empty. */}
                      <SpecList className="mt-3 grid grid-cols-1 gap-x-6 border-t border-brand-cyan/10 pt-1 sm:grid-cols-2">
                        <SpecRow
                          label="Your net earnings"
                          value={`$${itemSellerEarning.toFixed(2)}`}
                          tone="success"
                        />
                        {itemRefunded > 0 && (
                          <SpecRow
                            label="Refunded amount"
                            value={`-$${itemRefunded.toFixed(2)}`}
                            tone="warning"
                          />
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
                <div className="text-fg-muted space-y-1">
                  <p className="font-medium text-fg">
                    {order.shippingAddress.fullName}
                  </p>
                  <p>{order.shippingAddress.address}</p>
                  {order.shippingAddress.address2 && (
                    <p>{order.shippingAddress.address2}</p>
                  )}
                  <p>
                    {order.shippingAddress.city},{" "}
                    {order.shippingAddress.state}{" "}
                    {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className="mt-2">
                      Phone: {order.shippingAddress.phone}
                    </p>
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
                <SpecRow label="Customer" value={buyerName} />
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <SpecRow
                    label="Last updated"
                    value={new Date(order.updatedAt).toLocaleDateString()}
                  />
                )}
                <SpecRow
                  label="Subtotal"
                  value={`$${order.subtotal?.toFixed(2) || order.totalAmount?.toFixed(2)}`}
                />
                {order.shippingCost > 0 && (
                  <SpecRow label="Shipping" value={`$${order.shippingCost.toFixed(2)}`} />
                )}
                {order.tax > 0 && <SpecRow label="Tax" value={`$${order.tax.toFixed(2)}`} />}
                {order.discount > 0 && (
                  <SpecRow
                    label="Discount"
                    value={`-$${order.discount.toFixed(2)}`}
                    tone="success"
                  />
                )}
                {order.buyerHandlingFee > 0 && (
                  <SpecRow
                    label="Buyer protection fee"
                    value={`$${order.buyerHandlingFee.toFixed(2)}`}
                  />
                )}
                {totalRefunded > 0 && (
                  <SpecRow
                    label="Refunded"
                    value={`-$${totalRefunded.toFixed(2)}`}
                    tone="warning"
                  />
                )}
                <SpecRow
                  emphasis
                  label={order.grandTotal != null ? 'Grand total' : 'Total'}
                  value={`$${(order.grandTotal ?? order.totalAmount)?.toFixed(2)}`}
                />
                {totalRefunded > 0 && (
                  <SpecRow
                    label="Amount after refunds"
                    value={`$${((order.grandTotal ?? order.totalAmount ?? 0) - totalRefunded).toFixed(2)}`}
                  />
                )}
              </SpecList>

              <div className="pt-4 border-t border-brand-cyan/10 space-y-2">
                <p className="text-sm text-fg-muted font-semibold">
                  Your earnings (this order)
                </p>
                <div className="flex justify-between text-fg font-medium text-sm">
                  <span>Your net earnings:</span>
                  <span className="text-success">
                    ${totalSellerEarning.toFixed(2)}
                  </span>
                </div>
              </div>

              {order.paymentMethod && (
                <div className="pt-4 border-t border-brand-cyan/10">
                  <div className="flex items-center gap-2 text-fg-muted mb-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Payment Method:</span>
                  </div>
                  <p className="text-fg">
                    {order.paymentMethod === 'Card' ? 'Credit/Debit Card'
                      : order.paymentMethod === 'Wallet+Card' ? 'Wallet + Credit/Debit Card'
                      : order.paymentMethod}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {(order.orderStatus === "completed" ||
            order.orderStatus === "PARTIALLY_REFUNDED" ||
            order.orderStatus === "partially_completed") &&
            order.paymentStatus === "paid" &&
            !(order.items || []).every((item) => item.refunded) && (
              <Card variant="hud">
                <CardHeader>
                  <CardTitle>
                    License Keys
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setLicenseKeysModalOpen(true)}
                  >
                    View License Keys
                  </Button>
                  <LicenseKeysModal
                    open={licenseKeysModalOpen}
                    onOpenChange={setLicenseKeysModalOpen}
                    orderId={order._id}
                    guestEmail={order.isGuest ? order.guestEmail : undefined}
                  />
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
};

export default SellerOrderDetail;
