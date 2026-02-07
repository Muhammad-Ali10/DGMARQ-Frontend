import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { bestsellerAPI } from "../../services/api";
import ProductCard from "../../components/ProductCard";
import { Loading, ErrorMessage } from "../../components/ui/loading";
import { Button } from "../../components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
  
const PlatformsButton = [
  { name: "steam Games", url: "#" },
  { name: "Origin Games ", url: "#" },
  { name: "Xbox Live Games", url: "#" },
  { name: "GOG Games", url: "#" },
  { name: "Ubisoft Connect", url: "#" },
  { name: "PSN Games", url: "#" },
];

const PopularTopics = [
  { name: "Civilization Games", url: "#" },
  { name: "Final Fantasy Games", url: "#" },
  { name: "Nancy Drew Games ", url: "#" },
  { name: "Borderlands Games", url: "#" },
  { name: "Fallout Games", url: "#" },
  { name: "Payday Games", url: "#" },
  { name: "Sniper Elite Games", url: "#" },
  { name: "ACA NEOGEO Games", url: "#" },
  { name: "Civilization 7 Price", url: "#" },
  { name: "Civilization 7 PS5 Code", url: "#" },
  { name: "Kingdom Come Deliverance 2 Price", url: "#" },
  { name: "Monster Hunter Wilds PC Key", url: "#" },
  { name: "Monster Hunter Wilds Best Price", url: "#" },
  { name: "Monster Hunter Wilds Xbox Key", url: "#" },
  { name: "Monster Hunter Wilds PS5 Code", url: "#" },
  { name: "Ambulance Life PC Key", url: "#" },
  { name: "Spider-Man 2 PC Key", url: "#" },
  { name: "Assetto Corsa Evo Key", url: "#" },
];

const BestSellers = () => {
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["bestsellers", "page", page],
    queryFn: async () => {
      const response = await bestsellerAPI.getBestsellers({ page, limit });
      return response.data.data;
    },
  });

  const bestsellers = data?.bestsellers || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (page < pagination.pages) {
      setPage(page + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen container mx-auto py-12">
        <div className="max-w-7xl mx-auto px-4">
          <Loading message="Loading best sellers..." />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen container mx-auto = py-12">
        <div className="max-w-7xl mx-auto px-4">
          <ErrorMessage
            message={error?.message || "Failed to load best sellers"}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen   py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Best Sellers</h1>
          <p className="text-gray-400">
            Discover top-rated products from our highest-performing sellers
          </p>
        </div>

        {/* Products Grid */}
        {bestsellers.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              {bestsellers.map((bestseller) => (
                <ProductCard
                  key={bestseller.productId._id}
                  product={bestseller.productId}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button
                  onClick={handlePreviousPage}
                  disabled={page === 1}
                  variant="outline"
                  className="border-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                <span className="text-gray-400">
                  Page {pagination.page} of {pagination.pages} (
                  {pagination.total} products)
                </span>

                <Button
                  onClick={handleNextPage}
                  disabled={page >= pagination.pages}
                  variant="outline"
                  className="border-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              No best sellers available at the moment.
            </p>
            <Button
              asChild
              variant="outline"
              className="border-accent text-accent hover:bg-accent/10"
            >
              <Link to="/search">Browse All Products</Link>
            </Button>
          </div>
        )}
      </div>

      {/* <div className="flex flex-col items-center justify-center gap-7 bg-[#0E092C] py-12  w-full">
        <h3 className="text-2xl font-semibold text-white">
          TOP Game Platforms
        </h3>
        <p className="text-sm font-poppins font-normal text-white">
          Are you low on cash or just want to score a great bargain? DGMARQ
          offers a selection of great video games for all major gaming
          platforms!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 max-w-1260 w-full">
          {PlatformsButton.map((platform, index) => (
            <Button
              className="py-5 px-4 rounded-21 h-[110px] bg-[#060318] w-[189px]  font-poppins text-base text-center text-white font-bold"
              key={index}
              as={Link}
              to={platform.url}
            >
              {platform.name}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-7 py-12 max-w-1260 w-full mx-auto">
        <h3 className="text-2xl font-semibold text-white">Popular Topics</h3>
        <p className="text-sm font-poppins font-normal text-white">
          Explore the most popular topics in the gaming world and find the best
          deals on your favorite games!
        </p>

        <div className="flex flex-wrap items-center justify-start gap-4 max-w-1260 w-full mx-auto">
          {PopularTopics.map((topic, index) => (
            <Button
              className="py-5 px-4 bg-blue-3 rounded-21 h-[64px] font-poppins text-base text-center text-white font-bold"
              key={index}
              as={Link}
              to={topic.url}
            >
              {topic.name}
            </Button>
          ))}
        </div>
      </div>
        */}
    </div>
  );
};

export default BestSellers;
