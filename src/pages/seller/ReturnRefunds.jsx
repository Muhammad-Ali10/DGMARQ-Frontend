import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Eye, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import RefundChat from '../../components/RefundChat';

const STATUS_BADGES = {
  PENDING: { variant: 'warning', label: 'Pending' },
  SELLER_REVIEW: { variant: 'warning', label: 'Your review' },
  SELLER_APPROVED: { variant: 'default', label: 'Approved' },
  SELLER_REJECTED: { variant: 'destructive', label: 'Rejected' },
  ADMIN_REVIEW: { variant: 'secondary', label: 'With admin' },
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

const SellerReturnRefunds = () => {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['seller-refunds'],
    queryFn: () => returnRefundAPI.getSellerRefundList().then(res => res.data.data),
  });

  const refunds = data?.refunds || [];
  const pagination = data?.pagination || {};

  const feedbackMutation = useMutation({
    mutationFn: ({ refundId, feedback }) => returnRefundAPI.sellerSubmitFeedback(refundId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-refunds']);
      toast.success('Feedback submitted. Admin has full authority over this refund.');
      setFeedbackText('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    },
  });

  const getStatusBadge = (status) => {
    const config = STATUS_BADGES[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canSubmitFeedback = (refund) => {
    const s = String(refund?.status || '').toUpperCase();
    return !['COMPLETED', 'ADMIN_REJECTED', 'completed', 'rejected'].includes(s);
  };

  const isAdminHandledRefund = (refund) => refund?.refundMethod === 'ORIGINAL_PAYMENT';

  if (isLoading) return <Loading message="Loading refunds..." />;
  if (isError) return <ErrorMessage message="Error loading refunds" />;

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
          <div className="overflow-x-auto">
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
                        #{refund.orderId?.orderNumber || (refund.orderId?._id && String(refund.orderId._id).slice(-8)) || '-'}
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
                          onClick={() => {
                            setSelectedRefund(refund);
                            setFeedbackText(refund.sellerFeedback || '');
                            setIsViewOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-8">
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
              {selectedRefund.refundMethod && (
                <div>
                  <Label className="text-gray-300">Refund method</Label>
                  <p className="text-white mt-1 capitalize">{selectedRefund.refundMethod.replace('_', ' ')}</p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
                Customer requested a refund. Admin is reviewing. You cannot approve or reject; you may leave optional feedback below.
              </div>
              {isAdminHandledRefund(selectedRefund) && (
                <p className="text-amber-200 text-sm">Refund to original payment (PayPal); admin will process manually.</p>
              )}
              {selectedRefund.licenseKeyIds?.length > 0 && (
                <div>
                  <Label className="text-gray-300">Keys requested for refund</Label>
                  <p className="text-white mt-1 text-sm">{selectedRefund.licenseKeyIds.length} license key(s)</p>
                </div>
              )}
              {selectedRefund.evidenceFiles?.length > 0 && (
                <div>
                  <Label className="text-gray-300">Evidence</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedRefund.evidenceFiles.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={url} alt={`Evidence ${i + 1}`} className="h-20 w-20 object-cover rounded border border-gray-600 hover:border-accent" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {selectedRefund.adminNotes && (
                <div>
                  <Label className="text-gray-300">Admin Notes</Label>
                  <p className="text-white mt-1">{selectedRefund.adminNotes}</p>
                </div>
              )}
              {selectedRefund.sellerFeedback && (
                <div>
                  <Label className="text-gray-300">Your feedback</Label>
                  <p className="text-white mt-1 text-sm">{selectedRefund.sellerFeedback}</p>
                  {selectedRefund.sellerFeedbackAt && (
                    <p className="text-gray-500 text-xs mt-0.5">{new Date(selectedRefund.sellerFeedbackAt).toLocaleString()}</p>
                  )}
                </div>
              )}
              {canSubmitFeedback(selectedRefund) && (
                <div className="pt-4 border-t border-gray-700 space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Optional feedback for admin
                  </Label>
                  <p className="text-xs text-gray-500">e.g. license validity, explanation. Does not change refund status.</p>
                  <Textarea
                    placeholder="Add optional feedback for admin review..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={3}
                    className="bg-secondary border-gray-700 text-white w-full"
                  />
                  <Button
                    size="sm"
                    onClick={() => feedbackMutation.mutate({ refundId: selectedRefund._id, feedback: feedbackText })}
                    disabled={feedbackMutation.isPending || !feedbackText.trim()}
                    className="bg-accent hover:bg-accent/90"
                  >
                    Submit feedback
                  </Button>
                </div>
              )}
              <RefundChat refundId={selectedRefund._id} canSend={!!selectedRefund.adminRequestedSellerInput} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerReturnRefunds;
