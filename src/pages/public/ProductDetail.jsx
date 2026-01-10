import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productAPI, cartAPI, reviewAPI, userAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import ProductCard from '../../components/ProductCard';
import { 
  ShoppingCart, 
  Eye, 
  Star, 
  Package, 
  Store, 
  Tag,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Monitor,
  Gamepad2,
  Palette,
  MapPin,
  Verified,
  User,
  Send,
  MessageSquare
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');

  // Fetch product details
  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['product-detail', identifier],
    queryFn: async () => {
      try {
        const response = await productAPI.getProductById(identifier);
        return response.data.data;
      } catch (err) {
        console.error('Product fetch error:', err);
        throw err;
      }
    },
    retry: 1,
  });

  // Fetch user's completed orders for this product (for review submission)
  const { data: userOrders } = useQuery({
    queryKey: ['user-orders-for-review', product?._id],
    queryFn: async () => {
      if (!isAuthenticated || !product?._id) return [];
      try {
        const response = await userAPI.getMyOrders({ 
          status: 'completed',
          limit: 50 
        });
        // Filter orders that contain this product
        const ordersWithProduct = response.data.data.orders.filter(order => 
          order.items?.some(item => item.productId?._id === product._id || item.productId === product._id)
        );
        return ordersWithProduct;
      } catch (err) {
        console.error('Orders fetch error:', err);
        return [];
      }
    },
    enabled: isAuthenticated && !!product?._id,
  });

  // Fetch reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['product-reviews', product?._id, reviewsPage],
    queryFn: async () => {
      if (!product?._id) return { docs: [], totalDocs: 0 };
      try {
        const response = await reviewAPI.getReviews({
          productId: product._id,
          page: reviewsPage,
          limit: 5,
          sortBy: 'createdAt',
        });
        return response.data.data;
      } catch (err) {
        console.error('Reviews fetch error:', err);
        return { docs: [], totalDocs: 0 };
      }
    },
    enabled: !!product?._id,
  });

  // Fetch related products
  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.categoryId?._id, product?._id, product?.platform?._id, product?.type?._id],
    queryFn: async () => {
      if (!product?.categoryId?._id) return { docs: [] };
      try {
        const response = await productAPI.getProducts({
          categoryId: product.categoryId._id,
          status: 'active',
          limit: 12,
          page: 1,
        });
        const filtered = response.data.data.docs.filter(
          (p) => p._id !== product._id && p.stock > 0
        );
        const prioritized = filtered.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;
          if (product.platform?._id && a.platform?._id === product.platform._id) scoreA += 2;
          if (product.type?._id && a.type?._id === product.type._id) scoreA += 1;
          if (product.platform?._id && b.platform?._id === product.platform._id) scoreB += 2;
          if (product.type?._id && b.type?._id === product.type._id) scoreB += 1;
          return scoreB - scoreA;
        });
        return { ...response.data.data, docs: prioritized.slice(0, 6) };
      } catch (err) {
        console.error('Related products error:', err);
        return { docs: [] };
      }
    },
    enabled: !!product?.categoryId?._id && !!product?._id,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, qty }) => {
      return await cartAPI.addItem({ productId, qty });
    },
    onSuccess: () => {
      toast.success('Product added to cart!');
      queryClient.invalidateQueries(['cart']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add product to cart');
    },
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async ({ productId, orderId, rating, comment }) => {
      return await reviewAPI.createReview({ productId, orderId, rating, comment });
    },
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewComment('');
      setSelectedOrderId('');
      queryClient.invalidateQueries(['product-reviews']);
      queryClient.invalidateQueries(['product-detail', identifier]);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to submit review');
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!product.stock || product.stock < quantity) {
      toast.error('Insufficient stock');
      return;
    }

    addToCartMutation.mutate({
      productId: product._id,
      qty: quantity,
    });
  };

  const handleSubmitReview = () => {
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      navigate('/login');
      return;
    }

    if (!selectedOrderId) {
      toast.error('Please select an order');
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      toast.error('Please select a rating');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    submitReviewMutation.mutate({
      productId: product._id,
      orderId: selectedOrderId,
      rating: reviewRating,
      comment: reviewComment.trim(),
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const truncateDescription = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  if (isLoading) {
    return <Loading message="Loading product details..." />;
  }

  if (isError) {
    return (
      <ErrorMessage 
        message={error?.response?.data?.message || "Product not found"} 
      />
    );
  }

  if (!product) {
    return <ErrorMessage message="Product not found" />;
  }

  const discountPrice = product.discount 
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const images = product.images || [];
  const reviews = reviewsData?.docs || [];
  
  // Extract seller data - check multiple possible locations
  const seller = product?.sellerId || product?.seller || null;
  const shortDescription = truncateDescription(product.description, 150);
  const hasUserPurchased = userOrders && userOrders.length > 0;
  const userHasReviewed = reviews.some(r => r.userId === user?._id || r.user?._id === user?._id);
  
  // Check if seller exists and has valid data
  // Show section if seller is an object with data (shopName or _id), or if it's a valid string ID
  const hasSellerInfo = !!(
    seller && 
    seller !== null &&
    seller !== undefined &&
    (
      (typeof seller === 'object' && !Array.isArray(seller) && seller !== null && (seller.shopName || seller._id)) ||
      (typeof seller === 'string' && seller.length > 0)
    )
  );

  // Get sellerId for navigation - handle both object and string formats
  const getSellerId = () => {
    if (!seller) return null;
    
    // If seller is an object with _id (populated seller)
    if (typeof seller === 'object' && seller !== null && seller._id) {
      return seller._id.toString();
    }
    
    // If seller is a string (unpopulated sellerId)
    if (typeof seller === 'string') {
      return seller;
    }
    
    // Fallback: try to get from product.sellerId directly
    if (product?.sellerId) {
      if (typeof product.sellerId === 'object' && product.sellerId._id) {
        return product.sellerId._id.toString();
      }
      if (typeof product.sellerId === 'string') {
        return product.sellerId;
      }
    }
    
    return null;
  };

  const sellerId = getSellerId();
  const canNavigateToSeller = !!sellerId;

  // Collect product attributes for compact display
  const attributes = [];
  if (product.categoryId) attributes.push({ label: 'Category', value: product.categoryId.name, icon: Tag });
  if (product.subCategoryId) attributes.push({ label: 'Subcategory', value: product.subCategoryId.name, icon: Tag });
  if (product.platform?.name) attributes.push({ label: 'Platform', value: product.platform.name, icon: Package });
  if (product.region?.name) attributes.push({ label: 'Region', value: product.region.name, icon: MapPin });
  if (product.type?.name) attributes.push({ label: 'Type', value: product.type.name, icon: Tag });
  if (product.genre?.name) attributes.push({ label: 'Genre', value: product.genre.name, icon: Tag });
  if (product.mode?.name) attributes.push({ label: 'Mode', value: product.mode.name, icon: Gamepad2 });
  if (product.device?.name) attributes.push({ label: 'Device', value: product.device.name, icon: Monitor });
  if (product.theme?.name) attributes.push({ label: 'Theme', value: product.theme.name, icon: Palette });

  return (
    <div className="space-y-6 pb-8 container mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>Products</span>
          {product.categoryId && (
            <>
              <span>/</span>
              <span>{product.categoryId.name}</span>
            </>
          )}
          {product.subCategoryId && (
            <>
              <span>/</span>
              <span>{product.subCategoryId.name}</span>
            </>
          )}
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Media */}
        <div className="space-y-4">
          <Card className="bg-card border-gray-700 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-gray-900">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Package className="h-24 w-24" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {images.length > 1 && (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImageIndex === index
                      ? 'border-accent ring-2 ring-accent/50'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div className="space-y-5">
          {/* Title and Status */}
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {product.status === 'active' && (
                <Badge variant="success" className="text-sm">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              )}
              {product.isFeatured && (
                <Badge variant="default" className="bg-accent text-sm">
                  Featured
                </Badge>
              )}
              {product.productType && (
                <Badge variant="outline" className="text-sm">
                  {product.productType === 'ACCOUNT_BASED' ? 'Account Based' : 'License Key'}
                </Badge>
              )}
            </div>
            
            {/* Short Description */}
            {shortDescription && (
              <p className="text-gray-300 text-sm leading-relaxed mb-3 line-clamp-3">
                {shortDescription}
              </p>
            )}
          </div>

          {/* Rating and Views */}
          <div className="flex items-center gap-6 text-sm">
            {product.averageRating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : i < product.averageRating
                          ? 'fill-yellow-200 text-yellow-200'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white font-medium">
                  {product.averageRating.toFixed(1)}
                </span>
                {product.reviewCount > 0 && (
                  <span className="text-gray-400">
                    ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                )}
              </div>
            )}
            {product.viewCount !== undefined && (
              <div className="flex items-center gap-2 text-gray-400">
                <Eye className="h-4 w-4" />
                <span>{product.viewCount || 0} {product.viewCount === 1 ? 'view' : 'views'}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 flex-wrap">
            {product.discount > 0 ? (
              <>
                <span className="text-4xl font-bold text-accent">
                  ${discountPrice.toFixed(2)}
                </span>
                <span className="text-2xl text-gray-500 line-through">
                  ${product.price.toFixed(2)}
                </span>
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  -{product.discount}% OFF
                </Badge>
              </>
            ) : (
              <span className="text-4xl font-bold text-accent">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {product.stock > 0 ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-medium">
                  {product.stock} in stock
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-400 font-medium">Out of stock</span>
              </>
            )}
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-white font-medium">Quantity:</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-white font-semibold w-12 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))}
                  disabled={quantity >= (product.stock || 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={!product.stock || product.stock === 0 || addToCartMutation.isPending}
              className="w-full h-12 text-lg"
              size="lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>

          {/* Product Attributes - Compact Layout */}
          {attributes.length > 0 && (
            <Card className="bg-card border-gray-700">
              <CardHeader className="border-b border-gray-700 pb-3">
                <CardTitle className="text-white text-base">Product Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attributes.map((attr, index) => {
                    const Icon = attr.icon;
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-gray-400">{attr.label}:</span>
                        <span className="text-white font-medium">{attr.value}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Seller Information Section */}
      {hasSellerInfo && seller && typeof seller === 'object' && (
        <Card className="bg-card border-gray-700">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Store className="h-5 w-5" />
              Seller Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {seller?.shopLogo && (
                <div 
                  className={`shrink-0 ${canNavigateToSeller ? 'cursor-pointer transition-transform hover:scale-105' : ''}`}
                  onClick={canNavigateToSeller ? () => navigate(`/seller/${sellerId}`) : undefined}
                >
                  <img
                    src={seller.shopLogo}
                    alt={seller.shopName || 'Seller'}
                    className="w-20 h-20 rounded-lg object-cover border border-gray-700"
                  />
                </div>
              )}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 
                    className={`text-xl font-semibold text-white mb-1 ${canNavigateToSeller ? 'cursor-pointer hover:text-accent transition-colors' : ''}`}
                    onClick={canNavigateToSeller ? () => navigate(`/seller/${sellerId}`) : undefined}
                  >
                    {seller?.shopName || 'Seller'}
                  </h3>
                  {seller?.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(seller.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-400 text-sm">
                        {seller.rating.toFixed(1)} Seller Rating
                      </span>
                    </div>
                  )}
                </div>
                {seller?.description && (
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {seller.description}
                  </p>
                )}
                {(seller?.country || seller?.state || seller?.city) && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[seller.city, seller.state, seller.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  {seller?.status === 'approved' && (
                    <Badge variant="default" className="bg-green-600 text-white w-fit">
                      <Verified className="h-3 w-3 mr-1" />
                      Verified Seller
                    </Badge>
                  )}
                  {canNavigateToSeller && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/seller/${sellerId}`)}
                      className="hover:bg-accent hover:text-white transition-colors"
                    >
                      <Store className="h-4 w-4 mr-2" />
                      View Seller Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {product.description && (
        <Card className="bg-card border-gray-700">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-white">Description</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {product.description}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Section */}
      <Card className="bg-card border-gray-700">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Star className="h-5 w-5" />
              Reviews
              {product.reviewCount > 0 && (
                <span className="text-gray-400 font-normal text-base">
                  ({product.reviewCount})
                </span>
              )}
            </CardTitle>
            {isAuthenticated && hasUserPurchased && !userHasReviewed && !showReviewForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReviewForm(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Review Submission Form */}
          {showReviewForm && isAuthenticated && hasUserPurchased && (
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h3 className="text-white font-semibold mb-4">Write a Review</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm mb-2 block">Select Order</label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                  >
                    <option value="">Select an order...</option>
                    {userOrders.map((order) => (
                      <option key={order._id} value={order._id}>
                        Order #{order._id.toString().slice(-8)} - {formatDate(order.createdAt)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white text-sm mb-2 block">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setReviewRating(rating)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            rating <= reviewRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span className="text-gray-400 text-sm ml-2">
                        {reviewRating} {reviewRating === 1 ? 'star' : 'stars'}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-white text-sm mb-2 block">Comment</label>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="min-h-[100px] bg-gray-900 border-gray-700 text-white"
                    maxLength={1000}
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    {reviewComment.length}/1000 characters
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitReviewMutation.isPending || !selectedOrderId || reviewRating === 0 || !reviewComment.trim()}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewRating(0);
                      setReviewComment('');
                      setSelectedOrderId('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {reviewsLoading ? (
            <div className="text-center py-8">
              <Loading message="Loading reviews..." />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="border-b border-gray-700 pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      {review.user?.profileImage ? (
                        <img
                          src={review.user.profileImage}
                          alt={review.user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-white font-semibold">
                          {review.user?.name || 'Anonymous'}
                        </h4>
                        {review.isVerifiedPurchase && (
                          <Badge variant="default" className="bg-green-600 text-white text-xs">
                            <Verified className="h-3 w-3 mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-400 text-sm">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-300 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {reviewsData?.totalDocs > reviews.length && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setReviewsPage((prev) => prev + 1)}
                    disabled={reviewsLoading}
                  >
                    Load More Reviews
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Star className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No reviews yet</p>
              <p className="text-gray-500 text-sm">
                {isAuthenticated && hasUserPurchased
                  ? 'Be the first to review this product!'
                  : 'Be the first to review this product after purchase!'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Products */}
      {relatedProducts?.docs && relatedProducts.docs.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {relatedProducts.docs.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct._id}
                product={relatedProduct}
                onAddToCart={(productId) => {
                  if (!isAuthenticated) {
                    toast.error('Please login to add items to cart');
                    navigate('/login');
                    return;
                  }
                  addToCartMutation.mutate({ productId, qty: 1 });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
