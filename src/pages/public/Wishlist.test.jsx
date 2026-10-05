import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';

vi.mock('@services/api', () => ({
  userAPI: {
    getWishlist: vi.fn(),
    // The cards on this page take their FILLED state from the shared
    // membership endpoint, not from the page payload — one source of truth for
    // every heart on the site. So the page needs both mocked.
    getWishlistIds: vi.fn(),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
    clearWishlist: vi.fn(),
  },
  cartAPI: { addItem: vi.fn() },
}));

const { userAPI } = await import('@services/api');
const Wishlist = (await import('./Wishlist')).default;

const savedProduct = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Zero Hour',
  slug: 'zero-hour',
  price: 40,
  discount: 25,
  images: ['cover.jpg'],
  platform: { name: 'Steam' },
  productType: 'ACCOUNT_BASED',
  offersCount: 3,
  hasStock: true,
  hasFeaturedOffer: true,
  offerRegionCodes: ['GLOBAL'],
};

const signedIn = { auth: { isAuthenticated: true, user: { _id: 'u1' } } };
/**
 * Shape of the now-PAGINATED GET /wishlist/get-wishlist.
 *
 * `pagination.total` is the size of the WHOLE wishlist, not of this page. The
 * header copy, the Clear-all button and the confirmation modal all read it
 * rather than products.length — otherwise a user with 100 saved items would be
 * told "All 24 saved items will be removed".
 */
const wishlistResponse = (products, { total, max = 500, page = 1, limit = 24 } = {}) => ({
  data: {
    data: {
      products,
      pagination: {
        page,
        limit,
        total: total ?? products.length,
        pages: Math.max(1, Math.ceil((total ?? products.length) / limit)),
      },
      max,
    },
  },
});

/** Membership shape — GET /wishlist/ids. */
const idsResponse = (ids = []) => ({
  data: { data: { productIds: ids, count: ids.length, max: 500 } },
});

beforeEach(() => {
  vi.clearAllMocks();
  userAPI.getWishlist.mockResolvedValue(
    wishlistResponse([{ productId: savedProduct, addedAt: '2026-01-01' }])
  );
  // Everything on this page is saved by definition.
  userAPI.getWishlistIds.mockResolvedValue(idsResponse([savedProduct._id]));
});

describe('Wishlist page', () => {
  // CLIENT REQUIREMENT 2 — same info as a product card, via ProductCard itself.
  // The two hand-rolled grids this replaced showed neither the offer count nor
  // the region badge nor the featured chip, and computed the price in opposite
  // directions from each other. Asserting on card-specific output is what
  // proves the real card is rendering, not a look-alike.
  it('renders saved items using the real ProductCard', async () => {
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });

    expect(await screen.findByText('Zero Hour')).toBeInTheDocument();
    expect(screen.getByText('Steam')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    // "+N more offers" — only ProductCard renders this.
    expect(screen.getByText('+2 more offers')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('prices the item the same way every other card on the site does', async () => {
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });

    // 40 with a 25% discount → 30 now, 40 struck through. The deleted dashboard
    // page divided instead of multiplying and showed a "was" price of 53.33.
    expect(await screen.findByText('$30.00')).toBeInTheDocument();
    expect(screen.getByText('$40.00')).toBeInTheDocument();
    expect(screen.getByText('-25%')).toBeInTheDocument();
  });

  it('links each card to the product page', async () => {
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });
    const link = await screen.findByRole('link', { name: /zero hour/i });
    expect(link).toHaveAttribute('href', '/product/zero-hour');
  });

  it('shows the heart already filled, since everything here is saved', async () => {
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });
    const heart = await screen.findByRole('button', { name: /remove from wishlist/i });
    expect(heart).toHaveAttribute('aria-pressed', 'true');
  });

  // M4 — the wishlist is the one surface that deliberately keeps sold-out
  // items, because watching one until it returns is the reason to save it.
  it('marks a sold-out item and drops its add-to-cart control', async () => {
    userAPI.getWishlist.mockResolvedValue(
      wishlistResponse([{ productId: { ...savedProduct, hasStock: false } }])
    );
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });

    expect(await screen.findByText('Out of stock')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add to cart' })).not.toBeInTheDocument();
  });

  it('keeps add-to-cart on an in-stock item', async () => {
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });
    expect(await screen.findByRole('button', { name: 'Add to cart' })).toBeInTheDocument();
    expect(screen.queryByText('Out of stock')).not.toBeInTheDocument();
  });

  it('counts the saved items', async () => {
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });
    expect(await screen.findByText('1 item saved')).toBeInTheDocument();
  });

  it('drops entries whose product no longer exists', async () => {
    // A populate that resolved to null (product deleted after it was saved)
    // must not render an empty card. Asserted on the CARDS rather than on the
    // count copy: `total` is the server's count of wishlist ENTRIES, which is
    // deliberately not re-derived on the client.
    userAPI.getWishlist.mockResolvedValue(
      wishlistResponse([{ productId: null }, { productId: savedProduct }])
    );
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });

    await screen.findByText('Zero Hour');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('shows an empty state with a route into the catalogue', async () => {
    userAPI.getWishlist.mockResolvedValue(wishlistResponse([]));
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });

    expect(await screen.findByText('Your wishlist is empty')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse products/i })).toHaveAttribute(
      'href',
      '/search'
    );
    expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();
  });

  it('requests the first page on mount', async () => {
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });
    await screen.findByText('Zero Hour');
    expect(userAPI.getWishlist).toHaveBeenCalledWith({ page: 1 });
  });

  it('offers a sign-in route to a guest without calling the API', async () => {
    renderWithProviders(<Wishlist />, {
      preloadedState: { auth: { isAuthenticated: false, user: null } },
    });

    expect(screen.getByText('Sign in to view your wishlist')).toBeInTheDocument();
    expect(userAPI.getWishlist).not.toHaveBeenCalled();
  });

  it('surfaces a load failure with a retry instead of an empty wishlist', async () => {
    // Rendering "your wishlist is empty" after a failed fetch would tell the
    // user their saved items are gone.
    userAPI.getWishlist.mockRejectedValue({ response: { status: 500 } });
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });

    expect(await screen.findByText("Couldn't load your wishlist")).toBeInTheDocument();
    expect(screen.queryByText('Your wishlist is empty')).not.toBeInTheDocument();
  });

  it('shows Clear all only when there is something to clear', async () => {
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });
    expect(await screen.findByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });
});

// The endpoint runs on every page load via the header, and the wishlist is an
// embedded array, so both the cap and the paging exist to keep it bounded.
describe('Wishlist page — paging and the size cap', () => {
  const page = (n, count = 24) =>
    Array.from({ length: count }, (_, i) => ({
      productId: { ...savedProduct, _id: `p${n}-${i}`, name: `Item ${n}-${i}`, slug: `i${n}-${i}` },
    }));

  it('renders pagination once the wishlist spans more than one page', async () => {
    userAPI.getWishlist.mockResolvedValue(wishlistResponse(page(1), { total: 60 }));
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });

    await screen.findByText('Item 1-0');
    expect(await screen.findByRole('button', { name: /^next$/i })).toBeInTheDocument();
    expect(screen.getByText(/60 items saved/i)).toBeInTheDocument();
  });

  it('hides pagination when everything fits on one page', async () => {
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });
    await screen.findByText('Zero Hour');
    // Pagination self-guards at <= 1 page.
    expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument();
  });

  it('fetches the next page when the user pages forward', async () => {
    userAPI.getWishlist.mockResolvedValue(wishlistResponse(page(1), { total: 60 }));
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });
    await screen.findByText('Item 1-0');

    userAPI.getWishlist.mockResolvedValue(wishlistResponse(page(2), { total: 60, page: 2 }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));

    await waitFor(() => expect(userAPI.getWishlist).toHaveBeenCalledWith({ page: 2 }));
    expect(await screen.findByText('Item 2-0')).toBeInTheDocument();
  });

  it('counts the WHOLE wishlist in the clear-all confirmation, not the page', async () => {
    // The bug this guards: with 24 of 60 items on screen, "All 24 saved items
    // will be removed" understates what the button actually does.
    userAPI.getWishlist.mockResolvedValue(wishlistResponse(page(1), { total: 60 }));
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });
    await screen.findByText('Item 1-0');

    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));

    expect(await screen.findByText(/All 60 saved items will be removed/i)).toBeInTheDocument();
  });

  it('stays quiet about the cap when the user is nowhere near it', async () => {
    // Telling someone with 1 saved item that they may save 500 makes the page
    // feel constrained for no reason.
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });
    await screen.findByText('Zero Hour');
    expect(screen.queryByText(/of 500 used/i)).not.toBeInTheDocument();
  });

  it('warns as the cap comes into sight', async () => {
    userAPI.getWishlist.mockResolvedValue(wishlistResponse(page(1), { total: 460, max: 500 }));
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });
    await screen.findByText('Item 1-0');
    expect(screen.getByText(/460 of 500 used/i)).toBeInTheDocument();
  });

  it('shows the cap as reached at the limit', async () => {
    userAPI.getWishlist.mockResolvedValue(wishlistResponse(page(1), { total: 500, max: 500 }));
    renderWithProviders(<Wishlist />, { preloadedState: signedIn });
    await screen.findByText('Item 1-0');
    expect(screen.getByText(/500 of 500 used/i)).toBeInTheDocument();
  });
});
