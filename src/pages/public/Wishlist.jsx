import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { userAPI, cartAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Heart, ShoppingCart, Trash2, LogIn, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import ConfirmationModal from '../../components/ConfirmationModal';
import { showSuccess, showApiError } from '../../utils/toast';

const Wishlist = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showClearModal, setShowClearModal] = useState(false);

  const { data: wishlist, isLoading, isError, error } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await userAPI.getWishlist();
      const data = response.data.data;
      // Handle both array and object formats
      if (Array.isArray(data)) {
        return { products: data };
      }
      return data || { products: [] };
    },
    enabled: isAuthenticated, // Only fetch if authenticated
    retry: false,
  });

  const removeItemMutation = useMutation({
    mutationFn: (productId) => userAPI.removeFromWishlist({ productId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      queryClient.invalidateQueries(['wishlist-count']);
      showSuccess('Item removed from wishlist');
    },
    onError: (error) => {
      showApiError(error, 'Failed to remove item from wishlist');
    },
  });

  const clearWishlistMutation = useMutation({
    mutationFn: () => userAPI.clearWishlist(),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      queryClient.invalidateQueries(['wishlist-count']);
      showSuccess('Wishlist cleared successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to clear wishlist');
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: (productId) => cartAPI.addItem({ productId, qty: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      queryClient.invalidateQueries(['cart-count']);
      showSuccess('Item added to cart');
    },
    onError: (error) => {
      showApiError(error, 'Failed to add item to cart');
    },
  });

  const handleRemoveItem = (productId) => {
    removeItemMutation.mutate(productId);
  };

  const handleClearWishlist = () => {
    setShowClearModal(true);
  };

  const handleAddToCart = (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCartMutation.mutate(productId);
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <Card className="bg-[#041536] border-gray-700 max-w-md w-full mx-4">
          <CardContent className="py-12 px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Sign in to view your wishlist</h2>
            <p className="text-gray-400 mb-6">
              Please log in or create an account to access your wishlist and save your favorite products.
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
          <p className="text-gray-400">Loading your wishlist...</p>
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
              <Heart className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Error loading wishlist</h2>
            <p className="text-gray-400 mb-6">
              {error?.response?.data?.message || 'Unable to load your wishlist. Please try again.'}
            </p>
            <Button
              onClick={() => queryClient.invalidateQueries(['wishlist'])}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract products from wishlist data
  const products = wishlist?.products || [];
  const wishlistItems = products.map(item => item.productId || item);

  // Empty wishlist state
  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="min-h-[60vh] py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Wishlist</h1>
          <p className="text-gray-400 mb-8">Save your favorite products for later</p>
          
          <Card className="bg-[#041536] border-gray-700">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                <Heart className="w-12 h-12 text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">Your wishlist is empty</h2>
              <p className="text-gray-400 mb-6">Start adding products to your wishlist to see them here.</p>
              <Button
                onClick={() => navigate('/search')}
                className="bg-accent hover:bg-accent/90 text-white"
                size="lg"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Browse Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Wishlist with items
  return (
    <div className="min-h-[60vh] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Wishlist</h1>
            <p className="text-gray-400">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          {wishlistItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearWishlist}
              disabled={clearWishlistMutation.isPending}
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {clearWishlistMutation.isPending ? 'Clearing...' : 'Clear All'}
            </Button>
          )}
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((product) => {
            if (!product || !product._id) return null;

            const discountPrice = product.discount 
              ? product.price * (1 - product.discount / 100)
              : product.price;

            return (
              <Card
                key={product._id}
                className="bg-[#041536] border-gray-700 hover:border-accent/50 transition-all duration-300 group overflow-hidden"
              >
                {/* Remove from Wishlist Button */}
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveItem(product._id)}
                    disabled={removeItemMutation.isPending}
                    className="h-8 w-8 p-0 bg-gray-900/80 hover:bg-red-500/20 text-white hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Product Image */}
                <Link to={`/product/${product.slug || product._id}`} className="block">
                  <div className="relative aspect-video overflow-hidden bg-gray-800">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-12 h-12 text-gray-500" />
                      </div>
                    )}
                    {product.discount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute top-2 left-2"
                      >
                        -{product.discount}%
                      </Badge>
                    )}
                  </div>
                </Link>

                <CardContent className="p-4">
                  {/* Product Title */}
                  <Link to={`/product/${product.slug || product._id}`}>
                    <h3 className="font-semibold text-white text-base mb-2 line-clamp-2 hover:text-accent transition-colors min-h-[3rem]">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Category */}
                  {product.category?.name && (
                    <p className="text-sm text-gray-400 mb-3">{product.category.name}</p>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-4">
                    {product.discount > 0 ? (
                      <>
                        <span className="text-accent font-bold text-lg">
                          ${discountPrice.toFixed(2)}
                        </span>
                        <span className="text-gray-500 line-through text-sm">
                          ${product.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-accent font-bold text-lg">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  {product.stock !== undefined && (
                    <div className="mb-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        product.stock > 0 
                          ? 'bg-green-900/30 text-green-400' 
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => handleAddToCart(product._id, e)}
                      disabled={!product.stock || product.stock === 0 || addToCartMutation.isPending}
                      className="flex-1 bg-accent hover:bg-accent/90 text-white"
                      size="sm"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                    </Button>
                    <Button
                      onClick={() => handleRemoveItem(product._id)}
                      disabled={removeItemMutation.isPending}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Continue Shopping */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate('/search')}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
            size="lg"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      </div>

      <ConfirmationModal
        open={showClearModal}
        onOpenChange={setShowClearModal}
        title="Clear Wishlist"
        description="Are you sure you want to clear your entire wishlist? This action cannot be undone."
        confirmText="Clear Wishlist"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => clearWishlistMutation.mutate()}
      />
    </div>
  );
};

export default Wishlist;

