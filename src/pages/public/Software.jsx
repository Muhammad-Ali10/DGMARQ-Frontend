import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import ProductCard from "../../components/ProductCard";
import ProductVerticalCard from "../../components/ProductVerticalCard";
import MicrosoftCard from "../../components/MicrosoftCard";
import { softwareAPI } from "../../services/api";
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

          <ProductSectionSkeleton count={6} vertical={vertical} />

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
              <ProductVerticalCard key={product._id} product={product} />
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

const Software = () => {
  const isMountedRef = useRef(true);

  // Fetch Software page data with Promise.all protection
  const { data, isLoading, error } = useQuery({
    queryKey: ["software-page"],
    queryFn: async () => {
      const response = await softwareAPI.getSoftwarePage();
      return response.data.data;
    },
    staleTime: 120000, // 2 minutes - matches backend cache
    cacheTime: 300000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Category navigation items
  const categoryNavItems = [
    { name: "Microsoft", href: "#microsoft" },
    { name: "Bestsellers", href: "#bestsellers" },
    { name: "VPN", href: "#vpns" },
    { name: "IOS Utilities", href: "#ios-utilities" },
    { name: "Graphic Design", href: "#graphic-design" },
    { name: "Antivirus", href: "#antivirus" },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#041536] to-[#060318]">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center py-12">
            <Loading message="Loading software products..." />
          </div>
        </div>
      </div>
    );
  }

  // Show error state (graceful degradation)
  if (error) {
    console.error("Error loading software page:", error);
  }

  const sections = data || {
    trendingOffers: [],
    microsoft: [],
    bestSellers: [],
    vpns: [],
    iosUtilities: [],
    graphicDesign: [],
    antivirus: [],
  };

  const widths= [
    "w-1/4",
    "w-1/4",
    "w-1/2",
    "w-1/4",
    "w-1/4",
    "w-1/2",
  ]

  return (
    <div className="min-h-screen ">
      {/* Main Title Section */}
      <section className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 md:mb-4 text-center font-poppins">
            Best Software
          </h1>
          <p className="text-white text-sm md:text-base text-center font-poppins">
            For Home and Business
          </p>
        </div>
      </section>

      {/* More Currently Trending Offers Section */}
      <section id="trending-offers" className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Centered Heading */}
          <div className="text-start mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-poppins">
              More Currently Trending Offers
            </h2>
            <p className="text-sm md:text-base text-gray-400 font-poppins px-4">
              Don't Miss Out – Grab Them While You Still Have The Chance!
            </p>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <ProductSectionSkeleton count={6} vertical={true} />
          ) : sections.trendingOffers?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sections.trendingOffers.map((product) => (
                <ProductVerticalCard key={product._id} product={product} />
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
      </section>

      {/* Category Navigation */}
      <section className="py-6 md:py-8 ">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
            {categoryNavItems.map((item) => (
              <Button
                key={item.name}
                asChild
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs md:text-sm px-3 md:px-4 py-2"
              >
                <a href={item.href}>{item.name}</a>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Microsoft Section */}
      <section id="microsoft" className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Microsoft Product Grid */}
          {isLoading ? (
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
          ) : sections.microsoft?.length > 0 ? (
            <div className="flex flex-row flex-wrap gap-4 sm:gap-6 w-full">
              {sections.microsoft.map((product, index) => (
                <MicrosoftCard key={product._id} product={product} width={widths[index]}/>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">
              No Microsoft products available at the moment.
            </p>
          )}
        </div>
      </section>

      {/* Best Sellers Section */}
      <section id="bestsellers">
        <ProductSection
          title="Best Sellers"
          subtitle="The Hottest Items On Our Marketplace - Discover What Captured Our Users Hearts!"
          products={sections.bestSellers}
          isLoading={isLoading}
          showMoreLink="/bestsellers"
        />
      </section>

      {/* VPNs Section */}
      <section id="vpns">
        <ProductSection
          title="VPNs"
          subtitle="Make Sure Your Connection And Identity Are Protected From Online Threats"
          products={sections.vpns}
          isLoading={isLoading}
          showMoreLink="/search?category=VPN"
        />
      </section>

      {/* iOS Utilities Section */}
      <section id="ios-utilities">
        <ProductSection
          title="IOS Utilities"
          subtitle="Everything You Need For Your Apple Devices!"
          products={sections.iosUtilities}
          isLoading={isLoading}
          showMoreLink="/search?platform=iOS"
        />
      </section>

      {/* Graphic Design Section */}
      <section id="graphic-design">
        <ProductSection
          title="Graphic Design"
          subtitle="Unleash Your Creativity With The Help Of The Powerful Apps Below"
          products={sections.graphicDesign}
          isLoading={isLoading}
          showMoreLink="/search?category=Graphic Design"
        />
      </section>

      {/* Antivirus And Security Section */}
      <section id="antivirus">
        <ProductSection
          title="Antivirus And Security"
          subtitle="Keep Your Devices Safe And Sound With Our Selection Of Security Solutions"
          products={sections.antivirus}
          isLoading={isLoading}
          showMoreLink="/search?category=Antivirus"
        />
      </section>
    </div>
  );
};

export default Software;
