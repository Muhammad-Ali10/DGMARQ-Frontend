import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformAPI } from '@services/api';
import { ProductListingLayout, useActiveCategories } from '@features/catalog';

const SteamGiftCard = () => {
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

  const { data: categoriesData } = useActiveCategories(['categories', 'gift-card']);

  const giftCardCategory = useMemo(() => {
    return categoriesData?.docs?.find((c) =>
      c.name?.toLowerCase().includes('gift card') ||
      c.slug?.toLowerCase().includes('gift-card')
    );
  }, [categoriesData]);

  return (
    <ProductListingLayout
      lockedPlatformId={steamPlatform?._id}
      defaultCategoryId={giftCardCategory?._id}
      pageTitle="Steam Gift Card"
    />
  );
};

export default SteamGiftCard;
