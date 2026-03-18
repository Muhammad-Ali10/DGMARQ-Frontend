// Order/payment status constants — single source of truth
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PARTIALLY_COMPLETED: 'partially_completed',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  FAILED: 'failed',
};

// Reviewable order statuses — used in ProductDetail for "can review"
export const REVIEWABLE_STATUSES = [
  ORDER_STATUS.COMPLETED,
  PAYMENT_STATUS.PARTIALLY_REFUNDED,
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
