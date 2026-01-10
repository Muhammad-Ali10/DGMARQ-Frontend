import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformAPI, categoryAPI } from '../../services/api';
import ProductListingLayout from '../../components/ProductListing/ProductListingLayout';

const SteamGiftCard = () => {
  // Fetch Steam platform ID
  const { data: platformsData } = useQuery({
    queryKey: ['platforms', 'steam'],
    queryFn: async () => {
      const response = await platformAPI.getAllPlatforms({ isActive: true, limit: 100 });
      return response.data.data;
    },
  });

  const steamPlatform = useMemo(() => {
    return platformsData?.platforms?.find((p) => 
      p.name?.toLowerCase() === 'steam'
    );
  }, [platformsData]);

  // Fetch Gift Card category ID
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'gift-card'],
    queryFn: async () => {
      const response = await categoryAPI.getCategories({ isActive: true, limit: 100 });
      return response.data.data;
    },
  });

  const giftCardCategory = useMemo(() => {
    return categoriesData?.docs?.find((c) => 
      c.name?.toLowerCase().includes('gift card') || 
      c.slug?.toLowerCase().includes('gift-card')
    );
  }, [categoriesData]);

  // Use ProductListingLayout with locked platform and default category
  return (
    <ProductListingLayout
      lockedPlatformId={steamPlatform?._id}
      defaultCategoryId={giftCardCategory?._id}
      pageTitle="Steam Gift Card"
    />
  );
};

export default SteamGiftCard;
