import { useQuery } from '@tanstack/react-query';
import { returnRefundAPI } from '@services/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { Eye } from 'lucide-react';
import { Button } from '@components/ui/button';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';

const STATUS_BADGES = {
  PENDING: { variant: 'warning', label: 'Pending' },
  SELLER_REVIEW: { variant: 'warning', label: 'Your review' },
  SELLER_APPROVED: { variant: 'default', label: 'Approved' },
  SELLER_REJECTED: { variant: 'destructive', label: 'Rejected' },
  ADMIN_REVIEW: { variant: 'secondary', label: 'In progress' },
  ADMIN_APPROVED: { variant: 'default', label: 'Admin approved' },
  ADMIN_REJECTED: { variant: 'destructive', label: 'Admin rejected' },
  COMPLETED: { variant: 'success', label: 'Completed' },
  WAITING_FOR_MANUAL_REFUND: { variant: 'secondary', label: 'Waiting manual refund' },
  ON_HOLD_INSUFFICIENT_FUNDS: { variant: 'destructive', label: 'On hold' },
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'destructive', label: 'Rejected' },
  completed: { variant: 'success', label: 'Completed' },
};

const getDisplayOrderId = (orderLike) => {
  if (!orderLike) return 'N/A';
  const orderNumber = typeof orderLike.orderNumber === 'string' ? orderLike.orderNumber.trim() : '';
  if (orderNumber) return orderNumber;
  const rawId = orderLike._id?.toString?.() || '';
  return rawId ? rawId.slice(-8).toUpperCase() : 'N/A';
};

const SellerReturnRefunds = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['seller-refunds'],
    queryFn: () => returnRefundAPI.getSellerRefundList().then(res => res.data.data),
  });

  const refunds = data?.refunds || [];

  const getStatusBadge = (status) => {
    const config = STATUS_BADGES[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) return <Loading message="Loading refunds..." />;
  if (isError) return <ErrorMessage message="Error loading refunds" />;

  const openDetail = (id) => navigate(`/seller/return-refunds/${id}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Return/Refund Requests</h1>
        <p className="text-gray-400 mt-1">View refund requests for your products. Admin has full authority; you may submit optional feedback.</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Refund Requests</CardTitle>
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
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Order</span>
                      <span className="text-gray-300 text-sm font-mono">#{getDisplayOrderId(refund.orderId)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Product</span>
                      <span className="text-white text-sm truncate max-w-[150px]">{refund.productId?.name || 'Product'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Customer</span>
                      <span className="text-gray-300 text-sm truncate max-w-[150px]">{refund.userId?.name || refund.userId?.email || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Amount</span>
                      <span className="text-white font-semibold">${refund.refundAmount?.toFixed(2) || refund.productId?.price?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Created</span>
                      <span className="text-gray-300 text-sm">{new Date(refund.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => openDetail(refund._id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
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
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Refund ID</TableHead>
                  <TableHead className="text-gray-300">Order</TableHead>
                  <TableHead className="text-gray-300">Product</TableHead>
                  <TableHead className="text-gray-300">Customer</TableHead>
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
                      <TableCell className="text-gray-400">
                        #{getDisplayOrderId(refund.orderId)}
                      </TableCell>
                      <TableCell className="text-gray-300">{refund.productId?.name || 'Product'}</TableCell>
                      <TableCell className="text-gray-400">{refund.userId?.name || refund.userId?.email || '-'}</TableCell>
                      <TableCell className="text-white font-semibold">
                        ${refund.refundAmount?.toFixed(2) || refund.productId?.price?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>{getStatusBadge(refund.status)}</TableCell>
                      <TableCell className="text-gray-400">{new Date(refund.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetail(refund._id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmptyRow colSpan={8}>No refund requests found</TableEmptyRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerReturnRefunds;
