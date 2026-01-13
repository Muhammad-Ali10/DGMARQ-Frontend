import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryAPI } from '../../services/api';
import ProductListingLayout from '../../components/ProductListing/ProductListingLayout';

const GiftCards = () => {
  // Fetch Gift Cards category
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'gift-cards'],
    queryFn: async () => {
      const response = await categoryAPI.getCategories({ isActive: true, limit: 100 });
      return response.data.data;
    },
  });

  const giftCardCategory = useMemo(() => {
    if (!categoriesData?.docs) return null;
    // Try to find category by name (case-insensitive, partial match)
    return categoriesData.docs.find((c) => 
      c.name?.toLowerCase().includes('gift card') || 
      c.slug?.toLowerCase().includes('gift-card') ||
      c.name?.toLowerCase() === 'gift cards'
    );
  }, [categoriesData]);

  // Use ProductListingLayout with locked category
  return (
    <ProductListingLayout
      lockedCategoryId={giftCardCategory?._id}
      pageTitle="Gift Cards"
    />
  );
};

export default GiftCards;
