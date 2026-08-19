/**
 * Centralized status taxonomy for refund and payout flows.
 *
 * Goal: every UI surface that renders a refund/payout status uses the same labels and
 * badge variants. This module is the single source of truth and is case-insensitive
 * so legacy lowercase rows (created by older code paths) still display consistently
 * with new uppercase values.
 *
 * Returned variants align with the existing Badge component:
 *   - "success" | "warning" | "destructive" | "secondary" | "default"
 */

const REFUND_STATUS_DEFS = {
  PENDING: { label: 'Pending', variant: 'warning' },
  SELLER_REVIEW: { label: 'Seller review', variant: 'warning' },
  SELLER_APPROVED: { label: 'Seller approved', variant: 'default' },
  SELLER_REJECTED: { label: 'Seller rejected', variant: 'destructive' },
  ADMIN_REVIEW: { label: 'Admin review', variant: 'secondary' },
  ADMIN_APPROVED: { label: 'Admin approved', variant: 'default' },
  ADMIN_REJECTED: { label: 'Rejected', variant: 'destructive' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  // 'warning', not 'secondary': the buyer is owed money that a human still has
  // to send. A neutral badge made an unpaid refund look like a completed step.
  WAITING_FOR_MANUAL_REFUND: { label: 'Waiting manual refund', variant: 'warning' },
  ON_HOLD_INSUFFICIENT_FUNDS: { label: 'On hold (insufficient funds)', variant: 'destructive' },
  // Was MISSING from this map while being a live member of REFUND_STATUS. The
  // fallback below renders an unmapped status as its raw enum string in a
  // NEUTRAL badge — so a refund that is blocked waiting for the buyer to supply
  // PayPal details displayed as "WAITING_FOR_BUYER_PAYPAL" and looked like
  // nothing needed doing. It is the buyer who has to act, hence 'warning'.
  WAITING_FOR_BUYER_PAYPAL: { label: 'Waiting for PayPal details', variant: 'warning' },
};

// Legacy lowercase aliases mapped to canonical entries so old data renders correctly.
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
  // 'warning', not 'secondary': held earnings are the seller's money that they
  // cannot draw. Neutral grey read as an ordinary state.
  hold: { label: 'On hold', variant: 'warning' },
  // 'info', not 'warning': frozen money is paused pending a refund review and
  // is returned in full if the request is rejected. Nothing is wrong yet.
  frozen: { label: 'Frozen', variant: 'info' },
  failed: { label: 'Failed', variant: 'destructive' },
  blocked: { label: 'Blocked', variant: 'destructive' },
  // Forward-compatible withdrawal lifecycle states (Phase 5 will populate these end-to-end).
  requested: { label: 'Requested', variant: 'warning' },
  approved: { label: 'Approved', variant: 'default' },
  queued: { label: 'Queued', variant: 'secondary' },
  processing: { label: 'Processing', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  failed_with_retry: { label: 'Retrying', variant: 'warning' },
  // Was MISSING while being a live member of WITHDRAWAL_STATUS, so a seller
  // whose payout was halted saw the raw string "needs_review" in a NEUTRAL
  // badge — money held, nothing to indicate it. The admin side of this was
  // already fixed under REL-4 (PayoutsManagement.jsx:81); the seller side was
  // not. 'warning', not 'destructive': nothing has failed, the funds are
  // reserved and an admin has to look at it.
  needs_review: { label: 'Under review', variant: 'warning' },
  // Derived per-row states (see splitPayoutRow on the seller Earnings screen):
  // a payout line whose keys are a MIX of available / frozen / refunded.
  partial: { label: 'Partial', variant: 'warning' },
  refunded: { label: 'Refunded', variant: 'destructive' },
};

const FALLBACK = { label: 'Unknown', variant: 'default' };

const lookupRefund = (raw) => {
  if (!raw) return null;
  const key = String(raw);
  if (REFUND_STATUS_DEFS[key]) return REFUND_STATUS_DEFS[key];
  if (REFUND_STATUS_LEGACY[key]) return REFUND_STATUS_LEGACY[key];
  // Try uppercase (covers mixed-case rows e.g. "Pending").
  const upper = key.toUpperCase();
  if (REFUND_STATUS_DEFS[upper]) return REFUND_STATUS_DEFS[upper];
  return null;
};

const lookupPayout = (raw) => {
  if (!raw) return null;
  const key = String(raw).toLowerCase();
  return PAYOUT_STATUS_DEFS[key] || null;
};

/**
 * Returns { label, variant } for a refund status. Always safe to spread into a Badge.
 */
export const getRefundStatusDisplay = (status) => {
  const def = lookupRefund(status);
  if (!def) return { label: String(status || 'Unknown'), variant: FALLBACK.variant };
  return { ...def };
};

/**
 * Returns { label, variant } for a payout status.
 */
export const getPayoutStatusDisplay = (status) => {
  const def = lookupPayout(status);
  if (!def) return { label: String(status || 'Unknown'), variant: FALLBACK.variant };
  return { ...def };
};

/**
 * Convenience for use in `<Badge>` props (variant only). Centralized so we don't
 * duplicate variant maps across pages.
 */
export const payoutBadgeProps = (status) => {
  const { label, variant } = getPayoutStatusDisplay(status);
  return { variant, children: label };
};

/**
 * Same convenience for refund statuses. Added so user/ReturnRefunds could drop
 * its own partial copy of the label + variant tables and read from here instead.
 */
export const refundBadgeProps = (status) => {
  const { label, variant } = getRefundStatusDisplay(status);
  return { variant, children: label };
};
