import { useCallback, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { currencyAPI } from "@services/api";
import {
  SUPPORTED_CODES,
  currencyForCountry,
  convertFromUSD,
  formatDisplayPrice,
} from "@lib/currencyDisplay";
import { formatDisplayWithUsd, formatUSDWithApprox } from "@lib/money";
import { getPrefStore } from "@lib/prefStore";
import useBuyerCountry from "./useBuyerCountry";

const STORAGE_KEY = "dgmarq_display_currency";
const store = getPrefStore(STORAGE_KEY);

const readValid = () => {
  const v = store.get();
  return v && SUPPORTED_CODES.includes(v) ? v : null;
};

export const useCurrency = () => {
  const stored = useSyncExternalStore(store.subscribe, readValid);
  const { country, isLoading: countryLoading } = useBuyerCountry();

  const { data: ratesData } = useQuery({
    queryKey: ["currency-rates"],
    queryFn: () => currencyAPI.getRates().then((r) => r.data?.data || null),
    staleTime: 60 * 60 * 1000,
    gcTime: Infinity,
    retry: 1,
  });

  const currency = stored || currencyForCountry(country);
  const rates = ratesData?.rates || null;

  const setCurrency = useCallback((code) => {
    const c = String(code || "").toUpperCase();
    if (SUPPORTED_CODES.includes(c)) store.set(c);
  }, []);

  const convert = useCallback(
    (usdAmount) => convertFromUSD(usdAmount, currency, rates),
    [currency, rates]
  );

  const format = useCallback(
    (usdAmount) => formatDisplayPrice(usdAmount, currency, rates),
    [currency, rates]
  );

  const formatSettlement = useCallback(
    (usdAmount) => formatUSDWithApprox(usdAmount, { currency, rates }),
    [currency, rates]
  );

  const formatWithUsd = useCallback(
    (usdAmount) => formatDisplayWithUsd(usdAmount, { currency, rates }),
    [currency, rates]
  );

  return {
    currency,
    isExplicit: Boolean(stored),
    isResolved: Boolean(stored) || !countryLoading,
    rates,
    ratesUpdatedAt: ratesData?.updatedAt || null,
    setCurrency,
    convert,
    format,
    formatSettlement,
    formatWithUsd,
  };
};

export default useCurrency;
