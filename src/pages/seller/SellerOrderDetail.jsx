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
import { Loading, ErrorMessage } from "@components/ui/loading";
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

  if (isLoading) return <Loading message="Loading order details..." />;

  if (isError) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Error loading order details";
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <Button
          onClick={() => navigate("/seller/orders")}
          variant="outline"
          className="mb-4"
        >
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
        <Button
          onClick={() => navigate("/seller/orders")}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <ErrorMessage message="Order not found" />
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
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Order Details
          </h1>
          <p className="text-gray-400 mt-1">Order #{order.orderNumber || order._id?.slice(-8)}</p>
        </div>
        <Button onClick={() => navigate("/seller/orders")} variant="outline">
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
                          ? "bg-red-950/30 border-red-700/60"
                          : "bg-secondary border-gray-700"
                      }`}
                    >
                      {isDisputedRow && (
                        <div className="text-xs text-red-300 flex items-start gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          <span>
                            This item is on hold due to an open dispute or refund request. Other items in this order release on schedule.
                            {payoutLine?.blockReason ? ` (${payoutLine.blockReason})` : ""}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        {productImage && (
                          <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-800">
                            <SafeImage
                              src={productImage}
                              alt={item.productId?.name || "Product"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white mb-1">
                            {item.productId?.name || "Product"}
                          </h4>
                          {item.productId?.slug && (
                            <p className="text-sm text-gray-400 mb-1">
                              SKU: {item.productId.slug}
                            </p>
                          )}
                          {item.productId?.description && (
                            <p className="text-sm text-gray-400 mb-2">
                              {item.productId.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                            <span>Quantity: {item.qty}</span>
                            <span>Unit price: ${item.unitPrice?.toFixed(2)}</span>
                            <span>
                              Product price: ${lineTotal.toFixed(2)}
                            </span>
                            {itemRefunded > 0 && (
                              <span className="text-amber-400/90">
                                Refunded: -${itemRefunded.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-white text-lg">
                            ${lineTotal.toFixed(2)}
                          </p>
                          {itemRefunded > 0 && (
                            <p className="text-sm text-amber-400/90 mt-0.5">
                              After refund: $
                              {(lineTotal - itemRefunded).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-300 border-t border-gray-700 pt-3">
                        <div className="flex justify-between">
                          <span>Your net earnings:</span>
                          <span className="text-green-400 font-medium">
                            ${itemSellerEarning.toFixed(2)}
                          </span>
                        </div>
                        {itemRefunded > 0 && (
                          <div className="flex justify-between">
                            <span>Refunded amount:</span>
                            <span className="text-amber-400/90">
                              -${itemRefunded.toFixed(2)}
                            </span>
                          </div>
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
                                <span className="text-gray-300">
                                  {new Date(payoutLine.holdUntil).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
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
                  <p className="font-medium text-white">
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
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Customer:</span>
                  <span className="text-white">{buyerName}</span>
                </div>
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
                  <span>
                    $
                    {order.subtotal?.toFixed(2) ||
                      order.totalAmount?.toFixed(2)}
                  </span>
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
                {totalRefunded > 0 && (
                  <div className="flex justify-between text-amber-400/90">
                    <span>Refunded:</span>
                    <span>-${totalRefunded.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-gray-700">
                  <span>
                    {order.grandTotal != null ? "Grand Total:" : "Total:"}
                  </span>
                  <span>
                    ${(order.grandTotal ?? order.totalAmount)?.toFixed(2)}
                  </span>
                </div>
                {totalRefunded > 0 && (
                  <div className="flex justify-between text-gray-400 text-sm pt-1">
                    <span>Amount after refunds:</span>
                    <span>
                      $
                      {(
                        (order.grandTotal ?? order.totalAmount ?? 0) -
                        totalRefunded
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-700 space-y-2">
                <p className="text-sm text-gray-300 font-semibold">
                  Your earnings (this order)
                </p>
                <div className="flex justify-between text-gray-100 font-medium text-sm">
                  <span>Your net earnings:</span>
                  <span className="text-green-400">
                    ${totalSellerEarning.toFixed(2)}
                  </span>
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
            </CardContent>
          </Card>

          {(order.orderStatus === "completed" ||
            order.orderStatus === "PARTIALLY_REFUNDED" ||
            order.orderStatus === "partially_completed") &&
            order.paymentStatus === "paid" &&
            !(order.items || []).every((item) => item.refunded) && (
              <Card className="bg-primary border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
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
