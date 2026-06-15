// QUALITY FIX (FQ3): starter unit tests for the guest cart — pure
// localStorage logic that backs the unauthenticated buy flow.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  GUEST_CART_KEY,
  getGuestCart,
  setGuestCart,
  addToGuestCart,
  removeFromGuestCart,
} from '../src/utils/guestCart';

describe('guestCart', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns an empty cart when nothing is stored', () => {
    expect(getGuestCart()).toEqual({ items: [] });
  });

  it('survives corrupt JSON in localStorage', () => {
    localStorage.setItem(GUEST_CART_KEY, '{not json');
    expect(getGuestCart()).toEqual({ items: [] });
  });

  it('survives a non-array items payload', () => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify({ items: 'nope' }));
    expect(getGuestCart()).toEqual({ items: [] });
  });

  it('adds a new item with normalized qty and price', () => {
    const cart = addToGuestCart({ productId: 'p1', qty: '2', price: '9.99' });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({ productId: 'p1', qty: 2, price: 9.99 });
  });

  it('merges quantity for an existing product instead of duplicating', () => {
    addToGuestCart({ productId: 'p1', qty: 1, price: 5 });
    const cart = addToGuestCart({ productId: 'p1', qty: 3, price: 5 });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].qty).toBe(4);
  });

  it('accepts an object-shaped productId ({_id})', () => {
    const cart = addToGuestCart({ productId: { _id: 'p2' }, qty: 1, price: 1 });
    expect(cart.items[0].productId).toBe('p2');
  });

  it('clamps invalid qty to 1', () => {
    const cart = addToGuestCart({ productId: 'p3', qty: -5, price: 1 });
    expect(cart.items[0].qty).toBe(1);
  });

  it('removes an item by id', () => {
    addToGuestCart({ productId: 'p1', qty: 1, price: 1 });
    addToGuestCart({ productId: 'p2', qty: 1, price: 1 });
    removeFromGuestCart('p1');
    const cart = getGuestCart();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('p2');
  });

  it('setGuestCart normalizes a missing items array', () => {
    setGuestCart({});
    expect(getGuestCart()).toEqual({ items: [] });
  });
});
