

import { REGION_PRESET_MAP } from "./regionPresets";

const up = (s) => String(s || "").toUpperCase();

/** Resolve an offer's preset codes to their preset defs (unknown codes dropped). */
const resolveRegionPresets = (offer) => {
  const out = [];
  for (const code of offer?.regionCodes || []) {
    const preset = REGION_PRESET_MAP.get(up(code));
    if (preset) out.push(preset);
  }
  return out;
};

/**
 * Resolve an offer to an availability descriptor.
 * @returns {{ global:boolean, allowed:Set<string>, excluded:Set<string>, unrestricted:boolean }}
 */
export const resolveOfferAvailability = (offer) => {
  const presets = resolveRegionPresets(offer);
  const global = presets.some((p) => p.isGlobal);
  const excluded = new Set((offer?.excludedCountries || []).map(up));
  const allowed = new Set();
  if (!global) {
    for (const p of presets) for (const c of p.countries || []) allowed.add(up(c));
    for (const c of offer?.countries || []) allowed.add(up(c));
  }
  for (const c of excluded) allowed.delete(c);

  const unrestricted =
    !global &&
    presets.length === 0 &&
    (offer?.countries?.length || 0) === 0 &&
    excluded.size === 0;

  return { global, allowed, excluded, unrestricted };
};

/**
 * Blue/red verdict for a buyer.
 * @returns {true|false|null} true = compatible (blue), false = not (red),
 *   null = can't tell (no regions set, or buyer country unknown) → neutral.
 */
export const isBuyerCompatible = (availability, buyerCountry) => {
  if (!availability) return null;
  if (availability.unrestricted) return true; // no restriction → everyone
  if (!buyerCountry) return null; // unknown buyer → don't guess
  const c = up(buyerCountry);
  if (availability.excluded.has(c)) return false;
  if (availability.global) return true;
  return availability.allowed.has(c);
};

/**
 * Human-readable breakdown for the restriction popup (9D).
 * @returns {{ global:boolean, unrestricted:boolean, regionNames:string[], includedCountries:string[], excludedCountries:string[], countryCount:number|null }}
 */
export const describeOfferAvailability = (offer) => {
  const presets = resolveRegionPresets(offer);
  const availability = resolveOfferAvailability(offer);
  return {
    global: availability.global,
    unrestricted: availability.unrestricted,
    regionNames: presets.filter((p) => !p.isGlobal).map((p) => p.name),
    includedCountries: (offer?.countries || []).map(up),
    excludedCountries: Array.from(availability.excluded),
    countryCount: availability.global ? null : availability.allowed.size,
  };
};

// ── Display helpers ──────────────────────────────────────────────────────────
let displayNames = null;
const getDisplayNames = () => {
  if (displayNames) return displayNames;
  try {
    displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    displayNames = { of: (c) => c };
  }
  return displayNames;
};

/** ISO alpha-2 → English country name (falls back to the code). */
export const countryName = (code) => {
  const c = up(code);
  if (!/^[A-Z]{2}$/.test(c)) return code;
  try {
    return getDisplayNames().of(c) || c;
  } catch {
    return c;
  }
};

/** ISO alpha-2 → 🇵🇰 emoji flag. */
export const countryFlag = (code) => {
  const c = up(code);
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1a5 + ch.charCodeAt(0)));
};
