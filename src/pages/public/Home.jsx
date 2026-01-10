import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import Hero from "../../components/Hero";
import CategoryNavigation from "../../components/CategoryNavigation";
import ProductCard from "../../components/ProductCard";
import ProductVerticalCard from "../../components/ProductVerticalCard";
import FlashDeal from "../../components/FlashDeal";
import CategoryProductSection from "../../components/CategoryProductSection";
import MicrosoftCard from "../../components/MicrosoftCard";
import {
  bestsellerAPI,
  trendingOfferAPI,
  upcomingReleaseAPI,
  upcomingGamesAPI,
  trendingCategoryAPI,
  softwareAPI,
} from "../../services/api";
import { Loading } from "../../components/ui/loading";
import FooterBlogs from "../../components/FooterBlogs";
import FavoriteItems from "../../components/FavoriteItems";


const widths= [
  "w-1/4",
  "w-1/4",
  "w-1/2",
  "w-1/4",
  "w-1/4",
  "w-1/2",
]

const Home = () => {
  const navigate = useNavigate();

  // Fetch best sellers for home page (6 products)
  const { data: bestsellersData, isLoading: isLoadingBestsellers } = useQuery({
    queryKey: ["bestsellers", "home"],
    queryFn: async () => {
      const response = await bestsellerAPI.getBestsellers({ forHome: "true" });
      return response.data.data;
    },
  });

  // Fetch trending offers for home page
  const { data: trendingOffersData, isLoading: isLoadingTrendingOffers } =
    useQuery({
      queryKey: ["trending-offers", "home"],
      queryFn: async () => {
        const response = await trendingOfferAPI.getTrendingOffers();
        return response.data.data;
      },
    });

  // Fetch upcoming releases for home page
  const { data: upcomingReleasesData, isLoading: isLoadingUpcomingReleases } =
    useQuery({
      queryKey: ["upcoming-releases", "home"],
      queryFn: async () => {
        const response = await upcomingReleaseAPI.getUpcomingReleases();
        return response.data.data;
      },
    });

  // Fetch upcoming games for home page (6 products)
  const { data: upcomingGamesData, isLoading: isLoadingUpcomingGames } =
    useQuery({
      queryKey: ["upcoming-games", "home"],
      queryFn: async () => {
        const response = await upcomingGamesAPI.getUpcomingGames();
        return response.data.data;
      },
    });

  // Fetch trending categories (automated, sales-based)
  const { data: trendingCategoriesData, isLoading: isLoadingTrendingCategories } =
    useQuery({
      queryKey: ["trending-categories", "home"],
      queryFn: async () => {
        const response = await trendingCategoryAPI.getTrendingCategories();
        return response.data.data;
      },
    });

  // Fetch Microsoft products for home page
  const { data: softwarePageData, isLoading: isLoadingMicrosoft } = useQuery({
    queryKey: ["software-page", "home"],
    queryFn: async () => {
      const response = await softwareAPI.getSoftwarePage();
      return response.data.data;
    },
    staleTime: 120000, // 2 minutes
    retry: 2,
  });

  const microsoftProducts = softwarePageData?.microsoft || [];

  return (
    <div className="min-h-screen">
      {/* Hero Slider Section */}
      <Hero />

      {/* Category Navigation Bar */}
      <CategoryNavigation scrollOffset={140} />

      {/* Bestsellers Section */}
      <section id="bestsellers" className="py-16">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {bestsellersData.bestsellers.map((bestseller) => (
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

      {/* Flash Deal Section */}
      <section id="flash-deal" className="py-16">
        <div className="max-w-7xl mx-auto px-4"></div>
      </section>

      {/* Trending Offers Section */}
      <section id="trending-offers" className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Side: Flash Deal */}
            <div className="shrink-0 lg:w-1/3">
              <FlashDeal />
            </div>

            {/* Right Side: More Currently Trending Offers */}
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
              ) : trendingOffersData?.length > 0 ? (
                (() => {
                  // Flatten and deduplicate products from all offers, limit to 6
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
                  const uniqueProducts = Array.from(productMap.values()).slice(
                    0,
                    6
                  );

                  return uniqueProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {uniqueProducts.map((product) => (
                        <div key={product._id} className="relative w-full">
                          <ProductVerticalCard product={product} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">
                        No products available in trending offers.
                      </p>
                    </div>
                  );
                })()
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

      {/* Upcoming Releases Section */}
      {upcomingReleasesData && upcomingReleasesData.length >= 2 && (
        <section id="upcoming-releases" className="py-16">
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
                        {/* Dark overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

                        {/* Content */}
                        <div className="relative h-full flex flex-col justify-between p-6 text-white">
                          {/* Top: Game Title/Logo area */}
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

                          {/* Bottom: Price and CTA */}
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

      {/* Upcoming Games Section */}
      {upcomingGamesData && upcomingGamesData.length > 0 && (
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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

      {/* Trending Offers Section */}
      <section id="trending-offers" className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Side: Trending Offers */}
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
              ) : trendingOffersData?.length > 0 ? (
                (() => {
                  // Flatten and deduplicate products from all offers, limit to 6
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
                  const uniqueProducts = Array.from(productMap.values()).slice(
                    0,
                    6
                  );

                  return uniqueProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {uniqueProducts.map((product) => (
                        <div key={product._id} className="relative w-full">
                          <ProductVerticalCard product={product} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">
                        No products available in trending offers.
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">
                    No trending offers available at the moment.
                  </p>
                </div>
              )}
            </div>
            {/* Left Side: Flash Deal */}
            <div className="shrink-0 lg:w-1/3">
              <FlashDeal />
            </div>
          </div>
        </div>
      </section>

      {/* Trending Categories Section */}
      <section id="trending-categories" className="py-16">
        <div className="flex w-full justify-center relative gap-5">
          <img src="/images/CenterShedow.png" className="absolute z-10" alt="" />
          <div className="flex flex-col items-center md:items-start max-w-1260 w-full gap-4 md:gap-8 z-20 px-4">
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl -tracking-tight font-semibold text-start text-white">
                Top Trending Categories
              </h3>
              <p className="text-sm sm:text-base font-normal -tracking-tight text-start text-white mb-4">
                From popular subscriptions and software to e-learning, top-ups, and more.
              </p>
            </div>

            {isLoadingTrendingCategories ? (
              <div className="flex justify-center items-center py-12 w-full">
                <Loading message="Loading trending categories..." />
              </div>
            ) : trendingCategoriesData && trendingCategoriesData.length > 0 ? (
              <>
                {/* First Row: 2 cards */}
                <div className="flex flex-col md:flex-row w-full justify-between gap-4 md:gap-8">
                  {trendingCategoriesData.slice(0, 2).map((item, index) => {
                    const category = item.category;
                    if (!category) return null;
                    
                    const cardWidth = index === 0 ? 'max-w-[430px]' : 'max-w-[804px]';
                    
                    return (
                      <Card
                        key={item._id || index}
                        style={{
                          backgroundImage: category.image
                            ? `url('${category.image}')`
                            : `url('https://res.cloudinary.com/dptwervy7/image/upload/v1754393639/BgCategories1_cn0mq1.png')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                        className={`rounded-21 flex justify-end ${cardWidth} w-full h-[300px] sm:h-[400px] md:h-[461px] p-4 sm:p-5 border-0 cursor-pointer hover:opacity-90 transition-opacity`}
                        onClick={() => navigate(`/category/${category.slug || category._id}`)}
                      >
                        <div className="flex flex-row items-start gap-3 sm:gap-5">
                          {category.image && (
                            <img 
                              src={category.image} 
                              alt={category.name}
                              className="w-16 h-20 sm:w-24 sm:h-32 object-cover rounded-lg shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex flex-col items-start gap-1 sm:gap-2">
                            <Button className="bg-[#F05F00] px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg font-poppins text-xs sm:text-base text-white pointer-events-none">
                              Best seller
                            </Button>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-poppins text-white">
                              {category.name}
                            </h3>
                            <span className="text-xs sm:text-sm md:text-base font-medium font-poppins text-white">
                              {category.description || `${category.name} · Global · Key`}
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Second Row: 2 cards (reversed on desktop) */}
                {trendingCategoriesData.length > 2 && (
                  <div className="flex flex-col md:flex-row-reverse w-full justify-between z-20 gap-4 md:gap-8">
                    {trendingCategoriesData.slice(2, 4).map((item, index) => {
                      const category = item.category;
                      if (!category) return null;
                      
                      const actualIndex = index + 2;
                      const cardWidth = actualIndex === 2 ? 'max-w-[430px]' : 'max-w-[804px]';
                      
                      return (
                        <Card
                          key={item._id || actualIndex}
                          style={{
                            backgroundImage: category.image
                              ? `url('${category.image}')`
                              : `url('https://res.cloudinary.com/dptwervy7/image/upload/v1754393639/BgCategories1_cn0mq1.png')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                          className={`rounded-21 flex justify-end ${cardWidth} w-full h-[300px] sm:h-[400px] md:h-[461px] bg-cover bg-center p-4 sm:p-5 border-0 cursor-pointer hover:opacity-90 transition-opacity`}
                          onClick={() => navigate(`/category/${category.slug || category._id}`)}
                        >
                          <div className="flex flex-row items-start gap-3 sm:gap-5">
                            {category.image && (
                              <img 
                                src={category.image} 
                                alt={category.name}
                                className="w-16 h-20 sm:w-24 sm:h-32 object-cover rounded-lg shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex flex-col items-start gap-1 sm:gap-2">
                              <Button className="bg-[#F05F00] px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg font-poppins text-xs sm:text-base text-white pointer-events-none">
                                Best seller
                              </Button>
                              <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-poppins text-white">
                                {category.name}
                              </h3>
                              <span className="text-xs sm:text-sm md:text-base font-medium font-poppins text-white">
                                {category.description || `${category.name} · Global · Key`}
                              </span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 w-full">
                <p className="text-gray-400">
                  No trending categories available at the moment.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Software Section */}
      <CategoryProductSection
        title="Software"
        description="Top-rated software products from our best sellers"
        categoryName="Software"
        sortBy="rating"
        limit={6}
      />

      {/* Gaming Accounts Section */}
      <CategoryProductSection
        title="Gaming Accounts"
        description="Premium gaming accounts with the best reviews"
        categoryName="Gaming"
        sortBy="rating"
        limit={6}
      />

      {/* Random Keys Section */}
      <CategoryProductSection
        title="Random Keys"
        description="Discover random game keys and digital products"
        productTypeName="Key"
        sortBy="rating"
        limit={6}
      />

      {/* Crypto Section */}
      <CategoryProductSection
        title="Crypto"
        description="Cryptocurrency products and services"
        categoryName="Crypto"
        sortBy="rating"
        limit={6}
      />

{/* Microsoft Section */}
      {microsoftProducts.length > 0 && (
        <section id="microsoft" className="py-8 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            {/* Microsoft Product Grid */}
            {isLoadingMicrosoft ? (
              <div className="flex flex-row flex-wrap gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
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


      {/* Favorite Items Section */}
      <section id="favorite-items" className="py-16">
        <FavoriteItems />
      </section>

      
      <FooterBlogs />
    </div>
  );
};

export default Home;
