import { describe, it, expect } from 'vitest';
import {
  canBuyQuantity,
  calculateProductPrice,
  getProductImage,
  getProductName,
  isMongoObjectId,
  getProductPath,
  getPlatformName,
  getRegionName,
  getTypeName,
  getDeviceName,
  selectFeaturedOffer,
  effectiveOfferPrice,
  isAllOutOfStock,
  getCardRegionOffer,
  PRODUCT_IMAGE_PLACEHOLDER,
} from './productUtils';

describe('calculateProductPrice', () => {
  it('returns zeros for missing/invalid price', () => {
    expect(calculateProductPrice(null)).toEqual({
      discountPrice: 0,
      discountPercentage: 0,
      originalPrice: 0,
    });
    expect(calculateProductPrice({ price: 'not-a-number' }).originalPrice).toBe(0);
  });

  it('coerces a numeric-string price', () => {
    const r = calculateProductPrice({ price: '49.99' });
    expect(r.originalPrice).toBe(49.99);
    expect(r.discountPrice).toBe(49.99);
    expect(r.discountPercentage).toBe(0);
  });

  it('applies a percentage discount and rounds to 2dp', () => {
    const r = calculateProductPrice({ price: 100, discountPercentage: 25 });
    expect(r.originalPrice).toBe(100);
    expect(r.discountPrice).toBe(75);
    expect(r.discountPercentage).toBe(25);
  });

  it('prefers an explicit API discountedPrice below original', () => {
    const r = calculateProductPrice({ price: 100, discountedPrice: 60 });
    expect(r.discountPrice).toBe(60);
    expect(r.discountPercentage).toBe(40);
  });

  it('ignores a discountedPrice that is >= original price', () => {
    const r = calculateProductPrice({ price: 50, discountedPrice: 80 });
    expect(r.discountPrice).toBe(50);
    expect(r.discountPercentage).toBe(0);
  });

  it('never returns a negative or above-original discount price', () => {
    const over = calculateProductPrice({ price: 100, discountPercentage: 150 });
    expect(over.discountPrice).toBe(100);
    const full = calculateProductPrice({ price: 100, discountPercentage: 100 });
    expect(full.discountPrice).toBe(0);
  });
});

describe('getProductImage', () => {
  it('returns the image at the given index', () => {
    expect(getProductImage({ images: ['a.jpg', 'b.jpg'] }, 1)).toBe('b.jpg');
  });
  it('falls back to the placeholder when missing/blank', () => {
    expect(getProductImage({ images: [] })).toBe(PRODUCT_IMAGE_PLACEHOLDER);
    expect(getProductImage({ images: ['   '] })).toBe(PRODUCT_IMAGE_PLACEHOLDER);
    expect(getProductImage(null)).toBe(PRODUCT_IMAGE_PLACEHOLDER);
  });
});

describe('getProductName', () => {
  it('returns the name or a fallback', () => {
    expect(getProductName({ name: 'Zero Hour' })).toBe('Zero Hour');
    expect(getProductName({})).toBe('Unnamed Product');
  });
});

describe('isMongoObjectId', () => {
  it('matches 24-char hex ids only', () => {
    expect(isMongoObjectId('507f1f77bcf86cd799439011')).toBe(true);
    expect(isMongoObjectId('not-an-id')).toBe(false);
    expect(isMongoObjectId('')).toBe(false);
  });
});

describe('getProductPath', () => {
  it('prefers slug over id', () => {
    expect(getProductPath({ slug: 'zero-hour', _id: 'abc' })).toBe('/product/zero-hour');
  });
  it('falls back to id then /search', () => {
    expect(getProductPath({ _id: '507f1f77bcf86cd799439011' })).toBe('/product/507f1f77bcf86cd799439011');
    expect(getProductPath({})).toBe('/search');
  });
});

describe('entity-name getters', () => {
  it('reads platform from object/string and rejects raw ObjectIds', () => {
    expect(getPlatformName({ platform: { name: 'Steam' } })).toBe('Steam');
    expect(getPlatformName({ platform: 'PC' })).toBe('PC');
    expect(getPlatformName({ platform: '507f1f77bcf86cd799439011' })).toBe('Unknown Platform');
    expect(getPlatformName({})).toBe('Unknown Platform');
  });

  it('maps known product type codes to readable labels', () => {
    expect(getTypeName({ productType: 'LICENSE_KEY' })).toBe('Key');
    expect(getTypeName({ productType: 'ACCOUNT_BASED' })).toBe('Account');
    expect(getTypeName({ productType: 'GIFT' })).toBe('Gift');
    expect(getTypeName({ productType: 'ACTIVATION_LINK' })).toBe('Activation Link');
    expect(getTypeName({ type: 'ACCOUNT_BASED' })).toBe('Unknown Type');
    expect(getTypeName({})).toBe('Unknown Type');
  });

  it('region and device fall back sensibly', () => {
    expect(getRegionName({ region: { name: 'EU' } })).toBe('EU');
    expect(getRegionName({})).toBe('Global');
    expect(getDeviceName({ device: { name: 'Console' } })).toBe('Console');
    expect(getDeviceName({})).toBe('Unknown Device');
  });
});

const offer = (price, inStock, extra = {}) => ({ _id: `o${price}`, price, inStock, ...extra });
const anyRegion = () => true;

describe('selectFeaturedOffer (requirement 3)', () => {
  it('shows the cheapest seller when it is in stock', () => {
    const offers = [offer(30, true), offer(10, true), offer(20, true)];
    expect(selectFeaturedOffer(offers, null, anyRegion).price).toBe(10);
  });

  it('promotes the NEXT cheapest when the cheapest is out of stock', () => {
    const offers = [offer(10, false), offer(20, true), offer(30, true)];
    expect(selectFeaturedOffer(offers, null, anyRegion).price).toBe(20);
  });

  it('skips several out-of-stock sellers to reach the cheapest buyable one', () => {
    const offers = [offer(10, false), offer(15, false), offer(40, true), offer(25, true)];
    expect(selectFeaturedOffer(offers, null, anyRegion).price).toBe(25);
  });

  it('is not fooled by input order — the cheapest in-stock wins regardless', () => {
    const offers = [offer(99, true), offer(5, false), offer(7, true)];
    expect(selectFeaturedOffer(offers, null, anyRegion).price).toBe(7);
  });

  it('prefers the cheapest seller the buyer can actually activate', () => {
    const offers = [offer(10, true, { blocked: true }), offer(12, true)];
    const isCompatible = (o) => (o.blocked ? false : true);
    expect(selectFeaturedOffer(offers, null, isCompatible).price).toBe(12);
  });

  it('falls back to the cheapest in-stock offer when NO seller covers the buyer', () => {
    const offers = [offer(10, true, { blocked: true }), offer(12, true, { blocked: true })];
    const isCompatible = () => false;
    expect(selectFeaturedOffer(offers, null, isCompatible).price).toBe(10);
  });

  it('treats an unknown region verdict as usable, not as blocked', () => {
    const offers = [offer(10, true)];
    expect(selectFeaturedOffer(offers, null, () => null).price).toBe(10);
  });

  it('prices the cheapest offer when every seller is out of stock', () => {
    const offers = [offer(30, false), offer(12, false)];
    expect(selectFeaturedOffer(offers, offer(99, false), anyRegion).price).toBe(12);
  });

  it('falls back to the server bestOffer only when there are no offers at all', () => {
    const fallback = offer(10, false);
    expect(selectFeaturedOffer([], fallback, anyRegion)).toBe(fallback);
    expect(selectFeaturedOffer(undefined, fallback, anyRegion)).toBe(fallback);
  });

  it('returns null rather than throwing when there is nothing to show', () => {
    expect(selectFeaturedOffer([], null, anyRegion)).toBe(null);
    expect(selectFeaturedOffer(undefined, null, anyRegion)).toBe(null);
  });
});

describe('selectFeaturedOffer — cheapest EFFECTIVE, not cheapest base', () => {
  const discounted = (price, discount, inStock = true, extra = {}) => ({
    _id: `o${price}-${discount}`,
    price,
    discount,
    inStock,
    ...extra,
  });

  it('picks the discounted pricier listing over a cheaper undiscounted one', () => {
    const offers = [discounted(10, 0), discounted(12, 50)];
    const picked = selectFeaturedOffer(offers, null, anyRegion);

    expect(picked.price).toBe(12);
    expect(picked.discount).toBe(50);
    expect(effectiveOfferPrice(picked)).toBe(6);
  });

  it('agrees with the master rollup the card reads', () => {
    const offers = [discounted(10, 0), discounted(12, 50), discounted(30, 10)];
    const lowestEffectivePrice = Math.min(...offers.map(effectiveOfferPrice));

    expect(effectiveOfferPrice(selectFeaturedOffer(offers, null, anyRegion))).toBe(
      lowestEffectivePrice
    );
  });

  it('still prefers a region-compatible seller over a cheaper blocked one', () => {
    const offers = [discounted(20, 75, true, { blocked: true }), discounted(12, 50)];
    const isCompatible = (o) => (o.blocked ? false : true);

    const picked = selectFeaturedOffer(offers, null, isCompatible);
    expect(effectiveOfferPrice(picked)).toBe(6);
    expect(picked.blocked).toBeUndefined();
  });

  it('ignores an out-of-stock offer even when its discount makes it cheapest', () => {
    const offers = [discounted(100, 95, false), discounted(20, 0, true)];
    expect(selectFeaturedOffer(offers, null, anyRegion).price).toBe(20);
  });

  it('a discount that ties two offers is resolved without crashing', () => {
    const offers = [discounted(20, 50), discounted(10, 0)];
    expect(effectiveOfferPrice(selectFeaturedOffer(offers, null, anyRegion))).toBe(10);
  });

  it('treats a missing discount as no discount', () => {
    const offers = [{ _id: 'a', price: 15, inStock: true }, discounted(20, 50)];
    expect(effectiveOfferPrice(selectFeaturedOffer(offers, null, anyRegion))).toBe(10);
  });
});

describe('effectiveOfferPrice', () => {
  it('applies the seller discount', () => {
    expect(effectiveOfferPrice({ price: 10, discount: 20 })).toBe(8);
  });

  it('rounds to 2dp the same way the backend does', () => {
    expect(effectiveOfferPrice({ price: 9.99, discount: 20 })).toBe(7.99);
  });

  it('returns the base price when there is no discount', () => {
    expect(effectiveOfferPrice({ price: 42 })).toBe(42);
    expect(effectiveOfferPrice({ price: 42, discount: 0 })).toBe(42);
  });

  it('does not throw on junk', () => {
    expect(effectiveOfferPrice(null)).toBe(0);
    expect(effectiveOfferPrice({})).toBe(0);
    expect(effectiveOfferPrice({ price: 'abc', discount: 'x' })).toBe(0);
  });
});

describe('isAllOutOfStock (requirement 4)', () => {
  it('is FALSE when one seller is out but another still has stock', () => {
    const product = { offers: [offer(10, false), offer(20, true)] };
    expect(isAllOutOfStock(product, false)).toBe(false);
  });

  it('is TRUE only when every seller is out', () => {
    const product = { offers: [offer(10, false), offer(20, false)] };
    expect(isAllOutOfStock(product, false)).toBe(true);
  });

  it('trusts the server flag over the local derivation', () => {
    expect(isAllOutOfStock({ allOutOfStock: true, offers: [] }, false)).toBe(true);
    expect(isAllOutOfStock({ allOutOfStock: false, offers: [offer(10, false)] }, false)).toBe(false);
  });

  it('an unreleased pre-order is never out of stock — it sells without stock', () => {
    const product = { allOutOfStock: true, offers: [offer(10, false)] };
    expect(isAllOutOfStock(product, true)).toBe(false);
  });

  it('a product with no offers is unlisted, not out of stock', () => {
    expect(isAllOutOfStock({ offers: [] }, false)).toBe(false);
    expect(isAllOutOfStock({}, false)).toBe(false);
  });
});

describe('canBuyQuantity', () => {
  it('needs enough stock for a released product', () => {
    expect(canBuyQuantity(3, 2, false)).toBe(true);
    expect(canBuyQuantity(1, 2, false)).toBe(false);
    expect(canBuyQuantity(0, 1, false)).toBe(false);
    expect(canBuyQuantity(undefined, 1, false)).toBe(false);
  });

  it('lets a pre-order be bought before any keys are uploaded', () => {
    expect(canBuyQuantity(0, 1, true)).toBe(true);
    expect(canBuyQuantity(undefined, 3, true)).toBe(true);
  });
});

describe('getCardRegionOffer', () => {
  it('keeps the country lists so a country-only offer is not shown as unrestricted', () => {
    expect(getCardRegionOffer({ offerRegionCodes: [], bestOfferCountries: ['US'], bestOfferExcludedCountries: [] })).toEqual({
      regionCodes: [],
      countries: ['US'],
      excludedCountries: [],
    });
    expect(getCardRegionOffer({ offerRegionCodes: ['GLOBAL'], bestOfferExcludedCountries: ['RU'] }).excludedCountries).toEqual(['RU']);
  });

  it('returns null when the listing carries no region data', () => {
    expect(getCardRegionOffer({ name: 'x' })).toBeNull();
  });
});
