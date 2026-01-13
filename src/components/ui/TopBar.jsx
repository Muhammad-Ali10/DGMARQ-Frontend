import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';
import { User, LogOut, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import ChatNotifications from '../chat/ChatNotifications';

const AvatarDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      dispatch(logout());
      queryClient.clear();
      setIsOpen(false);
      navigate('/');
    },
    onError: (err) => {
      console.error('Logout failed:', err);
      // Even if backend logout fails, clear frontend state for UX
      dispatch(logout());
      queryClient.clear();
      setIsOpen(false);
      navigate('/');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userName = user?.name || user?.username || 'User';
  const userAvatar = user?.profileImage || user?.avatar || null;
  const initials = getInitials(userName);

  // Determine profile route based on user role (priority: admin > seller > customer)
  const getProfileRoute = () => {
    const roles = user?.roles || [];
    const normalizedRoles = Array.isArray(roles) ? roles.map(r => String(r).toLowerCase()) : [];
    
    if (normalizedRoles.includes('admin')) {
      return '/admin/settings'; // Admin settings page
    } else if (normalizedRoles.includes('seller')) {
      return '/seller/profile';
    } else {
      return '/user/profile';
    }
  };

  // Determine dashboard route based on user role (priority: admin > seller > customer)
  const getDashboardRoute = () => {
    const roles = user?.roles || [];
    const normalizedRoles = Array.isArray(roles) ? roles.map(r => String(r).toLowerCase()) : [];
    
    if (normalizedRoles.includes('admin')) {
      return '/admin/dashboard';
    } else if (normalizedRoles.includes('seller')) {
      return '/seller/dashboard';
    } else {
      return '/user/dashboard';
    }
  };

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        ref={avatarRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="User menu"
      >
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userName}
            className="w-10 h-10 rounded-full object-cover border-2 border-accent/30"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent/30">
            <span className="text-accent font-semibold text-sm">{initials}</span>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute right-0 mt-2 w-64 bg-[#041536] border border-gray-700 rounded-lg shadow-xl z-50',
            'transition-all duration-200 ease-out'
          )}
        >
          <div className="p-4 border-b border-gray-700">
            <p className="text-white font-semibold text-sm truncate">{userName}</p>
            <p className="text-gray-400 text-xs truncate mt-1">{user?.email}</p>
          </div>
          
          <div className="p-2">
            <button
              onClick={() => {
                navigate(getDashboardRoute());
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-md transition-colors"
            >
              <User className="w-4 h-4" />
              Dashboard
            </button>
            
            <button
              onClick={() => {
                navigate(getProfileRoute());
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4" />
              Profile / Settings
            </button>
            
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition-colors mt-1"
            >
              <LogOut className="w-4 h-4" />
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TopBar = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="h-16 bg-secondary border-b border-border flex items-center justify-end px-6 gap-4">
      {/* Right: Chat Notifications and User Avatar */}
      <div className="flex items-center gap-3">
        <ChatNotifications />
        <AvatarDropdown user={user} />
      </div>
    </header>
  );
};

export default TopBar;

