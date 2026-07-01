import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sellerAPI } from "@services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Badge } from "@components/ui/badge";
import { Loading } from "@components/ui/loading";
import { DollarSign, FileText, Settings, History, Eye, ArrowUpRight, AlertCircle, Snowflake } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { WithdrawalRequestModal } from "@features/wallet-payout";
import { useSocket } from "@hooks/useSocket";

// ============================================================================
// Phase 5 - Seller Earnings page rewritten to drive the new withdrawal flow.
//
// - Replaces the legacy "auto-released" copy with an explicit "Request
//   withdrawal" CTA.
// - Pulls available / pending / paid / in-flight from one balance source.
// - Adds a Withdrawals tab showing the lifecycle (requested, approved,
//   processing, sent, failed) for every withdrawal.
// - Listens to socket events so admin decisions reflect in real time.
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
};

const formatUsd = (n) => `$${Number(n || 0).toFixed(2)}`;

// Split a payout row into seller-facing total / available / frozen /
// refunded amounts.
//
// Total uses the SALE-TIME `originalNetAmount` (shipped by the backend
// via getSellerPayouts) — falling back to live `netAmount` for legacy
// rows. This is critical: live netAmount is reduced by completed refunds
// so it can't be used as a row "Total" without misleading the seller.
//
// Refunded amount is derived: each key contributes an equal slice of the
// original net, so refundedAmount = perKeyNet * refundedKeyCount.
//
// Status taxonomy (matches the user-facing spec):
//   - "available" (green)  → no frozen, no refunded keys, payout lifecycle
//                            already released
//   - "pending"   (yellow) → no frozen, no refunded keys, payout still on hold
//   - "frozen"    (orange) → every key frozen
//   - "refunded"  (red)    → every key refunded
//   - "partial"   (yellow) → any mix
//
// SECURITY: this is purely a presentation transform over fields already
// shipped to the seller (`originalNetAmount`, `netAmount`, `frozenAmount`,
// `frozenKeyIds`, `licenseKeyIds`, `refundedKeyCount`). No admin fields.
const splitPayoutRow = (payout) => {
  const totalKeys = Array.isArray(payout?.licenseKeyIds)
    ? payout.licenseKeyIds.length
    : 0;
  const frozenKeys = Math.min(
    Array.isArray(payout?.frozenKeyIds) ? payout.frozenKeyIds.length : 0,
    totalKeys
  );
  const refundedKeys = Math.min(
    Number(payout?.refundedKeyCount || 0),
    Math.max(totalKeys - frozenKeys, 0)
  );
  const availableKeys = Math.max(totalKeys - frozenKeys - refundedKeys, 0);

  // Prefer sale-time original; fall back to live for legacy rows. We also
  // re-add the refunded slice back into the total so the "Total" column
  // reflects the full sale, not the post-refund residual.
  const originalNet =
    typeof payout?.originalNetAmount === "number"
      ? payout.originalNetAmount
      : Number(payout?.netAmount ?? payout?.amount ?? 0);
  const perKeyNet =
    totalKeys > 0 ? Math.round((originalNet / totalKeys) * 100) / 100 : 0;

  const frozen = Math.max(0, Number(payout?.frozenAmount || 0));
  const refunded = Math.round(perKeyNet * refundedKeys * 100) / 100;
  const available = Math.max(
    0,
    Math.round((originalNet - frozen - refunded) * 100) / 100
  );

  // Derive a per-row state from the key counts (overrides the raw
  // payout.status when keys are mixed).
  let derivedStatus = payout?.status || "pending";
  if (totalKeys > 0) {
    if (refundedKeys === totalKeys) derivedStatus = "refunded";
    else if (frozenKeys === totalKeys) derivedStatus = "frozen";
    else if (frozenKeys > 0 || refundedKeys > 0) derivedStatus = "partial";
    // else: keep the payout lifecycle status (released / pending / etc.)
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

// Visual mapping for the derived status badge.
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

const ALLOWED_TABS = ["withdrawals", "history", "settings"];

const SellerEarnings = () => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);

  // Phase 6 / Step 12 PART A — controlled tab + deep-link to a specific
  // withdrawal row via ?tab=withdrawals&id=<withdrawalId>. Notification
  // actionUrls and email CTAs use this format so a click lands the user
  // directly on the relevant row.
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const tabParam = queryParams.get("tab") || "";
  // Derive activeTab directly from the URL — no useState mirror. This avoids
  // a setState-in-effect cascade and keeps back/forward + external deep-links
  // perfectly in sync without an extra render cycle.
  const activeTab = useMemo(
    () => (ALLOWED_TABS.includes(tabParam) ? tabParam : "withdrawals"),
    [tabParam]
  );
  const highlightWithdrawalId = queryParams.get("id") || null;
  const highlightedRowRef = useRef(null);

  const { data: balance } = useQuery({
    queryKey: ["seller-balance"],
    queryFn: () => sellerAPI.getPayoutBalance().then((res) => res.data.data),
    refetchInterval: 30000,
  });

  const { data: payoutSettings } = useQuery({
    queryKey: ["public-payout-settings"],
    queryFn: () => sellerAPI.getPublicPayoutSettings().then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const holdDays =
    typeof payoutSettings?.payoutHoldDays === "number" ? payoutSettings.payoutHoldDays : 15;
  const minWithdrawal =
    typeof payoutSettings?.minimumWithdrawalUsd === "number"
      ? payoutSettings.minimumWithdrawalUsd
      : 50;

  const { isLoading } = useQuery({
    queryKey: ["seller-payouts"],
    queryFn: () => sellerAPI.getMyPayouts({ page: 1, limit: 10 }).then((res) => res.data.data),
  });

  const { data: withdrawalHistory } = useQuery({
    queryKey: ["withdrawal-history"],
    queryFn: () => sellerAPI.getMyPayouts({ page: 1, limit: 100 }).then((res) => res.data.data),
    retry: false,
  });

  // Phase 5: own withdrawal request lifecycle.
  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["seller-withdrawals"],
    queryFn: () => sellerAPI.listMyWithdrawals({ page: 1, limit: 50 }).then((res) => res.data.data),
    retry: false,
    refetchInterval: 30000,
  });
  const withdrawals = useMemo(
    () => withdrawalsData?.rows || [],
    [withdrawalsData]
  );

  // Phase 5: fetch connected payout accounts for the request modal.
  const { data: payoutAccountData } = useQuery({
    queryKey: ["payout-account"],
    queryFn: () => sellerAPI.getMyPayoutAccount().then((res) => res.data.data),
    staleTime: 30000,
  });
  const accounts = useMemo(() => payoutAccountData?.accounts || [], [payoutAccountData]);

  const { data: payoutReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["payout-reports"],
    queryFn: () => sellerAPI.getPayoutReports().then((res) => res.data.data),
    retry: false,
  });

  // Real-time refresh on withdrawal lifecycle events.
  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["seller-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["seller-balance"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawal-history"] });
    };
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

  // Step 12 PART A — `activeTab` is now derived from the URL via useMemo
  // above, so the URL is the single source of truth. handleTabChange only
  // needs to push the new ?tab to history; the derived value updates
  // automatically on the next render.
  const handleTabChange = (next) => {
    const params = new URLSearchParams(location.search);
    if (next && next !== "withdrawals") {
      params.set("tab", next);
    } else {
      params.delete("tab");
    }
    // Drop ?id when leaving the withdrawals tab — it's only meaningful
    // alongside ?tab=withdrawals.
    if (next !== "withdrawals") params.delete("id");
    const search = params.toString();
    navigate(
      `${location.pathname}${search ? `?${search}` : ""}`,
      { replace: true }
    );
  };

  // Step 12 PART A — scroll/highlight a specific withdrawal row when the
  // user lands here via a notification deep-link. Runs after the data is in
  // (so the row exists in the DOM) and again whenever the highlighted id
  // changes.
  useEffect(() => {
    if (!highlightWithdrawalId || activeTab !== "withdrawals") return;
    if (!withdrawals.some((w) => String(w._id) === String(highlightWithdrawalId))) return;
    // Defer one frame so the row has been painted before we scroll.
    const t = setTimeout(() => {
      try {
        highlightedRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {
        /* noop */
      }
    }, 0);
    return () => clearTimeout(t);
  }, [highlightWithdrawalId, activeTab, withdrawals]);

  if (isLoading || reportsLoading) {
    return <Loading message="Loading earnings data..." />;
  }

  const availableBalance = Number(balance?.available || 0);
  const canWithdraw = availableBalance >= minWithdrawal && accounts.some((a) => a.status === "verified");

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Earnings & Payouts</h1>
          <p className="text-gray-400 mt-1">View your earnings and request withdrawals</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            type="button"
            disabled={!canWithdraw}
            onClick={() => setWithdrawalModalOpen(true)}
            className="bg-accent text-white"
          >
            <ArrowUpRight className="w-4 h-4 mr-1" />
            Request withdrawal
          </Button>
          {!canWithdraw && (
            <p className="text-[11px] text-gray-500">
              {accounts.length === 0
                ? "Connect a payout method first."
                : !accounts.some((a) => a.status === "verified")
                  ? "Verify a payout method to enable."
                  : `Minimum withdrawal is ${formatUsd(minWithdrawal)}.`}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Pending (Held)</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatUsd(balance?.pending?.amount)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Sales in last {holdDays} day{holdDays === 1 ? "" : "s"}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Frozen</CardTitle>
            <AlertCircle className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatUsd(balance?.frozen?.amount)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {balance?.frozen?.count || 0} line(s) paused by refund requests
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatUsd(availableBalance)}</div>
            <p className="text-xs text-gray-400 mt-1">Open withdrawals already deducted</p>
          </CardContent>
        </Card>
        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Paid Out</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatUsd(balance?.released?.amount)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Lifetime sent to your accounts</p>
          </CardContent>
        </Card>
        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">In-flight</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatUsd(balance?.inFlight?.amount)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {balance?.inFlight?.count || 0} withdrawal(s) being processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hold Period Information */}
      {balance?.pending?.amount > 0 && balance?.pending?.daysUntilAvailable > 0 && (
        <Card className="bg-primary border-gray-700 border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Earnings on Hold</h3>
                <p className="text-gray-300 text-sm">
                  You have <span className="font-semibold text-yellow-400">{formatUsd(balance.pending.amount)}</span> on hold.
                  Your payout will be available <span className="font-semibold">{balance.pending.daysUntilAvailable} day{balance.pending.daysUntilAvailable > 1 ? "s" : ""}</span> after order completion ({holdDays}-day hold period).
                  {balance.pending.earliestReleaseDate && (
                    <span className="block mt-1 text-xs text-gray-400">
                      Earliest release date: {new Date(balance.pending.earliestReleaseDate).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 && (
        <Card className="bg-primary border-gray-700 border-l-4 border-l-blue-500">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-white font-semibold mb-1">No payout method connected</h3>
              <p className="text-gray-300 text-sm">
                Connect your PayPal payout account before
                requesting a withdrawal.
                <Link to="/seller/payout-account" className="text-blue-400 hover:underline ml-1">
                  Manage payout methods
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-primary border-gray-700">
          <TabsTrigger value="withdrawals" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals">
          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Your withdrawal requests</CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Each request is reviewed by an admin and then queued for automatic processing within 1-2 hours.
              </p>
            </CardHeader>
            <CardContent>
              {withdrawalsLoading ? (
                <Loading message="Loading withdrawals..." size="sm" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300 text-xs">Method</th>
                        <th className="text-left py-3 px-4 text-gray-300 text-xs">Requested</th>
                        <th className="text-left py-3 px-4 text-gray-300 text-xs">Fee</th>
                        <th className="text-left py-3 px-4 text-gray-300 text-xs">Net</th>
                        <th className="text-left py-3 px-4 text-gray-300 text-xs">Status</th>
                        <th className="text-left py-3 px-4 text-gray-300 text-xs">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-gray-400 text-sm">
                            No withdrawal requests yet. Request your first withdrawal above when you're ready.
                          </td>
                        </tr>
                      ) : (
                        withdrawals.map((w) => {
                          const isHighlighted =
                            highlightWithdrawalId && String(w._id) === String(highlightWithdrawalId);
                          return (
                          <tr
                            key={w._id}
                            ref={isHighlighted ? highlightedRowRef : undefined}
                            className={`border-b border-gray-800 ${
                              isHighlighted ? "bg-accent/10 ring-1 ring-accent/40" : ""
                            }`}
                          >
                            <td className="py-3 px-4 text-gray-200 text-sm">{METHOD_LABEL[w.methodType] || w.methodType}</td>
                            <td className="py-3 px-4 text-white text-sm">{formatUsd(w.requestedAmount)}</td>
                            <td className="py-3 px-4 text-gray-300 text-sm">
                              {formatUsd(w.providerFee)}
                              {w.fallbackUsed && (
                                <Badge variant="warning" className="ml-2 text-[10px]">fallback</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-green-400 text-sm font-medium">{formatUsd(w.netAmount)}</td>
                            <td className="py-3 px-4">
                              <Badge variant={WITHDRAWAL_STATUS_VARIANT[w.status] || "default"}>
                                {WITHDRAWAL_STATUS_LABEL[w.status] || w.status}
                              </Badge>
                              {w.status === "rejected" && w.rejectionReason && (
                                <p className="text-[11px] text-red-300 mt-1 max-w-xs">{w.rejectionReason}</p>
                              )}
                              {w.status === "failed" && w.failureReason && (
                                <p className="text-[11px] text-red-300 mt-1 max-w-xs">{w.failureReason}</p>
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-sm">
                              {new Date(w.createdAt).toLocaleString()}
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Earning lines</CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Per-order earnings, including their hold and release status.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Total</th>
                      <th className="text-left py-3 px-4 text-gray-300">Available</th>
                      <th className="text-left py-3 px-4 text-gray-300">Frozen / Refunded</th>
                      <th className="text-left py-3 px-4 text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300">Date</th>
                      <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(withdrawalHistory?.payouts?.length > 0 ? withdrawalHistory.payouts : withdrawalHistory?.docs || []).map((payout) => {
                      const split = splitPayoutRow(payout);
                      const statusMeta =
                        ROW_STATUS_META[split.derivedStatus] || {
                          label: split.derivedStatus,
                          variant: "default",
                        };
                      // The 'frozen' state has its own colour palette
                      // (orange) that doesn't map cleanly to the existing
                      // badge variants, so we apply it as classes.
                      const isFrozenRow = split.derivedStatus === "frozen";
                      const isPartialRow = split.derivedStatus === "partial";

                      return (
                        <tr key={payout._id} className="border-b border-gray-800">
                          <td className="py-3 px-4 text-white">
                            <div className="font-semibold">{formatUsd(split.total)}</div>
                            {split.totalKeys > 0 && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {split.totalKeys} key{split.totalKeys === 1 ? "" : "s"}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={
                                split.available > 0
                                  ? "text-green-400 font-semibold"
                                  : "text-gray-500 font-semibold"
                              }
                            >
                              {formatUsd(split.available)}
                            </span>
                            {split.totalKeys > 0 && split.availableKeys < split.totalKeys && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {split.availableKeys} of {split.totalKeys} key
                                {split.totalKeys === 1 ? "" : "s"}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {split.hasFrozen || split.hasRefunded ? (
                              <div className="space-y-1">
                                {split.hasFrozen && (
                                  <div>
                                    <span className="inline-flex items-center gap-1 text-orange-400 font-semibold">
                                      <Snowflake className="w-3.5 h-3.5" />
                                      {formatUsd(split.frozen)}
                                      <span className="text-[10px] uppercase tracking-wide text-orange-300/80 ml-1">
                                        Frozen
                                      </span>
                                    </span>
                                    {split.frozenKeys > 0 && (
                                      <div className="text-xs text-gray-500 mt-0.5 ml-5">
                                        {split.frozenKeys} of {split.totalKeys} key
                                        {split.totalKeys === 1 ? "" : "s"}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {split.hasRefunded && (
                                  <div>
                                    <span className="inline-flex items-center gap-1 text-red-400 font-semibold">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      {formatUsd(split.refunded)}
                                      <span className="text-[10px] uppercase tracking-wide text-red-300/80 ml-1">
                                        Refunded
                                      </span>
                                    </span>
                                    {split.refundedKeys > 0 && (
                                      <div className="text-xs text-gray-500 mt-0.5 ml-5">
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
                          </td>
                          <td className="py-3 px-4">
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
                          </td>
                          <td className="py-3 px-4 text-gray-400">{new Date(payout.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="border-gray-700 text-gray-300"
                            >
                              <Link to={`/seller/earnings/${payout._id}`}>
                                <Eye className="w-3 h-3 mr-1" />
                                Details
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {((withdrawalHistory?.payouts?.length || 0) === 0 && (withdrawalHistory?.docs?.length || 0) === 0) && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-400">
                          No earning lines yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            {payoutReports && (
              <Card className="bg-primary border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Payout Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {payoutReports.summary && (
                      <div className="p-4 bg-secondary rounded-lg border border-gray-700">
                        <h4 className="text-white font-semibold mb-3">Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400 block mb-1">Total Payouts</span>
                            <span className="text-white font-semibold">{formatUsd(payoutReports.summary.totalAmount)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-1">Total Count</span>
                            <span className="text-white font-semibold">{payoutReports.summary.totalPayouts || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-1">Total Commission</span>
                            <span className="text-white font-semibold">{formatUsd(payoutReports.summary.totalCommission)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-1">Period</span>
                            <span className="text-white font-semibold text-xs">
                              {payoutReports.period?.startDate
                                ? `${new Date(payoutReports.period.startDate).toLocaleDateString()} - ${new Date(payoutReports.period.endDate).toLocaleDateString()}`
                                : "All time"}
                            </span>
                          </div>
                        </div>
                        {payoutReports.summary.byStatus && Object.keys(payoutReports.summary.byStatus).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <h5 className="text-gray-300 text-sm mb-2">By Status</h5>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(payoutReports.summary.byStatus).map(([status, count]) => (
                                <Badge
                                  key={status}
                                  variant={status === "released" ? "success" : status === "pending" || status === "available" || status === "processing" ? "warning" : "default"}
                                >
                                  {status}: {count}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {payoutReports.payouts && payoutReports.payouts.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-white font-semibold">Recent Payouts</h4>
                        {payoutReports.payouts.slice(0, 10).map((payout) => (
                          <div key={payout.id} className="p-3 bg-secondary rounded-lg border border-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-gray-400 text-xs">Payout ID:</span>
                                  <span className="text-white text-xs font-mono">{payout.id?.toString().slice(-8)}</span>
                                </div>
                                {payout.orderId && (
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-gray-400 text-xs">Order ID:</span>
                                    <span className="text-white text-xs font-mono">
                                      {payout.orderNumber || payout.orderId?.toString().slice(-8)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-white font-semibold">{formatUsd(payout.amount)}</div>
                                <Badge
                                  variant={payout.status === "released" ? "success" : payout.status === "pending" || payout.status === "available" || payout.status === "processing" ? "warning" : "default"}
                                  className="text-xs"
                                >
                                  {payout.status}
                                </Badge>
                              </div>
                            </div>
                            {payout.commission && (
                              <div className="mt-2 text-xs text-gray-400">
                                Commission: {formatUsd(payout.commission)}
                              </div>
                            )}
                            {payout.createdAt && (
                              <div className="mt-1 text-xs text-gray-500">
                                {new Date(payout.createdAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">No payout reports available</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <WithdrawalRequestModal
        open={withdrawalModalOpen}
        onOpenChange={setWithdrawalModalOpen}
        balance={balance}
        accounts={accounts}
      />
    </div>
  );
};

export default SellerEarnings;
