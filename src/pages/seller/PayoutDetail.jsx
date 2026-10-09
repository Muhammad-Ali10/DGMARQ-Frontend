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
import {
  payoutBadgeProps,
  getRefundStatusDisplay,
  payoutLineState,
  unavailableLineNote,
} from "@features/wallet-payout";
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
import useCurrency from '@hooks/useCurrency';


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

const SUMMARY_TONE = {
  success: { box: "border-success/35 bg-success-soft", text: "text-success" },
  warning: { box: "border-warning/35 bg-warning-soft", text: "text-warning" },
  muted: { box: "border-border bg-secondary", text: "text-fg-muted" },
};

const safeDisplayKey = (key) => {
  const v = typeof key?.displayKey === "string" ? key.displayKey.trim() : "";
  if (!v) return "•••• hidden";
  if (/^[a-f0-9]{24}$/i.test(v)) return "•••• hidden";
  return v;
};

const buildKeyRows = (payout, lineState, money) => {
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
      note = `Refund completed — ${money(perKeyNet)} deducted from your earnings`;
    } else if (isFrozen) {
      status = "frozen";
      note = refundAmount
        ? `Frozen — refund of ${money(refundAmount)} under review`
        : "Frozen — refund under review";
    } else if (lineState === "held") {
      status = "held";
      note = `Releases on ${formatDate(payout?.holdUntil)}`;
    } else if (lineState === "unavailable") {
      status = "unavailable";
      note = unavailableLineNote(payout?.status);
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
    refundedAmount: round2(perKeyNet * refundedCount),
  };
};

const PayoutDetail = () => {
  const { formatSettlement } = useCurrency();
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
  const lineState = payoutLineState(payout);
  const keyBreakdown = buildKeyRows(payout, lineState, formatSettlement);
  const frozenAmount = round2(payout.frozenAmount);
  const unfrozenAmount = round2(
    typeof payout.availableAmount === "number"
      ? payout.availableAmount
      : Math.max(0, Number(payout.netAmount || 0) - Number(payout.frozenAmount || 0))
  );
  const availableAmount = lineState === "withdrawable" ? unfrozenAmount : 0;
  const summaryCard =
    lineState === "held"
      ? {
          label: "On hold",
          amount: unfrozenAmount,
          note: `release on ${formatDate(payout.holdUntil)}`,
          tone: "warning",
        }
      : lineState === "unavailable"
        ? { label: "Not payable", amount: 0, note: "not payable", tone: "muted" }
        : { label: "Available", amount: availableAmount, note: "ready to withdraw", tone: "success" };
  const hasDisputeOnSomeKeys =
    keyBreakdown.frozenCount > 0 && keyBreakdown.frozenCount < keyBreakdown.totalKeys;

  const refundedAmount = keyBreakdown.refundedAmount;
  const isRefunded = refundedAmount > 0;
  const showAvailable = (isFrozen || isRefunded) && availableAmount > 0;
  const inlineCellCount =
    4 + (isFrozen ? 1 : 0) + (isRefunded ? 1 : 0) + (showAvailable ? 1 : 0);
  const inlineGridCols =
    {
      4: "sm:grid-cols-4",
      5: "sm:grid-cols-5",
      6: "sm:grid-cols-6",
      7: "sm:grid-cols-3 lg:grid-cols-7",
    }[inlineCellCount] || "sm:grid-cols-4";
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
              {formatSettlement(payout.netAmount)}
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

      {isFrozen && (
        <Card variant="hud" className="border-info/35">
          <CardContent className="pt-5 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-fg-muted text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" /> Payment Pause Date
                </div>
                <p className="text-fg">{formatDate(payout.paymentPauseDate)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-fg-muted text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Expected Release Date
                </div>
                <p className="text-fg">{formatDate(payout.expectedReleaseDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

            <div className={`grid grid-cols-2 ${inlineGridCols} gap-3 text-sm`}>
              <div>
                <p className="text-fg-muted">Gross</p>
                <p className="text-fg">{formatSettlement(originalGross)}</p>
              </div>
              <div>
                <p className="text-fg-muted">Commission</p>
                <p className="text-fg">{formatSettlement(originalCommission)}</p>
              </div>
              <div>
                <p className="text-fg-muted">Net</p>
                <p className="text-success font-semibold">{formatSettlement(originalNet)}</p>
              </div>

              {isFrozen && (
                <div>
                  <p className="text-fg-muted">Frozen</p>
                  <p className="text-info font-semibold">
                    {formatSettlement(frozenAmount)}
                  </p>
                </div>
              )}

              {isRefunded && (
                <div>
                  <p className="text-fg-muted">Refunded</p>
                  <p className="text-danger font-semibold line-through">
                    {formatSettlement(refundedAmount)}
                  </p>
                </div>
              )}

              {showAvailable && (
                <div>
                  <p className="text-fg-muted">Available</p>
                  <p className="text-success font-semibold">
                    {formatSettlement(availableAmount)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-fg-muted">Hold Until</p>
                <p className="text-fg">{formatDate(payout.holdUntil)}</p>
              </div>
            </div>

            {isFrozen && (
              <div className="rounded-md bg-info-soft border border-info/35 p-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-info mt-0.5 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="text-fg font-medium mb-1">
                    {payout.status === "frozen"
                      ? "Fully frozen by refund request"
                      : `Partially frozen: ${formatSettlement(frozenAmount)} of ${formatSettlement(payout.netAmount)}`}
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
                        <span className="text-fg-muted">{formatSettlement(refund?.refundAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                  <span className="text-fg">{formatSettlement(refund.refundAmount)}</span>
                </div>
              </div>
            )}

            {hasDisputeOnSomeKeys && (
              <div className="rounded-md bg-warning-soft border border-warning/35 p-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="text-warning font-semibold">
                    {keyBreakdown.frozenCount} of {keyBreakdown.totalKeys} license keys{" "}
                    {keyBreakdown.frozenCount === 1 ? "has" : "have"} an active dispute.
                  </p>
                  <p className="text-warning mt-0.5">
                    {formatSettlement(frozenAmount)} is frozen pending resolution.
                    {refund?.refundAmount ? ` Refund requested: ${formatSettlement(refund.refundAmount)}.` : ""}
                  </p>
                </div>
              </div>
            )}

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
                  <div className={`rounded-md border p-3 ${SUMMARY_TONE[summaryCard.tone].box}`}>
                    <div className={`flex items-center gap-2 text-xs uppercase tracking-wide ${SUMMARY_TONE[summaryCard.tone].text}`}>
                      {lineState === "held" ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{" "}
                      {summaryCard.label}
                    </div>
                    <p className={`text-2xl font-semibold mt-1 ${SUMMARY_TONE[summaryCard.tone].text}`}>
                      {formatSettlement(summaryCard.amount)}
                    </p>
                    <p className="text-xs text-fg-muted mt-1">
                      {keyBreakdown.availableCount} of {keyBreakdown.totalKeys} key
                      {keyBreakdown.totalKeys === 1 ? "" : "s"} {summaryCard.note}
                    </p>
                  </div>

                  {hasFrozen && (
                    <div className="rounded-md border border-info/35 bg-info-soft p-3">
                      <div className="flex items-center gap-2 text-info text-xs uppercase tracking-wide">
                        <Snowflake className="w-4 h-4" /> Frozen
                      </div>
                      <p className="text-2xl font-semibold text-info mt-1">
                        {formatSettlement(frozenAmount)}
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
                        {formatSettlement(keyBreakdown.refundedAmount)}
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
                            {formatSettlement(row.amount)}
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
                            {row.status === "held" && (
                              <Badge variant="warning" className="flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" /> On hold
                              </Badge>
                            )}
                            {row.status === "unavailable" && (
                              <Badge variant="secondary" className="w-fit">
                                Not payable
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell
                            className={`text-sm ${
                              row.status === "available" || row.status === "unavailable"
                                ? "text-fg-muted"
                                : row.status === "frozen" || row.status === "held"
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

          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutDetail;
