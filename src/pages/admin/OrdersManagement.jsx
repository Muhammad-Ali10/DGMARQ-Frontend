import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const OrdersManagement = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data: ordersData, isLoading, isError, error } = useQuery({
    queryKey: ['admin-orders', page, status],
    queryFn: async () => {
      try {
        const response = await orderAPI.getAllOrders({ 
          page, 
          limit: 20, 
          status: status || undefined 
        });
        return response.data.data;
      } catch (err) {
        console.error('Orders error:', err);
        throw err;
      }
    },
    retry: 1,
  });

  if (isLoading) return <Loading message="Loading orders..." />;
  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || "Error loading orders";
    return <ErrorMessage message={errorMessage} />;
  }

  // Handle different response structures
  const orders = Array.isArray(ordersData) 
    ? ordersData 
    : (ordersData?.orders || ordersData?.docs || []);
  const pagination = ordersData?.pagination || { 
    page: 1, 
    limit: 20, 
    total: orders.length, 
    pages: 1 
  };

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
    <div className="space-y-6 px-4 sm:px-0">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Orders Management</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">View and manage all orders</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">All Orders</CardTitle>
          <Select value={status || "all"} onValueChange={(value) => { setStatus(value === "all" ? "" : value); setPage(1); }}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
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
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No orders found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800">
                      <TableHead className="text-gray-300">Order ID</TableHead>
                      <TableHead className="text-gray-300">User</TableHead>
                      <TableHead className="text-gray-300">Total</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Payment</TableHead>
                      <TableHead className="text-gray-300">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders && orders.length > 0 ? (
                      orders.map((order) => {
                        const orderId = order._id?.toString() || order.id?.toString() || 'N/A';
                        const userName = order.userId?.name || 
                                       (typeof order.userId === 'object' ? order.userId?.email : null) || 
                                       'N/A';
                        return (
                          <TableRow key={orderId} className="border-gray-700 hover:bg-gray-800">
                            <TableCell className="text-white font-mono text-sm">
                              {orderId !== 'N/A' ? orderId.slice(-8) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-gray-300">{userName}</TableCell>
                            <TableCell className="text-white font-semibold">
                              ${order.totalAmount?.toFixed(2) || '0.00'}
                            </TableCell>
                            <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                            <TableCell>
                              <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                                {order.paymentStatus || 'pending'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan="6" className="text-center py-12 text-gray-400">
                          No orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-gray-300">
                    Page {page} of {pagination.pages || 1}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(pagination.pages || 1, p + 1))}
                    disabled={page === (pagination.pages || 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersManagement;
