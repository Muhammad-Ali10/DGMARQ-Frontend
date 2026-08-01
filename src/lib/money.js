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
