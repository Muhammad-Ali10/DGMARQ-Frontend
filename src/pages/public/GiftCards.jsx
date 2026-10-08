import { useMemo } from 'react';
import { ProductListingLayout, useActiveCategories } from '@features/catalog';
import { Loading, ErrorMessage } from '@components/ui/loading';

const GiftCards = () => {
  const { data: categoriesData, isLoading, isError } = useActiveCategories();

  const giftCardCategory = useMemo(() => {
    if (!categoriesData) return null;
    return categoriesData.find((c) =>
      c.name?.toLowerCase().includes('gift card') ||
      c.slug?.toLowerCase().includes('gift-card') ||
      c.name?.toLowerCase() === 'gift cards'
    );
  }, [categoriesData]);

  if (isLoading) return <Loading message="Loading gift cards..." />;
  if (isError || !giftCardCategory) return <ErrorMessage message="Category not found" />;

  return (
    <ProductListingLayout
      lockedCategoryId={giftCardCategory._id}
      pageTitle="Gift Cards"
    />
  );
};

export default GiftCards;
