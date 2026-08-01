import { describe, it, expect } from 'vitest';
import { formatUSD } from './money';

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
