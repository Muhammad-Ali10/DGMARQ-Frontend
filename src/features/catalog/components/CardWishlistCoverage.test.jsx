import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';

vi.mock('@services/api', () => ({
  userAPI: { getWishlist: vi.fn(), getWishlistIds: vi.fn(), addToWishlist: vi.fn(), removeFromWishlist: vi.fn() },
  cartAPI: { addItem: vi.fn() },
}));

const { userAPI } = await import('@services/api');
const ProductCard = (await import('./ProductCard')).default;
const MicrosoftCard = (await import('./MicrosoftCard')).default;
const CategoryProduct = (await import('./CategoryProduct')).default;

const PRODUCT_ID = '507f1f77bcf86cd799439011';
const product = {
  _id: PRODUCT_ID,
  name: 'Microsoft Office 2024 | LTSC Standard (PC)',
  slug: 'office-2024',
  price: 40,
  images: ['cover.jpg'],
  platform: { name: 'Steam' },
  region: { name: 'Global' },
  offersCount: 1,
  hasStock: true,
};

const signedIn = { auth: { isAuthenticated: true, user: { _id: 'u1' } } };
const wishlistResponse = (ids = []) => ({
  data: { data: { productIds: ids, count: ids.length, max: 500 } },
});

beforeEach(() => {
  vi.clearAllMocks();
  userAPI.getWishlistIds.mockResolvedValue(wishlistResponse([]));
  userAPI.addToWishlist.mockResolvedValue({ data: {} });
  userAPI.removeFromWishlist.mockResolvedValue({ data: {} });
});

const CARDS = [
  ['ProductCard', ProductCard],
  ['MicrosoftCard', MicrosoftCard],
  ['CategoryProduct', CategoryProduct],
];

describe.each(CARDS)('%s — wishlist heart', (name, Card) => {
  it('renders a wishlist toggle', async () => {
    renderWithProviders(<Card product={product} />, { preloadedState: signedIn });
    await waitFor(() => expect(userAPI.getWishlistIds).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /wishlist/i })).toBeInTheDocument();
  });

  it('reflects the saved state from the shared cache', async () => {
    userAPI.getWishlistIds.mockResolvedValue(
      wishlistResponse([PRODUCT_ID])
    );
    renderWithProviders(<Card product={product} />, { preloadedState: signedIn });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /wishlist/i })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    );
  });

  it('saves on click and does not navigate away', async () => {
    renderWithProviders(<Card product={product} />, { preloadedState: signedIn });
    await waitFor(() => expect(userAPI.getWishlistIds).toHaveBeenCalled());

    const notDefaultPrevented = fireEvent.click(
      screen.getByRole('button', { name: /wishlist/i })
    );

    expect(notDefaultPrevented).toBe(false);
    await waitFor(() =>
      expect(userAPI.addToWishlist).toHaveBeenCalledWith({ productId: PRODUCT_ID })
    );
  });

  it('removes a saved product rather than re-adding it', async () => {
    userAPI.getWishlistIds.mockResolvedValue(
      wishlistResponse([PRODUCT_ID])
    );
    renderWithProviders(<Card product={product} />, { preloadedState: signedIn });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /wishlist/i })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    );

    fireEvent.click(screen.getByRole('button', { name: /wishlist/i }));

    await waitFor(() =>
      expect(userAPI.removeFromWishlist).toHaveBeenCalledWith({ productId: PRODUCT_ID })
    );
    expect(userAPI.addToWishlist).not.toHaveBeenCalled();
  });

  it('positions the heart in the top-right corner', async () => {
    renderWithProviders(<Card product={product} />, { preloadedState: signedIn });
    await waitFor(() => expect(userAPI.getWishlistIds).toHaveBeenCalled());

    const cls = screen.getByRole('button', { name: /wishlist/i }).className;
    expect(cls).toMatch(/\babsolute\b/);
    expect(cls).toMatch(/\btop-\d/);
    expect(cls).toMatch(/\bright-\d/);
  });
});
