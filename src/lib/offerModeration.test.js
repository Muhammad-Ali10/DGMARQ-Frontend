import { describe, it, expect } from 'vitest';
import { canRemoveOffer, isRemovedByAdmin, offerStatusKey } from './offerModeration';
import { getStatusDisplay } from './statusTaxonomy';

// These mirror the backend's removeOffer/restoreOffer rules, so a button only
// appears where the server would accept the action.

describe('offer moderation rules', () => {
  const removed = { status: 'delisted', delistReason: 'admin' };
  const soldOut = { status: 'delisted', delistReason: 'out_of_stock' };

  it('offers Remove for live offers and out-of-stock delists only', () => {
    expect(canRemoveOffer({ status: 'approved' })).toBe(true);
    expect(canRemoveOffer({ status: 'active' })).toBe(true);
    expect(canRemoveOffer(soldOut)).toBe(true);
    // Pending is rejected, not removed; rejected is not listed at all.
    expect(canRemoveOffer({ status: 'pending' })).toBe(false);
    expect(canRemoveOffer({ status: 'rejected' })).toBe(false);
    // Already removed → the action is Restore instead.
    expect(canRemoveOffer(removed)).toBe(false);
  });

  it('recognises an admin takedown, and only that', () => {
    expect(isRemovedByAdmin(removed)).toBe(true);
    expect(isRemovedByAdmin(soldOut)).toBe(false);
    expect(isRemovedByAdmin({ status: 'approved' })).toBe(false);
    expect(isRemovedByAdmin(null)).toBe(false);
  });

  it('labels a takedown differently from an out-of-stock delist', () => {
    expect(offerStatusKey(removed)).toBe('removed');
    expect(offerStatusKey(soldOut)).toBe('delisted');
    expect(offerStatusKey({ status: 'approved' })).toBe('approved');

    expect(getStatusDisplay('offer', offerStatusKey(removed)).label).toBe('Removed by admin');
    expect(getStatusDisplay('offer', offerStatusKey(soldOut)).label).toBe('Delisted');
  });
});
