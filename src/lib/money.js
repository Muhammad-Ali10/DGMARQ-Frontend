/**
 * Money formatting — one module, two deliberately separate paths.
 *
 * There are two different questions a money value can answer on this platform,
 * and collapsing them into a single formatter would misreport one of them:
 *
 *   1. "What does this cost me?"  -> the BUYER's chosen display currency.
 *      Use `useCurrency().format(usd)`. Prices are stored and charged in USD;
 *      that hook converts for presentation only.
 *
 *   2. "What will I be paid?"     -> actual USD, never converted.
 *      Use `formatUSD` here. Payouts, withdrawals, commission and seller
 *      earnings are settled in USD, so rendering them in EUR because the
 *      viewer once picked EUR in the header would tell a seller they are
 *      receiving an amount they are not receiving.
 *
 * This replaces six byte-identical `const formatUsd = ...` copies (seller
 * Earnings + PayoutDetail, admin AdminPayoutDetail + PayoutsManagement, and the
 * Refund/Withdrawal modals) and the ~50 bare `` `$${n.toFixed(2)}` `` literals.
 *
 * Always two decimals, always with the currency symbol, grouped thousands.
 */

import { convertFromUSD, formatDisplayPrice } from './currencyDisplay';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a settlement amount in USD. Non-numeric / missing input renders
 * "$0.00" rather than "$NaN" — these are financial surfaces and a NaN there
 * reads as a system fault.
 *
 * @param {number|string|null|undefined} amount
 * @returns {string} e.g. "$1,234.50"
 */
export const formatUSD = (amount) => {
  const n = Number(amount);
  return usdFormatter.format(Number.isFinite(n) ? n : 0);
};

/**
 * A settlement amount for someone who is PAID in USD but may be reading the site
 * in another currency: "$1,234.50 ≈ €1,136.00".
 *
 * The USD figure stays first and unqualified, because that is the amount that
 * actually moves; the converted one is explicitly approximate, because the rate
 * on payout day is not today's. When the viewer is on USD — or rates have not
 * loaded — this is exactly `formatUSD`: it never guesses a number.
 *
 * Reach for it through `useCurrency().formatSettlement`, which supplies the
 * viewer's currency and the cached rates.
 */
/**
 * Money on an ADMIN money-movement screen: the viewer's currency first (admins
 * asked for every figure to follow the selector), with the USD original beside
 * it — payouts and withdrawals are EXECUTED in USD, so an operator approving a
 * transfer has to see the amount that will actually move. Reach for it through
 * `useCurrency().formatWithUsd`.
 */
export const formatDisplayWithUsd = (amount, { currency, rates } = {}) => {
  const usd = formatUSD(amount);
  if (!currency || currency === 'USD') return usd;
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return convertFromUSD(safe, currency, rates) === null
    ? usd
    : `${formatDisplayPrice(safe, currency, rates)} (USD ${usd})`;
};

export const formatUSDWithApprox = (amount, { currency, rates } = {}) => {
  const usd = formatUSD(amount);
  if (!currency || currency === 'USD') return usd;
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return convertFromUSD(safe, currency, rates) === null
    ? usd
    : `${usd} ≈ ${formatDisplayPrice(safe, currency, rates)}`;
};
