import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '@services/api';
import { useSocket } from '@hooks/useSocket';
import { Card, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Badge } from '@components/ui/badge';
import { Textarea } from '@components/ui/textarea';
import { Loading, ErrorMessage } from '@components/ui/loading';
import {
  ArrowLeft, CheckCircle2, XCircle, Copy, Check, Key, EyeOff,
  MessageSquare, ExternalLink, ClipboardCheck, AlertTriangle, Clock,
  User as UserIcon, Store, Package, ChevronDown, ChevronRight,
} from 'lucide-react';
import SafeImage from '@components/ui/safe-image';
import { toast } from 'sonner';
import { RefundChat, RefundActionDialog, isRefundChatLocked } from '@features/wallet-payout';

// ── status metadata ──
const STATUS_LABELS = {
  PENDING: 'Pending', SELLER_REVIEW: 'Seller review', SELLER_APPROVED: 'Seller approved',
  SELLER_REJECTED: 'Seller rejected', ADMIN_REVIEW: 'Admin review', ADMIN_APPROVED: 'Admin approved',
  ADMIN_REJECTED: 'Rejected', COMPLETED: 'Completed',
  WAITING_FOR_MANUAL_REFUND: 'Waiting manual refund',
  ON_HOLD_INSUFFICIENT_FUNDS: 'On hold (insufficient funds)',
};
const STATUS_VARIANTS = {
  PENDING: 'warning', SELLER_REVIEW: 'warning', SELLER_APPROVED: 'default', SELLER_REJECTED: 'destructive',
  ADMIN_REVIEW: 'secondary', ADMIN_APPROVED: 'default', ADMIN_REJECTED: 'destructive',
  COMPLETED: 'success', WAITING_FOR_MANUAL_REFUND: 'secondary', ON_HOLD_INSUFFICIENT_FUNDS: 'destructive',
};

const getDisplayOrderId = (orderLike) => {
  if (!orderLike) return 'N/A';
  const orderNumber = typeof orderLike.orderNumber === 'string' ? orderLike.orderNumber.trim() : '';
  if (orderNumber) return orderNumber;
  const rawId = orderLike._id?.toString?.() || '';
  return rawId ? rawId.slice(-8).toUpperCase() : 'N/A';
};

const StatusBadge = ({ status, className = '' }) => (
  <Badge variant={STATUS_VARIANTS[status] || 'default'} className={className}>
    {STATUS_LABELS[status] || status}
  </Badge>
);

// Small copy-to-clipboard button — admins paste order/capture ids a lot.
const CopyButton = ({ value, label = 'Copy' }) => {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed');
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-accent transition-colors"
      aria-label={label}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

// Compact vertical timeline. Stage order derived from real refund fields —
// no fabricated milestones. Reached stages show accent color; the current
// stage shows a pulsing dot; unreached stages are muted.
const Timeline = ({ refund }) => {
  const status = String(refund?.status || '').toUpperCase();
  const finalStatuses = ['COMPLETED', 'ADMIN_REJECTED', 'completed', 'rejected'];
  const isFinal = finalStatuses.includes(refund?.status);
  const isRejected = ['ADMIN_REJECTED', 'rejected'].includes(refund?.status);
  const isCompleted = ['COMPLETED', 'completed'].includes(refund?.status);

  const steps = [
    {
      key: 'requested',
      label: 'Refund requested',
      at: refund?.createdAt,
      reached: true,
    },
    {
      key: 'seller_review',
      label: refund?.sellerReviewStartedAt ? 'Seller review' : 'Skipped seller review',
      at: refund?.sellerReviewStartedAt || null,
      reached: !!refund?.sellerReviewStartedAt || ['SELLER_APPROVED', 'SELLER_REJECTED'].includes(status),
      muted: !refund?.sellerReviewStartedAt,
    },
    {
      key: 'admin_review',
      label: 'Admin review',
      at: null,
      reached: ['ADMIN_REVIEW', 'ADMIN_APPROVED', 'ADMIN_REJECTED', 'ON_HOLD_INSUFFICIENT_FUNDS', 'COMPLETED', 'WAITING_FOR_MANUAL_REFUND'].includes(status),
      current: status === 'ADMIN_REVIEW' || status === 'ON_HOLD_INSUFFICIENT_FUNDS',
    },
    {
      key: 'decision',
      label: isRejected ? 'Rejected' : isCompleted ? 'Refunded' : 'Decision',
      at: refund?.refundedAt || null,
      reached: isFinal,
      accent: isCompleted ? 'emerald' : isRejected ? 'red' : 'gray',
    },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const dot = step.reached
          ? step.current
            ? 'bg-accent shadow-[0_0_0_4px_rgba(14,81,226,0.2)] animate-pulse'
            : step.accent === 'emerald' ? 'bg-emerald-500' : step.accent === 'red' ? 'bg-red-500' : 'bg-accent'
          : 'bg-gray-700';
        const line = i < steps.length - 1 ? (
          <div className={`absolute left-[5px] top-3 bottom-[-14px] w-px ${step.reached ? 'bg-accent/40' : 'bg-gray-700'}`} />
        ) : null;
        return (
          <div key={step.key} className="relative flex items-start gap-3">
            {line}
            <span className={`relative mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${step.reached ? 'text-white' : 'text-gray-500'} ${step.muted ? 'italic' : ''}`}>
                {step.label}
              </p>
              {step.at && (
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {new Date(step.at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Collapsible section — used for less-critical content (history/notes) so the
// page stays scannable by default.
const Collapsible = ({ title, defaultOpen = false, children, count }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-gray-700 bg-secondary overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-white">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {title}
          {count !== undefined && count > 0 && (
            <span className="text-xs text-gray-400 font-normal">({count})</span>
          )}
        </span>
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-gray-700/50">{children}</div>}
    </div>
  );
};

const ProductTypeBadge = ({ type }) => {
  if (type === 'ACCOUNT_BASED') return <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/50">Account Based</Badge>;
  return <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/50">Key Based</Badge>;
};

const AdminRefundDetail = () => {
  const { refundId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const [actionType, setActionType] = useState(null);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [sellerInputNote, setSellerInputNote] = useState('');
  const [showRequestSellerInput, setShowRequestSellerInput] = useState(false);
  const [showKeyDetails, setShowKeyDetails] = useState(false);
  const [keyDetails, setKeyDetails] = useState(null);
  const [keyDetailsLoading, setKeyDetailsLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const { data: refund, isLoading, isError, error } = useQuery({
    queryKey: ['admin-refund-details', refundId],
    queryFn: () => returnRefundAPI.getRefundById(refundId).then((res) => res.data.data),
    enabled: !!refundId,
    retry: 1,
  });

  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const onRefundExecuted = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refund-details', refundId] });
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
      queryClient.invalidateQueries({ queryKey: ['seller-balance'] });
    };
    socket.on('refund_executed', onRefundExecuted);
    return () => socket.off('refund_executed', onRefundExecuted);
  }, [socket, isConnected, queryClient, refundId]);

  const requestSellerInputMutation = useMutation({
    mutationFn: ({ refundId: id, note }) => returnRefundAPI.requestSellerInput(id, note),
    onSuccess: () => {
      toast.success('Seller has been requested to provide input.');
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-refund-details', refundId] });
      setSellerInputNote('');
      setShowRequestSellerInput(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to request seller input'),
  });

  const back = (
    <Button onClick={() => navigate('/admin/return-refund')} variant="outline" size="sm">
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to refunds
    </Button>
  );

  if (isLoading) return <div className="space-y-6 px-4 sm:px-0">{back}<Loading message="Loading refund details..." /></div>;
  if (isError || !refund) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        {back}
        <ErrorMessage message={error?.response?.data?.message || 'Refund not found'} />
      </div>
    );
  }

  const status = String(refund.status || '').toUpperCase();
  const canApprove = status === 'ADMIN_REVIEW';
  const canReject = status === 'ADMIN_REVIEW' || status === 'ON_HOLD_INSUFFICIENT_FUNDS';
  const isTerminal = ['ADMIN_APPROVED', 'ADMIN_REJECTED', 'COMPLETED', 'completed', 'rejected'].includes(refund.status);

  const totalAmount = Number(refund.refundAmount || refund.productId?.price || 0);
  const walletPortion = Number(refund.walletRefundAmount || 0);
  const providerPortion = Number(refund.providerRefundAmount || 0);
  const hasSplit = walletPortion > 0 || providerPortion > 0;

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

  // ── DECISION PANEL (used in both right sidebar and mobile sticky bar) ──
  const decisionPanel = (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Refund total</p>
        <p className="text-3xl font-bold text-white tabular-nums">${totalAmount.toFixed(2)}</p>
      </div>

      {hasSplit && (
        <div className="space-y-2 pt-2 border-t border-gray-700">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Split</p>
          {walletPortion > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-300/80">Wallet</span>
              <span className="text-emerald-100 font-semibold tabular-nums">${walletPortion.toFixed(2)}</span>
            </div>
          )}
          {providerPortion > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-sky-300/80">Provider</span>
              <span className="text-sky-100 font-semibold tabular-nums">${providerPortion.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {refund.refundMethod && (
        <div className="pt-2 border-t border-gray-700">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Method</p>
          <p className="text-sm text-white capitalize">{refund.refundMethod.replace('_', ' ')}</p>
        </div>
      )}

      {refund.providerRefundStatus && refund.providerRefundStatus !== 'NONE' && (
        <div className="pt-2 border-t border-gray-700">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Provider status</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
            refund.providerRefundStatus === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-200' :
            refund.providerRefundStatus === 'FAILED' ? 'bg-red-500/20 text-red-200' :
            'bg-amber-500/20 text-amber-200'
          }`}>{refund.providerRefundStatus}</span>
        </div>
      )}

      {canApprove || canReject ? (
        <div className="pt-3 border-t border-gray-700 space-y-2">
          {canApprove && (
            <Button
              onClick={() => { setActionType('approve'); setIsActionOpen(true); }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve & process
            </Button>
          )}
          {canReject && (
            <Button
              variant="destructive"
              onClick={() => { setActionType('reject'); setIsActionOpen(true); }}
              className="w-full"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject refund
            </Button>
          )}
        </div>
      ) : (
        <div className="pt-3 border-t border-gray-700">
          <div className="rounded-md bg-gray-800/50 px-3 py-2 text-xs text-gray-400 flex items-center gap-2">
            <ClipboardCheck className="w-3.5 h-3.5" />
            {isTerminal ? 'This refund is finalized. No further admin action is required.' : 'Awaiting earlier stage before admin action.'}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 px-4 sm:px-0 pb-24 lg:pb-6">
      {/* Top row: back + compact meta strip */}
      <div className="flex flex-wrap items-center gap-3">
        {back}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Refund</span>
          <span className="font-mono text-white">#{refund._id?.slice(-8)}</span>
          <StatusBadge status={refund.status} />
        </div>
      </div>

      {/* Meta strip — one-line facts admin needs before opening any section */}
      <Card className="bg-primary border-gray-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2 min-w-0">
              <Package className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider">Order</p>
                <div className="flex items-center gap-1">
                  <p className="text-white font-mono truncate">#{getDisplayOrderId(refund.orderId)}</p>
                  {refund.orderId?._id && <CopyButton value={refund.orderId._id.toString()} label="Copy order id" />}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 min-w-0">
              <UserIcon className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider">Customer</p>
                <p className="text-white truncate">{refund.userId?.name || refund.userId?.email || 'N/A'}</p>
                {refund.userId?.email && (
                  <p className="text-[11px] text-gray-500 truncate">{refund.userId.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2 min-w-0">
              <Store className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider">Seller</p>
                <p className="text-white truncate">{refund.sellerId?.shopName || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 min-w-0">
              <Clock className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider">Requested</p>
                <p className="text-white">{new Date(refund.createdAt).toLocaleDateString()}</p>
                <p className="text-[11px] text-gray-500">{new Date(refund.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout — LEFT: review content, RIGHT: sticky decision */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT COLUMN — the review flow (top-down as an admin reads) */}
        <div className="lg:col-span-2 space-y-4">
          {/* REASON + PRODUCT snapshot (why is this being refunded, of what) */}
          <Card className="bg-primary border-gray-700">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-4">
                {refund.productId?.images?.[0] && (
                  <SafeImage
                    src={refund.productId.images[0]}
                    alt={refund.productId.name}
                    className="w-16 h-16 rounded object-cover border border-gray-700 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Product</p>
                  <p className="text-white font-medium truncate">{refund.productId?.name || 'N/A'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {refund.productId?.productType && <ProductTypeBadge type={refund.productId.productType} />}
                    <span className="text-xs text-gray-500">Listed at ${refund.productId?.price?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Buyer&apos;s reason</p>
                <p className="text-white leading-relaxed bg-secondary/50 rounded-md px-3 py-2.5 border border-gray-700/60">
                  {refund.reason || <span className="italic text-gray-500">No reason provided</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* EVIDENCE — prominent, click-to-lightbox */}
          {refund.evidenceFiles?.length > 0 && (
            <Card className="bg-primary border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-white">Evidence</p>
                  <span className="text-xs text-gray-500">{refund.evidenceFiles.length} file{refund.evidenceFiles.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {refund.evidenceFiles.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightbox(url)}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-accent transition-colors bg-gray-900"
                    >
                      <SafeImage src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* LICENSE KEYS — collapsible reveal */}
          {refund.licenseKeyIds?.length > 0 && (
            <Card className="bg-primary border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-accent" />
                    <p className="text-sm font-semibold text-white">Keys in request</p>
                    <span className="text-xs text-gray-500">({refund.licenseKeyIds.length})</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleKeys}
                    disabled={keyDetailsLoading}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {keyDetailsLoading ? 'Loading...' : showKeyDetails ? (
                      <><EyeOff className="w-4 h-4 mr-1" />Hide</>
                    ) : (
                      <><Key className="w-4 h-4 mr-1" />Reveal</>
                    )}
                  </Button>
                </div>
                {showKeyDetails && keyDetails && (
                  <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                    <p className="flex items-center gap-1.5 text-xs text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Sensitive information — do not share externally
                    </p>
                    {keyDetails.keys?.length > 0 ? keyDetails.keys.map((key, idx) => (
                      <div key={key.keyId || idx} className="p-2.5 bg-gray-900/70 rounded border border-gray-700">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-gray-400 mb-1">
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
                        <div className="flex gap-3 mt-1.5 text-[11px] text-gray-500">
                          {key.assignedAt && <span>Assigned: {new Date(key.assignedAt).toLocaleString()}</span>}
                          {key.refundedAt && <span>Refunded: {new Date(key.refundedAt).toLocaleString()}</span>}
                        </div>
                      </div>
                    )) : <p className="text-gray-400 text-sm">No key details available</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* REQUEST SELLER INPUT — inline block, only when actionable */}
          {status === 'ADMIN_REVIEW' && (
            <Card className="bg-primary border-gray-700">
              <CardContent className="p-5">
                {!showRequestSellerInput ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Need seller input?</p>
                      <p className="text-xs text-gray-400 mt-0.5">Ask the seller to clarify before you decide.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowRequestSellerInput(true)}
                      className="border-gray-600 text-gray-300"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Request input
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Message to seller</Label>
                    <Textarea
                      value={sellerInputNote}
                      onChange={(e) => setSellerInputNote(e.target.value)}
                      placeholder={'e.g. "Was this license valid at delivery?"'}
                      rows={2}
                      className="bg-secondary border-gray-700 text-white w-full"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => requestSellerInputMutation.mutate({ refundId: refund._id, note: sellerInputNote })}
                        disabled={requestSellerInputMutation.isPending || !sellerInputNote.trim()}
                        className="bg-accent hover:bg-accent/90"
                      >
                        Send
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setShowRequestSellerInput(false); setSellerInputNote(''); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SELLER FEEDBACK — advisory only, prominent when present */}
          {(refund.sellerFeedback || refund.sellerDecisionReason) && (
            <Card className="bg-primary border-gray-700">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <Store className="w-4 h-4 text-accent" />
                  From the seller
                </p>
                {refund.sellerDecisionReason && (
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Rejection reason (escalated)</p>
                    <p className="text-amber-200 text-sm">{refund.sellerDecisionReason}</p>
                  </div>
                )}
                {refund.sellerFeedback && (
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Advisory feedback</p>
                    <p className="text-white text-sm">{refund.sellerFeedback}</p>
                    {refund.sellerFeedbackAt && (
                      <p className="text-[11px] text-gray-500 mt-1">{new Date(refund.sellerFeedbackAt).toLocaleString()}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* COLLAPSIBLE: audit trail (history + admin notes + rejection reason + refund timestamps) */}
          {(refund.refundHistory?.length > 0 || refund.adminNotes || refund.rejectionReason || refund.refundedAt) && (
            <Collapsible
              title="Audit trail"
              defaultOpen={isTerminal}
              count={(refund.refundHistory?.length || 0) + (refund.adminNotes ? 1 : 0) + (refund.rejectionReason ? 1 : 0)}
            >
              <div className="space-y-3 pt-3">
                {refund.refundHistory?.length > 0 && (
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">History</p>
                    <ul className="space-y-1.5 text-xs text-gray-300">
                      {refund.refundHistory.map((h, i) => (
                        <li key={i} className="flex gap-2 items-baseline">
                          <span className="text-gray-500 font-mono shrink-0">{h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}</span>
                          <span className="text-accent capitalize">{h.actor}</span>
                          <span className="text-gray-400">{h.action}</span>
                          {h.newStatus && <span className="text-white">→ {h.newStatus}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {refund.adminNotes && (
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Admin notes</p>
                    <p className="text-white text-sm">{refund.adminNotes}</p>
                  </div>
                )}
                {refund.rejectionReason && (
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Rejection reason</p>
                    <p className="text-red-300 text-sm">{refund.rejectionReason}</p>
                  </div>
                )}
                {refund.refundedAt && (
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Refunded at</p>
                    <p className="text-white text-sm">{new Date(refund.refundedAt).toLocaleString()}</p>
                  </div>
                )}
                {refund.splitBreakdown?.paypalCaptureId && (
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">PayPal capture</p>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-xs break-all">{refund.splitBreakdown.paypalCaptureId}</span>
                      <CopyButton value={refund.splitBreakdown.paypalCaptureId} label="Copy capture id" />
                    </div>
                  </div>
                )}
                {refund.fallbackUsed && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    Provider portion was completed manually by admin (fallback).
                  </div>
                )}
              </div>
            </Collapsible>
          )}

          {/* REFUND CHAT — full-width at bottom */}
          <Card className="bg-primary border-gray-700">
            <CardContent className="p-5">
              <RefundChat refundId={refund._id} canSend={true} locked={isRefundChatLocked(refund.status)} />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN — sticky decision panel + timeline (desktop only sticky) */}
        <div className="space-y-4">
          <div className="lg:sticky lg:top-4 space-y-4">
            {/* Decision panel */}
            <Card className="bg-primary border-gray-700">
              <CardContent className="p-5">{decisionPanel}</CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-primary border-gray-700">
              <CardContent className="p-5">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">Timeline</p>
                <Timeline refund={refund} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Lightbox — click evidence to enlarge */}
      {lightbox && (
        <button
          type="button"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          aria-label="Close preview"
        >
          <img src={lightbox} alt="Evidence full size" className="max-w-full max-h-full object-contain rounded" />
        </button>
      )}

      <RefundActionDialog
        open={isActionOpen}
        onOpenChange={setIsActionOpen}
        refund={refund}
        actionType={actionType}
      />
    </div>
  );
};

export default AdminRefundDetail;
