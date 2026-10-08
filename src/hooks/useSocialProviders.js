import { useQuery } from '@tanstack/react-query';
import { authAPI } from '@services/api';
import { SOCIAL_PROVIDER_IDS } from '@lib/socialAuth';

export const SOCIAL_PROVIDERS_QUERY_KEY = ['auth-providers'];

export const useSocialProviders = () => {
  const { data, isError } = useQuery({
    queryKey: SOCIAL_PROVIDERS_QUERY_KEY,
    queryFn: () => authAPI.getSocialProviders().then((r) => r.data?.data ?? []),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  if (isError) return SOCIAL_PROVIDER_IDS;
  return SOCIAL_PROVIDER_IDS.filter((id) => data?.includes(id));
};

export default useSocialProviders;
