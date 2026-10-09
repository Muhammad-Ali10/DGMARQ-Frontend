import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { legalAPI } from '@services/api';
import { mergeFigures } from './figures';

const STALE_TIME_MS = 10 * 60 * 1000;

export function useLegalFigures() {
  const { data, isPending } = useQuery({
    queryKey: ['legal-figures'],
    queryFn: () => legalAPI.getFigures().then((res) => res.data.data),
    staleTime: STALE_TIME_MS,
    gcTime: STALE_TIME_MS * 3,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const figures = useMemo(() => mergeFigures(data), [data]);
  const status = data ? 'live' : isPending ? 'loading' : 'fallback';
  return { figures, status };
}
