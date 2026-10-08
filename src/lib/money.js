import { convertFromUSD, formatDisplayPrice } from './currencyDisplay';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatUSD = (amount) => {
  const n = Number(amount);
  return usdFormatter.format(Number.isFinite(n) ? n : 0);
};

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
