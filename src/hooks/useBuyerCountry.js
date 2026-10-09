import { useCallback, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { geoAPI } from "@services/api";
import { getPrefStore } from "@lib/prefStore";

const STORAGE_KEY = "dgmarq_buyer_country";
const store = getPrefStore(STORAGE_KEY);

const readValid = () => {
  const v = store.get();
  return v && /^[A-Z]{2}$/.test(v) ? v : null;
};

const detectBuyerCountry = async () => {
  let serverFallback = null;
  try {
    const { data: body } = await geoAPI.getCountry();
    const d = body?.data;
    if (d?.detected && d.country) return d.country;
    serverFallback = d?.country || null;
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
    country,
    isOverride: Boolean(override),
    isLoading: isLoading && !override,
    setCountry,
    clearCountry,
  };
};

export default useBuyerCountry;
