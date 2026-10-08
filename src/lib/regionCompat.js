import { ALL_COUNTRY_CODES, REGION_PRESET_MAP } from "./regionPresets";
import { CURRENCY_COUNTRY_CODES } from "./currencyDisplay";

const up = (s) => String(s || "").toUpperCase();

const resolveRegionPresets = (offer) => {
  const out = [];
  for (const code of offer?.regionCodes || []) {
    const preset = REGION_PRESET_MAP.get(up(code));
    if (preset) out.push(preset);
  }
  return out;
};

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

export const isBuyerCompatible = (availability, buyerCountry) => {
  if (!availability) return null;
  if (availability.unrestricted) return true;
  if (!buyerCountry) return null;
  const c = up(buyerCountry);
  if (availability.excluded.has(c)) return false;
  if (availability.global) return true;
  return availability.allowed.has(c);
};

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

export const countryName = (code) => {
  const c = up(code);
  if (!/^[A-Z]{2}$/.test(c)) return code;
  try {
    return getDisplayNames().of(c) || c;
  } catch {
    return c;
  }
};

export const countryFlag = (code) => {
  const c = up(code);
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1a5 + ch.charCodeAt(0)));
};

let countryOptions = null;
export const listCountryOptions = (selected) => {
  if (!countryOptions) {
    countryOptions = [...new Set([...ALL_COUNTRY_CODES, ...CURRENCY_COUNTRY_CODES])]
      .map((iso2) => ({ iso2, name: countryName(iso2) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  const c = up(selected);
  if (!/^[A-Z]{2}$/.test(c) || countryOptions.some((o) => o.iso2 === c)) return countryOptions;
  return [{ iso2: c, name: countryName(c) }, ...countryOptions];
};
