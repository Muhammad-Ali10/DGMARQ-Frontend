import { useMemo } from 'react';
import { ProductListingLayout, useActiveCategories } from '@features/catalog';

const GiftCards = () => {
  const { data: categoriesData } = useActiveCategories(['categories', 'gift-cards']);

  const giftCardCategory = useMemo(() => {
    if (!categoriesData?.docs) return null;
    return categoriesData.docs.find((c) =>
      c.name?.toLowerCase().includes('gift card') ||
      c.slug?.toLowerCase().includes('gift-card') ||
      c.name?.toLowerCase() === 'gift cards'
    );
  }, [categoriesData]);

  return (
    <ProductListingLayout
      lockedCategoryId={giftCardCategory?._id}
      pageTitle="Gift Cards"
    />
  );
};

export default GiftCards;
