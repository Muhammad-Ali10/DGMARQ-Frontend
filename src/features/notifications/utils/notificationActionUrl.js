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

  if (
    trimmed.startsWith('/user/') ||
    trimmed.startsWith('/seller/') ||
    trimmed.startsWith('/admin/')
  ) {
    if (trimmed.startsWith('/seller/payouts/')) {
      return trimmed.replace('/seller/payouts/', '/seller/earnings/');
    }
    if (trimmed === '/seller/payouts') {
      return '/seller/earnings';
    }
    const sellerProductView = trimmed.match(/^\/seller\/products\/([^/]+?)(?:\/edit)?$/);
    if (sellerProductView) {
      return `/seller/offers?productId=${sellerProductView[1]}`;
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

  if (trimmed === '/chat' || trimmed.startsWith('/chat?') || trimmed.startsWith('/chat/')) {
    return `${rolePrefix}${trimmed}`;
  }

  if (trimmed === '/support' || trimmed.startsWith('/support?')) {
    return `${rolePrefix}${trimmed}`;
  }

  return trimmed;
};

export const enterBuyerViewForUrl = (url, roles = []) => {
  if (typeof url !== 'string' || !url.startsWith('/user/')) return;
  const normalized = Array.isArray(roles) ? roles.map((r) => String(r).toLowerCase()) : [];
  if (normalized.includes('seller') && !normalized.includes('admin')) {
    try {
      sessionStorage.setItem('allowCustomerAccess', 'true');
    } catch {
      return;
    }
  }
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
