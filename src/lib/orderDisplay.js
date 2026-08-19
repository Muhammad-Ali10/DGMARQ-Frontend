/**
 * AUDIT FIX (DEAD-3): one order-id display helper.
 *
 * This existed as five near-identical private copies — admin/RefundDetail,
 * admin/ReturnRefundManagement, seller/RefundDetail, seller/ReturnRefunds and
 * user/RefundDetail — which had already drifted twice over: three fell back to
 * 'N/A' and two to '—', and only the buyer copy consulted `orderLike.orderId`.
 * This is the union: the extra branch is kept (it can only resolve MORE ids),
 * and the fallback string stays a parameter so no screen's current output
 * changes.
 *
 * @param {object|null|undefined} orderLike - a populated order, or a ref to one
 * @param {string} [fallback] - rendered when no id can be resolved
 */
export const getDisplayOrderId = (orderLike, fallback = 'N/A') => {
  if (!orderLike) return fallback;
  const orderNumber =
    typeof orderLike.orderNumber === 'string' ? orderLike.orderNumber.trim() : '';
  if (orderNumber) return orderNumber;
  const raw = orderLike._id?.toString?.() || orderLike.orderId?.toString?.() || '';
  return raw ? raw.slice(-8).toUpperCase() : fallback;
};
