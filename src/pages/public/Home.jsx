import { useQuery } from "@tanstack/react-query";
import {
  Hero,
  CategoryNavigation,
  ProductCard,
  ProductRowSection,
  SubcategoryRail,
  MicrosoftCard,
  PlatformTrustGrid,
  PlusPromoSection,
  CustomHomepageSections,
} from "@features/catalog";
import {
  bestsellerAPI,
  upcomingGamesAPI,
  softwareAPI,
  seoAPI,
  productAPI,
} from "@services/api";
import { Loading } from "@components/ui/loading";
import { useSEO } from "@hooks/useSEO";
import { useInView } from "@hooks/useInView";

const widths = ["w-1/4", "w-1/4", "w-1/2", "w-1/4", "w-1/4", "w-1/2"];

// M15 page fetchers. Each returns the { docs, totalDocs } shape ProductRowSection
// paginates on, so all four rows share one component and one Show More flow.
const fetchFeatured = (page, limit) =>
  productAPI
    .getProducts({ isFeatured: true, sort: "rating", page, limit })
    .then((r) => r.data.data);

const fetchTopViewed = (page, limit) =>
  productAPI.getProducts({ sort: "views", page, limit }).then((r) => r.data.data);

const fetchGiftCards = (page, limit) =>
  productAPI
    .getProducts({ categoryName: "Gift Cards", sort: "rating", page, limit })
    .then((r) => r.data.data);

// Bestsellers are BestSeller records, not products — unwrap to the populated
// product and drop rows whose product or seller went inactive (the backend's
// populate `match` leaves those null).
const fetchBestsellers = (page, limit) =>
  bestsellerAPI.getBestsellers({ page, limit }).then((r) => {
    const payload = r.data.data;
    return {
      docs: (payload?.bestsellers || [])
        .filter((entry) => entry?.productId?._id)
        .map((entry) => entry.productId),
      totalDocs: payload?.pagination?.total ?? 0,
    };
  });

const Home = () => {
  // The legacy block (upcoming games, Microsoft) lives far below the fold but
  // used to fetch at mount. One sentinel gates both, keeping them out of the
  // initial request burst.
  const { ref: legacyRef, isInView: legacyInView } = useInView({
    rootMargin: "600px",
    threshold: 0,
    once: true,
  });

  const { data: upcomingGamesData, isLoading: isLoadingUpcomingGames } =
    useQuery({
      queryKey: ["upcoming-games", "home"],
      queryFn: async () => {
        const response = await upcomingGamesAPI.getUpcomingGames();
        return response.data.data;
      },
      enabled: legacyInView,
      staleTime: 120000,
    });

  const { data: softwarePageData, isLoading: isLoadingMicrosoft } = useQuery({
    queryKey: ["software-page", "home"],
    queryFn: async () => {
      const response = await softwareAPI.getSoftwarePage();
      return response.data.data;
    },
    enabled: legacyInView,
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
  return (
    <div className="min-h-screen">
      <Hero />
      {/* M15: platform trust strip (logo · global · dispute · instant) */}
      <PlatformTrustGrid />
      <CategoryNavigation scrollOffset={140} />

      {/* ── M15 section order: Featured → Subscriptions → Best Sellers →
          [subcategory icons] → Top Viewed → Gift Cards → admin sections.
          The legacy rows below keep their existing admin tooling and simply
          move underneath. ── */}

      <ProductRowSection
        id="featured-products"
        title="Featured Products"
        description="Hand-picked products with extra visibility"
        queryKey={["home-row", "featured"]}
        fetchPage={fetchFeatured}
        seeAllTo="/search?isFeatured=true"
        // First row sits near the fold — load it immediately; every row below
        // waits until it scrolls into range.
        defer={false}
      />

      {/* M15: DGMARQ Plus subscriptions promo */}
      <PlusPromoSection />

      <ProductRowSection
        id="bestsellers"
        title="Bestsellers"
        description="Top-rated products from our best sellers"
        queryKey={["home-row", "bestsellers"]}
        fetchPage={fetchBestsellers}
        seeAllTo="/bestsellers"
      />

      {/* M15: admin-curated subcategory icons, auto-looping to the right */}
      <SubcategoryRail />

      <ProductRowSection
        id="top-viewed"
        title="Top Viewed Products"
        description="What everyone is looking at right now"
        queryKey={["home-row", "top-viewed"]}
        fetchPage={fetchTopViewed}
        seeAllTo="/search?sort=views"
      />

      <ProductRowSection
        id="gift-cards"
        title="Gift Cards"
        description="Instant top-ups for the stores and platforms you use"
        queryKey={["home-row", "gift-cards"]}
        fetchPage={fetchGiftCards}
        seeAllTo="/gift-cards"
      />

      {/* M15: admin-defined custom heading sections (search-driven product rows).
          Placed above the legacy rows so admin content is not buried. */}
      <CustomHomepageSections />

      {/* Sentinel: everything below fetches once this scrolls into range. */}
      <div ref={legacyRef}></div>

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
