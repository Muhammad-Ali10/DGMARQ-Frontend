import { useQuery } from '@tanstack/react-query';
import { authAPI } from '@services/api';

export const ME_QUERY_KEY = ['me'];

export const fetchMe = () => authAPI.getProfile().then((r) => r.data.data ?? null);

export const useMe = (options = {}) =>
  useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    staleTime: 300000,
    retry: false,
    ...options,
  });

export default useMe;
