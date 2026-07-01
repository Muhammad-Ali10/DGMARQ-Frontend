import { describe, it, expect } from 'vitest';
import {
  calculateProductPrice,
  getProductImage,
  getProductName,
  isMongoObjectId,
  getProductPath,
  getPlatformName,
  getRegionName,
  getTypeName,
  getDeviceName,
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
    // derived percentage when only an absolute discounted price is given
    expect(r.discountPercentage).toBe(40);
  });

  it('ignores a discountedPrice that is >= original price', () => {
    const r = calculateProductPrice({ price: 50, discountedPrice: 80 });
    expect(r.discountPrice).toBe(50);
    expect(r.discountPercentage).toBe(0);
  });

  it('reads the trendingOffer discount first', () => {
    const r = calculateProductPrice({ price: 200, trendingOffer: { discountPercent: 10 } });
    expect(r.discountPrice).toBe(180);
    expect(r.discountPercentage).toBe(10);
  });

  it('never returns a negative or above-original discount price', () => {
    const over = calculateProductPrice({ price: 100, discountPercentage: 150 });
    // out-of-range percent (>100) is ignored, price stays original
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
    // a raw mongo id is not a display name
    expect(getPlatformName({ platform: '507f1f77bcf86cd799439011' })).toBe('Unknown Platform');
    expect(getPlatformName({})).toBe('Unknown Platform');
  });

  it('maps known product type codes to readable labels', () => {
    expect(getTypeName({ productType: 'LICENSE_KEY' })).toBe('Key');
    expect(getTypeName({ type: 'ACCOUNT_BASED' })).toBe('Account');
    expect(getTypeName({ type: 'GIFT_CARD' })).toBe('Gift Card');
    expect(getTypeName({})).toBe('Unknown Type');
  });

  it('region and device fall back sensibly', () => {
    expect(getRegionName({ region: { name: 'EU' } })).toBe('EU');
    expect(getRegionName({})).toBe('Global');
    expect(getDeviceName({ device: { name: 'Console' } })).toBe('Console');
    expect(getDeviceName({})).toBe('Unknown Device');
  });
});
