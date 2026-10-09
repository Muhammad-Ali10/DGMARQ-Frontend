import { ProductListingLayout } from '@features/catalog';
import { useSEO } from '@hooks/useSEO';

const SearchResults = () => {
  useSEO({
    title: 'Search Results | DGMARQ',
    description: 'Search DGMARQ marketplace for games, software, keys, and digital products.',
    canonical: '/search',
  });

  return (
    <ProductListingLayout
      pageTitle="Search Results"
      defaultCategoryId={null}
    />
  );
};

export default SearchResults;
