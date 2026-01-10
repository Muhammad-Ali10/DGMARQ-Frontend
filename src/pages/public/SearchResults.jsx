import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productAPI, categoryAPI, typeAPI } from '../../services/api';
import ProductCard from '../../components/ProductCard';
import ProductListingLayout from '../../components/ProductListing/ProductListingLayout';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Button } from '../../components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || searchParams.get('categoryId') || '';
  const categoryName = searchParams.get('categoryName') || '';
  const typeId = searchParams.get('type') || '';
  const typeName = searchParams.get('typeName') || '';

  // Fetch category name if category filter is applied
  const { data: categoryData } = useQuery({
    queryKey: ['category', categoryId, categoryName],
    queryFn: async () => {
      if (categoryId) {
        try {
          const response = await categoryAPI.getCategoryById(categoryId);
          return response.data.data;
        } catch {
          return null;
        }
      }
      if (categoryName) {
        try {
          const response = await categoryAPI.getCategories({ search: categoryName, isActive: true, limit: 1 });
          return response.data.data?.docs?.[0] || null;
        } catch {
          return null;
        }
      }
      return null;
    },
    enabled: !!categoryId || !!categoryName,
  });

  // Fetch type data if type filter is applied
  const { data: typeData } = useQuery({
    queryKey: ['type', typeId, typeName],
    queryFn: async () => {
      if (typeId) {
        try {
          const response = await typeAPI.getAllTypes({ limit: 100 });
          const types = response.data.data?.docs || [];
          return types.find(t => t._id === typeId) || null;
        } catch {
          return null;
        }
      }
      if (typeName) {
        try {
          const response = await typeAPI.getAllTypes({ search: typeName, limit: 100 });
          const types = response.data.data?.docs || [];
          return types.find(t => t.name.toLowerCase() === typeName.toLowerCase()) || null;
        } catch {
          return null;
        }
      }
      return null;
    },
    enabled: !!typeId || !!typeName,
  });

  // Check if we should redirect to ProductListingLayout (only type filter, no search/category)
  const shouldUseProductListingLayout = (typeId || typeName) && !query && !categoryId && !categoryName;

  // Fetch search results
  const { data: searchResults, isLoading, isError, error } = useQuery({
    queryKey: ['search-results', query, categoryId, categoryName, typeId, typeName, page],
    queryFn: async () => {
      const params = {
        page,
        limit: 20,
        status: 'active',
      };
      if (query.trim().length > 0) {
        params.search = query;
      }
      if (categoryId) {
        params.categoryId = categoryId;
      } else if (categoryName) {
        params.categoryName = categoryName;
      }
      if (typeId) {
        params.type = typeId;
      } else if (typeName) {
        params.typeName = typeName;
      }
      const response = await productAPI.getProducts(params);
      return response.data.data;
    },
    enabled: query.trim().length > 0 || !!categoryId || !!categoryName || !!typeId || !!typeName,
  });

  useEffect(() => {
    setPage(1);
  }, [query, categoryId, categoryName, typeId, typeName]);

  const products = searchResults?.docs || [];
  const totalPages = searchResults?.totalPages || 0;
  const totalDocs = searchResults?.totalDocs || 0;

  const handleRemoveCategoryFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('category');
    newParams.delete('categoryId');
    newParams.delete('categoryName');
    setSearchParams(newParams);
  };

  // If only type filter is present (no search query, no category), use ProductListingLayout
  // This provides a better experience with full filtering capabilities
  if (shouldUseProductListingLayout) {
    // Use ProductListingLayout with type filter pre-selected via URL params
    // The ProductListingLayout will read the type from URL params automatically
    return (
      <ProductListingLayout
        pageTitle={typeData?.name || 'Products by Type'}
        defaultCategoryId={null}
      />
    );
  }

  if (isLoading) {
    return <Loading message="Searching products..." />;
  }

  if (isError) {
    return (
      <ErrorMessage
        message={error?.response?.data?.message || 'Failed to load search results'}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {query 
                ? `Search Results for "${query}"`
                : categoryData 
                  ? `Products in ${categoryData.name}`
                  : typeData
                    ? `Products - ${typeData.name}`
                    : 'Search Results'}
            </h1>
            {totalDocs > 0 && (
              <p className="text-gray-400">
                Found {totalDocs} {totalDocs === 1 ? 'product' : 'products'}
                {categoryData && !query && ` in ${categoryData.name}`}
                {typeData && !query && !categoryData && ` - ${typeData.name}`}
              </p>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {(categoryData || typeData) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-400">Filter:</span>
            {categoryData && (
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full">
                <span className="text-white text-sm">{categoryData.name}</span>
                <button
                  onClick={handleRemoveCategoryFilter}
                  className="text-gray-400 hover:text-white ml-1"
                >
                  ×
                </button>
              </div>
            )}
            {typeData && (
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full">
                <span className="text-white text-sm">{typeData.name}</span>
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('type');
                    newParams.delete('typeName');
                    setSearchParams(newParams);
                  }}
                  className="text-gray-400 hover:text-white ml-1"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-white px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No products found</p>
          <p className="text-gray-500 text-sm">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;

