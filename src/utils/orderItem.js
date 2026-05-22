/**
 * Resolve display name for an order line item (populated product or legacy shapes).
 */
export const getOrderItemProductName = (item, productsById) => {
  if (!item) return 'Product';

  if (typeof item.productId === 'object' && item.productId?.name) {
    return item.productId.name;
  }

  if (item.productName) {
    return item.productName;
  }

  const productId =
    typeof item.productId === 'object'
      ? item.productId?._id?.toString?.() || item.productId?._id
      : item.productId?.toString?.() || item.productId;

  if (productId && productsById?.[productId]?.name) {
    return productsById[productId].name;
  }

  if (Array.isArray(productsById)) {
    const match = productsById.find(
      (p) => (p._id?.toString?.() || p._id) === productId
    );
    if (match?.name) return match.name;
  }

  return 'Product';
};
