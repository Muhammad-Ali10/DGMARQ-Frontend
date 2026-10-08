import { useEffect, useMemo, useState } from "react";
import { Check, X, Search } from "lucide-react";
import useOfferVerdict from "@hooks/useOfferVerdict";
import { describeOfferAvailability, countryName, countryFlag } from "@lib/regionCompat";
import { ALL_COUNTRY_CODES } from "@lib/regionPresets";

const RegionRestrictionModal = ({ offer, open, onClose }) => {
  const { availability, verdict, country } = useOfferVerdict(offer);
  const detail = useMemo(() => (offer ? describeOfferAvailability(offer) : null), [offer]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const allowedCodes = useMemo(() => {
    if (!availability) return [];
    if (availability.global || availability.unrestricted) {
      return ALL_COUNTRY_CODES.filter((c) => !availability.excluded.has(c));
    }
    return Array.from(availability.allowed);
  }, [availability]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allowedCodes
      .map((c) => ({ code: c, name: countryName(c) }))
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allowedCodes, query]);

  if (!open) return null;

  const regionLabel = availability?.global
    ? "GLOBAL"
    : detail?.regionNames.length
      ? detail.regionNames.join(", ").toUpperCase()
      : availability?.unrestricted
        ? "GLOBAL"
        : `${allowedCodes.length} COUNTRIES`;

  const cName = country ? countryName(country) : null;
  const isBad = verdict === false;

  return (
    <div role="presentation" className="dg-mback open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dg-modal dg-region-modal">
        <span className="dg-cr a" /><span className="dg-cr b" /><span className="dg-cr c" /><span className="dg-cr d" />
        <button className="dg-x" onClick={onClose} aria-label="Close"><X width={16} height={16} /></button>

        <div className={`dg-rband${isBad ? " is-bad" : ""}`}>
          <div className="dg-rcheck">
            {isBad
              ? <X width={24} height={24} stroke="#f87171" strokeWidth={2.6} />
              : <Check width={24} height={24} stroke="#34d399" strokeWidth={2.6} />}
          </div>
          <h3>
            {country ? (
              isBad
                ? <>This version of product <b className="bad">cannot</b> be activated in <b className="bad">{cName}</b></>
                : <>This version of product can be activated in <b>{cName}</b></>
            ) : (
              <>Activation regions for this product</>
            )}
          </h3>
        </div>

        <div className="dg-rtop">
          <div>
            <div className="k">The product region is restricted to:</div>
            <div className="v" style={{ color: "#5af0d4" }}>{regionLabel}</div>
          </div>
          <div>
            <div className="k">Your country:</div>
            <div className="v">{country ? <>{countryFlag(country)} {cName?.toUpperCase()}</> : "Unknown"}</div>
          </div>
        </div>

        <div className="dg-rlisthead">
          <div className="t">List of allowed countries for this product version:</div>
          <div className="dg-csearch">
            <Search width={16} height={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search country" aria-label="Search country" />
          </div>
        </div>

        <div className="dg-clistwrap">
          <div className="dg-country-list">
            {rows.length === 0 ? (
              <div className="dg-cempty">No countries match “{query}”.</div>
            ) : (
              rows.map((r) => {
                const me = country && r.code === String(country).toUpperCase();
                return (
                  <div key={r.code} className={`dg-crow${me ? " me" : ""}`}>
                    {r.name}
                    {me && <span className="mk"><Check width={14} height={14} /></span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionRestrictionModal;
