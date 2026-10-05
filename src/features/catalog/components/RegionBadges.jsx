import { useEffect, useMemo, useRef, useState } from "react";
import { GetCountries } from "react-country-state-city";
import { Ban, Check, CircleX, Globe, Info, X } from "lucide-react";
import useBuyerCountry from "@hooks/useBuyerCountry";
import {
  resolveOfferAvailability,
  isBuyerCompatible,
  describeOfferAvailability,
  countryName,
  countryFlag,
} from "@lib/regionCompat";


const toneClass = {
  buyer: "border-emerald-400/60 bg-emerald-400/10 text-success",
  global: "border-emerald-400/50 bg-emerald-400/10 text-success",
  neutral: "border-sky-400/40 bg-sky-400/10 text-sky-200",
};

const RegionBadges = ({ offer, maxChips = 2, compact = false, showWarning = false, interactive = true, showLabel = true }) => {
  const { country, setCountry } = useBuyerCountry();
  const [open, setOpen] = useState(false);
  const [allCountries, setAllCountries] = useState([]);
  const wrapRef = useRef(null);

  const availability = useMemo(
    () => resolveOfferAvailability(offer),
    [offer]
  );
  const verdict = isBuyerCompatible(availability, country);
  const detail = useMemo(
    () => describeOfferAvailability(offer),
    [offer]
  );
  // Chip labels: Global OR region names + individual countries.
  const chips = useMemo(() => {
    // An offer the seller left unrestricted reaches exactly the buyers a GLOBAL
    // one does, so it says the same word. It used to read "All regions", which
    // sounded like a third, narrower thing.
    if (availability.unrestricted || availability.global) {
      return [{ key: "global", label: "Global", tone: "global", global: true }];
    }
    const out = detail.regionNames.map((n) => ({ key: `r-${n}`, label: n, tone: "neutral" }));
    for (const c of detail.includedCountries) out.push({ key: `c-${c}`, label: `${countryFlag(c)} ${c}`, tone: "neutral" });
    return out;
  }, [availability, detail]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Lazy-load the country list only when the popup is first opened.
  useEffect(() => {
    if (!open || allCountries.length) return;
    GetCountries()
      .then((list) =>
        setAllCountries(
          (list || []).filter((c) => c.iso2).map((c) => ({ iso2: c.iso2.toUpperCase(), name: c.name }))
        )
      )
      .catch(() => setAllCountries([]));
  }, [open, allCountries.length]);


  const buyerChip =
    country && verdict === true && !availability.unrestricted && !availability.global
      ? { key: "buyer", label: `${countryFlag(country)} ${country}`, tone: "buyer", check: true }
      : null;
  const allChips = buyerChip ? [buyerChip, ...chips] : chips;
  const visibleChips = allChips.slice(0, maxChips);
  const extra = allChips.length - visibleChips.length;
  const sz = compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5";

  return (
    <span ref={wrapRef} className="relative flex flex-row flex-wrap items-center gap-1.5 align-middle">
      {showLabel && <p className="text-[10px] md:text-xs font-normal text-fg/60">Region:</p>}

      {offer ? visibleChips.map((c) => (
        <span
          key={c.key}
          className={`inline-flex items-center gap-0.5 rounded-md border ${toneClass[c.tone]} ${sz} font-semibold uppercase`}
        >
          {c.global && <Globe className="h-2.5 w-2.5" />}
          {c.label}
          {c.check && <Check className="h-2.5 w-2.5" />}
        </span>
      )) : null}

      {interactive ? (
        (extra > 0 || !availability.unrestricted) && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
            aria-label="Region availability details"
            className={`inline-flex items-center gap-0.5 rounded-md border border-white/20 bg-black/20 ${sz} font-semibold text-fg/70 hover:text-white`}
          >
            {extra > 0 ? `+${extra}` : <Info className="h-3 w-3" />}
          </button>
        )
      ) : (
        // Static mode (e.g. inside a clickable row / search suggestion): no popup
        // button so we never nest a <button> inside a <button>.
        extra > 0 && (
          <span className={`inline-flex items-center gap-0.5 rounded-md border border-white/20 bg-black/20 ${sz} font-semibold text-fg/70`}>+{extra}</span>
        )
      )}

      {showWarning && verdict !== null && (
        verdict ? (
          <span className="inline-flex w-full items-center gap-1 text-[10px] font-medium text-success">
            <Check className="h-3 w-3" />
            Can activate in {country ? countryName(country) : "your country"}
          </span>
        ) : (
          <span className="inline-flex w-full items-center gap-1 text-[10px] font-medium text-danger">
            <CircleX className="h-3 w-3" />
            Cannot activate in {country ? countryName(country) : "your country"}
          </span>
        )
      )}

      {interactive && open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-sky-500/30 bg-[#04122e] p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-fg">Activation regions</span>
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); }} className="text-fg-muted hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {availability.unrestricted ? (
            <p className="flex items-center gap-1 text-xs text-info">
              <Globe className="h-3.5 w-3.5" /> Global — available in every country.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {detail.global && (
                <p className="flex items-center gap-1 text-info">
                  <Globe className="h-3.5 w-3.5" /> Global
                </p>
              )}
              {detail.regionNames.length > 0 && (
                <div>
                  <p className="text-fg-muted">Regions</p>
                  <p className="text-fg">{detail.regionNames.join(", ")}</p>
                </div>
              )}
              {detail.includedCountries.length > 0 && (
                <div>
                  <p className="text-fg-muted">Also available in</p>
                  <p className="text-fg">
                    {detail.includedCountries.map((c) => `${countryFlag(c)} ${countryName(c)}`).join(", ")}
                  </p>
                </div>
              )}
              {detail.excludedCountries.length > 0 && (
                <div>
                  <p className="text-danger">Excluded</p>
                  <p className="text-danger">
                    {detail.excludedCountries.map((c) => `${countryFlag(c)} ${countryName(c)}`).join(", ")}
                  </p>
                </div>
              )}
              {!detail.global && detail.countryCount != null && (
                <p className="text-fg-subtle">Total: {detail.countryCount} country(ies)</p>
              )}
            </div>
          )}

          <div className="mt-3 border-t border-white/10 pt-2">
            {country ? (
              <p className={`mb-2 flex items-center gap-1 text-xs ${verdict === false ? "text-danger" : verdict ? "text-info" : "text-fg-muted"}`}>
                {verdict === false ? <Ban className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                Your country: {countryFlag(country)} {countryName(country)} —{" "}
                {verdict === false ? "cannot activate here" : "you can activate this"}
              </p>
            ) : (
              <p className="mb-2 text-xs text-fg-muted">Select your country to check compatibility.</p>
            )}
            <select
              aria-label="Set your country"
              value={country || ""}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => { e.stopPropagation(); if (e.target.value) setCountry(e.target.value); }}
              className="w-full rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-fg outline-none"
            >
              <option value="">Change country…</option>
              {allCountries.map((c) => (
                <option key={c.iso2} value={c.iso2}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </span>
  );
};

export default RegionBadges;
