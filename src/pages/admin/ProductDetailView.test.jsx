import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../../test/render';
import ProductDetailView from './ProductDetailView';
import { adminAPI, masterCatalogAPI } from '@services/api';

vi.mock('@services/api', () => ({
  adminAPI: { getProductDetails: vi.fn() },
  masterCatalogAPI: { getProductOffers: vi.fn() },
  offerAPI: { adminApproveOffer: vi.fn(), adminRejectOffer: vi.fn(), adminDecideFeatured: vi.fn() },
}));

vi.mock('@hooks/useCurrency', () => ({
  default: () => ({ format: (n) => `$${Number(n).toFixed(2)}` }),
}));

vi.mock('@hooks/useOfferModeration', () => ({
  useOfferModeration: () => ({
    remove: { mutate: vi.fn(), isPending: false },
    restore: { mutate: vi.fn(), isPending: false },
  }),
}));

const master = (overrides = {}) => ({
  _id: 'prod-1',
  name: 'Battlefield 3 Premium',
  slug: 'battlefield-3-premium',
  description: 'A shooter.',
  productType: 'LICENSE_KEY',
  status: 'active',
  images: [],
  hasStock: false,
  offersCount: 0,
  lowestPrice: null,
  totalKeysCount: 0,
  availableKeysCount: 0,
  categoryId: { name: 'Games' },
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const offer = (overrides = {}) => ({
  _id: 'offer-1',
  price: 12.99,
  discount: 0,
  status: 'pending',
  availableKeysCount: 5,
  sellerId: { _id: 'seller-1', shopName: 'GameKeys' },
  ...overrides,
});

const renderPage = () =>
  renderWithProviders(
    <Routes>
      <Route path="/admin/products/:productId" element={<ProductDetailView />} />
    </Routes>,
    { route: '/admin/products/prod-1' }
  );

const resolve = (product, offers = []) => {
  adminAPI.getProductDetails.mockResolvedValue({ data: { data: product } });
  masterCatalogAPI.getProductOffers.mockResolvedValue({ data: { data: offers } });
};

describe('Admin product details', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not offer a storefront link for a product buyers cannot open', async () => {
    resolve(master(), []);
    renderPage();

    expect(await screen.findByRole('heading', { name: /battlefield 3 premium/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /view on site/i })).not.toBeInTheDocument();
    expect(screen.getByText(/hidden — needs an approved offer with stock/i)).toBeInTheDocument();
  });

  it('links to the storefront once the product is live, using its slug', async () => {
    resolve(master({ hasStock: true, offersCount: 1, lowestPrice: 12.99 }), [
      offer({ status: 'approved' }),
    ]);
    renderPage();

    const link = await screen.findByRole('link', { name: /view on site/i });
    expect(link).toHaveAttribute('href', '/product/battlefield-3-premium');
  });

  it('always offers the edit route', async () => {
    resolve(master(), []);
    renderPage();

    expect(await screen.findByRole('link', { name: /edit/i })).toHaveAttribute(
      'href',
      '/admin/catalog/prod-1/edit'
    );
  });

  it('surfaces offers that are waiting on the admin', async () => {
    resolve(master({ offersCount: 2 }), [offer(), offer({ _id: 'offer-2', status: 'approved' })]);
    renderPage();

    expect(await screen.findByText(/1 awaiting review/i)).toBeInTheDocument();
    expect(screen.getByText(/offers need your decision/i)).toBeInTheDocument();
  });

  it('explains an empty offer list instead of showing an empty table', async () => {
    resolve(master(), []);
    renderPage();

    expect(await screen.findByText(/no seller has listed this product yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
