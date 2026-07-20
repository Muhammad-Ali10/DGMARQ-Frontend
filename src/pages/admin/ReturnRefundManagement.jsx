import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '@services/api';
import { useEffect, useState } from 'react';
import { useSocket } from '@hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@components/ui/dialog';
import { Badge } from '@components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { Eye, CheckCircle2, XCircle, AlertCircle, Package, User, Store, FileText, Key, EyeOff } from 'lucide-react';
import { RefundChat, isRefundChatLocked } from '@features/wallet-payout';
import { toast } from 'sonner';
import SafeImage from '@components/ui/safe-image';

const getDisplayOrderId = (orderLike) => {
  if (!orderLike) return 'N/A';
  const orderNumber = typeof orderLike.orderNumber === 'string' ? orderLike.orderNumber.trim() : '';
  if (orderNumber) return orderNumber;
  const rawId = orderLike._id?.toString?.() || '';
  return rawId ? rawId.slice(-8).toUpperCase() : 'N/A';
};

const ReturnRefundManagement = () => {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [sellerInputNote, setSellerInputNote] = useState('');
  const [showRequestSellerInput, setShowRequestSellerInput] = useState(false);
  const [showKeyDetails, setShowKeyDetails] = useState(false);
  const [keyDetails, setKeyDetails] = useState(null);
  const [keyDetailsLoading, setKeyDetailsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const { data: refundsData, isLoading, isError, error } = useQuery({
    queryKey: ['admin-refunds', page, statusFilter],
    queryFn: () => returnRefundAPI.getAllRefunds({ page, limit: 10, status: statusFilter || undefined }).then(res => res.data.data),
  });

  // Phase 6 / Step 12 PART C — refund_executed socket fan-out lands in the
  // role:admin room, so this listener fires for every admin viewing the page.
  // We invalidate the refund list, the per-refund detail (if open), the
  // order detail, and the seller-balance source so admins see the executed
  // refund without reloading.
  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-refund-details'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
      queryClient.invalidateQueries({ queryKey: ['seller-balance'] });
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient]);

  const updateMutation = useMutation({
    mutationFn: ({ refundId, data }) => returnRefundAPI.updateRefundStatus(refundId, data),
    onSuccess: (res) => {
      // Backend returns 202 + payload.providerFailed=true when the automated
      // provider refund could not run. The refund remains in admin review for retry.
      const payload = res?.data?.data;
      const message = actionType === 'reject'
        ? 'Refund request rejected'
        : payload?.providerFailed
          ? (res?.data?.message || 'Provider refund failed. Fix the issue and retry approval.')
          : (res?.data?.message || 'Refund approved and processed successfully');
      if (payload?.providerFailed) {
        toast.warning(message);
      } else {
        toast.success(message);
      }
      // Refresh refunds and all affected order views (admin, seller, user)
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-detail'] });
      setIsActionOpen(false);
      setSelectedRefund(null);
      setAdminNotes('');
      setRejectionReason('');
      setActionType(null);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to update refund status';
      toast.error(errorMessage);
    },
  });

  const requestSellerInputMutation = useMutation({
    mutationFn: ({ refundId, note }) => returnRefundAPI.requestSellerInput(refundId, note),
    onSuccess: () => {
      toast.success('Seller has been requested to provide input.');
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      setSellerInputNote('');
      setShowRequestSellerInput(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to request seller input');
    },
  });

  const handleApprove = (refund) => {
    setSelectedRefund(refund);
    setActionType('approve');
    setAdminNotes('');
    setIsActionOpen(true);
  };

  const handleReject = (refund) => {
    setSelectedRefund(refund);
    setActionType('reject');
    setRejectionReason('');
    setAdminNotes('');
    setIsActionOpen(true);
  };

  const handleSubmitAction = (e) => {
    e.preventDefault();
    if (actionType === 'reject' && !rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    const s = selectedRefund ? String(selectedRefund.status || '').toUpperCase() : '';
    const status =
      actionType === 'approve'
        ? (s === 'ADMIN_REVIEW' ? 'ADMIN_APPROVED' : 'approved')
        : (['ADMIN_REVIEW', 'ON_HOLD_INSUFFICIENT_FUNDS'].includes(s) ? 'ADMIN_REJECTED' : 'rejected');
    const data = {
      status,
      adminNotes: adminNotes || undefined,
      rejectionReason: actionType === 'reject' ? rejectionReason : undefined,
    };
    updateMutation.mutate({ refundId: selectedRefund._id, data });
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'warning', SELLER_REVIEW: 'warning', SELLER_APPROVED: 'default', SELLER_REJECTED: 'destructive',
      ADMIN_REVIEW: 'secondary', ADMIN_APPROVED: 'default', ADMIN_REJECTED: 'destructive',
      COMPLETED: 'success', WAITING_FOR_MANUAL_REFUND: 'secondary',
      ON_HOLD_INSUFFICIENT_FUNDS: 'destructive',
      pending: 'warning', approved: 'default', rejected: 'destructive', completed: 'success',
    };
    const labels = {
      PENDING: 'Pending', SELLER_REVIEW: 'Seller review', SELLER_APPROVED: 'Seller approved', SELLER_REJECTED: 'Seller rejected',
      ADMIN_REVIEW: 'In progress', ADMIN_APPROVED: 'Admin approved', ADMIN_REJECTED: 'Rejected',
      COMPLETED: 'Completed', WAITING_FOR_MANUAL_REFUND: 'Waiting manual refund',
      ON_HOLD_INSUFFICIENT_FUNDS: 'On hold (insufficient funds)',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const getRefundStatus = (refund) => String(refund?.status || '').toUpperCase();

  const statusAllowsAdminActions = (refund) => {
    const s = getRefundStatus(refund);
    return s === 'ADMIN_REVIEW' || s === 'ON_HOLD_INSUFFICIENT_FUNDS';
  };

  const canAdminApprove = (refund) => getRefundStatus(refund) === 'ADMIN_REVIEW';

  const canAdminReject = (refund) => statusAllowsAdminActions(refund);

  const getProductTypeBadge = (productType) => {
    if (productType === 'ACCOUNT_BASED') {
      return <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/50">Account Based</Badge>;
    }
    return <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/50">Key Based</Badge>;
  };

  const { data: refundDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['admin-refund-details', selectedRefund?._id],
    queryFn: () => returnRefundAPI.getRefundById(selectedRefund?._id).then((res) => res.data.data),
    enabled: !!selectedRefund?._id && isViewOpen,
  });

  if (isLoading) return <Loading message="Loading refunds..." />;
  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || "Error loading refunds";
    return <ErrorMessage message={errorMessage} />;
  }

  const refunds = refundsData?.refunds || [];
  const pagination = refundsData?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };
  const refundView = refundDetails || selectedRefund;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Refund Management</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Review and manage refund requests</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">All Refund Requests</CardTitle>
          <Select value={statusFilter || "all"} onValueChange={(value) => { setStatusFilter(value === "all" ? "" : value); setPage(1); }}>
            <SelectTrigger className="w-48 bg-secondary border-gray-700 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SELLER_REVIEW">Seller review</SelectItem>
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
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedRefund(refund);
                        setIsViewOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {canAdminApprove(refund) && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(refund)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    {canAdminReject(refund) && (
                      <Button
                        size="sm"
                        onClick={() => handleReject(refund)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">No refund requests found</div>
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
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
                      <TableCell className="text-white font-mono text-sm">
                        {refund._id.slice(-8)}
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {refund.orderId
                          ? `#${getDisplayOrderId(refund.orderId)}`
                          : 'N/A'}
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
                      <TableCell className="text-gray-300">
                        {refund.sellerId?.shopName || 'N/A'}
                      </TableCell>
                      <TableCell className="text-white font-semibold">
                        ${refund.refundAmount?.toFixed(2) || refund.productId?.price?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>{getStatusBadge(refund.status)}</TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setIsViewOpen(true);
                            }}
                            className="border-gray-700 hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canAdminApprove(refund) && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(refund)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          {canAdminReject(refund) && (
                            <Button
                              size="sm"
                              onClick={() => handleReject(refund)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                      No refund requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {(pagination.total ?? 0) > 0 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-400">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={(open) => {
        if (!open) { setShowRequestSellerInput(false); setSellerInputNote(''); setShowKeyDetails(false); setKeyDetails(null); }
        setIsViewOpen(open);
      }}>
        <DialogContent size="lg" className="bg-primary border-gray-700 max-h-[90vh] h-[90vh] sm:h-auto overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-white">Refund Request Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete information about the refund request
            </DialogDescription>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-6 mt-4 overflow-y-auto pr-1">
              {detailsLoading ? (
                <Loading message="Loading refund details..." />
              ) : (
                <>
              {/* Order Information */}
              <div className="p-4 bg-secondary rounded-lg border border-gray-700">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-accent" />
                  Order Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Order ID:</span>
                    <p className="text-white font-mono">
                      {refundView?.orderId ? getDisplayOrderId(refundView.orderId) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Order Date:</span>
                    <p className="text-white">
                      {refundView?.orderId?.createdAt 
                        ? new Date(refundView.orderId.createdAt).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Order Status:</span>
                    <p className="text-white">{refundView?.orderId?.orderStatus || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Order Total:</span>
                    <p className="text-white font-semibold">
                      ${refundView?.orderId?.totalAmount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="p-4 bg-secondary rounded-lg border border-gray-700">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-accent" />
                  Product Information
                </h3>
                <div className="space-y-3">
                  {refundView?.productId?.images?.[0] && (
                    <SafeImage
                      src={refundView.productId.images[0]}
                      alt={refundView.productId.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                  <div>
                    <span className="text-gray-400">Product Name:</span>
                    <p className="text-white font-medium">{refundView?.productId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Product Type:</span>
                    <div className="mt-1">
                      {refundView?.productId?.productType && getProductTypeBadge(refundView.productId.productType)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Product Price:</span>
                    <p className="text-white font-semibold">
                      ${refundView?.productId?.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Refund Amount:</span>
                    <p className="text-white font-bold text-lg">
                      ${refundView?.refundAmount?.toFixed(2) || refundView?.productId?.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="p-4 bg-secondary rounded-lg border border-gray-700">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-accent" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <p className="text-white">{refundView?.userId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <p className="text-white">{refundView?.userId?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div className="p-4 bg-secondary rounded-lg border border-gray-700">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Store className="w-5 h-5 text-accent" />
                  Seller Information
                </h3>
                <div className="text-sm">
                  <span className="text-gray-400">Shop Name:</span>
                  <p className="text-white">{refundView?.sellerId?.shopName || 'N/A'}</p>
                </div>
              </div>

              {/* Refund Details */}
              <div className="p-4 bg-secondary rounded-lg border border-gray-700">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  Refund Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-400">Refund Reason:</span>
                    <p className="text-white mt-1">{refundView?.reason || 'No reason provided'}</p>
                  </div>
                  {refundView?.refundMethod && (
                    <div>
                      <span className="text-gray-400">Refund method:</span>
                      <p className="text-white mt-1 capitalize">{refundView.refundMethod.replace('_', ' ')}</p>
                    </div>
                  )}
                  {(Number(refundView?.walletRefundAmount || 0) > 0 || Number(refundView?.providerRefundAmount || 0) > 0) && (
                    <div>
                      <span className="text-gray-400">Refund split:</span>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5">
                          <p className="text-emerald-200/80">Wallet portion</p>
                          <p className="text-emerald-100 font-semibold">${Number(refundView?.walletRefundAmount || 0).toFixed(2)}</p>
                        </div>
                        <div className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-1.5">
                          <p className="text-sky-200/80">Provider (PayPal capture)</p>
                          <p className="text-sky-100 font-semibold">${Number(refundView?.providerRefundAmount || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      {refundView?.splitBreakdown?.paypalCaptureId && (
                        <p className="mt-2 text-[11px] text-gray-400">
                          Capture ID: <span className="font-mono">{refundView.splitBreakdown.paypalCaptureId}</span>
                        </p>
                      )}
                    </div>
                  )}
                  {(refundView?.providerRefundStatus && refundView.providerRefundStatus !== 'NONE') && (
                    <div>
                      <span className="text-gray-400">Provider refund status:</span>
                      <p className="text-white mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          refundView.providerRefundStatus === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-200' :
                          refundView.providerRefundStatus === 'FAILED' ? 'bg-red-500/20 text-red-200' :
                          'bg-amber-500/20 text-amber-200'
                        }`}>
                          {refundView.providerRefundStatus}
                        </span>
                        {Array.isArray(refundView?.providerRefundIds) && refundView.providerRefundIds.length > 0 && (
                          <span className="ml-2 font-mono text-xs text-gray-400">
                            {refundView.providerRefundIds[refundView.providerRefundIds.length - 1]}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {refundView?.fallbackUsed && (
                    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200">
                      Provider portion was completed manually by admin (fallback).
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <div className="mt-1">{getStatusBadge(refundView?.status)}</div>
                  </div>
                  {(canAdminApprove(selectedRefund) || canAdminReject(selectedRefund)) && (
                    <div className="pt-3 pb-2 border-t border-gray-700">
                      <Label className="text-gray-300 block mb-2">Admin actions</Label>
                      <div className="flex flex-wrap gap-2">
                        {canAdminApprove(selectedRefund) && (
                          <Button
                            size="sm"
                            onClick={() => { setActionType('approve'); setAdminNotes(''); setIsViewOpen(false); setIsActionOpen(true); }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve refund
                          </Button>
                        )}
                        {canAdminReject(selectedRefund) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => { setActionType('reject'); setRejectionReason(''); setAdminNotes(''); setIsViewOpen(false); setIsActionOpen(true); }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject refund
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {getRefundStatus(selectedRefund) === 'ADMIN_REVIEW' && (
                    <div className="pt-2">
                      {!showRequestSellerInput ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowRequestSellerInput(true)}
                          className="border-gray-600 text-gray-300"
                        >
                          Request seller input
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-gray-300">Message to seller (e.g. &quot;Was this license valid at delivery?&quot;)</Label>
                          <Textarea
                            value={sellerInputNote}
                            onChange={(e) => setSellerInputNote(e.target.value)}
                            placeholder="Ask seller for clarification..."
                            rows={2}
                            className="bg-secondary border-gray-700 text-white w-full"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => requestSellerInputMutation.mutate({ refundId: selectedRefund._id, note: sellerInputNote })}
                              disabled={requestSellerInputMutation.isPending || !sellerInputNote.trim()}
                              className="bg-accent hover:bg-accent/90"
                            >
                              Send request
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setShowRequestSellerInput(false); setSellerInputNote(''); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {refundView?.currentStage && (
                    <div>
                      <span className="text-gray-400">Stage:</span>
                      <p className="text-white mt-1">{refundView.currentStage}</p>
                    </div>
                  )}
                  {refundView?.licenseKeyIds?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">License keys in request:</span>
                        <span className="text-white">{refundView.licenseKeyIds.length} key(s)</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (showKeyDetails) {
                            setShowKeyDetails(false);
                            setKeyDetails(null);
                          } else {
                            setKeyDetailsLoading(true);
                            try {
                              const res = await returnRefundAPI.getRefundKeyDetails(selectedRefund._id);
                              setKeyDetails(res.data.data);
                              setShowKeyDetails(true);
                            } catch (err) {
                              toast.error(err.response?.data?.message || 'Failed to load key details');
                            } finally {
                              setKeyDetailsLoading(false);
                            }
                          }
                        }}
                        disabled={keyDetailsLoading}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        {keyDetailsLoading ? (
                          'Loading...'
                        ) : showKeyDetails ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Hide Keys/Details
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4 mr-1" />
                            Show Keys/Details
                          </>
                        )}
                      </Button>
                      {showKeyDetails && keyDetails && (
                        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2">
                          <p className="text-xs text-amber-400 mb-2">⚠️ Sensitive information - handle with care</p>
                          {keyDetails.keys?.length > 0 ? (
                            keyDetails.keys.map((key, idx) => (
                              <div key={key.keyId || idx} className="p-2 bg-gray-900/50 rounded border border-gray-600">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-400 mb-1">
                                      {keyDetails.productType === 'ACCOUNT_BASED' ? 'Account Credentials' : 'License Key'}
                                      {key.keyType && key.keyType !== 'other' && (
                                        <span className="ml-2 text-gray-500">({key.keyType})</span>
                                      )}
                                    </p>
                                    <p className="text-white font-mono text-sm break-all select-all">{key.keyData}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    {key.isRefunded ? (
                                      <Badge variant="secondary" className="text-xs">Refunded</Badge>
                                    ) : key.isUsed ? (
                                      <Badge variant="warning" className="text-xs">Used</Badge>
                                    ) : (
                                      <Badge variant="success" className="text-xs">Available</Badge>
                                    )}
                                  </div>
                                </div>
                                {key.assignedAt && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Assigned: {new Date(key.assignedAt).toLocaleString()}
                                  </p>
                                )}
                                {key.refundedAt && (
                                  <p className="text-xs text-gray-500">
                                    Refunded: {new Date(key.refundedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-400 text-sm">No key details available</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {refundView?.sellerDecisionReason && (
                    <div>
                      <span className="text-gray-400">Seller rejection reason (escalated):</span>
                      <p className="text-amber-300 mt-1">{refundView.sellerDecisionReason}</p>
                    </div>
                  )}
                  {refundView?.evidenceFiles?.length > 0 && (
                    <div>
                      <span className="text-gray-400">Evidence:</span>
                      <div className="mt-2 flex flex-wrap gap-3">
                        {refundView.evidenceFiles.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded border border-gray-600 overflow-hidden hover:border-accent">
                            <SafeImage src={url} alt={`Evidence ${i + 1}`} className="h-24 w-auto max-w-[200px] object-cover" />
                            <span className="block text-xs text-accent p-1 text-center">View full</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {refundView?.sellerFeedback && (
                    <div>
                      <span className="text-gray-400">Seller feedback (advisory):</span>
                      <p className="text-white mt-1 text-sm">{refundView.sellerFeedback}</p>
                      {refundView.sellerFeedbackAt && (
                        <p className="text-gray-500 text-xs mt-0.5">{new Date(refundView.sellerFeedbackAt).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                  {refundView?.refundHistory?.length > 0 && (
                    <div>
                      <span className="text-gray-400">History:</span>
                      <ul className="mt-1 text-xs text-gray-300 space-y-1">
                        {refundView.refundHistory.map((h, i) => (
                          <li key={i}>{h.actor}: {h.action} — {h.newStatus || h.previousStatus} {h.timestamp && new Date(h.timestamp).toLocaleString()}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {refundView?.adminNotes && (
                    <div>
                      <span className="text-gray-400">Admin Notes:</span>
                      <p className="text-white mt-1">{refundView.adminNotes}</p>
                    </div>
                  )}
                  {refundView?.rejectionReason && (
                    <div>
                      <span className="text-gray-400">Rejection Reason:</span>
                      <p className="text-red-400 mt-1">{refundView.rejectionReason}</p>
                    </div>
                  )}
                  {refundView?.refundedAt && (
                    <div>
                      <span className="text-gray-400">Refunded At:</span>
                      <p className="text-white mt-1">{new Date(refundView.refundedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
              </>
              )}

              <RefundChat refundId={selectedRefund._id} canSend={true} locked={isRefundChatLocked(selectedRefund.status)} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent size="sm" className="bg-primary border-gray-700 max-h-[90vh] h-[90vh] sm:h-auto overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionType === 'approve' ? 'Approve Refund' : 'Reject Refund'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionType === 'approve' 
                ? 'This will process the refund, credit the customer wallet, and deduct from seller balance.'
                : 'Please provide a reason for rejecting this refund request.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAction} className="space-y-4 mt-4 overflow-y-auto pr-1">
            {actionType === 'reject' && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason" className="text-white">
                  Rejection Reason *
                </Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this refund request..."
                  rows={4}
                  className="bg-secondary border-gray-700 text-white placeholder:text-gray-500 resize-none focus:border-accent"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="adminNotes" className="text-white">
                Admin Notes {actionType === 'approve' && '(Optional)'}
              </Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
                className="bg-secondary border-gray-700 text-white placeholder:text-gray-500 resize-none focus:border-accent"
                required={actionType === 'reject'}
              />
            </div>
            {actionType === 'approve' && selectedRefund && (() => {
              const totalRefund = Number(selectedRefund.refundAmount || 0);
              const walletPortion = Number(selectedRefund.walletRefundAmount || 0);
              const providerPortion = Number(selectedRefund.providerRefundAmount || 0);
              const hasSplit = walletPortion > 0 || providerPortion > 0;
              return (
                <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-200">
                      <p className="font-semibold mb-1">Important:</p>
                      <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
                        {hasSplit ? (
                          <>
                            {providerPortion > 0 && (
                              <li>${providerPortion.toFixed(2)} will be refunded to the buyer's original payment method (PayPal capture).</li>
                            )}
                            {walletPortion > 0 && (
                              <li>${walletPortion.toFixed(2)} will be credited to the buyer's wallet.</li>
                            )}
                          </>
                        ) : (
                          <li>${totalRefund.toFixed(2) || '0.00'} will be returned to the buyer (split is determined automatically).</li>
                        )}
                        <li>Seller balance will be deducted.</li>
                        <li>Product keys/accounts will be permanently invalidated.</li>
                        <li>If the original PayPal capture cannot cover the provider portion, the refund stays in admin review so you can retry after fixing the issue.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-primary pb-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsActionOpen(false);
                  setRejectionReason('');
                  setAdminNotes('');
                }}
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-700"
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending || (actionType === 'reject' && !rejectionReason.trim())}
                className={`flex-1 ${
                  actionType === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                {updateMutation.isPending ? (
                  'Processing...'
                ) : (
                  actionType === 'approve' ? 'Approve & Process' : 'Reject'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReturnRefundManagement;
