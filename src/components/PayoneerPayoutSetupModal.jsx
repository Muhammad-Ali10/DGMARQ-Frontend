import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerAPI } from "../services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loading } from "./ui/loading";
import { showApiError, showSuccess } from "../utils/toast";
import { AlertCircle } from "lucide-react";

const METHOD_LABEL = {
  payoneer: "Payoneer",
  local_bank: "Local Bank Transfer",
  swift: "SWIFT International",
};

const METHOD_HELP = {
  payoneer:
    "Receive payouts directly to your Payoneer account. Enter your Payoneer Payee ID to get started.",
  local_bank:
    "Domestic bank transfer in your country, routed through Payoneer. Enter your Payoneer Payee ID.",
  swift:
    "International wire transfer via SWIFT, routed through Payoneer. Enter your Payoneer Payee ID.",
};

function PayoneerSetupForm({ method, onSuccess }) {
  const queryClient = useQueryClient();
  const [payeeId, setPayeeId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [country, setCountry] = useState("");
  const [accountName, setAccountName] = useState("");

  const linkMutation = useMutation({
    mutationFn: (payload) => sellerAPI.linkPayoneerAccount(payload),
    onSuccess: () => {
      showSuccess(`${METHOD_LABEL[method] || method} account linked successfully.`);
      queryClient.invalidateQueries({ queryKey: ["payout-account"] });
      onSuccess?.();
    },
    onError: (err) => showApiError(err, "Could not link Payoneer account"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!payeeId.trim()) return;
    linkMutation.mutate({
      method,
      payeeId: payeeId.trim(),
      currency: currency || "USD",
      country: country || undefined,
      accountName: accountName.trim() || undefined,
    });
  };

  const canSubmit = payeeId.trim().length > 0 && !linkMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-400">{METHOD_HELP[method] || METHOD_HELP.payoneer}</p>

      <div className="space-y-2">
        <Label htmlFor="payoneer-payee-id" className="text-gray-300">
          Payoneer Payee ID
        </Label>
        <Input
          id="payoneer-payee-id"
          value={payeeId}
          onChange={(e) => setPayeeId(e.target.value)}
          placeholder="Enter your Payoneer Payee ID"
          className="bg-secondary border-gray-700 text-white"
          required
        />
        <p className="text-[11px] text-gray-500">
          Your Payee ID can be found in your Payoneer account settings.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="payoneer-currency" className="text-gray-300">
            Currency
          </Label>
          <Input
            id="payoneer-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            placeholder="USD"
            maxLength={3}
            className="bg-secondary border-gray-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payoneer-country" className="text-gray-300">
            Country (optional)
          </Label>
          <Input
            id="payoneer-country"
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            placeholder="US"
            maxLength={2}
            className="bg-secondary border-gray-700 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payoneer-holder" className="text-gray-300">
          Account holder name (optional)
        </Label>
        <Input
          id="payoneer-holder"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="Full name on your Payoneer account"
          className="bg-secondary border-gray-700 text-white"
        />
      </div>

      {linkMutation.isPending && <Loading message="Linking account..." size="sm" />}

      {linkMutation.isError && (
        <div className="text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>
            {linkMutation.error?.response?.data?.message || "Failed to link account"}
          </span>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
        <Button type="submit" disabled={!canSubmit} className="bg-accent text-white">
          {linkMutation.isPending ? "Linking..." : "Link account"}
        </Button>
      </div>
    </form>
  );
}

const PayoneerPayoutSetupModal = ({
  open,
  onOpenChange,
  method = "payoneer",
  ...rest
}) => {
  const label = METHOD_LABEL[method] || "Payoneer";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="bg-primary border-gray-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Set up {label}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Link your Payoneer account for {label} payouts.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <PayoneerSetupForm
            key={method}
            method={method}
            onSuccess={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PayoneerPayoutSetupModal;
