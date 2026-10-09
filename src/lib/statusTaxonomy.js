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

const ORDER = {
  completed: { label: 'Completed', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  processing: { label: 'Processing', variant: 'warning', icon: Loader },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
  returned: { label: 'Returned', variant: 'secondary', icon: RotateCcw },
  partially_completed: { label: 'Partially completed', variant: 'warning', icon: CircleDot },
  refunded: { label: 'Refunded', variant: 'destructive', icon: RotateCcw },
  partially_refunded: { label: 'Partially refunded', variant: 'warning', icon: CircleDot },
};

const PAYMENT = {
  paid: { label: 'Paid', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
  refunded: { label: 'Refunded', variant: 'destructive', icon: RotateCcw },
  partially_refunded: { label: 'Partially refunded', variant: 'warning', icon: CircleDot },
};

const OFFER = {
  pending: { label: 'Pending approval', variant: 'warning', icon: Clock },
  approved: { label: 'Live', variant: 'success', icon: CheckCircle2 },
  active: { label: 'Live', variant: 'success', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  delisted: { label: 'Delisted', variant: 'secondary', icon: EyeOff },
  removed: { label: 'Removed by admin', variant: 'destructive', icon: CircleSlash },
};

const LICENSE_KEY = {
  active: { label: 'Active', variant: 'success', icon: CheckCircle2 },
  used: { label: 'Used', variant: 'info', icon: CircleDot },
  refunded: { label: 'Refunded', variant: 'destructive', icon: RotateCcw },
};

const PAYOUT_ACCOUNT = {
  verified: { label: 'Connected', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  blocked: { label: 'Blocked', variant: 'destructive', icon: XCircle },
  unlinked: { label: 'Not connected', variant: 'secondary', icon: CircleSlash },
};

const SELLER_ACCOUNT = {
  active: { label: 'Active', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Pending review', variant: 'warning', icon: Clock },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  banned: { label: 'Suspended', variant: 'destructive', icon: XCircle },
  closed: { label: 'Closed', variant: 'secondary', icon: CircleSlash },
};

const DOMAINS = {
  order: ORDER,
  payment: PAYMENT,
  offer: OFFER,
  licenseKey: LICENSE_KEY,
  sellerAccount: SELLER_ACCOUNT,
  payoutAccount: PAYOUT_ACCOUNT,
};

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
