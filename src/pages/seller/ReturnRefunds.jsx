import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Eye, MessageSquare, Key, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import RefundChat from '../../components/RefundChat';
import SafeImage from '../../components/ui/safe-image';

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
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [showKeyDetails, setShowKeyDetails] = useState(false);
  const [keyDetails, setKeyDetails] = useState(null);
  const [keyDetailsLoading, setKeyDetailsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['seller-refunds'],
    queryFn: () => returnRefundAPI.getSellerRefundList().then(res => res.data.data),
  });

  const refunds = data?.refunds || [];
  const { data: refundDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['seller-refund-details', selectedRefund?._id],
    queryFn: () => returnRefundAPI.getRefundById(selectedRefund._id).then((res) => res.data.data),
    enabled: !!selectedRefund?._id && isViewOpen,
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ refundId, feedback }) => returnRefundAPI.sellerSubmitFeedback(refundId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-refunds'] });
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
  const refundView = refundDetails || selectedRefund;

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
                      onClick={() => {
                        setSelectedRefund(refund);
                        setFeedbackText(refund.sellerFeedback || '');
                        setIsViewOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
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

      <Dialog open={isViewOpen} onOpenChange={(open) => {
        if (!open) { setShowKeyDetails(false); setKeyDetails(null); }
        setIsViewOpen(open);
      }}>
        <DialogContent size="md" className="bg-primary border-gray-700 max-h-[90vh] h-[90vh] sm:h-auto overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-white">Refund Details</DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4 overflow-y-auto pr-1">
              {detailsLoading ? (
                <Loading message="Loading refund details..." />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-700 bg-secondary p-3">
                      <Label className="text-gray-400 text-xs">Order ID</Label>
                      <p className="text-white mt-1 font-mono">#{getDisplayOrderId(refundView?.orderId)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-secondary p-3">
                      <Label className="text-gray-400 text-xs">Status</Label>
                      <div className="mt-1">{getStatusBadge(refundView?.status)}</div>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-secondary p-3">
                      <Label className="text-gray-400 text-xs">Customer</Label>
                      <p className="text-white mt-1">{refundView?.userId?.name || refundView?.userId?.email || 'N/A'}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-secondary p-3">
                      <Label className="text-gray-400 text-xs">Product</Label>
                      <p className="text-white mt-1">{refundView?.productId?.name || 'Product'}</p>
                    </div>
                  </div>
                </>
              )}
              <div>
                <Label className="text-gray-300">Reason</Label>
                <p className="text-white mt-1">{refundView?.reason || 'No reason provided'}</p>
              </div>
              <div>
                <Label className="text-gray-300">Amount</Label>
                <p className="text-white mt-1 font-semibold text-lg">
                  ${refundView?.refundAmount?.toFixed(2) || refundView?.productId?.price?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <Label className="text-gray-300">Status</Label>
                <div className="mt-1">{getStatusBadge(refundView?.status)}</div>
              </div>
              {refundView?.refundMethod && (
                <div>
                  <Label className="text-gray-300">Refund method</Label>
                  <p className="text-white mt-1 capitalize">{refundView.refundMethod.replace('_', ' ')}</p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
                Customer requested a refund. Admin is reviewing. You cannot approve or reject; you may leave optional feedback below.
              </div>
              {isAdminHandledRefund(refundView) && (
                <p className="text-amber-200 text-sm">
                  Refund Through the Original Payment Method may take up to 1-3 business days to fully process
                </p>
              )}
              {refundView?.licenseKeyIds?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Keys requested for refund</Label>
                    <span className="text-white text-sm">{refundView.licenseKeyIds.length} key(s)</span>
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
              {refundView?.adminNotes && (
                <div>
                  <Label className="text-gray-300">Admin Notes</Label>
                  <p className="text-white mt-1">{refundView.adminNotes}</p>
                </div>
              )}
              {refundView?.sellerFeedback && (
                <div>
                  <Label className="text-gray-300">Your feedback</Label>
                  <p className="text-white mt-1 text-sm">{refundView.sellerFeedback}</p>
                  {refundView.sellerFeedbackAt && (
                    <p className="text-gray-500 text-xs mt-0.5">{new Date(refundView.sellerFeedbackAt).toLocaleString()}</p>
                  )}
                </div>
              )}
              {canSubmitFeedback(refundView) && (
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
