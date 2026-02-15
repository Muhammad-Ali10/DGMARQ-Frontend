import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./ui/button";
import ProductCard from "./ProductCard";
import { Loading } from "./ui/loading";
import { productAPI, categoryAPI, typeAPI } from "../services/api";

const CategoryProductSection = ({
  title,
  description,
  categoryName,
  productTypeName,
  sortBy = "rating",
  limit = 6,
  seeMoreLink,
}) => {
  const { data: categoryData } = useQuery({
    queryKey: ["category-by-name-for-slug", categoryName],
    queryFn: async () => {
      if (!categoryName) return null;
      const response = await categoryAPI.getCategories({ 
        search: categoryName, 
        isActive: true,
        limit: 100 
      });
      const categories = response.data.data?.docs || [];
      return categories.find(cat => 
        cat.name.toLowerCase() === categoryName.toLowerCase()
      ) || categories.find(cat => 
        cat.name.toLowerCase().includes(categoryName.toLowerCase())
      ) || null;
    },
    enabled: !!categoryName,
    staleTime: 300000,
  });

  const { data: typeData } = useQuery({
    queryKey: ["type-by-name-for-url", productTypeName],
    queryFn: async () => {
      if (!productTypeName) return null;
      const response = await typeAPI.getAllTypes({ 
        search: productTypeName, 
        limit: 100 
      });
      const types = response.data.data?.docs || [];
      return types.find(t => 
        t.name.toLowerCase() === productTypeName.toLowerCase()
      ) || types.find(t => 
        t.name.toLowerCase().includes(productTypeName.toLowerCase())
      ) || null;
    },
    enabled: !!productTypeName,
    staleTime: 300000,
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["category-products", categoryName, productTypeName, sortBy, limit],
    queryFn: async () => {
      const params = {
        limit,
        page: 1,
        sort: sortBy === "rating" ? "rating" : "newest",
      };
      if (categoryName) {
        params.categoryName = categoryName;
      }
      if (productTypeName) {
        params.typeName = productTypeName;
      }

      const response = await productAPI.getProducts(params);
      const products = response.data.data?.docs || [];

      return {
        docs: products,
        totalDocs: response.data.data?.totalDocs || products.length,
      };
    },
    enabled: !!categoryName || !!productTypeName,
    staleTime: 120000,
  });

  const products = productsData?.docs || [];
  const getSeeMoreLink = () => {
    if (seeMoreLink) return seeMoreLink;
    if (categoryName) {
      if (categoryData?.slug) {
        return `/category/${categoryData.slug}`;
      }
      return `/search?categoryName=${encodeURIComponent(categoryName)}`;
    }
    if (productTypeName) {
      if (typeData?._id) {
        return `/search?type=${typeData._id}`;
      }
      return `/search?type=${encodeURIComponent(productTypeName)}`;
    }
    return null;
  };

  const seeMoreUrl = getSeeMoreLink();

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Centered Title and Description */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-poppins">
            {title}
          </h2>
          {description && (
            <p className="text-sm sm:text-base text-gray-400 font-poppins">
              {description}
            </p>
          )}
        </div>

        {/* Products Grid - Horizontal Layout */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loading message={`Loading ${title.toLowerCase()}...`} />
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* See More Button - Orange Color */}
            {seeMoreUrl && (
              <div className="flex justify-center mt-6">
                <Button
                  asChild
                  className="bg-[#F05F00] hover:bg-[#E05500] text-white font-poppins px-6 py-2 rounded-lg"
                >
                  <Link to={seeMoreUrl}>See More</Link>
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">
              No products available in {title.toLowerCase()} at the moment.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryProductSection;
