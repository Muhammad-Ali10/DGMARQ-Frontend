import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';

// Header pulls in a lot that is irrelevant to this requirement (menu, currency,
// search suggestions, mini-cart). Only the wishlist affordance is under test,
// so the rest is stubbed at the API boundary.
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
  // CLIENT REQUIREMENT 1c — a wishlist link in the MOBILE TOP navigation.
  // Before this, the mobile top bar held the logo and the hamburger only, and
  // the drawer had no wishlist entry: the sole mobile route to the wishlist was
  // the separate bottom bar.
  it('exposes a wishlist control in the mobile top bar', () => {
    renderWithProviders(<Header />, { preloadedState: signedIn });

    // Exactly two: one in the mobile top bar, one in the desktop action row.
    // Both exist in the DOM at once; Tailwind's md: breakpoint decides which is
    // visible. Before this requirement was built there was only the desktop
    // one, so an exact count is what makes this test able to fail.
    expect(screen.getAllByRole('button', { name: 'Wishlist' })).toHaveLength(2);
  });

  it('the mobile control is hidden at desktop widths and vice versa', () => {
    const { container } = renderWithProviders(<Header />, { preloadedState: signedIn });

    // The mobile cluster carries md:hidden; the desktop row carries hidden md:flex.
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
