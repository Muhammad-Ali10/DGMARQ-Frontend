/**
 * Admin moderation rules for a seller's offer, mirrored from the backend
 * (offer.controller removeOffer / restoreOffer) so the buttons only appear
 * where the server would accept the action.
 *
 * An admin takedown is stored as status 'delisted' + delistReason 'admin'. It
 * shares the status with the out-of-stock delist but means something quite
 * different — the seller cannot bring it back by restocking — so it gets its
 * own display key.
 */

export const isRemovedByAdmin = (offer) =>
  offer?.status === 'delisted' && offer?.delistReason === 'admin';

/** Live, or delisted out of stock (removing it stops a restock relisting it). */
export const canRemoveOffer = (offer) =>
  !isRemovedByAdmin(offer) && ['approved', 'active', 'delisted'].includes(offer?.status);

/** The key StatusBadge's offer vocabulary should render for this offer. */
export const offerStatusKey = (offer) => (isRemovedByAdmin(offer) ? 'removed' : offer?.status);
