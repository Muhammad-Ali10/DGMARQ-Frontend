import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryAPI } from '../../services/api';
import ProductListingLayout from '../../components/ProductListing/ProductListingLayout';

const RandomKeys = () => {
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'random-key'],
    queryFn: async () => {
      const response = await categoryAPI.getCategories({ isActive: true, limit: 100 });
      return response.data.data;
    },
  });

  const randomKeysCategory = useMemo(() => {
    if (!categoriesData?.docs) return null;
    return categoriesData.docs.find((c) =>
      c.name?.toLowerCase().includes('random-key') ||
      c.slug?.toLowerCase().includes('random-key') ||
      c.name?.toLowerCase() === 'random keys'
    );
  }, [categoriesData]);

  return (
    <ProductListingLayout
      lockedCategoryId={randomKeysCategory?._id}
      pageTitle="Random Keys"
    />
  );
};

export default RandomKeys;
