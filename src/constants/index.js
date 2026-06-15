// Order/payment status constants — single source of truth.
// NOTE on casing: the backend stores most statuses lowercase but the refund
// flow sets orderStatus to UPPERCASE 'REFUNDED'/'PARTIALLY_REFUNDED' (see
// backend constants.js ORDER_STATUS). The mixed case below mirrors the actual
// DB values — do NOT normalize without a coordinated backend data migration.
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PARTIALLY_COMPLETED: 'partially_completed',
  // FIX: this is an ORDER status (backend sets order.orderStatus to this
  // uppercase value) — it was previously mislabeled under PAYMENT_STATUS.
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed',
};

// Reviewable order statuses — used in ProductDetail for "can review"
export const REVIEWABLE_STATUSES = [
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.PARTIALLY_REFUNDED,
  ORDER_STATUS.PARTIALLY_COMPLETED,
].join(',');

// Stale times for React Query — categorized by data volatility
export const STALE_TIMES = {
  STATIC: 600000,    // 10 min — categories, platforms, genres, SEO
  MODERATE: 120000,  // 2 min — bestsellers, trending, homepage data
  DYNAMIC: 30000,    // 30 sec — cart, notifications, orders
  REALTIME: 5000,    // 5 sec — chat messages
};

// Roles
export const ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  CUSTOMER: 'customer',
};
