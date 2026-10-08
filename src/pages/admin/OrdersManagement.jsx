import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '@services/api';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { TableEmptyRow } from '@components/common/EmptyState';
import { StatusBadge } from '@components/common/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Button } from '@components/ui/button';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { Eye } from 'lucide-react';
import { Pagination } from '@components/common/Pagination';
import { countryName, countryFlag } from '@lib/regionCompat';
import useCurrency from '@hooks/useCurrency';
import { getStatusDisplay } from '@lib/statusTaxonomy';

const ORDER_STATUS_FILTERS = ['completed', 'partially_completed', 'processing', 'pending', 'PARTIALLY_REFUNDED', 'REFUNDED', 'cancelled'];
const PAYMENT_STATUS_FILTERS = ['paid', 'pending', 'failed', 'partially_refunded', 'refunded'];

const formatPayPalFee = (amount, currency) => {
  if (typeof amount !== 'number') return null;
  return currency && currency !== 'USD'
    ? `${amount.toFixed(2)} ${currency}`
    : `$${amount.toFixed(2)}`;
};

const OrdersManagement = () => {
  const { format: formatMoney } = useCurrency();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  const { data: ordersData, isLoading, isError, error } = useQuery({
    queryKey: ['admin-orders', page, status, paymentStatus],
    queryFn: async () => {
      const response = await orderAPI.getAllOrders({
        page,
        limit: 10,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
      });
      return response.data.data;
    },
    retry: 1,
  });

  if (isLoading) return <Loading message="Loading orders..." />;
  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || "Error loading orders";
    return <ErrorMessage message={errorMessage} />;
  }

  const orders = Array.isArray(ordersData) 
    ? ordersData 
    : (ordersData?.orders || ordersData?.docs || []);
  const pagination = ordersData?.pagination || {};
  const currentPage = pagination.page ?? page;
  const totalItems = pagination.total ?? orders.length;
  const totalPages = pagination.pages ?? pagination.totalPages ?? 1;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Orders Management</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">View and manage all orders</p>
      </div>

      <Card variant="hud">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Orders</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={status || "all"} onValueChange={(value) => { setStatus(value === "all" ? "" : value); setPage(1); }}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white" aria-label="Filter by order status">
                <SelectValue placeholder="All order statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All order statuses</SelectItem>
                {ORDER_STATUS_FILTERS.map((value) => (
                  <SelectItem key={value} value={value}>{getStatusDisplay('order', value).label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentStatus || "all"} onValueChange={(value) => { setPaymentStatus(value === "all" ? "" : value); setPage(1); }}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white" aria-label="Filter by payment status">
                <SelectValue placeholder="All payments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payments</SelectItem>
                {PAYMENT_STATUS_FILTERS.map((value) => (
                  <SelectItem key={value} value={value}>{getStatusDisplay('payment', value).label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No orders found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table variant="hud">
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800">
                      <TableHead className="text-gray-300">Order ID</TableHead>
                      <TableHead className="text-gray-300">User</TableHead>
                      <TableHead className="text-gray-300">Total</TableHead>
                      <TableHead className="text-gray-300">Country</TableHead>
                      <TableHead className="text-gray-300">PayPal fee</TableHead>
                      <TableHead className="text-gray-300">Refunded</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Payment</TableHead>
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders && orders.length > 0 ? (
                      orders.map((order) => {
                        const orderId = order._id?.toString() || order.id?.toString() || 'N/A';
                        const displayId = order.orderNumber || (orderId !== 'N/A' ? orderId.slice(-8) : 'N/A');
                        const userName = order.userId?.name
                          || (typeof order.userId === 'object' ? order.userId?.email : null)
                          || (order.isGuest ? (order.guestEmail ? `Guest · ${order.guestEmail}` : 'Guest checkout') : 'N/A');
                        const refundedAmount = (order.items || []).reduce(
                          (sum, item) => sum + (Number(item.refundedAmount) || 0),
                          0
                        );
                        const paypalFee = formatPayPalFee(order.paypalFee, order.paypalFeeCurrency);
                        return (
                          <TableRow key={orderId} className="border-gray-700 hover:bg-gray-800">
                          <TableCell className="text-white font-mono text-sm">
                              {displayId}
                            </TableCell>
                            <TableCell className="text-gray-300">{userName}</TableCell>
                            <TableCell className="text-white font-semibold">
                              {formatMoney(order.grandTotal ?? order.totalAmount ?? 0)}
                            </TableCell>
                            <TableCell className={order.buyerCountry ? "text-gray-300" : "text-gray-500"}>
                              {order.buyerCountry
                                ? `${countryFlag(order.buyerCountry)} ${countryName(order.buyerCountry)}`
                                : "—"}
                            </TableCell>
                            <TableCell className={paypalFee ? "text-gray-300" : "text-gray-500"}>
                              {paypalFee ?? "—"}
                            </TableCell>
                            <TableCell className={refundedAmount > 0 ? "text-amber-400/90" : "text-gray-500"}>
                              {refundedAmount > 0 ? `-${formatMoney(refundedAmount)}` : "—"}
                            </TableCell>
                            <TableCell><StatusBadge domain="order" status={order.orderStatus} /></TableCell>
                            <TableCell><StatusBadge domain="payment" status={order.paymentStatus || 'pending'} /></TableCell>
                            <TableCell className="text-gray-300">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link to={`/admin/orders/${order._id}`}>
                                <Button variant="outline" size="sm" className="gap-1.5">
                                  <Eye className="h-4 w-4" />
                                  View Order Detail
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableEmptyRow colSpan={10}>No orders found</TableEmptyRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
                total={totalItems}
                totalNoun="orders"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersManagement;
