import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { cartAPI, checkoutAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ShoppingCart, Trash2, Plus, Minus, LogIn, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../../components/ConfirmationModal';
import { showSuccess, showApiError } from '../../utils/toast';

const Cart = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  const { data: cart, isLoading, isError, error } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.getCart().then(res => res.data.data),
    enabled: isAuthenticated, // Only fetch if authenticated
    retry: false,
  });

  const removeItemMutation = useMutation({
    mutationFn: (data) => cartAPI.removeItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      showSuccess('Item removed from cart');
    },
    onError: (error) => {
      showApiError(error, 'Failed to remove item from cart');
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: (data) => cartAPI.updateCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
    onError: (error) => {
      showApiError(error, 'Failed to update cart');
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartAPI.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      showSuccess('Cart cleared successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to clear cart');
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
      navigate('/checkout');
    }
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <Card className="bg-[#041536] border-gray-700 max-w-md w-full mx-4">
          <CardContent className="py-12 px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Sign in to view your cart</h2>
            <p className="text-gray-400 mb-6">
              Please log in or create an account to access your shopping cart and continue shopping.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate('/login')}
                className="bg-accent hover:bg-accent/90 text-white"
                size="lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button
                onClick={() => navigate('/register')}
                variant="outline"
                className="border-accent text-accent hover:bg-accent/10"
                size="lg"
              >
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <Card className="bg-[#041536] border-gray-700 max-w-md w-full mx-4">
          <CardContent className="py-12 px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-900/20 flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Error loading cart</h2>
            <p className="text-gray-400 mb-6">
              {error?.response?.data?.message || 'Unable to load your cart. Please try again.'}
            </p>
            <Button
              onClick={() => queryClient.invalidateQueries(['cart'])}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate totals
  const subtotal = cart?.items?.reduce((sum, item) => {
    const product = item.product || item.productId;
    const price = product?.price || item.unitPrice || 0;
    const qty = item.qty || item.quantity || 0;
    return sum + (price * qty);
  }, 0) || 0;

  const bundleDiscount = cart?.bundleDiscount || 0;
  const total = (cart?.total !== undefined) ? cart.total : (subtotal - bundleDiscount);

  // Empty cart state
  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Shopping Cart</h1>
          <p className="text-gray-400 mb-8">Review your items before checkout</p>
          
          <Card className="bg-[#041536] border-gray-700">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">Your cart is empty</h2>
              <p className="text-gray-400 mb-6">Start adding products to your cart to see them here.</p>
              <Button
                onClick={() => navigate('/search')}
                className="bg-accent hover:bg-accent/90 text-white"
                size="lg"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Cart with items
  return (
    <div className="min-h-[60vh] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Shopping Cart</h1>
          <p className="text-gray-400">Review your items before checkout</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items - Left Column */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-[#041536] border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-white text-xl">Cart Items ({cart.items.length})</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearCartModal(true)}
                  disabled={clearCartMutation.isPending}
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {clearCartMutation.isPending ? 'Clearing...' : 'Clear Cart'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item) => {
                  const product = item.product || item.productId;
                  const qty = item.qty || item.quantity || 0;
                  const unitPrice = item.unitPrice || product?.price || 0;
                  const totalPrice = qty * unitPrice;

                  return (
                    <div
                      key={product?._id || item.productId?._id}
                      className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors"
                    >
                      {/* Product Image */}
                      <Link
                        to={`/product/${product?.slug || product?._id}`}
                        className="shrink-0 w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-gray-700"
                      >
                        {product?.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${product?.slug || product?._id}`}
                          className="block mb-2"
                        >
                          <h3 className="font-semibold text-white hover:text-accent transition-colors line-clamp-2">
                            {product?.name || 'Product'}
                          </h3>
                        </Link>
                        {product?.category?.name && (
                          <p className="text-sm text-gray-400 mb-2">{product.category.name}</p>
                        )}
                        <p className="text-lg font-bold text-accent">${unitPrice.toFixed(2)}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(product?._id || item.productId?._id, qty - 1)}
                            disabled={updateCartMutation.isPending || qty <= 1}
                            className="border-gray-600 text-white hover:bg-gray-700"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="text-white font-medium w-8 text-center">{qty}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(product?._id || item.productId?._id, qty + 1)}
                            disabled={updateCartMutation.isPending}
                            className="border-gray-600 text-white hover:bg-gray-700"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right">
                          <p className="text-sm text-gray-400 mb-1">Subtotal</p>
                          <p className="text-lg font-bold text-white">${totalPrice.toFixed(2)}</p>
                        </div>

                        {/* Remove Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(product?._id || item.productId?._id)}
                          disabled={removeItemMutation.isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - Right Column */}
          <div className="lg:col-span-1">
            <Card className="bg-[#041536] border-gray-700 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white text-xl">Order Summary</CardTitle>
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

                {cart?.bundleDeal && (
                  <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
                    <p className="text-sm text-accent font-medium">
                      🎉 Bundle Deal Applied!
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{cart.bundleDeal.title}</p>
                  </div>
                )}

                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-white">Total</span>
                    <span className="text-2xl font-bold text-accent">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={cart.items.length === 0}
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                  size="lg"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Proceed to Checkout
                </Button>

                <Button
                  onClick={() => navigate('/search')}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={showClearCartModal}
        onOpenChange={setShowClearCartModal}
        title="Clear Cart"
        description="Are you sure you want to clear your cart? This action cannot be undone."
        confirmText="Clear Cart"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => clearCartMutation.mutate()}
      />
    </div>
  );
};

export default Cart;

