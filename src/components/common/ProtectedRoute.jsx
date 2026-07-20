import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import api from '@lib/axios';
import { updateUser } from '@store/slices/authSlice';
import { Loading } from '@components/ui/loading';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // SECURITY FIX (#5): there is no client-readable token anymore. Auth is the
  // httpOnly cookie; the SERVER is the source of truth. We gate on the cached
  // isAuthenticated flag for UX, then confirm the session by calling the API
  // (the cookie authenticates it). A failed verification forces logout.
  const { isAuthenticated, roles } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const { data, isPending: isVerifyingToken, isError } = useQuery({
    queryKey: ['verify-token'],
    queryFn: () => api.get('/user/profile'),
    enabled: isAuthenticated,
    staleTime: 300000, // 5 minutes
    retry: false,
    meta: { skipErrorToast: true },
  });

  // F31: the cached profile (and therefore `roles`) is hydrated from
  // localStorage, which the user can edit. This request already proves the
  // session — reconcile the cached profile with what the SERVER says rather
  // than throwing the response away, so every consumer of `state.auth.roles`
  // sees the authoritative value.
  const serverUser = data?.data?.data ?? null;

  useEffect(() => {
    if (serverUser) dispatch(updateUser(serverUser));
  }, [serverUser, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Prevent UI flicker while the session is being validated server-side.
  if (isVerifyingToken) {
    return <Loading message="Checking session..." />;
  }

  // Server rejected the cookie (expired/invalid) → send to login.
  if (isError) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    // Gate on the server's roles. `roles` (localStorage-backed) is only a
    // fallback for the theoretical case of a resolved query with no body — by
    // this line the verification has already succeeded.
    const authoritativeRoles = Array.isArray(serverUser?.roles)
      ? serverUser.roles
      : serverUser?.role
        ? [serverUser.role]
        : roles;
    const normalizedRoles = Array.isArray(authoritativeRoles) && authoritativeRoles.length > 0
      ? authoritativeRoles.map(r => String(r).toLowerCase())
      : [];
    const normalizedAllowedRoles = allowedRoles.map(r => String(r).toLowerCase());
    if (normalizedRoles.includes('admin')) {
      if (!normalizedAllowedRoles.includes('admin')) {
        return <Navigate to="/admin/dashboard" replace />;
      }
    } else if (normalizedRoles.includes('seller')) {
      const explicitAccess = sessionStorage.getItem('allowCustomerAccess') === 'true';
      if (normalizedAllowedRoles.includes('customer') && !normalizedAllowedRoles.includes('seller') && !explicitAccess) {
        return <Navigate to="/seller/dashboard" replace />;
      }
      if (normalizedAllowedRoles.includes('seller') && !normalizedRoles.includes('seller')) {
        return <Navigate to="/seller/dashboard" replace />;
      }
    }

    const hasAllowedRole = normalizedAllowedRoles.some(role => normalizedRoles.includes(role));
    if (!hasAllowedRole) {
      if (normalizedRoles.includes('admin')) {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (normalizedRoles.includes('seller')) {
        return <Navigate to="/seller/dashboard" replace />;
      } else {
        return <Navigate to="/user/dashboard" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
