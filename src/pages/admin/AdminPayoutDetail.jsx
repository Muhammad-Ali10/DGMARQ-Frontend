import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { adminAPI } from "@services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Loading, ErrorMessage } from "@components/ui/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { payoutBadgeProps, getRefundStatusDisplay } from "@features/wallet-payout";
import SafeImage from "@components/ui/safe-image";
import {
  ArrowLeft,
  Package,
  KeyRound,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Snowflake,
  Clock,
  Calendar,
  DollarSign,
  Store,
  User,
  ExternalLink,
} from "lucide-react";
import { showApiError } from "@utils/toast";
import { formatUSD } from '@lib/money';


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

const PAYOUT_STATUS_VARIANT = {
  pending: "warning",
  available: "warning",
  frozen: "warning",
  released: "success",
  hold: "secondary",
  blocked: "destructive",
  failed: "destructive",
  processing: "warning",
};

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

// Build a per-key row for the inner detail table.
//
// PER-KEY FORMULA (matches the user-facing spec):
//   perKeyGross = originalGrossAmount / originalLicenseKeyCount
//   perKeyNet   = originalNetAmount   / originalLicenseKeyCount
//
// We use the SALE-TIME originals (snapshotted by the backend in
// payout.metadata before any refund mutation). Falling back to the live
// `netAmount` is wrong after a partial refund because the live value has
// already been reduced by `adjustPayoutForRefund`, which would cut every
// per-key amount roughly in half (the original bug).
//
// Per-key Amount column always shows the ORIGINAL per-key net (e.g. $80)
// regardless of status — it's the dollar value associated with that key
// at sale time, not the seller's current entitlement. Status-specific
// rendering communicates ownership:
//   - available → perKeyNet, normal text                (seller gets it)
//   - frozen    → perKeyNet, normal text                (seller's, but held)
//   - refunded  → perKeyNet, strikethrough + grey text  (reassigned to buyer)
//
// The seller's actual withdrawable total stays clearly visible in the
// Available summary card above the table.
const buildKeyRows = (line) => {
  const keys = Array.isArray(line?.licenseKeys) ? line.licenseKeys : [];
  const frozenIds = new Set((line?.frozenKeyIds || []).map(String));
  const totalKeys =
    typeof line?.originalLicenseKeyCount === "number" && line.originalLicenseKeyCount > 0
      ? line.originalLicenseKeyCount
      : keys.length;
  const originalNet =
    typeof line?.originalNetAmount === "number"
      ? line.originalNetAmount
      : Number(line?.netAmount || 0);
  const perKeyNet = totalKeys > 0 ? round2(originalNet / totalKeys) : 0;
  const refund = line?.refund || null;

  let frozenCount = 0;
  let refundedCount = 0;

  const rows = keys.map((key) => {
    const id = String(key.keyId);
    const isRefunded = !!key.isRefunded;
    const isFrozen = !isRefunded && frozenIds.has(id);
    if (isRefunded) refundedCount += 1;
    if (isFrozen) frozenCount += 1;

    let status = "available";
    let note = "Ready to withdraw";
    // Refunded rows keep the ORIGINAL per-key amount visible (with a
    // strikethrough at render time) so the admin can see the dollar value
    // that was reassigned from seller → buyer, rather than a confusing
    // bare "$0.00". The "seller actually gets" total is still preserved
    // in the Available summary card above the table.
    const amount = perKeyNet;
    if (isRefunded) {
      status = "refunded";
      note = `Refund completed — $${perKeyNet.toFixed(2)} returned to buyer`;
    } else if (isFrozen) {
      status = "frozen";
      note = refund?.refundAmount
        ? `Refund under admin review — $${Number(refund.refundAmount).toFixed(2)}`
        : "Refund under admin review";
    }

    return {
      keyId: id,
      displayKey: key.displayKey || id,
      amount,
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
    // Frozen amount stays on `line.frozenAmount` (the live, withheld
    // amount). Refunded amount lives only as a derived value here
    // because once a refund completes, the freeze is RELEASED back to
    // zero — there is no `line.refundedAmount` field carrying the
    // historical sum. Derive it per-key from the snapshot:
    //    refundedAmount = perKeyNet * refundedCount
    refundedAmount: round2(perKeyNet * refundedCount),
  };
};

const AdminPayoutDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const {
    data: detail,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-order-payout-details", orderId],
    queryFn: () => adminAPI.getOrderPayoutDetails(orderId).then((res) => res.data.data),
    enabled: !!orderId,
    retry: 1,
  });

  useEffect(() => {
    if (isError) showApiError(error, "Failed to load payout details");
  }, [isError, error]);

  if (isLoading) return <Loading message="Loading order payout details..." />;

  if (isError || !detail) {
    const message =
      error?.response?.data?.message || error?.message || "Error loading payout details";
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <Button onClick={() => navigate("/admin/payouts")} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Payouts
        </Button>
        <ErrorMessage message={message} />
      </div>
    );
  }

  const { order, sellers, totalPlatformCommission } = detail;
  const buyer = order?.buyer;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/admin/payouts")}
            variant="outline"
            size="sm"
            className="border-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payouts
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Order Payout Details
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Order #{order?.orderNumber || order?._id?.toString().slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
        <Link to={`/admin/orders/${order?._id}`}>
          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            View full order
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card variant="hud">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" /> Order Date
            </div>
            <p className="text-white">{formatDateTime(order?.createdAt)}</p>
          </CardContent>
        </Card>
        <Card variant="hud">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <User className="w-3.5 h-3.5" /> Buyer
            </div>
            <p className="text-white">{buyer?.name || "N/A"}</p>
            {buyer?.email && (
              <p className="text-gray-400 text-xs mt-0.5">{buyer.email}</p>
            )}
          </CardContent>
        </Card>
        <Card variant="hud">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5" /> Order Total
            </div>
            <p className="text-white text-lg font-semibold">
              {formatUSD(order?.grandTotal ?? order?.totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card variant="hud">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5" /> Platform Commission
            </div>
            <p className="text-green-400 text-lg font-semibold">
              {formatUSD(totalPlatformCommission)}
            </p>
          </CardContent>
        </Card>
      </div>

      {sellers?.length === 0 && (
        <Card variant="hud">
          <CardContent className="py-10 text-center text-gray-400">
            No payout lines found for this order.
          </CardContent>
        </Card>
      )}

      {sellers?.map((seller) => (
        <Card key={seller.sellerId} variant="hud">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              {seller.shopName}
            </CardTitle>
            <div className="text-sm text-gray-400 mt-1 flex flex-wrap gap-4">
              {seller.sellerName && <span>Owner: {seller.sellerName}</span>}
              {seller.sellerEmail && <span>{seller.sellerEmail}</span>}
              <span className="font-mono text-xs text-gray-500">ID: {seller.sellerId.slice(-8)}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {seller.lines.map((line) => {
              const statusBadge = payoutBadgeProps(line.status);
              const refund = line.refund;
              const refundBadge = refund?.status ? getRefundStatusDisplay(refund.status) : null;
              const keyBreakdown = buildKeyRows(line);
              const hasDisputeOnSomeKeys =
                keyBreakdown.frozenCount > 0 && keyBreakdown.frozenCount < keyBreakdown.totalKeys;
              const availableAmount =
                typeof line.availableAmount === "number"
                  ? line.availableAmount
                  : Math.max(0, Number(line.netAmount || 0) - Number(line.frozenAmount || 0));

              // Inline-metrics state. Each is independent because a line
              // can be frozen (some keys disputed), refunded (some keys
              // returned to buyer), or both at the same time, and the
              // operator needs to see each $-figure separately.
              //
              // NOTE: `refundedAmount` is derived in buildKeyRows() rather
              // than read from `line.refundedAmount` — the backend has no
              // such field because adjustPayoutForRefund releases the
              // freeze to zero on refund completion. The derived value is
              // perKeyNet * refundedCount.
              const isFrozen = line.status === "frozen" || (line.frozenAmount || 0) > 0;
              const refundedAmount = keyBreakdown.refundedAmount;
              const isRefunded = refundedAmount > 0;
              // Available is redundant with Net on a fully-healthy line
              // (everything is available), so only show it when something
              // is being withheld or has been clawed back. Guarding on
              // `availableAmount > 0` alone would surface the column on
              // every line and add visual noise.
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
              // Sale-time originals — these drive the Gross / Commission /
              // Net columns. After a refund the live values are reduced, so
              // displaying them would show the wrong commission ($20 instead
              // of $40 for the user's example). The backend snapshots the
              // sale-time totals in metadata; resolveOriginals() restores
              // them in the API response.
              const originalGross =
                typeof line.originalGrossAmount === "number"
                  ? line.originalGrossAmount
                  : Number(line.grossAmount || 0);
              const originalCommission =
                typeof line.originalCommissionAmount === "number"
                  ? line.originalCommissionAmount
                  : Number(line.commissionAmount || 0);
              const originalNet =
                typeof line.originalNetAmount === "number"
                  ? line.originalNetAmount
                  : Number(line.netAmount || 0);

              return (
                <div
                  key={line._id}
                  className={`rounded-lg border p-4 space-y-4 ${
                    isFrozen
                      ? "bg-cyan-950/20 border-cyan-700/40"
                      : "bg-secondary border-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      {line.product?.image && (
                        <SafeImage
                          src={line.product.image}
                          alt={line.product.name}
                          className="w-14 h-14 rounded-md object-cover border border-gray-700"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-white font-semibold">
                            {line.product?.name || "Unknown product"}
                          </span>
                        </div>
                        {line.product?.productType && (
                          <p className="text-xs text-gray-400 mt-0.5 ml-6">
                            {line.product.productType}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={PAYOUT_STATUS_VARIANT[line.status] || "default"}>
                      {statusBadge.children}
                    </Badge>
                  </div>

                  <div className={`grid grid-cols-2 ${inlineGridCols} gap-3 text-sm`}>
                    <div>
                      <p className="text-gray-400">Gross</p>
                      <p className="text-white">{formatUSD(originalGross)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Commission</p>
                      <p className="text-white">{formatUSD(originalCommission)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Net</p>
                      <p className="text-green-400 font-semibold">{formatUSD(originalNet)}</p>
                    </div>

                    {/* Frozen — currently withheld pending refund review. */}
                    {isFrozen && (
                      <div>
                        <p className="text-gray-400">Frozen</p>
                        <p className="text-cyan-400 font-semibold">
                          {formatUSD(line.frozenAmount)}
                        </p>
                      </div>
                    )}

                    {/* Refunded — permanently returned to buyer. Shown
                        with strikethrough to make it visually obvious the
                        amount is no longer payable to the seller. */}
                    {isRefunded && (
                      <div>
                        <p className="text-gray-400">Refunded</p>
                        <p className="text-red-400 font-semibold line-through">
                          {formatUSD(refundedAmount)}
                        </p>
                      </div>
                    )}

                    {/* Available — what the seller can still withdraw. Only
                        shown when it diverges from Net (i.e. something is
                        held or has been refunded); otherwise it duplicates
                        the Net column. */}
                    {showAvailable && (
                      <div>
                        <p className="text-gray-400">Available</p>
                        <p className="text-green-400 font-semibold">
                          {formatUSD(availableAmount)}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-gray-400">Hold Until</p>
                      <p className="text-white">{formatDate(line.holdUntil)}</p>
                    </div>
                  </div>

                  {isFrozen && (
                    <div className="rounded-md bg-cyan-950/30 border border-cyan-700/30 p-3 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                      <div className="flex-1 text-sm">
                        <p className="text-white font-medium mb-1">
                          {line.status === "frozen"
                            ? "Fully frozen by refund request"
                            : `Partially frozen: ${formatUSD(line.frozenAmount)} of ${formatUSD(line.netAmount)}`}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-300">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>Pause date: {formatDateTime(line.paymentPauseDate)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>Expected release: {formatDateTime(line.expectedReleaseDate)}</span>
                          </div>
                          {refundBadge && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400">Refund:</span>
                              <Badge variant={refundBadge.variant} className="text-xs">
                                {refundBadge.label}
                              </Badge>
                              <span className="text-gray-400">{formatUSD(refund.refundAmount)}</span>
                            </div>
                          )}
                          {refund?.refundDestination && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400">Destination:</span>
                              <span>{refund.refundDestination}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!isFrozen && refund && (
                    <div className="rounded-md bg-yellow-950/20 border border-yellow-700/30 p-3 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-400">Open refund:</span>
                        {refundBadge ? (
                          <Badge variant={refundBadge.variant} className="text-xs">
                            {refundBadge.label}
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs">{refund.status}</Badge>
                        )}
                        <span className="text-white">{formatUSD(refund.refundAmount)}</span>
                      </div>
                    </div>
                  )}

                  {hasDisputeOnSomeKeys && (
                    <div className="rounded-md bg-amber-950/30 border border-amber-600/50 p-3 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                      <div className="flex-1 text-sm">
                        <p className="text-amber-200 font-semibold">
                          {keyBreakdown.frozenCount} of {keyBreakdown.totalKeys} license keys{" "}
                          {keyBreakdown.frozenCount === 1 ? "has" : "have"} an active dispute.
                        </p>
                        <p className="text-amber-100/80 mt-0.5">
                          {formatUSD(line.frozenAmount)} is frozen pending resolution.
                          {refund?.refundAmount ? ` Refund requested: ${formatUSD(refund.refundAmount)}.` : ""}
                        </p>
                      </div>
                    </div>
                  )}

                  {/*
                    Summary cards. Always render Available; render Frozen
                    only when a key on this line is currently in the
                    frozen_disputed state; render Refunded only when a key
                    on this line has completed refund.
                    Both "Frozen" and "Refunded" are distinct outcomes
                    that need their own card — the old layout collapsed
                    them into a single "Frozen $0.00" card after a refund
                    completed, which hid the refunded amount entirely.
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
                        <div className="rounded-md border border-green-700/40 bg-green-950/20 p-3">
                          <div className="flex items-center gap-2 text-green-300 text-xs uppercase tracking-wide">
                            <CheckCircle2 className="w-4 h-4" /> Available
                          </div>
                          <p className="text-2xl font-semibold text-green-400 mt-1">
                            {formatUSD(availableAmount)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {keyBreakdown.availableCount} of {keyBreakdown.totalKeys} key
                            {keyBreakdown.totalKeys === 1 ? "" : "s"} ready to withdraw
                          </p>
                        </div>

                        {hasFrozen && (
                          <div className="rounded-md border border-cyan-700/40 bg-cyan-950/20 p-3">
                            <div className="flex items-center gap-2 text-cyan-300 text-xs uppercase tracking-wide">
                              <Snowflake className="w-4 h-4" /> Frozen
                            </div>
                            <p className="text-2xl font-semibold text-cyan-400 mt-1">
                              {formatUSD(line.frozenAmount)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {keyBreakdown.frozenCount} of {keyBreakdown.totalKeys} key
                              {keyBreakdown.frozenCount === 1 ? "" : "s"} under review
                            </p>
                          </div>
                        )}

                        {hasRefunded && (
                          <div className="rounded-md border border-red-700/40 bg-red-950/20 p-3">
                            <div className="flex items-center gap-2 text-red-300 text-xs uppercase tracking-wide">
                              <AlertCircle className="w-4 h-4" /> Refunded
                            </div>
                            <p className="text-2xl font-semibold text-red-400 mt-1">
                              {formatUSD(keyBreakdown.refundedAmount)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {keyBreakdown.refundedCount} of {keyBreakdown.totalKeys} key
                              {keyBreakdown.refundedCount === 1 ? "" : "s"} refunded to buyer
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {keyBreakdown.totalKeys > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" /> License Keys
                        <span className="text-gray-500">
                          ({keyBreakdown.totalKeys} total · {keyBreakdown.availableCount} available · {keyBreakdown.frozenCount} frozen
                          {keyBreakdown.refundedCount > 0 ? ` · ${keyBreakdown.refundedCount} refunded` : ""})
                        </span>
                      </p>
                      <div className="overflow-x-auto rounded-md border border-gray-700">
                        <Table variant="hud">
                          <TableHeader>
                            <TableRow className="border-gray-700 hover:bg-gray-800">
                              <TableHead className="text-gray-300">Key</TableHead>
                              <TableHead className="text-gray-300">Amount</TableHead>
                              <TableHead className="text-gray-300">Status</TableHead>
                              <TableHead className="text-gray-300">Note</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {keyBreakdown.rows.map((row) => (
                              <TableRow key={row.keyId} className="border-gray-700 hover:bg-gray-800">
                                <TableCell className="font-mono text-xs text-white">{row.displayKey}</TableCell>
                                <TableCell
                                  className={
                                    row.status === "refunded"
                                      ? "font-semibold line-through text-gray-500"
                                      : "text-white font-semibold"
                                  }
                                  title={
                                    row.status === "refunded"
                                      ? "Reassigned from seller to buyer via refund"
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
                                    <Badge variant="warning" className="flex items-center gap-1 w-fit bg-red-900/40 border-red-700/50 text-red-300">
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
                                      ? "text-gray-300"
                                      : row.status === "frozen"
                                        ? "text-amber-300"
                                        : "text-red-300"
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
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminPayoutDetail;
