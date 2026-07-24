import { useQuery, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '@services/api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '@hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { Plus, Eye, DollarSign } from 'lucide-react';
import { RefundRequestModal } from '@features/wallet-payout';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';

const STATUS_LABELS = {
  PENDING: 'Pending',
  SELLER_REVIEW: 'With seller',
  SELLER_APPROVED: 'Seller approved',
  SELLER_REJECTED: 'Seller rejected',
  ADMIN_REVIEW: 'In progress',
  ADMIN_APPROVED: 'Admin approved',
  ADMIN_REJECTED: 'Rejected',
  COMPLETED: 'Completed',
  WAITING_FOR_MANUAL_REFUND: 'Waiting manual refund',
  ON_HOLD_INSUFFICIENT_FUNDS: 'On hold',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
};

// `sellerId` is populated with `shopName` by the refund endpoints; fall back to a
// generic label if a populate is ever missed (mirrors OrderDetail's read).
const getSellerName = (refund) => refund?.sellerId?.shopName || 'Seller';

const UserReturnRefunds = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const { data: refundsData, isLoading, isError } = useQuery({
    queryKey: ['user-refunds'],
    queryFn: () => returnRefundAPI.getMyRefunds().then(res => res.data.data),
  });

  // Phase 6 / Step 12 PART C — refund_executed socket fan-out updates the
  // buyer's refund list when a status flips.
  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['user-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient]);

  const refunds = refundsData?.refunds || [];

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'warning', SELLER_REVIEW: 'warning', SELLER_APPROVED: 'default', SELLER_REJECTED: 'destructive',
      ADMIN_REVIEW: 'secondary', ADMIN_APPROVED: 'default', ADMIN_REJECTED: 'destructive',
      COMPLETED: 'success', ON_HOLD_INSUFFICIENT_FUNDS: 'destructive',
      pending: 'warning', approved: 'default', rejected: 'destructive', completed: 'success', cancelled: 'secondary',
    };
    const label = STATUS_LABELS[status] || status;
    return <Badge variant={variants[status] || 'default'}>{label}</Badge>;
  };

  if (isLoading) return <Loading message="Loading refunds..." />;
  if (isError) return <ErrorMessage message="Error loading refunds" />;

  const openDetail = (id) => navigate(`/user/return-refunds/${id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Return/Refund Requests</h1>
          <p className="text-gray-400 mt-1">Manage your return and refund requests</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-accent hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Refund
        </Button>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Refund Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile card view */}
          <div className="sm:hidden space-y-3">
            {refunds.length > 0 ? (
              refunds.map((refund) => (
                <div
                  key={refund._id}
                  className="bg-secondary border border-gray-700 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-mono text-sm">#{refund._id?.slice(-8)}</span>
                    {getStatusBadge(refund.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Amount</span>
                    <span className="text-white font-semibold flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {refund.refundAmount?.toFixed(2) || refund.productId?.price?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Sold by</span>
                    <span className="text-gray-300 text-sm">{getSellerName(refund)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Created</span>
                    <span className="text-gray-300 text-sm">{new Date(refund.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-700">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openDetail(refund._id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No refund requests found" />
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">ID</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Sold by</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.length > 0 ? (
                  refunds.map((refund) => (
                    <TableRow key={refund._id} className="border-gray-700">
                      <TableCell className="text-white font-mono text-sm">{refund._id?.slice(-8)}</TableCell>
                      <TableCell className="text-gray-400">Refund</TableCell>
                      <TableCell className="text-gray-300">{getSellerName(refund)}</TableCell>
                      <TableCell className="text-white font-semibold">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        ${refund.refundAmount?.toFixed(2) || refund.productId?.price?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>{getStatusBadge(refund.status)}</TableCell>
                      <TableCell className="text-gray-400">{new Date(refund.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetail(refund._id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmptyRow colSpan={7}>No refund requests found</TableEmptyRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <RefundRequestModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
};

export default UserReturnRefunds;
