export const isRemovedByAdmin = (offer) =>
  offer?.status === 'delisted' && offer?.delistReason === 'admin';

export const canRemoveOffer = (offer) =>
  !isRemovedByAdmin(offer) && ['approved', 'active', 'delisted'].includes(offer?.status);

export const offerStatusKey = (offer) => (isRemovedByAdmin(offer) ? 'removed' : offer?.status);
