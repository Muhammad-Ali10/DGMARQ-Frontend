/**
 * Resolve in-app notification deep links for the current user's role.
 * Legacy notifications may store bare or outdated paths.
 */
export const resolveNotificationActionUrl = (actionUrl, roles = []) => {
  if (!actionUrl || typeof actionUrl !== 'string') return null;

  const trimmed = actionUrl.trim();
  if (!trimmed) return null;

  const normalized = Array.isArray(roles)
    ? roles.map((r) => String(r).toLowerCase().trim())
    : [];
  const rolePrefix = normalized.includes('admin')
    ? '/admin'
    : normalized.includes('seller')
      ? '/seller'
      : '/user';

  // Already role-scoped
  if (
    trimmed.startsWith('/user/') ||
    trimmed.startsWith('/seller/') ||
    trimmed.startsWith('/admin/')
  ) {
    // Fix known broken role-scoped paths
    if (trimmed.startsWith('/seller/payouts/')) {
      return trimmed.replace('/seller/payouts/', '/seller/earnings/');
    }
    if (trimmed === '/seller/payouts') {
      return '/seller/earnings';
    }
    const sellerProductView = trimmed.match(/^\/seller\/products\/([^/]+)$/);
    if (sellerProductView) {
      return `/seller/products/${sellerProductView[1]}/edit`;
    }
    const adminWithdrawal = trimmed.match(/^\/admin\/payouts\/withdrawals\/([^/]+)$/);
    if (adminWithdrawal) {
      return '/admin/payouts';
    }
    const adminSellerPayoutAccount = trimmed.match(/^\/admin\/sellers\/([^/]+)\/payout-account$/);
    if (adminSellerPayoutAccount) {
      return `/admin/sellers/${adminSellerPayoutAccount[1]}`;
    }
    return trimmed;
  }

  if (trimmed.startsWith('/orders/')) {
    return `${rolePrefix}${trimmed}`;
  }

  if (trimmed.startsWith('/payouts/')) {
    const payoutId = trimmed.slice('/payouts/'.length);
    if (normalized.includes('seller')) return `/seller/earnings/${payoutId}`;
    if (normalized.includes('admin')) return `/admin/payouts`;
    return '/user/dashboard';
  }

  if (trimmed.startsWith('/return-refund') || trimmed.startsWith('/return-refunds')) {
    return `${rolePrefix}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
  }

  // Chat-reply notifications are stored role-agnostic (/chat or /chat?c=...).
  if (trimmed === '/chat' || trimmed.startsWith('/chat?') || trimmed.startsWith('/chat/')) {
    return `${rolePrefix}${trimmed}`;
  }

  return trimmed;
};

export const getNotificationPagination = (pagination, currentPage = 1) => {
  const totalPages = Math.max(1, Number(pagination?.pages ?? pagination?.totalPages ?? 1) || 1);
  const total = Number(pagination?.total ?? 0) || 0;
  const page = Math.max(1, Number(currentPage) || 1);
  return {
    totalPages,
    total,
    page,
    hasNextPage: pagination?.hasNextPage ?? page < totalPages,
    hasPrevPage: pagination?.hasPrevPage ?? page > 1,
  };
};
