import ProductListingLayout from '../../components/ProductListing/ProductListingLayout';

/**
 * Search Results page. Uses the SAME layout as Gift Card page (ProductListingLayout).
 * Only the data source differs: search query and optional filters from URL (q, category, etc.)
 * are read by ProductListingLayout from URL params and used to fetch products.
 */
const SearchResults = () => {
  return (
    <ProductListingLayout
      pageTitle="Search Results"
      defaultCategoryId={null}
    />
  );
};

export default SearchResults;
