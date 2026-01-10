import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Heart, Trash2, ShoppingCart, Eye } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { showSuccess, showApiError } from '../../utils/toast';
import { Loading } from '../../components/ui/loading';

const UserWishlist = () => {
  const queryClient = useQueryClient();
  const [showClearModal, setShowClearModal] = useState(false);

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await userAPI.getWishlist();
      const data = response.data.data;
      // Handle both array response (empty) and object response (with products)
      if (Array.isArray(data)) {
        return { products: [] };
      }
      return data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: (productId) => userAPI.removeFromWishlist({ productId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      showSuccess('Item removed from wishlist');
    },
    onError: (error) => {
      showApiError(error, 'Failed to remove item from wishlist');
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => userAPI.clearWishlist(),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      setShowClearModal(false);
      showSuccess('Wishlist cleared successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to clear wishlist');
    },
  });

  const handleRemove = (productId) => {
    removeMutation.mutate(productId);
  };

  const handleClear = () => {
    setShowClearModal(true);
  };

  if (isLoading) {
    return <Loading message="Loading wishlist..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Wishlist</h1>
          <p className="text-gray-400 mt-1">
            {wishlist?.products?.length > 0 
              ? `${wishlist.products.length} ${wishlist.products.length === 1 ? 'item' : 'items'} saved`
              : 'Your saved products will appear here'
            }
          </p>
        </div>
        {wishlist?.products?.length > 0 && (
          <Button
            onClick={handleClear}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-secondary hover:text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>
      
      {wishlist?.products?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.products
            .filter((item) => item.productId && item.productId._id)
            .map((item) => (
            <Card 
              key={item.productId?._id} 
              className="bg-primary border-gray-700 overflow-hidden group hover:border-accent/50 transition-all duration-300"
            >
              <div className="relative">
                {item.productId?.images?.[0] ? (
                  <Link to={`/product/${item.productId.slug || item.productId._id}`}>
                    <div className="relative overflow-hidden">
                      <img
                        src={item.productId.images[0]}
                        alt={item.productId.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </Link>
                ) : (
                  <div className="w-full h-48 bg-secondary flex items-center justify-center">
                    <ShoppingCart className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                <button
                  onClick={() => handleRemove(item.productId._id)}
                  className="absolute top-2 right-2 p-2 bg-primary/90 backdrop-blur-sm rounded-full border border-gray-700 hover:bg-secondary hover:border-accent transition-colors"
                  disabled={removeMutation.isPending}
                >
                  <Heart className="w-4 h-4 text-accent fill-accent" />
                </button>
              </div>
              
              <CardContent className="p-4">
                <Link to={`/product/${item.productId.slug || item.productId._id}`}>
                  <h3 className="font-semibold text-lg mb-2 text-white hover:text-accent transition-colors line-clamp-2">
                    {item.productId?.name}
                  </h3>
                </Link>
                
                <div className="flex items-center justify-between mb-4">
                  <p className="text-accent font-bold text-xl">
                    ${item.productId?.price?.toFixed(2)}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Link 
                    to={`/product/${item.productId.slug || item.productId._id}`}
                    className="flex-1"
                  >
                    <Button 
                      variant="outline" 
                      className="w-full border-gray-700 text-gray-300 hover:bg-accent hover:border-accent hover:text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  <Button
                    onClick={() => handleRemove(item.productId._id)}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-secondary hover:text-white"
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-primary border-gray-700">
          <CardContent className="py-16 text-center">
            <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Your wishlist is empty</h3>
            <p className="text-gray-400 mb-6">Start adding products you love to your wishlist</p>
            <Link to="/products">
              <Button className="bg-accent hover:bg-blue-700">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Browse Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <ConfirmationModal
        open={showClearModal}
        onOpenChange={setShowClearModal}
        title="Clear Wishlist"
        description="Are you sure you want to clear your entire wishlist? This action cannot be undone."
        confirmText="Clear Wishlist"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => clearMutation.mutate()}
      />
    </div>
  );
};

export default UserWishlist;

