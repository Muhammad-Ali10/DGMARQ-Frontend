import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { bestsellerAPI } from "@services/api";
import { ProductCard } from "@features/catalog";
import { Loading, ErrorMessage } from "@components/ui/loading";
import { Button } from "@components/ui/button";
import { Pagination } from "@components/common/Pagination";
import { useSEO } from "@hooks/useSEO";

const BestSellers = () => {
  useSEO({
    title: "Best Sellers | DGMARQ",
    description: "Shop the best selling games and digital products on DGMARQ marketplace.",
    canonical: "/bestsellers",
    useDefaults: false,
  });

  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["bestsellers", "page", page],
    queryFn: async () => {
      const response = await bestsellerAPI.getBestsellers({ page, limit });
      return response.data.data;
    },
    placeholderData: keepPreviousData,
  });

  const bestsellers = data?.bestsellers || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

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
      <div className="min-h-screen container mx-auto py-12">
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
            {isFetching && (
              <p className="text-sm text-gray-400 mb-4">Updating best sellers...</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8 items-stretch">
              {bestsellers
                .filter((bestseller) => bestseller?.productId?._id)
                .map((bestseller) => (
                <ProductCard
                  key={bestseller.productId._id}
                  product={bestseller.productId}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              page={page}
              totalPages={pagination.pages}
              onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              total={pagination.total}
              totalNoun="products"
            />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              No best sellers available at the moment.
            </p>
            <Button
              asChild
              variant="outline"
              className="border-accent text-accent-on-dark hover:bg-accent/10"
            >
              <Link to="/search">Browse All Products</Link>
            </Button>
          </div>
        )}
      </div>

    </div>
  );
};

export default BestSellers;
