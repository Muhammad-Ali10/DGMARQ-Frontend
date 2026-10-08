import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';

const geo = { resolve: null };

vi.mock('@services/api', () => ({
  currencyAPI: {
    getRates: vi.fn(async () => ({ data: { data: { rates: { PKR: 280, EUR: 0.9 } } } })),
    setDisplayCurrency: vi.fn(async () => ({ data: { data: {} } })),
  },
  geoAPI: {
    getCountry: vi.fn(
      () => new Promise((resolve) => {
        geo.resolve = (country) => resolve({ data: { data: { detected: true, country } } });
      })
    ),
  },
}));

const { currencyAPI } = await import('@services/api');
const { useCurrencySync } = await import('./useCurrencySync');

const Probe = () => {
  useCurrencySync();
  return null;
};

const signedIn = (displayCurrency) => ({
  auth: { isAuthenticated: true, roles: ['customer'], user: { _id: 'u1', displayCurrency } },
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  geo.resolve = null;
});

describe('useCurrencySync', () => {
  it('does not overwrite the saved currency with USD while the country is still loading', async () => {
    renderWithProviders(<Probe />, { preloadedState: signedIn('PKR') });

    await waitFor(() => expect(geo.resolve).toBeTypeOf('function'));
    await new Promise((r) => setTimeout(r, 20));
    expect(currencyAPI.setDisplayCurrency).not.toHaveBeenCalled();

    geo.resolve('PK');
    await new Promise((r) => setTimeout(r, 20));
    expect(currencyAPI.setDisplayCurrency).not.toHaveBeenCalled();
  });

  it('syncs once the detected country implies a different currency', async () => {
    renderWithProviders(<Probe />, { preloadedState: signedIn('PKR') });

    await waitFor(() => expect(geo.resolve).toBeTypeOf('function'));
    geo.resolve('DE');

    await waitFor(() => expect(currencyAPI.setDisplayCurrency).toHaveBeenCalledTimes(1));
    expect(currencyAPI.setDisplayCurrency).toHaveBeenCalledWith('EUR');
  });
});
