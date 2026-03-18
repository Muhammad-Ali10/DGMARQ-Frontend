import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, roles, token } = useSelector((state) => state.auth);

  // Verify token validity — cached for 5 min instead of firing on every mount
  useQuery({
    queryKey: ['verify-token', token],
    queryFn: () => api.get('/user/profile'),
    enabled: !!token && isAuthenticated,
    staleTime: 300000, // 5 minutes
    retry: false,
    meta: { skipErrorToast: true },
  });

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    const normalizedRoles = Array.isArray(roles) && roles.length > 0
      ? roles.map(r => String(r).toLowerCase())
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
