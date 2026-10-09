import { useQuery } from "@tanstack/react-query";
import { homepageSectionAPI, productAPI } from "@services/api";
import ProductRowSection from "./ProductRowSection";

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
              .getProducts({ search: section.searchQuery, searchMode: "prefix", page, limit })
              .then((r) => r.data.data)
          }
          seeAllTo={`/search?q=${encodeURIComponent(section.searchQuery)}`}
        />
      ))}
    </>
  );
};

export default CustomHomepageSections;
