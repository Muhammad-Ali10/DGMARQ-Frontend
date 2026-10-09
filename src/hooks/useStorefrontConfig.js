import { useQuery } from '@tanstack/react-query';
import { storefrontAPI } from '@services/api';

export const STOREFRONT_CONFIG_KEY = ['storefront-config'];

const fetchStorefrontConfig = () => storefrontAPI.getConfig().then((r) => r.data.data || {});

export const useStorefrontConfig = (select) =>
  useQuery({
    queryKey: STOREFRONT_CONFIG_KEY,
    queryFn: fetchStorefrontConfig,
    staleTime: 300000,
    select,
  });

export default useStorefrontConfig;
