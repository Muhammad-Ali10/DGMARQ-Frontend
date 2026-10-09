import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '@store/slices/authSlice';
import { Loading } from '@components/ui/loading';
import { ErrorState } from '@components/common/ErrorState';
import { useMe } from '@hooks/useMe';
import { endSession } from '@lib/session';
import { showApiError } from '@utils/toast';

const SESSION_REJECTED = [401, 403];

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, roles } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  const { data, isPending: isVerifyingToken, isError, error, refetch, isFetching } = useMe({ enabled: isAuthenticated });

  const serverUser = data ?? null;
  const sessionRejected = isError && !serverUser && SESSION_REJECTED.includes(error?.response?.status);

  useEffect(() => {
    if (serverUser) dispatch(updateUser(serverUser));
  }, [serverUser, dispatch]);

  useEffect(() => {
    if (!sessionRejected) return;
    if (error?.response?.status === 403) showApiError(error, 'Your account has been suspended.');
    endSession();
  }, [sessionRejected, error]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (isVerifyingToken) {
    return <Loading message="Checking session..." />;
  }

  if (sessionRejected) {
    return <Navigate to="/login" replace />;
  }

  if (isError && !serverUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <ErrorState
          error={error}
          title="We couldn't confirm your session"
          onRetry={isFetching ? undefined : () => refetch()}
        />
      </div>
    );
  }

  if (allowedRoles.length > 0) {
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
