import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import Dashboard from './Dashboard';

vi.mock('@services/api', () => ({
  sellerAPI: {
    getSellerInfo: vi.fn(),
    getPayoutBalance: vi.fn(),
    getPerformanceMetrics: vi.fn(),
    getPublicPayoutSettings: vi.fn(),
    getMyPayoutAccount: vi.fn(),
  },
  offerAPI: { getMyOfferSummary: vi.fn() },
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
  offerAPI.getMyOfferSummary.mockResolvedValue({ data: { data: { total: 0, lowStockThreshold: 3 } } });
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

  it('renders no rate at all when the endpoint omits it', async () => {
    sellerAPI.getPublicPayoutSettings.mockResolvedValue(settings({ commissionRatePercent: undefined }));
    renderWithProviders(<Dashboard />, { route: '/seller/dashboard' });

    expect(await screen.findByText('Platform commission')).toBeInTheDocument();
    expect(screen.queryByText('Commission rate')).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });
});

describe('seller dashboard action list', () => {
  it('asks for refund requests still waiting on the seller and counts every listing from the summary', async () => {
    offerAPI.getMyOfferSummary.mockResolvedValue({
      data: { data: { total: 120, outOfStock: 2, lowStock: 1, lowStockThreshold: 3 } },
    });
    returnRefundAPI.getSellerRefundList.mockResolvedValue({
      data: { data: { refunds: [{}], pagination: { total: 1 } } },
    });
    renderWithProviders(<Dashboard />, { route: '/seller/dashboard' });

    expect(await screen.findByText('1 refund request waiting for your side')).toBeInTheDocument();
    expect(returnRefundAPI.getSellerRefundList).toHaveBeenCalledWith({ awaiting: 'feedback', limit: 1 });
    expect(screen.getByText('2 live listings out of stock')).toBeInTheDocument();
    expect(screen.getByText('3 keys or fewer remaining. Restock before you sell out.')).toBeInTheDocument();
    expect(screen.getByText('120 listings on the catalog')).toBeInTheDocument();
  });
});
