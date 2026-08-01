import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { sellerAPI } from "@services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Skeleton } from "@components/ui/skeleton";
import { ErrorState } from "@components/common/ErrorState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import SafeImage from "@components/ui/safe-image";
import { payoutBadgeProps, getRefundStatusDisplay } from "@features/wallet-payout";
import {
  ArrowLeft,
  ExternalLink,
  Package,
  KeyRound,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Snowflake,
  Clock,
  Calendar,
  DollarSign,
  Hash,
} from "lucide-react";
import { showApiError } from "@utils/toast";
import { formatUSD } from '@lib/money';

// =============================================================================
// Seller payout detail page (full route at /seller/earnings/:payoutId).
//
// Replaces the previous "Details" popup on the Earnings page. Surfaces every
// piece of information a seller needs to understand why a payout line is in
// its current state — including a frozen-by-refund block with payment pause
// date and expected release date.
// =============================================================================


const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
};

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

// SECURITY: never render a raw license-key id. The backend already masks
// keys via maskLicenseKeyForPayout() and ships `displayKey`. If for any
// reason a row arrives without `displayKey`, hide the value rather than
// fall back to the internal id.
const safeDisplayKey = (key) => {
  const v = typeof key?.displayKey === "string" ? key.displayKey.trim() : "";
  if (!v) return "•••• hidden";
  // Defense in depth: a 24-char hex blob looks like an ObjectId — if the
  // backend regresses and ships one, redact it client-side.
  if (/^[a-f0-9]{24}$/i.test(v)) return "•••• hidden";
  return v;
};

// Build per-key rows for the seller-facing detail view.
//
// PER-KEY FORMULA (matches the admin variant — single source of truth so
// the same numbers show on both views):
//   perKeyGross = originalGrossAmount / originalLicenseKeyCount
//   perKeyNet   = originalNetAmount   / originalLicenseKeyCount
//
// We rely on the sale-time originals (snapshotted in payout.metadata by
// the backend's adjustPayoutForRefund). Falling back to the live
// `netAmount` produces the wrong per-key figure after a partial refund.
//
// Amount column always shows the ORIGINAL per-key net regardless of
// status; status-specific rendering (strikethrough + greyed text on
// refunded rows) communicates ownership. The seller's actual withdrawable
// total stays visible in the Available summary card above the table.
const buildKeyRows = (payout) => {
  const keys = Array.isArray(payout?.licenseKeys) ? payout.licenseKeys : [];
  const frozenIds = new Set((payout?.frozenKeyIds || []).map(String));
  const totalKeys =
    typeof payout?.originalLicenseKeyCount === "number" && payout.originalLicenseKeyCount > 0
      ? payout.originalLicenseKeyCount
      : keys.length;
  const originalNet =
    typeof payout?.originalNetAmount === "number"
      ? payout.originalNetAmount
      : Number(payout?.netAmount || 0);
  const perKeyNet = totalKeys > 0 ? round2(originalNet / totalKeys) : 0;
  const refundAmount = Number(payout?.refund?.refundAmount || 0);

  let frozenCount = 0;
  let refundedCount = 0;

  const rows = keys.map((key) => {
    const id = String(key.keyId || "");
    const isRefunded = !!key.isRefunded;
    const isFrozen = !isRefunded && id && frozenIds.has(id);
    if (isRefunded) refundedCount += 1;
    if (isFrozen) frozenCount += 1;

    let status = "available";
    let note = "Ready to withdraw";
    if (isRefunded) {
      status = "refunded";
      // Seller-facing wording: emphasise that this key's value went back
      // to the buyer, not that the seller "owes" anything.
      note = `Refund completed — $${perKeyNet.toFixed(2)} returned to buyer`;
    } else if (isFrozen) {
      status = "frozen";
      note = refundAmount
        ? `Frozen — refund of $${refundAmount.toFixed(2)} under review`
        : "Frozen — refund under review";
    }

    return {
      keyId: id || `idx-${Math.random()}`,
      displayKey: safeDisplayKey(key),
      assignedAt: key.assignedAt || null,
      refundedAt: key.refundedAt || null,
      amount: perKeyNet,
      status,
      note,
    };
  });

  return {
    rows,
    totalKeys,
    frozenCount,
    refundedCount,
    availableCount: totalKeys - frozenCount - refundedCount,
    perKeyNet,
    // Sale-time net for every key currently in the "refunded" bucket.
    // `payout.frozenAmount` is the live (still-withheld) frozen total;
    // there is NO `payout.refundedAmount` field because once a refund
    // completes the freeze is released back to zero. We derive the
    // refunded total from the snapshot so the seller sees how much was
    // permanently returned to the buyer (vs. how much is still held).
    refundedAmount: round2(perKeyNet * refundedCount),
  };
};

const PayoutDetail = () => {
  const { payoutId } = useParams();
  const navigate = useNavigate();

  const {
    data: payout,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["payout-details", payoutId],
    queryFn: () => sellerAPI.getPayoutDetails(payoutId).then((res) => res.data.data),
    enabled: !!payoutId,
    retry: 1,
  });

  useEffect(() => {
    if (isError) {
      showApiError(error, "Failed to load payout details");
    }
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Button
          onClick={() => navigate("/seller/earnings?tab=history")}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Earnings
        </Button>
        <Card variant="hud">
          <CardContent>
            <ErrorState error={error} title="Couldn't load this payout" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="space-y-6">
        <Button
          onClick={() => navigate("/seller/earnings?tab=history")}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Earnings
        </Button>
        <Card variant="hud">
          <CardContent className="py-10 text-center text-fg-muted">
            Payout not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusBadge = payoutBadgeProps(payout.status);
  const orderNumber =
    payout.orderId?.orderNumber ||
    (payout.orderId?._id || payout.orderId || "").toString().slice(-8).toUpperCase();
  const orderIdString = payout.orderId?._id || payout.orderId || null;
  const orderDate = payout.orderId?.createdAt || payout.createdAt;

  const refund = payout.refund;
  const refundBadge = refund?.status ? getRefundStatusDisplay(refund.status) : null;
  const isFrozen = payout.status === "frozen" || Number(payout.frozenAmount || 0) > 0;
  const keyBreakdown = buildKeyRows(payout);
  const frozenAmount = round2(payout.frozenAmount);
  const availableAmount = round2(
    typeof payout.availableAmount === "number"
      ? payout.availableAmount
      : Math.max(0, Number(payout.netAmount || 0) - Number(payout.frozenAmount || 0))
  );
  const hasDisputeOnSomeKeys =
    keyBreakdown.frozenCount > 0 && keyBreakdown.frozenCount < keyBreakdown.totalKeys;

  // Inline-metrics state. Each is independent because a line can be
  // frozen (some keys under refund review), refunded (some keys returned
  // to buyer), or both at the same time, and the seller needs to see
  // each $-figure separately.
  //
  // NOTE: `refundedAmount` is derived in buildKeyRows() rather than read
  // from `payout.refundedAmount` — the backend has no such field because
  // adjustPayoutForRefund releases the freeze to zero on refund
  // completion. Derived value = perKeyNet * refundedCount.
  const refundedAmount = keyBreakdown.refundedAmount;
  const isRefunded = refundedAmount > 0;
  // Available is redundant with Net on a fully-healthy line (everything
  // is available), so only show it when something is being withheld or
  // has been clawed back. Guarding on `availableAmount > 0` alone would
  // surface the column on every line and add visual noise.
  const showAvailable = (isFrozen || isRefunded) && availableAmount > 0;
  const inlineCellCount =
    4 + (isFrozen ? 1 : 0) + (isRefunded ? 1 : 0) + (showAvailable ? 1 : 0);
  // Tailwind JIT needs literal class names — keep them static.
  const inlineGridCols =
    {
      4: "sm:grid-cols-4",
      5: "sm:grid-cols-5",
      6: "sm:grid-cols-6",
      7: "sm:grid-cols-3 lg:grid-cols-7",
    }[inlineCellCount] || "sm:grid-cols-4";
  // Sale-time originals — drive the Gross / Commission / Net inline metrics
  // inside the line block so commission doesn't appear to drop after a
  // partial refund. The backend snapshots these into payout.metadata in
  // adjustPayoutForRefund; resolveOriginals() (in payout.controller.js)
  // restores them in the API response.
  //
  // The top "Net to You" KPI and the Available summary card intentionally
  // use the LIVE netAmount/availableAmount — they communicate what the
  // seller can actually withdraw right now, which is what they care about
  // most. The line block's inline "Net" gives the sale-time context.
  const originalGross =
    typeof payout.originalGrossAmount === "number"
      ? payout.originalGrossAmount
      : Number(payout.grossAmount || 0);
  const originalCommission =
    typeof payout.originalCommissionAmount === "number"
      ? payout.originalCommissionAmount
      : Number(payout.commissionAmount || 0);
  const originalNet =
    typeof payout.originalNetAmount === "number"
      ? payout.originalNetAmount
      : Number(payout.netAmount || 0);

  return (
    <div className="space-y-6">
      {/* Header — same shape as AdminPayoutDetail (back button + title + side action) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/seller/earnings?tab=history")}
            variant="outline"
            size="sm"
            className="border-border"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Earnings
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-fg">Payout Detail</h1>
            <p className="text-fg-muted text-sm mt-1">
              Order #{orderNumber}
            </p>
          </div>
        </div>
        {orderIdString && (
          <Link to={`/seller/orders/${orderIdString}`}>
            <Button variant="outline" size="sm" className="border-border text-fg-muted">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View full order
            </Button>
          </Link>
        )}
      </div>

      {/* 4-card KPI strip — mirrors admin (Order Date / Order # / Net to you / Hold Until).
          NOTE: admin shows Buyer + Order Total + Platform Commission here. Those are
          intentionally NOT shown to sellers — buyer PII and admin-side financials are
          out of scope for the seller view. */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card variant="hud">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-fg-muted text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" /> Order Date
            </div>
            <p className="text-fg">{formatDateTime(orderDate)}</p>
          </CardContent>
        </Card>
        <Card variant="hud">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-fg-muted text-xs mb-1">
              <Hash className="w-3.5 h-3.5" /> Order Number
            </div>
            <p className="text-fg font-mono">#{orderNumber}</p>
          </CardContent>
        </Card>
        <Card variant="hud">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-fg-muted text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5" /> Net to You
            </div>
            <p className="text-success text-lg font-semibold">
              {formatUSD(payout.netAmount)}
            </p>
          </CardContent>
        </Card>
        <Card variant="hud">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-fg-muted text-xs mb-1">
              <Clock className="w-3.5 h-3.5" /> Hold Until
            </div>
            <p className="text-fg">{formatDate(payout.holdUntil)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Frozen-by-refund timeline: when a refund pauses this payout line, show
          when the payment was paused and when funds are expected to release. */}
      {isFrozen && (
        <Card variant="hud" className="border-info/35">
          <CardContent className="pt-5 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-fg-muted text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" /> Payment Pause Date
                </div>
                <p className="text-fg">
                  {formatDate(payout.frozenAt || refund?.createdAt || payout.updatedAt)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-fg-muted text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Expected Release Date
                </div>
                <p className="text-fg">{formatDate(payout.holdUntil)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single line-block — same shape as the admin's per-line block.
          The admin page renders one of these per (seller, line); sellers see
          exactly one because the route is scoped to their own payoutId. */}
      <Card variant="hud">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Payout Line
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`rounded-lg border p-4 space-y-4 ${
              isFrozen
                ? "bg-info-soft border-info/35"
                : "bg-secondary border-border"
            }`}
          >
            {/* Product header + status badge */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-3">
                {payout.product?.image && (
                  <SafeImage
                    src={payout.product.image}
                    alt={payout.product.name}
                    className="w-14 h-14 rounded-md object-cover border border-border"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-fg-muted" />
                    <span className="text-fg font-semibold">
                      {payout.product?.name || "Unknown product"}
                    </span>
                  </div>
                  {payout.product?.productType && (
                    <p className="text-xs text-fg-muted mt-0.5 ml-6">
                      {payout.product.productType}
                    </p>
                  )}
                </div>
              </div>
              <Badge {...statusBadge} />
            </div>

            {/* Inline metrics row — Gross/Commission/Net use sale-time
                originals so commission doesn't appear to drop after a
                partial refund. Frozen / Refunded / Available remain
                live (what the seller can actually act on right now).
                Mirrors AdminPayoutDetail for visual consistency. */}
            <div className={`grid grid-cols-2 ${inlineGridCols} gap-3 text-sm`}>
              <div>
                <p className="text-fg-muted">Gross</p>
                <p className="text-fg">{formatUSD(originalGross)}</p>
              </div>
              <div>
                <p className="text-fg-muted">Commission</p>
                <p className="text-fg">{formatUSD(originalCommission)}</p>
              </div>
              <div>
                <p className="text-fg-muted">Net</p>
                <p className="text-success font-semibold">{formatUSD(originalNet)}</p>
              </div>

              {/* Frozen — currently withheld pending refund review. */}
              {isFrozen && (
                <div>
                  <p className="text-fg-muted">Frozen</p>
                  <p className="text-info font-semibold">
                    {formatUSD(frozenAmount)}
                  </p>
                </div>
              )}

              {/* Refunded — permanently returned to buyer. Strikethrough
                  to make it obvious to the seller the amount is no
                  longer payable to them. */}
              {isRefunded && (
                <div>
                  <p className="text-fg-muted">Refunded</p>
                  <p className="text-danger font-semibold line-through">
                    {formatUSD(refundedAmount)}
                  </p>
                </div>
              )}

              {/* Available — what the seller can still withdraw. Only
                  shown when it diverges from Net (i.e. something is held
                  or refunded); otherwise it duplicates Net. */}
              {showAvailable && (
                <div>
                  <p className="text-fg-muted">Available</p>
                  <p className="text-success font-semibold">
                    {formatUSD(availableAmount)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-fg-muted">Hold Until</p>
                <p className="text-fg">{formatDate(payout.holdUntil)}</p>
              </div>
            </div>

            {/* Frozen banner (cyan) — identical structure to admin, but
                without admin-only "Destination" line. */}
            {isFrozen && (
              <div className="rounded-md bg-info-soft border border-info/35 p-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-info mt-0.5 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="text-fg font-medium mb-1">
                    {payout.status === "frozen"
                      ? "Fully frozen by refund request"
                      : `Partially frozen: ${formatUSD(frozenAmount)} of ${formatUSD(payout.netAmount)}`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-fg-muted">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-fg-muted" />
                      <span>Pause date: {formatDateTime(payout.paymentPauseDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-fg-muted" />
                      <span>Expected release: {formatDateTime(payout.expectedReleaseDate)}</span>
                    </div>
                    {refundBadge && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-fg-muted">Refund:</span>
                        <Badge variant={refundBadge.variant} className="text-xs">
                          {refundBadge.label}
                        </Badge>
                        <span className="text-fg-muted">{formatUSD(refund?.refundAmount)}</span>
                      </div>
                    )}
                    {/* SECURITY: refund destination / method intentionally
                        omitted — those reveal buyer-side payment context. */}
                  </div>
                </div>
              </div>
            )}

            {/* Open refund (non-frozen edge case) — admin parity */}
            {!isFrozen && refund && (
              <div className="rounded-md bg-warning-soft border border-warning/35 p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-fg-muted">Open refund:</span>
                  {refundBadge ? (
                    <Badge variant={refundBadge.variant} className="text-xs">
                      {refundBadge.label}
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-xs">{refund.status}</Badge>
                  )}
                  <span className="text-fg">{formatUSD(refund.refundAmount)}</span>
                </div>
              </div>
            )}

            {/* Dispute banner (amber) — partial-freeze case */}
            {hasDisputeOnSomeKeys && (
              <div className="rounded-md bg-warning-soft border border-warning/35 p-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="text-warning font-semibold">
                    {keyBreakdown.frozenCount} of {keyBreakdown.totalKeys} license keys{" "}
                    {keyBreakdown.frozenCount === 1 ? "has" : "have"} an active dispute.
                  </p>
                  <p className="text-warning mt-0.5">
                    {formatUSD(frozenAmount)} is frozen pending resolution.
                    {refund?.refundAmount ? ` Refund requested: ${formatUSD(refund.refundAmount)}.` : ""}
                  </p>
                </div>
              </div>
            )}

            {/*
              Summary cards. Always render Available; render Frozen only
              when a key on this line is currently in the frozen_disputed
              state; render Refunded only when a key has completed refund.
              "Frozen" and "Refunded" are distinct outcomes and need
              separate cards — the old 2-card layout collapsed them into
              a single "Frozen $0.00" card after a refund completed (the
              freeze gets released back to zero at completion time),
              hiding the refunded amount entirely. Mirrors admin.
            */}
            {keyBreakdown.totalKeys > 0 && (() => {
              const hasFrozen = keyBreakdown.frozenCount > 0;
              const hasRefunded = keyBreakdown.refundedCount > 0;
              const visibleCards = 1 + (hasFrozen ? 1 : 0) + (hasRefunded ? 1 : 0);
              const gridCols =
                visibleCards === 3
                  ? "grid-cols-1 sm:grid-cols-3"
                  : visibleCards === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1";
              return (
                <div className={`grid ${gridCols} gap-3`}>
                  <div className="rounded-md border border-success/35 bg-success-soft p-3">
                    <div className="flex items-center gap-2 text-success text-xs uppercase tracking-wide">
                      <CheckCircle2 className="w-4 h-4" /> Available
                    </div>
                    <p className="text-2xl font-semibold text-success mt-1">
                      {formatUSD(availableAmount)}
                    </p>
                    <p className="text-xs text-fg-muted mt-1">
                      {keyBreakdown.availableCount} of {keyBreakdown.totalKeys} key
                      {keyBreakdown.totalKeys === 1 ? "" : "s"} ready to withdraw
                    </p>
                  </div>

                  {hasFrozen && (
                    <div className="rounded-md border border-info/35 bg-info-soft p-3">
                      <div className="flex items-center gap-2 text-info text-xs uppercase tracking-wide">
                        <Snowflake className="w-4 h-4" /> Frozen
                      </div>
                      <p className="text-2xl font-semibold text-info mt-1">
                        {formatUSD(frozenAmount)}
                      </p>
                      <p className="text-xs text-fg-muted mt-1">
                        {keyBreakdown.frozenCount} of {keyBreakdown.totalKeys} key
                        {keyBreakdown.frozenCount === 1 ? "" : "s"} under review
                      </p>
                    </div>
                  )}

                  {hasRefunded && (
                    <div className="rounded-md border border-danger/35 bg-danger-soft p-3">
                      <div className="flex items-center gap-2 text-danger text-xs uppercase tracking-wide">
                        <AlertCircle className="w-4 h-4" /> Refunded
                      </div>
                      <p className="text-2xl font-semibold text-danger mt-1">
                        {formatUSD(keyBreakdown.refundedAmount)}
                      </p>
                      <p className="text-xs text-fg-muted mt-1">
                        {keyBreakdown.refundedCount} of {keyBreakdown.totalKeys} key
                        {keyBreakdown.refundedCount === 1 ? "" : "s"} refunded to buyer
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Per-key table */}
            {keyBreakdown.totalKeys > 0 && (
              <div>
                <p className="text-xs text-fg-muted mb-2 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> License Keys
                  <span className="text-fg-subtle">
                    ({keyBreakdown.totalKeys} total · {keyBreakdown.availableCount} available · {keyBreakdown.frozenCount} frozen
                    {keyBreakdown.refundedCount > 0 ? ` · ${keyBreakdown.refundedCount} refunded` : ""})
                  </span>
                </p>
                <div className="overflow-x-auto rounded-md border border-brand-cyan/12">
                  <Table variant="hud">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-fg-muted">Key</TableHead>
                        <TableHead className="text-fg-muted">Amount</TableHead>
                        <TableHead className="text-fg-muted">Status</TableHead>
                        <TableHead className="text-fg-muted">Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keyBreakdown.rows.map((row) => (
                        <TableRow key={row.keyId}>
                          <TableCell className="font-mono text-xs text-fg">{row.displayKey}</TableCell>
                          <TableCell
                            className={
                              row.status === "refunded"
                                ? "font-semibold line-through text-fg-subtle"
                                : "text-fg font-semibold"
                            }
                            title={
                              row.status === "refunded"
                                ? "Returned to buyer — no longer payable to you"
                                : undefined
                            }
                          >
                            {formatUSD(row.amount)}
                          </TableCell>
                          <TableCell>
                            {row.status === "available" && (
                              <Badge variant="success" className="flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> Available
                              </Badge>
                            )}
                            {row.status === "frozen" && (
                              <Badge variant="warning" className="flex items-center gap-1 w-fit bg-danger-soft border-danger/35 text-danger">
                                <Snowflake className="w-3 h-3" /> Frozen
                              </Badge>
                            )}
                            {row.status === "refunded" && (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <AlertCircle className="w-3 h-3" /> Refunded
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell
                            className={`text-sm ${
                              row.status === "available"
                                ? "text-fg-muted"
                                : row.status === "frozen"
                                  ? "text-warning"
                                  : "text-danger"
                            }`}
                          >
                            {row.note}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Footer meta — payout request reason (operator-controlled but
                already shown elsewhere; safe to display). */}
            {payout.requestReason && (
              <div className="pt-3 border-t border-brand-cyan/10 text-sm">
                <p className="text-fg-muted mb-1">Reason</p>
                <p className="text-fg">{payout.requestReason}</p>
              </div>
            )}
            {/* SECURITY: admin-only fields (failureReason, blockReason, notes,
                processedBy, paypalBatchId, metadata, retry*)
                are NOT rendered on the seller view, and the backend no longer
                ships them in this payload. */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutDetail;
