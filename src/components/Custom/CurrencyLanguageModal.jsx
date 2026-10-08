import { useEffect, useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import useCurrency from "@hooks/useCurrency";
import useBuyerCountry from "@hooks/useBuyerCountry";
import useLanguage, { LANGUAGES } from "@hooks/useLanguage";
import { SUPPORTED_CURRENCIES, currencyForCountry } from "@lib/currencyDisplay";
import { listCountryOptions } from "@lib/regionCompat";

const flagUrl = (code) => `https://flagcdn.com/w40/${String(code || "").toLowerCase()}.png`;

const CurrencyLanguageModal = ({ open, onClose }) => {
  const { currency, isExplicit, setCurrency } = useCurrency();
  const { country, setCountry } = useBuyerCountry();
  const { language, setLanguage } = useLanguage();

  const [pendingRegion, setPendingRegion] = useState("");
  const [pendingLang, setPendingLang] = useState(language);
  const [pendingCurrency, setPendingCurrency] = useState(null);

  useEffect(() => {
    if (!open) return;
    setPendingRegion(country || "");
    setPendingLang(language);
    setPendingCurrency(null);
  }, [open, country, language]);

  const shownCurrency =
    pendingCurrency || (isExplicit ? currency : currencyForCountry(pendingRegion || country));

  const handleSave = () => {
    if (pendingRegion) setCountry(pendingRegion);
    setLanguage(pendingLang);
    if (pendingCurrency) setCurrency(pendingCurrency);
    onClose?.();
  };

  const fieldCls =
    "w-full appearance-none rounded-lg border border-white/15 bg-[#0a1938] px-3 py-2.5 text-sm text-fg outline-none focus:border-accent";

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose?.(); }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Update your settings</DialogTitle>
          <DialogDescription>
            Set your preferred region, language, and the currency.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div>
            <label htmlFor="clm-region" className="mb-1.5 block text-sm text-fg/70">Region</label>
            <div className="flex items-center gap-2.5">
              {pendingRegion && (
                <img
                  src={flagUrl(pendingRegion)}
                  width={28}
                  height={20}
                  alt=""
                  className="shrink-0 rounded-sm object-cover"
                />
              )}
              <select
                id="clm-region"
                value={pendingRegion}
                onChange={(e) => setPendingRegion(e.target.value)}
                className={fieldCls}
              >
                <option value="">Select region…</option>
                {listCountryOptions(pendingRegion).map((c) => (
                  <option key={c.iso2} value={c.iso2}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="clm-lang" className="mb-1.5 block text-sm text-fg/70">Language</label>
            <select
              id="clm-lang"
              value={pendingLang}
              onChange={(e) => setPendingLang(e.target.value)}
              className={fieldCls}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="clm-currency" className="mb-1.5 block text-sm text-fg/70">Currency</label>
            <select
              id="clm-currency"
              value={shownCurrency}
              onChange={(e) => setPendingCurrency(e.target.value)}
              className={fieldCls}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol}) — {c.code}
                </option>
              ))}
            </select>
          </div>
        </DialogBody>

        <DialogFooter className="sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-fg/80 transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-fg transition-opacity hover:opacity-90"
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CurrencyLanguageModal;
