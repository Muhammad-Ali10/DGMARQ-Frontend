import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI } from "../../services/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Loading, ErrorMessage } from "../../components/ui/loading";
import {
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  Eye,
  Snowflake,
} from "lucide-react";
import { showApiError, showSuccess } from "../../utils/toast";
import { useSocket } from "../../hooks/useSocket";
import { Link } from "react-router-dom";

// ============================================================================
// Phase 5 - Admin Payouts & Withdrawals Management
// ============================================================================
//
// Two tabs:
//   1. Withdrawals (NEW) - lifecycle: requested / approved / queued /
//      processing / sent / failed / failed_with_retry / rejected
//      Admin actions: approve, reject (with reason), retry.
//      Surfaces fallbackUsed prominently so a fee that came from the static
//      table (Payoneer unreachable) gets visible operator review.
//   2. All payouts (legacy) - retained for visibility of pre-Phase-5
//      auto-released payout lines.
// ============================================================================

const WITHDRAWAL_STATUS_LABEL = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  queued: "Queued",
  processing: "Processing",
  sent: "Sent",
  failed: "Failed",
  failed_with_retry: "Retrying",
};
const WITHDRAWAL_STATUS_VARIANT = {
  requested: "warning",
  approved: "warning",
  rejected: "destructive",
  queued: "warning",
  processing: "warning",
  sent: "success",
  failed: "destructive",
  failed_with_retry: "warning",
};

const METHOD_LABEL = {
  paypal: "PayPal",
  payoneer: "Payoneer",
  local_bank: "Local Bank",
  swift: "SWIFT",
};

const formatUsd = (n) => `$${Number(n || 0).toFixed(2)}`;

// A payout line represents the seller's earnings for ONE (order, product)
// pair, which may contain multiple license keys. When a buyer disputes /
// refunds a single key, only that key's portion of `netAmount` is moved
// into `frozenAmount` (and its id is added to `frozenKeyIds`). On refund
// completion the key id is moved into `metadata.refundedLicenseKeyIds`
// and the live gross/commission/net are reduced.
//
// Total uses the sale-time `metadata.originalNetAmount` snapshot so it
// stays anchored to the original sale across refunds. Refunded amount is
// derived per-key. Mirrors the seller-side `splitPayoutRow`.
//
// Status taxonomy:
//   - "available" (green)  → no frozen, no refunded, payout already released
//   - "pending"   (yellow) → no frozen, no refunded, payout still on hold
//   - "frozen"    (orange) → all keys frozen
//   - "refunded"  (red)    → all keys refunded
//   - "partial"   (yellow) → any mix
const splitPayoutAmount = (payout) => {
  const meta = payout?.metadata || {};
  const totalKeys = Array.isArray(payout?.licenseKeyIds)
    ? payout.licenseKeyIds.length
    : 0;
  const frozenKeys = Math.min(
    Array.isArray(payout?.frozenKeyIds) ? payout.frozenKeyIds.length : 0,
    totalKeys
  );
  const refundedKeysRaw = Array.isArray(meta.refundedLicenseKeyIds)
    ? meta.refundedLicenseKeyIds.length
    : 0;
  const refundedKeys = Math.min(refundedKeysRaw, Math.max(totalKeys - frozenKeys, 0));
  const availableKeys = Math.max(totalKeys - frozenKeys - refundedKeys, 0);

  // Resolve the sale-time net. Priority:
  //   1. `metadata.originalNetAmount`  — snapshot taken at refund time.
  //   2. Reconstruct from the live (post-refund) net:
  //        remainingKeys = totalKeys - refundedKeys
  //        perKeyNet     = liveNet / remainingKeys
  //        originalNet   = perKeyNet * totalKeys
  //      Handles legacy rows that were refunded before the snapshot
  //      logic existed (without this, a $160 / 2-key line with 1 key
  //      refunded would render as Total $80, halving the per-key math
  //      and producing $40 / $40 / $40 instead of $160 / $80 / $80).
  //   3. Otherwise, the live net IS the original.
  const liveNet = Number(payout?.netAmount ?? payout?.amount ?? 0);
  let originalNet;
  if (typeof meta.originalNetAmount === "number") {
    originalNet = meta.originalNetAmount;
  } else if (totalKeys > 0 && refundedKeys > 0 && refundedKeys < totalKeys) {
    const remainingKeys = totalKeys - refundedKeys;
    originalNet = Math.round((liveNet / remainingKeys) * totalKeys * 100) / 100;
  } else if (totalKeys > 0 && refundedKeys >= totalKeys) {
    // Every key refunded but no snapshot — can't recover from a $0
    // residual; surface 0 so the row's "refunded" status carries the
    // meaning. The detail page falls back to metadata for these.
    originalNet = 0;
  } else {
    originalNet = liveNet;
  }
  const perKeyNet =
    totalKeys > 0 ? Math.round((originalNet / totalKeys) * 100) / 100 : 0;

  const frozen = Math.max(0, Number(payout?.frozenAmount || 0));
  const refunded = Math.round(perKeyNet * refundedKeys * 100) / 100;
  const available = Math.max(
    0,
    Math.round((originalNet - frozen - refunded) * 100) / 100
  );

  // Per-row derived state. Overrides the payout's lifecycle status when
  // the key counts tell a clearer story (mixed / fully frozen / fully
  // refunded). When no refunds or freezes are present we fall through to
  // the payout's own lifecycle status.
  let derivedStatus = payout?.status || "pending";
  if (totalKeys > 0) {
    if (refundedKeys === totalKeys) derivedStatus = "refunded";
    else if (frozenKeys === totalKeys) derivedStatus = "frozen";
    else if (frozenKeys > 0 || refundedKeys > 0) derivedStatus = "partial";
  }

  return {
    total: Math.round(originalNet * 100) / 100,
    available,
    frozen: Math.round(frozen * 100) / 100,
    refunded,
    totalKeys,
    frozenKeys,
    refundedKeys,
    availableKeys,
    hasFrozen: frozen > 0,
    hasRefunded: refunded > 0,
    derivedStatus,
  };
};

// Visual mapping for the derived per-row status badge.
const ROW_STATUS_META = {
  available: { label: "Available", variant: "success" },
  released:  { label: "Released",  variant: "success" },
  pending:   { label: "Pending",   variant: "warning" },
  processing:{ label: "Processing",variant: "warning" },
  hold:      { label: "Hold",      variant: "warning" },
  partial:   { label: "Partial",   variant: "warning" },
  frozen:    { label: "Frozen",    variant: "warning" }, // styled orange below
  refunded:  { label: "Refunded",  variant: "destructive" },
  failed:    { label: "Failed",    variant: "destructive" },
  blocked:   { label: "Blocked",   variant: "destructive" },
};

const PayoutsManagement = () => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  // --- Withdrawals tab state ---
  const [wPage, setWPage] = useState(1);
  const [wStatus, setWStatus] = useState("");
  const [wMethod, setWMethod] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const {
    data: withdrawalsData,
    isLoading: withdrawalsLoading,
    isError: withdrawalsErr,
    error: withdrawalsError,
  } = useQuery({
    queryKey: ["admin-withdrawals", wPage, wStatus, wMethod],
    queryFn: () =>
      adminAPI
        .listWithdrawals({
          page: wPage,
          limit: 15,
          status: wStatus || undefined,
          methodType: wMethod || undefined,
        })
        .then((res) => res.data?.data),
    keepPreviousData: true,
    refetchInterval: 30000,
  });
  const withdrawals = withdrawalsData?.rows || [];
  const withdrawalsPages = withdrawalsData?.pages || 1;
  const withdrawalsTotal = withdrawalsData?.total || 0;

  // Real-time updates from worker / webhook.
  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    const events = [
      "withdrawal_requested",
      "withdrawal_approved",
      "withdrawal_rejected",
      "withdrawal_processing",
      "withdrawal_sent",
      "withdrawal_failed",
    ];
    events.forEach((ev) => socket.on(ev, invalidate));
    return () => events.forEach((ev) => socket.off(ev, invalidate));
  }, [socket, isConnected, queryClient]);

  const approveMutation = useMutation({
    mutationFn: (id) => adminAPI.approveWithdrawal(id),
    onSuccess: () => {
      showSuccess("Withdrawal approved and queued for processing.");
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    },
    onError: (err) => showApiError(err, "Failed to approve withdrawal"),
  });
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => adminAPI.rejectWithdrawal(id, { reason }),
    onSuccess: () => {
      showSuccess("Withdrawal rejected.");
      setRejectTarget(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    },
    onError: (err) => showApiError(err, "Failed to reject withdrawal"),
  });
  const retryMutation = useMutation({
    mutationFn: (id) => adminAPI.retryWithdrawal(id),
    onSuccess: () => {
      showSuccess("Withdrawal re-queued for processing.");
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    },
    onError: (err) => showApiError(err, "Failed to retry withdrawal"),
  });

  // --- Legacy payouts tab state ---
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const {
    data: payouts,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-payouts", page, statusFilter],
    queryFn: () =>
      adminAPI
        .getAllPayouts({ page, limit: 10, status: statusFilter || undefined })
        .then((res) => res.data?.data),
    retry: 1,
  });

  const processMutation = useMutation({
    mutationFn: (payoutId) => adminAPI.processPayout(payoutId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-payouts"] }),
  });

  const payoutList = useMemo(() => payouts?.payouts || [], [payouts]);
  const pagination = payouts?.pagination || {};
  const totalItems = pagination.total ?? 0;

  // NOTE: per-row status is now derived from key counts via
  // splitPayoutAmount().derivedStatus and rendered with ROW_STATUS_META at
  // the call site (so a "partial" row reads "Partial" instead of just the
  // raw lifecycle status). The old per-row getLegacyStatusBadge helper
  // that read payout.status directly was removed.

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Payouts Management</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">
          Approve seller withdrawal requests and review payout activity.
        </p>
      </div>

      <Tabs defaultValue="withdrawals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-primary border-gray-700">
          <TabsTrigger value="withdrawals" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="legacy" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            Earning Lines (legacy)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals">
          <Card className="bg-primary border-gray-700">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Withdrawal requests
                {withdrawalsTotal > 0 && (
                  <span className="text-xs font-normal text-gray-400 ml-2">
                    {withdrawalsTotal} total
                  </span>
                )}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Select value={wStatus || "all"} onValueChange={(v) => { setWStatus(v === "all" ? "" : v); setWPage(1); }}>
                  <SelectTrigger className="w-44 bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    {Object.keys(WITHDRAWAL_STATUS_LABEL).map((k) => (
                      <SelectItem key={k} value={k}>{WITHDRAWAL_STATUS_LABEL[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={wMethod || "all"} onValueChange={(v) => { setWMethod(v === "all" ? "" : v); setWPage(1); }}>
                  <SelectTrigger className="w-44 bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All methods</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="payoneer">Payoneer</SelectItem>
                    <SelectItem value="local_bank">Local Bank</SelectItem>
                    <SelectItem value="swift">SWIFT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {withdrawalsLoading ? (
                <Loading message="Loading withdrawals..." />
              ) : withdrawalsErr ? (
                <ErrorMessage message={withdrawalsError?.response?.data?.message || "Failed to load withdrawals"} />
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No withdrawal requests yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700 hover:bg-gray-800">
                        <TableHead className="text-gray-300">ID</TableHead>
                        <TableHead className="text-gray-300">Seller</TableHead>
                        <TableHead className="text-gray-300">Method</TableHead>
                        <TableHead className="text-gray-300">Amount</TableHead>
                        <TableHead className="text-gray-300">Fee</TableHead>
                        <TableHead className="text-gray-300">Net</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Requested</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((w) => (
                        <TableRow key={w._id} className="border-gray-700 hover:bg-gray-800 align-top">
                          <TableCell className="text-white font-mono text-xs">{w._id.slice(-8)}</TableCell>
                          <TableCell className="text-gray-300 text-sm">
                            <div className="flex flex-col">
                              <span>{w.sellerId?.shopName || "N/A"}</span>
                              <span className="text-[11px] text-gray-500 font-mono">
                                {(w.sellerId?._id || w.sellerId || "").toString().slice(-8)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-200 text-sm">{METHOD_LABEL[w.methodType] || w.methodType}</TableCell>
                          <TableCell className="text-white font-semibold">{formatUsd(w.requestedAmount)}</TableCell>
                          <TableCell className="text-gray-300">
                            <div className="flex flex-col items-start gap-1">
                              <span>{formatUsd(w.providerFee)}</span>
                              {w.fallbackUsed && (
                                <Badge variant="warning" className="text-[10px] flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Fallback fee
                                </Badge>
                              )}
                              <span className="text-[10px] text-gray-500">{w.feeSource}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-green-400 font-medium">{formatUsd(w.netAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={WITHDRAWAL_STATUS_VARIANT[w.status] || "default"}>
                              {WITHDRAWAL_STATUS_LABEL[w.status] || w.status}
                            </Badge>
                            {w.rejectionReason && (
                              <p className="text-[11px] text-red-300 mt-1 max-w-[180px]">{w.rejectionReason}</p>
                            )}
                            {w.failureReason && (
                              <p className="text-[11px] text-red-300 mt-1 max-w-[180px]">{w.failureReason}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {new Date(w.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {w.status === "requested" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-500 text-white"
                                    disabled={approveMutation.isPending}
                                    onClick={() => approveMutation.mutate(w._id)}
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setRejectTarget(w); setRejectReason(""); }}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {(w.status === "failed" || w.status === "failed_with_retry") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-700 text-gray-200"
                                  onClick={() => retryMutation.mutate(w._id)}
                                  disabled={retryMutation.isPending}
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Retry
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {withdrawalsTotal > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-700">
                  <span className="text-sm text-gray-400">
                    Page {wPage} of {withdrawalsPages} ({withdrawalsTotal} total)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setWPage((p) => Math.max(1, p - 1))} disabled={wPage <= 1}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setWPage((p) => Math.min(withdrawalsPages, p + 1))} disabled={wPage >= withdrawalsPages}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legacy">
          <Card className="bg-primary border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                All earning lines
              </CardTitle>
              <Select
                value={statusFilter || "all"}
                onValueChange={(value) => { setStatusFilter(value === "all" ? "" : value); setPage(1); }}
              >
                <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="hold">Hold</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loading message="Loading payouts..." />
              ) : isError ? (
                <ErrorMessage message={error?.response?.data?.message || "Error loading payouts"} />
              ) : payoutList.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No earning lines found</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700 hover:bg-gray-800">
                          <TableHead className="text-gray-300">Payout ID</TableHead>
                          <TableHead className="text-gray-300">Seller</TableHead>
                          <TableHead className="text-gray-300">Total</TableHead>
                          <TableHead className="text-gray-300">Available</TableHead>
                          <TableHead className="text-gray-300">Frozen / Refunded</TableHead>
                          <TableHead className="text-gray-300">Status</TableHead>
                          <TableHead className="text-gray-300">Hold Until</TableHead>
                          <TableHead className="text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payoutList.map((payout) => {
                          const split = splitPayoutAmount(payout);
                          const statusMeta =
                            ROW_STATUS_META[split.derivedStatus] || {
                              label: split.derivedStatus,
                              variant: "default",
                            };
                          // The 'frozen' state needs a custom orange chip
                          // since the existing Badge variants don't include
                          // an orange palette; same goes for the yellow
                          // "Partial" chip.
                          const isFrozenRow = split.derivedStatus === "frozen";
                          const isPartialRow = split.derivedStatus === "partial";
                          return (
                          <TableRow key={payout._id} className="border-gray-700 hover:bg-gray-800 align-top">
                            <TableCell className="text-white font-mono text-sm">{payout._id.slice(-8)}</TableCell>
                            <TableCell className="text-gray-300">{payout.sellerId?.shopName || "N/A"}</TableCell>
                            <TableCell className="text-white font-semibold">
                              {formatUsd(split.total)}
                              {split.totalKeys > 0 && (
                                <div className="text-[11px] text-gray-500 font-normal mt-0.5">
                                  {split.totalKeys} key{split.totalKeys === 1 ? "" : "s"}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-semibold ${
                                  split.available > 0 ? "text-green-400" : "text-gray-500"
                                }`}
                              >
                                {formatUsd(split.available)}
                              </span>
                              {split.totalKeys > 0 && split.availableKeys < split.totalKeys && (
                                <div className="text-[11px] text-gray-500 mt-0.5">
                                  {split.availableKeys} of {split.totalKeys} key
                                  {split.totalKeys === 1 ? "" : "s"}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {split.hasFrozen || split.hasRefunded ? (
                                <div className="space-y-1">
                                  {split.hasFrozen && (
                                    <div>
                                      <span className="inline-flex items-center gap-1 font-semibold text-orange-400">
                                        <Snowflake className="w-3.5 h-3.5" />
                                        {formatUsd(split.frozen)}
                                        <span className="text-[10px] uppercase tracking-wide text-orange-300/80 ml-1">
                                          Frozen
                                        </span>
                                      </span>
                                      {split.frozenKeys > 0 && (
                                        <div className="text-[11px] text-gray-500 mt-0.5 ml-5">
                                          {split.frozenKeys} of {split.totalKeys} key
                                          {split.totalKeys === 1 ? "" : "s"}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {split.hasRefunded && (
                                    <div>
                                      <span className="inline-flex items-center gap-1 font-semibold text-red-400">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {formatUsd(split.refunded)}
                                        <span className="text-[10px] uppercase tracking-wide text-red-300/80 ml-1">
                                          Refunded
                                        </span>
                                      </span>
                                      {split.refundedKeys > 0 && (
                                        <div className="text-[11px] text-gray-500 mt-0.5 ml-5">
                                          {split.refundedKeys} of {split.totalKeys} key
                                          {split.totalKeys === 1 ? "" : "s"}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isFrozenRow ? (
                                <Badge className="bg-orange-900/40 border-orange-700/60 text-orange-300 hover:bg-orange-900/40">
                                  {statusMeta.label}
                                </Badge>
                              ) : isPartialRow ? (
                                <Badge className="bg-yellow-900/40 border-yellow-700/60 text-yellow-300 hover:bg-yellow-900/40">
                                  {statusMeta.label}
                                </Badge>
                              ) : (
                                <Badge variant={statusMeta.variant}>
                                  {statusMeta.label}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {payout.holdUntil
                                ? new Date(payout.holdUntil).toLocaleDateString()
                                : payout.scheduledAt
                                  ? new Date(payout.scheduledAt).toLocaleDateString()
                                  : "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {payout.orderId && (
                                  <Button asChild size="sm" variant="outline" className="border-gray-700 text-gray-300">
                                    <Link to={`/admin/payouts/${payout.orderId?._id || payout.orderId}`}>
                                      <Eye className="w-3 h-3 mr-1" />
                                      View Details
                                    </Link>
                                  </Button>
                                )}
                                {payout.status === "pending" && (
                                  <Button
                                    size="sm"
                                    onClick={() => processMutation.mutate(payout._id)}
                                    disabled={processMutation.isPending}
                                  >
                                    Process
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-700">
                      <span className="text-sm text-gray-400">
                        Page {page} of {pagination.pages || 1} ({totalItems} total)
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(pagination.pages || 1, p + 1))}
                          disabled={page >= (pagination.pages || 1)}
                        >
                          Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setRejectReason(""); } }}>
        <DialogContent size="md" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Reject withdrawal</DialogTitle>
            <DialogDescription className="text-gray-400">
              Provide a clear reason. The seller will see it on their earnings page.
            </DialogDescription>
          </DialogHeader>
          {rejectTarget && (
            <div className="space-y-3">
              <div className="text-sm text-gray-300 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-400">Seller</p>
                  <p>{rejectTarget.sellerId?.shopName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Amount</p>
                  <p>{formatUsd(rejectTarget.requestedAmount)} ({METHOD_LABEL[rejectTarget.methodType]})</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reject-reason" className="text-gray-300">Reason</Label>
                <Input
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Account verification mismatch; please re-link your method."
                  className="bg-secondary border-gray-700 text-white"
                  maxLength={500}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate({ id: rejectTarget._id, reason: rejectReason.trim() })}
            >
              Reject withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayoutsManagement;
