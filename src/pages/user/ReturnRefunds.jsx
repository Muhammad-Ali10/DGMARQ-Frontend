import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '../../services/api';
import { useState } from 'react';
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

const STATUS_LABELS = {
  PENDING: 'Pending',
  SELLER_REVIEW: 'With seller',
  SELLER_APPROVED: 'Seller approved',
  SELLER_REJECTED: 'Seller rejected',
  ADMIN_REVIEW: 'With admin',
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

const UserReturnRefunds = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const queryClient = useQueryClient();

  const { data: refundsData, isLoading, isError } = useQuery({
    queryKey: ['user-refunds'],
    queryFn: () => returnRefundAPI.getMyRefunds().then(res => res.data.data),
  });

  const refunds = refundsData?.refunds || [];

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

  const canCancel = (refund) => {
    const s = (refund?.status || '').toUpperCase();
    return ['PENDING', 'ADMIN_REVIEW', 'SELLER_REVIEW'].includes(s) || refund?.status === 'pending';
  };
  const canEscalate = (refund) => (refund?.status || '') === 'SELLER_REJECTED';

  if (isLoading) return <Loading message="Loading refunds..." />;
  if (isError) return <ErrorMessage message="Error loading refunds" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Return/Refund Requests</h1>
          <p className="text-gray-400 mt-1">Manage your return and refund requests</p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-accent hover:bg-blue-700"
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">ID</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
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
                          {canCancel(refund) && (
                            <Button size="sm" variant="destructive" onClick={() => cancelMutation.mutate(refund._id)}>
                              <X className="w-4 h-4" />
                            </Button>
                          )}
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
        <DialogContent size="md" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Refund Details</DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Reason</Label>
                <p className="text-white mt-1">{selectedRefund.reason || 'No reason provided'}</p>
              </div>
              <div>
                <Label className="text-gray-300">Amount</Label>
                <p className="text-white mt-1 font-semibold text-lg">
                  ${selectedRefund.refundAmount?.toFixed(2) || selectedRefund.productId?.price?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <Label className="text-gray-300">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedRefund.status)}</div>
              </div>
              {selectedRefund.sellerDecisionReason && selectedRefund.status === 'SELLER_REJECTED' && (
                <div>
                  <Label className="text-gray-300">Seller rejection reason</Label>
                  <p className="text-red-300 mt-1">{selectedRefund.sellerDecisionReason}</p>
                </div>
              )}
              {selectedRefund.adminNotes && (
                <div>
                  <Label className="text-gray-300">Admin Notes</Label>
                  <p className="text-white mt-1">{selectedRefund.adminNotes}</p>
                </div>
              )}
              {selectedRefund.rejectionReason && selectedRefund.status !== 'SELLER_REJECTED' && (
                <div>
                  <Label className="text-gray-300">Rejection reason</Label>
                  <p className="text-red-300 mt-1">{selectedRefund.rejectionReason}</p>
                </div>
              )}
              {canEscalate(selectedRefund) && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700"
                    disabled={escalateMutation.isPending}
                    onClick={() => escalateMutation.mutate(selectedRefund._id)}
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Escalate to Admin
                  </Button>
                  <p className="text-xs text-gray-400 mt-1">Admin will make the final decision.</p>
                </div>
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

