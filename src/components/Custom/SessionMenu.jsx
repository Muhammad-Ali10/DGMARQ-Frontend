import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';
import { Button } from '../ui/button';
import { User, LogIn, UserPlus, LogOut, LayoutDashboard, ShoppingBag, Key, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const SessionMenu = ({ onItemClick } = {}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const { isAuthenticated, user, roles } = useSelector((state) => state.auth);
  
  const getDashboardRoute = () => {
    const normalizedRoles = Array.isArray(roles) && roles.length > 0
      ? roles.map(r => String(r).toLowerCase())
      : [];
    
    if (normalizedRoles.includes('admin')) {
      return '/admin/dashboard';
    } else if (normalizedRoles.includes('seller')) {
      return '/seller/dashboard';
    } else {
      return '/user/dashboard';
    }
  };

  const handleItemClick = (callback) => {
    setIsOpen(false);
    if (onItemClick) onItemClick();
    if (callback) callback();
  };

  const logoutMutation = useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      dispatch(logout());
      queryClient.clear();
      setIsOpen(false);
      navigate('/');
    },
    onError: () => {
      dispatch(logout());
      queryClient.clear();
      setIsOpen(false);
      navigate('/');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleGoogleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const baseUrl = apiBaseUrl.replace('/api/v1', '');
    window.location.href = `${baseUrl}/api/v1/user/auth/google`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const getUserDisplay = () => {
    if (user?.profileImage) {
      return (
        <img
          src={user.profileImage}
          alt={user.name || 'User'}
          className="w-8 h-8 rounded-full object-cover border-2 border-accent/50"
        />
      );
    }
    
    const initials = user?.name
      ? user.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U';

    return (
      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-semibold border-2 border-accent/50">
        {initials}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Button - Shows Register for logged-out, Avatar for logged-in */}
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "border-accent text-white hover:bg-accent/10 rounded-lg transition-colors",
          isAuthenticated && "p-1.5"
        )}
      >
        {isAuthenticated ? (
          getUserDisplay()
        ) : (
          <>
            <User className="h-4 w-4 mr-2" />
            Register
          </>
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-2 w-64 bg-[#041536] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
        >
          {!isAuthenticated ? (
            <div className="py-2">
              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                <span className="font-medium">Continue with Google</span>
              </button>

              <div className="border-t border-gray-700 my-1"></div>

              {/* Login Button */}
              <button
                onClick={() => handleItemClick(() => navigate('/login'))}
                className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
              >
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </button>

              {/* Register Button */}
              <button
                onClick={() => handleItemClick(() => navigate('/register'))}
                className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
              >
                <UserPlus className="w-5 h-5" />
                <span>Register</span>
              </button>

              {/* Info Link */}
              <button
                onClick={() => handleItemClick(() => navigate('/about'))}
                className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-gray-400 hover:text-white"
              >
                <Info className="w-5 h-5" />
                <span>About / Info</span>
              </button>
            </div>
          ) : (
            <div className="py-2">
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  {getUserDisplay()}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{user?.name || 'User'}</p>
                    <p className="text-gray-400 text-sm truncate">{user?.email || ''}</p>
                  </div>
                </div>
              </div>

              {/* Dashboard Links - Show all relevant dashboards */}
              {(() => {
                const normalizedRoles = Array.isArray(roles) && roles.length > 0
                  ? roles.map(r => String(r).toLowerCase().trim())
                  : [];
                const hasAdmin = normalizedRoles.includes('admin');
                const hasSeller = normalizedRoles.includes('seller');
                const hasCustomer = normalizedRoles.includes('customer');
                if (hasAdmin || hasSeller) {
                  return (
                    <>
                      {hasAdmin && (
                        <button
                          onClick={() => handleItemClick(() => navigate('/admin/dashboard'))}
                          className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
                        >
                          <LayoutDashboard className="w-5 h-5" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}
                      {hasSeller && (
                        <button
                          onClick={() => handleItemClick(() => navigate('/seller/dashboard'))}
                          className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
                        >
                          <LayoutDashboard className="w-5 h-5" />
                          <span>Seller Dashboard</span>
                        </button>
                      )}
                      {/* Always show customer dashboard for sellers and admins (they can shop too) */}
                      {(hasSeller || hasAdmin) && (
                        <button
                          onClick={() => handleItemClick(() => navigate('/user/dashboard'))}
                          className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
                        >
                          <LayoutDashboard className="w-5 h-5" />
                          <span>Customer Dashboard</span>
                        </button>
                      )}
                    </>
                  );
                }
                return (
                  <button
                    onClick={() => handleItemClick(() => navigate(getDashboardRoute()))}
                    className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>
                );
              })()}

              {/* Orders Link - Only show for customers (sellers have their own orders page) */}
              {!roles?.some(r => String(r).toLowerCase() === 'seller') && (
                <>
                  <button
                    onClick={() => handleItemClick(() => navigate('/user/orders'))}
                    className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Orders</span>
                  </button>

                  {/* License Keys Link - Only for customers */}
                  <button
                    onClick={() => handleItemClick(() => navigate('/user/license-keys'))}
                    className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
                  >
                    <Key className="w-5 h-5" />
                    <span>License Keys</span>
                  </button>
                </>
              )}

              <div className="border-t border-gray-700 my-1"></div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="w-full px-4 py-3 text-left hover:bg-red-500/10 transition-colors flex items-center gap-3 text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
                <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionMenu;

