import { useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@components/ui/button";
import { Loading } from "@components/ui/loading";
import { ErrorState } from "@components/common/ErrorState";
import { useInView } from "@hooks/useInView";
import ProductCard from "./ProductCard";

// M15: one homepage product row with the agreed progressive reveal —
//
//   1 row → "Show More" (+2 rows) → "Show More" (+2 rows) → "See All" → listing
//
// PAGE SIZE IS DELIBERATELY 6, not 12. The homepage renders several of these,
// so a larger first page would multiply the first-paint payload across every
// section for products most visitors never scroll to. Instead the first paint
// stays exactly one row per section, and a "Show More" click pulls TWO pages
// (2 × 6 = the two rows the design asks for on the 6-column desktop grid).
// Every page is React Query-cached, so collapsing and re-expanding is free.
const DEFAULT_PAGE_SIZE = 6;
const MAX_ROUNDS = 2;

const ProductRowSection = ({
  id,
  title,
  description,
  queryKey,
  fetchPage,
  seeAllTo,
  // Admin heading-sections carry their own row size (1–12), so the page size is
  // overridable; everything else uses one desktop row.
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
  // Below-the-fold rows wait until they are nearly on screen before fetching.
  // The homepage stacks ~10 of these; firing them all at mount put ~25 requests
  // on the wire at once, which is what makes a single slow response able to
  // time out unrelated calls (the header menu among them).
  defer = true,
}) => {
  const [rounds, setRounds] = useState(0);
  // 600px of lead time so the row is already populated by the time it scrolls in.
  const { ref, isInView } = useInView({ rootMargin: "600px", threshold: 0, once: true });
  const active = enabled && (!defer || isInView);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + (page?.docs?.length || 0), 0);
      const total = lastPage?.totalDocs ?? 0;
      return loaded < total ? pages.length + 1 : undefined;
    },
    enabled: active,
    staleTime: 120000,
  });

  const products = data?.pages.flatMap((page) => page?.docs || []) || [];

  const showMore = async () => {
    setRounds((current) => current + 1);
    // Consult the AWAITED result rather than the `hasNextPage` captured in this
    // closure — that one is a render-old value and would skip the second page.
    const afterFirst = await fetchNextPage();
    if (afterFirst?.hasNextPage) await fetchNextPage();
  };

  // A section whose query matches nothing renders nothing — no empty shells on
  // the homepage. Only once the query has actually run, or a deferred row would
  // collapse before it ever got the chance to load.
  if (active && !isLoading && !isError && products.length === 0) return null;

  const roundsLeft = rounds < MAX_ROUNDS && hasNextPage;

  return (
    <section id={id} ref={ref} className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Heading only — the single call-to-action lives under the grid, so
            the row never shows two competing "See All" buttons once the
            progressive reveal is exhausted. */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-fg mb-2 font-poppins">{title}</h2>
          {description && (
            <p className="text-sm sm:text-base text-fg-muted font-poppins">{description}</p>
          )}
        </div>

        {!active ? (
          // Reserve the row's height so nothing jumps when the data lands.
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: pageSize }, (_, i) => (
              <div key={i} className="h-64 rounded-xl bg-surface-2/40 animate-pulse" />
            ))}
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loading message={`Loading ${title.toLowerCase()}…`} />
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} compact />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-stretch">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            <div className="flex justify-center mt-8">
              {roundsLeft ? (
                <Button
                  variant="outline"
                  className="border-accent text-accent-on-dark hover:bg-accent/10"
                  onClick={showMore}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading…" : "Show More"}
                </Button>
              ) : (
                seeAllTo && (
                  <Button
                    asChild
                    className="bg-gradient-to-r from-[#172AA4] to-[#0E9FE2] text-fg font-poppins px-6"
                  >
                    <Link to={seeAllTo}>See All</Link>
                  </Button>
                )
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ProductRowSection;
