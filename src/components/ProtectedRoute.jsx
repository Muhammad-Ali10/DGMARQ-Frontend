import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import api from '../lib/axios';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, roles, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const verifyToken = async () => {
      if (token && isAuthenticated) {
        try {
          await api.get('/user/profile');
        } catch (error) {
        }
      }
    };
    verifyToken();
  }, [token, isAuthenticated]);

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

