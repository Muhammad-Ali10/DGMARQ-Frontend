import { useParams, useNavigate, Link } from 'react-router-dom';
import { keepPreviousData, useQuery, useMutation } from '@tanstack/react-query';
import { sellerAPI, chatAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { ProductCard } from '@features/catalog';
import { 
  Store, 
  Star, 
  Package, 
  MessageSquare, 
  MapPin,
  Calendar,
  User,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import SafeImage from '@components/ui/safe-image';
import { useSEO } from '@hooks/useSEO';
import { Pagination } from '@components/common/Pagination';

const PublicSellerProfile = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [productsPage, setProductsPage] = useState(1);
  const [productSearch, setProductSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(productSearch.trim());
      setProductsPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [productSearch]);

  const { data: sellerProfile, isLoading: profileLoading, isError: profileError } = useQuery({
    queryKey: ['seller-profile', sellerId],
    queryFn: () => sellerAPI.getPublicSellerProfile(sellerId).then(res => res.data.data),
  });

  const { data: productsData, isLoading: productsLoading, isFetching: productsFetching, isError: productsError } = useQuery({
    queryKey: ['seller-products', sellerId, productsPage, debouncedSearch],
    queryFn: () => sellerAPI.getSellerProducts(sellerId, { page: productsPage, limit: 10, search: debouncedSearch || undefined }).then(res => res.data.data),
    enabled: !!sellerId,
    placeholderData: keepPreviousData,
  });

  const { data: reviewsData, isLoading: reviewsLoading, isError: reviewsError } = useQuery({
    queryKey: ['seller-reviews', sellerId],
    queryFn: () => sellerAPI.getSellerReviews(sellerId).then(res => res.data.data),
    enabled: !!sellerId,
  });

  const createConversationMutation = useMutation({
    mutationFn: (data) => chatAPI.createConversation(data),
    onSuccess: (response) => {
      const conversation = response.data.data;
      toast.success('Conversation created! Opening chat...');
      navigate(`/user/chat?conversation=${conversation._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start conversation');
    },
  });

  const handleChatWithSeller = () => {
    if (!isAuthenticated) {
      toast.info('Please login to chat with the seller');
      navigate('/login', { state: { from: `/seller/${sellerId}` } });
      return;
    }

    createConversationMutation.mutate({
      sellerId: sellerId,
    });
  };

  const handlePageChange = (newPage) => {
    setProductsPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useSEO({
    title: sellerProfile?.shopName
      ? `${sellerProfile.shopName} | Seller on DGMARQ`
      : undefined,
    description: sellerProfile?.shopName
      ? `View listings by ${sellerProfile.shopName} on DGMARQ marketplace.`
      : undefined,
    canonical: sellerId ? `/seller/${sellerId}` : undefined,
  });

  if (profileLoading) {
    return <Loading message="Loading seller profile..." />;
  }

  if (profileError || !sellerProfile) {
    return <ErrorMessage message="Seller not found or profile is not available" />;
  }

  const products = productsData?.docs || [];
  const pagination = {
    page: productsData?.page,
    totalPages: productsData?.totalPages,
    totalDocs: productsData?.totalDocs,
  };
  const reviews = reviewsData?.recentReviews || [];
  const reviewSummary = reviewsData?.summary || { averageRating: 0, totalReviews: 0 };
  const location = [sellerProfile.city, sellerProfile.state, sellerProfile.country].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen container mx-auto  text-white">
      <div className="relative">
        {sellerProfile.shopBanner && (
          <div className="h-64 w-full overflow-hidden">
            <SafeImage 
              src={sellerProfile.shopBanner} 
              alt={sellerProfile.shopName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-[#0a1f3d] ">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary">
                    {sellerProfile.shopLogo ? (
                      <SafeImage 
                        src={sellerProfile.shopLogo} 
                        alt={sellerProfile.shopName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <Store className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold mb-2">{sellerProfile.shopName}</h1>
                      {sellerProfile.description && (
                        <p className="text-gray-300 mb-4">{sellerProfile.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        {location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{location}</span>
                          </div>
                        )}
                        {sellerProfile.user?.joinedDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Joined {new Date(sellerProfile.user.joinedDate).getFullYear()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleChatWithSeller}
                      disabled={createConversationMutation.isPending}
                      className="bg-background hover:bg-primary/90 text-white"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {createConversationMutation.isPending ? 'Starting...' : 'Chat with Seller'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-gray-700">
                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 text-center border border-gray-700/50">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                        <span className="text-xl sm:text-2xl font-bold">{sellerProfile.stats.totalProductsSold ?? 0}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400">Products Sold</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 text-center border border-gray-700/50">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Package className="h-5 w-5 text-accent-on-dark" />
                        <span className="text-xl sm:text-2xl font-bold">{sellerProfile.stats.totalProducts}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400">Products</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 text-center border border-gray-700/50">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Star className="h-5 w-5 text-yellow-400" />
                        <span className="text-xl sm:text-2xl font-bold">{reviewsError ? '—' : reviewSummary.averageRating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400">Average Rating</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 text-center border border-gray-700/50">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <User className="h-5 w-5 text-blue-400" />
                        <span className="text-xl sm:text-2xl font-bold">{reviewsError ? '—' : reviewSummary.totalReviews}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400">Reviews</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-[#0a1f3d] mb-6">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products ({sellerProfile.stats.totalProducts})
                </CardTitle>
                <input
                  type="search"
                  aria-label="Search this seller's products"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search this seller's products..."
                  className="w-full sm:w-64 rounded-lg border border-gray-700 bg-secondary px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent"
                />
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <Loading message="Loading products..." />
                ) : productsError ? (
                  <ErrorMessage className="h-auto py-6" message="Couldn't load this seller's products. Please try again." />
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <p>No products available</p>
                  </div>
                ) : (
                  <>
                    {productsFetching && (
                      <p className="mb-4 text-sm text-gray-400">Updating products...</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 items-stretch">
                      {products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                      ))}
                    </div>

                    <Pagination page={productsPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-[#0a1f3d] ">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <Loading message="Loading reviews..." />
                ) : reviewsError ? (
                  <ErrorMessage className="h-auto py-6" message="Couldn't load this seller's reviews. Please try again." />
                ) : (
                  <>
                    <div className="mb-6 pb-6 border-b border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl sm:text-3xl font-bold">
                          {reviewSummary.averageRating.toFixed(1)}
                        </span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= Math.round(reviewSummary.averageRating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">
                        Based on {reviewSummary.totalReviews} review{reviewSummary.totalReviews !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
                      {reviews.length === 0 ? (
                        <p className="text-gray-400 text-sm">No reviews yet</p>
                      ) : (
                        reviews.map((review) => (
                          <div key={review._id} className="pb-4 border-b border-gray-700 last:border-0">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                {review.user?.profileImage ? (
                                  <SafeImage
                                    src={review.user.profileImage}
                                    alt={review.user.name}
                                    className="w-10 h-10 rounded-full"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{review.user?.name || 'Anonymous'}</span>
                                  <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-3 w-3 ${
                                          star <= review.rating
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-600'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                {review.comment && (
                                  <p className="text-sm text-gray-300 mb-2">{review.comment}</p>
                                )}
                                {review.replies?.[0]?.replyText && (
                                  <div className="mb-2 border-l-2 border-gray-600 pl-3">
                                    <p className="text-xs font-medium text-gray-400">Seller reply</p>
                                    <p className="text-sm text-gray-300">{review.replies[0].replyText}</p>
                                  </div>
                                )}
                                {review.product?.name && (
                                  <p className="text-xs text-gray-500">
                                    Product:{' '}
                                    {review.product.slug ? (
                                      <Link to={`/product/${review.product.slug}`} className="hover:underline">{review.product.name}</Link>
                                    ) : (
                                      review.product.name
                                    )}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSellerProfile;

