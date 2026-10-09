import { describe, it, expect } from 'vitest';
import { toCartItems } from './cartItems';

const line = (over = {}) => ({
  product: { _id: 'p1', name: 'Game' },
  sellerId: 's1',
  qty: 5,
  discountedPrice: 10,
  availableKeys: 2,
  isAvailable: false,
  availabilityMessage: 'Only 2 keys available, but 5 requested',
  offerUnavailable: false,
  ...over,
});

describe('toCartItems (server lines)', () => {
  it('flags a line the seller cannot fill and carries the backend message', () => {
    const [item] = toCartItems([line()], true);
    expect(item.stockShort).toBe(true);
    expect(item.availabilityMessage).toBe('Only 2 keys available, but 5 requested');
  });

  it('does not double-flag a line whose offer is gone', () => {
    const [item] = toCartItems([line({ offerUnavailable: true })], true);
    expect(item.unavailable).toBe(true);
    expect(item.stockShort).toBe(false);
  });

  it('hides the stock count for an active pre-order', () => {
    const [item] = toCartItems([line({ isPreorder: true, isAvailable: true, availableKeys: 0 })], true);
    expect(item.stock).toBeNull();
    expect(item.stockShort).toBe(false);
  });
});
