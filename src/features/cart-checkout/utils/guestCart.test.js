import { describe, it, expect, beforeEach } from 'vitest';
import {
  GUEST_CART_KEY,
  getGuestCart,
  setGuestCart,
  addToGuestCart,
  removeFromGuestCart,
  updateGuestCartQuantity,
  clearGuestCart,
  getGuestCartCount,
} from './guestCart';

beforeEach(() => {
  localStorage.clear();
});

describe('guestCart', () => {
  it('starts empty', () => {
    expect(getGuestCart()).toEqual({ items: [] });
    expect(getGuestCartCount()).toBe(0);
  });

  it('adds a new item with normalized fields', () => {
    addToGuestCart({ productId: 'p1', qty: 2, price: '9.99', sellerId: 's1' });
    const { items } = getGuestCart();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ productId: 'p1', qty: 2, price: 9.99, sellerId: 's1' });
  });

  it('accumulates qty when the same product is added again', () => {
    addToGuestCart({ productId: 'p1', qty: 1, price: 10 });
    addToGuestCart({ productId: 'p1', qty: 3, price: 10 });
    const { items } = getGuestCart();
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(4);
    expect(getGuestCartCount()).toBe(4);
  });

  it('accepts a productId object ({ _id })', () => {
    addToGuestCart({ productId: { _id: 'p9' }, qty: 1, price: 5 });
    expect(getGuestCart().items[0].productId).toBe('p9');
  });

  it('clamps a non-positive add qty up to 1', () => {
    addToGuestCart({ productId: 'p1', qty: 0, price: 5 });
    expect(getGuestCart().items[0].qty).toBe(1);
  });

  it('updates quantity, and removes when qty <= 0', () => {
    addToGuestCart({ productId: 'p1', qty: 1, price: 5 });
    updateGuestCartQuantity('p1', undefined, 5);
    expect(getGuestCart().items[0].qty).toBe(5);
    updateGuestCartQuantity('p1', undefined, 0);
    expect(getGuestCart().items).toHaveLength(0);
  });

  it('removes a specific item', () => {
    addToGuestCart({ productId: 'p1', qty: 1, price: 5 });
    addToGuestCart({ productId: 'p2', qty: 1, price: 5 });
    removeFromGuestCart('p1');
    const { items } = getGuestCart();
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('p2');
  });

  it('clears the whole cart', () => {
    addToGuestCart({ productId: 'p1', qty: 2, price: 5 });
    clearGuestCart();
    expect(getGuestCart()).toEqual({ items: [] });
  });

  it('survives corrupted localStorage', () => {
    localStorage.setItem(GUEST_CART_KEY, '{not valid json');
    expect(getGuestCart()).toEqual({ items: [] });
  });

  it('survives a non-array items payload', () => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify({ items: 'nope' }));
    expect(getGuestCart()).toEqual({ items: [] });
  });

  it('setGuestCart normalizes a missing items array', () => {
    setGuestCart({});
    expect(getGuestCart()).toEqual({ items: [] });
  });

  it('counts total quantity across items', () => {
    addToGuestCart({ productId: 'p1', qty: 2, price: 5 });
    addToGuestCart({ productId: 'p2', qty: 3, price: 5 });
    expect(getGuestCartCount()).toBe(5);
  });

  it('keeps the same product from two sellers as two separate lines', () => {
    addToGuestCart({ productId: 'p1', qty: 1, price: 10, sellerId: 'sX' });
    addToGuestCart({ productId: 'p1', qty: 1, price: 12, sellerId: 'sY' });
    const { items } = getGuestCart();
    expect(items).toHaveLength(2);
    expect(items.map((i) => [i.sellerId, i.qty, i.price])).toEqual([['sX', 1, 10], ['sY', 1, 12]]);
  });

  it('still merges a repeat add from the SAME seller', () => {
    addToGuestCart({ productId: 'p1', qty: 1, price: 10, sellerId: 'sX' });
    addToGuestCart({ productId: 'p1', qty: 2, price: 10, sellerId: 'sX' });
    expect(getGuestCart().items).toEqual([expect.objectContaining({ sellerId: 'sX', qty: 3 })]);
  });

  it("removes and updates only the chosen seller's line", () => {
    addToGuestCart({ productId: 'p1', qty: 1, price: 10, sellerId: 'sX' });
    addToGuestCart({ productId: 'p1', qty: 1, price: 12, sellerId: 'sY' });
    updateGuestCartQuantity('p1', 'sY', 4);
    expect(getGuestCart().items.map((i) => [i.sellerId, i.qty])).toEqual([['sX', 1], ['sY', 4]]);
    removeFromGuestCart('p1', 'sX');
    expect(getGuestCart().items.map((i) => i.sellerId)).toEqual(['sY']);
  });

  it('still removes a line saved before sellers were stored', () => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify({ items: [{ productId: 'p1', qty: 2, price: 5 }] }));
    updateGuestCartQuantity('p1', 'sResolvedByServer', 3);
    expect(getGuestCart().items[0].qty).toBe(3);
    removeFromGuestCart('p1', 'sResolvedByServer');
    expect(getGuestCart().items).toHaveLength(0);
  });
});
