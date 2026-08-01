import { useEffect, useState } from "react";
import { GetCountries } from "react-country-state-city";
import { X } from "lucide-react";
import useCurrency from "@hooks/useCurrency";
import useBuyerCountry from "@hooks/useBuyerCountry";
import useLanguage, { LANGUAGES } from "@hooks/useLanguage";
import { SUPPORTED_CURRENCIES } from "@lib/currencyDisplay";

// Module 10 — combined "Update your settings" modal (ported from the v74 mockup).
// Region + Language + Currency in one place. Region is UNIFIED with the M9 buyer
// country, so changing it also drives activation (blue/red) — one source of truth
// for "where I am". Language is cosmetic (label only). Nothing applies until Save.
const flagUrl = (code) => `https://flagcdn.com/w40/${String(code || "").toLowerCase()}.png`;

const CurrencyLanguageModal = ({ open, onClose }) => {
  const { currency, setCurrency } = useCurrency();
  const { country, setCountry } = useBuyerCountry();
  const { language, setLanguage } = useLanguage();

  const [countries, setCountries] = useState([]);
  const [pendingRegion, setPendingRegion] = useState("");
  const [pendingLang, setPendingLang] = useState(language);
  const [pendingCurrency, setPendingCurrency] = useState(currency);

  // Seed the pending selection from the live values each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setPendingRegion(country || "");
    setPendingLang(language);
    setPendingCurrency(currency);
  }, [open, country, language, currency]);

  // Lazy-load the country list only once, when first opened.
  useEffect(() => {
    if (!open || countries.length) return;
    GetCountries()
      .then((list) =>
        setCountries(
          (list || [])
            .filter((c) => c.iso2)
            .map((c) => ({ iso2: c.iso2.toUpperCase(), name: c.name }))
        )
      )
      .catch(() => setCountries([]));
  }, [open, countries.length]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    if (pendingRegion) setCountry(pendingRegion);
    setLanguage(pendingLang);
    setCurrency(pendingCurrency);
    onClose?.();
  };

  const fieldCls =
    "w-full appearance-none rounded-lg border border-white/15 bg-[#0a1938] px-3 py-2.5 text-sm text-fg outline-none focus:border-accent";

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-accent/30 bg-[#081226] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-fg/60 transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-fg">Update your settings</h3>
        <p className="mt-1 text-sm text-fg/55">
          Set your preferred region, language, and the currency.
        </p>

        {/* Region */}
        <div className="mt-5">
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
              {countries.map((c) => (
                <option key={c.iso2} value={c.iso2}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Language */}
        <div className="mt-4">
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

        {/* Currency */}
        <div className="mt-4">
          <label htmlFor="clm-currency" className="mb-1.5 block text-sm text-fg/70">Currency</label>
          <select
            id="clm-currency"
            value={pendingCurrency}
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

        <div className="mt-6 flex justify-end gap-3">
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
        </div>
      </div>
    </div>
  );
};

export default CurrencyLanguageModal;
