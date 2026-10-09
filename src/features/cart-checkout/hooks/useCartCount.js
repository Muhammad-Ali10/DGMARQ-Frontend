import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { cartAPI } from '@services/api';
import { getGuestCartCount } from '../utils/guestCart';

export const useCartCount = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const { data: count } = useQuery({
    queryKey: ['cart', 'count'],
    queryFn: () => cartAPI.getCount().then((r) => r.data.data?.count ?? 0),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const [guestCount, setGuestCount] = useState(getGuestCartCount);

  useEffect(() => {
    if (isAuthenticated) return undefined;
    const sync = () => setGuestCount(getGuestCartCount());
    sync();
    window.addEventListener('guestCartChange', sync);
    return () => window.removeEventListener('guestCartChange', sync);
  }, [isAuthenticated]);

  return isAuthenticated ? count || 0 : guestCount;
};

export default useCartCount;
