import { useQuery, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '@services/api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '@hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { Eye } from 'lucide-react';
import { Pagination } from '@components/common/Pagination';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';
import { refundBadgeProps } from '@features/wallet-payout';
import { getDisplayOrderId } from '@lib/orderDisplay';

const ReturnRefundManagement = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const { data: refundsData, isLoading, isError, error } = useQuery({
    queryKey: ['admin-refunds', page, statusFilter],
    queryFn: () => returnRefundAPI.getAllRefunds({ page, limit: 10, status: statusFilter || undefined }).then(res => res.data.data),
  });

  // Phase 6 / Step 12 PART C — refund_executed socket fan-out lands in the
  // role:admin room, so every admin viewing the list sees the flip live.
  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-balance'] });
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient]);

  // AUDIT FIX (DEAD-3): was a private status map that labelled ADMIN_REVIEW
  // 'In progress' while the detail page one click away called the same status
  // 'Admin review'. Both private copies are gone; this reads the canonical
  // taxonomy, which also brings the legacy lowercase aliases with it.
  const getStatusBadge = (status) => <Badge {...refundBadgeProps(status)} />;

  const getProductTypeBadge = (productType) => {
    if (productType === 'ACCOUNT_BASED') {
      return <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/50">Account Based</Badge>;
    }
    return <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/50">Key Based</Badge>;
  };

  if (isLoading) return <Loading message="Loading refunds..." />;
  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || "Error loading refunds";
    return <ErrorMessage message={errorMessage} />;
  }

  const refunds = refundsData?.refunds || [];
  const pagination = refundsData?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };

  const openDetail = (id) => navigate(`/admin/return-refund/${id}`);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Refund Management</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Review and manage refund requests. Approve or reject from each refund&apos;s detail page.</p>
      </div>

      <Card variant="hud">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Refund Requests</CardTitle>
          <Select value={statusFilter || "all"} onValueChange={(value) => { setStatusFilter(value === "all" ? "" : value); setPage(1); }}>
            <SelectTrigger className="w-48 bg-secondary border-gray-700 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ADMIN_REVIEW">In progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ADMIN_REJECTED">Rejected</SelectItem>
              <SelectItem value="ON_HOLD_INSUFFICIENT_FUNDS">On hold</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {/* Mobile card view */}
          <div className="lg:hidden space-y-3">
            {refunds.length > 0 ? (
              refunds.map((refund) => (
                <div
                  key={refund._id}
                  className="bg-secondary border border-gray-700 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-mono text-sm">#{refund._id.slice(-8)}</span>
                    {getStatusBadge(refund.status)}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Order</span>
                      <span className="text-gray-300 font-mono">
                        {refund.orderId ? `#${getDisplayOrderId(refund.orderId)}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Customer</span>
                      <span className="text-white truncate max-w-[150px]">{refund.userId?.name || refund.userId?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Product</span>
                      <span className="text-gray-300 truncate max-w-[150px]">{refund.productId?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Seller</span>
                      <span className="text-gray-300 truncate max-w-[150px]">{refund.sellerId?.shopName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Amount</span>
                      <span className="text-white font-semibold">${refund.refundAmount?.toFixed(2) || refund.productId?.price?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Date</span>
                      <span className="text-gray-300">{new Date(refund.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => openDetail(refund._id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No refund requests found" />
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden lg:block overflow-x-auto">
            <Table variant="hud">
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Refund ID</TableHead>
                  <TableHead className="text-gray-300">Order ID</TableHead>
                  <TableHead className="text-gray-300">Customer</TableHead>
                  <TableHead className="text-gray-300">Product</TableHead>
                  <TableHead className="text-gray-300">Seller</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Date</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.length > 0 ? (
                  refunds.map((refund) => (
                    <TableRow key={refund._id} className="border-gray-700 hover:bg-gray-800/50">
                      <TableCell className="text-white font-mono text-sm">{refund._id.slice(-8)}</TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {refund.orderId ? `#${getDisplayOrderId(refund.orderId)}` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex flex-col">
                          <span className="font-medium">{refund.userId?.name || 'N/A'}</span>
                          <span className="text-xs text-gray-400">{refund.userId?.email || ''}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{refund.productId?.name || 'N/A'}</span>
                          {refund.productId?.productType && getProductTypeBadge(refund.productId.productType)}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{refund.sellerId?.shopName || 'N/A'}</TableCell>
                      <TableCell className="text-white font-semibold">
                        ${refund.refundAmount?.toFixed(2) || refund.productId?.price?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>{getStatusBadge(refund.status)}</TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetail(refund._id)}
                          className="border-gray-700 hover:bg-gray-700"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmptyRow colSpan={9}>No refund requests found</TableEmptyRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ReturnRefundManagement;
