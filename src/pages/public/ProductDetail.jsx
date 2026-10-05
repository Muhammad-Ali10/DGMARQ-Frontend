import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productAPI, cartAPI, reviewAPI, userAPI } from '@services/api';
import { useSEO, generateProductSEO } from '@hooks/useSEO';
import { Textarea } from '@components/ui/textarea';
import { Loading, ErrorMessage } from '@components/ui/loading';
import RegionBadges from '@features/catalog/components/RegionBadges';
import RegionRestrictionModal from '@features/catalog/components/RegionRestrictionModal';
import ProductTypeNotice, { ProductTypeBadge } from '@features/catalog/components/ProductTypeNotice';
import useCurrency from '@hooks/useCurrency';
import useBuyerCountry from '@hooks/useBuyerCountry';
import { isActivePreorder as isUnreleasedPreorder } from '@components/common/PreorderBadge';
import { resolveOfferAvailability, isBuyerCompatible, describeOfferAvailability, countryName } from '@lib/regionCompat';
import {
  ShoppingCart,
  Eye,
  Star,
  Package,
  Store,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  XCircle,
  MapPin,
  Verified,
  User,
  Send,
  MessageSquare,
  Heart,
  Zap,
  ShieldCheck,
  Sparkles,
  FileText,
  Cpu,
  FileKey,
  HelpCircle,
  Grid3x3,
  Lock,
  Clock,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { addToGuestCart } from '@features/cart-checkout';
import { ProductCard, useWishlist, useLiveProductReviews, flattenReviewPages, calculateProductPrice, getPlatformName, getTypeName, getProductPath, isMongoObjectId, selectFeaturedOffer, isAllOutOfStock, PRODUCT_IMAGE_PLACEHOLDER } from '@features/catalog';
import SafeImage from '@components/ui/safe-image';
import './ProductDetail.css';

const ProductDetail = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { format: formatPrice } = useCurrency();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imgFading, setImgFading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [offerSort, setOfferSort] = useState('price'); // 'price' | 'rating'
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [openAcc, setOpenAcc] = useState({ description: true, sysreq: false, activation: false, faq: false });
  const [openFaq, setOpenFaq] = useState(null);
  const [regionModalOpen, setRegionModalOpen] = useState(false);

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['product-detail', identifier],
    queryFn: async () => {
      const response = await productAPI.getProductById(identifier);
      return response.data.data;
    },
    retry: 1,
    // Guests get no live review push (no socket), so the rating, count and star
    // bars refresh when they come back to the tab — only once the 30s staleTime
    // has passed, which keeps this to at most one request per return.
    refetchOnWindowFocus: true,
  });

  // Buyer country → picks the region-compatible featured offer + drives the
  // trust card / restrictions modal (computed once product + offers are loaded).
  const { country: buyerCountry } = useBuyerCountry();

  useEffect(() => {
    if (!product?.slug || !identifier) return;
    if (isMongoObjectId(identifier) && product.slug !== identifier) {
      navigate(getProductPath(product), { replace: true });
    }
  }, [product, identifier, navigate]);

  // Wishlist state — shared with every ProductCard on the page (including the
  // related-products row below), so the detail heart and those hearts can never
  // disagree about the same product.
  const {
    isWishlisted: isProductWishlisted,
    toggle: toggleWishlist,
    isPending: wishlistPending,
  } = useWishlist();
  const isWishlisted = isProductWishlisted(product?._id);

  const { data: userOrders } = useQuery({
    queryKey: ['user-orders-for-review', product?._id],
    queryFn: async () => {
      if (!isAuthenticated || !product?._id) return [];
      try {
        // PERF: this used to fetch 50 FULL orders and filter client-side, which
        // put commissionAmount, sellerEarning and the PayPal capture/payer ids
        // on the wire of a public product page. The endpoint now answers the
        // question directly and returns only _id + createdAt per match — the
        // two fields the order picker below renders.
        const response = await userAPI.getProductPurchase(product._id);
        return response.data.data.orders;
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated && !!product?._id,
  });

  // Newest first; "Load More" APPENDS the next page (it used to swap page 1 out).
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    isFetching: reviewsFetching,
    isFetchingNextPage: reviewsLoadingMore,
    hasNextPage: hasMoreReviews,
    fetchNextPage: loadMoreReviews,
  } = useInfiniteQuery({
    queryKey: ['product-reviews', product?._id],
    queryFn: async ({ pageParam }) => {
      try {
        const response = await reviewAPI.getReviews({
          productId: product._id,
          page: pageParam,
          limit: 5,
          sortBy: 'createdAt',
        });
        return response.data.data;
      } catch {
        return { docs: [], hasNextPage: false };
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPage : undefined),
    enabled: !!product?._id,
    // Same tab-focus refresh as the product query, for guests.
    refetchOnWindowFocus: true,
  });

  // Logged-in visitors: reviews other people write, edit or delete appear live.
  useLiveProductReviews(product?._id, identifier);

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.categoryId?._id, product?._id, product?.platform?._id],
    queryFn: async () => {
      if (!product?.categoryId?._id) return { docs: [] };
      try {
        const response = await productAPI.getProducts({
          categoryId: product.categoryId._id,
          status: 'active',
          limit: 12,
          page: 1,
        });
        const filtered = response.data.data.docs.filter((p) => p._id !== product._id && p.stock > 0);
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
      } catch {
        return { docs: [] };
      }
    },
    enabled: !!product?.categoryId?._id && !!product?._id,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, qty, sellerId }) => {
      return await cartAPI.addItem({ productId, qty, sellerId });
    },
    onSuccess: () => {
      toast.success('Product added to cart!');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add product to cart');
    },
  });

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
      // Collapse to the first page before refetching: the new review is the
      // newest, so it heads page 1, and re-requesting every page the visitor
      // had expanded would be wasted calls.
      const reviewsKey = ['product-reviews', product._id];
      queryClient.setQueryData(reviewsKey, (data) => data && {
        pages: data.pages.slice(0, 1),
        pageParams: data.pageParams.slice(0, 1),
      });
      queryClient.invalidateQueries({ queryKey: reviewsKey });
      // The server drops its cached copy of this page on every review write,
      // so this refetch returns the new rating, count and star bars.
      queryClient.invalidateQueries({ queryKey: ['product-detail', identifier] });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    },
    onError: (error) => {
      const errors = error?.response?.data?.errors;
      const firstError = Array.isArray(errors) && errors[0]?.message ? errors[0].message : error?.response?.data?.message;
      toast.error(firstError || 'Failed to submit review');
    },
  });

  // Returns false when a guard rejected the add, so "Purchase as guest" knows
  // not to send the buyer on to checkout.
  const handleAddToCart = () => {
    if (!featuredStock || featuredStock < quantity) {
      toast.error('Insufficient stock');
      return false;
    }
    // No seller covers the buyer's region — warn, but still allow (region info is
    // advisory, purchase is never hard-blocked).
    if (boVerdict === false) {
      toast.warning(`This key cannot be activated in ${boCountryName || 'your region'} — adding anyway.`);
    }

    // M21 login gate, enforced where the guest actually is. The server refuses
    // a guest pre-order at checkout, but letting one into the guest cart first
    // means the buyer only finds out after filling in a whole checkout — and
    // the 401 that says so arrives as a bare auth error, not as this sentence.
    if (!isAuthenticated && isUnreleasedPreorder(product)) {
      toast.error('Pre-orders need an account — please log in to pre-order this.');
      navigate('/login');
      return false;
    }

    if (!isAuthenticated) {
      addToGuestCart({
        productId: product._id,
        qty: quantity,
        price: safeDiscountedPrice,
        originalPrice: safeOriginalPrice,
        discountPercentage: displayDiscountPercent,
        sellerId: featuredOffer?.sellerId || product.sellerId,
        shopName: featuredOffer?.shopName || null,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0],
        platformName: getPlatformName(product),
        typeName: getTypeName(product),
      });
      toast.success('Added to cart');
      return true;
    }

    addToCartMutation.mutate({
      productId: product._id,
      qty: quantity,
      sellerId: featuredOffer?.sellerId || product.sellerId,
    });
    return true;
  };

  // Buy Now (logged-in): add this item to the cart, then go straight to
  // checkout. Checkout defaults to PayPal, so the PayPal button lands there too.
  const handleBuyNow = async () => {
    if (!featuredStock || featuredStock < quantity) {
      toast.error('Insufficient stock');
      return;
    }
    if (boVerdict === false) {
      toast.warning(`This key cannot be activated in ${boCountryName || 'your region'} — continuing anyway.`);
    }
    try {
      await addToCartMutation.mutateAsync({
        productId: product._id,
        qty: quantity,
        sellerId: featuredOffer?.sellerId || product.sellerId,
      });
      navigate('/checkout');
    } catch {
      // addToCartMutation surfaces its own error toast
    }
  };

  const addOfferToCart = (offer) => {
    if (!offer?.inStock) {
      toast.error('This seller is out of stock');
      return;
    }
    // Same gate as the main button — this is the "other sellers" row, which is
    // a second way into the guest cart.
    if (!isAuthenticated && isUnreleasedPreorder(product)) {
      toast.error('Pre-orders need an account — please log in to pre-order this.');
      navigate('/login');
      return;
    }

    if (!isAuthenticated) {
      addToGuestCart({
        productId: product._id,
        qty: 1,
        price: offer.price,
        originalPrice: offer.price,
        discountPercentage: offer.discount || 0,
        sellerId: offer.sellerId,
        shopName: offer.shopName || null,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0],
        platformName: getPlatformName(product),
        typeName: getTypeName(product),
      });
      toast.success('Added to cart');
      return;
    }
    addToCartMutation.mutate({ productId: product._id, qty: 1, sellerId: offer.sellerId });
  };

  // The hook owns the signed-out redirect and the optimistic update.
  const handleToggleWishlist = () => toggleWishlist(product._id);

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
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      toast.error('Please select a rating between 1 and 5 stars');
      return;
    }
    const trimmedComment = (reviewComment || '').trim();
    if (!trimmedComment) {
      toast.error('Please enter a comment');
      return;
    }
    if (trimmedComment.length < 10) {
      toast.error('Comment must be at least 10 characters');
      return;
    }
    submitReviewMutation.mutate({
      productId: String(product._id),
      orderId: String(selectedOrderId),
      rating: Number(reviewRating),
      comment: trimmedComment,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const productSEO = product ? generateProductSEO(product) : null;
  const productPath = product ? getProductPath(product) : undefined;
  const productImage = Array.isArray(product?.images) && product.images[0] ? product.images[0] : undefined;

  useSEO({
    title: productSEO?.title,
    description: productSEO?.description,
    image: productImage,
    canonical: productPath,
    useDefaults: true,
  });

  if (isLoading) {
    return <Loading message="Loading product details..." />;
  }
  if (isError) {
    return <ErrorMessage message={error?.response?.data?.message || 'Product not found'} />;
  }
  if (!product) {
    return <ErrorMessage message="Product not found" />;
  }

  // Featured offer = the cheapest in-stock offer the BUYER CAN ACTIVATE; falls
  // back to the cheapest overall when no seller covers the buyer's region. It
  // drives the whole buy box (price, stock, seller, qty cap, region), so the
  // buyer never adds an un-activatable key by default and never hits a
  // product-total qty cap the chosen seller can't fill.
  const featuredOffer = selectFeaturedOffer(product.offers, product.bestOffer, (o) =>
    isBuyerCompatible(resolveOfferAvailability(o), buyerCountry)
  );
  const featuredStock = featuredOffer?.availableKeysCount ?? (product.stock || 0);

  const {
    originalPrice: safeOriginalPrice,
    discountPrice: safeDiscountedPrice,
    discountPercentage: displayDiscountPercent,
  } = calculateProductPrice(featuredOffer || product);
  const hasDiscount = safeDiscountedPrice < safeOriginalPrice;

  const images = Array.isArray(product.images)
    ? product.images.filter((image) => typeof image === 'string' && image.trim())
    : [];
  const galleryImages = images.length > 0 ? images : [PRODUCT_IMAGE_PLACEHOLDER];

  const goToImage = (idx) => {
    const total = galleryImages.length;
    if (total <= 1) return;
    const next = ((idx % total) + total) % total;
    setImgFading(true);
    setTimeout(() => {
      setSelectedImageIndex(next);
      setImgFading(false);
    }, 130);
  };

  const reviews = flattenReviewPages(reviewsData);

  const seller = product?.sellerId || product?.seller || null;

  const sortedOffers = (() => {
    const list = [...(product?.offers || [])];
    if (offerSort === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (a.price || 0) - (b.price || 0));
    } else {
      list.sort((a, b) => (a.inStock === b.inStock ? 0 : a.inStock ? -1 : 1) || (a.price || 0) - (b.price || 0));
    }
    return list;
  })();

  const hasUserPurchased = userOrders && userOrders.length > 0;
  const userHasReviewed = reviews.some((r) => r.userId === user?._id || r.user?._id === user?._id);

  const hasSellerInfo = !!(
    seller &&
    typeof seller === 'object' &&
    !Array.isArray(seller) &&
    (seller.shopName || seller._id)
  );

  const getSellerId = () => {
    if (!seller) return null;
    if (typeof seller === 'object' && seller._id) return seller._id.toString();
    if (typeof seller === 'string') return seller;
    return null;
  };
  const sellerId = getSellerId();
  const canNavigateToSeller = !!sellerId;

  const platformDisplay = getPlatformName(product);
  const typeDisplay = getTypeName(product);
  // M21: unreleased pre-order — buyable without stock, delivered at release.
  // The rule lives in PreorderBadge so the badge, the seller screens and this
  // page cannot drift apart on what "still a pre-order" means.
  const isActivePreorder = isUnreleasedPreorder(product);

  // CLIENT REQ (out-of-stock automation, requirement 4): "Out of Stock" only
  // when EVERY live seller is out — see isAllOutOfStock.
  const allOutOfStock = isAllOutOfStock(product, isActivePreorder);
  const regionName = product.region?.name || null;

  // Featured-offer ACTIVATION region (real) → trust card + restrictions modal.
  // Falls back to the product taxonomy tag only when there's no live offer yet.
  const bo = featuredOffer;
  const boAvail = bo ? resolveOfferAvailability(bo) : null;
  const boVerdict = bo ? isBuyerCompatible(boAvail, buyerCountry) : null;
  const boCountryName = buyerCountry ? countryName(buyerCountry) : null;
  const boDetail = bo ? describeOfferAvailability(bo) : null;
  const boRegionLabel = !bo
    ? (regionName || 'GLOBAL')
    : boAvail?.global
      ? 'GLOBAL'
      : boDetail?.regionNames.length
        ? boDetail.regionNames.join(', ')
        : boAvail?.unrestricted
          ? 'GLOBAL'
          : `${boAvail?.allowed.size || 0} countries`;

  // Product Details — split into two balanced columns.
  const detailItems = [];
  if (product.categoryId?.name) detailItems.push({ label: 'Category', value: product.categoryId.name });
  if (platformDisplay) detailItems.push({ label: 'Platform', value: platformDisplay });
  if (typeDisplay) detailItems.push({ label: 'Type', value: typeDisplay });
  if (product.mode?.name) detailItems.push({ label: 'Mode', value: product.mode.name });
  if (product.publishers) detailItems.push({ label: 'Publisher', value: product.publishers });
  if (product.releaseDate) detailItems.push({ label: 'Released', value: formatDate(product.releaseDate) });
  if (product.subCategoryId?.name) detailItems.push({ label: 'Subcategory', value: product.subCategoryId.name });
  if (regionName) detailItems.push({ label: 'Region', value: regionName, isRegion: true });
  if (product.genre?.name) detailItems.push({ label: 'Genre', value: product.genre.name });
  if (product.device?.name) detailItems.push({ label: 'Device', value: product.device.name });
  if (product.developers) detailItems.push({ label: 'Developer', value: product.developers });
  if (product.theme?.name) detailItems.push({ label: 'Theme', value: product.theme.name });
  const midpoint = Math.ceil(detailItems.length / 2);
  const detailLeft = detailItems.slice(0, midpoint);
  const detailRight = detailItems.slice(midpoint);

  // Review distribution from the currently-loaded reviews (best-effort).
  // Per-star counts over ALL public reviews, kept on the product by the server
  // (these bars used to count only the 5 reviews on screen). A product whose last
  // review predates the field has none yet, and simply draws no bars.
  const ratingDist = product.ratingBreakdown
    ? [5, 4, 3, 2, 1].map((star) => ({ star, count: product.ratingBreakdown[star - 1] || 0 }))
    : null;
  const distTotal = product.reviewCount || 1;

  const otherOffersCount = Math.max((product.offers?.length || 0) - 1, 0);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleAcc = (key) => setOpenAcc((s) => ({ ...s, [key]: !s[key] }));

  const faqs = [
    {
      q: 'Where do products on DGMARQ come from?',
      a: 'Products on DGMARQ are sold by verified third-party sellers from around the world. All sellers go through a full KYC verification process before they can list. Keys are sourced through legitimate retail and wholesale channels.',
    },
    {
      q: 'Is it safe to buy products on DGMARQ?',
      a: "Yes. DGMARQ uses a secure escrow system — your payment is held until you confirm the key works. Every seller is identity-verified and all transactions are protected by our Buyer Protection policy.",
    },
    {
      q: "How do I verify a seller's reliability?",
      a: "Each seller profile displays their rating, completed sales, and buyer reviews. Higher-rated sellers with more completed transactions are generally a safer choice.",
    },
    {
      q: 'Can I get a refund for a product I purchased?',
      a: "Eligible purchases can be refunded within the refund window. If the key you received is invalid, already used, or doesn't work as described, you can open a dispute through your order page.",
    },
  ];

  return (
    <div className="pd-fx space-y-6 pb-8 container mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => navigate(-1)} className="hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>Products</span>
          {product.categoryId?.name && (
            <>
              <span>/</span>
              <span>{product.categoryId.name}</span>
            </>
          )}
          {product.subCategoryId?.name && (
            <>
              <span>/</span>
              <span>{product.subCategoryId.name}</span>
            </>
          )}
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </div>
      </nav>

      {/* Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Images */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-700 bg-card overflow-hidden">
            <div className="relative aspect-video bg-gray-900 product-gallery">
              <SafeImage
                src={galleryImages[selectedImageIndex]}
                alt={product.name}
                className={`w-full h-full object-contain product-gallery-main-image ${imgFading ? 'fading' : ''}`}
                fallbackSrc={PRODUCT_IMAGE_PLACEHOLDER}
              />
              {galleryImages.length > 1 && (
                <>
                  <button type="button" className="product-gallery-arrow prev" aria-label="Previous image" onClick={() => goToImage(selectedImageIndex - 1)}>
                    <ChevronLeft />
                  </button>
                  <button type="button" className="product-gallery-arrow next" aria-label="Next image" onClick={() => goToImage(selectedImageIndex + 1)}>
                    <ChevronRight />
                  </button>
                  <div className="product-gallery-counter">
                    {selectedImageIndex + 1} / {galleryImages.length}
                  </div>
                </>
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => goToImage(index)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImageIndex === index ? 'border-accent ring-2 ring-accent/50' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {/* AUDIT FIX (PERF-11): five-column gallery thumbs render at ~110px; w= also enables the 1x/2x srcSet. */}
                  <SafeImage src={image} alt={`${product.name} - ${index + 1}`} className="w-full h-full object-cover" w={128} fallbackSrc={PRODUCT_IMAGE_PLACEHOLDER} />
                </button>
              ))}
            </div>
          )}

          {/* Trust Badges (static) */}
          <div style={{ background: 'linear-gradient(135deg,rgba(23,42,164,0.18),rgba(14,159,226,0.08))', border: '1px solid rgba(14,159,226,0.2)', borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(14,159,226,0.5),transparent)' }} />
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trusted &amp; Secure</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { c: '46,207,176', t: 'Buyer Protection', s: 'Every purchase covered by DGMARQ', icon: <ShieldCheck width={18} height={18} stroke="#2ecfb0" /> },
                { c: '123,159,255', t: 'Secure Checkout', s: 'SSL encrypted & safe payments', icon: <Lock width={18} height={18} stroke="#7B9FFF" /> },
                { c: '14,159,226', t: 'Authentic Products', s: 'Every listing verified for legitimacy', icon: <CheckCircle width={18} height={18} stroke="#0E9FE2" /> },
                { c: '249,115,22', t: '24/7 Support', s: "We're here whenever you need us", icon: <MessageSquare width={18} height={18} stroke="#f97316" /> },
              ].map((b) => (
                <div key={b.t} style={{ background: `rgba(${b.c},0.06)`, border: `1px solid rgba(${b.c},0.18)`, borderRadius: 10, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ width: 34, height: 34, background: `rgba(${b.c},0.12)`, border: `1px solid rgba(${b.c},0.25)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{b.t}</div>
                    {/* Token, not rgba(255,255,255,0.42): that measured 3.78:1
                        on this surface, under the 4.5:1 AA floor for 10.5px
                        body text. --fg-muted measures 7.65:1. */}
                    <div className="text-fg-muted" style={{ fontSize: 10.5, lineHeight: 1.45 }}>{b.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="space-y-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">{product.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {product.status === 'active' && product.stock > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium bg-green-600 text-white text-sm">
                  <CheckCircle className="h-3 w-3" /> Available
                </span>
              )}
              {product.hasFeaturedOffer && <span className="inline-flex items-center rounded-full px-2 py-0.5 font-medium bg-accent text-white text-sm">Featured</span>}
              {typeDisplay && <span className="inline-flex items-center rounded-full border border-gray-600 px-2 py-0.5 font-medium text-white text-sm">{typeDisplay}</span>}

              {/* Trustpilot pill (static) */}
              <span className="tp-pill" aria-label="Rated Excellent on Trustpilot">
                <span className="tp-label">Excellent</span>
                <span className="tp-stars" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="tp-star">
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="#fff"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                    </span>
                  ))}
                  <span className="tp-star tp-star-half">
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="#fff"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                  </span>
                </span>
                <span className="tp-brand">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="#00B67A"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                  <span>Trustpilot</span>
                </span>
              </span>
            </div>

            {product.description && (
              <p className="text-gray-300 text-sm leading-relaxed mb-3 line-clamp-3">
                {product.description}{' '}
                <button
                  className="text-accent-on-dark text-xs font-medium hover:underline"
                  onClick={() => {
                    setOpenAcc((s) => ({ ...s, description: true }));
                    scrollTo('pd-description');
                  }}
                >
                  Read more
                </button>
              </p>
            )}
          </div>

          {/* Rating + views */}
          <div className="flex items-center gap-4 text-gray-400 text-sm flex-wrap">
            {product.averageRating > 0 && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(product.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                  ))}
                </span>
                <span className="text-white font-bold">{product.averageRating.toFixed(1)}</span>
                {product.reviewCount > 0 && (
                  <button className="text-[#7fb0ff] hover:underline" onClick={() => scrollTo('pd-reviews')}>
                    {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
                  </button>
                )}
              </div>
            )}
            {product.viewCount !== undefined && (
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{product.viewCount || 0} views</span>
              </div>
            )}
          </div>

          {/* Trust HUD 2x2 */}
          <div className="grid grid-cols-2 gap-2" style={{ alignItems: 'stretch' }}>
            <div className="trust-card" style={{ '--tc-grad': 'linear-gradient(135deg,#2ecfb0,#0e9fe2,transparent 70%)' }}>
              <div className="trust-glow" style={{ top: -30, right: -20, background: '#2ecfb0' }} />
              <div className="trust-card-inner">
                <div className="trust-icon" style={{ background: 'radial-gradient(circle at 30% 30%,rgba(46,207,176,0.35),rgba(46,207,176,0.08))', border: '1px solid rgba(94,240,212,0.5)' }}>
                  <MapPin width={17} height={17} stroke="#7dd3fc" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1.5">
                    <span style={{ background: 'linear-gradient(90deg,rgba(46,207,176,0.25),rgba(14,159,226,0.15))', color: '#5af0d4', fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(94,240,212,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{boRegionLabel}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.68)', margin: '0 0 6px', lineHeight: 1.55 }}>
                    {boVerdict === false ? (
                      <>Cannot be activated in <span style={{ color: '#f87171', fontWeight: 700 }}>{boCountryName}</span></>
                    ) : boCountryName ? (
                      <>Can be activated in <span style={{ color: '#5af0d4', fontWeight: 700 }}>{boCountryName}</span></>
                    ) : (boAvail?.global || boAvail?.unrestricted) ? (
                      <>Can be activated <span style={{ color: '#5af0d4', fontWeight: 700 }}>worldwide</span></>
                    ) : (
                      <>Region of activation for this product.</>
                    )}
                  </p>
                  {bo && (
                    <button
                      type="button"
                      className="trust-link"
                      onClick={() => setRegionModalOpen(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, borderRadius: 999, padding: '3px 9px', color: '#ffd166', border: '1px solid rgba(255,209,102,0.35)', background: 'rgba(255,209,102,0.06)', cursor: 'pointer' }}
                    >
                      Check region restrictions
                      <ChevronRight width={10} height={10} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="trust-card" style={{ '--tc-grad': 'linear-gradient(135deg,#c6d4df,#7B9FFF,transparent 70%)' }}>
              <div className="trust-glow" style={{ top: -30, right: -20, background: '#c6d4df' }} />
              <div className="trust-card-inner">
                <div className="trust-icon" style={{ background: 'radial-gradient(circle at 30% 30%,rgba(198,212,223,0.3),rgba(139,175,196,0.08))', border: '1px solid rgba(198,212,223,0.45)' }}>
                  <Package width={17} height={17} stroke="#c6d4df" />
                </div>
                <div className="flex-1 min-w-0">
                  <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4, fontWeight: 700 }}>Platform</span>
                  <span className="text-white font-extrabold block" style={{ fontSize: 14.5 }}>{platformDisplay || 'Multi'}</span>
                </div>
              </div>
            </div>
            <div className="trust-card" style={{ '--tc-grad': 'linear-gradient(135deg,#0E9FE2,#172AA4,transparent 70%)' }}>
              <div className="trust-glow" style={{ bottom: -30, left: -20, background: '#0E9FE2' }} />
              <div className="trust-card-inner">
                <div className="trust-icon" style={{ background: 'radial-gradient(circle at 30% 30%,rgba(14,159,226,0.32),rgba(14,159,226,0.06))', border: '1px solid rgba(108,200,245,0.45)' }}>
                  <ShieldCheck width={17} height={17} stroke="#6cc8f5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs block mb-1" style={{ color: '#6cc8f5' }}>Dispute Protection</span>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>Every purchase is protected by escrow &amp; dispute resolution.</p>
                </div>
              </div>
            </div>
            <div className="trust-card" style={{ '--tc-grad': 'linear-gradient(135deg,#7B9FFF,#a855f7,transparent 70%)' }}>
              <div className="trust-glow" style={{ bottom: -30, left: -20, background: '#7B9FFF' }} />
              <div className="trust-card-inner">
                <div className="trust-icon" style={{ background: 'radial-gradient(circle at 30% 30%,rgba(123,159,255,0.32),rgba(123,159,255,0.06))', border: '1px solid rgba(174,189,255,0.45)' }}>
                  <Zap width={17} height={17} stroke="#aebdff" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs block mb-1" style={{ color: '#aebdff' }}>Instant Delivery</span>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>Orders are delivered instantly &amp; automatically, 24/7.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Price + side cards */}
          <div className="fx-price-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'stretch' }}>
            {/* LEFT: price card */}
            <div className="fx-price-card">
              <span className="fx-corner fx-corner-tl" /><span className="fx-corner fx-corner-tr" /><span className="fx-corner fx-corner-bl" /><span className="fx-corner fx-corner-br" />
              <span className="fx-scanline" />
              <div className="fx-price-top" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, position: 'relative', flexWrap: 'wrap' }}>
                <span className="fx-price text-3xl font-bold">{formatPrice(safeDiscountedPrice)}</span>
                {hasDiscount && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span className="text-sm text-gray-500 line-through" style={{ lineHeight: 1 }}>{formatPrice(safeOriginalPrice)}</span>
                    {displayDiscountPercent > 0 && (
                      <span className="inline-flex items-center rounded-full text-white text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-[#172AA4] to-[#0E9FE2]" style={{ width: 'fit-content' }}>-{displayDiscountPercent}%</span>
                    )}
                  </div>
                )}
                <span className={`fx-stock-top ${featuredStock > 0 ? '' : 'oos'}`}>
                  {featuredStock > 0 ? <CheckCircle width={11} height={11} /> : <XCircle width={11} height={11} />}
                  <span className="fx-stock-num">{featuredStock > 0 ? featuredStock : 0}</span>
                  <span className="fx-stock-label">{featuredStock > 0 ? 'in stock' : 'out'}</span>
                </span>
                {/* M17: prominent per-type badge — what the buyer receives */}
                <ProductTypeBadge type={product.productType} />
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '8px 0' }} />

              {/* Plus row (real subscription) */}
              <a
                href="/dgmarq-plus"
                className="plus-price-row"
                style={{ marginBottom: 8 }}
                onClick={(e) => { e.preventDefault(); navigate('/dgmarq-plus'); }}
              >
                <div className="plus-price-icon">
                  <Sparkles stroke="#fff" />
                </div>
                <div className="plus-price-text">
                  <span className="plus-price-save">{product.hasSubscriptionDiscount ? 'DGMARQ Plus discount applied' : 'Save more with DGMARQ Plus'}</span>
                  <div className="plus-price-amount">
                    {product.hasSubscriptionDiscount ? (
                      <>Active <em>on all products</em></>
                    ) : (
                      <>Members save on every order <em>· join now</em></>
                    )}
                  </div>
                </div>
                <div className="plus-price-arrow"><ChevronRight width={14} height={14} /></div>
              </a>

              {/* Quantity + more offers */}
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, flexShrink: 0 }}>
                  <button className="flex items-center justify-center text-white hover:text-accent-on-dark transition-colors disabled:opacity-40" style={{ width: 32, height: 34 }} disabled={quantity <= 1} aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                  </button>
                  <span className="text-white font-semibold text-sm" style={{ width: 26, textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)', height: 34, lineHeight: '34px' }}>{quantity}</span>
                  <button className="flex items-center justify-center text-white hover:text-accent-on-dark transition-colors disabled:opacity-40" style={{ width: 32, height: 34 }} disabled={quantity >= (featuredStock || 1)} aria-label="Increase quantity" onClick={() => setQuantity(Math.min(featuredStock || 1, quantity + 1))}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                  </button>
                </div>
                {otherOffersCount > 0 ? (
                  <button className="fx-offers-cta" onClick={() => scrollTo('pd-offers')}>
                    <span className="fx-offers-left">
                      <Grid3x3 width={13} height={13} />
                      <span className="fx-offers-count">+{otherOffersCount} more {otherOffersCount === 1 ? 'offer' : 'offers'}</span>
                    </span>
                    <span className="fx-offers-arrow"><ChevronRight width={14} height={14} /></span>
                  </button>
                ) : (
                  <div className="fx-offers-cta" style={{ cursor: 'default', opacity: 0.7 }}>
                    <span className="fx-offers-left">
                      <Store width={13} height={13} />
                      <span className="fx-offers-count">Sold by {product.sellerCount || 1} seller{(product.sellerCount || 1) > 1 ? 's' : ''}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: wishlist + payments stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignSelf: 'stretch' }}>
              <div className="rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <button onClick={handleToggleWishlist} disabled={wishlistPending} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Heart width={24} height={24} style={{ fill: isWishlisted ? '#f472b6' : 'none', stroke: isWishlisted ? '#f472b6' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }} />
                  <span className="text-xs" style={{ color: isWishlisted ? '#f472b6' : 'rgba(255,255,255,0.4)', fontSize: 10, whiteSpace: 'nowrap' }}>{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
                </button>
                <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />
                <div className="flex items-start gap-2">
                  <ShieldCheck width={12} height={12} style={{ marginTop: 1, flexShrink: 0, stroke: 'rgba(255,255,255,0.3)' }} />
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)', margin: 0 }}>Product not working? Refund window applies.</p>
                </div>
              </div>

              <div className="rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 14px' }}>
                <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Accepted payments</p>
                <div style={{ display: 'flex', gap: 6, alignItems: 'stretch', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 6, height: 30, padding: '0 10px', flex: 1, gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#3c4043' }}>GPay</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1F71', borderRadius: 6, height: 30, padding: '0 10px', flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', fontStyle: 'italic' }}>VISA</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#252525', borderRadius: 6, height: 30, padding: '0 10px', flex: 1, gap: 3 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#EB001B' }} />
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#F79E1B', marginLeft: -6 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 6, height: 30, padding: '0 10px', flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#003087' }}>Pay</span><span style={{ fontSize: 11, fontWeight: 800, color: '#009cde' }}>Pal</span>
                  </div>
                </div>
                <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                  <Lock width={10} height={10} /> SSL encrypted &amp; secure
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {boVerdict === false && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300">
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Cannot be activated in {boCountryName || 'your region'} — no seller covers your region. You can still buy, but may be unable to activate this key.</span>
              </div>
            )}
            {/* M21: pre-order notice — pay now, key delivered on release */}
            {isActivePreorder && (
              <div className="flex items-center justify-between rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2">
                <span className="flex items-center gap-1.5 text-sm font-bold text-amber-300">
                  <Clock className="h-4 w-4" /> PRE-ORDER
                </span>
                <span className="text-xs text-amber-200/80">
                  {product.preorderReleaseDate
                    ? `Releases ${new Date(product.preorderReleaseDate).toLocaleDateString()} — key delivered on release`
                    : 'Key delivered on release'}
                </span>
              </div>
            )}
            {/* CLIENT REQ (requirement 4): every seller is out, so the master is
                out — say so plainly instead of showing a dead grey button. The
                offers list below still renders, so the buyer can see who sells
                this and at what price when it returns. */}
            {allOutOfStock ? (
              <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-300" />
                  <span className="text-sm font-bold tracking-wide text-rose-200">OUT OF STOCK</span>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-rose-100/70">
                  {(product.sellerCount || 1) === 1
                    ? 'The seller for this product has sold out.'
                    : `All ${product.sellerCount} sellers of this product are sold out.`}{' '}
                  Add it to your wishlist to keep track of it — you will be alerted if the price drops.
                </p>
                <button
                  onClick={handleToggleWishlist}
                  disabled={wishlistPending}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-rose-400/40 bg-transparent px-4 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-500/15 disabled:opacity-50"
                >
                  <Heart
                    className="h-4 w-4"
                    style={{ fill: isWishlisted ? '#fda4af' : 'none', stroke: '#fda4af' }}
                  />
                  {isWishlisted ? 'On your wishlist' : 'Add to wishlist'}
                </button>
              </div>
            ) : (
              // A guest looking at a pre-order gets "Log in to pre-order" below
              // instead. Two buttons that both end at the login page only make
              // the buyer guess which one is the real route.
              (isAuthenticated || !isActivePreorder) && (
                <button
                  onClick={handleAddToCart}
                  disabled={(!isActivePreorder && (!featuredStock || featuredStock === 0)) || addToCartMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 font-medium bg-background text-white hover:opacity-90 rounded-md px-6 w-full h-12 text-lg disabled:opacity-50"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {addToCartMutation.isPending ? 'Adding...' : isActivePreorder ? 'Pre-order — Add to Cart' : 'Add to Cart'}
                </button>
              )
            )}
            {isAuthenticated && (product.stock > 0 || isActivePreorder) && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleBuyNow}
                  disabled={addToCartMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 font-semibold bg-accent text-white hover:opacity-90 rounded-md px-4 w-full h-12 text-base disabled:opacity-50"
                >
                  {isActivePreorder ? 'Pre-order Now' : 'Buy Now'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={addToCartMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 font-semibold rounded-md px-4 w-full h-12 text-base disabled:opacity-50"
                  style={{ background: '#ffc439', color: '#003087' }}
                >
                  PayPal
                </button>
              </div>
            )}
            {/* M21 login-gate: guests cannot pre-order — send them to login */}
            {!isAuthenticated && isActivePreorder && (
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 font-medium bg-transparent text-amber-300 border border-amber-500/50 hover:bg-amber-500/10 transition-colors rounded-md px-4 w-full h-12 text-sm"
              >
                <User className="h-4 w-4" /> Log in to pre-order
              </button>
            )}
            {!isAuthenticated && !isActivePreorder && product.stock > 0 && (
              <button
                onClick={() => {
                  // Route guest buy-now through the guest cart: checkout renders
                  // real prices/fees, which the old nav-state payload couldn't carry.
                  if (handleAddToCart()) navigate('/checkout');
                }}
                className="inline-flex items-center justify-center gap-2 font-medium bg-transparent text-white border border-gray-600 hover:border-gray-400 hover:bg-white/5 transition-colors rounded-md px-4 w-full h-12 text-sm"
              >
                <User className="h-4 w-4" /> Purchase as guest
              </button>
            )}

            {/* M17: Important Notice — per product type (all types, not just keys) */}
            <ProductTypeNotice type={product.productType} />
          </div>
        </div>
      </div>

      {/* Product Details table */}
      {detailItems.length > 0 && (
        <div className="fx-pd4">
          <div className="fx-pd4-head">
            <FileText width={13} height={13} stroke="#0E9FE2" /> Product Details
          </div>
          <div className="fx-pd4-body">
            <div className="fx-pd4-col has-border">
              {detailLeft.map((d) => (
                <div key={d.label} className="fx-pd4-item">
                  <span className="fx-pd4-lbl">{d.label}</span>
                  {d.isRegion ? <span className="fx-pd4-region">{d.value}</span> : <span className="fx-pd4-val">{d.value}</span>}
                </div>
              ))}
            </div>
            <div className="fx-pd4-col">
              {detailRight.map((d) => (
                <div key={d.label} className="fx-pd4-item">
                  <span className="fx-pd4-lbl">{d.label}</span>
                  {d.isRegion ? <span className="fx-pd4-region">{d.value}</span> : <span className="fx-pd4-val">{d.value}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Seller Info (single-seller / legacy products) */}
      {hasSellerInfo && (
        <div className="fx-seller-card">
          <div className="fx-seller-beam" />
          <div className="fx-seller-header">
            <div className="fx-seller-header-title">
              <Store width={14} height={14} stroke="#0E9FE2" /> Seller Information
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(34,197,94,0.7)', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', display: 'inline-block' }} /> Verified
            </span>
          </div>
          <div className="fx-seller-body">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
              <div className="fx-seller-avatar-wrap">
                <div className="fx-seller-avatar-ring" />
                {seller.shopLogo ? (
                  <SafeImage alt={seller.shopName || 'Seller'} className="fx-seller-avatar-img" src={seller.shopLogo} hideOnError />
                ) : (
                  <div className="fx-seller-avatar-fallback">{(seller.shopName || 'S').charAt(0).toUpperCase()}</div>
                )}
                <div className="fx-seller-avatar-dot" />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <button className="fx-seller-name" onClick={canNavigateToSeller ? () => navigate(`/seller/${sellerId}`) : undefined}>{seller.shopName || 'Seller'}</button>
                  {seller.status === 'approved' && (
                    <span className="fx-seller-badge fx-seller-badge-verified">
                      <Verified width={11} height={11} /> Verified Seller
                    </span>
                  )}
                </div>
                <div className="fx-seller-stats">
                  <div className="fx-seller-stat" style={{ '--sc': 'rgba(245,142,42,0.6)' }}>
                    <span className="fx-seller-stat-num" style={{ color: '#F58E2A' }}>{(seller.rating || 0).toFixed(1)}</span>
                    <span className="fx-seller-stat-label">Rating</span>
                  </div>
                  {product.reviewCount > 0 && (
                    <div className="fx-seller-stat" style={{ '--sc': 'rgba(46,207,176,0.6)' }}>
                      <span className="fx-seller-stat-num" style={{ color: '#2ecfb0' }}>{product.reviewCount}</span>
                      <span className="fx-seller-stat-label">Reviews</span>
                    </div>
                  )}
                  {seller.status === 'approved' && (
                    <div className="fx-seller-stat" style={{ '--sc': 'rgba(123,159,255,0.6)' }}>
                      <span className="fx-seller-stat-num" style={{ color: '#7B9FFF' }}>KYC</span>
                      <span className="fx-seller-stat-label">Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {seller.description && <p className="fx-seller-bio">{seller.description}</p>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              {(seller.country || seller.state || seller.city) && (
                <div className="fx-seller-location">
                  <MapPin width={13} height={13} stroke="rgba(123,159,255,0.6)" />
                  {[seller.city, seller.state, seller.country].filter(Boolean).join(', ')}
                </div>
              )}
              {canNavigateToSeller && (
                <button className="fx-seller-cta" onClick={() => navigate(`/seller/${sellerId}`)}>
                  <Store width={14} height={14} /> View Seller Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offers from other sellers */}
      {product.offers && product.offers.length > 0 && (
        <div id="pd-offers" className="of-shell">
          <div className="of-topline" />
          <div className="of-grid" />
          <div className="of-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div className="of-head-icon"><Store width={18} height={18} stroke="#0E9FE2" /></div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>Offers from Other Sellers</h3>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>{product.offers.length} {product.offers.length === 1 ? 'offer' : 'offers'}</span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Compare prices, regions and seller ratings across the marketplace</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Sort</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setOfferSort('price')} className={`of-sort-btn ${offerSort === 'price' ? 'active' : ''}`}>Best Price</button>
                <button onClick={() => setOfferSort('rating')} className={`of-sort-btn ${offerSort === 'rating' ? 'active' : ''}`}>Best Rating</button>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', padding: 8 }}>
            {sortedOffers.map((o, idx) => {
              const isBest = idx === 0 && offerSort === 'price';
              const rankClass = idx === 0 ? 'of-rank-1' : idx === 1 ? 'of-rank-2' : 'of-rank-3';
              return (
                <div key={o._id} className={`of-row ${isBest ? 'of-row-best' : ''}`}>
                  {isBest && <div className="of-scan" />}
                  <span className="of-corner2 tl" /><span className="of-corner2 tr" /><span className="of-corner2 bl" /><span className="of-corner2 br" />
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', zIndex: 1, flexWrap: 'wrap' }}>
                    <div className={`of-rank ${rankClass}`}>{String(idx + 1).padStart(2, '0')}</div>
                    {o.shopLogo ? (
                      <SafeImage src={o.shopLogo} alt={o.shopName || 'Seller'} style={{ width: 44, height: 44, borderRadius: 9, flexShrink: 0, objectFit: 'cover' }} hideOnError />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg,#172AA4,#0e51e2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Store width={18} height={18} stroke="#fff" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => o.sellerId && navigate(`/seller/${o.sellerId}`)}
                          style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                        >
                          {o.shopName || 'Seller'}
                        </button>
                        {isBest && <span className="of-best-badge">★ BEST PRICE</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <RegionBadges offer={o} showWarning />
                        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>/</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Star width={11} height={11} className="fill-yellow-400 text-yellow-400" />
                          <span style={{ fontSize: 11, color: '#e2a931', fontWeight: 700 }}>{(o.rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                      <p className={`of-price ${isBest ? 'of-price-best' : ''}`} style={{ margin: 0 }}>{formatPrice(Number(o.price || 0))}</p>
                      {o.inStock ? (
                        <span className="of-stock"><span className="of-dot of-dot-green" style={{ width: 5, height: 5 }} />{o.availableKeysCount || 1} in stock</span>
                      ) : (
                        <span className="of-stock oos">Out of stock</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                      <button className="of-cart" title="Add to cart" disabled={!o.inStock || addToCartMutation.isPending} onClick={() => addOfferToCart(o)}>
                        <ShoppingCart width={15} height={15} />
                      </button>
                      <button className="of-buy" disabled={!o.inStock || addToCartMutation.isPending} onClick={() => addOfferToCart(o)}>Buy now</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Description accordion */}
      {product.description && (
        <div id="pd-description" className="fx-acc">
          <button className="fx-acc-head" onClick={() => toggleAcc('description')}>
            <span className="fx-acc-title"><FileText width={18} height={18} /> Description</span>
            <ChevronDown className={`fx-acc-chevron ${openAcc.description ? 'open' : ''}`} width={18} height={18} />
          </button>
          {openAcc.description && (
            <div className="fx-acc-body">
              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">{product.description}</div>
            </div>
          )}
        </div>
      )}

      {/* System Requirements accordion */}
      {product.systemRequirements && (
        <div className="fx-acc">
          <button className="fx-acc-head" onClick={() => toggleAcc('sysreq')}>
            <span className="fx-acc-title"><Cpu width={18} height={18} /> System Requirements</span>
            <ChevronDown className={`fx-acc-chevron ${openAcc.sysreq ? 'open' : ''}`} width={18} height={18} />
          </button>
          {openAcc.sysreq && (
            <div className="fx-acc-body">
              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">{product.systemRequirements}</div>
            </div>
          )}
        </div>
      )}

      {/* Activation Details accordion */}
      {product.activationDetails && (
        <div className="fx-acc">
          <button className="fx-acc-head" onClick={() => toggleAcc('activation')}>
            <span className="fx-acc-title"><FileKey width={18} height={18} /> Activation Details</span>
            <ChevronDown className={`fx-acc-chevron ${openAcc.activation ? 'open' : ''}`} width={18} height={18} />
          </button>
          {openAcc.activation && (
            <div className="fx-acc-body">
              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">{product.activationDetails}</div>
            </div>
          )}
        </div>
      )}

      {/* FAQ accordion (static, platform-level) */}
      <div className="fx-acc">
        <button className="fx-acc-head" onClick={() => toggleAcc('faq')}>
          <span className="fx-acc-title"><HelpCircle width={18} height={18} /> FAQ</span>
          <ChevronDown className={`fx-acc-chevron ${openAcc.faq ? 'open' : ''}`} width={18} height={18} />
        </button>
        {openAcc.faq && (
          <div className="fx-acc-body">
            <div className="space-y-2">
              {faqs.map((f, i) => (
                <div key={i} className="rounded-lg border border-gray-700 overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex items-center justify-between w-full px-5 py-4 text-left text-sm font-semibold text-white hover:bg-white/5 transition-colors">
                    {f.q}
                    <ChevronDown className={`fx-acc-chevron ${openFaq === i ? 'open' : ''}`} width={16} height={16} />
                  </button>
                  {openFaq === i && <div className="px-5 pb-4 text-sm text-gray-300 leading-relaxed">{f.a}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div id="pd-reviews" className="rounded-xl border border-gray-700 bg-card" style={{ scrollMarginTop: 90 }}>
        <div className="flex items-center justify-between gap-2 px-6 border-b border-gray-700 py-4">
          <span className="font-semibold text-white text-lg flex items-center gap-2">
            <Star className="h-5 w-5" /> Reviews
            {product.reviewCount > 0 && <span className="text-gray-400 font-normal text-base">({product.reviewCount})</span>}
          </span>
          {isAuthenticated && hasUserPurchased && !userHasReviewed && !showReviewForm && (
            <button onClick={() => setShowReviewForm(true)} className="inline-flex items-center gap-2 text-sm border border-gray-600 rounded-md px-3 py-1.5 text-white hover:bg-white/5">
              <MessageSquare className="h-4 w-4" /> Write a Review
            </button>
          )}
        </div>

        <div className="px-6 py-6">
          {/* Aggregate summary */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-5 pb-5 mb-5 border-b border-gray-700 flex-wrap">
              <div style={{ textAlign: 'center', minWidth: 78 }}>
                <div style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{product.averageRating.toFixed(1)}</div>
                <div style={{ display: 'inline-flex', gap: 1, marginTop: 6 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(product.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 5 }}>{product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}</div>
              </div>
              {ratingDist && (
                <div className="flex-1" style={{ minWidth: 200 }}>
                  {ratingDist.map((d) => (
                    <div key={d.star} className="flex items-center gap-2" style={{ marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', width: 30 }}>{d.star}★</span>
                      <div className="fx-rev-bar"><span style={{ width: `${(d.count / distTotal) * 100}%` }} /></div>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', width: 18, textAlign: 'right' }}>{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Review form */}
          {showReviewForm && isAuthenticated && hasUserPurchased && (
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h3 className="text-white font-semibold mb-4">Write a Review</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="rv-order" className="text-white text-sm mb-2 block">Select Order</label>
                  <select id="rv-order" value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white">
                    <option value="">Select an order...</option>
                    {userOrders.map((order) => (
                      <option key={order._id} value={order._id}>Order #{order._id.toString().slice(-8)} - {formatDate(order.createdAt)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p id="pd-review-rating-label" className="text-white text-sm mb-2 block">Rating</p>
                  <div className="flex items-center gap-2" role="radiogroup" aria-labelledby="pd-review-rating-label">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        role="radio"
                        aria-checked={reviewRating === rating}
                        aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
                        onClick={() => setReviewRating(rating)}
                        className="rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Star aria-hidden="true" className={`h-6 w-6 ${rating <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                      </button>
                    ))}
                    {reviewRating > 0 && <span className="text-gray-400 text-sm ml-2">{reviewRating} {reviewRating === 1 ? 'star' : 'stars'}</span>}
                  </div>
                </div>
                <div>
                  <label htmlFor="pd-review-comment" className="text-white text-sm mb-2 block">Comment</label>
                  <Textarea id="pd-review-comment" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share your experience with this product..." className="min-h-[100px] bg-gray-900 border-gray-700 text-white" maxLength={1000} />
                  <p className="text-gray-500 text-xs mt-1">{reviewComment.length}/1000 characters {reviewComment.trim().length > 0 && reviewComment.trim().length < 10 && '(min 10 required)'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSubmitReview} disabled={submitReviewMutation.isPending || !selectedOrderId || reviewRating === 0 || !reviewComment.trim() || reviewComment.trim().length < 10} className="inline-flex items-center justify-center gap-2 flex-1 bg-background text-white rounded-md h-10 disabled:opacity-50">
                    <Send className="h-4 w-4" /> {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewComment(''); setSelectedOrderId(''); }} className="border border-gray-600 rounded-md px-4 text-white hover:bg-white/5">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {reviewsLoading ? (
            <div className="text-center py-8"><Loading message="Loading reviews..." /></div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviewsFetching && !reviewsLoadingMore && <p className="text-sm text-gray-400">Updating reviews...</p>}
              {reviews.map((review) => (
                <div key={review._id} className="flex gap-3">
                  <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#172AA4,#0e51e2 55%,#650EB3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, overflow: 'hidden' }}>
                    {review.user?.profileImage ? (
                      <SafeImage src={review.user.profileImage} alt={review.user.name} className="w-full h-full object-cover" hideOnError />
                    ) : (
                      (review.user?.name || 'A').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1" style={{ marginBottom: 3 }}>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{review.user?.name || 'Anonymous'}</span>
                      {review.isVerifiedPurchase && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>
                          <CheckCircle width={10} height={10} /> Verified purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2" style={{ marginBottom: 7 }}>
                      <span className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                        ))}
                      </span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{formatDate(review.createdAt)}</span>
                    </div>
                    {review.comment && <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>}
                  </div>
                </div>
              ))}
              {hasMoreReviews && (
                <div className="flex justify-center pt-4">
                  <button onClick={() => loadMoreReviews()} disabled={reviewsLoadingMore} className="border border-gray-600 rounded-md px-4 py-2 text-white hover:bg-white/5 disabled:opacity-50">
                    {reviewsLoadingMore ? 'Loading...' : 'Load More Reviews'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Star className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No reviews yet</p>
              <p className="text-gray-500 text-sm">{isAuthenticated && hasUserPurchased ? 'Be the first to review this product!' : 'Be the first to review this product after purchase!'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts?.docs && relatedProducts.docs.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <Grid3x3 width={20} height={20} stroke="#1a8fff" />
            <h2 className="text-lg font-bold text-white m-0">Related <span style={{ color: '#1a8fff' }}>Products</span></h2>
          </div>
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

      <RegionRestrictionModal
        offer={featuredOffer}
        open={regionModalOpen}
        onClose={() => setRegionModalOpen(false)}
      />
    </div>
  );
};

export default ProductDetail;
