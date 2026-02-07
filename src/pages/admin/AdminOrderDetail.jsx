import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { ArrowLeft, Package, CreditCard, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { showApiError } from '../../utils/toast';

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

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      pending: 'warning',
      processing: 'default',
      cancelled: 'destructive',
      returned: 'secondary',
      partially_completed: 'secondary',
    };
    const labels = { partially_completed: 'Partially completed' };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const getPaymentBadge = (status) => {
    const variants = {
      paid: 'success',
      pending: 'warning',
      failed: 'destructive',
      refunded: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Order Details</h1>
          <p className="text-gray-400 mt-1">Order #{order._id?.slice(-8)}</p>
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
                  return (
                    <div key={idx} className="p-4 bg-secondary rounded-lg border border-gray-700 space-y-4">
                      <div className="flex items-start gap-4">
                        {productImage && (
                          <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-800">
                            <img
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
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-white text-lg">
                            ${(item.lineTotal ?? item.qty * item.unitPrice).toFixed(2)}
                          </p>
                        </div>
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
                    <span>Buyer Handling Fee:</span>
                    <span>${order.buyerHandlingFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-gray-700">
                  <span>{order.grandTotal != null ? 'Grand Total:' : 'Total:'}</span>
                  <span>${(order.grandTotal ?? order.totalAmount)?.toFixed(2)}</span>
                </div>
              </div>

              {order.paymentMethod && (
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Payment Method:</span>
                  </div>
                  <p className="text-white capitalize">{order.paymentMethod}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
