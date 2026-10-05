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

// Selected DISPLAY currency (M10). Prices are stored/charged in USD; this hook
// only affects presentation. Resolution:
//   1. explicit pick from the header selector (localStorage, wins forever)
//   2. auto-detect from the buyer's country (M9 geo)
//   3. USD
// Rates come from GET /currency/rates, cached by react-query for the session
// (the server refreshes them ~daily), so any number of price renders share a
// single request. Selection lives in a shared pref store so every component in
// the tab updates the moment the header selector changes.

const STORAGE_KEY = "dgmarq_display_currency";
const store = getPrefStore(STORAGE_KEY);

const readValid = () => {
  const v = store.get();
  return v && SUPPORTED_CODES.includes(v) ? v : null;
};

export const useCurrency = () => {
  const stored = useSyncExternalStore(store.subscribe, readValid);
  const { country } = useBuyerCountry();

  const { data: ratesData } = useQuery({
    queryKey: ["currency-rates"],
    queryFn: () => currencyAPI.getRates().then((r) => r.data?.data || null),
    staleTime: 60 * 60 * 1000, // server refreshes ~daily; hourly is plenty
    gcTime: Infinity,
    retry: 1,
  });

  const currency = stored || currencyForCountry(country);
  const rates = ratesData?.rates || null;

  const setCurrency = useCallback((code) => {
    const c = String(code || "").toUpperCase();
    if (SUPPORTED_CODES.includes(c)) store.set(c);
  }, []);

  /** USD → selected currency (number), null when the rate isn't loaded. */
  const convert = useCallback(
    (usdAmount) => convertFromUSD(usdAmount, currency, rates),
    [currency, rates]
  );

  /** USD → formatted string in the selected currency ("€9.19"). */
  const format = useCallback(
    (usdAmount) => formatDisplayPrice(usdAmount, currency, rates),
    [currency, rates]
  );

  /**
   * Settlement money — seller earnings, payouts, withdrawals, commission. USD
   * stays the real figure with the viewer's currency beside it as "≈", because
   * sellers are PAID in USD: rendering "€92.00" on its own would state an amount
   * they never receive.
   */
  const formatSettlement = useCallback(
    (usdAmount) => formatUSDWithApprox(usdAmount, { currency, rates }),
    [currency, rates]
  );

  /**
   * Admin money-movement screens: converted figure first, USD original beside
   * it. See formatDisplayWithUsd for why the USD number cannot be dropped.
   */
  const formatWithUsd = useCallback(
    (usdAmount) => formatDisplayWithUsd(usdAmount, { currency, rates }),
    [currency, rates]
  );

  return {
    currency, // active display code, e.g. "EUR"
    isExplicit: Boolean(stored), // user picked it themselves
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
