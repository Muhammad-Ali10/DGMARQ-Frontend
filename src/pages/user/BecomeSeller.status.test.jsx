import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';

const statusResponse = { current: null, fail: false };
vi.mock('@services/api', () => ({
  sellerAPI: {
    checkSellerApplicationStatus: vi.fn(async () => {
      if (statusResponse.fail) throw Object.assign(new Error('Service unavailable'), { response: { status: 503, data: { message: 'Service unavailable' } } });
      return { data: { data: statusResponse.current } };
    }),
    getTaxIdTypes: vi.fn(async () => ({ data: { data: { countries: {}, defaults: {} } } })),
  },
}));
vi.mock('react-country-state-city', () => ({
  GetCountries: vi.fn(async () => []),
  GetState: vi.fn(async () => []),
  GetCity: vi.fn(async () => []),
}));
vi.mock('react-country-state-city/dist/react-country-state-city.css', () => ({}));

const { default: BecomeSeller } = await import('./BecomeSeller');

const seller = (status, extra = {}) => ({ hasApplication: true, seller: { shopName: 'Rita Shop', sellerType: 'individual', status, ...extra } });

describe('BecomeSeller application status', () => {
  beforeEach(() => { statusResponse.current = null; statusResponse.fail = false; });

  it('shows an error instead of an empty application form when the status cannot be loaded', async () => {
    statusResponse.fail = true;
    renderWithProviders(<BecomeSeller />);
    expect(await screen.findByText("We couldn't load your seller application")).toBeInTheDocument();
    expect(screen.queryByText(/Complete the steps below to apply/i)).toBeNull();
  });

  it('shows a rejected application with the reason and lets the applicant apply again', async () => {
    statusResponse.current = seller('rejected', { rejectionReason: 'ID photo is blurry' });
    renderWithProviders(<BecomeSeller />);
    expect(await screen.findByText('Application Rejected')).toBeInTheDocument();
    expect(screen.getByText(/ID photo is blurry/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /apply again/i }));
    await waitFor(() => expect(screen.getByText(/Complete the steps below to apply/i)).toBeInTheDocument());
  });

  it('describes a banned seller as suspended, with no way to re-apply', async () => {
    statusResponse.current = seller('banned');
    renderWithProviders(<BecomeSeller />);
    expect(await screen.findByText('Seller account suspended')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /apply again/i })).toBeNull();
  });

  it('still shows a pending application as under review', async () => {
    statusResponse.current = seller('pending');
    renderWithProviders(<BecomeSeller />);
    expect(await screen.findByText('Application Under Review')).toBeInTheDocument();
  });
});
