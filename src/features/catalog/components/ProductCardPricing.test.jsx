import { describe, it, expect, vi, beforeEach } from 'vitest';
import { within } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';
import { calculateProductPrice } from '../utils/productUtils';

vi.mock('@services/api', () => ({
  userAPI: { getWishlist: vi.fn(), getWishlistIds: vi.fn() },
  cartAPI: { addItem: vi.fn() },
}));

const { userAPI } = await import('@services/api');
const ProductCard = (await import('./ProductCard')).default;

beforeEach(() => {
  vi.clearAllMocks();
  userAPI.getWishlistIds.mockResolvedValue({ data: { data: { productIds: [], count: 0, max: 500 } } });
});

const card = (over = {}) => ({
  _id: 'p1',
  name: 'Zero Hour',
  slug: 'zero-hour',
  images: ['cover.jpg'],
  platform: { name: 'Steam' },
  discount: 0,
  offersCount: 1,
  hasStock: true,
  ...over,
});

const isHidden = (el) =>
  !el || el.getAttribute('aria-hidden') === 'true' || el.className.includes('invisible');

const renderedPrice = () => {
  const container = document.body;
  const now = within(container).getAllByText(/^\$\d/)[0];
  const was = container.querySelector('del');
  const badge = [...container.querySelectorAll('h3')].find((h) => /^-\d/.test(h.textContent));
  return {
    now: now?.textContent,
    was: isHidden(was) ? null : was.textContent,
    badge: isHidden(badge) ? null : badge.textContent,
  };
};

describe('W10 — card pricing across real rollup shapes', () => {
  it('seller running 20% off a $10 listing now shows $8, not $10', () => {
    renderWithProviders(
      <ProductCard product={card({ price: 10, lowestEffectivePrice: 8 })} />
    );

    const shown = renderedPrice();
    expect(shown.now).toBe('$8.00');
    expect(shown.was).toBe('$10.00');
    expect(shown.badge).toBe('-20%');
  });

  it('a listing with no seller discount is unchanged', () => {
    renderWithProviders(
      <ProductCard product={card({ price: 24.99, lowestEffectivePrice: 24.99 })} />
    );

    const shown = renderedPrice();
    expect(shown.now).toBe('$24.99');
    expect(shown.was).toBeNull();
    expect(shown.badge).toBeNull();
  });

  it('an endpoint that does not project the field still renders the old way', () => {
    renderWithProviders(<ProductCard product={card({ price: 15 })} />);
    expect(renderedPrice().now).toBe('$15.00');
  });

  it('an explicit discountedPrice outranks the rollup', () => {
    renderWithProviders(
      <ProductCard
        product={card({
          price: 50,
          lowestEffectivePrice: 45,
          discountedPrice: 30,
        })}
      />
    );
    expect(renderedPrice().now).toBe('$30.00');
  });
});

describe('W10 — calculateProductPrice reads lowestEffectivePrice', () => {
  it('matches what the product detail page computes for the same offer', () => {
    const fromOffer = calculateProductPrice({ price: 10, discount: 20 });
    const fromCard = calculateProductPrice({ price: 10, lowestEffectivePrice: 8 });

    expect(fromCard.discountPrice).toBe(fromOffer.discountPrice);
    expect(fromCard.discountPercentage).toBe(fromOffer.discountPercentage);
    expect(fromCard.originalPrice).toBe(fromOffer.originalPrice);
  });

  it('derives a whole-number badge despite 2dp price rounding', () => {
    const r = calculateProductPrice({ price: 9.99, lowestEffectivePrice: 7.99 });
    expect(r.discountPrice).toBe(7.99);
    expect(r.discountPercentage).toBe(20);
  });

  it('a stale master discount can no longer contradict the shown price', () => {
    const r = calculateProductPrice({ price: 10, discount: 10, lowestEffectivePrice: 8 });
    expect(r.discountPrice).toBe(8);
    expect(r.discountPercentage).toBe(20);
  });

  it('ignores a rollup value that is not below the base price', () => {
    const r = calculateProductPrice({ price: 10, lowestEffectivePrice: 10 });
    expect(r.discountPrice).toBe(10);
    expect(r.discountPercentage).toBe(0);
  });

  it('ignores a null rollup (product with no live offers)', () => {
    const r = calculateProductPrice({ price: 10, lowestEffectivePrice: null });
    expect(r.discountPrice).toBe(10);
    expect(r.discountPercentage).toBe(0);
  });
});
