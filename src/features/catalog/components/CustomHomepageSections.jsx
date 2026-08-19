import { useQuery } from "@tanstack/react-query";
import { homepageSectionAPI, productAPI } from "@services/api";
import ProductRowSection from "./ProductRowSection";

// M15: renders every ACTIVE admin-defined homepage section in order.
//
// Each section is just a ProductRowSection fed by its own search query, so it
// inherits the same progressive reveal (1 row → +2 rows → +2 rows → See All)
// as the built-in homepage rows. Absent sections cost nothing — one cached list
// call, and each section's products are cached independently.
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
        <ProductRowSection
          key={section._id}
          title={section.title}
          description={section.subtitle}
          queryKey={["homepage-section-products", section._id, section.searchQuery]}
          pageSize={section.productLimit || 6}
          fetchPage={(page, limit) =>
            productAPI
              .getProducts({ search: section.searchQuery, page, limit })
              .then((r) => r.data.data)
          }
          seeAllTo={`/search?q=${encodeURIComponent(section.searchQuery)}`}
        />
      ))}
    </>
  );
};

export default CustomHomepageSections;
