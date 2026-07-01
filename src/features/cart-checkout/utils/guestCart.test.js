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
    updateGuestCartQuantity('p1', 5);
    expect(getGuestCart().items[0].qty).toBe(5);
    updateGuestCartQuantity('p1', 0);
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
});
