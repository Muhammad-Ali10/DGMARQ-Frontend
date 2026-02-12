import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { userAPI } from "../../services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Loading, ErrorMessage } from "../../components/ui/loading";
import LicenseKeysModal from "../../components/LicenseKeysModal";
import {
  ArrowLeft,
  Package,
  CreditCard,
  MapPin,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { showApiError } from "../../utils/toast";

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

  const getStatusBadge = (status) => {
    const variants = {
      completed: "success",
      pending: "warning",
      processing: "default",
      cancelled: "destructive",
      returned: "secondary",
      partially_completed: "secondary",
      PARTIALLY_REFUNDED: "secondary",
      REFUNDED: "secondary",
    };
    const labels = {
      partially_completed: "Partially refunded",
      PARTIALLY_REFUNDED: "Partially refunded",
      REFUNDED: "Refunded",
      returned: "Refunded",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPaymentBadge = (status) => {
    const variants = {
      paid: "success",
      pending: "warning",
      failed: "destructive",
      refunded: "secondary",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const totalRefunded =
    (order.items || []).reduce(
      (sum, item) => sum + (Number(item.refundedAmount) || 0),
      0
    ) || 0;
  const totalSellerEarning = (order.items || []).reduce(
    (sum, item) =>
      sum +
      (Number(item.sellerEarning) || 0) -
      (Number(item.refundedSellerAmount) || 0),
    0
  );
  const isGuestOrder = order.isGuest || !order.userId;
  const buyerName =
    order.userId?.name ?? (isGuestOrder ? "Guest User" : "Customer");
  const buyerEmail = order.userId?.email ?? order.guestEmail ?? null;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Order Details
          </h1>
          <p className="text-gray-400 mt-1">Order #{order._id?.slice(-8)}</p>
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
                  const sellerId = item.sellerId?._id ?? item.sellerId;
                  const sellerName =
                    item.sellerId?.shopName ??
                    (typeof item.sellerId === "object" ? null : "Seller");
                  const sellerLogo = item.sellerId?.shopLogo;
                  const displaySellerName = sellerName || "Seller";
                  const lineTotal =
                    item.lineTotal ?? (item.qty || 0) * (item.unitPrice || 0);
                  const itemRefunded = Number(item.refundedAmount) || 0;
                  const itemSellerEarning =
                    (Number(item.sellerEarning) || 0) -
                    (Number(item.refundedSellerAmount) || 0);
                  return (
                    <div
                      key={idx}
                      className="p-4 bg-secondary rounded-lg border border-gray-700 space-y-4"
                    >
                      <div className="flex items-start gap-4">
                        {productImage && (
                          <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-800">
                            <img
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
                      </div>
                      {sellerId && (
                        <div className="border-t border-gray-700 pt-4">
                          <p className="text-sm text-gray-400 mb-2">Sold by</p>
                          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#0E092C]/60 border border-gray-700">
                            <div className="flex items-center gap-3">
                              {sellerLogo && (
                                <img
                                  src={sellerLogo}
                                  alt={displaySellerName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              )}
                              <span className="font-medium text-white">
                                {displaySellerName}
                              </span>
                            </div>
                            <Link to={`/seller/${sellerId}`}>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="gap-1.5"
                              >
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
                  {getStatusBadge(order.orderStatus)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Payment Status:</span>
                  {getPaymentBadge(order.paymentStatus)}
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
                    <span>Buyer Handling Fee:</span>
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
                  <p className="text-white capitalize">
                    {order.paymentMethod}
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
