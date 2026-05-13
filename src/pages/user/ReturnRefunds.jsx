import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '../../services/api';
import { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Plus, Eye, DollarSign, X, ArrowUpCircle } from 'lucide-react';
import { showSuccess, showApiError } from '../../utils/toast';
import RefundRequestModal from '../../components/RefundRequestModal';
import RefundChat from '../../components/RefundChat';
import { toast } from 'sonner';
import SafeImage from '../../components/ui/safe-image';

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

const getDisplayOrderId = (orderLike) => {
  if (!orderLike) return 'N/A';
  const orderNumber = typeof orderLike.orderNumber === 'string' ? orderLike.orderNumber.trim() : '';
  if (orderNumber) return orderNumber;
  const rawId = orderLike._id?.toString?.() || orderLike.orderId?.toString?.() || '';
  return rawId ? rawId.slice(-8).toUpperCase() : 'N/A';
};

const UserReturnRefunds = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const { data: refundsData, isLoading, isError } = useQuery({
    queryKey: ['user-refunds'],
    queryFn: () => returnRefundAPI.getMyRefunds().then(res => res.data.data),
  });

  // Phase 6 / Step 12 PART C — refund_executed socket fan-out updates the
  // buyer's refund list (status flips to COMPLETED) and the per-refund
  // detail dialog if it's open on the affected refund.
  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['user-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['user-refund-details'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient]);

  const refunds = refundsData?.refunds || [];
  const { data: refundDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['user-refund-details', selectedRefund?._id],
    queryFn: () => returnRefundAPI.getRefundById(selectedRefund._id).then((res) => res.data.data),
    enabled: !!selectedRefund?._id && isViewOpen,
  });

  // Intentionally retained: the "Cancel refund" buttons are currently
  // commented out in the UI (see lines wired to {/* canCancel(...) && ... */})
  // but the backend mutation contract is stable, so we keep the hook ready
  // for the moment the buttons are re-enabled.
  // eslint-disable-next-line no-unused-vars
  const cancelMutation = useMutation({
    mutationFn: (refundId) => returnRefundAPI.cancelRefund(refundId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-refunds']);
      showSuccess('Refund request cancelled successfully');
      setIsViewOpen(false);
      setSelectedRefund(null);
    },
    onError: (error) => {
      showApiError(error, 'Failed to cancel refund request');
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (refundId) => returnRefundAPI.escalateToAdmin(refundId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-refunds']);
      toast.success('Refund escalated to admin for final decision.');
      setIsViewOpen(false);
      setSelectedRefund(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to escalate');
    },
  });

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

  // eslint-disable-next-line no-unused-vars
  const canCancel = (refund) => {
    const s = (refund?.status || '').toUpperCase();
    return ['PENDING', 'ADMIN_REVIEW', 'SELLER_REVIEW'].includes(s) || refund?.status === 'pending';
  };
  const canEscalate = (refund) => (refund?.status || '') === 'SELLER_REJECTED';

  if (isLoading) return <Loading message="Loading refunds..." />;
  if (isError) return <ErrorMessage message="Error loading refunds" />;
  const refundView = refundDetails || selectedRefund;

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
                    <span className="text-gray-400 text-sm">Created</span>
                    <span className="text-gray-300 text-sm">{new Date(refund.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-700">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedRefund(refund);
                        setIsViewOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    {/* {canCancel(refund) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => cancelMutation.mutate(refund._id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    )} */}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">No refund requests found</div>
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">ID</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  {/* <TableHead className="text-gray-300">Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.length > 0 ? (
                  refunds.map((refund) => (
                    <TableRow key={refund._id} className="border-gray-700">
                      <TableCell className="text-white font-mono text-sm">{refund._id?.slice(-8)}</TableCell>
                      <TableCell className="text-gray-400">Refund</TableCell>
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
                            onClick={() => {
                              setSelectedRefund(refund);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {/* {canCancel(refund) && (
                            <Button size="sm" variant="destructive" onClick={() => cancelMutation.mutate(refund._id)}>
                              <X className="w-4 h-4" />
                            </Button>
                          )} */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                      No refund requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent size="md" className="bg-primary border-gray-700 max-h-[90vh] h-[90vh] sm:h-auto overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-white">Refund Details</DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="overflow-y-auto pr-1 space-y-4">
              {detailsLoading ? (
                <Loading message="Loading refund details..." />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-700 bg-secondary p-3">
                      <Label className="text-gray-400 text-xs">Order ID</Label>
                      <p className="text-white font-mono mt-1">#{getDisplayOrderId(refundView?.orderId)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-secondary p-3">
                      <Label className="text-gray-400 text-xs">Status</Label>
                      <div className="mt-1">{getStatusBadge(refundView?.status)}</div>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-secondary p-3">
                      <Label className="text-gray-400 text-xs">Product</Label>
                      <p className="text-white mt-1">{refundView?.productId?.name || 'Product'}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-secondary p-3">
                      <Label className="text-gray-400 text-xs">Amount</Label>
                      <p className="text-white mt-1 font-semibold text-lg">
                        ${refundView?.refundAmount?.toFixed(2) || refundView?.productId?.price?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300">Refund reason</Label>
                    <p className="text-white mt-1">{refundView?.reason || 'No reason provided'}</p>
                  </div>

                  {refundView?.evidenceFiles?.length > 0 && (
                    <div>
                      <Label className="text-gray-300">Evidence</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {refundView.evidenceFiles.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                            <SafeImage src={url} alt={`Evidence ${i + 1}`} className="h-20 w-20 object-cover rounded border border-gray-600 hover:border-accent" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {refundView?.sellerDecisionReason && refundView?.status === 'SELLER_REJECTED' && (
                    <div>
                      <Label className="text-gray-300">Seller rejection reason</Label>
                      <p className="text-red-300 mt-1">{refundView.sellerDecisionReason}</p>
                    </div>
                  )}
                  {refundView?.adminNotes && (
                    <div>
                      <Label className="text-gray-300">Admin Notes</Label>
                      <p className="text-white mt-1">{refundView.adminNotes}</p>
                    </div>
                  )}
                  {refundView?.rejectionReason && refundView?.status !== 'SELLER_REJECTED' && (
                    <div>
                      <Label className="text-gray-300">Rejection reason</Label>
                      <p className="text-red-300 mt-1">{refundView.rejectionReason}</p>
                    </div>
                  )}
                  {canEscalate(refundView) && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700"
                        disabled={escalateMutation.isPending}
                        onClick={() => escalateMutation.mutate(refundView._id)}
                      >
                        <ArrowUpCircle className="w-4 h-4 mr-2" />
                        Escalate to Admin
                      </Button>
                      <p className="text-xs text-gray-400 mt-1">Admin will make the final decision.</p>
                    </div>
                  )}
                </>
              )}
              <RefundChat refundId={selectedRefund._id} canSend={true} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RefundRequestModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
};

export default UserReturnRefunds;

