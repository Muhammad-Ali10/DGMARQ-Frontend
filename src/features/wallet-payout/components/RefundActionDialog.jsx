import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '@services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Shared admin approve/reject confirmation. Used by the admin refund list AND
// the admin refund detail page — same mutation, same warning block, same
// invalidation set. onSuccess lets the caller navigate/close after the flip
// (detail page nav-back on approve; list stays put).
const RefundActionDialog = ({ open, onOpenChange, refund, actionType, onSuccess }) => {
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!open) {
      setAdminNotes('');
      setRejectionReason('');
    }
  }, [open]);

  const updateMutation = useMutation({
    mutationFn: ({ refundId, data }) => returnRefundAPI.updateRefundStatus(refundId, data),
    onSuccess: (res) => {
      const payload = res?.data?.data;
      const message = actionType === 'reject'
        ? 'Refund request rejected'
        : payload?.providerFailed
          ? (res?.data?.message || 'Provider refund failed. Fix the issue and retry approval.')
          : (res?.data?.message || 'Refund approved and processed successfully');
      if (payload?.providerFailed) toast.warning(message);
      else toast.success(message);
      // Every view that reads refund state.
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-refund-details'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-detail'] });
      onOpenChange(false);
      onSuccess?.(payload);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update refund status');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!refund) return;
    if (actionType === 'reject' && !rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    const s = String(refund.status || '').toUpperCase();
    const status = actionType === 'approve'
      ? (s === 'ADMIN_REVIEW' ? 'ADMIN_APPROVED' : 'approved')
      : (['ADMIN_REVIEW', 'ON_HOLD_INSUFFICIENT_FUNDS'].includes(s) ? 'ADMIN_REJECTED' : 'rejected');
    updateMutation.mutate({
      refundId: refund._id,
      data: {
        status,
        adminNotes: adminNotes || undefined,
        rejectionReason: actionType === 'reject' ? rejectionReason : undefined,
      },
    });
  };

  const totalRefund = Number(refund?.refundAmount || 0);
  const walletPortion = Number(refund?.walletRefundAmount || 0);
  const providerPortion = Number(refund?.providerRefundAmount || 0);
  const hasSplit = walletPortion > 0 || providerPortion > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="max-h-[90vh] h-[90vh] sm:h-auto overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-fg">
            {actionType === 'approve' ? 'Approve Refund' : 'Reject Refund'}
          </DialogTitle>
          <DialogDescription className="text-fg-muted">
            {actionType === 'approve'
              ? 'This will process the refund, credit the customer wallet, and deduct from seller balance.'
              : 'Please provide a reason for rejecting this refund request.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 overflow-y-auto pr-1">
          {actionType === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason" className="text-fg">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this refund request..."
                rows={4}
                className="bg-secondary border-border text-fg placeholder:text-gray-500 resize-none focus:border-accent"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="adminNotes" className="text-fg">
              Admin Notes {actionType === 'approve' && '(Optional)'}
            </Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              className="bg-secondary border-border text-fg placeholder:text-gray-500 resize-none focus:border-accent"
              required={actionType === 'reject'}
            />
          </div>
          {actionType === 'approve' && refund && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <p className="font-semibold mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1 text-warning/80">
                    {hasSplit ? (
                      <>
                        {providerPortion > 0 && (
                          <li>${providerPortion.toFixed(2)} will be refunded to the buyer&apos;s original payment method (PayPal capture).</li>
                        )}
                        {walletPortion > 0 && (
                          <li>${walletPortion.toFixed(2)} will be credited to the buyer&apos;s wallet.</li>
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
          )}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-background pb-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-border text-fg-muted hover:bg-gray-700"
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || (actionType === 'reject' && !rejectionReason.trim())}
              className={`flex-1 ${actionType === 'approve' ? 'bg-success-solid hover:bg-green-700' : 'bg-danger-solid hover:bg-red-700'} text-fg`}
            >
              {updateMutation.isPending ? 'Processing...' : (actionType === 'approve' ? 'Approve & Process' : 'Reject')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RefundActionDialog;
