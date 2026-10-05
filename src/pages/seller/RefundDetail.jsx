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
import { Skeleton } from '@components/ui/skeleton';
import { ErrorState } from '@components/common/ErrorState';
import { Fact } from '@components/common/SpecList';
import { ArrowLeft, Key, EyeOff, MessageSquare } from 'lucide-react';
import SafeImage from '@components/ui/safe-image';
import { toast } from 'sonner';
import { RefundChat, isRefundChatLocked , refundBadgeProps } from '@features/wallet-payout';
import { getDisplayOrderId } from '@lib/orderDisplay';
import useCurrency from '@hooks/useCurrency';

const SellerRefundDetail = () => {
  const { formatSettlement } = useCurrency();
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

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }
  if (isError || !refund) {
    return (
      <div className="space-y-6">
        {back}
        <Card variant="hud">
          <CardContent>
            <ErrorState
              error={error}
              title="Couldn't load this refund request"
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['seller-refund-details', refundId] })}
            />
          </CardContent>
        </Card>
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
        <h1 className="text-2xl sm:text-3xl font-bold text-fg">Refund #{refund._id?.slice(-8)}</h1>
        <p className="text-fg-muted mt-1">
          Admin has full authority over this refund. You may leave optional feedback below.
        </p>
      </div>

      <Card variant="hud">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Fact label="Order ID">
              <span className="font-mono">#{getDisplayOrderId(refund.orderId)}</span>
            </Fact>
            <Fact label="Status">
              <Badge {...refundBadgeProps(refund.status)} />
            </Fact>
            <Fact label="Customer">
              {refund.userId?.name || refund.userId?.email || 'N/A'}
            </Fact>
            <Fact label="Product">{refund.productId?.name || 'Product'}</Fact>
          </dl>

          <div>
            <p className="text-xs tracking-wide text-fg-subtle uppercase">Reason</p>
            <p className="text-fg mt-1">{refund.reason || 'No reason provided'}</p>
          </div>
          <div>
            <p className="text-xs tracking-wide text-fg-subtle uppercase">Amount</p>
            <p className="text-fg mt-1 font-semibold text-lg">
              {formatSettlement(refund.refundAmount ?? refund.productId?.price ?? 0)}
            </p>
          </div>
          {refund.refundMethod && (
            <div>
              <p className="text-xs tracking-wide text-fg-subtle uppercase">Refund method</p>
              <p className="text-fg mt-1 capitalize">{refund.refundMethod.replace('_', ' ')}</p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-warning-soft border border-warning/35 text-warning text-sm">
            Customer requested a refund. Admin is reviewing. You cannot approve or reject; you may leave optional feedback below.
          </div>
          {isAdminHandledRefund && (
            <p className="text-warning text-sm">
              Refund Through the Original Payment Method may take up to 1-3 business days to fully process
            </p>
          )}

          {refund.licenseKeyIds?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs tracking-wide text-fg-subtle uppercase">Keys requested for refund</p>
                <span className="text-fg text-sm">{refund.licenseKeyIds.length} key(s)</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleKeys}
                disabled={keyDetailsLoading}
                className="border-border-interactive text-fg-muted hover:bg-surface-2"
              >
                {keyDetailsLoading ? 'Loading...' : showKeyDetails ? (
                  <><EyeOff className="w-4 h-4 mr-1" />Hide Keys/Details</>
                ) : (
                  <><Key className="w-4 h-4 mr-1" />Show Keys/Details</>
                )}
              </Button>
              {showKeyDetails && keyDetails && (
                <div className="mt-3 space-y-2 rounded-lg border border-brand-cyan/12 bg-brand-cyan/3 p-3">
                  <p className="text-xs text-warning mb-2">⚠️ Sensitive information - handle with care</p>
                  {keyDetails.keys?.length > 0 ? keyDetails.keys.map((key, idx) => (
                    <div key={key.keyId || idx} className="p-2 bg-surface-sunken/50 rounded border border-border-interactive">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-fg-muted mb-1">
                            {keyDetails.productType === 'ACCOUNT_BASED' ? 'Account Credentials' : 'License Key'}
                            {key.keyType && key.keyType !== 'other' && (
                              <span className="ml-2 text-fg-subtle">({key.keyType})</span>
                            )}
                          </p>
                          <p className="text-fg font-mono text-sm break-all select-all">{key.keyData}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {key.isRefunded ? <Badge variant="secondary" className="text-xs">Refunded</Badge>
                            : key.isUsed ? <Badge variant="warning" className="text-xs">Used</Badge>
                            : <Badge variant="success" className="text-xs">Available</Badge>}
                        </div>
                      </div>
                      {key.assignedAt && (
                        <p className="text-xs text-fg-subtle mt-1">Assigned: {new Date(key.assignedAt).toLocaleString()}</p>
                      )}
                      {key.refundedAt && (
                        <p className="text-xs text-fg-subtle">Refunded: {new Date(key.refundedAt).toLocaleString()}</p>
                      )}
                    </div>
                  )) : <p className="text-fg-muted text-sm">No key details available</p>}
                </div>
              )}
            </div>
          )}

          {refund.evidenceFiles?.length > 0 && (
            <div>
              <p className="text-xs tracking-wide text-fg-subtle uppercase">Evidence</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {refund.evidenceFiles.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                    <SafeImage src={url} alt={`Evidence ${i + 1}`} className="h-20 w-20 object-cover rounded border border-border-interactive hover:border-accent" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {refund.adminNotes && (
            <div>
              <p className="text-xs tracking-wide text-fg-subtle uppercase">Admin notes</p>
              <p className="text-fg mt-1">{refund.adminNotes}</p>
            </div>
          )}
          {refund.sellerFeedback && (
            <div>
              <p className="text-xs tracking-wide text-fg-subtle uppercase">Your feedback</p>
              <p className="text-fg mt-1 text-sm">{refund.sellerFeedback}</p>
              {refund.sellerFeedbackAt && (
                <p className="text-fg-subtle text-xs mt-0.5">{new Date(refund.sellerFeedbackAt).toLocaleString()}</p>
              )}
            </div>
          )}

          {canSubmitFeedback && (
            <div className="pt-4 border-t border-brand-cyan/10 space-y-2">
              <Label htmlFor="seller-refund-feedback" className="flex items-center gap-2 text-fg-muted">
                <MessageSquare className="w-4 h-4" />
                Optional feedback for admin
              </Label>
              <p className="text-xs text-fg-subtle">e.g. license validity, explanation. Does not change refund status.</p>
              <Textarea
                id="seller-refund-feedback"
                placeholder="Add optional feedback for admin review…"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
                className="w-full"
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

      <Card variant="hud">
        <CardHeader>
          <CardTitle>Refund chat</CardTitle>
        </CardHeader>
        <CardContent>
          <RefundChat refundId={refund._id} canSend={!!refund.adminRequestedSellerInput} locked={isRefundChatLocked(refund.status)} />
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerRefundDetail;
