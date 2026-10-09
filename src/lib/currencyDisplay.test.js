import { describe, it, expect } from 'vitest';
import { SUPPORTED_CODES, currencyForCountry } from './currencyDisplay';

describe('currency data', () => {
  it('maps euro-area countries, Bulgaria and Croatia included, to EUR', () => {
    expect(currencyForCountry('BG')).toBe('EUR');
    expect(currencyForCountry('HR')).toBe('EUR');
    expect(currencyForCountry('DE')).toBe('EUR');
  });

  it('no longer offers retired currencies', () => {
    expect(SUPPORTED_CODES).not.toContain('BGN');
    expect(SUPPORTED_CODES).not.toContain('HRK');
  });

  it('falls back to USD for unknown or missing countries', () => {
    expect(currencyForCountry(null)).toBe('USD');
    expect(currencyForCountry('ZZ')).toBe('USD');
  });
});
