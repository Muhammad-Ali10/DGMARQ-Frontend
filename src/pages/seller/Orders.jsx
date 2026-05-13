import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sellerAPI } from "../../services/api";
import { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Loading, ErrorMessage } from "../../components/ui/loading";
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";

const SellerOrders = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const {
    data: ordersData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["seller-orders", page, status],
    queryFn: () =>
      sellerAPI
        .getMyOrders({ page, limit: 10, status })
        .then((res) => res.data.data),
  });

  // Phase 6 / Step 12 PART C — when a refund is executed for one of this
  // seller's items, the order's net total / payout breakdown shifts and the
  // seller's available balance drops. Invalidate both data sources so the
  // UI reflects the new state without a manual refresh.
  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
      queryClient.invalidateQueries({ queryKey: ["seller-balance"] });
      queryClient.invalidateQueries({ queryKey: ["seller-payouts"] });
    };
    socket.on("refund_executed", onRefundExecuted);
    return () => socket.off("refund_executed", onRefundExecuted);
  }, [socket, isConnected, queryClient]);

  if (isLoading) return <Loading message="Loading orders..." />;
  if (isError) return <ErrorMessage message="Error loading orders" />;

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination || {};
  const totalPages = pagination.pages ?? pagination.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Orders</h1>
        <p className="text-gray-400 mt-1">View and manage customer orders</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Orders</CardTitle>
            <Select
              value={status || "all"}
              onValueChange={(value) => {
                setStatus(value === "all" ? "" : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48 bg-secondary border-gray-700 text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="PARTIALLY_REFUNDED">Partially Refunded</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No orders found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Order ID</TableHead>
                      <TableHead className="text-gray-300">Buyer</TableHead>
                      <TableHead className="text-gray-300">Items</TableHead>
                      <TableHead className="text-gray-300">Total</TableHead>
                      <TableHead className="text-gray-300">Refunded</TableHead>
                      <TableHead className="text-gray-300">Earning</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const sellerTotal = (order.items || []).reduce(
                        (sum, item) => sum + (Number(item.lineTotal) || 0) - (Number(item.refundedAmount) || 0),
                        0
                      );
                      const sellerEarning = (order.items || []).reduce(
                        (sum, item) => sum + (Number(item.sellerEarning) || 0) - (Number(item.refundedSellerAmount) || 0),
                        0
                      );
                      const refundedAmount = (order.items || []).reduce(
                        (sum, item) => sum + (Number(item.refundedAmount) || 0),
                        0
                      );
                      return (
                      <TableRow key={order._id} className="border-gray-700">
                      <TableCell className="text-white text-sm font-mono">
                          {order.orderNumber || order._id.slice(-8)}
                        </TableCell>
                        <TableCell className="text-white">
                          {order.buyer?.name || order.userId?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-white">
                          {order.items?.length || 0}
                        </TableCell>
                        <TableCell className="text-white">
                          ${sellerTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className={refundedAmount > 0 ? "text-amber-400/90" : "text-gray-500"}>
                          {refundedAmount > 0 ? `-$${refundedAmount.toFixed(2)}` : "—"}
                        </TableCell>
                        <TableCell className="text-green-400 font-semibold">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {sellerEarning.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.orderStatus === "completed"
                                ? "success"
                                : order.orderStatus === "cancelled"
                                ? "destructive"
                                : order.orderStatus === "processing"
                                ? "default"
                                : order.orderStatus === "partially_completed" || order.orderStatus === "returned" || order.orderStatus === "PARTIALLY_REFUNDED" || order.orderStatus === "REFUNDED"
                                ? "secondary"
                                : "warning"
                            }
                          >
                            {order.orderStatus === "partially_completed" || order.orderStatus === "PARTIALLY_REFUNDED" ? "Partially refunded" : order.orderStatus === "returned" || order.orderStatus === "REFUNDED" ? "Refunded" : order.orderStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                        <Link to={`/seller/orders/${order._id}`}>
                        <Button variant="outline" size="sm" className="bg-accent hover:bg-blue-700 text-white border-0">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link> 
                        </TableCell>
                      </TableRow>
                    );
                    })}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400">
                    Page {page} of {totalPages} ({pagination.total ?? orders.length} total orders)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="border-gray-700 text-gray-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page >= totalPages}
                      className="border-gray-700 text-gray-300"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerOrders;
