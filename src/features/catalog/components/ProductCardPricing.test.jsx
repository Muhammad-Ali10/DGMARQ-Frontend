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

/**
 * W10 — what a card RENDERS for real rollup shapes.
 *
 * These fixtures are the output of offer.service.recalcProductRollups, not
 * invented numbers:
 *   price                 = lowestPrice          (cheapest live offer, BASE)
 *   lowestEffectivePrice  = min(effectiveOfferPrice(price, discount))
 *   discount              = the legacy MASTER field, which the rollup never
 *                           writes — hence 0 on every offer-backed product.
 *
 * Before this fix the card read only `price` + `discount`, so every seller
 * discount rendered as no discount.
 */
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

/**
 * The price the card actually paints, read back out of the DOM.
 *
 * The strike-through and the badge are always in the tree — ProductCard keeps
 * them mounted and toggles `invisible` + aria-hidden so the grid never reflows
 * between a discounted and an undiscounted card. Presence alone therefore means
 * nothing; visibility is the signal. Note `aria-hidden={false}` serialises to
 * the STRING "false", so this compares against 'true' rather than testing
 * truthiness.
 */
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
    // BEFORE: price=10, discount=0 → card showed "$10.00", no badge, no strike.
    // The product page showed $8.00 and the price-drop email said $8.00.
    renderWithProviders(
      <ProductCard product={card({ price: 10, lowestEffectivePrice: 8 })} />
    );

    const shown = renderedPrice();
    expect(shown.now).toBe('$8.00');
    expect(shown.was).toBe('$10.00');
    expect(shown.badge).toBe('-20%');
  });

  it('a listing with no seller discount is unchanged', () => {
    // The regression guard for the other 90% of the catalogue: when nothing is
    // discounted, lowestEffectivePrice === price and the card must look exactly
    // as it did before — one price, no strike-through, no badge.
    renderWithProviders(
      <ProductCard product={card({ price: 24.99, lowestEffectivePrice: 24.99 })} />
    );

    const shown = renderedPrice();
    expect(shown.now).toBe('$24.99');
    expect(shown.was).toBeNull();
    expect(shown.badge).toBeNull();
  });

  it('an endpoint that does not project the field still renders the old way', () => {
    // Not every card feed carries the rollup. Those must degrade to the base
    // price rather than to $0 or NaN.
    renderWithProviders(<ProductCard product={card({ price: 15 })} />);
    expect(renderedPrice().now).toBe('$15.00');
  });

  it('an explicit discountedPrice outranks the rollup', () => {
    // A feed that computes the price itself must not be overridden by the
    // cheapest-offer rollup.
    renderWithProviders(
      <ProductCard
        product={card({
          price: 50,
          lowestEffectivePrice: 45, // seller is 10% off
          discountedPrice: 30, // ...but this feed says 40% off
        })}
      />
    );
    expect(renderedPrice().now).toBe('$30.00');
  });
});

// Pure-function view of the same fix, so the numbers are checkable without a DOM.
describe('W10 — calculateProductPrice reads lowestEffectivePrice', () => {
  it('matches what the product detail page computes for the same offer', () => {
    // Detail page path: calculateProductPrice(featuredOffer) where the offer is
    // { price: 10, discount: 20 } → 8.00 / -20%.
    const fromOffer = calculateProductPrice({ price: 10, discount: 20 });
    // Card path, post-fix: the rollup hands over the already-effective price.
    const fromCard = calculateProductPrice({ price: 10, lowestEffectivePrice: 8 });

    expect(fromCard.discountPrice).toBe(fromOffer.discountPrice);
    expect(fromCard.discountPercentage).toBe(fromOffer.discountPercentage);
    expect(fromCard.originalPrice).toBe(fromOffer.originalPrice);
  });

  it('derives a whole-number badge despite 2dp price rounding', () => {
    // effectiveOfferPrice rounds: 20% off 9.99 is 7.992 → 7.99, which is 20.02%
    // by division. The badge must not read "-20.02%".
    const r = calculateProductPrice({ price: 9.99, lowestEffectivePrice: 7.99 });
    expect(r.discountPrice).toBe(7.99);
    expect(r.discountPercentage).toBe(20);
  });

  it('a stale master discount can no longer contradict the shown price', () => {
    // Admin once set discount=10 on the master; the live offer is 20% off.
    // The badge must describe the price actually rendered, not the stale field.
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
