import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminAPI } from "@services/api";
import { EmptyState } from "@components/common/EmptyState";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { Badge } from "@components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Loading, ErrorMessage } from "@components/ui/loading";
import {
  DollarSign,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
  Eye,
  Snowflake,
} from "lucide-react";
import { Pagination } from "@components/common/Pagination";
import { showApiError, showSuccess } from "@utils/toast";
import { useSocket } from "@hooks/useSocket";
import { Link } from "react-router-dom";
import useCurrency from '@hooks/useCurrency';

const WITHDRAWAL_STATUS_LABEL = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  queued: "Queued",
  processing: "Processing",
  sent: "Sent",
  failed: "Failed",
  failed_with_retry: "Retrying",
  needs_review: "Needs review",
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
  needs_review: "destructive",
};

const METHOD_LABEL = {
  paypal: "PayPal",
};


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

  const liveNet = Number(payout?.netAmount ?? payout?.amount ?? 0);
  let originalNet;
  if (typeof meta.originalNetAmount === "number") {
    originalNet = meta.originalNetAmount;
  } else if (totalKeys > 0 && refundedKeys > 0 && refundedKeys < totalKeys) {
    const remainingKeys = totalKeys - refundedKeys;
    originalNet = Math.round((liveNet / remainingKeys) * totalKeys * 100) / 100;
  } else if (totalKeys > 0 && refundedKeys >= totalKeys) {
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

const ROW_STATUS_META = {
  available: { label: "Available", variant: "success" },
  released:  { label: "Released",  variant: "success" },
  pending:   { label: "Pending",   variant: "warning" },
  processing:{ label: "Processing",variant: "warning" },
  hold:      { label: "Hold",      variant: "warning" },
  partial:   { label: "Partial",   variant: "warning" },
  frozen:    { label: "Frozen",    variant: "warning" },
  refunded:  { label: "Refunded",  variant: "destructive" },
  failed:    { label: "Failed",    variant: "destructive" },
  blocked:   { label: "Blocked",   variant: "destructive" },
};

const PayoutsManagement = () => {
  const { formatWithUsd: formatMoney } = useCurrency();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const [wPage, setWPage] = useState(1);
  const [wStatus, setWStatus] = useState("");
  const [wMethod, setWMethod] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmedNotPaid, setConfirmedNotPaid] = useState(false);
  const closeReject = () => { setRejectTarget(null); setRejectReason(""); setConfirmedNotPaid(false); };
  const releasingStuck = rejectTarget && (rejectTarget.status === "needs_review" || rejectTarget.status === "failed_with_retry");

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
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
  });
  const withdrawals = withdrawalsData?.rows || [];
  const withdrawalsPages = withdrawalsData?.pages || 1;
  const withdrawalsTotal = withdrawalsData?.total || 0;

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
    mutationFn: ({ id, reason, confirmedNotPaid: confirmed }) => adminAPI.rejectWithdrawal(id, { reason, confirmedNotPaid: confirmed }),
    onSuccess: () => {
      showSuccess("Withdrawal rejected.");
      closeReject();
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

  const payoutList = useMemo(() => payouts?.payouts || [], [payouts]);
  const pagination = payouts?.pagination || {};
  const totalItems = pagination.total ?? 0;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Payouts Management</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">
          Approve seller withdrawal requests and review payout activity.
        </p>
      </div>

      <Tabs defaultValue="withdrawals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-surface-sunken border-gray-700">
          <TabsTrigger value="withdrawals" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="legacy" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            Earning Lines (legacy)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals">
          <Card variant="hud">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
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
                <EmptyState title="No withdrawal requests yet." />
              ) : (
                <div className="overflow-x-auto">
                  <Table variant="hud">
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
                              {w.notes && (
                                <span className="mt-1 max-w-[220px] text-[11px] text-gray-400 break-words">
                                  Seller note: {w.notes}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-200 text-sm">{METHOD_LABEL[w.methodType] || w.methodType}</TableCell>
                          <TableCell className="text-white font-semibold">{formatMoney(w.requestedAmount)}</TableCell>
                          <TableCell className="text-gray-300">
                            <div className="flex flex-col items-start gap-0.5">
                              <span>{formatMoney((Number(w.providerFee) || 0) + (Number(w.chargebackFee) || 0))}</span>
                              <span className="text-[10px] text-gray-500">
                                {formatMoney(w.providerFee)} payout + {formatMoney(w.chargebackFee)} chargeback
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-green-400 font-medium">{formatMoney(w.netAmount)}</TableCell>
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
                              {(w.status === "failed_with_retry" || w.status === "needs_review") && (
                                <>
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
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setRejectTarget(w); setRejectReason(""); setConfirmedNotPaid(false); }}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Reject &amp; release
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <Pagination page={wPage} totalPages={withdrawalsPages} onPageChange={setWPage} total={withdrawalsTotal} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legacy">
          <Card variant="hud">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
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
                <EmptyState title="No earning lines found" />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table variant="hud">
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
                          const isFrozenRow = split.derivedStatus === "frozen";
                          const isPartialRow = split.derivedStatus === "partial";
                          return (
                          <TableRow key={payout._id} className="border-gray-700 hover:bg-gray-800 align-top">
                            <TableCell className="text-white font-mono text-sm">{payout._id.slice(-8)}</TableCell>
                            <TableCell className="text-gray-300">{payout.sellerId?.shopName || "N/A"}</TableCell>
                            <TableCell className="text-white font-semibold">
                              {formatMoney(split.total)}
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
                                {formatMoney(split.available)}
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
                                        {formatMoney(split.frozen)}
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
                                        {formatMoney(split.refunded)}
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
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination page={page} totalPages={pagination.pages || 1} onPageChange={setPage} total={totalItems} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) closeReject(); }}>
        <DialogContent size="md" className="">
          <DialogHeader>
            <DialogTitle className="text-white">Reject withdrawal</DialogTitle>
            <DialogDescription className="text-gray-400">
              Provide a clear reason. The seller will see it on their earnings page.
              {releasingStuck && " The reserved amount goes back to the seller's available balance."}
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
                  <p>{formatMoney(rejectTarget.requestedAmount)} ({METHOD_LABEL[rejectTarget.methodType]})</p>
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
              {releasingStuck && rejectTarget.paypalSubmissionUnknown && (
                <label className="flex items-start gap-2 text-sm text-amber-200">
                  <input
                    type="checkbox"
                    aria-label="I checked PayPal and this payout was not paid"
                    className="mt-1"
                    checked={confirmedNotPaid}
                    onChange={(e) => setConfirmedNotPaid(e.target.checked)}
                  />
                  PayPal may already hold this payout batch. I checked PayPal and it was not paid.
                </label>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeReject} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending || (releasingStuck && rejectTarget.paypalSubmissionUnknown && !confirmedNotPaid)}
              onClick={() => rejectMutation.mutate({ id: rejectTarget._id, reason: rejectReason.trim(), confirmedNotPaid })}
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
