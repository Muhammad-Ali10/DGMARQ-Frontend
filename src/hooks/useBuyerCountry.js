import { useCallback, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { geoAPI } from "@services/api";
import { getPrefStore } from "@lib/prefStore";

// The buyer's country drives region blue/red compatibility. Resolution order:
//   1. explicit override the buyer picked (persisted in localStorage)
//   2. layered auto-detect (server CDN/geoip → browser public-IP → default)
// Detection runs ONCE per session (react-query cache). The override lives in a
// shared pref store so every RegionBadges instance in the tab updates the moment
// the buyer changes their country in any popup.

const STORAGE_KEY = "dgmarq_buyer_country";
const store = getPrefStore(STORAGE_KEY);

const readValid = () => {
  const v = store.get();
  return v && /^[A-Z]{2}$/.test(v) ? v : null;
};

// Layered auto-detect, resolving the REAL country everywhere:
//   1. server-side (CDN header / geoip) — instant + free behind a CDN;
//   2. the browser's OWN public-IP lookup — the only source that works on
//      localhost / non-CDN hosts (the server just sees 127.0.0.1 there);
//   3. the configured DEFAULT_BUYER_COUNTRY as a last resort.
const detectBuyerCountry = async () => {
  let serverFallback = null;
  try {
    const { data: body } = await geoAPI.getCountry();
    const d = body?.data;
    if (d?.detected && d.country) return d.country; // real detection wins
    serverFallback = d?.country || null; // configured default (detected:false)
  } catch { /* server down / offline */ }
  try {
    const res = await fetch("https://get.geojs.io/v1/ip/country.json");
    const j = await res.json();
    const c = String(j?.country || "").toUpperCase();
    if (/^[A-Z]{2}$/.test(c)) return c;
  } catch { /* blocked by CSP / offline → use the fallback */ }
  return serverFallback;
};

export const useBuyerCountry = () => {
  const override = useSyncExternalStore(store.subscribe, readValid);

  // Only run detection when the buyer hasn't chosen a country themselves.
  const { data, isLoading } = useQuery({
    queryKey: ["geo-country"],
    queryFn: detectBuyerCountry,
    enabled: !override,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  const setCountry = useCallback((code) => {
    const c = String(code || "").toUpperCase();
    if (/^[A-Z]{2}$/.test(c)) store.set(c);
  }, []);

  const clearCountry = useCallback(() => {
    store.set(null);
  }, []);

  const country = override || data || null;
  return {
    country, // ISO alpha-2 or null (unknown)
    isOverride: Boolean(override),
    isLoading: isLoading && !override,
    setCountry,
    clearCountry,
  };
};

export default useBuyerCountry;
