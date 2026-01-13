import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { ArrowLeft, Package, CreditCard, MapPin, Calendar, User } from 'lucide-react';
import { showApiError } from '../../utils/toast';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => userAPI.getOrderById(orderId).then(res => res.data.data),
    enabled: !!orderId,
    retry: 1,
    onError: (err) => {
      showApiError(err, 'Failed to load order details');
    },
  });

  if (isLoading) return <Loading message="Loading order details..." />;
  
  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || "Error loading order details";
    return (
      <div className="space-y-6">
        <Button onClick={() => navigate('/user/orders')} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <ErrorMessage message={errorMessage} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Button onClick={() => navigate('/user/orders')} variant="outline" className="mb-4">
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
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Order Details</h1>
          <p className="text-gray-400 mt-1">Order #{order._id.slice(-8)}</p>
        </div>
        <Button onClick={() => navigate('/user/orders')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between p-4 bg-secondary rounded-lg border border-gray-700">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">
                        {item.productId?.name || 'Product'}
                      </h4>
                      {item.productId?.slug && (
                        <p className="text-sm text-gray-400 mb-2">
                          SKU: {item.productId.slug}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Quantity: {item.qty}</span>
                        <span>Price: ${item.unitPrice?.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white text-lg">
                        ${item.lineTotal?.toFixed(2) || (item.qty * item.unitPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
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

        {/* Order Summary */}
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
                {order.shippingCost && order.shippingCost > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping:</span>
                    <span>${order.shippingCost.toFixed(2)}</span>
                  </div>
                )}
                {order.tax && order.tax > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Tax:</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                )}
                {order.discount && order.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount:</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-gray-700">
                  <span>Total:</span>
                  <span>${order.totalAmount?.toFixed(2)}</span>
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

          {/* License Keys */}
          {order.orderStatus === 'completed' && (
            <Card className="bg-primary border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">License Keys</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to={`/user/license-keys?orderId=${order._id}`}>
                  <Button variant="outline" className="w-full">
                    View License Keys
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
