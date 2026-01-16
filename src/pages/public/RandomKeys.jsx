import { useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import ProductCard from "../../components/ProductCard";
import MicrosoftCard from "../../components/MicrosoftCard";
import { productAPI, bestsellerAPI, categoryAPI, typeAPI } from "../../services/api";
import { Loading } from "../../components/ui/loading";
  
// Skeleton loader for product sections
const ProductSectionSkeleton = ({ count = 6, vertical = false }) => (
  <div
    className={`grid ${
      vertical
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
    } gap-4`}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-[#041536] rounded-21 p-4 animate-pulse">
        <div className="w-full aspect-square bg-gray-700 rounded-2xl mb-2" />
        <div className="h-4 bg-gray-700 rounded mb-2" />
        <div className="h-3 bg-gray-700 rounded w-2/3" />
      </div>
    ))}
  </div>
);

// Show More Button Component
const ShowMoreButton = ({ href }) => (
  <Link to={href} className="btn-show-more">
    Show More
  </Link>
);

// Featured Random Key Card Component - Large featured card for random key bundles
const FeaturedRandomKeyCard = ({ product, index }) => {
  const image = product.images && product.images.length > 0 ? product.images[0] : null;
  const platformName = product.platform?.name || "Steam";
  const regionName = product.region?.name || "Global";
  
  // Determine card styling based on product name patterns - matching image description
  const getCardStyle = () => {
    const name = (product.name || "").toLowerCase();
    
    if (name.includes("aaa")) {
      return {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Purple gradient for AAA
      };
    } else if (name.includes("elite")) {
      return {
        background: "linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #fdcb6e 100%)", // Light blue/gold for Elite
      };
    } else if (name.includes("vip")) {
      return {
        background: "linear-gradient(135deg, #d4a574 0%, #8b6f47 50%, #f4d03f 100%)", // Brown/gold for VIP
      };
    } else if (name.includes("diamond")) {
      return {
        background: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)", // Light blue/silver for Diamond
      };
    } else if (name.includes("kingdom come")) {
      return {
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", // Dark blue for featured single keys
      };
    } else {
      return {
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", // Default dark blue
      };
    }
  };

  // Determine width based on index - matching image layout: [1/4] [1/2] [1/4] then [1/4] [1/2]
  const getWidthClass = () => {
    // Card 0: w-1/4, Card 1: w-1/2, Card 2: w-1/4, Card 3: w-1/4, Card 4: w-1/2
    const widthMap = {
      0: 'w-full sm:w-1/4',
      1: 'w-full sm:w-1/2',
      2: 'w-full sm:w-1/4',
      3: 'w-full sm:w-1/4',
      4: 'w-full sm:w-1/2',
    };
    return widthMap[index] || 'w-full sm:w-1/4';
  };

  const cardStyle = getCardStyle();
  const backgroundStyle = image
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${image}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : cardStyle;

  return (
    <Link
      to={`/product/${product.slug || product._id}`}
      className={`${getWidthClass()} min-h-[300px] sm:min-h-[350px] md:min-h-[400px]`}
    >
      <div
        className="relative h-full rounded-2xl w-full overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300 group"
        style={backgroundStyle}
      >
        {/* Additional gradient overlay for better text readability when using image */}
        {image && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"></div>
        )}

        {/* Steam/Platform Logo area - center top */}
        {!image && (
          <div className="absolute top-6 left-6 right-6 flex justify-center items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-32 bg-white/20 rounded-2xl flex items-center justify-center">
              {platformName === "Steam" && (
                <span className="text-white/80 font-bold text-xs sm:text-sm">STEAM</span>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-6 sm:p-8 justify-end text-white">
          {/* Product Title and Key Count */}
          <div className="mb-4">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight mb-2 font-poppins">
              {product.name}
            </h3>
            {/* Show "5 RANDOM KEYS" or "1 RANDOM KEY" text if applicable */}
            {(product.name?.toLowerCase().includes("5") || product.name?.toLowerCase().includes("five")) && (
              <p className="text-sm sm:text-base md:text-lg font-semibold text-white/90 font-poppins mb-1">
                5 RANDOM KEYS
              </p>
            )}
            {(product.name?.toLowerCase().includes("1") || product.name?.toLowerCase().includes("single")) && (
              <p className="text-sm sm:text-base md:text-lg font-semibold text-white/90 font-poppins mb-1">
                1 RANDOM KEY
              </p>
            )}
          </div>

          {/* Bottom: Platform and Region Info */}
          <div>
            <p className="text-xs sm:text-sm text-white/85 font-normal font-poppins">
              {platformName} · {regionName} · Key
            </p>
          </div>
        </div>

        {/* Hover overlay effect */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl"></div>
      </div>
    </Link>
  );
};

// Section component for reusable product sections
const ProductSection = ({
  title,
  subtitle,
  products,
  isLoading,
  showMoreLink,
  vertical = false,
}) => {
  if (isLoading) {
    return (
      <section className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Centered Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-poppins">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm md:text-base text-gray-400 font-poppins px-4">
                {subtitle}
              </p>
            )}
          </div>

          <ProductSectionSkeleton count={vertical ? 6 : 12} vertical={vertical} />

          {/* Centered Show More Button */}
          {showMoreLink && (
            <div className="flex justify-center mt-8">
              <ShowMoreButton href={showMoreLink} />
            </div>
          )}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Centered Heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-poppins">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm md:text-base text-gray-400 font-poppins px-4">
              {subtitle}
            </p>
          )}
        </div>

        {/* Product Grid */}
        {vertical ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* Centered Show More Button at Bottom */}
        {showMoreLink && (
          <div className="flex justify-center mt-8">
            <ShowMoreButton href={showMoreLink} />
          </div>
        )}
      </div>
    </section>
  );
};

const RandomKeys = () => {
  const isMountedRef = useRef(true);

  // Fetch Type ID for "Key" type products (cached)
  const { data: keyTypeData } = useQuery({
    queryKey: ["type-key"],
    queryFn: async () => {
      const response = await typeAPI.getAllTypes({ 
        search: "Key", 
        limit: 100 
      });
      const types = response.data.data?.docs || [];
      // Try exact match first, then partial match
      return types.find(t => 
        t.name.toLowerCase() === "key"
      ) || types.find(t => 
        t.name.toLowerCase().includes("key")
      ) || null;
    },
    staleTime: 3600000, // 1 hour
    cacheTime: 3600000,
  });

  // Fetch Category ID for "Microsoft" category (cached)
  const { data: microsoftCategoryData } = useQuery({
    queryKey: ["category-microsoft"],
    queryFn: async () => {
      const response = await categoryAPI.getCategories({ 
        search: "Microsoft", 
        isActive: true,
        limit: 100 
      });
      const categories = response.data.data?.docs || [];
      return categories.find(cat => 
        cat.name.toLowerCase() === "microsoft"
      ) || categories.find(cat => 
        cat.name.toLowerCase().includes("microsoft")
      ) || null;
    },
    staleTime: 3600000, // 1 hour
    cacheTime: 3600000,
  });

  // Fetch Featured Random Keys (AAA, ELITE, VIP, DIAMOND, and featured single keys) - top 5 products
  const { data: featuredRandomKeys, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ["random-keys-featured", keyTypeData?._id],
    queryFn: async () => {
      const params = {
        limit: 100, // Fetch more to filter
        page: 1,
        sort: "rating",
        inStock: true,
      };
      
      if (keyTypeData?._id) {
        params.type = keyTypeData._id;
      } else if (keyTypeData?.name) {
        params.typeName = keyTypeData.name;
      }

      const response = await productAPI.getProducts(params);
      const allProducts = response.data.data?.docs || [];
      
      // Filter for featured random key products (AAA, ELITE, VIP, DIAMOND, or featured single keys)
      const featured = allProducts.filter(p => {
        const name = (p.name || "").toLowerCase();
        return (
          name.includes("aaa") ||
          name.includes("elite") ||
          name.includes("vip") ||
          name.includes("diamond") ||
          name.includes("kingdom come") ||
          (name.includes("random") && name.includes("5")) ||
          (name.includes("random") && p.isFeatured)
        );
      });
      
      // Sort to prioritize AAA, ELITE, VIP, DIAMOND, then featured
      const sorted = featured.sort((a, b) => {
        const aName = (a.name || "").toLowerCase();
        const bName = (b.name || "").toLowerCase();
        const priority = { "aaa": 1, "elite": 2, "vip": 3, "diamond": 4, "kingdom come": 5 };
        const aPriority = Object.keys(priority).find(key => aName.includes(key)) ? priority[Object.keys(priority).find(key => aName.includes(key))] : 99;
        const bPriority = Object.keys(priority).find(key => bName.includes(key)) ? priority[Object.keys(priority).find(key => bName.includes(key))] : 99;
        return aPriority - bPriority;
      });
      
      return sorted.slice(0, 5);
    },
    enabled: !!keyTypeData || true,
    staleTime: 120000,
    cacheTime: 300000,
  });

  // Fetch Microsoft Products (top 6) - Filter by Microsoft category and Key type
  const { data: microsoftProducts, isLoading: isLoadingMicrosoft } = useQuery({
    queryKey: ["random-keys-microsoft", microsoftCategoryData?._id, keyTypeData?._id],
    queryFn: async () => {
      const params = {
        limit: 6,
        page: 1,
        sort: "newest",
        inStock: true,
      };
      
      if (microsoftCategoryData?._id) {
        params.categoryId = microsoftCategoryData._id;
      } else if (microsoftCategoryData?.name) {
        params.categoryName = microsoftCategoryData.name;
      }

      // Also filter by key type to ensure we get license key products
      if (keyTypeData?._id) {
        params.type = keyTypeData._id;
      } else if (keyTypeData?.name) {
        params.typeName = keyTypeData.name;
      }

      const response = await productAPI.getProducts(params);
      return response.data.data?.docs || [];
    },
    enabled: (!!microsoftCategoryData || !!microsoftCategoryData?.name) && (!!keyTypeData || true),
    staleTime: 120000, // 2 minutes
    cacheTime: 300000, // 5 minutes
  });

  // Fetch Best Sellers (top 12, keys type only)
  const { data: bestsellersData, isLoading: isLoadingBestsellers } = useQuery({
    queryKey: ["random-keys-bestsellers", keyTypeData?._id],
    queryFn: async () => {
      // First try bestsellers API
      const bestsellerResponse = await bestsellerAPI.getBestsellers({ limit: 50 }); // Fetch more to filter
      let products = bestsellerResponse.data.data?.bestsellers?.map(bs => bs.productId).filter(Boolean) || [];
      
      // Filter by key type if we have the type ID
      if (keyTypeData?._id && products.length > 0) {
        products = products.filter(p => 
          (p.type?._id && p.type._id.toString() === keyTypeData._id.toString()) || 
          (typeof p.type === 'string' && p.type === keyTypeData._id.toString()) ||
          (p.type?.name && p.type.name.toLowerCase().includes('key'))
        );
      }
      
      // If we don't have enough products, fetch from products API
      if (products.length < 12) {
        const params = {
          limit: 12 - products.length,
          page: 1,
          sort: "rating",
          inStock: true,
        };
        
        if (keyTypeData?._id) {
          params.type = keyTypeData._id;
        } else if (keyTypeData?.name) {
          params.typeName = keyTypeData.name;
        }

        const productResponse = await productAPI.getProducts(params);
        const additionalProducts = productResponse.data.data?.docs || [];
        
        // Combine and deduplicate
        const existingIds = new Set(products.map(p => p._id?.toString() || p._id));
        const uniqueAdditional = additionalProducts.filter(p => {
          const id = p._id?.toString() || p._id;
          return !existingIds.has(id);
        });
        products = [...products, ...uniqueAdditional].slice(0, 12);
      } else {
        products = products.slice(0, 12);
      }
      
      return products;
    },
    enabled: true, // Always fetch, filter by type in the function
    staleTime: 120000, // 2 minutes
    cacheTime: 300000, // 5 minutes
  });

  // Fetch "Meet the Champions" products (Random Keys, 12 products)
  const { data: championsProducts, isLoading: isLoadingChampions } = useQuery({
    queryKey: ["random-keys-champions", keyTypeData?._id],
    queryFn: async () => {
      const params = {
        limit: 12,
        page: 1,
        sort: "rating",
        inStock: true,
      };
      
      if (keyTypeData?._id) {
        params.type = keyTypeData._id;
      } else if (keyTypeData?.name) {
        params.typeName = keyTypeData.name;
      }

      const response = await productAPI.getProducts(params);
      return response.data.data?.docs || [];
    },
    enabled: !!keyTypeData || true,
    staleTime: 120000,
    cacheTime: 300000,
  });

  // Fetch "How About Five Keys" products (products with "5" in name or random keys, 12 products)
  const { data: fiveKeysProducts, isLoading: isLoadingFiveKeys } = useQuery({
    queryKey: ["random-keys-five", keyTypeData?._id],
    queryFn: async () => {
      const params = {
        limit: 100, // Fetch more to filter
        page: 1,
        sort: "newest",
        inStock: true,
      };
      
      if (keyTypeData?._id) {
        params.type = keyTypeData._id;
      } else if (keyTypeData?.name) {
        params.typeName = keyTypeData.name;
      }

      const response = await productAPI.getProducts(params);
      const allProducts = response.data.data?.docs || [];
      
      // Filter products with "5" in name (for "5 Keys" bundles)
      const filtered = allProducts.filter(p => 
        p.name?.toLowerCase().includes("5") || 
        p.name?.toLowerCase().includes("five")
      );
      
      return filtered.slice(0, 12);
    },
    enabled: !!keyTypeData || true,
    staleTime: 120000,
    cacheTime: 300000,
  });

  // Fetch "About Five Keys" products - Alternative 5-key products (different sort/filter)
  const { data: aboutFiveKeysProducts, isLoading: isLoadingAboutFiveKeys } = useQuery({
    queryKey: ["random-keys-about-five", keyTypeData?._id],
    queryFn: async () => {
      const params = {
        limit: 100, // Fetch more to filter
        page: 1,
        sort: "rating", // Different sort to show different products
        inStock: true,
      };
      
      if (keyTypeData?._id) {
        params.type = keyTypeData._id;
      } else if (keyTypeData?.name) {
        params.typeName = keyTypeData.name;
      }

      const response = await productAPI.getProducts(params);
      const allProducts = response.data.data?.docs || [];
      
      // Filter products with "5" in name, but exclude those already shown in fiveKeysProducts
      const filtered = allProducts.filter(p => 
        (p.name?.toLowerCase().includes("5") || 
        p.name?.toLowerCase().includes("five")) &&
        !p.name?.toLowerCase().includes("aaa") &&
        !p.name?.toLowerCase().includes("elite") &&
        !p.name?.toLowerCase().includes("vip") &&
        !p.name?.toLowerCase().includes("diamond")
      );
      
      return filtered.slice(0, 12);
    },
    enabled: !!keyTypeData || true,
    staleTime: 120000,
    cacheTime: 300000,
  });

  // Fetch "Single Randoms" products (single key products, 12 products)
  const { data: singleRandomsProducts, isLoading: isLoadingSingleRandoms } = useQuery({
    queryKey: ["random-keys-single", keyTypeData?._id],
    queryFn: async () => {
      const params = {
        limit: 100,
        page: 1,
        sort: "newest",
        inStock: true,
      };
      
      if (keyTypeData?._id) {
        params.type = keyTypeData._id;
      } else if (keyTypeData?.name) {
        params.typeName = keyTypeData.name;
      }

      const response = await productAPI.getProducts(params);
      const allProducts = response.data.data?.docs || [];
      
      // Filter products with "1" or "single" in name
      const filtered = allProducts.filter(p => 
        p.name?.toLowerCase().includes("1") || 
        p.name?.toLowerCase().includes("single")
      );
      
      return filtered.slice(0, 12);
    },
    enabled: !!keyTypeData || true,
    staleTime: 120000,
    cacheTime: 300000,
  });

  // Fetch "3 Keys" products (products with "3" in name, 12 products)
  const { data: threeKeysProducts, isLoading: isLoadingThreeKeys } = useQuery({
    queryKey: ["random-keys-three", keyTypeData?._id],
    queryFn: async () => {
      const params = {
        limit: 100,
        page: 1,
        sort: "newest",
        inStock: true,
      };
      
      if (keyTypeData?._id) {
        params.type = keyTypeData._id;
      } else if (keyTypeData?.name) {
        params.typeName = keyTypeData.name;
      }

      const response = await productAPI.getProducts(params);
      const allProducts = response.data.data?.docs || [];
      
      // Filter products with "3" or "three" in name
      const filtered = allProducts.filter(p => 
        p.name?.toLowerCase().includes("3") || 
        p.name?.toLowerCase().includes("three")
      );
      
      return filtered.slice(0, 12);
    },
    enabled: !!keyTypeData || true,
    staleTime: 120000,
    cacheTime: 300000,
  });

  // Fetch "Roblox and Fortnite" products (products with Roblox or Fortnite in name, 6 products)
  const { data: robloxFortniteProducts, isLoading: isLoadingRobloxFortnite } = useQuery({
    queryKey: ["random-keys-roblox-fortnite", keyTypeData?._id],
    queryFn: async () => {
      const params = {
        limit: 100,
        page: 1,
        sort: "newest",
        inStock: true,
      };
      
      if (keyTypeData?._id) {
        params.type = keyTypeData._id;
      } else if (keyTypeData?.name) {
        params.typeName = keyTypeData.name;
      }

      const response = await productAPI.getProducts(params);
      const allProducts = response.data.data?.docs || [];
      
      // Filter products with "roblox" or "fortnite" in name
      const filtered = allProducts.filter(p => 
        p.name?.toLowerCase().includes("roblox") || 
        p.name?.toLowerCase().includes("fortnite")
      );
      
      return filtered.slice(0, 6);
    },
    enabled: !!keyTypeData || true,
    staleTime: 120000,
    cacheTime: 300000,
  });

  // Fetch "Counter Strike 2 Skins" products (products with CS2 or Counter-Strike in name, 12 products)
  const { data: cs2Products, isLoading: isLoadingCS2 } = useQuery({
    queryKey: ["random-keys-cs2", keyTypeData?._id],
    queryFn: async () => {
      const params = {
        limit: 100,
        page: 1,
        sort: "newest",
        inStock: true,
      };
      
      if (keyTypeData?._id) {
        params.type = keyTypeData._id;
      } else if (keyTypeData?.name) {
        params.typeName = keyTypeData.name;
      }

      const response = await productAPI.getProducts(params);
      const allProducts = response.data.data?.docs || [];
      
      // Filter products with "counter-strike", "cs2", "cs 2", or "cs:go" in name
      const filtered = allProducts.filter(p => 
        p.name?.toLowerCase().includes("counter-strike") || 
        p.name?.toLowerCase().includes("cs2") ||
        p.name?.toLowerCase().includes("cs 2") ||
        p.name?.toLowerCase().includes("cs:go")
      );
      
      return filtered.slice(0, 12);
    },
    enabled: !!keyTypeData || true,
    staleTime: 120000,
    cacheTime: 300000,
  });

  // Fetch Monthly Subscription products (products with "monthly" or "subscription" in name, 12 products)
  const { data: monthlySubscriptionProducts, isLoading: isLoadingMonthlySubscription } = useQuery({
    queryKey: ["random-keys-monthly-subscription", keyTypeData?._id],
    queryFn: async () => {
      const params = {
        limit: 100,
        page: 1,
        sort: "newest",
        inStock: true,
      };
      
      if (keyTypeData?._id) {
        params.type = keyTypeData._id;
      } else if (keyTypeData?.name) {
        params.typeName = keyTypeData.name;
      }

      const response = await productAPI.getProducts(params);
      const allProducts = response.data.data?.docs || [];
      
      // Filter products with "monthly", "subscription", or "month" in name
      const filtered = allProducts.filter(p => 
        p.name?.toLowerCase().includes("monthly") || 
        p.name?.toLowerCase().includes("subscription") ||
        p.name?.toLowerCase().includes("month")
      );
      
      return filtered.slice(0, 12);
    },
    enabled: !!keyTypeData || true,
    staleTime: 120000,
    cacheTime: 300000,
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Generate "Show More" links
  const keyTypeId = keyTypeData?._id;
  const microsoftCategoryId = microsoftCategoryData?._id || microsoftCategoryData?.slug;
  
  const getShowMoreLink = (filterType, value) => {
    if (filterType === "keys") {
      if (keyTypeId) {
        return `/search?type=${keyTypeId}`;
      }
      return `/search?typeName=Key`;
    }
    if (filterType === "microsoft") {
      if (microsoftCategoryId) {
        return `/category/${microsoftCategoryId}`;
      }
      return `/search?categoryName=Microsoft`;
    }
    if (filterType === "search") {
      return `/search?search=${encodeURIComponent(value)}`;
    }
    return "/search?typeName=Key";
  };

  const widths = [
    "w-full sm:w-1/4",
    "w-full sm:w-1/4",
    "w-full sm:w-1/2",
    "w-full sm:w-1/4",
    "w-full sm:w-1/4",
    "w-full sm:w-1/2",
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 md:mb-4 text-center font-poppins">
            Random Keys
          </h1>
          <p className="text-white text-sm md:text-base text-center font-poppins max-w-3xl mx-auto">
            Discover everything you need to know about one of our most popular categories.
          </p>
        </div>
      </section>

      {/* Featured Random Keys Section - Large Featured Cards */}
      <section className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          {isLoadingFeatured ? (
            <div className="flex flex-row flex-wrap gap-4 sm:gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`min-h-[300px] sm:min-h-[350px] md:min-h-[400px] rounded-2xl bg-gradient-to-r from-[#1e3a5f] via-[#2563eb] to-[#60a5fa] animate-pulse ${
                    i === 0 || i === 3 ? 'w-full sm:w-1/4' : 'w-full sm:w-1/2'
                  }`}
                >
                  <div className="h-full p-6 sm:p-8 flex flex-col">
                    <div className="flex-1 flex items-center justify-center mb-4 sm:mb-6">
                      <div className="w-28 h-28 sm:w-36 sm:h-36 bg-white/20 rounded-2xl"></div>
                    </div>
                    <div className="h-7 sm:h-8 bg-white/20 rounded mb-2"></div>
                    <div className="h-4 sm:h-5 bg-white/20 rounded w-3/4 mb-2"></div>
                    <div className="mt-auto pt-2 h-3 bg-white/20 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredRandomKeys?.length > 0 ? (
            <div className="flex flex-row flex-wrap gap-4 sm:gap-6 w-full">
              {featuredRandomKeys.slice(0, 5).map((product, index) => (
                <FeaturedRandomKeyCard 
                  key={product._id || index}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No featured random keys available at the moment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Microsoft Products Section */}
      <section className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          {isLoadingMicrosoft ? (
            <div className="flex flex-row flex-wrap gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`min-h-[280px] sm:min-h-[320px] md:min-h-[340px] rounded-2xl bg-gradient-to-r from-[#1e3a5f] via-[#2563eb] to-[#60a5fa] animate-pulse ${widths[i % widths.length]}`}
                >
                  <div className="h-full p-6 sm:p-8 flex flex-col">
                    <div className="flex-1 flex items-center justify-center mb-4 sm:mb-6">
                      <div className="w-28 h-28 sm:w-36 sm:h-36 bg-white/20 rounded-2xl"></div>
                    </div>
                    <div className="h-7 sm:h-8 bg-white/20 rounded mb-2"></div>
                    <div className="h-4 sm:h-5 bg-white/20 rounded w-3/4 mb-2"></div>
                    <div className="mt-auto pt-2 h-3 bg-white/20 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : microsoftProducts?.length > 0 ? (
            <div className="flex flex-row flex-wrap gap-4 sm:gap-6 w-full">
              {microsoftProducts.slice(0, 6).map((product, index) => (
                <MicrosoftCard 
                  key={product._id}
                  product={product}
                  width={widths[index % widths.length]}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No Microsoft products available at the moment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Try To Catch One Of Our Bestsellers! Section */}
      <ProductSection
        title="Try To Catch One Of Our Bestsellers!"
        subtitle="The Hottest Items On Our Marketplace - Discover What Captured Our Users Hearts!"
        products={bestsellersData}
        isLoading={isLoadingBestsellers}
        showMoreLink={getShowMoreLink("keys")}
      />

      {/* Meet The Champions! Section */}
      <ProductSection
        title="Meet The Champions!"
        subtitle="Discover the top-rated random keys that our community loves!"
        products={championsProducts}
        isLoading={isLoadingChampions}
        showMoreLink={getShowMoreLink("keys")}
      />

      {/* How About 5 Keys? Section */}
      <ProductSection
        title="How About 5 Keys?"
        subtitle="Get more value with our 5-key bundles - perfect for trying multiple games!"
        products={fiveKeysProducts}
        isLoading={isLoadingFiveKeys}
        showMoreLink={getShowMoreLink("search", "5 keys")}
      />

      {/* About Five Keys Section - Alternative 5-key products */}
      <ProductSection
        title="About Five Keys"
        subtitle="Discover our curated selection of 5-key random bundles!"
        products={aboutFiveKeysProducts}
        isLoading={isLoadingAboutFiveKeys}
        showMoreLink={getShowMoreLink("search", "5 random keys")}
      />

      {/* Single Randoms Are Pretty Great Too! Section */}
      <ProductSection
        title="Single Randoms Are Pretty Great Too!"
        subtitle="Try your luck with a single random key - you might just discover your next favorite game!"
        products={singleRandomsProducts}
        isLoading={isLoadingSingleRandoms}
        showMoreLink={getShowMoreLink("search", "single random key")}
      />

      {/* Up For A Smaller Set? Get 3 Keys! Section */}
      <ProductSection
        title="Up For A Smaller Set? Get 3 Keys!"
        subtitle="A perfect balance - get three random keys without breaking the bank!"
        products={threeKeysProducts}
        isLoading={isLoadingThreeKeys}
        showMoreLink={getShowMoreLink("search", "3 keys")}
      />

      {/* Style Up For Roblox And Fortnite! Section */}
      <ProductSection
        title="Style Up For Roblox And Fortnite!"
        subtitle="Get random keys for popular games like Roblox and Fortnite!"
        products={robloxFortniteProducts}
        isLoading={isLoadingRobloxFortnite}
        showMoreLink={getShowMoreLink("search", "roblox fortnite")}
      />

      {/* Random Counter Strike 2 Skins! Section */}
      <ProductSection
        title="Random Counter Strike 2 Skins!"
        subtitle="Unlock random CS2 skins and items to customize your gaming experience!"
        products={cs2Products}
        isLoading={isLoadingCS2}
        showMoreLink={getShowMoreLink("search", "counter-strike 2")}
      />

      {/* Monthly Subscription Section */}
      <ProductSection
        title="Monthly Subscription"
        subtitle="Get ongoing access to random keys with our monthly subscription plans!"
        products={monthlySubscriptionProducts}
        isLoading={isLoadingMonthlySubscription}
        showMoreLink={getShowMoreLink("search", "monthly subscription")}
      />
       
    </div>
  );
};

export default RandomKeys;
