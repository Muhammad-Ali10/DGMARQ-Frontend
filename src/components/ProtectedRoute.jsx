import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import api from '../lib/axios';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, roles, token } = useSelector((state) => state.auth);

  // Verify token on mount if we have one
  useEffect(() => {
    const verifyToken = async () => {
      if (token && isAuthenticated) {
        try {
          // Make a lightweight request to verify token
          await api.get('/user/profile');
        } catch (error) {
          // Token invalid, will be handled by axios interceptor
          console.error('Token verification failed:', error);
        }
      }
    };
    verifyToken();
  }, [token, isAuthenticated]);

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has at least one of the allowed roles
  if (allowedRoles.length > 0) {
    // Normalize roles to lowercase for comparison
    // Safety check: ensure roles is an array
    const normalizedRoles = Array.isArray(roles) && roles.length > 0
      ? roles.map(r => String(r).toLowerCase())
      : [];
    const normalizedAllowedRoles = allowedRoles.map(r => String(r).toLowerCase());
    
    // CRITICAL: Role priority check - sellers should NOT access customer-only routes
    // Even if seller has 'customer' role, they should use seller dashboard
    // Priority: admin > seller > customer
    if (normalizedRoles.includes('admin')) {
      // Admin should only access admin routes
      if (!normalizedAllowedRoles.includes('admin')) {
        return <Navigate to="/admin/dashboard" replace />;
      }
    } else if (normalizedRoles.includes('seller')) {
      // Check if seller has explicit permission to access customer routes
      const explicitAccess = sessionStorage.getItem('allowCustomerAccess') === 'true';
      
      // Seller should NOT access customer-only routes (even if they have customer role)
      // UNLESS they explicitly navigated here using the switch button
      if (normalizedAllowedRoles.includes('customer') && !normalizedAllowedRoles.includes('seller') && !explicitAccess) {
        // Trying to access customer route but is a seller - redirect to seller dashboard
        return <Navigate to="/seller/dashboard" replace />;
      }
      // If seller route is allowed, check if they have seller role
      if (normalizedAllowedRoles.includes('seller') && !normalizedRoles.includes('seller')) {
        return <Navigate to="/seller/dashboard" replace />;
      }
    }
    
    const hasAllowedRole = normalizedAllowedRoles.some(role => normalizedRoles.includes(role));
    
    if (!hasAllowedRole) {
      // User doesn't have required role for this route
      // Redirect to their appropriate dashboard based on roles (priority: admin > seller > customer)
      if (normalizedRoles.includes('admin')) {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (normalizedRoles.includes('seller')) {
        return <Navigate to="/seller/dashboard" replace />;
      } else {
        // Regular customer - redirect to user dashboard
        return <Navigate to="/user/dashboard" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;

