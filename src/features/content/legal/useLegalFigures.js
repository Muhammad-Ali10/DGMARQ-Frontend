import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { legalAPI } from '@services/api';
import { mergeFigures } from './figures';

// These change a couple of times a year and the endpoint is already cached for 5
// minutes server-side, so a legal page should not re-ask on every mount or focus.
const STALE_TIME_MS = 10 * 60 * 1000;

/**
 * The live figures the legal documents quote, falling back to the values each
 * document was drafted with while loading or if the request fails — a policy page
 * must always show a number, never a gap.
 */
export function useLegalFigures() {
  const { data } = useQuery({
    queryKey: ['legal-figures'],
    queryFn: () => legalAPI.getFigures().then((res) => res.data.data),
    staleTime: STALE_TIME_MS,
    gcTime: STALE_TIME_MS * 3,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return useMemo(() => mergeFigures(data), [data]);
}
