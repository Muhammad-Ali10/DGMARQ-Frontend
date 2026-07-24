import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '@services/api';
import { useSocket } from '@hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Badge } from '@components/ui/badge';
import { Textarea } from '@components/ui/textarea';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { ArrowLeft, Key, EyeOff, MessageSquare } from 'lucide-react';
import SafeImage from '@components/ui/safe-image';
import { toast } from 'sonner';
import { RefundChat, isRefundChatLocked } from '@features/wallet-payout';

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

const StatusBadge = ({ status }) => {
  const cfg = STATUS_BADGES[status] || { variant: 'default', label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

const SellerRefundDetail = () => {
  const { refundId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [feedbackText, setFeedbackText] = useState('');
  const [showKeyDetails, setShowKeyDetails] = useState(false);
  const [keyDetails, setKeyDetails] = useState(null);
  const [keyDetailsLoading, setKeyDetailsLoading] = useState(false);

  const { data: refund, isLoading, isError, error } = useQuery({
    queryKey: ['seller-refund-details', refundId],
    queryFn: () => returnRefundAPI.getRefundById(refundId).then((res) => res.data.data),
    enabled: !!refundId,
    retry: 1,
    onSuccess: (data) => {
      // Prefill feedback textarea with any existing note (one-shot on load).
      if (data?.sellerFeedback && !feedbackText) setFeedbackText(data.sellerFeedback);
    },
  });

  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['seller-refund-details', refundId] });
      queryClient.invalidateQueries({ queryKey: ['seller-refunds'] });
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient, refundId]);

  const feedbackMutation = useMutation({
    mutationFn: ({ refundId: id, feedback }) => returnRefundAPI.sellerSubmitFeedback(id, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['seller-refund-details', refundId] });
      toast.success('Feedback submitted. Admin has full authority over this refund.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit feedback'),
  });

  const back = (
    <Button onClick={() => navigate('/seller/return-refunds')} variant="outline" className="mb-4">
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to refunds
    </Button>
  );

  if (isLoading) return <div className="space-y-6">{back}<Loading message="Loading refund details..." /></div>;
  if (isError || !refund) {
    return (
      <div className="space-y-6">
        {back}
        <ErrorMessage message={error?.response?.data?.message || 'Refund not found'} />
      </div>
    );
  }

  const canSubmitFeedback = !['COMPLETED', 'ADMIN_REJECTED', 'completed', 'rejected']
    .includes(String(refund.status || '').toUpperCase());
  const isAdminHandledRefund = refund.refundMethod === 'ORIGINAL_PAYMENT';

  const toggleKeys = async () => {
    if (showKeyDetails) {
      setShowKeyDetails(false);
      setKeyDetails(null);
      return;
    }
    setKeyDetailsLoading(true);
    try {
      const res = await returnRefundAPI.getRefundKeyDetails(refund._id);
      setKeyDetails(res.data.data);
      setShowKeyDetails(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load key details');
    } finally {
      setKeyDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {back}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Refund #{refund._id?.slice(-8)}</h1>
        <p className="text-gray-400 mt-1">
          Admin has full authority over this refund. You may leave optional feedback below.
        </p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-700 bg-secondary p-3">
              <Label className="text-gray-400 text-xs">Order ID</Label>
              <p className="text-white mt-1 font-mono">#{getDisplayOrderId(refund.orderId)}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-secondary p-3">
              <Label className="text-gray-400 text-xs">Status</Label>
              <div className="mt-1"><StatusBadge status={refund.status} /></div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-secondary p-3">
              <Label className="text-gray-400 text-xs">Customer</Label>
              <p className="text-white mt-1">{refund.userId?.name || refund.userId?.email || 'N/A'}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-secondary p-3">
              <Label className="text-gray-400 text-xs">Product</Label>
              <p className="text-white mt-1">{refund.productId?.name || 'Product'}</p>
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Reason</Label>
            <p className="text-white mt-1">{refund.reason || 'No reason provided'}</p>
          </div>
          <div>
            <Label className="text-gray-300">Amount</Label>
            <p className="text-white mt-1 font-semibold text-lg">
              ${refund.refundAmount?.toFixed(2) || refund.productId?.price?.toFixed(2) || '0.00'}
            </p>
          </div>
          {refund.refundMethod && (
            <div>
              <Label className="text-gray-300">Refund method</Label>
              <p className="text-white mt-1 capitalize">{refund.refundMethod.replace('_', ' ')}</p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
            Customer requested a refund. Admin is reviewing. You cannot approve or reject; you may leave optional feedback below.
          </div>
          {isAdminHandledRefund && (
            <p className="text-amber-200 text-sm">
              Refund Through the Original Payment Method may take up to 1-3 business days to fully process
            </p>
          )}

          {refund.licenseKeyIds?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Keys requested for refund</Label>
                <span className="text-white text-sm">{refund.licenseKeyIds.length} key(s)</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleKeys}
                disabled={keyDetailsLoading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {keyDetailsLoading ? 'Loading...' : showKeyDetails ? (
                  <><EyeOff className="w-4 h-4 mr-1" />Hide Keys/Details</>
                ) : (
                  <><Key className="w-4 h-4 mr-1" />Show Keys/Details</>
                )}
              </Button>
              {showKeyDetails && keyDetails && (
                <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2">
                  <p className="text-xs text-amber-400 mb-2">⚠️ Sensitive information - handle with care</p>
                  {keyDetails.keys?.length > 0 ? keyDetails.keys.map((key, idx) => (
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
                          {key.isRefunded ? <Badge variant="secondary" className="text-xs">Refunded</Badge>
                            : key.isUsed ? <Badge variant="warning" className="text-xs">Used</Badge>
                            : <Badge variant="success" className="text-xs">Available</Badge>}
                        </div>
                      </div>
                      {key.assignedAt && (
                        <p className="text-xs text-gray-500 mt-1">Assigned: {new Date(key.assignedAt).toLocaleString()}</p>
                      )}
                      {key.refundedAt && (
                        <p className="text-xs text-gray-500">Refunded: {new Date(key.refundedAt).toLocaleString()}</p>
                      )}
                    </div>
                  )) : <p className="text-gray-400 text-sm">No key details available</p>}
                </div>
              )}
            </div>
          )}

          {refund.evidenceFiles?.length > 0 && (
            <div>
              <Label className="text-gray-300">Evidence</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {refund.evidenceFiles.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                    <SafeImage src={url} alt={`Evidence ${i + 1}`} className="h-20 w-20 object-cover rounded border border-gray-600 hover:border-accent" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {refund.adminNotes && (
            <div>
              <Label className="text-gray-300">Admin notes</Label>
              <p className="text-white mt-1">{refund.adminNotes}</p>
            </div>
          )}
          {refund.sellerFeedback && (
            <div>
              <Label className="text-gray-300">Your feedback</Label>
              <p className="text-white mt-1 text-sm">{refund.sellerFeedback}</p>
              {refund.sellerFeedbackAt && (
                <p className="text-gray-500 text-xs mt-0.5">{new Date(refund.sellerFeedbackAt).toLocaleString()}</p>
              )}
            </div>
          )}

          {canSubmitFeedback && (
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
                onClick={() => feedbackMutation.mutate({ refundId: refund._id, feedback: feedbackText })}
                disabled={feedbackMutation.isPending || !feedbackText.trim()}
                className="bg-accent hover:bg-accent/90"
              >
                Submit feedback
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Refund chat</CardTitle>
        </CardHeader>
        <CardContent>
          <RefundChat refundId={refund._id} canSend={!!refund.adminRequestedSellerInput} locked={isRefundChatLocked(refund.status)} />
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerRefundDetail;
