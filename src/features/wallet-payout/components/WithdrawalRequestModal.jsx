import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sellerAPI } from "@services/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Badge } from "@components/ui/badge";
import { Loading } from "@components/ui/loading";
import { showApiError, showSuccess, showWarning } from "@utils/toast";
import { AlertCircle, RefreshCw, Wallet } from "lucide-react";
import { formatUSD } from '@lib/money';

// ============================================================================
// Phase 5 - Seller WithdrawalRequestModal
// ============================================================================
//
// Flow:
//   1. Pick a connected (verified) PayPal payout account.
//   2. Enter the gross amount the seller wants to withdraw.
//   3. Auto-fetch a quote (static fee from admin settings).
//   4. Submit -> backend validates cap + minimum + freshness, creates a
//      `requested` Withdrawal row.
// ============================================================================

const METHOD_LABEL = {
  paypal: "PayPal",
};

const QUOTE_REFRESH_SLACK_MS = 60 * 1000;
const QUOTE_AUTO_DEBOUNCE_MS = 600;


const formatTimeLeft = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) return "expired";
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

export function WithdrawalRequestModal({ open, onOpenChange, balance, accounts = [] }) {
  // Inner component is keyed so opening the modal resets all local state cleanly
  // without a setState-in-effect anti-pattern.
  const formKey = `${open ? "open" : "closed"}-${(accounts || []).map((a) => a.accountType).join(",")}`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-fg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-success" />
            Request a withdrawal
          </DialogTitle>
          <DialogDescription className="text-fg-muted">
            Choose a connected payout method and the amount you want to receive.
          </DialogDescription>
        </DialogHeader>
        <WithdrawalForm
          key={formKey}
          open={open}
          balance={balance}
          accounts={accounts}
          onCancel={() => onOpenChange(false)}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function WithdrawalForm({ open, balance, accounts, onCancel, onSuccess }) {
  const queryClient = useQueryClient();
  const verifiedAccounts = useMemo(
    () => (accounts || []).filter((a) => a.status === "verified"),
    [accounts]
  );

  const initialMethod = verifiedAccounts[0]?.accountType || "";
  const [methodType, setMethodType] = useState(initialMethod);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [debouncedAmount, setDebouncedAmount] = useState("");

  const availableBalance = Number(balance?.available || 0);

  // Debounce amount changes so we don't spam quote requests on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAmount(amount), QUOTE_AUTO_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [amount]);

  const numericAmount = useMemo(() => {
    const n = parseFloat(debouncedAmount);
    return Number.isFinite(n) ? n : 0;
  }, [debouncedAmount]);

  // Quote query: enabled only when method is selected, amount > 0, and within balance.
  const quoteQuery = useQuery({
    queryKey: ["withdrawal-quote", methodType, numericAmount],
    queryFn: () =>
      sellerAPI
        .getWithdrawalQuote({ methodType, amount: numericAmount })
        .then((res) => res.data?.data),
    enabled:
      open &&
      !!methodType &&
      numericAmount > 0 &&
      numericAmount <= availableBalance + 0.001,
    retry: false,
    staleTime: 0,
  });

  // Tick once a second so the countdown re-renders.
  useEffect(() => {
    if (!quoteQuery.data?.expiresAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [quoteQuery.data?.expiresAt]);

  // Auto-refresh the quote when within the slack window.
  useEffect(() => {
    if (!quoteQuery.data?.expiresAt) return undefined;
    const expiresAtMs = new Date(quoteQuery.data.expiresAt).getTime();
    const msLeft = expiresAtMs - Date.now();
    if (msLeft > QUOTE_REFRESH_SLACK_MS) return undefined;
    // Force refetch once we cross the slack threshold.
    quoteQuery.refetch();
    return undefined;
  }, [now, quoteQuery]);

  const submitMutation = useMutation({
    mutationFn: (payload) => sellerAPI.createWithdrawal(payload).then((res) => res.data?.data),
    onSuccess: () => {
      showSuccess("Withdrawal requested. An admin will review it shortly.");
      queryClient.invalidateQueries({ queryKey: ["seller-balance"] });
      queryClient.invalidateQueries({ queryKey: ["seller-withdrawals"] });
      onSuccess?.();
    },
    onError: (err) => showApiError(err, "Could not submit withdrawal request"),
  });

  const expiresAtMs = quoteQuery.data?.expiresAt
    ? new Date(quoteQuery.data.expiresAt).getTime()
    : null;
  const msLeft = expiresAtMs ? expiresAtMs - now : null;
  const isQuoteExpired = msLeft !== null && msLeft <= 0;
  const showCountdown = !!expiresAtMs && quoteQuery.data?.fallbackUsed !== true;

  const validationError = useMemo(() => {
    if (!methodType) return "Select a payout method.";
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return "Enter an amount.";
    if (numericAmount > availableBalance + 0.001) {
      return `Amount exceeds your available balance of ${formatUSD(availableBalance)}.`;
    }
    return null;
  }, [methodType, numericAmount, availableBalance]);

  const canSubmit =
    !validationError &&
    quoteQuery.data &&
    !quoteQuery.isFetching &&
    !submitMutation.isPending &&
    (!showCountdown || !isQuoteExpired);

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;
    if (showCountdown && isQuoteExpired) {
      showWarning("The quote expired. Refreshing...");
      quoteQuery.refetch();
      return;
    }
    submitMutation.mutate({
      methodType,
      amount: numericAmount,
      quote: quoteQuery.data,
      notes: notes || undefined,
    });
  };

  if (verifiedAccounts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-md border border-yellow-700 bg-yellow-900/20 text-yellow-200 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            You don't have any verified payout methods connected yet. Connect at least one
            PayPal account to request a withdrawal.
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="border-border text-fg-muted">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-secondary/50 p-3">
          <p className="text-xs text-fg-muted mb-1">Available balance</p>
          <p className="text-xl font-semibold text-fg">{formatUSD(availableBalance)}</p>
          <p className="text-[10px] text-fg-subtle mt-1">Open withdrawals already deducted.</p>
        </div>
        <div className="rounded-md border border-border bg-secondary/50 p-3">
          <p className="text-xs text-fg-muted mb-1">In-flight withdrawals</p>
          <p className="text-xl font-semibold text-fg">{formatUSD(balance?.inFlight?.amount || 0)}</p>
          <p className="text-[10px] text-fg-subtle mt-1">
            {balance?.inFlight?.count || 0} request(s) being processed.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="withdrawal-method" className="text-fg-muted">Payout method</Label>
        <select
          id="withdrawal-method"
          value={methodType}
          onChange={(e) => setMethodType(e.target.value)}
          className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-fg text-sm"
        >
          <option value="" disabled>Select a verified method</option>
          {verifiedAccounts.map((a) => (
            <option key={a.accountType} value={a.accountType}>
              {METHOD_LABEL[a.accountType] || a.accountType} - {a.accountIdentifier || a.accountName}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-fg-subtle">
          PayPal payouts are sent from our PayPal account.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="withdrawal-amount" className="text-fg-muted">Gross amount (USD)</Label>
        <Input
          id="withdrawal-amount"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="bg-secondary border-border text-fg"
        />
      </div>

      {/* Quote panel */}
      <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-fg">Live quote</p>
          {quoteQuery.isFetching && (
            <span className="text-[11px] text-fg-muted flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Fetching...
            </span>
          )}
          {showCountdown && !quoteQuery.isFetching && (
            <Badge variant={isQuoteExpired ? "destructive" : "warning"} className="text-[10px]">
              {isQuoteExpired ? "Expired - refreshing" : `Expires in ${formatTimeLeft(msLeft)}`}
            </Badge>
          )}
          {quoteQuery.data?.fallbackUsed && (
            <Badge variant="warning" className="text-[10px]">Static fallback fee</Badge>
          )}
        </div>
        {quoteQuery.isLoading && <Loading message="Calculating fee..." size="sm" />}
        {quoteQuery.error && (
          <div className="text-sm text-danger flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Could not fetch quote: {quoteQuery.error?.response?.data?.message || "unknown error"}</span>
          </div>
        )}
        {quoteQuery.data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-fg-muted">Provider fee</p>
              <p className="text-fg font-medium">{formatUSD(quoteQuery.data.fee)}</p>
            </div>
            {quoteQuery.data.chargebackFee > 0 && (
              <div>
                <p className="text-fg-muted">
                  Chargeback fee
                  {quoteQuery.data.chargebackFeePercent ? ` (${quoteQuery.data.chargebackFeePercent}%)` : ""}
                </p>
                <p className="text-fg font-medium">{formatUSD(quoteQuery.data.chargebackFee)}</p>
              </div>
            )}
            <div>
              <p className="text-fg-muted">You will receive</p>
              <p className="text-success font-semibold">{formatUSD(quoteQuery.data.net)}</p>
            </div>
            <div>
              <p className="text-fg-muted">Source</p>
              <p className="text-fg text-xs">
                {quoteQuery.data.feeSource === "static" && "Admin-configured static fee"}
                {(quoteQuery.data.feeSource === "live" || quoteQuery.data.feeSource === "fallback") && "Configured fee"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="withdrawal-notes" className="text-fg-muted">Note (optional)</Label>
        <Input
          id="withdrawal-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything you want the admin to see"
          className="bg-secondary border-border text-fg"
          maxLength={500}
        />
      </div>

      {validationError && (
        <div className="text-sm text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} className="border-border text-fg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit} className="bg-accent text-fg">
          {submitMutation.isPending ? "Submitting..." : "Request withdrawal"}
        </Button>
      </div>
    </form>
  );
}

export default WithdrawalRequestModal;
