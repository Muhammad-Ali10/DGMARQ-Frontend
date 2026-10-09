import { formatDisplayPrice } from './currencyDisplay';

export const formatOrderAmount = (usdAmount, order) => {
  const currency = order?.displayCurrency || 'USD';
  return formatDisplayPrice(usdAmount, currency, { [currency]: Number(order?.displayRate) });
};

export const getDisplayOrderId = (orderLike, fallback = 'N/A') => {
  if (!orderLike) return fallback;
  const orderNumber =
    typeof orderLike.orderNumber === 'string' ? orderLike.orderNumber.trim() : '';
  if (orderNumber) return orderNumber;
  const raw = orderLike._id?.toString?.() || orderLike.orderId?.toString?.() || '';
  return raw ? raw.slice(-8).toUpperCase() : fallback;
};
