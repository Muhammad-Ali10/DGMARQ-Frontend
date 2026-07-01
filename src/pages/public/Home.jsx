import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Button } from "@components/ui/button";
import { Hero, CategoryNavigation, ProductCard, ProductVerticalCard, FlashDeal, CategoryProductSection, MicrosoftCard } from "@features/catalog";
import {
  bestsellerAPI,
  trendingOfferAPI,
  upcomingReleaseAPI,
  upcomingGamesAPI,
  softwareAPI,
  seoAPI,
} from "@services/api";
import { productAPI } from "@services/api";
import { Loading } from "@components/ui/loading";
import { useSEO } from "@hooks/useSEO";
import SafeImage from "@components/ui/safe-image";

const widths = ["w-1/4", "w-1/4", "w-1/2", "w-1/4", "w-1/4", "w-1/2"];

const Home = () => {
  const { data: bestsellersData, isLoading: isLoadingBestsellers } = useQuery({
    queryKey: ["bestsellers", "home"],
    queryFn: async () => {
      const response = await bestsellerAPI.getBestsellers({ forHome: "true" });
      return response.data.data;
    },
    staleTime: 120000,
  });
  const { data: featuredProductsData, isLoading: isLoadingFeatured } = useQuery(
    {
      queryKey: ["featured-products", "home"],
      queryFn: async () => {
        const response = await productAPI.getProducts({
          isFeatured: true,
          limit: 6,
          page: 1,
          sort: "rating",
        });
        return response.data.data;
      },
      staleTime: 120000,
    },
  );
  const { data: trendingOffersData, isLoading: isLoadingTrendingOffers } =
    useQuery({
      queryKey: ["trending-offers", "home"],
      queryFn: async () => {
        const response = await trendingOfferAPI.getTrendingOffers();
        return response.data.data;
      },
      staleTime: 120000,
    });
  const { data: upcomingReleasesData, isLoading: isLoadingUpcomingReleases } =
    useQuery({
      queryKey: ["upcoming-releases", "home"],
      queryFn: async () => {
        const response = await upcomingReleaseAPI.getUpcomingReleases();
        return response.data.data;
      },
      staleTime: 120000,
    });

  const { data: upcomingGamesData, isLoading: isLoadingUpcomingGames } =
    useQuery({
      queryKey: ["upcoming-games", "home"],
      queryFn: async () => {
        const response = await upcomingGamesAPI.getUpcomingGames();
        return response.data.data;
      },
      staleTime: 120000,
    });

  const { data: softwarePageData, isLoading: isLoadingMicrosoft } = useQuery({
    queryKey: ["software-page", "home"],
    queryFn: async () => {
      const response = await softwareAPI.getSoftwarePage();
      return response.data.data;
    },
    staleTime: 120000,
    retry: 2,
  });

  const { data: seoSettings } = useQuery({
    queryKey: ["home-page-seo-public"],
    queryFn: async () => {
      try {
        const response = await seoAPI.getHomePageSEO();
        return response.data.data;
      } catch {
        return null;
      }
    },
    staleTime: 300000,
    retry: 1,
  });

  useSEO({
    title: seoSettings?.metaTitle || undefined,
    description: seoSettings?.metaDescription || undefined,
    canonical: "/",
    useDefaults: true,
  });

  const microsoftProducts = softwarePageData?.microsoft || [];
  const trendingOfferProducts = useMemo(() => {
    if (!Array.isArray(trendingOffersData) || trendingOffersData.length === 0) return [];
    const productMap = new Map();
    trendingOffersData.forEach((offer) => {
      offer.products?.forEach((product) => {
        if (!productMap.has(product._id)) {
          productMap.set(product._id, {
            ...product,
            trendingOffer: {
              discountPercent: offer.discountPercent,
              offerId: offer._id,
            },
          });
        }
      });
    });
    return Array.from(productMap.values()).slice(0, 6);
  }, [trendingOffersData]);

  return (
    <div className="min-h-screen">
      <Hero />
      <CategoryNavigation scrollOffset={140} />
      <div id="featured-products"></div>
      {(isLoadingFeatured || (featuredProductsData?.docs && featuredProductsData.docs.length > 0)) && (
        <section id="featured-products" className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Featured Products
                </h2>
                <p className="text-sm sm:text-base text-gray-400">
                  Hand-picked products with extra visibility
                </p>
              </div>
            </div>

            {isLoadingFeatured ? (
              <div className="flex justify-center items-center py-12">
                <Loading message="Loading featured products..." />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-stretch">
                {featuredProductsData.docs.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <div id="bestsellers"></div>
      <section id="bestsellers">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Bestsellers
              </h2>
              <p className="text-sm sm:text-base text-gray-400">
                Top-rated products from our best sellers
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-accent text-accent hover:bg-accent/10 shrink-0"
            >
              <Link to="/bestsellers">Show More</Link>
            </Button>
          </div>

          {isLoadingBestsellers ? (
            <div className="flex justify-center items-center py-12">
              <Loading message="Loading best sellers..." />
            </div>
          ) : bestsellersData?.bestsellers?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-stretch">
              {bestsellersData.bestsellers
                .filter((bestseller) => bestseller?.productId?._id)
                .map((bestseller) => (
                  <ProductCard
                    key={bestseller.productId._id}
                    product={bestseller.productId}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No best sellers available at the moment.
              </p>
            </div>
          )}
        </div>
      </section>

      <div id="flash-deal"></div>

      <section id="trending-offers">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="shrink-0 lg:w-1/3">
              <FlashDeal />
            </div>

            <div className="flex-1 lg:w-2/3">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-poppins">
                  More Currently Trending Offers
                </h2>
                <p className="text-sm sm:text-base text-gray-400 font-poppins">
                  Don't Miss Out – Grab Them While You Still Have The Chance!
                </p>
              </div>

              {isLoadingTrendingOffers ? (
                <div className="flex justify-center items-center py-12">
                  <Loading message="Loading trending offers..." />
                </div>
              ) : trendingOfferProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trendingOfferProducts.map((product) => (
                    <div key={product._id} className="relative w-full">
                      <ProductVerticalCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">
                    No trending offers available at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div id="upcoming-new-releases"></div>

      {(isLoadingUpcomingReleases || (upcomingReleasesData && upcomingReleasesData.length >= 2)) && (
        <section id="upcoming-new-releases" className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center font-poppins">
              New And Upcoming Releases
            </h2>
            {isLoadingUpcomingReleases ? (
              <div className="flex justify-center items-center py-12">
                <Loading message="Loading upcoming releases..." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingReleasesData.slice(0, 2).map((slot) => {
                  const product = slot.product;
                  if (!product) return null;

                  const discountPrice = product.discount
                    ? product.price * (1 - product.discount / 100)
                    : product.price;
                  const discountPercent = product.discount
                    ? Math.round(product.discount)
                    : 0;

                  return (
                    <Link
                      key={slot.slotNumber}
                      to={`/product/${product.slug || product._id}`}
                      className="relative group"
                    >
                      <div
                        className="relative h-[300px] sm:h-[350px] md:h-[400px] rounded-2xl overflow-hidden"
                        style={{
                          backgroundImage: `url(${slot.backgroundImageUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

                        <div className="relative h-full flex flex-col justify-between p-6 text-white">
                          <div className="flex-1 flex items-start">
                            <div>
                              <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-poppins mb-2">
                                {product.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-300 font-poppins">
                                {product.platform?.name || "Digital Product"} -{" "}
                                {product.region?.name || "GLOBAL"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-auto">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-xl sm:text-2xl font-bold font-poppins">
                                  $ {discountPrice.toFixed(2)}
                                </p>
                                {discountPercent > 0 && (
                                  <>
                                    <del className="text-sm text-gray-400 font-poppins">
                                      $ {product.price.toFixed(2)}
                                    </del>
                                    <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded font-poppins">
                                      -{discountPercent}%
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all font-poppins">
                              Add to cart
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      <div id="upcoming-games">      </div>
      {(isLoadingUpcomingGames || (upcomingGamesData && upcomingGamesData.length > 0)) && (
        <section id="upcoming-games" className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Upcoming Games
                </h2>
                <p className="text-sm sm:text-base text-gray-400">
                  Discover the latest games coming soon
                </p>
              </div>
            </div>

            {isLoadingUpcomingGames ? (
              <div className="flex justify-center items-center py-12">
                <Loading message="Loading upcoming games..." />
              </div>
            ) : upcomingGamesData?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-stretch">
                {upcomingGamesData.slice(0, 6).map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  No upcoming games available at the moment.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <div id="software"></div>
      <CategoryProductSection
        title="Software"
        description="Top-rated software products from our best sellers"
        categoryName="Software"
        sortBy="rating"
        limit={6}
      />

      <div id="gaming-accounts"></div>
      <CategoryProductSection
        title="Gaming Accounts"
        description="Premium gaming accounts with the best reviews"
        categoryName="Gaming"
        sortBy="rating"
        limit={6}
      />


      <div id="random-keys"></div>
      <CategoryProductSection
        title="Random Keys"
        description="Discover random game keys and digital products"
        categoryName="Random Keys"
        sortBy="rating"
        limit={6}
      />

      <div id="microsoft"></div>
      {(isLoadingMicrosoft || microsoftProducts.length > 0) && (
        <section id="microsoft" className="py-8 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            {isLoadingMicrosoft ? (
              <div className="flex flex-row flex-wrap gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((skeletonId) => (
                  <div
                    key={skeletonId}
                    className="min-h-[280px] sm:min-h-[320px] md:min-h-[340px] rounded-2xl bg-gradient-to-r from-[#1e3a5f] via-[#2563eb] to-[#60a5fa] animate-pulse"
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
            ) : microsoftProducts.length > 0 ? (
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
              <p className="text-gray-400">
                No Microsoft products available at the moment.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
