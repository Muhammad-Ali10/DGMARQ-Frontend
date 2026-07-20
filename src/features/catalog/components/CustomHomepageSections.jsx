import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@components/ui/button";
import { Loading } from "@components/ui/loading";
import { homepageSectionAPI, productAPI } from "@services/api";
import ProductCard from "./ProductCard";

// One admin-defined section: heading + products from its search query + a
// "Show More" link to the search page for the same query.
const SectionRow = ({ section }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["homepage-section-products", section._id, section.searchQuery, section.productLimit],
    queryFn: () =>
      productAPI
        .getProducts({ search: section.searchQuery, limit: section.productLimit || 6, page: 1 })
        .then((r) => r.data.data),
    staleTime: 120000,
  });

  const products = data?.docs || [];
  // Hide the whole section when its query matches nothing (no empty shells).
  if (!isLoading && products.length === 0) return null;

  const searchUrl = `/search?q=${encodeURIComponent(section.searchQuery)}`;

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{section.title}</h2>
            {section.subtitle && (
              <p className="text-sm sm:text-base text-gray-400">{section.subtitle}</p>
            )}
          </div>
          <Button
            asChild
            variant="outline"
            className="border-accent text-accent hover:bg-accent/10 shrink-0"
          >
            <Link to={searchUrl}>Show More</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loading message={`Loading ${section.title}...`} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-stretch">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// M15: renders every ACTIVE admin-defined homepage section in order. Absent
// sections cost nothing — one cached list call, and each section's products
// query is cached independently.
const CustomHomepageSections = () => {
  const { data: sections = [] } = useQuery({
    queryKey: ["homepage-sections"],
    queryFn: () => homepageSectionAPI.getHomepageSections().then((r) => r.data.data || []),
    staleTime: 120000,
  });

  if (!sections.length) return null;

  return (
    <>
      {sections.map((section) => (
        <SectionRow key={section._id} section={section} />
      ))}
    </>
  );
};

export default CustomHomepageSections;
