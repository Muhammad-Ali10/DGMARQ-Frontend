import { useMemo } from 'react';
import { ProductListingLayout, useActiveCategories } from '@features/catalog';
import { useSEO } from '@hooks/useSEO';

const Software = () => {
  useSEO({
    title: 'Software | DGMARQ',
    description: 'Browse software products on DGMARQ marketplace. Find great deals with instant delivery.',
    canonical: '/software',
    useDefaults: false,
  });

  const { data: categoriesData } = useActiveCategories(['categories', 'Software']);

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
