import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI, orderAPI } from '@services/api';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Loading } from '@components/ui/loading';
import { ShoppingCart, RotateCcw, Eye, RefreshCw } from 'lucide-react';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { RefundRequestModal } from '@features/wallet-payout';
import { showSuccess, showApiError } from '@utils/toast';
import { useSocket } from '@hooks/useSocket';
import useCurrency from '@hooks/useCurrency';
import { getOrderItemProductName } from '@utils/orderItem';

const UserOrders = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderOrderId, setReorderOrderId] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { format } = useCurrency();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['user-orders', page, status],
    queryFn: () => userAPI.getMyOrders({ page, limit: 10, status }).then(res => res.data.data),
  });

  // Phase 6 / Step 12 PART C — refresh order list when an admin executes a
  // refund for any of this buyer's orders. The socket emit is fan-out to
  // user:<buyerId>; we don't need to filter by orderId here because the
  // query layer will refetch only the buyer's pages.
  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['order-detail'] });
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient]);

  const reorderMutation = useMutation({
    mutationFn: (orderId) => userAPI.reorder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showSuccess('Items added to cart for reorder');
      setShowReorderModal(false);
    },
    onError: (error) => {
      showApiError(error, 'Failed to add items to cart');
    },
  });

  const handleReorder = (orderId) => {
    setReorderOrderId(orderId);
    setShowReorderModal(true);
  };

  // M21: cancel an undelivered pre-order (before release) → wallet refund.
  const cancelPreorderMutation = useMutation({
    mutationFn: (orderId) => orderAPI.cancelPreorder(orderId),
    onSuccess: (res) => {
      showSuccess(res.data?.message || 'Pre-order cancelled — refunded to your wallet');
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
    onError: (error) => showApiError(error, 'Failed to cancel pre-order'),
  });

  if (isLoading) return <Loading message="Loading orders..." />;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Orders</h1>
        <p className="text-gray-400 mt-1">View and manage your order history</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Orders</CardTitle>
          <Select value={status || "all"} onValueChange={(value) => { setStatus(value === "all" ? "" : value); setPage(1); }}>
            <SelectTrigger className="w-48 bg-secondary border-gray-700 text-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="partially_completed">Partially completed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>

          <div className="space-y-4">
            {ordersData?.orders?.length > 0 ? (
              ordersData.orders.map((order) => (
                <Card key={order._id} className="bg-secondary border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          Order #{order.orderNumber || order._id.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-white mb-2">
                          {format(order.totalAmount)}
                        </p>
                        {getStatusBadge(order.orderStatus)}
                        {order.plusPointsEarned > 0 && (
                          <p className="mt-2 text-xs font-semibold text-accent">
                            +{order.plusPointsEarned} Plus points
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-primary p-2 rounded">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-300">{item.qty}x</span>
                            <span className="text-white">{getOrderItemProductName(item)}</span>
                          </div>
                          <span className="text-gray-400">{format(item.unitPrice)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link to={`/user/orders/${order._id}`}>
                        <Button variant="outline" size="sm" className="bg-accent hover:bg-blue-700 text-white border-0">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      {order.orderStatus === 'completed' && order.paymentStatus === 'paid' && (
                        <Button
                          onClick={() => setShowRefundModal(true)}
                          variant="outline"
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white border-0"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Request Refund
                        </Button>
                      )}
                      {order.orderStatus !== 'cancelled' && order.orderStatus !== 'completed' && order.paymentStatus === 'paid' && !order.hasPreorder && (
                        <Button
                          onClick={() => handleReorder(order._id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reorder
                        </Button>
                      )}
                      {/* M21: undelivered pre-order — cancellable until release */}
                      {order.hasPreorder && order.orderStatus === 'processing' && order.paymentStatus === 'paid' && (
                        <Button
                          onClick={() => cancelPreorderMutation.mutate(order._id)}
                          disabled={cancelPreorderMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="border-amber-500/60 text-amber-300 hover:bg-amber-500/10"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Cancel Pre-order
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400 text-lg">No orders found</p>
              </div>
            )}
          </div>

          {(ordersData?.pagination?.total ?? ordersData?.orders?.length ?? 0) > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-sm text-gray-400">
                Page {ordersData.pagination.page} of {ordersData.pagination.pages} 
                ({ordersData.pagination.total} total orders)
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= ordersData.pagination.pages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationModal
        open={showReorderModal}
        onOpenChange={setShowReorderModal}
        title="Add Items to Cart"
        description="Add all items from this order to your cart?"
        confirmText="Add to Cart"
        cancelText="Cancel"
        onConfirm={() => {
          if (reorderOrderId) {
            reorderMutation.mutate(reorderOrderId);
            setReorderOrderId(null);
          }
        }}
      />

      <RefundRequestModal
        open={showRefundModal}
        onOpenChange={setShowRefundModal}
      />
    </div>
  );
};

export default UserOrders;

