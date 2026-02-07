import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryAPI } from '../../services/api';
import ProductListingLayout from '../../components/ProductListing/ProductListingLayout';

const Software = () => {
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'Software'],
    queryFn: async () => {
      const response = await categoryAPI.getCategories({ isActive: true, limit: 100 });
      return response.data.data;
    },
  });

  const softwareCategory = useMemo(() => {
    if (!categoriesData?.docs) return null;
    return categoriesData.docs.find((c) =>
      c.name?.toLowerCase().includes('software') ||
      c.slug?.toLowerCase().includes('software') ||
      c.name?.toLowerCase() === 'software'
    );
  }, [categoriesData]);

  return (
    <ProductListingLayout
      lockedCategoryId={softwareCategory?._id}
      pageTitle="Software"
    />
  );
};

export default Software;
