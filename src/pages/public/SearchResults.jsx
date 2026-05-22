import ProductListingLayout from '../../components/ProductListing/ProductListingLayout';
import { useSEO } from '../../hooks/useSEO';

/**
 * Search Results page. Uses the SAME layout as Gift Card page (ProductListingLayout).
 * Only the data source differs: search query and optional filters from URL (q, category, etc.)
 * are read by ProductListingLayout from URL params and used to fetch products.
 */
const SearchResults = () => {
  useSEO({
    title: 'Search Results | DGMARQ',
    description: 'Search DGMARQ marketplace for games, software, keys, and digital products.',
    canonical: '/search',
    useDefaults: false,
  });

  return (
    <ProductListingLayout
      pageTitle="Search Results"
      defaultCategoryId={null}
    />
  );
};

export default SearchResults;
