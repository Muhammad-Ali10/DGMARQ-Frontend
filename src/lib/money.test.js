import { describe, it, expect } from 'vitest';
import { formatUSD, formatUSDWithApprox, formatDisplayWithUsd } from './money';

// Rates are "1 USD = N of the currency", the shape GET /currency/rates returns.
const RATES = { EUR: 0.92, JPY: 150 };

describe('formatUSD', () => {
  it('always shows two decimals and the symbol', () => {
    expect(formatUSD(0)).toBe('$0.00');
    expect(formatUSD(5)).toBe('$5.00');
    expect(formatUSD(5.5)).toBe('$5.50');
  });

  it('groups thousands', () => {
    expect(formatUSD(1234.5)).toBe('$1,234.50');
    expect(formatUSD(1000000)).toBe('$1,000,000.00');
  });

  it('coerces numeric strings, which the payout endpoints can return', () => {
    expect(formatUSD('12.3')).toBe('$12.30');
  });

  // These are financial surfaces — a stray "$NaN" reads as a system fault, so
  // every non-numeric input has to land on a real amount instead.
  it('renders $0.00 rather than NaN for missing or unusable input', () => {
    expect(formatUSD(null)).toBe('$0.00');
    expect(formatUSD(undefined)).toBe('$0.00');
    expect(formatUSD('')).toBe('$0.00');
    expect(formatUSD('abc')).toBe('$0.00');
    expect(formatUSD(NaN)).toBe('$0.00');
    expect(formatUSD(Infinity)).toBe('$0.00');
    expect(formatUSD({})).toBe('$0.00');
  });

  it('keeps the sign on negatives (refund and adjustment rows)', () => {
    expect(formatUSD(-12.5)).toBe('-$12.50');
  });

  it('rounds at the cent', () => {
    expect(formatUSD(1.005)).toBe('$1.01');
    expect(formatUSD(0.994)).toBe('$0.99');
  });
});

// M10: the seller dashboard follows the currency selector, but a seller is PAID
// in USD — so the USD figure stays primary and the converted one is marked as an
// approximation. The rule these guard: never show a converted number alone, and
// never invent one when the rates are not there.
describe('formatUSDWithApprox (seller settlement)', () => {
  it('adds the viewer currency beside the USD amount', () => {
    expect(formatUSDWithApprox(100, { currency: 'EUR', rates: RATES })).toBe('$100.00 ≈ €92.00');
  });

  it('is plain USD for a USD viewer', () => {
    expect(formatUSDWithApprox(100, { currency: 'USD', rates: RATES })).toBe('$100.00');
    expect(formatUSDWithApprox(100)).toBe('$100.00');
  });

  it('falls back to USD alone when the rate is missing — it never guesses', () => {
    expect(formatUSDWithApprox(100, { currency: 'EUR', rates: null })).toBe('$100.00');
    expect(formatUSDWithApprox(100, { currency: 'EUR', rates: { GBP: 0.8 } })).toBe('$100.00');
  });

  it('still refuses to print NaN', () => {
    expect(formatUSDWithApprox('abc', { currency: 'EUR', rates: RATES })).toBe('$0.00 ≈ €0.00');
  });
});

// Admin money-movement screens: converted first (admins asked for every figure
// to follow the selector) with the USD original kept, because the transfer that
// actually leaves the platform is in USD.
describe('formatDisplayWithUsd (admin payouts)', () => {
  it('leads with the viewer currency and keeps the USD original', () => {
    expect(formatDisplayWithUsd(100, { currency: 'EUR', rates: RATES })).toBe('€92.00 (USD $100.00)');
  });

  it('does not repeat itself for a USD viewer', () => {
    expect(formatDisplayWithUsd(100, { currency: 'USD', rates: RATES })).toBe('$100.00');
  });

  it('drops to USD when the rate is unavailable', () => {
    expect(formatDisplayWithUsd(100, { currency: 'EUR', rates: {} })).toBe('$100.00');
  });

  it('respects currencies with no minor unit', () => {
    expect(formatDisplayWithUsd(10, { currency: 'JPY', rates: RATES })).toBe('¥1,500 (USD $10.00)');
  });
});
