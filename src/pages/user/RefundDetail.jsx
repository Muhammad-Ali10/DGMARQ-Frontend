import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '@services/api';
import { useSocket } from '@hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Badge } from '@components/ui/badge';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { ArrowLeft, ArrowUpCircle, DollarSign } from 'lucide-react';
import SafeImage from '@components/ui/safe-image';
import { toast } from 'sonner';
import { RefundChat, isRefundChatLocked } from '@features/wallet-payout';

const STATUS_LABELS = {
  PENDING: 'Pending', SELLER_REVIEW: 'With seller', SELLER_APPROVED: 'Seller approved',
  SELLER_REJECTED: 'Seller rejected', ADMIN_REVIEW: 'In progress', ADMIN_APPROVED: 'Admin approved',
  ADMIN_REJECTED: 'Rejected', COMPLETED: 'Completed',
  WAITING_FOR_MANUAL_REFUND: 'Waiting manual refund', ON_HOLD_INSUFFICIENT_FUNDS: 'On hold',
  pending: 'Pending', approved: 'Approved', rejected: 'Rejected', completed: 'Completed',
};

const STATUS_VARIANTS = {
  PENDING: 'warning', SELLER_REVIEW: 'warning', SELLER_APPROVED: 'default', SELLER_REJECTED: 'destructive',
  ADMIN_REVIEW: 'secondary', ADMIN_APPROVED: 'default', ADMIN_REJECTED: 'destructive',
  COMPLETED: 'success', ON_HOLD_INSUFFICIENT_FUNDS: 'destructive',
  pending: 'warning', approved: 'default', rejected: 'destructive', completed: 'success', cancelled: 'secondary',
};

const getDisplayOrderId = (orderLike) => {
  if (!orderLike) return 'N/A';
  const orderNumber = typeof orderLike.orderNumber === 'string' ? orderLike.orderNumber.trim() : '';
  if (orderNumber) return orderNumber;
  const rawId = orderLike._id?.toString?.() || orderLike.orderId?.toString?.() || '';
  return rawId ? rawId.slice(-8).toUpperCase() : 'N/A';
};

const getSellerName = (refund) => refund?.sellerId?.shopName || 'Seller';

const StatusBadge = ({ status }) => (
  <Badge variant={STATUS_VARIANTS[status] || 'default'}>{STATUS_LABELS[status] || status}</Badge>
);

const RefundDetail = () => {
  const { refundId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const { data: refund, isLoading, isError, error } = useQuery({
    queryKey: ['user-refund-details', refundId],
    queryFn: () => returnRefundAPI.getRefundById(refundId).then((res) => res.data.data),
    enabled: !!refundId,
    retry: 1,
  });

  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['user-refund-details', refundId] });
      queryClient.invalidateQueries({ queryKey: ['user-refunds'] });
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient, refundId]);

  const escalateMutation = useMutation({
    mutationFn: (id) => returnRefundAPI.escalateToAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['user-refund-details', refundId] });
      toast.success('Refund escalated to admin for final decision.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to escalate'),
  });

  const back = (
    <Button onClick={() => navigate('/user/return-refunds')} variant="outline" className="mb-4">
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

  const canEscalate = String(refund.status || '') === 'SELLER_REJECTED';

  return (
    <div className="space-y-6">
      {back}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Refund #{refund._id?.slice(-8)}</h1>
        <p className="text-gray-400 mt-1">Full details of your refund request</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-700 bg-secondary p-3">
              <Label className="text-gray-400 text-xs">Order ID</Label>
              <p className="text-white font-mono mt-1">#{getDisplayOrderId(refund.orderId)}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-secondary p-3">
              <Label className="text-gray-400 text-xs">Status</Label>
              <div className="mt-1"><StatusBadge status={refund.status} /></div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-secondary p-3">
              <Label className="text-gray-400 text-xs">Product</Label>
              <p className="text-white mt-1">{refund.productId?.name || 'Product'}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-secondary p-3">
              <Label className="text-gray-400 text-xs">Sold by</Label>
              <p className="text-white mt-1">{getSellerName(refund)}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-secondary p-3 sm:col-span-2">
              <Label className="text-gray-400 text-xs">Amount</Label>
              <p className="text-white mt-1 font-semibold text-xl flex items-center">
                <DollarSign className="w-5 h-5 mr-1" />
                {refund.refundAmount?.toFixed(2) || refund.productId?.price?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Refund reason</Label>
            <p className="text-white mt-1">{refund.reason || 'No reason provided'}</p>
          </div>

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

          {refund.sellerDecisionReason && refund.status === 'SELLER_REJECTED' && (
            <div>
              <Label className="text-gray-300">Seller rejection reason</Label>
              <p className="text-red-300 mt-1">{refund.sellerDecisionReason}</p>
            </div>
          )}
          {refund.adminNotes && (
            <div>
              <Label className="text-gray-300">Admin notes</Label>
              <p className="text-white mt-1">{refund.adminNotes}</p>
            </div>
          )}
          {refund.rejectionReason && refund.status !== 'SELLER_REJECTED' && (
            <div>
              <Label className="text-gray-300">Rejection reason</Label>
              <p className="text-red-300 mt-1">{refund.rejectionReason}</p>
            </div>
          )}

          {canEscalate && (
            <div className="pt-2">
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
                disabled={escalateMutation.isPending}
                onClick={() => escalateMutation.mutate(refund._id)}
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Escalate to admin
              </Button>
              <p className="text-xs text-gray-400 mt-1">Admin will make the final decision.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Refund chat</CardTitle>
        </CardHeader>
        <CardContent>
          <RefundChat refundId={refund._id} canSend={true} locked={isRefundChatLocked(refund.status)} />
        </CardContent>
      </Card>
    </div>
  );
};

export default RefundDetail;
