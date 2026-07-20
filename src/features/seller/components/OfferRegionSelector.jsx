import { useState } from "react";
import {
  Check,
  Search,
  Globe,
  X,
  ChevronUp,
  SlidersHorizontal,
  MapPin,
  Lock,
} from "lucide-react";
import {
  REGION_PRESETS,
  REGION_PRESET_MAP,
  GLOBAL_REGION_CODE,
  ALL_COUNTRY_CODES,
} from "@lib/regionPresets";
import { resolveOfferAvailability, countryName, countryFlag } from "@lib/regionCompat";

const uniq = (a) => Array.from(new Set(a));

/**
 * OfferRegionSelector — seller picks where their listing's keys can be activated
 * from the fixed region PRESETS (no admin-managed regions). A seller can select
 * preset regions, trim individual countries out of a region, add individual
 * countries on top, or pick GLOBAL (covers everyone).
 *
 * value:    { regionCodes: string[], countries: string[], excludedCountries: string[] }
 *   regionCodes       — chosen preset codes (EUROPE, ASIA, GLOBAL, …)
 *   countries         — extra individual ISO alpha-2 codes
 *   excludedCountries — ISO codes trimmed out of a chosen preset
 * onChange: (nextValue) => void
 */
const OfferRegionSelector = ({ value, onChange }) => {
  const regionCodes = value.regionCodes || [];
  const countries = value.countries || []; // extra individual
  const excluded = value.excludedCountries || [];

  const [tab, setTab] = useState("regions");
  const [expanded, setExpanded] = useState(null);
  const [regionSearch, setRegionSearch] = useState("");
  const [drawerSearch, setDrawerSearch] = useState("");
  const [customSearch, setCustomSearch] = useState("");

  // Plain derivations — the React Compiler auto-memoizes these; manual useMemo
  // here tripped its "existing memoization could not be preserved" bailout.
  const isGlobal = regionCodes.includes(GLOBAL_REGION_CODE);
  const selectedPresets = regionCodes
    .map((c) => REGION_PRESET_MAP.get(c))
    .filter(Boolean)
    .filter((p) => !p.isGlobal);

  const availability = resolveOfferAvailability(value);

  const patch = (next) =>
    onChange({ regionCodes, countries, excludedCountries: excluded, ...next });

  // Countries already covered by a selected (non-global) region, minus trims —
  // these are shown locked in the individual-countries tab.
  const coveredSet = new Set();
  for (const p of selectedPresets)
    for (const c of p.countries) if (!excluded.includes(c)) coveredSet.add(c);

  // Drop excluded codes that no longer belong to any selected preset.
  const pruneExcluded = (codes) => {
    const pool = new Set(
      codes
        .map((c) => REGION_PRESET_MAP.get(c))
        .filter(Boolean)
        .flatMap((p) => p.countries)
    );
    return excluded.filter((c) => pool.has(c));
  };

  const toggleRegion = (code) => {
    if (code === GLOBAL_REGION_CODE) {
      if (isGlobal) patch({ regionCodes: [] });
      else patch({ regionCodes: [GLOBAL_REGION_CODE], countries: [], excludedCountries: [] });
      return;
    }
    if (isGlobal) return; // everything is locked while GLOBAL is on
    if (regionCodes.includes(code)) {
      const next = regionCodes.filter((c) => c !== code);
      patch({ regionCodes: next, excludedCountries: pruneExcluded(next) });
      if (expanded === code) setExpanded(null);
    } else {
      const preset = REGION_PRESET_MAP.get(code);
      // Start fully included: clear any trims on this preset's countries.
      patch({
        regionCodes: [...regionCodes, code],
        excludedCountries: excluded.filter((c) => !preset.countries.includes(c)),
      });
    }
  };

  const toggleRegionCountry = (iso) =>
    excluded.includes(iso)
      ? patch({ excludedCountries: excluded.filter((c) => c !== iso) })
      : patch({ excludedCountries: uniq([...excluded, iso]) });

  const includeAll = (code) => {
    const preset = REGION_PRESET_MAP.get(code);
    patch({ excludedCountries: excluded.filter((c) => !preset.countries.includes(c)) });
  };
  const excludeAll = (code) => {
    const preset = REGION_PRESET_MAP.get(code);
    patch({ excludedCountries: uniq([...excluded, ...preset.countries]) });
  };

  const toggleIndividual = (iso) => {
    if (isGlobal || coveredSet.has(iso)) return;
    countries.includes(iso)
      ? patch({ countries: countries.filter((c) => c !== iso) })
      : patch({ countries: uniq([...countries, iso]) });
  };

  const filteredRegions = REGION_PRESETS.filter((r) => {
    const q = regionSearch.trim().toLowerCase();
    return !q || r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
  });

  const filteredCustom = ALL_COUNTRY_CODES.filter((iso) => {
    const q = customSearch.trim().toLowerCase();
    return !q || iso.toLowerCase().includes(q) || countryName(iso).toLowerCase().includes(q);
  });

  let coverage = "No restriction — available to all buyers";
  if (availability.global) coverage = "Worldwide — all countries";
  else if (!availability.unrestricted)
    coverage = `Available in ${availability.allowed.size} countr${availability.allowed.size === 1 ? "y" : "ies"}`;

  const tabBtn = (id, label, count, Icon, disabled) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && setTab(id)}
      className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
        tab === id
          ? "border-accent text-white"
          : "border-transparent text-gray-400 hover:text-gray-200"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <Icon className="h-4 w-4" />
      {label}
      <span
        className={`rounded-full px-1.5 text-[10px] font-semibold ${
          count > 0 ? "bg-accent/20 text-accent" : "bg-white/5 text-gray-500"
        }`}
      >
        {count}
      </span>
    </button>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-gray-700 bg-secondary/20">
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabBtn("regions", "Regions", regionCodes.length, Globe, false)}
        {tabBtn("custom", "Individual countries", countries.length, MapPin, isGlobal)}
      </div>

      {/* Regions tab */}
      {tab === "regions" && (
        <div className="space-y-2 p-3">
          {isGlobal && (
            <div className="flex items-center gap-2 rounded-md border border-green-800 bg-green-950/40 px-3 py-2 text-xs text-green-400">
              <Globe className="h-3.5 w-3.5" />
              GLOBAL selected — all other regions and countries are locked. Deselect Global to make changes.
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={regionSearch}
              onChange={(e) => setRegionSearch(e.target.value)}
              placeholder="Search regions..."
              aria-label="Search regions"
              className="h-9 w-full rounded-lg border border-gray-700 bg-secondary pl-10 pr-3 text-sm text-white outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1">
            {filteredRegions.map((r) => {
              const selected = regionCodes.includes(r.code);
              const locked = isGlobal && r.code !== GLOBAL_REGION_CODE;
              const total = r.countries.length;
              const inc = r.isGlobal
                ? 0
                : r.countries.filter((c) => !excluded.includes(c)).length;
              const isExp = expanded === r.code;
              return (
                <div
                  key={r.code}
                  className={`rounded-lg border ${
                    selected ? "border-accent/60" : "border-transparent"
                  }`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleRegion(r.code)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleRegion(r.code)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left ${
                      locked ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-white/5"
                    } ${selected ? "bg-accent/10" : ""}`}
                  >
                    <span
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                        selected ? "border-accent bg-accent text-white" : "border-gray-600"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="rounded-full border border-gray-600 bg-secondary px-2 py-0.5 text-[10px] font-semibold text-gray-300">
                      {r.code}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 text-sm text-white">
                        {r.isGlobal && <Globe className="h-3 w-3 text-green-400" />}
                        {r.name}
                      </span>
                    </span>
                    <span className="flex-shrink-0 rounded-full border border-gray-700 px-2 py-0.5 text-[10px] text-gray-400">
                      {r.isGlobal ? "All" : selected ? `${inc}/${total}` : total} countries
                    </span>
                    {selected && !r.isGlobal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpanded(isExp ? null : r.code);
                          setDrawerSearch("");
                        }}
                        className="flex flex-shrink-0 items-center gap-1 rounded-md border border-gray-600 px-2 py-1 text-[11px] text-gray-300 hover:border-accent hover:text-accent"
                      >
                        {isExp ? <ChevronUp className="h-3 w-3" /> : <SlidersHorizontal className="h-3 w-3" />}
                        {isExp ? "Hide" : "Edit"}
                      </button>
                    )}
                  </div>

                  {/* Per-region country editor */}
                  {selected && !r.isGlobal && isExp && (
                    <div className="border-t border-gray-700 px-3 py-2.5">
                      <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                          value={drawerSearch}
                          onChange={(e) => setDrawerSearch(e.target.value)}
                          placeholder="Filter countries..."
                          aria-label="Filter countries in region"
                          className="h-8 w-full rounded-md border border-gray-700 bg-secondary pl-8 pr-2 text-xs text-white outline-none focus:border-accent"
                        />
                      </div>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => includeAll(r.code)}
                            className="rounded border border-gray-700 px-2 py-0.5 text-[11px] text-gray-300 hover:bg-white/5"
                          >
                            Select all
                          </button>
                          <button
                            type="button"
                            onClick={() => excludeAll(r.code)}
                            className="rounded border border-gray-700 px-2 py-0.5 text-[11px] text-gray-300 hover:bg-white/5"
                          >
                            Deselect all
                          </button>
                        </div>
                        <span className="text-[11px] text-gray-500">{inc} selected</span>
                      </div>
                      <div className="grid max-h-44 grid-cols-2 gap-0.5 overflow-y-auto sm:grid-cols-3">
                        {r.countries
                          .filter((iso) => {
                            const q = drawerSearch.trim().toLowerCase();
                            return !q || iso.toLowerCase().includes(q) || countryName(iso).toLowerCase().includes(q);
                          })
                          .map((iso) => {
                            const on = !excluded.includes(iso);
                            return (
                              <label
                                key={iso}
                                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-white/5"
                              >
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => toggleRegionCountry(iso)}
                                  className="h-3 w-3 accent-accent"
                                />
                                <span className={`truncate text-[11px] ${on ? "text-gray-200" : "text-gray-500"}`}>
                                  {countryFlag(iso)} {countryName(iso)}
                                </span>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual countries tab */}
      {tab === "custom" && !isGlobal && (
        <div className="space-y-2 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={customSearch}
              onChange={(e) => setCustomSearch(e.target.value)}
              placeholder="Search all countries..."
              aria-label="Search all countries"
              className="h-9 w-full rounded-lg border border-gray-700 bg-secondary pl-10 pr-3 text-sm text-white outline-none focus:border-accent"
            />
          </div>
          <p className="text-xs text-gray-400">
            <b className="text-accent">{countries.length}</b> individual
            {countries.length === 1 ? " country" : " countries"} selected
            {coveredSet.size > 0 && (
              <span className="text-green-400"> · {coveredSet.size} via region</span>
            )}
          </p>
          <div className="grid max-h-56 grid-cols-2 gap-0.5 overflow-y-auto sm:grid-cols-3">
            {filteredCustom.map((iso) => {
              const covered = coveredSet.has(iso);
              const sel = countries.includes(iso) || covered;
              return (
                <label
                  key={iso}
                  className={`flex items-center gap-2 rounded px-2 py-1.5 ${
                    covered ? "opacity-50" : "cursor-pointer hover:bg-white/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sel}
                    disabled={covered}
                    onChange={() => toggleIndividual(iso)}
                    className="h-3 w-3 accent-accent"
                  />
                  <span className={`truncate text-xs ${sel ? "text-gray-100" : "text-gray-300"}`}>
                    {countryFlag(iso)} {countryName(iso)}
                  </span>
                  {covered && <Lock className="ml-auto h-3 w-3 flex-shrink-0 text-gray-500" />}
                </label>
              );
            })}
          </div>

          {countries.length > 0 && (
            <div className="rounded-md border border-gray-700 bg-primary/30 p-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300">Selected countries</span>
                <button
                  type="button"
                  onClick={() => patch({ countries: [] })}
                  className="text-[11px] text-gray-500 hover:text-red-400"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {countries.map((iso) => (
                  <span
                    key={iso}
                    className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[11px] text-white"
                  >
                    {countryFlag(iso)} {iso}
                    <button
                      type="button"
                      onClick={() => toggleIndividual(iso)}
                      aria-label={`Remove ${iso}`}
                      className="text-gray-300 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coverage preview */}
      <div className="flex items-center justify-between gap-2 border-t border-gray-700 bg-primary/30 px-3 py-2 text-xs">
        <span>
          <span className="text-gray-400">Coverage: </span>
          <span className="font-medium text-white">{coverage}</span>
        </span>
        {(regionCodes.length > 0 || countries.length > 0) && (
          <button
            type="button"
            onClick={() => onChange({ regionCodes: [], countries: [], excludedCountries: [] })}
            className="text-gray-500 hover:text-red-400"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default OfferRegionSelector;
