/**
 * Shared status taxonomy for cross-cutting domains (order, payment).
 *
 * Single source of truth for status -> { label, variant } so every surface
 * renders the same copy and the same badge color. Lookups are case-insensitive
 * so mixed-case rows from older code paths still resolve.
 *
 * `variant` aligns with the <Badge> component:
 *   "success" | "warning" | "destructive" | "secondary" | "default"
 *
 * Deliberately NOT modeled here (they are not simple status lookups):
 *   - refund / seller-payout statuses -> features/wallet-payout/utils/statusTaxonomy.js
 *   - date-derived windows (bundle / trending-offer "Upcoming/Active/Expired")
 *   - catalog-specific labels (e.g. "Active (Catalog)")
 * Fold new domains in here only when they are a genuine status -> label/color map.
 */

const ORDER = {
  completed: { label: 'Completed', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  processing: { label: 'Processing', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  returned: { label: 'Returned', variant: 'secondary' },
  partially_completed: { label: 'Partially completed', variant: 'secondary' },
  // Payment-refund lifecycle states an order can also carry (case-insensitive,
  // so API values like "REFUNDED"/"PARTIALLY_REFUNDED" resolve here). Kept
  // distinct from `returned` (goods returned) vs. money refunded.
  refunded: { label: 'Refunded', variant: 'secondary' },
  partially_refunded: { label: 'Partially refunded', variant: 'secondary' },
};

const PAYMENT = {
  paid: { label: 'Paid', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  failed: { label: 'Failed', variant: 'destructive' },
  refunded: { label: 'Refunded', variant: 'secondary' },
};

const DOMAINS = { order: ORDER, payment: PAYMENT };

/**
 * Returns { label, variant } for a status in the given domain. Always safe to
 * spread into a <Badge>: an unknown status renders verbatim with the neutral
 * "default" variant rather than throwing or rendering blank.
 */
export const getStatusDisplay = (domain, status) => {
  const table = DOMAINS[domain];
  const key = status == null ? '' : String(status).toLowerCase();
  const def = table && table[key];
  if (def) return { ...def };
  return { label: status == null ? 'Unknown' : String(status), variant: 'default' };
};
