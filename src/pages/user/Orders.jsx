import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '../../services/api';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { ShoppingCart, X, RotateCcw, Eye } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { showSuccess, showApiError } from '../../utils/toast';

const UserOrders = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderOrderId, setReorderOrderId] = useState(null);
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['user-orders', page, status],
    queryFn: () => userAPI.getMyOrders({ page, limit: 10, status }).then(res => res.data.data),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }) => userAPI.cancelOrder(orderId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-orders']);
      setCancellingId(null);
      setCancelReason('');
      showSuccess('Order cancelled successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to cancel order');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderId) => userAPI.reorder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      showSuccess('Items added to cart for reorder');
      setShowReorderModal(false);
    },
    onError: (error) => {
      showApiError(error, 'Failed to add items to cart');
    },
  });

  const handleCancel = (orderId) => {
    if (cancelReason.trim()) {
      cancelMutation.mutate({ orderId, reason: cancelReason });
    }
  };

  const handleReorder = (orderId) => {
    setReorderOrderId(orderId);
    setShowReorderModal(true);
  };

  if (isLoading) return <Loading message="Loading orders..." />;

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
                          Order #{order._id.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-white mb-2">
                          ${order.totalAmount?.toFixed(2)}
                        </p>
                        {getStatusBadge(order.orderStatus)}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-primary p-2 rounded">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-300">{item.qty}x</span>
                            <span className="text-white">{item.productId?.name || 'Product'}</span>
                          </div>
                          <span className="text-gray-400">${item.unitPrice?.toFixed(2)}</span>
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
                      {order.orderStatus !== 'cancelled' && order.paymentStatus === 'paid' && (
                        <>
                          {cancellingId === order._id ? (
                            <Dialog open={true} onOpenChange={(open) => { if (!open) { setCancellingId(null); setCancelReason(''); } }}>
                              <DialogContent className="bg-primary border-gray-700">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Cancel Order</DialogTitle>
                                  <DialogDescription className="text-gray-400">
                                    Please provide a reason for cancellation
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Input
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Cancellation reason"
                                    className="bg-secondary border-gray-700 text-white"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleCancel(order._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Confirm
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setCancellingId(null);
                                        setCancelReason('');
                                      }}
                                      variant="outline"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <>
                              <Button
                                onClick={() => setCancellingId(order._id)}
                                variant="destructive"
                                size="sm"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel Order
                              </Button>
                              <Button
                                onClick={() => handleReorder(order._id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Reorder
                              </Button>
                            </>
                          )}
                        </>
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

          {ordersData?.pagination && (
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
    </div>
  );
};

export default UserOrders;

