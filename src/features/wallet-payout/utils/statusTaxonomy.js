const REFUND_STATUS_DEFS = {
  PENDING: { label: 'Pending', variant: 'warning' },
  SELLER_REVIEW: { label: 'Seller review', variant: 'warning' },
  SELLER_APPROVED: { label: 'Seller approved', variant: 'default' },
  SELLER_REJECTED: { label: 'Seller rejected', variant: 'destructive' },
  ADMIN_REVIEW: { label: 'Admin review', variant: 'secondary' },
  ADMIN_APPROVED: { label: 'Admin approved', variant: 'default' },
  ADMIN_REJECTED: { label: 'Rejected', variant: 'destructive' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  WAITING_FOR_MANUAL_REFUND: { label: 'Waiting manual refund', variant: 'warning' },
  ON_HOLD_INSUFFICIENT_FUNDS: { label: 'On hold', variant: 'warning' },
  WAITING_FOR_BUYER_PAYPAL: { label: 'Waiting for PayPal details', variant: 'warning' },
};

const REFUND_STATUS_LEGACY = {
  pending: REFUND_STATUS_DEFS.PENDING,
  approved: REFUND_STATUS_DEFS.ADMIN_APPROVED,
  rejected: REFUND_STATUS_DEFS.ADMIN_REJECTED,
  completed: REFUND_STATUS_DEFS.COMPLETED,
};

const PAYOUT_STATUS_DEFS = {
  pending: { label: 'Pending', variant: 'warning' },
  available: { label: 'Available', variant: 'default' },
  released: { label: 'Released', variant: 'success' },
  hold: { label: 'On hold', variant: 'warning' },
  frozen: { label: 'Frozen', variant: 'info' },
  failed: { label: 'Failed', variant: 'destructive' },
  blocked: { label: 'Blocked', variant: 'destructive' },
  requested: { label: 'Requested', variant: 'warning' },
  approved: { label: 'Approved', variant: 'default' },
  queued: { label: 'Queued', variant: 'secondary' },
  processing: { label: 'Processing', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  failed_with_retry: { label: 'Retrying', variant: 'warning' },
  needs_review: { label: 'Under review', variant: 'warning' },
  partial: { label: 'Partial', variant: 'warning' },
  refunded: { label: 'Refunded', variant: 'destructive' },
  deduction: { label: 'Refund deduction', variant: 'destructive' },
};

const FALLBACK = { label: 'Unknown', variant: 'default' };

const lookupRefund = (raw) => {
  if (!raw) return null;
  const key = String(raw);
  if (REFUND_STATUS_DEFS[key]) return REFUND_STATUS_DEFS[key];
  if (REFUND_STATUS_LEGACY[key]) return REFUND_STATUS_LEGACY[key];
  const upper = key.toUpperCase();
  if (REFUND_STATUS_DEFS[upper]) return REFUND_STATUS_DEFS[upper];
  return null;
};

const lookupPayout = (raw) => {
  if (!raw) return null;
  const key = String(raw).toLowerCase();
  return PAYOUT_STATUS_DEFS[key] || null;
};

export const getRefundStatusDisplay = (status) => {
  const def = lookupRefund(status);
  if (!def) return { label: String(status || 'Unknown'), variant: FALLBACK.variant };
  return { ...def };
};

export const getPayoutStatusDisplay = (status) => {
  const def = lookupPayout(status);
  if (!def) return { label: String(status || 'Unknown'), variant: FALLBACK.variant };
  return { ...def };
};

export const payoutBadgeProps = (status) => {
  const { label, variant } = getPayoutStatusDisplay(status);
  return { variant, children: label };
};

export const refundBadgeProps = (status) => {
  const { label, variant } = getRefundStatusDisplay(status);
  return { variant, children: label };
};
