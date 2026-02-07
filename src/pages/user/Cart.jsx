import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartAPI, checkoutAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Trash2, ShoppingCart, Plus, Minus, Tag } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cart, isLoading, isError } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.getCart().then(res => res.data.data),
  });

  const removeItemMutation = useMutation({
    mutationFn: (data) => cartAPI.removeItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: (data) => cartAPI.updateCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartAPI.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (data) => checkoutAPI.createCheckoutSession(data),
    onSuccess: (data) => {
      const checkoutUrl = data.data.data?.approvalUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    },
  });

  const handleRemoveItem = (productId) => {
    removeItemMutation.mutate({ productId });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    updateCartMutation.mutate({ productId, qty: newQuantity });
  };

  const handleCheckout = () => {
    if (cart?.items?.length > 0) {
      checkoutMutation.mutate({});
    }
  };

  if (isLoading) return <Loading message="Loading cart..." />;
  if (isError) return <ErrorMessage message="Error loading cart" />;

  // Calculate totals using discounted prices from backend
  const subtotal = cart?.subtotal || 0;
  const bundleDiscount = cart?.bundleDiscount || 0;
  const total = cart?.total || subtotal;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Shopping Cart</h1>
        <p className="text-gray-400 mt-1">Review your items before checkout</p>
      </div>

      {cart?.items?.length > 0 ? (
        <>
          <Card className="bg-primary border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Cart Items</CardTitle>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                    clearCartMutation.mutate();
                }}
              >
                Clear Cart
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Product</TableHead>
                      <TableHead className="text-gray-300">Price</TableHead>
                      <TableHead className="text-gray-300">Quantity</TableHead>
                      <TableHead className="text-gray-300">Subtotal</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.items.map((item) => {
                      // Handle both response structures: { product, ... } and { productId, ... }
                      const product = item.product || item.productId;
                      const productId = product?._id || item.productId?._id || item.productId;
                      const productName = product?.name || item.productId?.name;
                      const productImage = product?.images?.[0] || item.productId?.images?.[0];
                      
                      // Get pricing information - prioritize stored discount data
                      const originalPrice = item.originalPrice || product?.price || item.productId?.price || 0;
                      const discountedPrice = item.discountedPrice || item.unitPrice || originalPrice;
                      const discountAmount = item.discountAmount || 0;
                      const discountPercentage = item.discountPercentage || 0;
                      const hasDiscount = item.hasDiscount !== undefined ? item.hasDiscount : (discountAmount > 0 || discountPercentage > 0);
                      const qty = item.qty || item.quantity || 1;
                      const lineTotal = item.totalPrice || (discountedPrice * qty);

                      return (
                        <TableRow key={productId} className="border-gray-700">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {productImage && (
                                <img
                                  src={productImage}
                                  alt={productName}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-medium text-white">{productName}</p>
                                {hasDiscount && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Tag className="w-3 h-3 text-green-400" />
                                    <span className="text-xs text-green-400 font-medium">
                                      {discountPercentage > 0 
                                        ? `${discountPercentage.toFixed(0)}% OFF`
                                        : `$${discountAmount.toFixed(2)} OFF`
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              {hasDiscount ? (
                                <>
                                  <span className="text-gray-400 line-through text-sm">
                                    ${originalPrice.toFixed(2)}
                                  </span>
                                  <span className="text-white font-semibold">
                                    ${discountedPrice.toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-white">${originalPrice.toFixed(2)}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateQuantity(productId, qty - 1)}
                                disabled={updateCartMutation.isPending}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="text-white w-8 text-center">{qty}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateQuantity(productId, qty + 1)}
                                disabled={updateCartMutation.isPending}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-white font-semibold">
                            ${lineTotal.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveItem(productId)}
                              disabled={removeItemMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              {bundleDiscount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Bundle Discount</span>
                  <span className="font-semibold">-${bundleDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-300">
                <span>Tax</span>
                <span className="text-white">$0.00</span>
              </div>
              <div className="border-t border-gray-700 pt-4 flex justify-between">
                <span className="text-lg font-semibold text-white">Total</span>
                <span className="text-lg font-bold text-white">${total.toFixed(2)}</span>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending}
                className="w-full bg-accent hover:bg-blue-700"
                size="lg"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {checkoutMutation.isPending ? 'Processing...' : 'Proceed to Checkout'}
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="bg-primary border-gray-700">
          <CardContent className="py-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400 text-lg mb-4">Your cart is empty</p>
            <Button onClick={() => navigate('/')} className="bg-accent hover:bg-blue-700">
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Cart;

