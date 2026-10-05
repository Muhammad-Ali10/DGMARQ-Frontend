import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import Dashboard from './Dashboard';

// CLIENT REQUIREMENT: a seller must be able to read the commission rate the admin
// has set. Only the settings query matters here; the rest of the dashboard is
// stubbed at the API boundary.
vi.mock('@services/api', () => ({
  sellerAPI: {
    getSellerInfo: vi.fn(),
    getPayoutBalance: vi.fn(),
    getPerformanceMetrics: vi.fn(),
    getPublicPayoutSettings: vi.fn(),
    getMyPayoutAccount: vi.fn(),
  },
  offerAPI: { getMyOffers: vi.fn() },
  returnRefundAPI: { getSellerRefundList: vi.fn() },
}));

const { sellerAPI, offerAPI, returnRefundAPI } = await import('@services/api');

const settings = (overrides = {}) => ({
  data: {
    data: {
      payoutHoldDays: 16,
      minimumWithdrawalUsd: 50,
      refundWindowDays: 30,
      commissionRatePercent: 7,
      featuredCommissionPercent: 3,
      ...overrides,
    },
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  sellerAPI.getSellerInfo.mockResolvedValue({ data: { data: { shopName: 'Pixel Keys' } } });
  sellerAPI.getPayoutBalance.mockResolvedValue({ data: { data: {} } });
  sellerAPI.getPerformanceMetrics.mockResolvedValue({ data: { data: { sales: {} } } });
  sellerAPI.getMyPayoutAccount.mockResolvedValue({ data: { data: null } });
  offerAPI.getMyOffers.mockResolvedValue({ data: { data: { offers: [], pagination: { total: 0 } } } });
  returnRefundAPI.getSellerRefundList.mockResolvedValue({ data: { data: { refunds: [] } } });
  sellerAPI.getPublicPayoutSettings.mockResolvedValue(settings());
});

describe('seller dashboard commission rate', () => {
  it('shows the admin-set rate and the featured surcharge', async () => {
    renderWithProviders(<Dashboard />, { route: '/seller/dashboard' });

    expect(await screen.findByText('Commission rate')).toBeInTheDocument();
    expect(screen.getByText('7%')).toBeInTheDocument();
    expect(screen.getByText('Featured surcharge')).toBeInTheDocument();
    expect(screen.getByText('+3%')).toBeInTheDocument();
  });

  it('hides the surcharge row when the platform charges none', async () => {
    sellerAPI.getPublicPayoutSettings.mockResolvedValue(settings({ featuredCommissionPercent: 0 }));
    renderWithProviders(<Dashboard />, { route: '/seller/dashboard' });

    expect(await screen.findByText('Commission rate')).toBeInTheDocument();
    expect(screen.queryByText('Featured surcharge')).not.toBeInTheDocument();
  });

  // A wrong rate is worse than no rate: if the field ever stops arriving, the row
  // must disappear rather than render "undefined%".
  it('renders no rate at all when the endpoint omits it', async () => {
    sellerAPI.getPublicPayoutSettings.mockResolvedValue(settings({ commissionRatePercent: undefined }));
    renderWithProviders(<Dashboard />, { route: '/seller/dashboard' });

    expect(await screen.findByText('Platform commission')).toBeInTheDocument();
    expect(screen.queryByText('Commission rate')).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });
});
