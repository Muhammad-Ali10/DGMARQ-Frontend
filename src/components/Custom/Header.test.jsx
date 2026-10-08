import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';

vi.mock('@services/api', () => ({
  userAPI: { getWishlist: vi.fn(), getWishlistIds: vi.fn() },
  cartAPI: { getCart: vi.fn() },
  productAPI: { getProducts: vi.fn(), searchSuggestions: vi.fn() },
  categoryAPI: { getCategories: vi.fn() },
  menuAPI: { getMenu: vi.fn() },
}));

const { userAPI, cartAPI, productAPI, categoryAPI, menuAPI } = await import('@services/api');
const Header = (await import('./Header')).default;

const signedIn = { auth: { isAuthenticated: true, user: { _id: 'u1' } } };

beforeEach(() => {
  vi.clearAllMocks();
  userAPI.getWishlistIds.mockResolvedValue({ data: { data: { productIds: [], count: 0, max: 500 } } });
  cartAPI.getCart.mockResolvedValue({ data: { data: { items: [] } } });
  productAPI.getProducts.mockResolvedValue({ data: { data: { docs: [] } } });
  productAPI.searchSuggestions?.mockResolvedValue?.({ data: { data: [] } });
  categoryAPI.getCategories.mockResolvedValue({ data: { data: [] } });
  menuAPI.getMenu.mockResolvedValue({ data: { data: [] } });
});

describe('Header wishlist entry points', () => {
  it('exposes a wishlist control in the mobile top bar', () => {
    renderWithProviders(<Header />, { preloadedState: signedIn });

    expect(screen.getAllByRole('button', { name: 'Wishlist' })).toHaveLength(2);
  });

  it('the mobile control is hidden at desktop widths and vice versa', () => {
    const { container } = renderWithProviders(<Header />, { preloadedState: signedIn });

    const mobileCluster = container.querySelector('.md\\:hidden');
    expect(mobileCluster).toBeTruthy();
    expect(
      within(mobileCluster).getByRole('button', { name: 'Wishlist' })
    ).toBeInTheDocument();
  });

  it('a guest still sees the wishlist control (it routes to sign-in)', () => {
    renderWithProviders(<Header />, {
      preloadedState: { auth: { isAuthenticated: false, user: null } },
    });
    expect(screen.getAllByRole('button', { name: 'Wishlist' }).length).toBeGreaterThan(0);
  });

  it('does not fetch the wishlist for a guest', () => {
    renderWithProviders(<Header />, {
      preloadedState: { auth: { isAuthenticated: false, user: null } },
    });
    expect(userAPI.getWishlistIds).not.toHaveBeenCalled();
  });
});
