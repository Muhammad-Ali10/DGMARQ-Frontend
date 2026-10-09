export const getOrderItemProductName = (item) => {
  if (!item) return 'Product';
  if (typeof item.productId === 'object' && item.productId?.name) return item.productId.name;
  return item.productName || 'Product';
};
