import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';

vi.mock('@services/api', () => ({
  userAPI: {
    getWishlist: vi.fn(), getWishlistIds: vi.fn(),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
  },
}));

vi.mock('@utils/toast', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
  showApiError: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}));

const { userAPI } = await import('@services/api');
const { showError } = await import('@utils/toast');
const ProductCard = (await import('../components/ProductCard')).default;

const PRODUCT_ID = '507f1f77bcf86cd799439011';
const product = {
  _id: PRODUCT_ID,
  name: 'Zero Hour',
  slug: 'zero-hour',
  price: 100,
  platform: { name: 'Steam' },
  images: ['cover.jpg'],
};

const signedIn = { auth: { isAuthenticated: true, user: { _id: 'u1' } } };

const wishlistResponse = (ids = []) => ({
  data: { data: { productIds: ids, count: ids.length, max: 500 } },
});

const heart = () => screen.getByRole('button', { name: /wishlist/i });

beforeEach(() => {
  vi.clearAllMocks();
  userAPI.getWishlistIds.mockResolvedValue(wishlistResponse([]));
  userAPI.addToWishlist.mockResolvedValue({ data: {} });
  userAPI.removeFromWishlist.mockResolvedValue({ data: {} });
});

describe('ProductCard wishlist heart', () => {
  it('renders filled when the product is already on the wishlist', async () => {
    userAPI.getWishlistIds.mockResolvedValue(
      wishlistResponse([PRODUCT_ID])
    );

    renderWithProviders(<ProductCard product={product} />, { preloadedState: signedIn });

    await waitFor(() =>
      expect(heart()).toHaveAccessibleName('Remove from wishlist')
    );
    expect(heart()).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders empty when the product is not on the wishlist', async () => {
    renderWithProviders(<ProductCard product={product} />, { preloadedState: signedIn });

    await waitFor(() => expect(userAPI.getWishlistIds).toHaveBeenCalled());
    expect(heart()).toHaveAccessibleName('Add to wishlist');
    expect(heart()).toHaveAttribute('aria-pressed', 'false');
  });

  it('a saved product REMOVES on click — it does not try to add again', async () => {
    userAPI.getWishlistIds.mockResolvedValue(
      wishlistResponse([PRODUCT_ID])
    );
    renderWithProviders(<ProductCard product={product} />, { preloadedState: signedIn });
    await waitFor(() => expect(heart()).toHaveAttribute('aria-pressed', 'true'));

    fireEvent.click(heart());

    await waitFor(() =>
      expect(userAPI.removeFromWishlist).toHaveBeenCalledWith({ productId: PRODUCT_ID })
    );
    expect(userAPI.addToWishlist).not.toHaveBeenCalled();
  });

  it('an unsaved product adds on click', async () => {
    renderWithProviders(<ProductCard product={product} />, { preloadedState: signedIn });
    await waitFor(() => expect(userAPI.getWishlistIds).toHaveBeenCalled());

    fireEvent.click(heart());

    await waitFor(() =>
      expect(userAPI.addToWishlist).toHaveBeenCalledWith({ productId: PRODUCT_ID })
    );
    expect(userAPI.removeFromWishlist).not.toHaveBeenCalled();
  });

  it('refetches the shared wishlist entry after a toggle, so the badges update', async () => {
    renderWithProviders(<ProductCard product={product} />, { preloadedState: signedIn });
    await waitFor(() => expect(userAPI.getWishlistIds).toHaveBeenCalledTimes(1));

    fireEvent.click(heart());

    await waitFor(() => expect(userAPI.getWishlistIds).toHaveBeenCalledTimes(2));
  });

  it('flips immediately on click rather than waiting for the round trip', async () => {
    let resolveAdd;
    userAPI.addToWishlist.mockReturnValue(new Promise((r) => { resolveAdd = r; }));

    renderWithProviders(<ProductCard product={product} />, { preloadedState: signedIn });
    await waitFor(() => expect(heart()).toHaveAttribute('aria-pressed', 'false'));

    fireEvent.click(heart());

    await waitFor(() => expect(heart()).toHaveAttribute('aria-pressed', 'true'));
    resolveAdd({ data: {} });
  });

  it('rolls back when the save genuinely fails', async () => {
    userAPI.addToWishlist.mockRejectedValue({ response: { status: 500 } });

    renderWithProviders(<ProductCard product={product} />, { preloadedState: signedIn });
    await waitFor(() => expect(heart()).toHaveAttribute('aria-pressed', 'false'));

    fireEvent.click(heart());

    await waitFor(() => expect(heart()).toHaveAttribute('aria-pressed', 'false'));
  });

  it('treats a 400 "already exists" as success, not an error', async () => {
    userAPI.addToWishlist.mockRejectedValue({
      response: { status: 400, data: { message: 'Product already exists in wishlist' } },
    });
    userAPI.getWishlistIds
      .mockResolvedValueOnce(wishlistResponse([]))
      .mockResolvedValue(wishlistResponse([PRODUCT_ID]));

    renderWithProviders(<ProductCard product={product} />, { preloadedState: signedIn });
    await waitFor(() => expect(heart()).toHaveAttribute('aria-pressed', 'false'));

    fireEvent.click(heart());

    await waitFor(() => expect(heart()).toHaveAttribute('aria-pressed', 'true'));
  });

  it('surfaces the server message when the wishlist is full', async () => {
    const message =
      'Your wishlist is full — it holds up to 500 items. Remove something you no longer want, then add this again.';
    userAPI.addToWishlist.mockRejectedValue({
      response: { status: 409, data: { message } },
    });

    renderWithProviders(<ProductCard product={product} />, { preloadedState: signedIn });
    await waitFor(() => expect(heart()).toHaveAttribute('aria-pressed', 'false'));

    fireEvent.click(heart());

    await waitFor(() => expect(heart()).toHaveAttribute('aria-pressed', 'false'));
    await waitFor(() => expect(showError).toHaveBeenCalledWith(message));
  });

  it('falls back to its own wording if the server sends no message', async () => {
    userAPI.addToWishlist.mockRejectedValue({ response: { status: 409, data: {} } });

    renderWithProviders(<ProductCard product={product} />, { preloadedState: signedIn });
    await waitFor(() => expect(heart()).toHaveAttribute('aria-pressed', 'false'));

    fireEvent.click(heart());

    await waitFor(() =>
      expect(showError).toHaveBeenCalledWith(expect.stringMatching(/wishlist is full/i))
    );
  });

  it('sends a signed-out visitor to login instead of calling the API', async () => {
    renderWithProviders(<ProductCard product={product} />, {
      preloadedState: { auth: { isAuthenticated: false, user: null } },
    });

    fireEvent.click(heart());

    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(userAPI.addToWishlist).not.toHaveBeenCalled();
    expect(userAPI.getWishlistIds).not.toHaveBeenCalled();
  });

  it('clicking the heart does not also open the product page', async () => {
    renderWithProviders(<ProductCard product={product} />, { preloadedState: signedIn });
    await waitFor(() => expect(userAPI.getWishlistIds).toHaveBeenCalled());

    const notDefaultPrevented = fireEvent.click(heart());

    expect(notDefaultPrevented).toBe(false);
    await waitFor(() => expect(userAPI.addToWishlist).toHaveBeenCalled());
  });

  it('N cards on a page share a single wishlist request', async () => {
    renderWithProviders(
      <>
        <ProductCard product={product} />
        <ProductCard product={{ ...product, _id: 'b', slug: 'b' }} />
        <ProductCard product={{ ...product, _id: 'c', slug: 'c' }} />
      </>,
      { preloadedState: signedIn }
    );

    await waitFor(() => expect(userAPI.getWishlistIds).toHaveBeenCalled());
    expect(userAPI.getWishlistIds).toHaveBeenCalledTimes(1);
  });

  it('hearts for the same product on different cards stay in agreement', async () => {
    renderWithProviders(
      <>
        <ProductCard product={product} />
        <ProductCard product={product} />
      </>,
      { preloadedState: signedIn }
    );
    await waitFor(() => expect(userAPI.getWishlistIds).toHaveBeenCalled());

    userAPI.getWishlistIds.mockResolvedValue(
      wishlistResponse([PRODUCT_ID])
    );

    const hearts = screen.getAllByRole('button', { name: /wishlist/i });
    expect(hearts).toHaveLength(2);
    fireEvent.click(hearts[0]);

    await waitFor(() => {
      for (const h of screen.getAllByRole('button', { name: /wishlist/i })) {
        expect(h).toHaveAttribute('aria-pressed', 'true');
      }
    });
    expect(userAPI.addToWishlist).toHaveBeenCalledTimes(1);
  });
});
