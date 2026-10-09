import { describe, it, expect } from 'vitest';
import { formatOrderAmount, getDisplayOrderId } from './orderDisplay';

describe('formatOrderAmount', () => {
  it('uses the rate frozen on the order, not a live one', () => {
    expect(formatOrderAmount(10, { displayCurrency: 'EUR', displayRate: 0.5 })).toBe('€5.00');
    expect(formatOrderAmount(10, { displayCurrency: 'EUR', displayRate: 0.92 })).toBe('€9.20');
  });

  it('falls back to USD when the order has no usable frozen rate', () => {
    expect(formatOrderAmount(10, { displayCurrency: 'EUR' })).toBe('$10.00');
    expect(formatOrderAmount(10, { displayCurrency: 'EUR', displayRate: 0 })).toBe('$10.00');
    expect(formatOrderAmount(10, {})).toBe('$10.00');
    expect(formatOrderAmount(10, null)).toBe('$10.00');
  });

  it('shows USD orders in USD', () => {
    expect(formatOrderAmount(21.48, { displayCurrency: 'USD', displayRate: 1 })).toBe('$21.48');
  });
});

describe('getDisplayOrderId', () => {
  it('prefers the order number and falls back to the id tail', () => {
    expect(getDisplayOrderId({ orderNumber: ' AB12CD34 ' })).toBe('AB12CD34');
    expect(getDisplayOrderId({ orderId: '64b7f0c2e4b0a1a2b3c4d5e6' })).toBe('B3C4D5E6');
    expect(getDisplayOrderId({}, '')).toBe('');
  });
});
