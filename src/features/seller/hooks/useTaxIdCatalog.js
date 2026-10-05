import { useQuery } from '@tanstack/react-query';
import { sellerAPI } from '@services/api';
import { compileTaxIdCatalog } from '../utils/kyc';

// Tax-ID types per country / seller type. Static reference data, so it is
// fetched once per session and never refetched.
export const useTaxIdCatalog = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['tax-id-catalog'],
    queryFn: async () => (await sellerAPI.getTaxIdTypes()).data.data,
    select: compileTaxIdCatalog,
    staleTime: Infinity,
    gcTime: Infinity,
    enabled,
  });
