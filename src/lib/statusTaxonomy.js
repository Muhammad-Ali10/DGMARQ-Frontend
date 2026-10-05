import {
  CheckCircle2,
  Clock,
  Loader,
  XCircle,
  RotateCcw,
  CircleDot,
  EyeOff,
  CircleSlash,
} from 'lucide-react';

/**
 * Shared status taxonomy — the single source of truth for
 * status -> { label, variant, icon } across every dashboard.
 *
 * Colour is NEVER the only signal: each entry carries an icon, and StatusBadge
 * always renders icon + text label alongside the colour. That covers the
 * colour-blindness case and the "don't encode meaning in hue alone" rule in one
 * place instead of asking 34 screens to remember it.
 *
 * Semantic colour contract (matches the token layer):
 *   success   green   delivered / paid / live
 *   warning   amber   pending / processing / awaiting action
 *   destructive red   failed / refunded / rejected / disputed
 *   info      blue    informational, terminal but neutral
 *   secondary neutral no action implied
 *
 * Lookups are case-insensitive so mixed-case rows from older code paths
 * ("REFUNDED", "Pending") still resolve.
 *
 * Deliberately NOT modeled here:
 *   - refund / seller-payout lifecycles -> features/wallet-payout/utils/statusTaxonomy.js
 *   - date-derived windows (bundle deal "Upcoming/Active/Expired")
 */

const ORDER = {
  completed: { label: 'Completed', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  processing: { label: 'Processing', variant: 'warning', icon: Loader },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
  returned: { label: 'Returned', variant: 'secondary', icon: RotateCcw },
  partially_completed: { label: 'Partially completed', variant: 'warning', icon: CircleDot },
  // Payment-refund lifecycle states an order can also carry. Kept distinct from
  // `returned` (goods returned) vs. money refunded.
  refunded: { label: 'Refunded', variant: 'destructive', icon: RotateCcw },
  partially_refunded: { label: 'Partially refunded', variant: 'warning', icon: CircleDot },
};

const PAYMENT = {
  paid: { label: 'Paid', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
  refunded: { label: 'Refunded', variant: 'destructive', icon: RotateCcw },
};

/** A seller's listing against a master product (Offer.status). */
const OFFER = {
  pending: { label: 'Pending approval', variant: 'warning', icon: Clock },
  approved: { label: 'Live', variant: 'success', icon: CheckCircle2 },
  active: { label: 'Live', variant: 'success', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  delisted: { label: 'Delisted', variant: 'secondary', icon: EyeOff },
  // Not a stored status: an admin takedown is 'delisted' + delistReason 'admin'.
  // lib/offerModeration.offerStatusKey maps it here, because to a seller it
  // means something different from an out-of-stock delist.
  removed: { label: 'Removed by admin', variant: 'destructive', icon: CircleSlash },
};

/** A single unit of inventory (LicenseKey.status). */
const LICENSE_KEY = {
  active: { label: 'Active', variant: 'success', icon: CheckCircle2 },
  used: { label: 'Used', variant: 'info', icon: CircleDot },
  refunded: { label: 'Refunded', variant: 'destructive', icon: RotateCcw },
};

/** A connected payout destination (SellerPayoutAccount.status). */
const PAYOUT_ACCOUNT = {
  verified: { label: 'Connected', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  blocked: { label: 'Blocked', variant: 'destructive', icon: XCircle },
  unlinked: { label: 'Not connected', variant: 'secondary', icon: CircleSlash },
};

/** The seller account itself (Seller.status — see SELLER_STATUS on the server). */
const SELLER_ACCOUNT = {
  active: { label: 'Active', variant: 'success', icon: CheckCircle2 },
  approved: { label: 'Active', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Pending review', variant: 'warning', icon: Clock },
  banned: { label: 'Suspended', variant: 'destructive', icon: XCircle },
};

const DOMAINS = {
  order: ORDER,
  payment: PAYMENT,
  offer: OFFER,
  licenseKey: LICENSE_KEY,
  sellerAccount: SELLER_ACCOUNT,
  payoutAccount: PAYOUT_ACCOUNT,
};

/**
 * Returns { label, variant, icon } for a status in the given domain. Always safe
 * to render: an unknown status shows verbatim with a neutral variant rather than
 * throwing or rendering blank.
 */
export const getStatusDisplay = (domain, status) => {
  const table = DOMAINS[domain];
  const key = status == null ? '' : String(status).toLowerCase();
  const def = table && table[key];
  if (def) return { ...def };
  return {
    label: status == null ? 'Unknown' : String(status),
    variant: 'secondary',
    icon: CircleSlash,
  };
};
