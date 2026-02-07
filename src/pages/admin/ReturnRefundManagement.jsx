import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Eye, CheckCircle2, XCircle, AlertCircle, Package, User, Store, FileText } from 'lucide-react';
import RefundChat from '../../components/RefundChat';
import { toast } from 'sonner';

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
  const [manualRefundReference, setManualRefundReference] = useState('');
  const queryClient = useQueryClient();

  const { data: refundsData, isLoading, isError, error } = useQuery({
    queryKey: ['admin-refunds', page, statusFilter],
    queryFn: () => returnRefundAPI.getAllRefunds({ page, limit: 10, status: statusFilter || undefined }).then(res => res.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ refundId, data }) => returnRefundAPI.updateRefundStatus(refundId, data),
    onSuccess: (data) => {
      const message = actionType === 'approve'
        ? 'Refund approved and processed successfully'
        : 'Refund request rejected';
      toast.success(message);
      queryClient.invalidateQueries(['admin-refunds']);
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

  const markManualRefundMutation = useMutation({
    mutationFn: ({ refundId, manualRefundReference }) =>
      returnRefundAPI.markManualRefund(refundId, manualRefundReference ? { manualRefundReference } : {}),
    onSuccess: () => {
      toast.success('Refund marked as completed (manual PayPal refund).');
      queryClient.invalidateQueries(['admin-refunds']);
      setIsViewOpen(false);
      setSelectedRefund(null);
      setManualRefundReference('');
    },
    onError: (error) => {
      const data = error.response?.data;
      if (data?.hold) {
        toast.error('Seller balance insufficient. Refund is on hold. ' + (data?.message || ''));
      } else {
        toast.error(data?.message || 'Failed to mark manual refund');
      }
    },
  });

  const requestSellerInputMutation = useMutation({
    mutationFn: ({ refundId, note }) => returnRefundAPI.requestSellerInput(refundId, note),
    onSuccess: () => {
      toast.success('Seller has been requested to provide input.');
      queryClient.invalidateQueries(['admin-refunds']);
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
      COMPLETED: 'success', WAITING_FOR_MANUAL_REFUND: 'secondary', ON_HOLD_INSUFFICIENT_FUNDS: 'destructive',
      pending: 'warning', approved: 'default', rejected: 'destructive', completed: 'success',
    };
    const labels = {
      PENDING: 'Pending', SELLER_REVIEW: 'Seller review', SELLER_APPROVED: 'Seller approved', SELLER_REJECTED: 'Seller rejected',
      ADMIN_REVIEW: 'Admin review', ADMIN_APPROVED: 'Admin approved', ADMIN_REJECTED: 'Rejected',
      COMPLETED: 'Completed', WAITING_FOR_MANUAL_REFUND: 'Waiting manual refund', ON_HOLD_INSUFFICIENT_FUNDS: 'On hold (insufficient funds)',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const isManualPayPalRefund = (refund) => refund?.refundMethod === 'ORIGINAL_PAYMENT';
  const getRefundStatus = (refund) => String(refund?.status || '').toUpperCase();
  const canShowMarkManualRefund = (refund) =>
    isManualPayPalRefund(refund) && ['ADMIN_REVIEW', 'WAITING_FOR_MANUAL_REFUND'].includes(getRefundStatus(refund));

  const statusAllowsAdminActions = (refund) => {
    const s = getRefundStatus(refund);
    return s === 'ADMIN_REVIEW' || s === 'WAITING_FOR_MANUAL_REFUND' || s === 'ON_HOLD_INSUFFICIENT_FUNDS';
  };

  const canAdminApprove = (refund) => {
    if (isManualPayPalRefund(refund)) return false;
    return getRefundStatus(refund) === 'ADMIN_REVIEW';
  };

  const canAdminReject = (refund) => statusAllowsAdminActions(refund);

  const getProductTypeBadge = (productType) => {
    if (productType === 'ACCOUNT_BASED') {
      return <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/50">Account Based</Badge>;
    }
    return <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/50">Key Based</Badge>;
  };

  if (isLoading) return <Loading message="Loading refunds..." />;
  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || "Error loading refunds";
    return <ErrorMessage message={errorMessage} />;
  }

  const refunds = refundsData?.refunds || [];
  const pagination = refundsData?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };

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
              <SelectItem value="ADMIN_REVIEW">Admin review</SelectItem>
              <SelectItem value="WAITING_FOR_MANUAL_REFUND">Waiting manual refund</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ADMIN_REJECTED">Rejected</SelectItem>
              <SelectItem value="ON_HOLD_INSUFFICIENT_FUNDS">On hold</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                        {refund.orderId?._id ? `#${String(refund.orderId._id).slice(-8)}` : 'N/A'}
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
                        <div className="flex gap-2">
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
                          {canShowMarkManualRefund(refund) && (
                            <Button
                              size="sm"
                              onClick={() => markManualRefundMutation.mutate({ refundId: refund._id })}
                              disabled={markManualRefundMutation.isPending}
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Mark as Refunded (Manual)
                            </Button>
                          )}
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
        if (!open) { setShowRequestSellerInput(false); setSellerInputNote(''); }
        setIsViewOpen(open);
      }}>
        <DialogContent size="lg" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Refund Request Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete information about the refund request
            </DialogDescription>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-6 mt-4">
              {/* Order Information */}
              <div className="p-4 bg-secondary rounded-lg border border-gray-700">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-accent" />
                  Order Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Order ID:</span>
                    <p className="text-white font-mono">{selectedRefund.orderId?._id ? String(selectedRefund.orderId._id).slice(-8) : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Order Date:</span>
                    <p className="text-white">
                      {selectedRefund.orderId?.createdAt 
                        ? new Date(selectedRefund.orderId.createdAt).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Order Status:</span>
                    <p className="text-white">{selectedRefund.orderId?.orderStatus || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Order Total:</span>
                    <p className="text-white font-semibold">
                      ${selectedRefund.orderId?.totalAmount?.toFixed(2) || '0.00'}
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
                  {selectedRefund.productId?.images?.[0] && (
                    <img
                      src={selectedRefund.productId.images[0]}
                      alt={selectedRefund.productId.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                  <div>
                    <span className="text-gray-400">Product Name:</span>
                    <p className="text-white font-medium">{selectedRefund.productId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Product Type:</span>
                    <div className="mt-1">
                      {selectedRefund.productId?.productType && getProductTypeBadge(selectedRefund.productId.productType)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Product Price:</span>
                    <p className="text-white font-semibold">
                      ${selectedRefund.productId?.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Refund Amount:</span>
                    <p className="text-white font-bold text-lg">
                      ${selectedRefund.refundAmount?.toFixed(2) || selectedRefund.productId?.price?.toFixed(2) || '0.00'}
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <p className="text-white">{selectedRefund.userId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <p className="text-white">{selectedRefund.userId?.email || 'N/A'}</p>
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
                  <p className="text-white">{selectedRefund.sellerId?.shopName || 'N/A'}</p>
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
                    <p className="text-white mt-1">{selectedRefund.reason || 'No reason provided'}</p>
                  </div>
                  {selectedRefund.refundMethod && (
                    <div>
                      <span className="text-gray-400">Refund method:</span>
                      <p className="text-white mt-1 capitalize">{selectedRefund.refundMethod.replace('_', ' ')}</p>
                    </div>
                  )}
                  {selectedRefund.refundMethod === 'ORIGINAL_PAYMENT' && selectedRefund.customerPayPalEmail && (
                    <div>
                      <span className="text-gray-400">Customer PayPal email:</span>
                      <p className="text-white mt-1">{selectedRefund.customerPayPalEmail}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedRefund.status)}</div>
                  </div>
                  {canShowMarkManualRefund(selectedRefund) && (
                    <div className="pt-2 space-y-2">
                      <Label className="text-gray-300 text-xs">PayPal transaction / reference (optional)</Label>
                      <Input
                        value={manualRefundReference}
                        onChange={(e) => setManualRefundReference(e.target.value)}
                        placeholder="e.g. PayPal transaction ID or note"
                        className="bg-secondary border-gray-700 text-white"
                      />
                      <Button
                        size="sm"
                        onClick={() => markManualRefundMutation.mutate({ refundId: selectedRefund._id, manualRefundReference: manualRefundReference.trim() || null })}
                        disabled={markManualRefundMutation.isPending}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Mark as Refunded (Manual)
                      </Button>
                      <p className="text-xs text-gray-400">After sending refund via PayPal, click to complete. Refund cannot be completed twice.</p>
                    </div>
                  )}
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
                  {getRefundStatus(selectedRefund) === 'ADMIN_REVIEW' && selectedRefund.refundMethod !== 'ORIGINAL_PAYMENT' && (
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
                  {selectedRefund.currentStage && (
                    <div>
                      <span className="text-gray-400">Stage:</span>
                      <p className="text-white mt-1">{selectedRefund.currentStage}</p>
                    </div>
                  )}
                  {selectedRefund.licenseKeyIds?.length > 0 && (
                    <div>
                      <span className="text-gray-400">License keys in request:</span>
                      <p className="text-white mt-1">{selectedRefund.licenseKeyIds.length} key(s)</p>
                    </div>
                  )}
                  {selectedRefund.sellerDecisionReason && (
                    <div>
                      <span className="text-gray-400">Seller rejection reason (escalated):</span>
                      <p className="text-amber-300 mt-1">{selectedRefund.sellerDecisionReason}</p>
                    </div>
                  )}
                  {selectedRefund.evidenceFiles?.length > 0 && (
                    <div>
                      <span className="text-gray-400">Evidence:</span>
                      <div className="mt-2 flex flex-wrap gap-3">
                        {selectedRefund.evidenceFiles.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded border border-gray-600 overflow-hidden hover:border-accent">
                            <img src={url} alt={`Evidence ${i + 1}`} className="h-24 w-auto max-w-[200px] object-cover" />
                            <span className="block text-xs text-accent p-1 text-center">View full</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedRefund.sellerFeedback && (
                    <div>
                      <span className="text-gray-400">Seller feedback (advisory):</span>
                      <p className="text-white mt-1 text-sm">{selectedRefund.sellerFeedback}</p>
                      {selectedRefund.sellerFeedbackAt && (
                        <p className="text-gray-500 text-xs mt-0.5">{new Date(selectedRefund.sellerFeedbackAt).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                  {selectedRefund.refundHistory?.length > 0 && (
                    <div>
                      <span className="text-gray-400">History:</span>
                      <ul className="mt-1 text-xs text-gray-300 space-y-1">
                        {selectedRefund.refundHistory.map((h, i) => (
                          <li key={i}>{h.actor}: {h.action} — {h.newStatus || h.previousStatus} {h.timestamp && new Date(h.timestamp).toLocaleString()}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedRefund.adminNotes && (
                    <div>
                      <span className="text-gray-400">Admin Notes:</span>
                      <p className="text-white mt-1">{selectedRefund.adminNotes}</p>
                    </div>
                  )}
                  {selectedRefund.rejectionReason && (
                    <div>
                      <span className="text-gray-400">Rejection Reason:</span>
                      <p className="text-red-400 mt-1">{selectedRefund.rejectionReason}</p>
                    </div>
                  )}
                  {selectedRefund.refundedAt && (
                    <div>
                      <span className="text-gray-400">Refunded At:</span>
                      <p className="text-white mt-1">{new Date(selectedRefund.refundedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              <RefundChat refundId={selectedRefund._id} canSend={true} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent size="sm" className="bg-primary border-gray-700">
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
          <form onSubmit={handleSubmitAction} className="space-y-4 mt-4">
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
            {actionType === 'approve' && selectedRefund && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-200">
                    <p className="font-semibold mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
                      <li>Customer wallet will be credited with ${selectedRefund.refundAmount?.toFixed(2) || selectedRefund.productId?.price?.toFixed(2) || '0.00'}</li>
                      <li>Seller balance will be deducted</li>
                      <li>Product keys/accounts will be permanently invalidated</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4">
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
